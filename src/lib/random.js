/**
 * Small, dependency free helpers for deterministic randomness.
 * Everything that needs to be repeatable (seed data, simulated weather,
 * outfit shuffles) goes through these so the same seed gives the same result.
 */

/**
 * Hashes any string into an unsigned 32-bit integer (FNV-1a with a final avalanche).
 * @param {string} input
 * @returns {number}
 */
export function hashString(input) {
  const str = String(input);
  let hash = 0x811c9dc5;
  for (let i = 0; i < str.length; i += 1) {
    hash ^= str.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  hash ^= hash >>> 16;
  hash = Math.imul(hash, 0x85ebca6b);
  hash ^= hash >>> 13;
  hash = Math.imul(hash, 0xc2b2ae35);
  hash ^= hash >>> 16;
  return hash >>> 0;
}

/**
 * Normalises a seed (number or string) into an unsigned 32-bit integer.
 * @param {number|string} seed
 * @returns {number}
 */
export function toSeed(seed) {
  if (typeof seed === 'number' && Number.isFinite(seed)) return Math.abs(Math.floor(seed)) >>> 0;
  return hashString(seed ?? '');
}

/**
 * Mulberry32 PRNG. Returns a function that yields floats in [0, 1).
 * @param {number|string} seed
 * @returns {() => number}
 */
export function mulberry32(seed) {
  let state = toSeed(seed);
  return function next() {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Creates a seeded random helper with convenience methods.
 * @param {number|string} seed
 */
export function createRng(seed) {
  const next = mulberry32(seed);
  const rng = {
    /** Float in [0, 1). */
    next,
    /** Float in [min, max). */
    float(min = 0, max = 1) {
      return min + next() * (max - min);
    },
    /** Integer in [min, max] (inclusive). */
    int(min, max) {
      return Math.floor(min + next() * (max - min + 1));
    },
    /** True with probability p. */
    chance(p) {
      return next() < p;
    },
    /** Roughly normal value (mean 0, sd about 1) using the sum of uniforms. */
    normal() {
      return (next() + next() + next() + next() - 2) * 1.732;
    },
    /** Random element, or undefined for an empty array. */
    pick(list) {
      if (!list || list.length === 0) return undefined;
      return list[Math.floor(next() * list.length)];
    },
    /** Weighted random element. weightOf returns a non-negative number. */
    weightedPick(list, weightOf) {
      if (!list || list.length === 0) return undefined;
      const weights = list.map((entry) => Math.max(0, Number(weightOf(entry)) || 0));
      const total = weights.reduce((sum, w) => sum + w, 0);
      if (total <= 0) return list[Math.floor(next() * list.length)];
      let roll = next() * total;
      for (let i = 0; i < list.length; i += 1) {
        roll -= weights[i];
        if (roll < 0) return list[i];
      }
      return list[list.length - 1];
    },
    /** Returns a shuffled copy (Fisher-Yates). */
    shuffle(list) {
      const copy = [...(list ?? [])];
      for (let i = copy.length - 1; i > 0; i -= 1) {
        const j = Math.floor(next() * (i + 1));
        [copy[i], copy[j]] = [copy[j], copy[i]];
      }
      return copy;
    },
  };
  return rng;
}

/**
 * Picks one element deterministically for a given seed.
 * @template T
 * @param {T[]} list
 * @param {number|string} seed
 * @returns {T|undefined}
 */
export function seededPick(list, seed) {
  return createRng(seed).pick(list);
}

/**
 * Returns a deterministically shuffled copy of a list.
 * @template T
 * @param {T[]} list
 * @param {number|string} seed
 * @returns {T[]}
 */
export function seededShuffle(list, seed) {
  return createRng(seed).shuffle(list);
}

/**
 * A deterministic float in [0, 1) for a key, without keeping generator state.
 * Handy for "noise" lookups such as per-day weather anomalies.
 * @param {string|number} key
 * @returns {number}
 */
export function seededUnit(key) {
  return mulberry32(hashString(String(key)))();
}

/**
 * Random id with a prefix, e.g. createId('itm') -> 'itm_k3j9x2m1q8'.
 * Uses WebCrypto when available. Not deterministic on purpose.
 * @param {string} prefix
 * @returns {string}
 */
export function createId(prefix) {
  const alphabet = '0123456789abcdefghijklmnopqrstuvwxyz';
  const bytes = new Uint8Array(10);
  if (globalThis.crypto?.getRandomValues) {
    globalThis.crypto.getRandomValues(bytes);
  } else {
    for (let i = 0; i < bytes.length; i += 1) bytes[i] = Math.floor(Math.random() * 256);
  }
  let out = '';
  for (const byte of bytes) out += alphabet[byte % alphabet.length];
  return `${prefix}_${out}`;
}

/**
 * Deterministic id from a key, e.g. stableId('itm', 'usr_x:navy-chinos').
 * @param {string} prefix
 * @param {string} key
 * @returns {string}
 */
export function stableId(prefix, key) {
  const a = hashString(key).toString(36);
  const b = hashString(`${key}#2`).toString(36);
  return `${prefix}_${(a + b).slice(0, 10).padEnd(10, '0')}`;
}
