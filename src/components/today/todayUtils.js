/**
 * Small pure helpers for the Today page: greetings, slot grouping, lock maps and
 * the "try other weather" preview object.
 */
import { CONDITION_BY_ID, OCCASION_BY_ID, SLOTS } from '@/data/taxonomy';
import { daysSince } from '@/lib/dates';
import { conditionWord } from '@/lib/outfitCopy';
import { formatTemp } from '@/lib/format';

/** Core outfit slots in board order (accessories are shown in their own row). */
export const CORE_SLOTS = ['outerwear', 'top', 'bottom', 'footwear'];

export const SLOT_LABELS = {
  outerwear: 'Outerwear',
  top: 'Top',
  bottom: 'Bottom',
  footwear: 'Footwear',
  accessory: 'Accessory',
};

/** Plural nouns used in sentences ("No other clean tops right now"). */
export const SLOT_NOUNS = {
  outerwear: 'outer layers',
  top: 'tops',
  bottom: 'bottoms',
  footwear: 'shoes',
  accessory: 'accessories',
};

/** Days without wear before a clean piece shows up in "Not worn lately". */
export const NOT_WORN_DAYS = 21;

/** Temperature range of the weather preview slider, in Celsius. */
export const PREVIEW_MIN_C = -5;
export const PREVIEW_MAX_C = 40;

/** "Good morning" / "Good afternoon" / "Good evening". */
export function greetingFor(date = new Date()) {
  const hour = new Date(date).getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}

/** First name from a full name ("Anesu Mashonga" -> "Anesu"). */
export function firstName(name) {
  return String(name ?? '').trim().split(/\s+/)[0] ?? '';
}

/** Valid occasion id or null. */
export function parseOccasion(value) {
  return value && OCCASION_BY_ID[value] ? value : null;
}

/**
 * Groups items into outfit slots.
 * @param {object[]} items
 * @returns {{ outerwear: object|null, top: object|null, bottom: object|null, footwear: object|null, accessory: object[] }}
 */
export function slotsFromItems(items = []) {
  const slots = { outerwear: null, top: null, bottom: null, footwear: null, accessory: [] };
  for (const item of items.filter(Boolean)) {
    if (item.category === 'accessory') {
      if (slots.accessory.length < 3) slots.accessory.push(item);
    } else if (SLOTS.includes(item.category) && !slots[item.category]) {
      slots[item.category] = item;
    }
  }
  return slots;
}

/** Lock map (slot -> id, accessory -> ids) that keeps every given item. */
export function lockedFromItems(items = []) {
  const slots = slotsFromItems(items);
  const locked = {};
  for (const slot of CORE_SLOTS) if (slots[slot]) locked[slot] = slots[slot].id;
  if (slots.accessory.length > 0) locked.accessory = slots.accessory.map((item) => item.id);
  return locked;
}

/** Number of locked slots (the accessories row counts once). */
export function countLocks(locked = {}) {
  return Object.entries(locked).filter(([, value]) => (Array.isArray(value) ? value.length > 0 : Boolean(value))).length;
}

/** Order-independent key for an outfit's items, used to detect a shuffle that changed nothing. */
export function comboKey(itemIds = []) {
  return [...itemIds].sort().join('|');
}

/** Short phrase for a condition in "Built for 25°C and clear skies". */
export { conditionPhrase, conditionWord, defaultOutfitName } from '@/lib/outfitCopy';

/** Parses the preview params from the URL, or null when not previewing. */
export function parsePreview(searchParams) {
  const rawTemp = searchParams.get('temp');
  const condition = searchParams.get('condition');
  if (rawTemp === null || !condition || !CONDITION_BY_ID[condition]) return null;
  const tempC = Number(rawTemp);
  if (!Number.isFinite(tempC)) return null;
  return { tempC: Math.min(PREVIEW_MAX_C, Math.max(PREVIEW_MIN_C, Math.round(tempC))), condition };
}

const WET = new Set(['rain', 'drizzle', 'storm', 'snow']);

/**
 * Builds a full weather object for a "what if" preview from the real weather.
 * The day is flat (high = current) so the engine dresses for exactly that temperature.
 */
export function buildPreviewWeather(base, { tempC, condition }) {
  return {
    ...(base ?? {}),
    source: 'preview',
    tempC,
    feelsLikeC: tempC,
    highC: tempC,
    lowC: tempC - 3,
    condition,
    description: CONDITION_BY_ID[condition]?.label ?? 'Cloudy',
    precipChance: WET.has(condition) ? 0.85 : condition === 'clouds' ? 0.2 : 0.05,
    windKph: condition === 'wind' ? 42 : condition === 'storm' ? 30 : 10,
    hourly: [],
    forecast: [],
  };
}

/** "8°C, rain" */
export function previewLabel(preview, unit = 'C') {
  return `${formatTemp(preview.tempC, unit)}, ${conditionWord(preview.condition)}`;
}

const MAX_SHOWN = 12;

/** Clean pieces not worn in 21+ days (never-worn pieces count too), longest first. */
export function selectNotWornLately(items = [], now = new Date()) {
  return items
    .filter((item) => !item.deletedAt && (item.laundry?.status ?? 'clean') === 'clean')
    .map((item) => ({ item, days: item.lastWornAt ? daysSince(item.lastWornAt, now) : null }))
    .filter(({ days }) => days === null || days >= NOT_WORN_DAYS)
    .sort((a, b) => (b.days ?? Infinity) - (a.days ?? Infinity) || a.item.name.localeCompare(b.item.name))
    .slice(0, MAX_SHOWN);
}
