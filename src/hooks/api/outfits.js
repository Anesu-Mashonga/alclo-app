import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as outfitService from '@/services/outfitService';
import { useAuth } from '@/context/AuthContext';
import { normalizeParams, queryKeys, weatherKey } from './queryKeys';
import { invalidateGroup } from './invalidate';

function useTempUnit() {
  const { user } = useAuth();
  return user?.preferences?.tempUnit ?? 'C';
}

/**
 * Recommended outfit. Keeps the previous outfit visible while a shuffle (new seed) loads.
 * Tip: pass `{ enabled: Boolean(weather) }` as options to wait for useWeather().
 * @param {{ occasion?: string, weather?: object, seed?: number, locked?: Record<string, string|string[]>,
 *   exclude?: string[] }} params
 * @param {object} [options] extra useQuery options
 */
export function useRecommendation(params = {}, options = {}) {
  const unit = useTempUnit();
  const { occasion, weather, seed = 0, locked, exclude } = params;
  return useQuery({
    queryKey: queryKeys.recommendation.detail(
      normalizeParams({ occasion, weather: weatherKey(weather), seed, locked, exclude, unit }),
    ),
    queryFn: () => outfitService.getRecommendation({ occasion, weather, seed, locked, exclude }),
    placeholderData: keepPreviousData,
    ...options,
  });
}

/**
 * Ranked clean alternatives for one slot.
 * @param {{ slot: string, occasion?: string, weather?: object, pickedIds?: string[], limit?: number }} params
 * @param {object} [options] e.g. { enabled: drawerOpen }
 */
export function useAlternatives(params = {}, options = {}) {
  const unit = useTempUnit();
  const { slot, occasion, weather, pickedIds, limit } = params;
  return useQuery({
    queryKey: queryKeys.alternatives.detail(
      normalizeParams({ slot, occasion, weather: weatherKey(weather), pickedIds, limit, unit }),
    ),
    queryFn: () => outfitService.getAlternatives({ slot, occasion, weather, pickedIds, limit }),
    enabled: Boolean(slot),
    ...options,
  });
}

/**
 * Several distinct outfit ideas.
 * Optional `seed` (batch number) and `avoid` (item ids already shown) fetch a fresh batch ("More ideas").
 * @param {{ occasion?: string, weather?: object, count?: number, seed?: number, avoid?: string[] }} params
 */
export function useSuggestions(params = {}, options = {}) {
  const unit = useTempUnit();
  const { occasion, weather, count, seed, avoid } = params;
  return useQuery({
    queryKey: queryKeys.suggestions.detail(
      normalizeParams({ occasion, weather: weatherKey(weather), count, seed, avoid, unit }),
    ),
    queryFn: () => outfitService.getSuggestions({ occasion, weather, count, seed, avoid }),
    placeholderData: keepPreviousData,
    ...options,
  });
}

/** Saved outfits with items and availability attached. */
export function useOutfits(options = {}) {
  return useQuery({
    queryKey: queryKeys.outfits.list(),
    queryFn: () => outfitService.listOutfits(),
    ...options,
  });
}

/** One saved outfit. */
export function useOutfit(id, options = {}) {
  return useQuery({
    queryKey: queryKeys.outfits.detail(id),
    queryFn: () => outfitService.getOutfit(id),
    enabled: Boolean(id),
    ...options,
  });
}

/** mutate({ name, itemIds, occasion, favorite? }) -> outfit. */
export function useCreateOutfit() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (values) => outfitService.createOutfit(values),
    onSuccess: (outfit) => client.setQueryData(queryKeys.outfits.detail(outfit.id), outfit),
    onSettled: () => invalidateGroup(client, 'outfits'),
  });
}

/** mutate({ id, patch }) -> outfit. Optimistic for the favourite flag. */
export function useUpdateOutfit() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({ id, patch }) => outfitService.updateOutfit(id, patch),
    onMutate: async ({ id, patch }) => {
      if (!patch || Object.keys(patch).some((key) => key !== 'favorite')) return {};
      await client.cancelQueries({ queryKey: queryKeys.outfits.all });
      const previous = client.getQueryData(queryKeys.outfits.list());
      client.setQueryData(queryKeys.outfits.list(), (list) =>
        list?.map((outfit) => (outfit.id === id ? { ...outfit, favorite: Boolean(patch.favorite) } : outfit)),
      );
      return { previous };
    },
    onError: (_error, _vars, context) => {
      if (context?.previous) client.setQueryData(queryKeys.outfits.list(), context.previous);
    },
    onSuccess: (outfit) => client.setQueryData(queryKeys.outfits.detail(outfit.id), outfit),
    onSettled: () => invalidateGroup(client, 'outfits'),
  });
}

/** mutate(id) -> outfit. */
export function useRestoreOutfit() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (id) => outfitService.restoreOutfit(id),
    onSettled: () => invalidateGroup(client, 'outfits'),
  });
}

/**
 * Soft delete with optimistic removal. mutateAsync(id) resolves to { id, outfit };
 * call `restore(id)` from an Undo action.
 */
export function useDeleteOutfit() {
  const client = useQueryClient();
  const restoreMutation = useRestoreOutfit();
  const mutation = useMutation({
    mutationFn: (id) => outfitService.deleteOutfit(id),
    onMutate: async (id) => {
      await client.cancelQueries({ queryKey: queryKeys.outfits.list() });
      const previous = client.getQueryData(queryKeys.outfits.list());
      client.setQueryData(queryKeys.outfits.list(), (list) => list?.filter((outfit) => outfit.id !== id));
      return { previous };
    },
    onError: (_error, _id, context) => {
      if (context?.previous) client.setQueryData(queryKeys.outfits.list(), context.previous);
    },
    onSettled: () => invalidateGroup(client, 'outfits'),
  });
  return { ...mutation, restore: (id) => restoreMutation.mutateAsync(id), restoreMutation };
}

/** mutate(id) -> the new copy. */
export function useDuplicateOutfit() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (id) => outfitService.duplicateOutfit(id),
    onSettled: () => invalidateGroup(client, 'outfits'),
  });
}
