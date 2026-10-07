/**
 * Recommendations (via lib/outfitEngine) and saved outfits CRUD.
 */
import { ApiError, assertValid, simulate } from './api/client';
import { insert, ready, requireUser, table, transaction, update } from './api/db';
import { activeItems, bySlot, decorateOutfit, ownedOutfit, prefsOf, toIdList } from './api/helpers';
import { OCCASION_BY_ID, SLOTS } from '@/data/taxonomy';
import { generateSuggestions, rankForSlot, recommendOutfit } from '@/lib/outfitEngine';
import { getSimulatedWeather } from '@/lib/weatherSim';
import { createId } from '@/lib/random';

const MAX_PER_SLOT = { outerwear: 1, top: 1, bottom: 1, footwear: 1, accessory: 3 };

function contextFor(user, { occasion, weather }) {
  const prefs = prefsOf(user);
  return {
    occasion: OCCASION_BY_ID[occasion] ? occasion : prefs.defaultOccasion,
    weather: weather ?? getSimulatedWeather({ city: prefs.city }),
    unit: prefs.tempUnit,
  };
}

/**
 * Today's recommended outfit for the signed-in user.
 * @param {{ occasion?: string, weather?: object, seed?: number, locked?: Record<string, string|string[]>,
 *   exclude?: string[] }} [params] weather defaults to simulated weather for the user's city.
 */
export function getRecommendation({ occasion, weather, seed = 0, locked = {}, exclude = [] } = {}) {
  return simulate(async () => {
    await ready();
    const user = requireUser();
    const ctx = contextFor(user, { occasion, weather });
    return recommendOutfit({
      items: activeItems(user.id),
      weather: ctx.weather,
      occasion: ctx.occasion,
      seed: Number(seed) || 0,
      locked: locked ?? {},
      exclude: toIdList(exclude),
      now: new Date(),
      unit: ctx.unit,
    });
  });
}

/**
 * Ranked clean alternatives for one slot, given the other picked items.
 * Items in `pickedIds` (including the current pick for this slot) are left out.
 * @param {{ slot: string, occasion?: string, weather?: object, pickedIds?: string[], limit?: number }} params
 * @returns {Promise<{ item: object, score: number, reasons: string[] }[]>}
 */
export function getAlternatives({ slot, occasion, weather, pickedIds = [], limit = 12 } = {}) {
  return simulate(async () => {
    await ready();
    const user = requireUser();
    if (!SLOTS.includes(slot)) throw new ApiError(422, 'validation', 'Choose a slot to swap.', { slot: 'Choose a slot.' });
    const ctx = contextFor(user, { occasion, weather });
    const items = activeItems(user.id);
    const ids = new Set(toIdList(pickedIds));
    const picked = items.filter((item) => ids.has(item.id) && item.category !== slot);
    return rankForSlot({
      items,
      slot,
      weather: ctx.weather,
      occasion: ctx.occasion,
      picked,
      exclude: [...ids],
      now: new Date(),
      unit: ctx.unit,
    }).slice(0, limit);
  });
}

/**
 * Several distinct outfit ideas for the same context.
 * `seed` (batch number) and `avoid` (item ids already shown) produce a fresh batch for "More ideas".
 * @param {{ occasion?: string, weather?: object, count?: number, seed?: number, avoid?: string[] }} [params]
 */
export function getSuggestions({ occasion, weather, count = 6, seed = 0, avoid = [] } = {}) {
  return simulate(async () => {
    await ready();
    const user = requireUser();
    const ctx = contextFor(user, { occasion, weather });
    return generateSuggestions({
      items: activeItems(user.id),
      weather: ctx.weather,
      occasion: ctx.occasion,
      count: Math.min(12, Math.max(1, Number(count) || 6)),
      now: new Date(),
      unit: ctx.unit,
      seed: Number(seed) || 0,
      avoid: toIdList(avoid),
    });
  });
}

