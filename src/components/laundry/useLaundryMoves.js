import { useCallback } from 'react';
import { queryClient, queryKeys, useLaundryAction } from '@/hooks/api';
import { useToast } from '@/context/ToastContext';
import { pieces, restoreOverview } from './laundryUtils';

/** Which mutation each move uses, which statuses it accepts, and how the toast reads. */
const MOVES = {
  wash: {
    mutation: 'startWash',
    from: ['hamper', 'clean'],
    one: (name) => `${name} is in the wash`,
    many: (count) => `Started a load with ${pieces(count)}`,
  },
  finish: {
    mutation: 'finishWash',
    from: ['washing'],
    one: (name) => `${name} is clean`,
    many: (count) => `Load done. ${pieces(count)} are clean`,
  },
  clean: {
    mutation: 'markClean',
    from: ['hamper', 'washing'],
    one: (name) => `Marked ${name} clean`,
    many: (count) => `Marked ${pieces(count)} clean`,
  },
  hamper: {
    mutation: 'moveToHamper',
    from: ['clean', 'washing'],
    one: (name) => `${name} is back in the hamper`,
    many: (count) => `Moved ${pieces(count)} back to the hamper`,
  },
};

/** Pieces a move can act on (the backend skips the rest anyway). */
export function eligibleFor(kind, items) {
  const { from } = MOVES[kind];
  return items.filter((item) => from.includes(item.laundry?.status));
}

/**
 * Laundry moves with toasts and Undo. `move(kind, items)` moves the pieces optimistically,
 * then shows "Started a load with 3 pieces" with an Undo action that puts every piece back
 * where it was (optimistic too, confirmed by the server restore).
 *
 * @param {{ onMoved?: (ids: string[]) => void }} [options]
 */
export default function useLaundryMoves({ onMoved } = {}) {
  const actions = useLaundryAction();
  const toast = useToast();
  const { restore } = actions;

  const undo = useCallback(
    (before, snapshot) => {
      if (!snapshot?.length) return;
      queryClient.cancelQueries({ queryKey: queryKeys.laundry.all });
      queryClient.setQueryData(queryKeys.laundry.overview(), (current) => restoreOverview(current, before, snapshot));
      restore.mutate(snapshot, {
        onSuccess: () =>
          toast.show({
            message: snapshot.length === 1 ? 'Moved it back' : `Moved ${pieces(snapshot.length)} back`,
          }),
        onError: (error) => toast.error(error?.message || 'Could not undo that move. Try again.'),
      });
    },
    [restore, toast],
  );

  const move = useCallback(
    async (kind, items) => {
      const config = MOVES[kind];
      const targets = eligibleFor(kind, items);
      if (!config || targets.length === 0) return null;
      const ids = targets.map((item) => item.id);
      const before = queryClient.getQueryData(queryKeys.laundry.overview());
      onMoved?.(ids);
      try {
        const result = await actions[config.mutation].mutateAsync(ids);
        const moved = result?.snapshot?.length ?? targets.length;
        if (moved === 0) return result;
        const message = moved === 1 ? config.one(targets[0].name) : config.many(moved);
        toast.show({
          message,
          action: {
            label: 'Undo',
            onClick: () => undo(before, result.snapshot),
          },
        });
        return result;
      } catch (error) {
        toast.error(error?.message || 'That move did not go through. Try again.');
        return null;
      }
    },
    [actions, onMoved, toast, undo],
  );

  return { move };
}
