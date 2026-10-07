/**
 * Request simulation for the mock backend: latency, random network failures,
 * a typed ApiError and response cloning (so callers can never mutate stored rows).
 */

/** Error thrown by every service. */
export class ApiError extends Error {
  /**
   * @param {number} status HTTP-like status (401, 404, 409, 422, 503...)
   * @param {string} code machine readable code ('validation', 'not_found', 'network'...)
   * @param {string} message friendly, user-facing message
   * @param {Record<string, string>|null} [fieldErrors] per-field messages for forms
   */
  constructor(status, code, message, fieldErrors = null) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.fieldErrors = fieldErrors;
  }
}

/** True for ApiError instances (or look-alikes after structured cloning). */
export function isApiError(error) {
  return error instanceof ApiError || (error && typeof error.status === 'number' && typeof error.code === 'string');
}

export const NETWORK_ERROR_MESSAGE = 'Could not reach Alclo. Check your connection and try again.';

export const DEV_SETTINGS_KEY = 'alclo.dev';
export const DEFAULT_DEV_SETTINGS = { latency: 'normal', failureRate: 0 };

/** Latency presets in milliseconds [min, max]. */
export const LATENCY_PRESETS = {
  instant: [0, 0],
  fast: [120, 250],
  normal: [300, 750],
  slow: [1200, 2200],
};

function storage() {
  try {
    return globalThis.localStorage ?? null;
  } catch {
    return null;
  }
}

/**
 * Current developer settings (latency preset and failure rate 0..1).
 * @returns {{ latency: 'instant'|'fast'|'normal'|'slow', failureRate: number }}
 */
export function readDevSettings() {
  try {
    const raw = storage()?.getItem(DEV_SETTINGS_KEY);
    if (!raw) return { ...DEFAULT_DEV_SETTINGS };
    const parsed = JSON.parse(raw);
    return {
      latency: Object.prototype.hasOwnProperty.call(LATENCY_PRESETS, parsed.latency) ? parsed.latency : DEFAULT_DEV_SETTINGS.latency,
      failureRate: Math.min(1, Math.max(0, Number(parsed.failureRate) || 0)),
    };
  } catch {
    return { ...DEFAULT_DEV_SETTINGS };
  }
}

/**
 * Saves developer settings (merged with the current ones).
 * @param {{ latency?: string, failureRate?: number }} patch
 */
export function writeDevSettings(patch) {
  const next = { ...readDevSettings(), ...patch };
  if (!Object.prototype.hasOwnProperty.call(LATENCY_PRESETS, next.latency)) {
    throw new ApiError(422, 'validation', 'Choose a latency of instant, fast, normal or slow.', {
      latency: 'Choose instant, fast, normal or slow.',
    });
  }
  const rate = Number(next.failureRate);
  if (!Number.isFinite(rate) || rate < 0 || rate > 1) {
    throw new ApiError(422, 'validation', 'Failure rate must be between 0 and 100%.', {
      failureRate: 'Use a value between 0 and 100%.',
    });
  }
  const clean = { latency: next.latency, failureRate: rate };
  try {
    storage()?.setItem(DEV_SETTINGS_KEY, JSON.stringify(clean));
  } catch {
    // Storage can be unavailable (private mode); settings then last for this page only.
  }
  return clean;
}

const wait = (ms) => (ms > 0 ? new Promise((resolve) => setTimeout(resolve, ms)) : Promise.resolve());

function delayFor(preset) {
  const [min, max] = LATENCY_PRESETS[preset] ?? LATENCY_PRESETS.normal;
  return Math.round(min + Math.random() * (max - min));
}

function clone(value) {
  if (value === undefined || value === null) return value;
  return typeof structuredClone === 'function' ? structuredClone(value) : JSON.parse(JSON.stringify(value));
}

/**
 * Runs a backend operation like a network request.
 * Waits for the configured latency, may fail with a 503 network error
 * (probability = failureRate), and returns a deep copy of the result.
 * @template T
 * @param {() => T|Promise<T>} fn
 * @param {{ latency?: 'instant'|'fast'|'normal'|'slow', fail?: boolean }} [options]
 *   `latency` overrides the dev preset; `fail: false` exempts the call from failure injection.
 * @returns {Promise<T>}
 */
export async function simulate(fn, options = {}) {
  const settings = readDevSettings();
  await wait(delayFor(options.latency ?? settings.latency));
  if (options.fail !== false && settings.failureRate > 0 && Math.random() < settings.failureRate) {
    throw new ApiError(503, 'network', NETWORK_ERROR_MESSAGE);
  }
  const result = await fn();
  return clone(result);
}

/**
 * Builds a 422 validation error from a field error map, or returns null if it is empty.
 * The message is the first field error, so a toast can show it on its own.
 * @param {Record<string, string>} fieldErrors
 * @param {string} [message]
 */
export function validationError(fieldErrors, message) {
  const entries = Object.entries(fieldErrors).filter(([, value]) => Boolean(value));
  if (entries.length === 0) return null;
  const errors = Object.fromEntries(entries);
  return new ApiError(422, 'validation', message ?? entries[0][1], errors);
}

/** Throws the validation error when there are field errors. */
export function assertValid(fieldErrors, message) {
  const error = validationError(fieldErrors, message);
  if (error) throw error;
}

/** 404 helper. */
export function notFound(message = 'We could not find that.') {
  return new ApiError(404, 'not_found', message);
}