/** Validates outfit fields against the user's items. Returns normalised fields. */
function normaliseOutfitInput(userId, input, base = null) {
  const has = (key) => Object.prototype.hasOwnProperty.call(input, key);
  const errors = {};

  const name = String((has('name') ? input.name : base?.name) ?? '').trim();
  if (!name) errors.name = 'Give this outfit a name.';
  else if (name.length > 50) errors.name = 'Keep the name under 50 characters.';

  const ids = toIdList(has('itemIds') ? input.itemIds : base?.itemIds);
  const byId = new Map(activeItems(userId).map((item) => [item.id, item]));
  const items = ids.map((id) => byId.get(id));
  let itemIds = ids;
  if (items.some((item) => !item)) {
    errors.itemIds = 'Some of these items no longer exist. Pick them again.';
  } else if (ids.length < 2) {
    errors.itemIds = 'Pick at least 2 items.';
  } else {
    const counts = {};
    for (const item of items) counts[item.category] = (counts[item.category] ?? 0) + 1;
    if (counts.accessory > MAX_PER_SLOT.accessory) errors.itemIds = 'Add up to 3 accessories.';
    else if (['outerwear', 'top', 'bottom', 'footwear'].some((slot) => (counts[slot] ?? 0) > 1)) {
      errors.itemIds = 'An outfit can have one top, one bottom, one pair of shoes and one outer layer.';
    } else {
      itemIds = [...items].sort(bySlot).map((item) => item.id);
    }
  }

  const occasion = has('occasion') ? input.occasion : (base?.occasion ?? 'casual');
  if (!OCCASION_BY_ID[occasion]) errors.occasion = 'Choose an occasion.';

  assertValid(errors);
  return {
    name,
    itemIds,
    occasion,
    favorite: Boolean(has('favorite') ? input.favorite : (base?.favorite ?? false)),
  };
}

/**
 * Saved outfits, most recently updated first, with items and availability attached.
 */
export function listOutfits() {
  return simulate(async () => {
    await ready();
    const user = requireUser();
    return table('outfits')
      .filter((outfit) => outfit.userId === user.id && !outfit.deletedAt)
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
      .map(decorateOutfit);
  });
}

/** One saved outfit (404 when missing or deleted). */
export function getOutfit(id) {
  return simulate(async () => {
    await ready();
    const user = requireUser();
    return decorateOutfit(ownedOutfit(user.id, id));
  });
}

/**
 * Saves an outfit. Rules: name 1-50 chars, at least 2 items, one per slot except up to 3 accessories.
 * @param {{ name: string, itemIds: string[], occasion?: string, favorite?: boolean }} values
 */
export function createOutfit(values = {}) {
  return simulate(async () => {
    await ready();
    const user = requireUser();
    const fields = normaliseOutfitInput(user.id, values);
    const now = new Date().toISOString();
    const outfit = {
      id: createId('out'),
      userId: user.id,
      ...fields,
      wearCount: 0,
      lastWornAt: null,
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
    };
    transaction(() => insert('outfits', outfit));
    return decorateOutfit(outfit);
  });
}

/**
 * Updates name, items, occasion or favourite.
 * @param {string} id
 * @param {{ name?: string, itemIds?: string[], occasion?: string, favorite?: boolean }} patch
 */
export function updateOutfit(id, patch = {}) {
  return simulate(async () => {
    await ready();
    const user = requireUser();
    const outfit = ownedOutfit(user.id, id);
    const fields = normaliseOutfitInput(user.id, patch, outfit);
    const next = transaction(() => update('outfits', outfit.id, { ...fields, updatedAt: new Date().toISOString() }));
    return decorateOutfit(next);
  });
}

/**
 * Soft-deletes an outfit. Use restoreOutfit(id) to undo.
 * @param {string} id
 * @returns {Promise<{ id: string, outfit: object }>}
 */
export function deleteOutfit(id) {
  return simulate(async () => {
    await ready();
    const user = requireUser();
    const outfit = ownedOutfit(user.id, id);
    const now = new Date().toISOString();
    const next = transaction(() => update('outfits', outfit.id, { deletedAt: now, updatedAt: now }));
    return { id: next.id, outfit: next };
  });
}

/** Restores a soft-deleted outfit. */
export function restoreOutfit(id) {
  return simulate(async () => {
    await ready();
    const user = requireUser();
    const outfit = ownedOutfit(user.id, id, { allowDeleted: true });
    const next = transaction(() => update('outfits', outfit.id, { deletedAt: null, updatedAt: new Date().toISOString() }));
    return decorateOutfit(next);
  });
}

/** Copies an outfit as "<name> (copy)" with fresh stats. */
export function duplicateOutfit(id) {
  return simulate(async () => {
    await ready();
    const user = requireUser();
    const source = ownedOutfit(user.id, id);
    const suffix = ' (copy)';
    const name = source.name.length + suffix.length > 50 ? `${source.name.slice(0, 50 - suffix.length).trim()}${suffix}` : `${source.name}${suffix}`;
    const now = new Date().toISOString();
    const outfit = {
      ...source,
      id: createId('out'),
      name,
      itemIds: [...source.itemIds],
      favorite: false,
      wearCount: 0,
      lastWornAt: null,
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
    };
    transaction(() => insert('outfits', outfit));
    return decorateOutfit(outfit);
  });
}
