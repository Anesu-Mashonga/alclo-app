import { useEffect } from 'react';
import { useLocation } from 'react-router';

/*
 * Focus management on route changes (spec 1.6 #12).
 *
 * RootLayout records every pathname change (not the first load, not search-param changes).
 * The page heading claims that change once it has rendered, which also covers lazy pages that
 * mount after their chunk loads. Module state is fine here: there is one router per app.
 */
let lastSeenPathname = null;
let pendingFocusPathname = null;

/** Call once in the root layout. */
export function useRouteChangeTracker() {
  const { pathname } = useLocation();

  useEffect(() => {
    if (lastSeenPathname !== null && lastSeenPathname !== pathname) {
      pendingFocusPathname = pathname;
    }
    lastSeenPathname = pathname;
  }, [pathname]);
}

/**
 * Focus `ref` (a heading with tabIndex -1) after navigating to a new page.
 * @param {import('react').RefObject<HTMLElement | null>} ref
 */
export function useRouteHeadingFocus(ref) {
  const { pathname } = useLocation();

  useEffect(() => {
    // Wait a frame so the tracker (a parent effect) has recorded this navigation.
    const frame = window.requestAnimationFrame(() => {
      if (pendingFocusPathname !== pathname) return;
      pendingFocusPathname = null;
      ref.current?.focus({ preventScroll: true });
    });
    return () => window.cancelAnimationFrame(frame);
  }, [pathname, ref]);
}
