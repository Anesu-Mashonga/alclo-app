import { useCallback } from 'react';
import {
  useClearPlan,
  useCreateOutfit,
  useDeleteOutfit,
  useDuplicateOutfit,
  useSetPlan,
  useWearItems,
} from '@/hooks/api';
import { useToast } from '@/context/ToastContext';
import { dayjs, todayISO } from '@/lib/dates';
import { joinList } from '@/lib/format';
import { useOutfitsPage } from './OutfitsContext';

/** "today", "tomorrow", "Thursday" or "Thu 15 Oct" for toasts. */
export function dayPhrase(date) {
  const today = todayISO();
  const diff = dayjs(date).diff(dayjs(today), 'day');
  if (diff === 0) return 'today';
  if (diff === 1) return 'tomorrow';
  if (diff > 1 && diff < 7) return dayjs(date).format('dddd');
  return dayjs(date).format('ddd D MMM');
}

function planSnapshot(plan) {
  if (!plan) return null;
  return {
    date: plan.date,
    outfitId: plan.outfitId ?? null,
    itemIds: plan.itemIds,
    occasion: plan.occasion,
    note: plan.note ?? '',
  };
}

/**
 * Outfit actions with feedback toasts and Undo.
 * Every function resolves to the mutation result, or null when it failed (the toast says why).
 */
export default function useOutfitActions() {
  const toast = useToast();
  const { goToTab, openBuilder } = useOutfitsPage();
  const wearItems = useWearItems();
  const createOutfit = useCreateOutfit();
  const deleteOutfit = useDeleteOutfit();
  const duplicateOutfit = useDuplicateOutfit();
  const setPlan = useSetPlan();
  const clearPlan = useClearPlan();

  const fail = useCallback((error, fallback) => toast.error(error?.message || fallback), [toast]);

  /** Logs items as worn today. */
  const wear = useCallback(
    async ({ itemIds, outfitId = null, occasion, weather = null }) => {
      try {
        const result = await wearItems.mutateAsync({ itemIds, outfitId, occasion, weather });
        const moved = result.movedToHamper ?? [];
        const extra =
          moved.length === 0
            ? ''
            : moved.length === 1
              ? `. ${moved[0].name} moved to the hamper`
              : `. ${joinList(moved.map((item) => item.name))} moved to the hamper`;
        toast.show({
          message: `Logged today's outfit${extra}`,
          action: {
            label: 'Undo',
            onClick: () =>
              wearItems
                .undo(result.log.id)
                .then(() => toast.show({ message: 'Removed from today' }))
                .catch((error) => fail(error, 'Could not undo that. Try again.')),
          },
        });
        return result;
      } catch (error) {
        fail(error, 'Could not log this outfit. Try again.');
        return null;
      }
    },
    [wearItems, toast, fail],
  );

  /** Saves a new outfit and offers a way to see it. */
  const save = useCallback(
    async ({ name, itemIds, occasion }, { notify = true } = {}) => {
      const outfit = await createOutfit.mutateAsync({ name, itemIds, occasion });
      if (notify) {
        toast.show({
          message: `Saved ${outfit.name}`,
          action: { label: 'View', onClick: () => goToTab('saved') },
          duration: 6000,
        });
      }
      return outfit;
    },
    [createOutfit, toast, goToTab],
  );

  /**
   * Plans an outfit (saved outfit or loose items) for a date. `previous` is the plan it replaces,
   * so Undo can put it back.
   */
  const plan = useCallback(
    async ({ date, outfitId = null, itemIds, occasion, note = '', name, previous = null }) => {
      try {
        const result = await setPlan.mutateAsync({ date, outfitId, itemIds, occasion, note });
        const what = name ?? result.outfit?.name ?? 'Outfit';
        const restore = planSnapshot(previous);
        toast.show({
          message: `${what} planned for ${dayPhrase(date)}`,
          action: {
            label: 'Undo',
            onClick: () => {
              const undo = restore ? setPlan.mutateAsync(restore) : clearPlan.mutateAsync(date);
              undo.catch((error) => fail(error, 'Could not undo that. Try again.'));
            },
          },
        });
        return result;
      } catch (error) {
        fail(error, 'Could not plan this outfit. Try again.');
        return null;
      }
    },
    [setPlan, clearPlan, toast, fail],
  );

  /** Clears the plan for a date with Undo. */
  const unplan = useCallback(
    async (date) => {
      try {
        const result = await clearPlan.mutateAsync(date);
        const restore = planSnapshot(result.previous);
        toast.show({
          message: `Cleared the plan for ${dayPhrase(date)}`,
          action: restore
            ? {
                label: 'Undo',
                onClick: () => setPlan.mutateAsync(restore).catch((error) => fail(error, 'Could not undo that.')),
              }
            : null,
        });
        return result;
      } catch (error) {
        fail(error, 'Could not clear this day. Try again.');
        return null;
      }
    },
    [clearPlan, setPlan, toast, fail],
  );

  /** Soft-deletes a saved outfit with Undo. */
  const remove = useCallback(
    async (outfit) => {
      try {
        await deleteOutfit.mutateAsync(outfit.id);
        toast.show({
          message: `Deleted ${outfit.name}`,
          action: {
            label: 'Undo',
            onClick: () => deleteOutfit.restore(outfit.id).catch((error) => fail(error, 'Could not restore it.')),
          },
        });
        return true;
      } catch (error) {
        fail(error, 'Could not delete this outfit. Try again.');
        return null;
      }
    },
    [deleteOutfit, toast, fail],
  );

  /** Copies a saved outfit and offers to edit the copy. */
  const duplicate = useCallback(
    async (outfit) => {
      try {
        const copy = await duplicateOutfit.mutateAsync(outfit.id);
        toast.show({
          message: `Saved a copy as ${copy.name}`,
          action: { label: 'Edit', onClick: () => openBuilder({ mode: 'edit', outfitId: copy.id }) },
        });
        return copy;
      } catch (error) {
        fail(error, 'Could not copy this outfit. Try again.');
        return null;
      }
    },
    [duplicateOutfit, toast, fail, openBuilder],
  );

  return {
    wear,
    save,
    plan,
    unplan,
    remove,
    duplicate,
    pending: {
      wear: wearItems.isPending,
      save: createOutfit.isPending,
      plan: setPlan.isPending,
    },
  };
}
