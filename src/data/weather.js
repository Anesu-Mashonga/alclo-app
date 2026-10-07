/**
 * Climate profiles for simulated weather. Each city has 12 monthly normals
 * (January first): average daily high and low in Celsius, the chance of a wet
 * day (0..1) and how windy the month tends to be (0..1).
 * Values are rounded climate normals, good enough for a believable demo.
 */

/** [highC, lowC, rainChance, windiness] -> object. */
const m = (highC, lowC, rainChance, windiness) => ({ highC, lowC, rainChance, windiness });

export const CITY_PROFILES = [
  {
    id: 'harare',
    name: 'Harare',
    country: 'Zimbabwe',
    lat: -17.8292,
    lon: 31.0522,
    timezone: 'Africa/Harare',
    months: [
      m(26, 16, 0.7, 0.25), m(26, 16, 0.62, 0.25), m(26, 14, 0.45, 0.25), m(26, 12, 0.2, 0.3),
      m(24, 9, 0.05, 0.3), m(22, 7, 0.03, 0.3), m(22, 7, 0.02, 0.35), m(24, 9, 0.02, 0.45),
      m(27, 12, 0.05, 0.5), m(29, 15, 0.15, 0.45), m(28, 16, 0.42, 0.35), m(26, 16, 0.65, 0.3),
    ],
  },
  {
    id: 'bulawayo',
    name: 'Bulawayo',
    country: 'Zimbabwe',
    lat: -20.1325,
    lon: 28.6265,
    timezone: 'Africa/Harare',
    months: [
      m(28, 16, 0.5, 0.3), m(27, 16, 0.45, 0.3), m(27, 15, 0.3, 0.3), m(26, 12, 0.12, 0.3),
      m(23, 9, 0.04, 0.3), m(21, 6, 0.02, 0.3), m(21, 6, 0.01, 0.35), m(24, 8, 0.02, 0.45),
      m(27, 12, 0.04, 0.5), m(29, 15, 0.12, 0.45), m(29, 16, 0.3, 0.35), m(28, 16, 0.45, 0.3),
    ],
  },
  {
    id: 'johannesburg',
    name: 'Johannesburg',
    country: 'South Africa',
    lat: -26.2041,
    lon: 28.0473,
    timezone: 'Africa/Johannesburg',
    months: [
      m(26, 15, 0.55, 0.3), m(25, 14, 0.5, 0.3), m(24, 13, 0.45, 0.3), m(21, 10, 0.3, 0.3),
      m(19, 6, 0.12, 0.3), m(16, 4, 0.05, 0.3), m(17, 4, 0.04, 0.35), m(20, 6, 0.05, 0.45),
      m(23, 9, 0.12, 0.5), m(25, 12, 0.3, 0.45), m(25, 13, 0.45, 0.35), m(26, 14, 0.5, 0.3),
    ],
  },
  {
    id: 'cape-town',
    name: 'Cape Town',
    country: 'South Africa',
    lat: -33.9249,
    lon: 18.4241,
    timezone: 'Africa/Johannesburg',
    months: [
      m(27, 16, 0.05, 0.7), m(27, 16, 0.06, 0.65), m(26, 15, 0.1, 0.55), m(23, 12, 0.25, 0.45),
      m(21, 10, 0.4, 0.45), m(18, 8, 0.5, 0.5), m(18, 7, 0.5, 0.5), m(18, 8, 0.45, 0.5),
      m(20, 9, 0.35, 0.55), m(22, 11, 0.2, 0.6), m(24, 13, 0.12, 0.65), m(26, 15, 0.08, 0.7),
    ],
  },
  {
    id: 'nairobi',
    name: 'Nairobi',
    country: 'Kenya',
    lat: -1.2921,
    lon: 36.8219,
    timezone: 'Africa/Nairobi',
    months: [
      m(26, 12, 0.2, 0.3), m(27, 12, 0.2, 0.3), m(26, 14, 0.35, 0.3), m(24, 15, 0.6, 0.25),
      m(22, 14, 0.5, 0.25), m(21, 12, 0.15, 0.3), m(21, 11, 0.12, 0.35), m(21, 11, 0.12, 0.35),
      m(24, 11, 0.12, 0.35), m(25, 13, 0.3, 0.3), m(23, 14, 0.55, 0.25), m(23, 13, 0.35, 0.25),
    ],
  },
  {
    id: 'lagos',
    name: 'Lagos',
    country: 'Nigeria',
    lat: 6.5244,
    lon: 3.3792,
    timezone: 'Africa/Lagos',
    months: [
      m(32, 23, 0.05, 0.2), m(33, 25, 0.1, 0.25), m(33, 25, 0.25, 0.3), m(32, 25, 0.4, 0.3),
      m(31, 24, 0.55, 0.25), m(29, 23, 0.7, 0.3), m(28, 23, 0.55, 0.35), m(28, 23, 0.4, 0.35),
      m(29, 23, 0.55, 0.3), m(30, 23, 0.5, 0.25), m(31, 24, 0.2, 0.2), m(32, 24, 0.05, 0.2),
    ],
  },
  {
    id: 'london',
    name: 'London',
    country: 'United Kingdom',
    lat: 51.5072,
    lon: -0.1276,
    timezone: 'Europe/London',
    months: [
      m(8, 2, 0.5, 0.6), m(9, 2, 0.42, 0.6), m(12, 4, 0.4, 0.55), m(15, 6, 0.38, 0.45),
      m(18, 9, 0.38, 0.4), m(21, 12, 0.35, 0.35), m(23, 14, 0.33, 0.35), m(23, 14, 0.35, 0.35),
      m(20, 11, 0.35, 0.4), m(16, 8, 0.45, 0.5), m(11, 5, 0.5, 0.55), m(9, 3, 0.5, 0.6),
    ],
  },
  {
    id: 'lisbon',
    name: 'Lisbon',
    country: 'Portugal',
    lat: 38.7223,
    lon: -9.1393,
    timezone: 'Europe/Lisbon',
    months: [
      m(15, 8, 0.4, 0.45), m(16, 9, 0.38, 0.45), m(19, 10, 0.3, 0.45), m(20, 12, 0.3, 0.45),
      m(23, 14, 0.2, 0.45), m(27, 17, 0.08, 0.45), m(28, 18, 0.03, 0.5), m(29, 18, 0.03, 0.5),
      m(27, 17, 0.12, 0.4), m(23, 15, 0.3, 0.4), m(18, 11, 0.4, 0.45), m(16, 9, 0.45, 0.45),
    ],
  },
  {
    id: 'new-york',
    name: 'New York',
    country: 'United States',
    lat: 40.7128,
    lon: -74.006,
    timezone: 'America/New_York',
    months: [
      m(4, -3, 0.35, 0.55), m(6, -2, 0.33, 0.55), m(10, 2, 0.37, 0.55), m(17, 7, 0.37, 0.5),
      m(22, 12, 0.37, 0.4), m(27, 18, 0.35, 0.35), m(29, 21, 0.35, 0.3), m(28, 20, 0.33, 0.3),
      m(24, 17, 0.3, 0.35), m(18, 10, 0.3, 0.4), m(12, 5, 0.32, 0.5), m(6, 0, 0.35, 0.55),
    ],
  },
  {
    id: 'toronto',
    name: 'Toronto',
    country: 'Canada',
    lat: 43.6532,
    lon: -79.3832,
    timezone: 'America/Toronto',
    months: [
      m(-1, -7, 0.4, 0.55), m(0, -6, 0.35, 0.55), m(5, -3, 0.35, 0.55), m(12, 3, 0.35, 0.5),
      m(19, 9, 0.35, 0.4), m(24, 14, 0.33, 0.35), m(27, 17, 0.3, 0.3), m(26, 16, 0.3, 0.3),
      m(21, 12, 0.3, 0.35), m(14, 6, 0.33, 0.45), m(7, 1, 0.38, 0.5), m(1, -4, 0.4, 0.55),
    ],
  },
  {
    id: 'tokyo',
    name: 'Tokyo',
    country: 'Japan',
    lat: 35.6762,
    lon: 139.6503,
    timezone: 'Asia/Tokyo',
    months: [
      m(10, 1, 0.15, 0.45), m(11, 2, 0.2, 0.45), m(14, 5, 0.3, 0.45), m(19, 10, 0.35, 0.4),
      m(23, 15, 0.38, 0.35), m(26, 19, 0.5, 0.3), m(30, 23, 0.45, 0.3), m(31, 24, 0.35, 0.35),
      m(27, 21, 0.45, 0.4), m(22, 15, 0.38, 0.35), m(17, 9, 0.25, 0.35), m(12, 4, 0.15, 0.4),
    ],
  },
  {
    id: 'sydney',
    name: 'Sydney',
    country: 'Australia',
    lat: -33.8688,
    lon: 151.2093,
    timezone: 'Australia/Sydney',
    months: [
      m(26, 19, 0.4, 0.45), m(26, 19, 0.42, 0.4), m(25, 18, 0.45, 0.4), m(23, 15, 0.4, 0.4),
      m(20, 12, 0.4, 0.4), m(18, 9, 0.4, 0.45), m(17, 8, 0.35, 0.5), m(18, 9, 0.3, 0.55),
      m(21, 11, 0.3, 0.55), m(22, 13, 0.35, 0.5), m(24, 16, 0.38, 0.5), m(25, 18, 0.38, 0.45),
    ],
  },
];

