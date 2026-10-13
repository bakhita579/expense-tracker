import {
  convert,
  totalIn,
  filterByCategory,
  formatMoney,
  validateExpense,
  createExpense,
} from '../src/utils.js';

// USD-based table, as open.er-api.com returns it.
const rates = { USD: 1, EUR: 0.92, GBP: 0.79, KES: 129.5 };

const expenses = [
  { id: '1', description: 'Lunch', amount: 10, currency: 'USD', category: 'Food' },
  { id: '2', description: 'Taxi', amount: 1295, currency: 'KES', category: 'Transport' },
  { id: '3', description: 'Shoes', amount: 92, currency: 'EUR', category: 'Shopping' },
];

describe('convert', () => {
  it('converts between two currencies using a shared base', () => {
    expect(convert(10, 'USD', 'KES', rates)).toBeCloseTo(1295, 5);
    expect(convert(92, 'EUR', 'GBP', rates)).toBeCloseTo(79, 5);
  });

  it('returns the amount unchanged when the currencies match', () => {
    expect(convert(250, 'KES', 'KES', rates)).toBe(250);
  });

  it('returns null instead of guessing when a rate is missing', () => {
    expect(convert(10, 'JPY', 'KES', rates)).toBeNull();
    expect(convert(10, 'USD', 'JPY', rates)).toBeNull();
    expect(convert(10, 'USD', 'KES', null)).toBeNull();
  });

  it('handles zero and non-numeric amounts', () => {
    expect(convert(0, 'USD', 'KES', rates)).toBe(0);
    expect(convert('abc', 'USD', 'KES', rates)).toBeNull();
  });
});

describe('totalIn', () => {
  it('totals mixed currencies into the home currency', () => {
    // 10 USD + 1295 KES + 92 EUR = 10 + 10 + 100 = 120 USD
    const { total, converted, skipped } = totalIn(expenses, 'USD', rates);
    expect(total).toBeCloseTo(120, 5);
    expect(converted).toBe(3);
    expect(skipped).toBe(0);
  });

  it('skips expenses with no available rate rather than counting them as zero', () => {
    const withUnknown = [...expenses, { id: '4', amount: 500, currency: 'JPY', category: 'Other' }];
    const { total, skipped } = totalIn(withUnknown, 'USD', rates);
    expect(total).toBeCloseTo(120, 5);
    expect(skipped).toBe(1);
  });

  it('returns zero for an empty list', () => {
    expect(totalIn([], 'USD', rates).total).toBe(0);
  });
});

describe('filterByCategory', () => {
  it('returns only the matching category', () => {
    expect(filterByCategory(expenses, 'Food')).toHaveLength(1);
    expect(filterByCategory(expenses, 'Food')[0].description).toBe('Lunch');
  });

  it('returns everything for "All" and an empty array for an unknown category', () => {
    expect(filterByCategory(expenses, 'All')).toHaveLength(3);
    expect(filterByCategory(expenses, 'Groceries')).toHaveLength(0);
  });

  it('does not mutate the original array', () => {
    const copy = [...expenses];
    filterByCategory(expenses, 'Food');
    expect(expenses).toEqual(copy);
  });
});

describe('formatMoney', () => {
  it('formats to two decimal places with the currency', () => {
    expect(formatMoney(1234.5, 'USD')).toMatch(/1,234\.50/);
  });

  it('returns a dash for values that are not numbers', () => {
    expect(formatMoney(undefined, 'USD')).toBe('—');
  });
});

describe('validateExpense', () => {
  it('accepts a complete, valid expense', () => {
    const { valid, errors } = validateExpense({
      description: 'Coffee',
      amount: '4.50',
      currency: 'USD',
      category: 'Food',
    });
    expect(valid).toBe(true);
    expect(errors).toEqual({});
  });

  it('rejects a blank description, a zero amount and bad codes', () => {
    const { valid, errors } = validateExpense({
      description: '   ',
      amount: '0',
      currency: 'XYZ',
      category: 'Nope',
    });
    expect(valid).toBe(false);
    expect(errors.description).toBeDefined();
    expect(errors.amount).toBeDefined();
    expect(errors.currency).toBeDefined();
    expect(errors.category).toBeDefined();
  });
});

describe('createExpense', () => {
  it('builds an expense with an id and a numeric amount', () => {
    const expense = createExpense({
      description: '  Taxi  ',
      amount: '12.5',
      currency: 'KES',
      category: 'Transport',
    });
    expect(expense.id).toBeTruthy();
    expect(expense.description).toBe('Taxi');
    expect(expense.amount).toBe(12.5);
    expect(expense.currency).toBe('KES');
  });
});