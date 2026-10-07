/**
 * Weather: deterministic simulated weather per city and date, or live weather
 * from OpenWeather (current + 5 day forecast) when a key is configured.
 * Live mode falls back to simulated weather on any failure.
 */
import { simulate } from './api/client';
import { CITY_PROFILES, nearestCityProfile } from '@/data/weather';
import { getSimulatedWeather, resolveCityProfile, simulateDay } from '@/lib/weatherSim';
import { dayjs } from '@/lib/dates';
import { upperFirst } from '@/lib/format';

const OPENWEATHER_BASE = 'https://api.openweathermap.org/data/2.5';
const LIVE_TIMEOUT_MS = 8000;
const SEVERITY = { clear: 0, clouds: 1, wind: 2, drizzle: 3, rain: 4, snow: 5, storm: 6 };

function apiKey() {
  try {
    return import.meta.env?.OPENWEATHER_API_KEY || '';
  } catch {
    return '';
  }
}

/** True when an OpenWeather key is configured, so the UI can offer live weather. */
export function isLiveWeatherAvailable() {
  return Boolean(apiKey());
}

/** Maps an OpenWeather condition id (and wind) to our condition ids. */
function mapCondition(entry, windKph = 0) {
  const id = entry?.weather?.[0]?.id ?? 800;
  let condition;
  if (id >= 200 && id < 300) condition = 'storm';
  else if (id >= 300 && id < 400) condition = 'drizzle';
  else if (id >= 500 && id < 600) condition = 'rain';
  else if (id >= 600 && id < 700) condition = 'snow';
  else if (id === 800) condition = 'clear';
  else condition = 'clouds';
  if ((condition === 'clear' || condition === 'clouds') && windKph >= 36) condition = 'wind';
  return condition;
}

const localDate = (unixSeconds, offsetSeconds) => new Date((unixSeconds + offsetSeconds) * 1000).toISOString().slice(0, 10);
const localHour = (unixSeconds, offsetSeconds) => new Date((unixSeconds + offsetSeconds) * 1000).getUTCHours();

async function fetchJson(url, signal) {
  const response = await fetch(url, { signal });
  if (!response.ok) throw new Error(`OpenWeather responded with ${response.status}`);
  return response.json();
}

/**
 * Live weather from OpenWeather. Throws on any failure.
 * @param {{ city?: string, coords?: { lat: number, lon: number } }} options
 */
