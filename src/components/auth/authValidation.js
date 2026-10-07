/**
 * Client-side checks for the auth forms. They mirror the rules in services/authService so people
 * see the same message before and after a round trip.
 */

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/**
 * @param {string} value
 * @returns {string | null} message, or null when the address looks valid
 */
export function validateEmail(value) {
  const text = String(value ?? '').trim();
  if (!text) return 'Enter your email address.';
  if (!EMAIL_PATTERN.test(text)) return 'Enter a valid email address, like name@example.com.';
  return null;
}

/**
 * @param {string} value
 * @returns {string | null}
 */
export function validateName(value) {
  const text = String(value ?? '').trim();
  if (!text) return 'Enter your name.';
  if (text.length > 60) return 'Keep your name under 60 characters.';
  return null;
}

/**
 * Sign-in only needs something in the field; the server decides whether it matches.
 * @param {string} value
 */
export function validatePasswordPresent(value) {
  return value ? null : 'Enter your password.';
}

/**
 * The three password rules, in display order.
 * @param {string} password
 * @returns {{ id: string, label: string, met: boolean }[]}
 */
export function passwordChecks(password) {
  const value = String(password ?? '');
  return [
    { id: 'length', label: 'At least 8 characters', met: value.length >= 8 },
    { id: 'letter', label: 'Contains a letter', met: /[A-Za-z]/.test(value) },
    { id: 'number', label: 'Contains a number', met: /\d/.test(value) },
  ];
}

/**
 * New passwords must meet every rule in passwordChecks.
 * @param {string} password
 */
export function validateNewPassword(password) {
  if (!password) return 'Choose a password.';
  if (passwordChecks(password).some((check) => !check.met)) return 'Your password needs to meet all three rules below.';
  return null;
}

export const STRENGTH_LABELS = ['', 'Weak', 'Fair', 'Good', 'Strong'];

/**
 * Rough strength score for the meter: 0 (empty) to 4 (strong).
 * A password that misses a rule is always "Weak".
 * @param {string} password
 * @returns {{ score: 0 | 1 | 2 | 3 | 4, label: string }}
 */
export function passwordStrength(password) {
  const value = String(password ?? '');
  if (!value) return { score: 0, label: '' };
  const allRulesMet = passwordChecks(value).every((check) => check.met);
  if (!allRulesMet) return { score: 1, label: STRENGTH_LABELS[1] };

  let score = 2;
  const variety = [/[a-z]/, /[A-Z]/, /\d/, /[^A-Za-z0-9]/].filter((pattern) => pattern.test(value)).length;
  if (value.length >= 12) score += 1;
  if (variety >= 3) score += 1;
  if (value.length < 10 && variety < 3) score = 2;
  const clamped = Math.min(4, score);
  return { score: clamped, label: STRENGTH_LABELS[clamped] };
}
