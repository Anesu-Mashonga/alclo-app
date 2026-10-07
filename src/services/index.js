/**
 * Service namespaces. UI code should use the React Query hooks in '@/hooks/api'
 * instead of calling services directly (AuthContext is the exception).
 */
export * as authService from './authService';
export * as wardrobeService from './wardrobeService';
export * as outfitService from './outfitService';
export * as wearService from './wearService';
export * as laundryService from './laundryService';
export * as plannerService from './plannerService';
export * as weatherService from './weatherService';
export * as insightsService from './insightsService';
export * as devService from './devService';
export { ApiError, isApiError } from './api/client';
