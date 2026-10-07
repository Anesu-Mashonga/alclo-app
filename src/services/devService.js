/**
 * Developer settings for the mock backend (latency and failure injection) and demo reset.
 * None of these calls are subject to simulated failures, so you can always recover.
 */
import { readDevSettings, simulate, writeDevSettings } from './api/client';
import { find, resetDatabase } from './api/db';
import { clearSession, readSession } from './api/session';

/** @returns {Promise<{ latency: 'instant'|'fast'|'normal'|'slow', failureRate: number }>} */
export function getDevSettings() {
  return simulate(() => readDevSettings(), { latency: 'instant', fail: false });
}

/**
 * @param {{ latency?: 'instant'|'fast'|'normal'|'slow', failureRate?: number }} patch failureRate is 0..1
 */
export function setDevSettings(patch = {}) {
  return simulate(() => writeDevSettings(patch), { latency: 'instant', fail: false });
}

/**
 * Wipes local data and reseeds the demo. Seed accounts keep their ids, so a signed-in
 * demo user stays signed in; anyone else is signed out.
 * @returns {Promise<{ ok: true, signedOut: boolean }>}
 */
export function resetDemoData() {
  return simulate(
    async () => {
      await resetDatabase();
      const session = readSession();
      const stillValid = Boolean(session && find('users', session.userId));
      if (session && !stillValid) clearSession();
      return { ok: true, signedOut: Boolean(session) && !stillValid };
    },
    { fail: false },
  );
}
