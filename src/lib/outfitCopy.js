import { CONDITION_BY_ID, OCCASION_BY_ID } from '@/data/taxonomy';
import { formatDate } from '@/lib/dates';

/**
 * Shared wording for outfit context lines, so Today and Outfits describe the same weather
 * and name saved outfits the same way.
 */
const CONDITION_PHRASES = {
  clear: 'clear skies',
  clouds: 'cloudy skies',
  rain: 'rain',
  drizzle: 'drizzle',
  storm: 'thunderstorms',
  snow: 'snow',
  wind: 'wind',
};

/**
 * Phrase for a weather condition in a sentence: "clear skies", "rain".
 * @param {string} condition taxonomy condition id
 */
export function conditionPhrase(condition) {
  return CONDITION_PHRASES[condition] ?? 'mixed weather';
}

/**
 * Lower-case condition label for chips: "rain", "cloudy".
 * @param {string} condition taxonomy condition id
 */
export function conditionWord(condition) {
  return (CONDITION_BY_ID[condition]?.label ?? 'Cloudy').toLowerCase();
}

/**
 * Default saved-outfit name like "Work, 7 Oct".
 * @param {string} occasion occasion id
 * @param {Date|string} [date]
 */
export function defaultOutfitName(occasion, date = new Date()) {
  return `${OCCASION_BY_ID[occasion]?.label ?? 'Outfit'}, ${formatDate(date, 'D MMM')}`;
}
