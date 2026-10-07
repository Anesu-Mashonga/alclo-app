/**
 * Deterministic simulated weather. The same city and date always produce the
 * same day, so the demo is stable across reloads and tests, while values still
 * vary believably around each city's monthly climate normals.
 */
import { CITY_PROFILES, CONDITION_DESCRIPTIONS, findCityProfile } from '@/data/weather';
import { hashString, mulberry32, seededUnit } from './random';
import { dayjs, toISODate } from './dates';

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

/** Smooth per-day noise in [-1, 1] so warm and cool spells last a few days. */
function smoothNoise(key, dayIndex) {
  const n = (i) => seededUnit(`${key}:${i}`) * 2 - 1;
  return (n(dayIndex - 2) + 2 * n(dayIndex - 1) + 3 * n(dayIndex) + 2 * n(dayIndex + 1) + n(dayIndex + 2)) / 9 * 1.9;
}

/** Month normals blended with the neighbouring month so values change gradually. */
function normalsFor(profile, iso) {
  const d = dayjs(iso);
  const month = d.month();
  const position = (d.date() - 0.5) / d.daysInMonth();
  const neighbour = position < 0.5 ? (month + 11) % 12 : (month + 1) % 12;
  const weight = Math.abs(position - 0.5);
  const a = profile.months[month];
  const b = profile.months[neighbour];
  const mix = (key) => a[key] * (1 - weight) + b[key] * weight;
  return {
    highC: mix('highC'),
    lowC: mix('lowC'),
    rainChance: mix('rainChance'),
    windiness: mix('windiness'),
  };
}

function dayIndexOf(iso) {
  const [y, mo, d] = iso.split('-').map(Number);
  return Math.round(Date.UTC(y, mo - 1, d) / 86400000);
}

/**
 * Resolves a city name or id to a profile (Harare when unknown).
 * @param {string} [city]
 */
export function resolveCityProfile(city) {
  return findCityProfile(city) ?? CITY_PROFILES[0];
}

/**
 * Simulates one day for a city profile.
 * @param {object} profile entry from CITY_PROFILES
 * @param {Date|string} date
 * @returns {{ date: string, highC: number, lowC: number, condition: string, precipChance: number,
 *   windKph: number, humidity: number, description: string }}
 */
export function simulateDay(profile, date) {
  const iso = toISODate(date);
  const dayIndex = dayIndexOf(iso);
  const rng = mulberry32(hashString(`${profile.id}:${iso}`));
  const normals = normalsFor(profile, iso);

  const anomaly = smoothNoise(`${profile.id}:temp`, dayIndex) * 3.2 + (rng() - 0.5) * 1.6;
  let highC = normals.highC + anomaly;
  let lowC = normals.lowC + anomaly * 0.7 + (rng() - 0.5) * 1.2;

  const wetness = smoothNoise(`${profile.id}:wet`, dayIndex);
  const baseChance = clamp(normals.rainChance + wetness * 0.18 - anomaly * 0.015 + (rng() - 0.5) * 0.08, 0.01, 0.95);

  let condition;
  const roll = rng();
  if (roll < baseChance) {
    if (highC <= 2) condition = 'snow';
    else if (highC >= 22 && rng() < 0.35) condition = 'storm';
    else if (baseChance < 0.3 || rng() < 0.3) condition = 'drizzle';
    else condition = 'rain';
  } else {
    const windRoll = rng() * normals.windiness + wetness * 0.05;
    if (windRoll > 0.36) condition = 'wind';
    else if (rng() < 0.22 + baseChance * 0.9) condition = 'clouds';
    else condition = 'clear';
  }

  // Wet and cloudy days run a little cooler.
  const cooling = { rain: 2.5, storm: 1.5, drizzle: 1.2, snow: 1, clouds: 0.8, wind: 0.6, clear: 0 }[condition];
  highC -= cooling;
  lowC = Math.min(lowC, highC - 4);

  let precipChance;
  if (condition === 'rain' || condition === 'storm' || condition === 'snow') precipChance = 0.6 + rng() * 0.35;
  else if (condition === 'drizzle') precipChance = 0.4 + rng() * 0.3;
  else if (condition === 'clouds') precipChance = Math.min(0.35, baseChance * 0.6 + rng() * 0.1);
  else precipChance = Math.min(0.15, baseChance * 0.3);

  let windKph = 5 + normals.windiness * 18 + rng() * 10;
  if (condition === 'wind') windKph += 18 + rng() * 10;
  if (condition === 'storm') windKph += 12;

  const wet = ['rain', 'storm', 'drizzle', 'snow'].includes(condition);
  const humidity = clamp(32 + normals.rainChance * 45 + (wet ? 20 : 0) + rng() * 8, 15, 98);

  const options = CONDITION_DESCRIPTIONS[condition];
  const description = options[Math.floor(rng() * options.length)];

  return {
    date: iso,
    highC: Math.round(highC),
    lowC: Math.round(lowC),
    condition,
    precipChance: Math.round(precipChance * 100) / 100,
    windKph: Math.round(windKph),
    humidity: Math.round(humidity),
    description,
  };
}

