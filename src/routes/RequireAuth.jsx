import { useState } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router';
import FullPageLoader from '@/components/layout/FullPageLoader';
import { useAuth } from '@/context/AuthContext';

/**
 * Gate for signed-in routes. Shows the branded loader while the session bootstraps and sends
 * anonymous visitors to /login with `state.from`, so signing in returns them to this page.
 * After a sign-out in this tab there is no `from`: the next person starts on Today.
 */
export default function RequireAuth() {
  const { status } = useAuth();
  const location = useLocation();
  const [hadSession, setHadSession] = useState(status === 'authenticated');

  if (status === 'authenticated' && !hadSession) setHadSession(true);

  if (status === 'loading') return <FullPageLoader />;

  if (status !== 'authenticated') {
    const { pathname, search, hash } = location;
    const state = hadSession ? undefined : { from: { pathname, search, hash } };
    return <Navigate to="/login" replace state={state} />;
  }

  return <Outlet />;
}
