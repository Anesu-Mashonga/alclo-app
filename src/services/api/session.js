/**
 * Session storage for the mock backend.
 * "Remember me" sessions live in localStorage for 30 days and are shared by tabs;
 * other sessions live in sessionStorage and end when the browser tab closes.
 */
import { ApiError } from './client';
import { createId } from '@/lib/random';

export const SESSION_KEY = 'alclo.session';
export const REMEMBER_DAYS = 30;

function safe(getter) {
  try {
    return getter() ?? null;
  } catch {
    return null;
  }
}

const local = () => safe(() => globalThis.localStorage);
const perTab = () => safe(() => globalThis.sessionStorage);

function parse(raw) {
  if (!raw) return null;
  try {
    const value = JSON.parse(raw);
    return value && typeof value.userId === 'string' && typeof value.token === 'string' ? value : null;
  } catch {
    return null;
  }
}

/** Removes the session from both storages. */
export function clearSession() {
  safe(() => local()?.removeItem(SESSION_KEY));
  safe(() => perTab()?.removeItem(SESSION_KEY));
}

/**
 * The active session, or null when signed out or expired (expired sessions are cleared).
 * @returns {{ token: string, userId: string, remember: boolean, createdAt: string, expiresAt: string|null }|null}
 */
export function readSession() {
  const session = parse(safe(() => perTab()?.getItem(SESSION_KEY))) ?? parse(safe(() => local()?.getItem(SESSION_KEY)));
  if (!session) return null;
  if (session.expiresAt && new Date(session.expiresAt).getTime() <= Date.now()) {
    clearSession();
    return null;
  }
  return session;
}

/**
 * Starts a session for a user.
 * @param {string} userId
 * @param {{ remember?: boolean }} [options]
 */
export function writeSession(userId, { remember = false } = {}) {
  clearSession();
  const now = new Date();
  const session = {
    token: createId('tok'),
    userId,
    remember,
    createdAt: now.toISOString(),
    expiresAt: remember ? new Date(now.getTime() + REMEMBER_DAYS * 86400000).toISOString() : null,
  };
  const target = remember ? local() : perTab();
  safe(() => target?.setItem(SESSION_KEY, JSON.stringify(session)));
  return session;
}

/** 401 used whenever a signed-in user is required. */
export function unauthorized() {
  return new ApiError(401, 'unauthorized', 'Your session has ended. Sign in again to continue.');
}

/**
 * The signed-in user's id, or throws 401.
 * @returns {string}
 */
export function requireUserId() {
  const session = readSession();
  if (!session) throw unauthorized();
  return session.userId;
}
