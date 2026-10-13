/**
 * Entry point: connects state, API and UI.
 */
import { fetchExchangeRates } from './api.js';
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
} from '../state.js';
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
    const heading = document.getElementById('list-heading');
    if (heading) heading.focus();
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

let latestRequest = 0;

async function loadRates() {
  const requestId = ++latestRequest;
  const { homeCurrency } = getState();
  setRatesLoading();

  try {
    // Fixed: changed from fetchRates to fetchExchangeRates to match the import
    const result = await fetchExchangeRates(homeCurrency);
    if (requestId !== latestRequest) return;
    setRates(result);
  } catch (error) {
    if (requestId !== latestRequest) return;
    console.error(error);
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

  if (elements.form) {
    elements.form.addEventListener('submit', handleSubmit);
  }
  if (elements.amount) {
    elements.amount.addEventListener('input', () => renderFormPreview(getState()));
  }
  if (elements.currency) {
    elements.currency.addEventListener('change', () => renderFormPreview(getState()));
  }
  if (elements.filterCategory) {
    elements.filterCategory.addEventListener('change', (e) => setFilterCategory(e.target.value));
  }
  if (elements.clearAll) {
    elements.clearAll.addEventListener('click', () => {
      const { length } = getState().expenses;
      if (window.confirm(`Delete all ${length} expense${length === 1 ? '' : 's'}? This can't be undone.`)) {
        clearExpenses();
        announce('All expenses cleared.');
      }
    });
  }
  if (elements.homeCurrency) {
    elements.homeCurrency.addEventListener('change', (e) => {
      setHomeCurrency(e.target.value);
      loadRates();
    });
  }

  render(getState());
  loadRates();
}
const convertBtn = document.getElementById('convertButton');
  if (convertBtn) {
    convertBtn.addEventListener('click', () => {
      loadRates();
      announce('Exchange rates refreshed.');
    });
  }

init();