import { Suspense } from 'react';
import PageSkeleton from '@/components/common/PageSkeleton';
import AppShell from '@/components/layout/AppShell';
import FullPageLoader from '@/components/layout/FullPageLoader';
import { useAuth } from '@/context/AuthContext';
import { NotFoundPage } from './pages';

/**
 * Catch-all route. Signed-in people see the 404 inside the app (navigation stays available);
 * everyone else gets the standalone page.
 */
export default function NotFoundRoute() {
  const { status } = useAuth();

  if (status === 'loading') return <FullPageLoader />;

  if (status === 'authenticated') {
    return (
      <AppShell>
        <NotFoundPage />
      </AppShell>
    );
  }

  return (
    <Suspense fallback={<PageSkeleton header={false} />}>
      <NotFoundPage />
    </Suspense>
  );
}
