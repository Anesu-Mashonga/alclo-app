import { useCallback, useState } from 'react';

/**
 * Measures an element's content width with a ResizeObserver.
 * Returns [callbackRef, width]; width is 0 until the first measurement.
 */
export default function useElementWidth() {
  const [width, setWidth] = useState(0);

  const ref = useCallback((node) => {
    if (!node || typeof ResizeObserver === 'undefined') return undefined;
    const observer = new ResizeObserver((entries) => {
      const next = Math.round(entries[0]?.contentRect.width ?? 0);
      setWidth((prev) => (prev === next ? prev : next));
    });
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return [ref, width];
}
