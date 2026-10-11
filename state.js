/*
 * App state. Every update replaces state with a new object instead of
 * mutating it, then notifies subscribers so the UI can re-render.
 */

const STORAGE_KEY = 'expense-tracker:state';

const initialState = {
  expenses: [],
  homeCurrency: 'KES',
  filterCategory: 'All',
  rates: null,
  ratesUpdatedAt: null,
  ratesFromCache: false,
  status: 'idle', // 'idle' | 'loading' | 'ready' | 'error'
  error: null,
};

let state = { ...initialState, ...loadPersisted() };
const listeners = new Set();

export function getState() {
  return state;
}

export function subscribe(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function setState(patch) {
  state = { ...state, ...patch };
  persist();
  listeners.forEach((listener) => listener(state));
}

// ---- Expenses --------------------------------------------------------------

export function addExpense(expense) {
  // Spread #1: new array with the new expense, the old array is untouched.
  setState({ expenses: [...state.expenses, expense] });
}

export function removeExpense(id) {
  setState({ expenses: state.expenses.filter((expense) => expense.id !== id) });
}

export function updateExpenseCategory(id, category) {
  setState({
    expenses: state.expenses.map((expense) =>
      // Spread #2: copy the expense and override one field.
      expense.id === id ? { ...expense, category } : expense
    ),
  });
}

export function clearExpenses() {
  setState({ expenses: [] });
}

// ---- Settings --------------------------------------------------------------

export function setHomeCurrency(homeCurrency) {
  setState({ homeCurrency });
}

export function setFilterCategory(filterCategory) {
  setState({ filterCategory });
}

// ---- Exchange rates --------------------------------------------------------

export function setRatesLoading() {
  setState({ status: 'loading', error: null });
}

export function setRates({ rates, updatedAt, fromCache = false }) {
  setState({ rates: { ...rates }, ratesUpdatedAt: updatedAt, ratesFromCache: fromCache, status: 'ready', error: null });
}

export function setRatesError(message) {
  setState({ status: 'error', error: message });
}

// ---- Persistence -----------------------------------------------------------

function persist() {
  try {
    const { expenses, homeCurrency, filterCategory } = state;
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ expenses, homeCurrency, filterCategory }));
  } catch {
    // localStorage unavailable — the app still works for this session.
  }
}

function loadPersisted() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const saved = JSON.parse(raw);
    return {
      expenses: Array.isArray(saved.expenses) ? saved.expenses : [],
      ...(saved.homeCurrency && { homeCurrency: saved.homeCurrency }),
      ...(saved.filterCategory && { filterCategory: saved.filterCategory }),
    };
  } catch {
    return {};
  }
}
