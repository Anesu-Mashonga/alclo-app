import { useQuery } from '@tanstack/react-query';
import * as weatherService from '@/services/weatherService';
import { useAuth } from '@/context/AuthContext';
import { queryKeys } from './queryKeys';

const TEN_MINUTES = 10 * 60 * 1000;

/**
 * Weather for the signed-in user's city and source (from preferences).
 * `overrides` can force a city, source or coords (for previews in settings).
 * @param {{ city?: string, source?: 'simulated'|'live', coords?: { lat: number, lon: number }|null }} [overrides]
 * @param {object} [options] extra useQuery options
 */
export function useWeather(overrides = {}, options = {}) {
  const { user } = useAuth();
  const prefs = user?.preferences ?? {};
  const city = overrides.city ?? prefs.city ?? 'Harare';
  const source = overrides.source ?? prefs.weatherSource ?? 'simulated';
  const coords = overrides.coords ?? prefs.coords ?? null;
  return useQuery({
    queryKey: queryKeys.weather.current({ city, source, coords }),
    queryFn: () => weatherService.getWeather({ city, source, coords }),
    staleTime: TEN_MINUTES,
    refetchInterval: 3 * TEN_MINUTES,
    ...options,
  });
}

/** Cities with climate profiles, for pickers. */
export function useCities(options = {}) {
  return useQuery({
    queryKey: queryKeys.weather.cities(),
    queryFn: () => weatherService.listCities(),
    staleTime: Infinity,
    ...options,
  });
}

/** True when an OpenWeather key is configured, so live weather can be offered. */
export const isLiveWeatherAvailable = weatherService.isLiveWeatherAvailable;
