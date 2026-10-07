import { useCallback } from 'react';
import { useDeleteItems, useLaundryAction, useToggleFavorite, useWearItems } from '@/hooks/api';
import { useToast } from '@/context/ToastContext';
import { isWashable } from '@/lib/laundry';

const asList = (items) => (Array.isArray(items) ? items : [items]).filter(Boolean);

/** "Navy chinos" for one item, "3 pieces" for several. */
export function describeItems(items) {
  const list = asList(items);
  return list.length === 1 ? list[0].name : `${list.length} pieces`;
}

const errorMessage = (error, fallback) => error?.message || fallback;

/** One sentence reads without a full stop; two or more all get one. */
const sentences = (parts) => {
  const list = parts.filter(Boolean);
  return list.length > 1 ? `${list.join('. ')}.` : (list[0] ?? '');
};

/**
 * Item actions shared by the wardrobe grid, list rows, bulk bar and item drawer.
 * Every action updates optimistically through the hooks and shows a toast; moves,
 * wears and deletes offer Undo (also Ctrl/Cmd+Z while the toast is visible).
 */
export default function useItemActions() {
  const toast = useToast();
  const favorite = useToggleFavorite();
  const wear = useWearItems();
  const laundry = useLaundryAction();
  const remove = useDeleteItems();

  const { mutate: mutateFavorite } = favorite;
  const { mutateAsync: wearAsync, undo: undoWear } = wear;
  const { moveToHamper, markClean: markCleanMutation, restore: restoreLaundry } = laundry;
  const { mutateAsync: deleteAsync, restore: restoreItems } = remove;

  const undoFailed = useCallback(
    (error) => toast.error(errorMessage(error, 'Could not undo that. Try again.')),
    [toast],
  );

  const toggleFavorite = useCallback(
    (item) => {
      const value = !item.favorite;
      mutateFavorite(
        { id: item.id, value },
        { onError: (error) => toast.error(errorMessage(error, 'Could not update favourites. Try again.')) },
      );
      return value;
    },
    [mutateFavorite, toast],
  );

  const wearToday = useCallback(
    async (items, { occasion } = {}) => {
      const list = asList(items);
      if (list.length === 0) return null;
      try {
        const result = await wearAsync({ itemIds: list.map((item) => item.id), occasion });
        const moved = result.movedToHamper?.length ?? 0;
        toast.show({
          message: sentences([
            `Logged ${describeItems(list)} as worn today`,
            moved > 0 && (list.length === 1 ? 'It moved to the hamper' : `${moved} moved to the hamper`),
          ]),
          action: { label: 'Undo', onClick: () => undoWear(result.log.id).catch(undoFailed) },
        });
        return result;
      } catch (error) {
        toast.error(errorMessage(error, 'Could not log that wear. Try again.'));
        return null;
      }
    },
    [toast, undoFailed, undoWear, wearAsync],
  );

  const sendToLaundry = useCallback(
    async (items) => {
      const list = asList(items);
      const washable = list.filter(isWashable);
      const movable = washable.filter((item) => item.laundry?.status !== 'hamper');
      if (washable.length === 0) {
        toast.info(
          list.length === 1
            ? `${list[0].name} does not go through the laundry`
            : 'Shoes and accessories do not go through the laundry',
        );
        return null;
      }
      if (movable.length === 0) {
        toast.info(list.length === 1 ? `${list[0].name} is already in the hamper` : 'These pieces are already in the hamper');
        return null;
      }
      try {
        const result = await moveToHamper.mutateAsync(movable.map((item) => item.id));
        const movedIds = new Set(result.items.map((item) => item.id));
        const moved = movable.filter((item) => movedIds.has(item.id));
        const skipped = list.length - moved.length;
        toast.show({
          message: sentences([
            `Moved ${describeItems(moved.length ? moved : movable)} to the hamper`,
            skipped > 0 && `Skipped ${skipped} that ${skipped === 1 ? 'was' : 'were'} already there or never need washing`,
          ]),
          action: { label: 'Undo', onClick: () => restoreLaundry.mutateAsync(result.snapshot).catch(undoFailed) },
        });
        return result;
      } catch (error) {
        toast.error(errorMessage(error, 'Could not move that to the hamper. Try again.'));
        return null;
      }
    },
    [moveToHamper, restoreLaundry, toast, undoFailed],
  );

  const markClean = useCallback(
    async (items) => {
      const list = asList(items).filter((item) => isWashable(item) && item.laundry?.status !== 'clean');
      if (list.length === 0) return null;
      try {
        const result = await markCleanMutation.mutateAsync(list.map((item) => item.id));
        toast.show({
          message: `Marked ${describeItems(list)} as clean`,
          action: { label: 'Undo', onClick: () => restoreLaundry.mutateAsync(result.snapshot).catch(undoFailed) },
        });
        return result;
      } catch (error) {
        toast.error(errorMessage(error, 'Could not mark that as clean. Try again.'));
        return null;
      }
    },
    [markCleanMutation, restoreLaundry, toast, undoFailed],
  );

  const deleteItems = useCallback(
    async (items) => {
      const list = asList(items);
      if (list.length === 0) return null;
      const ids = list.map((item) => item.id);
      try {
        const result = await deleteAsync(ids);
        toast.show({
          message: `Deleted ${describeItems(list)}`,
          action: { label: 'Undo', onClick: () => restoreItems(ids).catch(undoFailed) },
        });
        return result;
      } catch (error) {
        toast.error(errorMessage(error, 'Could not delete that. Try again.'));
        return null;
      }
    },
    [deleteAsync, restoreItems, toast, undoFailed],
  );

  return {
    toggleFavorite,
    wearToday,
    sendToLaundry,
    markClean,
    deleteItems,
    pending: {
      wear: wear.isPending,
      laundry: moveToHamper.isPending || markCleanMutation.isPending,
      delete: remove.isPending,
    },
  };
}
