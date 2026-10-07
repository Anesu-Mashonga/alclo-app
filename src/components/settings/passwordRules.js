/** The account password rule (matches the backend): 8+ characters with a letter and a number. */
export const PASSWORD_CHECKS = [
  { id: 'length', label: 'At least 8 characters', test: (value) => value.length >= 8 },
  { id: 'letter', label: 'Contains a letter', test: (value) => /[A-Za-z]/.test(value) },
  { id: 'number', label: 'Contains a number', test: (value) => /\d/.test(value) },
];

export const STRENGTH_LABELS = ['Weak', 'Fair', 'Good', 'Strong'];

/** True when the password passes the account rule. */
export function meetsPasswordRule(value) {
  return PASSWORD_CHECKS.every((check) => check.test(String(value ?? '')));
}

/**
 * Strength score 0..4 (0 = empty). A password that fails the rule is never above Weak.
 * @param {string} value
 */
export function passwordScore(value) {
  const text = String(value ?? '');
  if (!text) return 0;
  if (!meetsPasswordRule(text)) return 1;
  let score = 2;
  if (text.length >= 12) score += 1;
  if (/[^A-Za-z0-9]/.test(text) || (/[a-z]/.test(text) && /[A-Z]/.test(text))) score += 1;
  return Math.min(4, score);
}
