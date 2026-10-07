import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as devService from '@/services/devService';
import { useAuth } from '@/context/AuthContext';
import { queryKeys } from './queryKeys';

/** { latency, failureRate } for the mock backend. */
export function useDevSettings(options = {}) {
  return useQuery({
    queryKey: queryKeys.dev.settings(),
    queryFn: () => devService.getDevSettings(),
    staleTime: Infinity,
    ...options,
  });
}

/** mutate({ latency?, failureRate? }) -> settings. failureRate is 0..1. */
export function useUpdateDevSettings() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (patch) => devService.setDevSettings(patch),
    onSuccess: (settings) => client.setQueryData(queryKeys.dev.settings(), settings),
  });
}

/**
 * Wipes local data and reseeds the demo, then refreshes every query and the signed-in user.
 * mutateAsync() resolves to { ok, signedOut }.
 */
export function useResetDemoData() {
  const client = useQueryClient();
  const { refreshUser } = useAuth();
  return useMutation({
    mutationFn: () => devService.resetDemoData(),
    onSuccess: async () => {
      await refreshUser();
      await client.invalidateQueries();
    },
  });
}
