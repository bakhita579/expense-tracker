/**
 * REST layer: fetches live exchange rates from open.er-api.com.
 * Docs: https://www.exchangerate-api.com/docs/free
 */

const API_BASE = 'https://open.er-api.com/v6/latest';
const CACHE_KEY = 'expense-tracker:rates';
const TIMEOUT_MS = 10000;

export class RatesError extends Error {
  constructor(message, cause) {
    super(message);
    this.name = 'RatesError';
    this.cause = cause;
  }
}

/**
 * Fetch the latest rates with `baseCurrency` as the base.
 * Resolves to { base, rates, updatedAt, fromCache }.
 * Throws RatesError on network failures, HTTP errors, timeouts or an
 * API-level error payload ({ result: "error" }).
 */
export async function fetchRates(baseCurrency = 'USD', { fetchImpl = fetch } = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const response = await fetchImpl(`${API_BASE}/${encodeURIComponent(baseCurrency)}`, {
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new RatesError(`Exchange rate service responded with HTTP ${response.status}.`);
    }

    const data = await response.json();

    if (data.result !== 'success' || !data.rates) {
      const reason = data['error-type'] ? ` (${data['error-type']})` : '';
      throw new RatesError(`Exchange rate service returned an error${reason}.`);
    }

    const payload = {
      base: data.base_code,
      rates: data.rates,
      updatedAt: data.time_last_update_utc,
      fromCache: false,
    };
    saveToCache(payload);
    return payload;
  } catch (error) {
    if (error instanceof RatesError) throw error;
    if (error.name === 'AbortError') {
      throw new RatesError('The exchange rate request timed out.', error);
    }
    throw new RatesError('Could not reach the exchange rate service. Check your connection.', error);
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Last successfully fetched rates, used as a fallback when offline.
 * Any base works for conversion because convertAmount only needs
 * a table where every currency is relative to the same base.
 */
export function loadCachedRates() {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const cached = JSON.parse(raw);
    return cached && cached.rates ? { ...cached, fromCache: true } : null;
  } catch {
    return null;
  }
}

function saveToCache(payload) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(payload));
  } catch {
    // Storage full or blocked (private mode) — caching is optional.
  }
}