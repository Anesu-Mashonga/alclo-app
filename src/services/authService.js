/**
 * Accounts and sessions: signup, login, logout, profile, preferences,
 * onboarding, password and account deletion.
 */
import { ApiError, assertValid, simulate } from './api/client';
import { exportUserData, find, insert, ready, removeWhere, requireUser, table, toPublicUser, transaction, update } from './api/db';
import { clearSession, readSession, writeSession } from './api/session';
import { hashPassword, randomSalt, verifyPassword } from './api/crypto';
import { prefsOf } from './api/helpers';
import { importSampleItemsFor } from './wardrobeService';
import { DEFAULT_PREFERENCES } from '@/data/users';
import { OCCASION_BY_ID } from '@/data/taxonomy';
import { findCityProfile } from '@/data/weather';
import { AVATAR_PRESETS } from '@/data/avatars';
import { createId } from '@/lib/random';
import { initialsOf } from '@/lib/format';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const MAX_AVATAR_LENGTH = 1_500_000;

/** Password rule: at least 8 characters with a letter and a number. */
export function validatePassword(password) {
  if (!password) return 'Enter a password.';
  if (String(password).length < 8) return 'Use at least 8 characters.';
  if (!/[A-Za-z]/.test(password) || !/\d/.test(password)) return 'Include at least one letter and one number.';
  return null;
}

function validateName(name) {
  const text = String(name ?? '').trim();
  if (!text) return 'Enter your name.';
  if (text.length > 60) return 'Keep your name under 60 characters.';
  return null;
}

function validateEmail(email) {
  const text = String(email ?? '').trim();
  if (!text) return 'Enter your email address.';
  if (!EMAIL_RE.test(text)) return 'Enter a valid email address, like name@example.com.';
  return null;
}

const normaliseEmail = (email) => String(email ?? '').trim().toLowerCase();

function emailTaken(email, exceptUserId = null) {
  return table('users').some((user) => user.email === email && user.id !== exceptUserId);
}

function emailTakenError() {
  return new ApiError(409, 'email_taken', 'An account with this email already exists. Try signing in instead.', {
    email: 'An account with this email already exists.',
  });
}

/**
 * Validates a preferences patch and returns the merged preferences.
 * @param {object} current
 * @param {object} patch
 */
function mergePreferences(current, patch = {}) {
  const errors = {};
  const next = { ...current };
  if ('tempUnit' in patch) {
    if (patch.tempUnit === 'C' || patch.tempUnit === 'F') next.tempUnit = patch.tempUnit;
    else errors.tempUnit = 'Choose Celsius or Fahrenheit.';
  }
  if ('city' in patch) {
    const profile = findCityProfile(patch.city);
    if (profile) next.city = profile.name;
    else errors.city = 'Choose a city from the list.';
  }
  if ('weatherSource' in patch) {
    if (patch.weatherSource === 'simulated' || patch.weatherSource === 'live') next.weatherSource = patch.weatherSource;
    else errors.weatherSource = 'Choose simulated or live weather.';
  }
  if ('defaultOccasion' in patch) {
    if (OCCASION_BY_ID[patch.defaultOccasion]) next.defaultOccasion = patch.defaultOccasion;
    else errors.defaultOccasion = 'Choose an occasion from the list.';
  }
  if ('urgentAfterDays' in patch) {
    const days = Number(patch.urgentAfterDays);
    if (Number.isInteger(days) && days >= 1 && days <= 14) next.urgentAfterDays = days;
    else errors.urgentAfterDays = 'Use a whole number of days between 1 and 14.';
  }
  if ('occasions' in patch) {
    const list = Array.isArray(patch.occasions) ? [...new Set(patch.occasions)] : [];
    if (list.length === 0) errors.occasions = 'Pick at least one occasion.';
    else if (list.some((id) => !OCCASION_BY_ID[id])) errors.occasions = 'Choose occasions from the list.';
    else next.occasions = list;
  }
  if ('coords' in patch) {
    const coords = patch.coords;
    if (coords === null) next.coords = null;
    else if (coords && Number.isFinite(coords.lat) && Number.isFinite(coords.lon) && Math.abs(coords.lat) <= 90 && Math.abs(coords.lon) <= 180) {
      next.coords = { lat: Math.round(coords.lat * 1e4) / 1e4, lon: Math.round(coords.lon * 1e4) / 1e4 };
    } else errors.coords = 'That location could not be used.';
  }
  assertValid(errors);
  return next;
}

