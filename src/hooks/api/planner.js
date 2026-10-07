import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as plannerService from '@/services/plannerService';
import { queryKeys } from './queryKeys';
import { invalidateGroup } from './invalidate';

/**
 * Plans in a date range (default: this week and next).
 * @param {{ from?: string, to?: string }} [range]
 */
export function usePlans(range = {}, options = {}) {
  return useQuery({
    queryKey: queryKeys.plans.list(range),
    queryFn: () => plannerService.listPlans(range),
    ...options,
  });
}

/** mutate({ date, outfitId?, itemIds?, occasion?, note? }) -> plan (creates or replaces). */
export function useSetPlan() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (values) => plannerService.setPlan(values),
    onSettled: () => invalidateGroup(client, 'plans'),
  });
}

/**
 * mutate(date) -> { date, previous }. For Undo, call useSetPlan with `previous`
 * ({ date, outfitId, itemIds, occasion, note }).
 */
export function useClearPlan() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (date) => plannerService.clearPlan(date),
    onMutate: async (date) => {
      await client.cancelQueries({ queryKey: queryKeys.plans.all });
      const snapshot = client.getQueriesData({ queryKey: queryKeys.plans.all });
      client.setQueriesData({ queryKey: queryKeys.plans.all }, (list) =>
        Array.isArray(list) ? list.filter((plan) => plan.date !== date) : list,
      );
      return { snapshot };
    },
    onError: (_error, _date, context) => {
      for (const [key, data] of context?.snapshot ?? []) client.setQueryData(key, data);
    },
    onSettled: () => invalidateGroup(client, 'plans'),
  });
}
