import { useState } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router';
import FullPageLoader from '@/components/layout/FullPageLoader';
import { useAuth } from '@/context/AuthContext';

const AUTH_PATHS = new Set(['/login', '/signup', '/forgot-password']);

/** Where to go after signing in: back to the page that sent us here, or Today. */
function redirectTarget(from) {
  if (!from?.pathname || AUTH_PATHS.has(from.pathname)) return '/';
  return `${from.pathname}${from.search ?? ''}${from.hash ?? ''}`;
}

/**
 * Gate for the sign-in pages. Signed-in people are sent on (to `state.from` or Today).
 * The loader only shows during the first session check, so a form that is submitting
 * never unmounts and loses its state or errors.
 */
export default function RedirectIfAuthed() {
  const { status } = useAuth();
  const location = useLocation();
  const [bootstrapped, setBootstrapped] = useState(status !== 'loading');

  if (!bootstrapped && status !== 'loading') setBootstrapped(true);

  if (!bootstrapped && status === 'loading') return <FullPageLoader />;
  if (status === 'authenticated') return <Navigate to={redirectTarget(location.state?.from)} replace />;

  return <Outlet />;
}
