/**
 * Entry point: connects state, API and UI.
 */
import { fetchRates, loadCachedRates } from './api.js';
import {
  getState,
  subscribe,
  addExpense,
  removeExpense,
  updateExpenseCategory,
  clearExpenses,
  setHomeCurrency,
  setFilterCategory,
  setRatesLoading,
  setRates,
  setRatesError,
} from './state.js';
import { validateExpense, createExpense } from './utils.js';
import {
  elements,
  populateSelects,
  readForm,
  showFieldErrors,
  resetForm,
  renderFormPreview,
  renderRateStatus,
  renderSummary,
  renderList,
  announce,
} from './ui.js';

const listHandlers = {
  onDelete: (id) => {
    const expense = getState().expenses.find((e) => e.id === id);
    removeExpense(id);
    // The clicked button no longer exists, so put focus somewhere sensible.
    document.getElementById('list-heading').focus();
    if (expense) announce(`Deleted ${expense.description}.`);
  },
  onCategoryChange: (id, category) => {
    updateExpenseCategory(id, category);
    announce(`Moved to ${category}.`);
  },
};

function render(state) {
  renderRateStatus(state, () => loadRates());
  renderSummary(state);
  renderList(state, listHandlers);
  renderFormPreview(state);
}

// Each request gets an id; only the latest one is allowed to update state.
// Prevents a slow response for an old home currency overwriting a newer one.
let latestRequest = 0;

async function loadRates() {
  const requestId = ++latestRequest;
  const { homeCurrency } = getState();
  setRatesLoading();

  try {
    const result = await fetchRates(homeCurrency);
    if (requestId !== latestRequest) return;
    setRates(result);
  } catch (error) {
    if (requestId !== latestRequest) return;
    console.error(error);
    // Fall back to the last good rates so the app keeps working offline.
    if (!getState().rates) {
      const cached = loadCachedRates();
      if (cached) setRates(cached);
    }
    setRatesError(error.message);
  }
}

function handleSubmit(event) {
  event.preventDefault();
  const input = readForm();
  const { valid, errors } = validateExpense(input);
  showFieldErrors(errors);
  if (!valid) return;
  const expense = createExpense(input);
  addExpense(expense);
  resetForm();
  announce(`Added ${expense.description}, ${expense.amount} ${expense.currency}.`);
}

function init() {
  populateSelects(getState());
  subscribe(render);

  elements.form.addEventListener('submit', handleSubmit);
  elements.amount.addEventListener('input', () => renderFormPreview(getState()));
  elements.currency.addEventListener('change', () => renderFormPreview(getState()));
  elements.filterCategory.addEventListener('change', (e) => setFilterCategory(e.target.value));
  elements.clearAll.addEventListener('click', () => {
    const { length } = getState().expenses;
    if (window.confirm(`Delete all ${length} expense${length === 1 ? '' : 's'}? This can't be undone.`)) {
      clearExpenses();
      announce('All expenses cleared.');
    }
  });
  elements.homeCurrency.addEventListener('change', (e) => {
    setHomeCurrency(e.target.value);
    loadRates();
  });

  render(getState());
  loadRates();
}

init();