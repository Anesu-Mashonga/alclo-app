import { useState, useEffect, useCallback } from 'react';
import { weatherService } from '../services/weatherService.js';

export function useWeather() {
  const [weather, setWeather] = useState(null);
  const [locationName, setLocationName] = useState('Your Location');
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    setLoading(true);
    const res = await weatherService.getCurrentWeather();
    if (res.success) {
      setWeather(res.data.weather);
      setLocationName(res.data.locationName);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return { weather, locationName, loading, refresh: fetch };
}
