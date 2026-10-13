import {
  convertAmount,
  calculateTotal,
  filterByCategory,
  withConvertedAmounts,
  totalsByCategory,
  validateExpense,
  createExpense,
  formatMoney,
} from '../src/utils.js';

// Rates relative to a USD base, shaped like the open.er-api.com response.
const rates = { USD: 1, EUR: 0.9, GBP: 0.8, KES: 130 };

const expenses = [
  { id: '1', description: 'Lunch', amount: 10, currency: 'USD', category: 'Food' },
  { id: '2', description: 'Taxi', amount: 1300, currency: 'KES', category: 'Transport' },
  { id: '3', description: 'Shoes', amount: 45, currency: 'EUR', category: 'Shopping' },
  { id: '4', description: 'Dinner', amount: 8, currency: 'GBP', category: 'Food' },
];

describe('convertAmount', () => {
  test('converts from the base currency to another currency', () => {
    expect(convertAmount(10, 'USD', 'KES', rates)).toBeCloseTo(1300);
  });

  test('converts between two non-base currencies via the base', () => {
    // 45 EUR -> 50 USD -> 40 GBP
    expect(convertAmount(45, 'EUR', 'GBP', rates)).toBeCloseTo(40);
  });

  test('returns the same amount when currencies match, even without rates', () => {
    expect(convertAmount(25, 'KES', 'KES', null)).toBe(25);
  });

  test('handles zero amounts', () => {
    expect(convertAmount(0, 'USD', 'EUR', rates)).toBe(0);
  });

  test('returns null when a rate is missing or invalid', () => {
    expect(convertAmount(10, 'USD', 'XYZ', rates)).toBeNull();
    expect(convertAmount(10, 'USD', 'EUR', { USD: 1, EUR: 0 })).toBeNull();
    expect(convertAmount(10, 'USD', 'EUR', null)).toBeNull();
  });

  test('returns null for non-numeric amounts', () => {
    expect(convertAmount('abc', 'USD', 'EUR', rates)).toBeNull();
  });
});

describe('calculateTotal', () => {
  test('sums all expenses converted into the home currency', () => {
    // 10 + 10 + 50 + 10 USD
    const { total, skipped } = calculateTotal(expenses, 'USD', rates);
    expect(total).toBeCloseTo(80);
    expect(skipped).toBe(0);
  });

  test('returns zero for an empty list', () => {
    expect(calculateTotal([], 'USD', rates)).toEqual({ total: 0, skipped: 0 });
  });

  test('skips and counts expenses whose rate is missing', () => {
    const withUnknown = [...expenses, { id: '5', amount: 99, currency: 'XYZ', category: 'Other' }];
    const { total, skipped } = calculateTotal(withUnknown, 'USD', rates);
    expect(total).toBeCloseTo(80);
    expect(skipped).toBe(1);
  });
});

describe('filterByCategory', () => {
  test('returns only expenses in the chosen category', () => {
    const food = filterByCategory(expenses, 'Food');
    expect(food.map((e) => e.id)).toEqual(['1', '4']);
  });

  test('returns everything for "All" and does not mutate the input', () => {
    const copy = [...expenses];
    expect(filterByCategory(expenses, 'All')).toHaveLength(4);
    expect(expenses).toEqual(copy);
  });

  test('returns an empty array when nothing matches', () => {
    expect(filterByCategory(expenses, 'Bills')).toEqual([]);
  });
});

describe('withConvertedAmounts and totalsByCategory', () => {
  test('adds converted values without mutating the originals', () => {
    const result = withConvertedAmounts(expenses, 'KES', rates);
    expect(result[0].converted).toBeCloseTo(1300);
    expect(expenses[0]).not.toHaveProperty('converted');
  });

  test('groups totals per category', () => {
    const totals = totalsByCategory(expenses, 'USD', rates);
    expect(totals.Food).toBeCloseTo(20);
    expect(totals.Transport).toBeCloseTo(10);
    expect(totals.Shopping).toBeCloseTo(50);
  });
});

describe('validateExpense and createExpense', () => {
  test('rejects empty description and non-positive amounts', () => {
    const { valid, errors } = validateExpense({ description: '  ', amount: '0', currency: 'USD', category: 'Food' });
    expect(valid).toBe(false);
    expect(errors).toHaveProperty('description');
    expect(errors).toHaveProperty('amount');
  });

  test('accepts valid input and builds a trimmed, rounded expense', () => {
    const input = { description: ' Coffee ', amount: '3.456', currency: 'EUR', category: 'Food' };
    expect(validateExpense(input).valid).toBe(true);
    const expense = createExpense(input, 'abc');
    expect(expense).toMatchObject({ id: 'abc', description: 'Coffee', amount: 3.46, currency: 'EUR' });
  });
});

describe('formatMoney', () => {
  test('formats with currency code and two decimals', () => {
    expect(formatMoney(1250, 'KES')).toMatch(/KES\s?1,250\.00/);
  });

  test('uses the currency\'s own decimal places (JPY has none)', () => {
    expect(formatMoney(1500.4, 'JPY')).toMatch(/JPY\s?1,500$/);
  });

  test('shows a dash when the value is unavailable', () => {
    expect(formatMoney(null, 'USD')).toBe('—');
  });
});