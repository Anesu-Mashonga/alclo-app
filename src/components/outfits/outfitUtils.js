/**
 * Small pure helpers shared by the Outfits page components.
 */
import { CATEGORY_BY_ID, OCCASIONS, typeLabel } from '@/data/taxonomy';
import { addDays, daysSince, dayjs, todayISO, weekDates } from '@/lib/dates';
import { formatCount, joinList, lowerFirst, upperFirst } from '@/lib/format';

export const TABS = ['ideas', 'saved', 'planner'];
export const SAVED_SORTS = [
  { id: 'recent', label: 'Recently worn' },
  { id: 'most', label: 'Most worn' },
  { id: 'name', label: 'Name' },
];
export const BUILDER_SLOTS = [
  { id: 'outerwear', label: 'Outerwear', max: 1 },
  { id: 'top', label: 'Top', max: 1 },
  { id: 'bottom', label: 'Bottom', max: 1 },
  { id: 'footwear', label: 'Footwear', max: 1 },
  { id: 'accessory', label: 'Accessories', max: 3 },
];

export { conditionPhrase, defaultOutfitName } from '@/lib/outfitCopy';

/** Valid occasion id or the fallback. */
export function validOccasion(id, fallback = 'casual') {
  return OCCASIONS.some((option) => option.id === id) ? id : fallback;
}

/** Stable key for a set of items (ignores order). */
export function itemSetKey(itemIds = []) {
  return [...itemIds].sort().join('|');
}

/**
 * Short descriptive title for an unsaved idea from its core pieces' types:
 * "Polo, trousers and derbies".
 */
export function ideaTitle(items = []) {
  const core = ['top', 'bottom', 'footwear']
    .map((slot) => items.find((item) => item?.category === slot))
    .filter(Boolean)
    .map((item) => lowerFirst(typeLabel(item.type) || CATEGORY_BY_ID[item.category]?.singular || item.name));
  if (core.length === 0) return 'Outfit idea';
  return upperFirst(joinList(core));
}

/**
 * One line about pieces that are not ready: "Black chinos is in the hamper",
 * "2 pieces are in the laundry". Returns null when every piece is clean.
 */
export function laundryFlag(items = []) {
  const dirty = items.filter((item) => item && (item.laundry?.status ?? 'clean') !== 'clean');
  if (dirty.length === 0) return null;
  if (dirty.length === 1) {
    const [item] = dirty;
    return `${item.name} is ${item.laundry.status === 'washing' ? 'in the wash' : 'in the hamper'}`;
  }
  return `${dirty.length} pieces are in the laundry`;
}

/** "Worn 4 times, last 6 days ago" / "Worn once, last today" / "Not worn yet". */
export function wearSummary(outfit) {
  const count = outfit?.wearCount ?? 0;
  if (!count) return 'Not worn yet';
  const times = count === 1 ? 'once' : `${count} times`;
  const days = daysSince(outfit.lastWornAt);
  if (days === null) return `Worn ${times}`;
  const last = days === 0 ? 'today' : days === 1 ? 'yesterday' : `${days} days ago`;
  return `Worn ${times}, last ${last}`;
}

/** Saved outfits sorted for the Saved tab. */
export function sortOutfits(outfits = [], sort = 'recent') {
  const list = [...outfits];
  if (sort === 'name') return list.sort((a, b) => a.name.localeCompare(b.name));
  if (sort === 'most') {
    return list.sort((a, b) => (b.wearCount ?? 0) - (a.wearCount ?? 0) || a.name.localeCompare(b.name));
  }
  // Recently worn first; never-worn outfits after, newest first.
  return list.sort((a, b) => {
    if (a.lastWornAt && b.lastWornAt) return b.lastWornAt.localeCompare(a.lastWornAt);
    if (a.lastWornAt) return -1;
    if (b.lastWornAt) return 1;
    return (b.createdAt ?? '').localeCompare(a.createdAt ?? '');
  });
}

/** Monday of the week for a URL value, falling back to this week. */
export function weekStartFrom(value) {
  const parsed = value ? dayjs(value, 'YYYY-MM-DD', true) : null;
  const base = parsed && parsed.isValid() ? parsed : dayjs();
  return base.startOf('week').format('YYYY-MM-DD');
}

/** "5 to 11 October", "28 September to 4 October", with the year when it is not this year. */
export function weekRangeLabel(monday) {
  const start = dayjs(monday);
  const end = start.add(6, 'day');
  const thisYear = dayjs().year();
  const yearSuffix = end.year() !== thisYear ? ` ${end.year()}` : '';
  if (start.month() === end.month()) return `${start.format('D')} to ${end.format('D MMMM')}${yearSuffix}`;
  const startYear = start.year() !== end.year() ? ` ${start.year()}` : '';
  return `${start.format('D MMMM')}${startYear} to ${end.format('D MMMM')}${yearSuffix}`;
}

/** The seven dates of a week (Monday first). */
export function datesOfWeek(monday) {
  return weekDates(monday);
}

/**
 * Days offered by "Plan for...": today and the next six days.
 * @returns {{ date: string, label: string, detail: string }[]}
 */
export function upcomingDays(count = 7) {
  const today = todayISO();
  return Array.from({ length: count }, (_, index) => {
    const date = addDays(today, index);
    const day = dayjs(date);
    let label = day.format('dddd');
    if (index === 0) label = 'Today';
    else if (index === 1) label = 'Tomorrow';
    return { date, label, detail: day.format('ddd D MMM') };
  });
}

/**
 * Weather-like object for a forecast day, so the engine dresses for that day's range.
 * Returns null when the forecast does not cover the date.
 */
export function weatherForDate(weather, date) {
  if (!weather) return null;
  if (date === todayISO()) return weather;
  const day = weather.forecast?.find((entry) => entry.date === date);
  if (!day) return null;
  return {
    source: weather.source,
    city: weather.city,
    tempC: Math.round((day.highC + day.lowC) / 2),
    feelsLikeC: Math.round((day.highC + day.lowC) / 2),
    highC: day.highC,
    lowC: day.lowC,
    condition: day.condition,
    precipChance: day.precipChance,
    windKph: weather.windKph,
    hourly: [],
    forecast: [],
  };
}

/** "3 pieces" */
export function piecesLabel(count) {
  return formatCount(count, 'piece');
}
