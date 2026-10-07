import { useCallback, useState } from 'react';

/**
 * Keeps a dialog's last value while it plays its exit transition, so the content does not
 * empty out mid-animation. `key` identifies the value (a string), so a new value is latched
 * whenever the key changes while open. Call `clear` from the transition's onExited.
 * @template T
 * @param {boolean} open
 * @param {T} value
 * @param {string} key
 * @returns {[T|null, () => void]}
 */
export default function useLatched(open, value, key) {
  const [latched, setLatched] = useState(() => (open ? { key, value } : null));
  if (open && (!latched || latched.key !== key)) setLatched({ key, value });
  const clear = useCallback(() => setLatched(null), []);
  return [open ? value : (latched?.value ?? null), clear];
}
