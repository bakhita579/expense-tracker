/**
 * Pure utility functions: no DOM, no network, no shared state.
 * Everything here is unit-tested in tests/utils.test.js.
 */

export const CURRENCIES = ['USD', 'EUR', 'GBP', 'KES', 'JPY', 'CAD', 'AUD', 'ZAR', 'UGX', 'TZS', 'INR', 'CNY', 'AED'];
export const CATEGORIES = ['Food', 'Transport', 'Shopping', 'Accommodation', 'Entertainment', 'Bills', 'Other'];

/**
 * Convert an amount from one currency to another.
 *
 * `rates` comes from the exchange rate API and is relative to one base
 * currency: rates[X] = how many units of X equal 1 unit of the base.
 * So converting goes amount -> base (divide) -> target (multiply).
 *
 * Returns null when a rate is missing or invalid, so callers can show
 * "rate unavailable" instead of a wrong number.
 */
export function convertAmount(amount, fromCurrency, toCurrency, rates) {
  const value = Number(amount);
  if (!Number.isFinite(value)) return null;
  if (fromCurrency === toCurrency) return value;
  if (!rates) return null;

  const fromRate = rates[fromCurrency];
  const toRate = rates[toCurrency];
  if (!isValidRate(fromRate) || !isValidRate(toRate)) return null;

  return (value / fromRate) * toRate;
}

function isValidRate(rate) {
  return typeof rate === 'number' && Number.isFinite(rate) && rate > 0;
}

/**
 * Attach a `converted` value (in the home currency) to every expense.
 * Returns new objects; the originals are not mutated.
 */
export function withConvertedAmounts(expenses, homeCurrency, rates) {
  return expenses.map((expense) => ({
    ...expense,
    converted: convertAmount(expense.amount, expense.currency, homeCurrency, rates),
  }));
}

/**
 * Sum every expense, converted into the home currency.
 * Expenses whose rate is missing are skipped and counted in `skipped`
 * so the UI can warn that the total is incomplete.
 */
export function calculateTotal(expenses, homeCurrency, rates) {
  return expenses.reduce(
    (acc, expense) => {
      const converted = convertAmount(expense.amount, expense.currency, homeCurrency, rates);
      if (converted === null) {
        return { ...acc, skipped: acc.skipped + 1 };
      }
      return { ...acc, total: acc.total + converted };
    },
    { total: 0, skipped: 0 }
  );
}

/** Return only expenses in the given category. 'All' (or empty) returns everything. */
export function filterByCategory(expenses, category) {
  if (!category || category === 'All') return expenses;
  return expenses.filter((expense) => expense.category === category);
}

/** Total per category in the home currency, e.g. { Food: 42.5, Transport: 10 }. */
export function totalsByCategory(expenses, homeCurrency, rates) {
  return expenses.reduce((acc, expense) => {
    const converted = convertAmount(expense.amount, expense.currency, homeCurrency, rates);
    if (converted === null) return acc;
    return { ...acc, [expense.category]: (acc[expense.category] ?? 0) + converted };
  }, {});
}

/**
 * Format a number as money in the given currency, e.g. "KES 1,250.00".
 * Decimal places follow the currency's own convention (JPY has none).
 */
export function formatMoney(amount, currency) {
  if (amount === null || !Number.isFinite(amount)) return '—';
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      currencyDisplay: 'code',
    }).format(amount);
  } catch {
    return `${currency} ${amount.toFixed(2)}`;
  }
}

/**
 * Validate raw form input. Returns { valid, errors } where errors maps
 * field name -> message.
 */
export function validateExpense({ description, amount, currency, category }) {
  const errors = {};
  if (!description || !description.trim()) errors.description = 'Description is required.';
  const value = Number(amount);
  if (amount === '' || amount === null || amount === undefined || !Number.isFinite(value)) {
    errors.amount = 'Enter a valid number.';
  } else if (value <= 0) {
    errors.amount = 'Amount must be greater than zero.';
  }
  if (!currency) errors.currency = 'Choose a currency.';
  if (!category) errors.category = 'Choose a category.';
  return { valid: Object.keys(errors).length === 0, errors };
}

/** Build a clean expense object from validated form input. */
export function createExpense({ description, amount, currency, category }, id = makeId()) {
  return {
    id,
    description: description.trim(),
    amount: Math.round(Number(amount) * 100) / 100,
    currency,
    category,
    createdAt: new Date().toISOString(),
  };
}

function makeId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
