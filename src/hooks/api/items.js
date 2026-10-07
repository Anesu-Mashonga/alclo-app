import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as wardrobeService from '@/services/wardrobeService';
import { queryKeys } from './queryKeys';
import { invalidateGroup, restoreQueries, snapshotQueries } from './invalidate';

/** Applies `updater` to the given items in every cached list and detail. */
function patchCachedItems(client, ids, updater) {
  const idSet = new Set(ids);
  client.setQueriesData({ queryKey: queryKeys.items.lists() }, (data) =>
    data?.items ? { ...data, items: data.items.map((item) => (idSet.has(item.id) ? updater(item) : item)) } : data,
  );
  for (const id of idSet) {
    client.setQueryData(queryKeys.items.detail(id), (item) => (item ? updater(item) : item));
  }
}

/** Removes items from every cached list (used for optimistic deletes). */
function removeCachedItems(client, ids) {
  const idSet = new Set(ids);
  client.setQueriesData({ queryKey: queryKeys.items.lists() }, (data) => {
    if (!data?.items) return data;
    const items = data.items.filter((item) => !idSet.has(item.id));
    return { ...data, items, total: items.length };
  });
}

/**
 * Wardrobe list with filters. Keeps the previous result on screen while new filters load.
 * @param {{ q?: string, category?: string, colors?: string[], status?: string, occasion?: string,
 *   favorite?: boolean, sort?: string }} [filters]
 * @param {object} [options] extra useQuery options
 */
export function useItems(filters = {}, options = {}) {
  return useQuery({
    queryKey: queryKeys.items.list(filters),
    queryFn: () => wardrobeService.listItems(filters),
    placeholderData: keepPreviousData,
    ...options,
  });
}

/** One item; disabled while id is empty. */
export function useItem(id, options = {}) {
  return useQuery({
    queryKey: queryKeys.items.detail(id),
    queryFn: () => wardrobeService.getItem(id),
    enabled: Boolean(id),
    ...options,
  });
}

/** Wear logs that include an item. */
export function useItemHistory(id, options = {}) {
  return useQuery({
    queryKey: queryKeys.items.history(id),
    queryFn: () => wardrobeService.getItemHistory(id),
    enabled: Boolean(id),
    ...options,
  });
}

/** mutate(data) -> created item. */
export function useCreateItem() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (data) => wardrobeService.createItem(data),
    onSuccess: (item) => client.setQueryData(queryKeys.items.detail(item.id), item),
    onSettled: () => invalidateGroup(client, 'items'),
  });
}

/** mutate({ id, patch }) -> updated item. */
export function useUpdateItem() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({ id, patch }) => wardrobeService.updateItem(id, patch),
    onSuccess: (item) => client.setQueryData(queryKeys.items.detail(item.id), item),
    onSettled: () => invalidateGroup(client, 'items'),
  });
}

/** mutate(ids) -> { ids, items }. Restores soft-deleted items. */
export function useRestoreItems() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (ids) => wardrobeService.restoreItems(ids),
    onSettled: () => invalidateGroup(client, 'items'),
  });
}

/**
 * Soft delete with optimistic removal from lists.
 * mutateAsync(ids) resolves to { ids, items }; call `restore(ids)` from an Undo action.
 * @returns {import('@tanstack/react-query').UseMutationResult & { restore: (ids: string|string[]) => Promise<object>,
 *   restoreMutation: import('@tanstack/react-query').UseMutationResult }}
 */
export function useDeleteItems() {
  const client = useQueryClient();
  const restoreMutation = useRestoreItems();
  const mutation = useMutation({
    mutationFn: (ids) => wardrobeService.deleteItems(ids),
    onMutate: async (ids) => {
      await client.cancelQueries({ queryKey: queryKeys.items.lists() });
      const snapshot = snapshotQueries(client, queryKeys.items.lists());
      removeCachedItems(client, Array.isArray(ids) ? ids : [ids]);
      return { snapshot };
    },
    onError: (_error, _ids, context) => restoreQueries(client, context?.snapshot),
    onSettled: () => invalidateGroup(client, 'items'),
  });
  return { ...mutation, restore: (ids) => restoreMutation.mutateAsync(ids), restoreMutation };
}

/** Optimistic favourite toggle. mutate({ id, value }) where value is the new state. */
export function useToggleFavorite() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({ id, value }) => wardrobeService.toggleFavorite(id, value),
    onMutate: async ({ id, value }) => {
      await client.cancelQueries({ queryKey: queryKeys.items.all });
      const snapshot = snapshotQueries(client, queryKeys.items.all);
      patchCachedItems(client, [id], (item) => ({ ...item, favorite: typeof value === 'boolean' ? value : !item.favorite }));
      return { snapshot };
    },
    onError: (_error, _vars, context) => restoreQueries(client, context?.snapshot),
    onSettled: () =>
      Promise.all([
        client.invalidateQueries({ queryKey: queryKeys.items.all }),
        client.invalidateQueries({ queryKey: queryKeys.recommendation.all }),
        client.invalidateQueries({ queryKey: queryKeys.suggestions.all }),
        client.invalidateQueries({ queryKey: queryKeys.alternatives.all }),
        client.invalidateQueries({ queryKey: queryKeys.insights.all }),
      ]),
  });
}

/** mutate() -> { imported, items }. */
export function useImportSampleWardrobe() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: () => wardrobeService.importSampleWardrobe(),
    onSettled: () => invalidateGroup(client, 'items'),
  });
}

export { patchCachedItems };
