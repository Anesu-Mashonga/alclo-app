import { useEffect, useEffectEvent, useRef } from 'react';

/** True on Apple platforms, where "mod" means the Command key. */
export const IS_MAC =
  typeof navigator !== 'undefined' &&
  /Mac|iPhone|iPad|iPod/i.test(navigator.userAgentData?.platform || navigator.platform || navigator.userAgent);

/** Label for the "mod" key in UI copy and Kbd chips. */
export const MOD_KEY_LABEL = IS_MAC ? '\u2318' : 'Ctrl';

const SEQUENCE_TIMEOUT_MS = 1000;

const KEY_ALIASES = {
  esc: 'escape',
  ' ': 'space',
  spacebar: 'space',
  up: 'arrowup',
  down: 'arrowdown',
  left: 'arrowleft',
  right: 'arrowright',
  del: 'delete',
  return: 'enter',
};

const NON_TEXT_INPUT_TYPES = new Set(['checkbox', 'radio', 'button', 'submit', 'reset', 'range', 'color', 'file', 'image']);

function normalizeKey(key) {
  const lower = String(key).toLowerCase();
  return KEY_ALIASES[lower] ?? lower;
}

/** "mod+shift+k" -> { key: 'k', mod: true, shift: true, alt: false } */
function parseStep(step) {
  const tokens = step.trim().toLowerCase().split('+');
  const key = normalizeKey(tokens.pop());
  return {
    key,
    mod: tokens.some((token) => ['mod', 'ctrl', 'meta', 'cmd'].includes(token)),
    shift: tokens.includes('shift'),
    alt: tokens.includes('alt') || tokens.includes('option'),
  };
}

function parseBinding(binding) {
  return binding
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map(parseStep);
}

function stepMatches(step, event) {
  const key = normalizeKey(event.key);
  if (key !== step.key) return false;
  const modPressed = event.metaKey || event.ctrlKey;
  if (step.mod !== modPressed) return false;
  if (step.alt !== event.altKey) return false;
  // Letters must match shift exactly ("n" is not "shift+n"); symbols like "?" imply shift.
  if (/^[a-z]$/.test(step.key) && step.shift !== event.shiftKey) return false;
  if (step.shift && !event.shiftKey) return false;
  return true;
}

/** Whether the keystroke happened inside something that accepts text. */
export function isEditableTarget(target) {
  if (!(target instanceof Element)) return false;
  if (target.closest('[contenteditable=""], [contenteditable="true"], [contenteditable="plaintext-only"]')) return true;
  const tag = target.tagName;
  if (tag === 'TEXTAREA' || tag === 'SELECT') return true;
  if (tag === 'INPUT') return !NON_TEXT_INPUT_TYPES.has(String(target.type).toLowerCase());
  return target.getAttribute('role') === 'textbox' || target.getAttribute('role') === 'combobox';
}

/** Whether a modal surface (dialog, drawer, menu, popover) is open or holds focus. */
export function isOverlayActive(target) {
  if (target instanceof Element && target.closest('[role="dialog"], [role="alertdialog"], [role="menu"], .MuiModal-root')) {
    return true;
  }
  return Boolean(document.querySelector('body > .MuiModal-root:not(.MuiModal-hidden)'));
}

/**
 * Global keyboard shortcuts.
 *
 * Bindings: 'mod+k' (Ctrl or Cmd), 'n', '/', '?', 'shift+n', 'escape', and two-step sequences such
 * as 'g t' (second key within 1 second). The handler receives the KeyboardEvent; the default
 * browser action is prevented unless the handler returns `false`.
 *
 * @param {Record<string, (event: KeyboardEvent) => (void | boolean)>} bindings
 * @param {{ enabled?: boolean, allowInInputs?: boolean, ignoreInOverlays?: boolean, allowRepeat?: boolean, target?: EventTarget }} [options]
 *   - enabled: turn every binding on or off (default true)
 *   - allowInInputs: also fire while typing in inputs, textareas and contenteditable (default false)
 *   - ignoreInOverlays: skip while a dialog, drawer, menu or popover is open (default false)
 *   - allowRepeat: fire on auto-repeat when a key is held down (default false)
 */
export default function useHotkeys(bindings, options = {}) {
  const { enabled = true, allowInInputs = false, ignoreInOverlays = false, allowRepeat = false } = options;
  const pendingRef = useRef(null);

  const handleKeyDown = useEffectEvent((event) => {
    if (event.defaultPrevented || event.isComposing || event.key === 'Process' || event.key === 'Dead') return;
    if (event.repeat && !allowRepeat) return;
    if (!allowInInputs && isEditableTarget(event.target)) return;
    if (ignoreInOverlays && isOverlayActive(event.target)) return;

    const parsed = Object.entries(bindings)
      .filter(([, handler]) => typeof handler === 'function')
      .map(([binding, handler]) => ({ steps: parseBinding(binding), handler }));

    const run = (handler) => {
      const result = handler(event);
      if (result !== false) event.preventDefault();
    };

    // Second key of a sequence such as "g t".
    const pending = pendingRef.current;
    pendingRef.current = null;
    if (pending && event.timeStamp - pending.time <= SEQUENCE_TIMEOUT_MS) {
      const match = parsed.find(
        ({ steps }) => steps.length === 2 && stepMatches(steps[0], pending.event) && stepMatches(steps[1], event),
      );
      if (match) {
        run(match.handler);
        return;
      }
    }

    const single = parsed.find(({ steps }) => steps.length === 1 && stepMatches(steps[0], event));
    if (single) {
      run(single.handler);
      return;
    }

    if (parsed.some(({ steps }) => steps.length === 2 && stepMatches(steps[0], event))) {
      pendingRef.current = {
        time: event.timeStamp,
        event: { key: event.key, metaKey: event.metaKey, ctrlKey: event.ctrlKey, altKey: event.altKey, shiftKey: event.shiftKey },
      };
    }
  });

  useEffect(() => {
    if (!enabled) return undefined;
    const listener = (event) => handleKeyDown(event);
    window.addEventListener('keydown', listener);
    return () => window.removeEventListener('keydown', listener);
  }, [enabled]);
}
