import { daysBetween } from './dates';
import { TYPE_TO_CATEGORY } from '@/data/taxonomy';

/**
 * How many wears a garment type usually takes before it needs washing.
 * `null` means the type is not laundered (shoes, accessories, leather).
 */
export const DEFAULT_WASH_AFTER = {
  't-shirt': 1,
  tank: 1,
  shirt: 2,
  polo: 2,
  'long-sleeve': 2,
  sweatshirt: 3,
  hoodie: 4,
  sweater: 5,
  jeans: 6,
  chinos: 4,
  trousers: 4,
  'cargo pants': 5,
  shorts: 3,
  sweatpants: 3,
  leggings: 1,
  skirt: 3,
  jacket: 8,
  bomber: 8,
  'denim jacket': 10,
  'leather jacket': null,
  windbreaker: 8,
  blazer: 10,
  cardigan: 5,
  coat: 12,
  parka: 12,
};

const UNLAUNDERED_CATEGORIES = new Set(['footwear', 'accessory']);

/** Fallback when a type is unknown, by category. */
const CATEGORY_WASH_AFTER = { top: 2, bottom: 4, outerwear: 8, footwear: null, accessory: null };

/**
 * Default wash-after value for a type (and optional category).
 * @param {string|null|undefined} type
 * @param {string} [category]
 * @returns {number|null}
 */
export function defaultWashAfter(type, category) {
  const resolvedCategory = category ?? TYPE_TO_CATEGORY[type];
  if (UNLAUNDERED_CATEGORIES.has(resolvedCategory)) return null;
  if (type && Object.prototype.hasOwnProperty.call(DEFAULT_WASH_AFTER, type)) return DEFAULT_WASH_AFTER[type];
  return CATEGORY_WASH_AFTER[resolvedCategory] ?? null;
}

/**
 * True when the item goes through the laundry at all.
 * @param {{ laundry?: { washAfter?: number|null } }} item
 */
export function isWashable(item) {
  const washAfter = item?.laundry?.washAfter;
  return typeof washAfter === 'number' && washAfter > 0;
}

/**
 * Wears left before the item should be washed (0 when due), or null if not washable.
 * @param {object} item
 * @returns {number|null}
 */
export function wearsLeft(item) {
  if (!isWashable(item)) return null;
  return Math.max(0, item.laundry.washAfter - (item.laundry.wearsSinceWash ?? 0));
}

/**
 * Records one wear on an item and returns the updated copy (the input is not mutated).
 * Washable items that reach their wash-after count move from clean to the hamper.
 * @param {object} item
 * @param {Date|string} [at] when it was worn
 * @returns {object}
 */
export function applyWear(item, at = new Date()) {
  const wornAt = new Date(at).toISOString();
  const laundry = { ...item.laundry };
  if (isWashable(item)) {
    laundry.wearsSinceWash = (laundry.wearsSinceWash ?? 0) + 1;
    if (laundry.status === 'clean' && laundry.wearsSinceWash >= laundry.washAfter) {
      laundry.status = 'hamper';
      laundry.since = wornAt;
    }
  }
  return {
    ...item,
    wearCount: (item.wearCount ?? 0) + 1,
    lastWornAt: wornAt,
    laundry,
  };
}

/**
 * Returns a copy of the item with a new laundry status.
 * Clean resets the wear counter; other moves keep it.
 * @param {object} item
 * @param {'clean'|'hamper'|'washing'} status
 * @param {Date|string} [at]
 */
export function setLaundryStatus(item, status, at = new Date()) {
  const since = new Date(at).toISOString();
  const laundry = { ...item.laundry, status, since };
  if (status === 'clean') laundry.wearsSinceWash = 0;
  return { ...item, laundry };
}

/**
 * Whole days the item has been in its current laundry state.
 * @param {object} item
 * @param {Date|string} [now]
 */
export function daysInStatus(item, now = new Date()) {
  const since = item?.laundry?.since;
  if (!since) return 0;
  return Math.max(0, daysBetween(since, now));
}

/**
 * True when an item has waited in the hamper for `urgentAfterDays` days or more.
 * @param {object} item
 * @param {number} [urgentAfterDays]
 * @param {Date|string} [now]
 */
export function isUrgent(item, urgentAfterDays = 3, now = new Date()) {
  return item?.laundry?.status === 'hamper' && daysInStatus(item, now) >= urgentAfterDays;
}

function timesLabel(n) {
  if (n === 1) return 'once';
  if (n === 2) return 'twice';
  return `${n} times`;
}

/**
 * One short sentence that explains an item's laundry state.
 * Examples: "Worn 3 times since washing", "In the hamper for 4 days",
 * "In the wash since yesterday", "2 more wears before washing".
 * @param {object} item
 * @param {Date|string} [now]
 * @returns {string}
 */
export function laundryReason(item, now = new Date()) {
  const laundry = item?.laundry;
  if (!laundry) return '';
  if (!isWashable(item)) return 'Does not need washing';
  const days = daysInStatus(item, now);
  const worn = laundry.wearsSinceWash ?? 0;

  if (laundry.status === 'hamper') {
    if (days >= 2) return `In the hamper for ${days} days`;
    if (worn > 0) return `Worn ${timesLabel(worn)} since washing`;
    return days === 1 ? 'In the hamper since yesterday' : 'Added to the hamper today';
  }
  if (laundry.status === 'washing') {
    if (days === 0) return 'Went in the wash today';
    if (days === 1) return 'In the wash since yesterday';
    return `In the wash for ${days} days`;
  }
  const left = wearsLeft(item);
  if (worn === 0 && days <= 1 && item.createdAt && new Date(laundry.since) > new Date(item.createdAt)) {
    return 'Fresh from the wash';
  }
  if (left === 0) return 'Due for a wash';
  if (worn === 0) return 'Clean and ready';
  return `${left} more ${left === 1 ? 'wear' : 'wears'} before washing`;
}

/**
 * 0..1 share of the wash-after budget already used (1 = due). Null when not washable.
 * @param {object} item
 */
export function laundryProgress(item) {
  if (!isWashable(item)) return null;
  return Math.min(1, (item.laundry.wearsSinceWash ?? 0) / item.laundry.washAfter);
}
