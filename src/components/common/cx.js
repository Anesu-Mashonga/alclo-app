/**
 * Join class names, skipping falsy values: cx('card', isActive && 'card--active').
 * @param {...(string | false | null | undefined)} names
 * @returns {string}
 */
export default function cx(...names) {
  return names.filter(Boolean).join(' ');
}
