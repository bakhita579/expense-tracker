/**
 * Exchange rate API access.
 *
 * This module deliberately does NOT swallow failures. If the fetch fails it
 * throws, so main.js can put the app into a visible error state. Returning
 * invented fallback rates would be worse than an error: the user would see
 * confidently wrong totals with no hint anything went wrong.
 *
 * API: https://open.er-api.com — free, no key required.
 */

const ENDPOINT = 'https://open.er-api.com/v6/latest';
const CACHE_KEY = 'expense-tracker:rates';

/**
 * Fetch live rates based on the given currency.
 * @param {string} base e.g. 'KES'
 * @returns {Promise<{rates: object, base: string, updatedAt: string, fromCache: boolean}>}
 * @throws {Error} on network failure, non-2xx status, or an unusable payload.
 */
export async function fetchRates(base = 'USD') {
  let response;

  try {
    response = await fetch(`${ENDPOINT}/${encodeURIComponent(base)}`);
  } catch {
    // fetch() only rejects on network-level problems (offline, DNS, CORS).
    throw new Error('Could not reach the exchange rate service. Check your connection.');
  }

  if (!response.ok) {
    throw new Error(`Exchange rate service returned ${response.status} ${response.statusText}.`);
  }

  const data = await response.json();

  if (data.result === 'error') {
    throw new Error(`Exchange rate service error: ${data['error-type'] || 'unknown'}.`);
  }

  if (!data.rates || typeof data.rates !== 'object') {
    throw new Error('Exchange rate service returned an unexpected response.');
  }

  const payload = {
    rates: data.rates,
    base: data.base_code || base,
    updatedAt: data.time_last_update_utc || new Date().toUTCString(),
    fromCache: false,
  };

  cacheRates(payload);
  return payload;
}

/** Store the last good rates so a later failure still has something to show. */
export function cacheRates(payload) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(payload));
  } catch {
    // localStorage unavailable (private mode, quota) — caching is optional.
  }
}

/**
 * Read the last successfully fetched rates.
 * @returns {{rates: object, base: string, updatedAt: string, fromCache: true}|null}
 */
export function loadCachedRates() {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;

    const saved = JSON.parse(raw);
    if (!saved || !saved.rates) return null;

    return { ...saved, fromCache: true };
  } catch {
    return null;
  }
}