async function fetchLiveWeather({ city, coords }) {
  const key = apiKey();
  if (!key) throw new Error('No OpenWeather key configured');
  const profile = coords ? nearestCityProfile(coords) : resolveCityProfile(city);
  const lat = coords?.lat ?? profile.lat;
  const lon = coords?.lon ?? profile.lon;
  const query = `lat=${lat}&lon=${lon}&units=metric&appid=${encodeURIComponent(key)}`;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), LIVE_TIMEOUT_MS);
  let current;
  let forecast;
  try {
    [current, forecast] = await Promise.all([
      fetchJson(`${OPENWEATHER_BASE}/weather?${query}`, controller.signal),
      fetchJson(`${OPENWEATHER_BASE}/forecast?${query}`, controller.signal),
    ]);
  } finally {
    clearTimeout(timer);
  }

  const offset = Number(forecast?.city?.timezone ?? current?.timezone ?? 0);
  const entries = Array.isArray(forecast?.list) ? forecast.list : [];
  if (!current?.main || entries.length === 0) throw new Error('Unexpected OpenWeather response');

  const windKph = Math.round((current.wind?.speed ?? 0) * 3.6);
  const tempC = Math.round(current.main.temp);
  const todayKey = localDate(current.dt, offset);
  const todayEntries = entries.filter((e) => localDate(e.dt, offset) === todayKey);
  const todayTemps = [current.main.temp, current.main.temp_max, current.main.temp_min, ...todayEntries.map((e) => e.main.temp)];

  const byDay = new Map();
  for (const entry of entries) {
    const key = localDate(entry.dt, offset);
    if (!byDay.has(key)) byDay.set(key, []);
    byDay.get(key).push(entry);
  }
  const days = [...byDay.entries()]
    .filter(([key]) => key >= todayKey)
    .map(([date, list]) => {
      const daytime = list.filter((e) => {
        const h = localHour(e.dt, offset);
        return h >= 9 && h <= 18;
      });
      const pool = daytime.length > 0 ? daytime : list;
      const condition = pool
        .map((e) => mapCondition(e, (e.wind?.speed ?? 0) * 3.6))
        .reduce((worst, c) => (SEVERITY[c] > SEVERITY[worst] ? c : worst), 'clear');
      return {
        date,
        highC: Math.round(Math.max(...list.map((e) => e.main.temp_max ?? e.main.temp))),
        lowC: Math.round(Math.min(...list.map((e) => e.main.temp_min ?? e.main.temp))),
        condition,
        precipChance: Math.round(Math.max(0, ...list.map((e) => e.pop ?? 0)) * 100) / 100,
      };
    });
  if (days[0]?.date === todayKey) {
    days[0].highC = Math.round(Math.max(...todayTemps));
    days[0].lowC = Math.round(Math.min(...todayTemps));
  }
  // OpenWeather's free forecast covers about 5 days; pad to 7 with typical weather nearby.
  const padProfile = nearestCityProfile({ lat, lon });
  while (days.length < 7) {
    const date = dayjs(days[days.length - 1]?.date ?? todayKey).add(days.length === 0 ? 0 : 1, 'day');
    const sim = simulateDay(padProfile, date);
    days.push({ date: sim.date, highC: sim.highC, lowC: sim.lowC, condition: sim.condition, precipChance: sim.precipChance });
  }

  const condition = mapCondition(current, windKph);
  const now = new Date();
  return {
    source: 'live',
    city: current.name || profile.name,
    cityId: coords ? null : profile.id,
    country: current.sys?.country ?? profile.country,
    coords: { lat, lon },
    tempC,
    feelsLikeC: Math.round(current.main.feels_like ?? current.main.temp),
    highC: days[0].highC,
    lowC: days[0].lowC,
    condition,
    description: upperFirst(current.weather?.[0]?.description ?? ''),
    precipChance: Math.round(Math.max(0, ...entries.slice(0, 4).map((e) => e.pop ?? 0)) * 100) / 100,
    windKph,
    humidity: Math.round(current.main.humidity ?? 0),
    hourly: [
      { time: now.toISOString(), tempC, condition },
      ...entries.slice(0, 4).map((e) => ({
        time: new Date(e.dt * 1000).toISOString(),
        tempC: Math.round(e.main.temp),
        condition: mapCondition(e, (e.wind?.speed ?? 0) * 3.6),
      })),
    ],
    forecast: days.slice(0, 7),
    updatedAt: now.toISOString(),
  };
}

/**
 * Weather for a city. Simulated weather is deterministic per city and date.
 * Live weather needs OPENWEATHER_API_KEY; without it, or on any error, the
 * simulated result is returned with `source: 'simulated'` and a `fallbackReason`.
 * Does not need a signed-in user.
 * @param {{ city?: string, source?: 'simulated'|'live', coords?: { lat: number, lon: number }|null }} [params]
 */
export function getWeather({ city, source = 'simulated', coords = null } = {}) {
  return simulate(
    async () => {
      if (source === 'live') {
        try {
          return await fetchLiveWeather({ city, coords });
        } catch {
          const fallback = getSimulatedWeather({ city, now: new Date() });
          return {
            ...fallback,
            fallbackReason: isLiveWeatherAvailable()
              ? `Live weather is not available right now, so this is typical weather for ${fallback.city}.`
              : `Live weather needs an OpenWeather key, so this is typical weather for ${fallback.city}.`,
          };
        }
      }
      return getSimulatedWeather({ city, now: new Date() });
    },
    { latency: source === 'live' ? 'instant' : undefined },
  );
}

/**
 * Cities with climate profiles, for the city picker.
 * @returns {Promise<{ id: string, name: string, country: string, lat: number, lon: number }[]>}
 */
export function listCities() {
  return simulate(() => CITY_PROFILES.map(({ id, name, country, lat, lon }) => ({ id, name, country, lat, lon })), {
    latency: 'fast',
  });
}
