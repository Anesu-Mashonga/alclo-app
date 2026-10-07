import { queryKeys } from './queryKeys';

/**
 * Which caches depend on which changes. Mutations invalidate every dependent
 * domain so all screens stay in sync (items <-> laundry <-> recommendations
 * <-> insights <-> wear <-> outfits).
 */
export const DEPENDENTS = {
  items: [
    queryKeys.items.all,
    queryKeys.laundry.all,
    queryKeys.recommendation.all,
    queryKeys.alternatives.all,
    queryKeys.suggestions.all,
    queryKeys.insights.all,
    queryKeys.outfits.all,
    queryKeys.plans.all,
    queryKeys.wear.all,
  ],
  laundry: [
    queryKeys.items.all,
    queryKeys.laundry.all,
    queryKeys.recommendation.all,
    queryKeys.alternatives.all,
    queryKeys.suggestions.all,
    queryKeys.outfits.all,
    queryKeys.plans.all,
    queryKeys.insights.all,
    // Wear logs carry their items' current laundry state (Today's worn card says what is in the hamper).
    queryKeys.wear.all,
  ],
  wear: [
    queryKeys.items.all,
    queryKeys.laundry.all,
    queryKeys.wear.all,
    queryKeys.recommendation.all,
    queryKeys.alternatives.all,
    queryKeys.suggestions.all,
    queryKeys.insights.all,
    queryKeys.outfits.all,
    queryKeys.plans.all,
  ],
  outfits: [queryKeys.outfits.all, queryKeys.plans.all, queryKeys.wear.all],
  plans: [queryKeys.plans.all],
  preferences: [
    queryKeys.weather.all,
    queryKeys.recommendation.all,
    queryKeys.alternatives.all,
    queryKeys.suggestions.all,
    queryKeys.laundry.all,
    queryKeys.insights.all,
  ],
};

/**
 * Invalidates every key of a dependency group.
 * @param {import('@tanstack/react-query').QueryClient} client
 * @param {keyof typeof DEPENDENTS} group
 */
export function invalidateGroup(client, group) {
  return Promise.all(DEPENDENTS[group].map((queryKey) => client.invalidateQueries({ queryKey })));
}

/** Snapshot of every cached query under a prefix, for optimistic rollback. */
export function snapshotQueries(client, queryKey) {
  return client.getQueriesData({ queryKey });
}

/** Puts snapshotted query data back. */
export function restoreQueries(client, snapshot) {
  for (const [key, data] of snapshot ?? []) client.setQueryData(key, data);
}
