import { Suspense } from 'react';
import { Outlet, ScrollRestoration } from 'react-router';
import FullPageLoader from '@/components/layout/FullPageLoader';
import { useRouteChangeTracker } from './routeFocus';

// Scroll positions are kept per path, so opening ?item=, switching tabs or changing filters
// never jumps to the top, and Back returns to where you were on each page.
const getScrollKey = (location) => location.pathname;

/** Top of the route tree: lazy-page fallback, scroll restoration and route focus tracking. */
export default function RootLayout() {
  useRouteChangeTracker();

  return (
    <>
      <Suspense fallback={<FullPageLoader />}>
        <Outlet />
      </Suspense>
      <ScrollRestoration getKey={getScrollKey} />
    </>
  );
}
