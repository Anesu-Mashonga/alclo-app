import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as laundryService from '@/services/laundryService';
import { queryKeys } from './queryKeys';
import { invalidateGroup, restoreQueries, snapshotQueries } from './invalidate';
import { patchCachedItems } from './items';

const MOVES = {
  moveToHamper: { fn: laundryService.moveToHamper, from: ['clean', 'washing'], to: 'hamper' },
  startWash: { fn: laundryService.startWash, from: ['hamper', 'clean'], to: 'washing' },
  finishWash: { fn: laundryService.finishWash, from: ['washing'], to: 'clean' },
  markClean: { fn: laundryService.markClean, from: ['hamper', 'washing'], to: 'clean' },
};

function nextLaundry(laundry, to, since) {
  return { ...laundry, status: to, since, wearsSinceWash: to === 'clean' ? 0 : laundry.wearsSinceWash };
}

/**
 * Optimistically moves items between the hamper / washing / recently cleaned lists
 * of the cached overview and recomputes the counts.
 */
function applyToOverview(data, ids, { from, to }, since) {
  if (!data) return data;
  const idSet = new Set(ids);
  const all = [...data.hamper, ...data.washing, ...data.recentlyCleaned];
  const moving = all.filter((item) => idSet.has(item.id) && from.includes(item.laundry.status));
  if (moving.length === 0) return data;
  const movingIds = new Set(moving.map((item) => item.id));
  const keep = (list) => list.filter((item) => !movingIds.has(item.id));
  const moved = moving.map((item) => ({
    ...item,
    urgent: false,
    daysInStatus: 0,
    laundry: nextLaundry(item.laundry, to, since),
  }));
  const hamper = to === 'hamper' ? [...keep(data.hamper), ...moved] : keep(data.hamper);
  const washing = to === 'washing' ? [...keep(data.washing), ...moved] : keep(data.washing);
  const recentlyCleaned = to === 'clean' ? [...moved, ...keep(data.recentlyCleaned)] : keep(data.recentlyCleaned);
  const delta = (status) =>
    moved.length * (to === status ? 1 : 0) - moving.filter((item) => item.laundry.status === status).length;
  const clean = Math.max(0, data.counts.clean + delta('clean'));
  return {
    ...data,
    hamper,
    washing,
    recentlyCleaned,
    counts: {
      ...data.counts,
      hamper: hamper.length,
      urgent: hamper.filter((item) => item.urgent).length,
      washing: washing.length,
      clean,
    },
    readiness: data.counts.washable ? Math.round((clean / data.counts.washable) * 100) / 100 : 1,
  };
}

/** Full laundry overview: hamper, washing, recently cleaned, counts and readiness. */
export function useLaundry(options = {}) {
  return useQuery({
    queryKey: queryKeys.laundry.overview(),
    queryFn: () => laundryService.getLaundry(),
    ...options,
  });
}

/**
 * Just the counts and readiness (shares the overview cache), e.g. for the nav badge:
 * useLaundrySummary().data?.counts.hamper
 */
export function useLaundrySummary(options = {}) {
  return useQuery({
    queryKey: queryKeys.laundry.overview(),
    queryFn: () => laundryService.getLaundry(),
    select: (data) => ({ counts: data.counts, readiness: data.readiness }),
    ...options,
  });
}

function useLaundryMove(name) {
  const client = useQueryClient();
  const move = MOVES[name];
  return useMutation({
    mutationFn: (ids) => move.fn(ids),
    onMutate: async (ids) => {
      const list = Array.isArray(ids) ? ids : [ids];
      await Promise.all([
        client.cancelQueries({ queryKey: queryKeys.laundry.all }),
        client.cancelQueries({ queryKey: queryKeys.items.all }),
      ]);
      const snapshot = [
        ...snapshotQueries(client, queryKeys.laundry.all),
        ...snapshotQueries(client, queryKeys.items.all),
      ];
      const since = new Date().toISOString();
      client.setQueryData(queryKeys.laundry.overview(), (data) => applyToOverview(data, list, move, since));
      patchCachedItems(client, list, (item) =>
        item.laundry?.washAfter && move.from.includes(item.laundry.status)
          ? { ...item, laundry: nextLaundry(item.laundry, move.to, since) }
          : item,
      );
      return { snapshot };
    },
    onError: (_error, _ids, context) => restoreQueries(client, context?.snapshot),
    onSettled: () => invalidateGroup(client, 'laundry'),
  });
}

/** mutate(snapshot) -> { items }. Puts laundry states back (Undo). */
export function useRestoreLaundry() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (snapshot) => laundryService.restoreLaundry(snapshot),
    onSettled: () => invalidateGroup(client, 'laundry'),
  });
}

/**
 * Laundry moves with optimistic updates and rollback.
 * Each move's mutateAsync(ids) resolves to { items, snapshot, skipped };
 * pass `snapshot` to restore.mutate(snapshot) for Undo.
 */
export function useLaundryAction() {
  const moveToHamper = useLaundryMove('moveToHamper');
  const startWash = useLaundryMove('startWash');
  const finishWash = useLaundryMove('finishWash');
  const markClean = useLaundryMove('markClean');
  const restore = useRestoreLaundry();
  return { moveToHamper, startWash, finishWash, markClean, restore };
}
