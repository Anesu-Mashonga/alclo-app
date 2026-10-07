import { Navigate, Outlet } from 'react-router';
import { useAuth } from '@/context/AuthContext';

/** App routes: new accounts finish the welcome steps first. */
export default function RequireOnboarded() {
  const { user } = useAuth();
  if (user && user.onboarded === false) return <Navigate to="/welcome" replace />;
  return <Outlet />;
}

/** The welcome route: people who already finished onboarding go straight to Today. */
export function RedirectIfOnboarded() {
  const { user } = useAuth();
  if (user?.onboarded) return <Navigate to="/" replace />;
  return <Outlet />;
}
