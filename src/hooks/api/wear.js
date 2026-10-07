import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as wearService from '@/services/wearService';
import { todayISO } from '@/lib/dates';
import { queryKeys } from './queryKeys';
import { invalidateGroup } from './invalidate';

/** mutate(logId) -> { log, items }. */
export function useUndoWear() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (logId) => wearService.undoWear(logId),
    onSettled: () => invalidateGroup(client, 'wear'),
  });
}

/**
 * Logs an outfit as worn.
 * mutateAsync({ itemIds, outfitId?, occasion?, weather?, date? }) resolves to { log, items, movedToHamper };
 * call `undo(log.id)` from the toast's Undo action.
 */
export function useWearItems() {
  const client = useQueryClient();
  const undoMutation = useUndoWear();
  const mutation = useMutation({
    mutationFn: (values) => wearService.wearItems(values),
    onSuccess: (result) => {
      if (result.log.date === todayISO()) client.setQueryData(queryKeys.wear.today(result.log.date), result.log);
    },
    onSettled: () => invalidateGroup(client, 'wear'),
  });
  return { ...mutation, undo: (logId) => undoMutation.mutateAsync(logId), undoMutation };
}

/** Today's latest wear log (or null). */
export function useTodayLog(options = {}) {
  const today = todayISO();
  return useQuery({
    queryKey: queryKeys.wear.today(today),
    queryFn: () => wearService.getTodayLog(),
    ...options,
  });
}

/**
 * Wear logs in a date range (default: the last 30 days).
 * @param {{ from?: string, to?: string }} [range]
 */
export function useWearLogs(range = {}, options = {}) {
  return useQuery({
    queryKey: queryKeys.wear.logs(range),
    queryFn: () => wearService.listWearLogs(range),
    ...options,
  });
}