function validateAvatar(avatar) {
  if (!avatar || typeof avatar !== 'object') return 'Choose an avatar.';
  if (avatar.type === 'initials') return null;
  if (avatar.type === 'preset') return AVATAR_PRESETS.some((preset) => preset.id === avatar.value) ? null : 'Choose one of the avatars shown.';
  if (avatar.type === 'upload') {
    if (typeof avatar.value !== 'string' || !/^(data:image\/|https?:\/\/|\/)/.test(avatar.value)) return 'That photo could not be used.';
    if (avatar.value.length > MAX_AVATAR_LENGTH) return 'That photo is too large. Choose a smaller one.';
    return null;
  }
  return 'Choose an avatar.';
}

/**
 * Creates an account and signs in. New users start with an empty wardrobe and onboarded = false.
 * @param {{ name: string, email: string, password: string, remember?: boolean }} values
 * @returns {Promise<{ user: object, token: string }>}
 */
export function signup({ name, email, password, remember = true } = {}) {
  return simulate(async () => {
    await ready();
    assertValid({ name: validateName(name), email: validateEmail(email), password: validatePassword(password) });
    const normalised = normaliseEmail(email);
    if (emailTaken(normalised)) throw emailTakenError();

    const salt = randomSalt();
    const passwordHash = await hashPassword(password, salt);
    if (emailTaken(normalised)) throw emailTakenError();

    const now = new Date().toISOString();
    const trimmedName = String(name).trim();
    const user = {
      id: createId('usr'),
      name: trimmedName,
      email: normalised,
      passwordHash,
      salt,
      avatar: { type: 'initials', value: initialsOf(trimmedName) },
      onboarded: false,
      preferences: { ...DEFAULT_PREFERENCES, occasions: [...DEFAULT_PREFERENCES.occasions] },
      createdAt: now,
      updatedAt: now,
    };
    transaction(() => insert('users', user));
    const session = writeSession(user.id, { remember });
    return { user: toPublicUser(user), token: session.token };
  });
}

/**
 * Signs in with email and password.
 * @param {{ email: string, password: string, remember?: boolean }} values
 * @returns {Promise<{ user: object, token: string }>}
 */
export function login({ email, password, remember = false } = {}) {
  return simulate(async () => {
    await ready();
    assertValid({
      email: String(email ?? '').trim() ? null : 'Enter your email address.',
      password: password ? null : 'Enter your password.',
    });
    const user = table('users').find((row) => row.email === normaliseEmail(email));
    const ok = user ? await verifyPassword(password, user.salt, user.passwordHash) : false;
    if (!ok) throw new ApiError(401, 'invalid_credentials', "That email and password don't match.");
    const session = writeSession(user.id, { remember });
    return { user: toPublicUser(user), token: session.token };
  });
}

/** Ends the session. Never fails. */
export function logout() {
  return simulate(
    () => {
      clearSession();
      return { ok: true };
    },
    { latency: 'fast', fail: false },
  );
}

/**
 * The signed-in user, or null when there is no valid session.
 * Exempt from simulated failures so a flaky dev setting never signs anyone out.
 * @returns {Promise<object|null>}
 */
export function getCurrentUser() {
  return simulate(
    async () => {
      await ready();
      const session = readSession();
      if (!session) return null;
      const user = find('users', session.userId);
      if (!user) {
        clearSession();
        return null;
      }
      return toPublicUser(user);
    },
    { latency: 'fast', fail: false },
  );
}

/**
 * Starts a password reset. Always reports success for a well-formed email,
 * so it never reveals whether an account exists.
 * @param {string} email
 * @returns {Promise<{ sent: true, email: string }>}
 */
export function requestPasswordReset(email) {
  return simulate(() => {
    assertValid({ email: validateEmail(email) });
    return { sent: true, email: normaliseEmail(email) };
  });
}

/**
 * Updates name, email or avatar.
 * @param {{ name?: string, email?: string, avatar?: object }} patch
 */
