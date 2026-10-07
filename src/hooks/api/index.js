/**
 * React Query hooks for the Alclo mock backend. UI code imports from '@/hooks/api'.
 */
export { queryClient } from './queryClient';
export { queryKeys } from './queryKeys';

export {
  useItems,
  useItem,
  useItemHistory,
  useCreateItem,
  useUpdateItem,
  useDeleteItems,
  useRestoreItems,
  useToggleFavorite,
  useImportSampleWardrobe,
} from './items';

export {
  useRecommendation,
  useAlternatives,
  useSuggestions,
  useOutfits,
  useOutfit,
  useCreateOutfit,
  useUpdateOutfit,
  useDeleteOutfit,
  useRestoreOutfit,
  useDuplicateOutfit,
} from './outfits';

export { useWearItems, useUndoWear, useTodayLog, useWearLogs } from './wear';

export { useLaundry, useLaundrySummary, useLaundryAction, useRestoreLaundry } from './laundry';

export { usePlans, useSetPlan, useClearPlan } from './planner';

export { useWeather, useCities, isLiveWeatherAvailable } from './weather';

export { useInsights } from './insights';

export { useDevSettings, useUpdateDevSettings, useResetDemoData } from './dev';

export {
  useUpdateProfile,
  useUpdatePreferences,
  useCompleteOnboarding,
  useChangePassword,
  useDeleteAccount,
  useRequestPasswordReset,
  useExportData,
} from './account';

export { ApiError, isApiError } from '@/services/api/client';
