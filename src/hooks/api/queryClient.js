import { QueryClient } from '@tanstack/react-query';
import { isApiError } from '@/services/api/client';

/**
 * Shared React Query client.
 * - 30s stale time, no refetch on window focus
 * - no retries for 4xx (validation, auth, not found): retrying cannot help
 * - one retry for 5xx and network errors
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      refetchOnWindowFocus: false,
      retry: (failureCount, error) => {
        if (isApiError(error) && error.status >= 400 && error.status < 500) return false;
        return failureCount < 1;
      },
    },
    mutations: {
      retry: 0,
    },
  },
});
