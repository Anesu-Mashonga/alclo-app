/**
 * Display formatting helpers. Pure functions, safe to use anywhere in the UI.
 */

/**
 * Celsius to Fahrenheit.
 * @param {number} c
 */
export function cToF(c) {
  return (c * 9) / 5 + 32;
}

/**
 * Formats a temperature stored in Celsius for the user's preferred unit.
 * formatTemp(29) -> "29°C", formatTemp(29, 'F') -> "84°F", formatTemp(29, 'C', { unit: false }) -> "29°".
 * @param {number|null|undefined} c
 * @param {'C'|'F'} [unit]
 * @param {{ unit?: boolean }} [options]
 * @returns {string}
 */
export function formatTemp(c, unit = 'C', options = {}) {
  if (c === null || c === undefined || Number.isNaN(Number(c))) return '--';
  const showUnit = options.unit !== false;
  const value = Math.round(unit === 'F' ? cToF(Number(c)) : Number(c));
  // Avoid "-0°".
  const safe = Object.is(value, -0) ? 0 : value;
  return showUnit ? `${safe}°${unit === 'F' ? 'F' : 'C'}` : `${safe}°`;
}

const currencyCache = new Map();

/**
 * Formats money. Whole amounts drop the cents: 34 -> "$34", 2.5 -> "$2.50".
 * @param {number|null|undefined} amount
 * @param {{ currency?: string, compact?: boolean }} [options]
 * @returns {string}
 */
export function formatCurrency(amount, options = {}) {
  if (amount === null || amount === undefined || Number.isNaN(Number(amount))) return '--';
  const currency = options.currency ?? 'USD';
  const value = Number(amount);
  const whole = Number.isInteger(value);
  const key = `${currency}:${whole}:${options.compact ? 1 : 0}`;
  if (!currencyCache.has(key)) {
    currencyCache.set(
      key,
      new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency,
        notation: options.compact ? 'compact' : 'standard',
        minimumFractionDigits: whole ? 0 : 2,
        maximumFractionDigits: whole ? 0 : 2,
      }),
    );
  }
  return currencyCache.get(key).format(value);
}

/**
 * Picks the singular or plural form for a count (the word only).
 * pluralize(1, 'item') -> "item", pluralize(3, 'item') -> "items", pluralize(2, 'is', 'are') -> "are".
 * @param {number} count
 * @param {string} singular
 * @param {string} [plural]
 */
export function pluralize(count, singular, plural) {
  return Math.abs(count) === 1 ? singular : (plural ?? `${singular}s`);
}

/**
 * Count with the right word: formatCount(3, 'item') -> "3 items", formatCount(1, 'wear') -> "1 wear".
 * Large numbers get thousands separators.
 * @param {number} count
 * @param {string} singular
 * @param {string} [plural]
 */
export function formatCount(count, singular, plural) {
  const n = Number(count) || 0;
  return `${n.toLocaleString('en-US')} ${pluralize(n, singular, plural)}`;
}

/**
 * Formats a 0..1 ratio as a whole percentage: 0.426 -> "43%".
 * @param {number|null|undefined} ratio
 */
export function formatPercent(ratio) {
  if (ratio === null || ratio === undefined || Number.isNaN(Number(ratio))) return '--';
  return `${Math.round(Number(ratio) * 100)}%`;
}

/**
 * Plain number with separators and an optional number of decimals.
 * @param {number} value
 * @param {number} [decimals]
 */
export function formatNumber(value, decimals = 0) {
  if (value === null || value === undefined || Number.isNaN(Number(value))) return '--';
  return Number(value).toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

/**
 * Wind speed for display. Kilometres per hour for Celsius users, miles per hour for Fahrenheit users.
 * @param {number} kph
 * @param {'C'|'F'} [unit]
 */
export function formatWind(kph, unit = 'C') {
  if (kph === null || kph === undefined) return '--';
  return unit === 'F' ? `${Math.round(kph * 0.621371)} mph` : `${Math.round(kph)} km/h`;
}

/**
 * Joins a list as readable English: ["a"] -> "a", ["a","b"] -> "a and b", ["a","b","c"] -> "a, b and c".
 * @param {string[]} parts
 */
export function joinList(parts) {
  const list = (parts ?? []).filter(Boolean);
  if (list.length <= 1) return list.join('');
  return `${list.slice(0, -1).join(', ')} and ${list[list.length - 1]}`;
}

/** Lower-cases the first character, for putting a name mid-sentence. */
export function lowerFirst(text) {
  if (!text) return '';
  return text.charAt(0).toLowerCase() + text.slice(1);
}

/** Upper-cases the first character. */
export function upperFirst(text) {
  if (!text) return '';
  return text.charAt(0).toUpperCase() + text.slice(1);
}

/**
 * Initials from a full name: "Anesu Mashonga" -> "AM".
 * @param {string} name
 */
export function initialsOf(name) {
  const parts = String(name ?? '').trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  const first = parts[0][0] ?? '';
  const last = parts.length > 1 ? parts[parts.length - 1][0] : '';
  return (first + last).toUpperCase();
}
