/**
 * Small helpers shared by services: ownership checks, id lists and the
 * "resolved" shapes (outfits, logs and plans with their items attached).
 */
import { ApiError } from './client';
import { find, table } from './db';
import { DEFAULT_PREFERENCES } from '@/data/users';
import { SLOTS } from '@/data/taxonomy';

/** Preferences with defaults filled in. */
export function prefsOf(user) {
  return { ...DEFAULT_PREFERENCES, ...(user?.preferences ?? {}) };
}

/** Normalises a single id or a list into a unique array of strings. */
export function toIdList(ids) {
  const list = Array.isArray(ids) ? ids : ids ? [ids] : [];
  return [...new Set(list.filter((id) => typeof id === 'string' && id.length > 0))];
}

/** Every non-deleted item of a user. */
export function activeItems(userId) {
  return table('items').filter((item) => item.userId === userId && !item.deletedAt);
}

/** A user's item (deleted or not) or a 404. */
export function ownedItem(userId, id, { allowDeleted = false } = {}) {
  const item = find('items', id);
  if (!item || item.userId !== userId || (!allowDeleted && item.deletedAt)) {
    throw new ApiError(404, 'not_found', 'We could not find that item. It may have been deleted.');
  }
  return item;
}

/** A user's outfit or a 404. */
export function ownedOutfit(userId, id, { allowDeleted = false } = {}) {
  const outfit = find('outfits', id);
  if (!outfit || outfit.userId !== userId || (!allowDeleted && outfit.deletedAt)) {
    throw new ApiError(404, 'not_found', 'We could not find that outfit. It may have been deleted.');
  }
  return outfit;
}

const SLOT_INDEX = Object.fromEntries(SLOTS.map((slot, index) => [slot, index]));

/** Sorts items in outfit display order: outerwear, top, bottom, footwear, accessories. */
export function bySlot(a, b) {
  return (SLOT_INDEX[a.category] ?? 9) - (SLOT_INDEX[b.category] ?? 9);
}

/** Resolves ids to the user's non-deleted items, in slot order. */
export function resolveItems(userId, ids) {
  const byId = new Map(activeItems(userId).map((item) => [item.id, item]));
  return toIdList(ids)
    .map((id) => byId.get(id))
    .filter(Boolean)
    .sort(bySlot);
}

/**
 * Outfit with its items attached plus availability:
 * `items` (non-deleted, slot order), `missingCount` (deleted items),
 * `notCleanCount` (in hamper or wash) and `readyToWear`.
 */
export function decorateOutfit(outfit) {
  const items = resolveItems(outfit.userId, outfit.itemIds);
  const notCleanCount = items.filter((item) => (item.laundry?.status ?? 'clean') !== 'clean').length;
  const missingCount = outfit.itemIds.length - items.length;
  return { ...outfit, items, missingCount, notCleanCount, readyToWear: notCleanCount === 0 && items.length >= 2 };
}

/** Wear log with its items and outfit name attached. */
export function decorateLog(log) {
  const outfit = log.outfitId ? find('outfits', log.outfitId) : null;
  return {
    ...log,
    items: resolveItems(log.userId, log.itemIds),
    outfit: outfit && !outfit.deletedAt ? { id: outfit.id, name: outfit.name } : null,
  };
}

/** Plan with its items and outfit name attached. */
export function decoratePlan(plan) {
  const outfit = plan.outfitId ? find('outfits', plan.outfitId) : null;
  return {
    ...plan,
    items: resolveItems(plan.userId, plan.itemIds),
    outfit: outfit && !outfit.deletedAt ? { id: outfit.id, name: outfit.name } : null,
  };
}

/** Trimmed string or null. */
export function cleanString(value) {
  if (value === null || value === undefined) return null;
  const text = String(value).trim();
  return text.length > 0 ? text : null;
}
