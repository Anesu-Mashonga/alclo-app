/**
 * localStorage-backed "database" for the mock backend.
 * All tables live under one versioned key; a version change reseeds.
 * Services read and write through these helpers and always return copies
 * (simulate() clones results), so stored rows are never shared with the UI.
 */
import dayjs from 'dayjs';
import { ApiError } from './client';
import { buildSeedData } from './seed';
import { clearSession, requireUserId, unauthorized } from './session';

export const DB_KEY = 'alclo.db.v1';
export const DB_VERSION = 1;
export const TABLES = ['users', 'items', 'outfits', 'wearLogs', 'plans'];

let state = null;
let seeding = null;

function storage() {
  try {
    return globalThis.localStorage ?? null;
  } catch {
    return null;
  }
}

function load() {
  try {
    const raw = storage()?.getItem(DB_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || parsed.version !== DB_VERSION) return null;
    for (const table of TABLES) if (!Array.isArray(parsed[table])) parsed[table] = [];
    return parsed;
  } catch {
    return null;
  }
}

function persist() {
  if (!state) return;
  try {
    storage()?.setItem(DB_KEY, JSON.stringify(state));
  } catch {
    throw new ApiError(
      507,
      'storage_full',
      'Your browser storage is full. Remove a few item photos and try again.',
    );
  }
}

// Another tab changed the data: drop the in-memory copy so the next call reloads it.
if (typeof window !== 'undefined' && typeof window.addEventListener === 'function') {
  window.addEventListener('storage', (event) => {
    if (event.key === DB_KEY || event.key === null) state = null;
  });
}

/**
 * Loads the database, seeding it on first run (or after a version change).
 * Safe to call many times; concurrent callers share one seeding run.
 * @returns {Promise<void>}
 */
export async function ready() {
  if (state) return;
  const loaded = load();
  // Seed history is dated relative to the day it was generated. If nobody has changed
  // anything since then, regenerate it so the demo never shows a stale wardrobe.
  // Once the data has been edited (touched), it is kept as-is.
  const stale = loaded && !loaded.touched && dayjs().isAfter(dayjs(loaded.seededAt), 'day');
  if (loaded && !stale) {
    state = loaded;
    return;
  }
  if (!seeding) {
    seeding = (async () => {
      const tables = await buildSeedData({ now: new Date() });
      state = { version: DB_VERSION, seededAt: new Date().toISOString(), ...tables };
      persist();
    })().finally(() => {
      seeding = null;
    });
  }
  await seeding;
}

function current() {
  if (!state) {
    state = load();
    if (!state) throw new ApiError(503, 'not_ready', 'Alclo is still loading. Try again in a moment.');
  }
  return state;
}

/**
 * Live rows of a table. Treat as read-only outside of transaction().
 * @param {'users'|'items'|'outfits'|'wearLogs'|'plans'} name
 * @returns {object[]}
 */
export function table(name) {
  return current()[name];
}

/** Finds a row by id. */
export function find(name, id) {
  return table(name).find((row) => row.id === id) ?? null;
}

/** Rows matching a predicate. */
export function where(name, predicate) {
  return table(name).filter(predicate);
}

/** Appends a row (inside a transaction). */
export function insert(name, row) {
  table(name).push(row);
  return row;
}

/**
 * Replaces a row by id with the result of `update(row)` or a merged patch (inside a transaction).
 * @returns {object|null} the new row
 */
export function update(name, id, patchOrFn) {
  const rows = table(name);
  const index = rows.findIndex((row) => row.id === id);
  if (index === -1) return null;
  const next = typeof patchOrFn === 'function' ? patchOrFn(rows[index]) : { ...rows[index], ...patchOrFn };
  rows[index] = next;
  return next;
}

/** Hard-deletes rows matching a predicate (inside a transaction). Returns the removed rows. */
export function removeWhere(name, predicate) {
  const db = current();
  const removed = db[name].filter(predicate);
  db[name] = db[name].filter((row) => !predicate(row));
  return removed;
}

/**
 * Runs synchronous mutations atomically: persists once at the end, or restores
 * the previous state if `fn` throws (including a storage-full error).
 * @template T
 * @param {() => T} fn
 * @returns {T}
 */
export function transaction(fn) {
  const before = JSON.stringify(current());
  try {
    const result = fn();
    current().touched = true;
    persist();
    return result;
  } catch (error) {
    state = JSON.parse(before);
    throw error;
  }
}

/** A user row without secrets. */
export function toPublicUser(user) {
  if (!user) return null;
  const { passwordHash: _hash, salt: _salt, ...rest } = user;
  return rest;
}

/**
 * The signed-in user's row, or throws 401 (and clears a session whose user no longer exists).
 * @returns {object}
 */
export function requireUser() {
  const userId = requireUserId();
  const user = find('users', userId);
  if (!user) {
    clearSession();
    throw unauthorized();
  }
  return user;
}

/**
 * Wipes all data and reseeds from the dummy data files.
 * @returns {Promise<void>}
 */
export async function resetDatabase() {
  try {
    storage()?.removeItem(DB_KEY);
  } catch {
    // Ignore storage errors; the in-memory reset below still applies.
  }
  state = null;
  await ready();
}

/**
 * Everything stored for one user, for "Download my data".
 * @param {string} userId
 */
export function exportUserData(userId) {
  const user = find('users', userId);
  return {
    app: 'Alclo',
    exportedAt: new Date().toISOString(),
    version: DB_VERSION,
    user: toPublicUser(user),
    items: where('items', (row) => row.userId === userId),
    outfits: where('outfits', (row) => row.userId === userId),
    wearLogs: where('wearLogs', (row) => row.userId === userId),
    plans: where('plans', (row) => row.userId === userId),
  };
}

/** Grouped export for convenient `import { db } from './db'`. */
export const db = {
  ready,
  table,
  find,
  where,
  insert,
  update,
  removeWhere,
  transaction,
  requireUser,
  toPublicUser,
  resetDatabase,
  exportUserData,
};