/** 0..1 position in the daily temperature cycle (low near 06:00, high near 15:00). */
function diurnal(hour) {
  const h = ((hour % 24) + 24) % 24;
  if (h >= 6 && h <= 15) return (1 - Math.cos((Math.PI * (h - 6)) / 9)) / 2;
  const since = h > 15 ? h - 15 : h + 9;
  return (1 + Math.cos((Math.PI * since) / 15)) / 2;
}

/**
 * Temperature at a fractional hour for a simulated day.
 * @param {{ highC: number, lowC: number }} day
 * @param {number} hour 0..24
 */
export function temperatureAt(day, hour) {
  return day.lowC + (day.highC - day.lowC) * diurnal(hour);
}

/** Condition shown for a given hour of a simulated day. */
export function conditionAt(day, hour) {
  const h = ((hour % 24) + 24) % 24;
  if (day.condition === 'storm') return h >= 13 && h <= 20 ? 'storm' : 'clouds';
  if (day.condition === 'wind') return h >= 9 && h <= 19 ? 'wind' : 'clear';
  return day.condition;
}

/**
 * Full simulated Weather object for a city at a moment in time.
 * @param {{ city?: string, now?: Date|string }} [options]
 */
export function getSimulatedWeather({ city, now = new Date() } = {}) {
  const profile = resolveCityProfile(city);
  const moment = dayjs(now);
  const today = simulateDay(profile, moment);
  const hour = moment.hour() + moment.minute() / 60;
  const tempC = Math.round(temperatureAt(today, hour));

  let feelsLikeC = tempC;
  if (today.windKph > 20 && tempC < 16) feelsLikeC -= Math.round((today.windKph - 20) / 8) + 1;
  if (today.humidity > 70 && tempC >= 27) feelsLikeC += 2;

  const startHour = moment.startOf('hour');
  const hourly = Array.from({ length: 5 }, (_, i) => {
    const at = startHour.add(i * 3, 'hour');
    const day = i === 0 ? today : simulateDay(profile, at);
    const h = at.hour();
    return {
      time: at.toISOString(),
      tempC: Math.round(i === 0 ? tempC : temperatureAt(day, h)),
      condition: conditionAt(day, h),
    };
  });

  const forecast = Array.from({ length: 7 }, (_, i) => {
    const day = i === 0 ? today : simulateDay(profile, moment.add(i, 'day'));
    return {
      date: day.date,
      highC: day.highC,
      lowC: day.lowC,
      condition: day.condition,
      precipChance: day.precipChance,
    };
  });

  return {
    source: 'simulated',
    city: profile.name,
    cityId: profile.id,
    country: profile.country,
    coords: { lat: profile.lat, lon: profile.lon },
    tempC,
    feelsLikeC,
    highC: today.highC,
    lowC: today.lowC,
    condition: today.condition,
    description: today.description,
    precipChance: today.precipChance,
    windKph: today.windKph,
    humidity: today.humidity,
    hourly,
    forecast,
    updatedAt: moment.toISOString(),
  };
}

/**
 * A compact "dressing" weather for a past or future date at a given hour,
 * used to generate believable wear history.
 * @param {string} city
 * @param {Date|string} date
 * @param {number} [hour]
 */
export function simulatedWeatherAt(city, date, hour = 9) {
  const profile = resolveCityProfile(city);
  const day = simulateDay(profile, date);
  return {
    tempC: Math.round(temperatureAt(day, hour)),
    highC: day.highC,
    lowC: day.lowC,
    condition: day.condition,
    precipChance: day.precipChance,
    windKph: day.windKph,
  };
}