export const DEFAULT_CITY = 'Harare';

/** Short descriptions per condition; one is picked deterministically per day. */
export const CONDITION_DESCRIPTIONS = {
  clear: ['Clear skies', 'Sunny and dry', 'Bright sunshine', 'Clear and calm'],
  clouds: ['Partly cloudy', 'Mostly cloudy', 'Overcast', 'Sunny spells between clouds'],
  rain: ['Steady rain', 'Showers on and off', 'Rain for most of the day', 'Heavy showers'],
  drizzle: ['Light drizzle', 'Patchy drizzle', 'Damp with light drizzle'],
  storm: ['Afternoon thunderstorms', 'Thunderstorms likely', 'Storms building later'],
  snow: ['Light snow', 'Snow showers', 'Flurries through the day'],
  wind: ['Breezy', 'Gusty winds', 'Strong winds at times'],
};

/**
 * Finds a city profile by id or name (case-insensitive).
 * @param {string} cityOrId
 */
export function findCityProfile(cityOrId) {
  if (!cityOrId) return undefined;
  const needle = String(cityOrId).trim().toLowerCase();
  return CITY_PROFILES.find((city) => city.id === needle || city.name.toLowerCase() === needle);
}

/**
 * The profile closest to a coordinate (for padding live forecasts).
 * @param {{ lat: number, lon: number }} coords
 */
export function nearestCityProfile(coords) {
  if (!coords) return CITY_PROFILES[0];
  let best = CITY_PROFILES[0];
  let bestDistance = Infinity;
  for (const city of CITY_PROFILES) {
    const d = (city.lat - coords.lat) ** 2 + (city.lon - coords.lon) ** 2;
    if (d < bestDistance) {
      best = city;
      bestDistance = d;
    }
  }
  return best;
}
