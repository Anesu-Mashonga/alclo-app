import { keepPreviousData, useQuery } from '@tanstack/react-query';
import * as insightsService from '@/services/insightsService';
import { queryKeys } from './queryKeys';

/**
 * Wardrobe insights for a range. Accepts a number of days or { rangeDays }.
 * Keeps the previous range on screen while a new one loads.
 * @param {number|{ rangeDays?: number }} [range]
 */
export function useInsights(range = 30, options = {}) {
  const rangeDays = typeof range === 'number' ? range : (range?.rangeDays ?? 30);
  return useQuery({
    queryKey: queryKeys.insights.detail(rangeDays),
    queryFn: () => insightsService.getInsights({ rangeDays }),
    placeholderData: keepPreviousData,
    ...options,
  });
}
