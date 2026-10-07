import { useCallback, useEffect, useRef, useState } from 'react';

const SAVED_VISIBLE_MS = 2400;

/**
 * Tracks autosave state for a group of controls.
 * `track(promise)` marks the group as saving until the promise settles. Overlapping saves are
 * counted, so "Saved" only shows once the last one finishes.
 * @returns {{ status: 'idle'|'saving'|'saved'|'error', track: (promise: Promise) => Promise, reset: () => void }}
 */
export default function useAutosaveStatus() {
  const [status, setStatus] = useState('idle');
  const pending = useRef(0);
  const timer = useRef(null);

  useEffect(() => () => window.clearTimeout(timer.current), []);

  const track = useCallback(async (promise) => {
    window.clearTimeout(timer.current);
    pending.current += 1;
    setStatus('saving');
    try {
      const result = await promise;
      pending.current -= 1;
      if (pending.current === 0) {
        setStatus('saved');
        timer.current = window.setTimeout(() => setStatus('idle'), SAVED_VISIBLE_MS);
      }
      return result;
    } catch (error) {
      pending.current -= 1;
      setStatus('error');
      throw error;
    }
  }, []);

  const reset = useCallback(() => {
    window.clearTimeout(timer.current);
    setStatus('idle');
  }, []);

  return { status, track, reset };
}