export function updateProfile(patch = {}) {
  return simulate(async () => {
    await ready();
    const user = requireUser();
    const errors = {};
    const changes = {};
    if ('name' in patch) {
      errors.name = validateName(patch.name);
      changes.name = String(patch.name ?? '').trim();
    }
    if ('email' in patch) {
      errors.email = validateEmail(patch.email);
      changes.email = normaliseEmail(patch.email);
    }
    if ('avatar' in patch) {
      errors.avatar = validateAvatar(patch.avatar);
      if (!errors.avatar) changes.avatar = { type: patch.avatar.type, value: String(patch.avatar.value ?? '') };
    }
    assertValid(errors);
    if (changes.email && emailTaken(changes.email, user.id)) throw emailTakenError();
    if (changes.avatar?.type === 'initials') changes.avatar.value = initialsOf(changes.name ?? user.name);
    else if (changes.name && user.avatar?.type === 'initials' && !changes.avatar) {
      changes.avatar = { type: 'initials', value: initialsOf(changes.name) };
    }
    const next = transaction(() => update('users', user.id, { ...changes, updatedAt: new Date().toISOString() }));
    return toPublicUser(next);
  });
}

/**
 * Updates preferences (tempUnit, city, weatherSource, defaultOccasion, urgentAfterDays, occasions, coords).
 * @param {object} patch
 */
export function updatePreferences(patch = {}) {
  return simulate(async () => {
    await ready();
    const user = requireUser();
    const preferences = mergePreferences(prefsOf(user), patch);
    const next = transaction(() => update('users', user.id, { preferences, updatedAt: new Date().toISOString() }));
    return toPublicUser(next);
  });
}

/**
 * Finishes onboarding: saves preferences, marks the user onboarded and optionally imports the sample wardrobe.
 * @param {{ preferences?: object, sampleWardrobe?: boolean }} values
 * @returns {Promise<{ user: object, importedCount: number }>}
 */
export function completeOnboarding({ preferences = {}, sampleWardrobe = false } = {}) {
  return simulate(async () => {
    await ready();
    const user = requireUser();
    const merged = mergePreferences(prefsOf(user), preferences);
    return transaction(() => {
      const imported = sampleWardrobe ? importSampleItemsFor(user.id) : [];
      const next = update('users', user.id, { preferences: merged, onboarded: true, updatedAt: new Date().toISOString() });
      return { user: toPublicUser(next), importedCount: imported.length };
    });
  });
}

/**
 * Changes the password after checking the current one.
 * @param {{ currentPassword: string, newPassword: string }} values
 */
export function changePassword({ currentPassword, newPassword } = {}) {
  return simulate(async () => {
    await ready();
    const user = requireUser();
    assertValid({
      currentPassword: currentPassword ? null : 'Enter your current password.',
      newPassword: validatePassword(newPassword),
    });
    if (!(await verifyPassword(currentPassword, user.salt, user.passwordHash))) {
      throw new ApiError(422, 'validation', 'Your current password is not right.', {
        currentPassword: 'That password is not right.',
      });
    }
    if (currentPassword === newPassword) {
      throw new ApiError(422, 'validation', 'Choose a new password that is different from the current one.', {
        newPassword: 'Choose a different password.',
      });
    }
    const salt = randomSalt();
    const passwordHash = await hashPassword(newPassword, salt);
    transaction(() => update('users', user.id, { salt, passwordHash, updatedAt: new Date().toISOString() }));
    return { ok: true };
  });
}

/**
 * Permanently deletes the account and all of its data, then signs out.
 * @param {{ password: string }} values
 */
export function deleteAccount({ password } = {}) {
  return simulate(async () => {
    await ready();
    const user = requireUser();
    assertValid({ password: password ? null : 'Enter your password to confirm.' });
    if (!(await verifyPassword(password, user.salt, user.passwordHash))) {
      throw new ApiError(422, 'validation', 'That password is not right.', { password: 'That password is not right.' });
    }
    transaction(() => {
      for (const name of ['items', 'outfits', 'wearLogs', 'plans']) removeWhere(name, (row) => row.userId === user.id);
      removeWhere('users', (row) => row.id === user.id);
    });
    clearSession();
    return { ok: true };
  });
}

/**
 * Everything stored for the signed-in user (profile, items, outfits, logs, plans) as plain JSON.
 */
export function exportMyData() {
  return simulate(async () => {
    await ready();
    const user = requireUser();
    return exportUserData(user.id);
  });
}
