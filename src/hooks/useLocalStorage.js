import { useCallback, useMemo, useState, useSyncExternalStore } from 'react';

/*
 * A tiny localStorage store shared by every hook instance, so two components using the same key
 * stay in sync (and other tabs too, through the `storage` event). When storage is unavailable
 * (private mode, quota, blocked cookies) values live in memory for the session instead.
 */
const listeners = new Set();
const memoryFallback = new Map();

function notify() {
  listeners.forEach((listener) => listener());
}

function subscribe(listener) {
  listeners.add(listener);
  window.addEventListener('storage', listener);
  return () => {
    listeners.delete(listener);
    window.removeEventListener('storage', listener);
  };
}

function readRaw(key) {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return memoryFallback.has(key) ? memoryFallback.get(key) : null;
  }
}

function writeRaw(key, raw) {
  try {
    if (raw === null) window.localStorage.removeItem(key);
    else window.localStorage.setItem(key, raw);
  } catch {
    if (raw === null) memoryFallback.delete(key);
    else memoryFallback.set(key, raw);
  }
  notify();
}

function parse(raw, fallback) {
  if (raw === null || raw === undefined) return fallback;
  try {
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

/**
 * Persist a JSON-serialisable value in localStorage.
 *
 * @template T
 * @param {string} key
 * @param {T | (() => T)} initialValue Used when nothing is stored (or the stored value is unreadable).
 * @returns {[T, (next: T | ((current: T) => T)) => void, () => void]} value, setValue, remove
 */
export default function useLocalStorage(key, initialValue) {
  const [fallback] = useState(initialValue);
  const raw = useSyncExternalStore(
    subscribe,
    () => readRaw(key),
    () => null,
  );

  const value = useMemo(() => parse(raw, fallback), [raw, fallback]);

  const setValue = useCallback(
    (next) => {
      const current = parse(readRaw(key), fallback);
      const resolved = typeof next === 'function' ? next(current) : next;
      writeRaw(key, resolved === undefined ? null : JSON.stringify(resolved));
    },
    [key, fallback],
  );

  const remove = useCallback(() => writeRaw(key, null), [key]);

  return [value, setValue, remove];
}
