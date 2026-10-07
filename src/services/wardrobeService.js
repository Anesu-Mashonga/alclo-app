/**
 * Wardrobe items: list with server-style filtering, sorting and facet counts,
 * CRUD with validation, soft delete and restore, favourites, sample import, history.
 */
import { ApiError, assertValid, simulate } from './api/client';
import { insert, ready, requireUser, table, transaction, update } from './api/db';
import { activeItems, cleanString, decorateLog, ownedItem, toIdList } from './api/helpers';
import { buildSampleItems } from './api/seed';
import {
  CATEGORIES,
  CATEGORY_BY_ID,
  COLOR_BY_ID,
  DEFAULT_WARMTH,
  LAUNDRY_STATUSES,
  OCCASION_BY_ID,
  TYPES,
  colorLabel,
  occasionLabel,
} from '@/data/taxonomy';
import { defaultWashAfter } from '@/lib/laundry';
import { createId } from '@/lib/random';

export const ITEM_SORTS = ['recent', 'most-worn', 'least-worn', 'last-worn', 'name'];
const MAX_IMAGE_LENGTH = 2_600_000;
const EDITABLE_FIELDS = [
  'name',
  'category',
  'type',
  'colors',
  'image',
  'occasions',
  'warmth',
  'waterproof',
  'favorite',
  'brand',
  'price',
  'notes',
  'washAfter',
];

/**
 * Validates item fields. `base` is the current item for updates (fields not in
 * `input` keep their value). Returns normalised fields or throws a 422.
 */
function normaliseItemInput(input, base = null) {
  const has = (key) => Object.prototype.hasOwnProperty.call(input, key);
  const pick = (key, fallback) => (has(key) ? input[key] : base ? base[key] : fallback);
  const errors = {};

  const name = String(pick('name', '') ?? '').trim();
  if (!name) errors.name = 'Give this item a name.';
  else if (name.length > 60) errors.name = 'Keep the name under 60 characters.';

  const category = pick('category', null);
  if (!CATEGORY_BY_ID[category]) errors.category = 'Choose a category.';

  let type = cleanString(pick('type', null));
  if (type) type = type.toLowerCase();
  if (type && CATEGORY_BY_ID[category] && !TYPES[category].includes(type)) {
    if (has('type')) errors.type = 'Choose a type that fits the category.';
    else type = null; // Category changed without a new type: clear the old one.
  }

  const rawColors = pick('colors', []);
  const colors = Array.isArray(rawColors) ? [...new Set(rawColors)] : [];
  if (colors.length === 0) errors.colors = 'Pick at least one colour.';
  else if (colors.some((id) => !COLOR_BY_ID[id])) errors.colors = 'Choose colours from the list.';
  else if (colors.length > 4) errors.colors = 'Pick up to 4 colours.';

  const rawOccasions = pick('occasions', ['casual']);
  const occasions = Array.isArray(rawOccasions) ? [...new Set(rawOccasions)] : [];
  if (occasions.some((id) => !OCCASION_BY_ID[id])) errors.occasions = 'Choose occasions from the list.';

  const warmthValue = pick('warmth', DEFAULT_WARMTH[type] ?? 3);
  const warmth = Number(warmthValue);
  if (!Number.isInteger(warmth) || warmth < 1 || warmth > 5) errors.warmth = 'Choose a warmth from 1 to 5.';

  const brand = cleanString(pick('brand', null));
  if (brand && brand.length > 40) errors.brand = 'Keep the brand under 40 characters.';

  const rawPrice = pick('price', null);
  let price = null;
  if (rawPrice !== null && rawPrice !== undefined && rawPrice !== '') {
    price = Number(rawPrice);
    if (!Number.isFinite(price) || price < 0) errors.price = 'Enter a price of 0 or more.';
    else if (price > 100000) errors.price = 'Enter a price under 100,000.';
    else price = Math.round(price * 100) / 100;
  }

  const notes = String(pick('notes', '') ?? '');
  if (notes.length > 500) errors.notes = 'Keep notes under 500 characters.';

  const image = pick('image', null) || null;
  if (image !== null) {
    if (typeof image !== 'string') errors.image = 'That photo could not be used.';
    else if (image.length > MAX_IMAGE_LENGTH) errors.image = 'That photo is too large to store. Try a smaller one.';
  }

  let washAfter;
  if (has('washAfter')) washAfter = input.washAfter;
  else if (base && !has('type') && !has('category')) washAfter = base.laundry?.washAfter ?? null;
  else washAfter = defaultWashAfter(type, category);
  if (washAfter === '' || washAfter === undefined) washAfter = null;
  if (washAfter !== null) {
    washAfter = Number(washAfter);
    if (!Number.isInteger(washAfter) || washAfter < 1 || washAfter > 30) {
      errors.washAfter = 'Use a whole number of wears from 1 to 30, or leave it empty.';
    }
  }

  assertValid(errors);
  return {
    name,
    category,
    type,
    colors,
    image,
    occasions,
    warmth,
    waterproof: Boolean(pick('waterproof', false)),
    favorite: Boolean(pick('favorite', false)),
    brand,
    price,
    notes: notes.trim(),
    washAfter,
  };
}

function matchesQuery(item, q) {
  const tokens = String(q ?? '')
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean);
  if (tokens.length === 0) return true;
  const haystack = [
    item.name,
    item.type,
    item.brand,
    item.notes,
    CATEGORY_BY_ID[item.category]?.label,
    CATEGORY_BY_ID[item.category]?.singular,
    ...(item.colors ?? []).map(colorLabel),
    ...(item.occasions ?? []).map(occasionLabel),
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
  return tokens.every((token) => haystack.includes(token));
}

function asList(value) {
  if (value === undefined || value === null || value === '' || value === 'all') return [];
  return Array.isArray(value) ? value.filter((v) => v && v !== 'all') : [value];
}

function statusMatches(item, statuses) {
  if (statuses.length === 0) return true;
  const status = item.laundry?.status ?? 'clean';
  return statuses.some((s) => (s === 'dirty' ? status !== 'clean' : s === status));
}

const SORTERS = {
  recent: (a, b) => b.createdAt.localeCompare(a.createdAt) || a.name.localeCompare(b.name),
  'most-worn': (a, b) => (b.wearCount ?? 0) - (a.wearCount ?? 0) || a.name.localeCompare(b.name),
  'least-worn': (a, b) => (a.wearCount ?? 0) - (b.wearCount ?? 0) || a.name.localeCompare(b.name),
  'last-worn': (a, b) => {
    if (!a.lastWornAt && !b.lastWornAt) return a.name.localeCompare(b.name);
    if (!a.lastWornAt) return 1;
    if (!b.lastWornAt) return -1;
    return b.lastWornAt.localeCompare(a.lastWornAt);
  },
  name: (a, b) => a.name.localeCompare(b.name, 'en', { sensitivity: 'base' }),
};

/**
 * Lists the signed-in user's items.
 * Facet counts follow the usual store pattern: `byCategory` and `all` apply every
 * filter except category, `byStatus` applies every filter except status, so chips
 * show how many results each choice would give.
 * @param {{ q?: string, category?: string|string[], colors?: string[], status?: string|string[],
 *   occasion?: string, favorite?: boolean, sort?: string }} [filters]
 * @returns {Promise<{ items: object[], total: number, counts: { all: number, favorites: number,
 *   byCategory: Record<string, number>, byStatus: Record<string, number> } }>}
 */
export function listItems(filters = {}) {
  return simulate(async () => {
    await ready();
    const user = requireUser();
    const { q, occasion, favorite, sort = 'recent' } = filters;
    const categories = asList(filters.category);
    const colors = asList(filters.colors);
    const statuses = asList(filters.status);
    if (!SORTERS[sort]) throw new ApiError(422, 'validation', 'That sort order is not available.', { sort: 'Choose a sort order.' });

    const base = activeItems(user.id).filter(
      (item) =>
        matchesQuery(item, q) &&
        (colors.length === 0 || (item.colors ?? []).some((c) => colors.includes(c))) &&
        (!occasion || occasion === 'all' || (item.occasions ?? []).includes(occasion)) &&
        (favorite !== true || item.favorite),
    );
    const inCategory = (item) => categories.length === 0 || categories.includes(item.category);

    const exceptCategory = base.filter((item) => statusMatches(item, statuses));
    const exceptStatus = base.filter(inCategory);
    const results = exceptCategory.filter(inCategory).sort(SORTERS[sort]);

    const byCategory = Object.fromEntries(CATEGORIES.map((c) => [c.id, 0]));
    for (const item of exceptCategory) byCategory[item.category] = (byCategory[item.category] ?? 0) + 1;
    const byStatus = Object.fromEntries(LAUNDRY_STATUSES.map((s) => [s.id, 0]));
    for (const item of exceptStatus) byStatus[item.laundry?.status ?? 'clean'] += 1;

    return {
      items: results,
      total: results.length,
      counts: {
        all: exceptCategory.length,
        favorites: activeItems(user.id).filter((item) => item.favorite).length,
        byCategory,
        byStatus,
      },
    };
  });
}

/**
 * One item by id (404 when missing or deleted).
 * @param {string} id
 */
export function getItem(id) {
  return simulate(async () => {
    await ready();
    const user = requireUser();
    return ownedItem(user.id, id);
  });
}

/**
 * Creates an item. Required: name (1-60 chars), category, at least one colour.
 * Wash-after defaults by type; footwear and accessories default to not laundered.
 * @param {object} data
 */
export function createItem(data = {}) {
  return simulate(async () => {
    await ready();
    const user = requireUser();
    const fields = normaliseItemInput(data);
    const now = new Date().toISOString();
    const { washAfter, ...rest } = fields;
    const item = {
      id: createId('itm'),
      userId: user.id,
      ...rest,
      wearCount: 0,
      lastWornAt: null,
      laundry: { status: 'clean', wearsSinceWash: 0, washAfter, since: now },
      sampleKey: null,
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
    };
    return transaction(() => insert('items', item));
  });
}

/**
 * Updates editable fields of an item (wear and laundry state are managed by their own services).
 * @param {string} id
 * @param {object} patch
 */
export function updateItem(id, patch = {}) {
  return simulate(async () => {
    await ready();
    const user = requireUser();
    const item = ownedItem(user.id, id);
    const input = Object.fromEntries(Object.entries(patch).filter(([key]) => EDITABLE_FIELDS.includes(key)));
    const fields = normaliseItemInput(input, item);
    const { washAfter, ...rest } = fields;
    const laundry = { ...item.laundry, washAfter };
    // An item that no longer needs washing cannot sit in the hamper.
    if (washAfter === null && laundry.status !== 'clean') {
      laundry.status = 'clean';
      laundry.wearsSinceWash = 0;
      laundry.since = new Date().toISOString();
    }
    return transaction(() => update('items', item.id, { ...item, ...rest, laundry, updatedAt: new Date().toISOString() }));
  });
}

/**
 * Soft-deletes items. Use restoreItems(ids) to undo.
 * @param {string|string[]} ids
 * @returns {Promise<{ ids: string[], items: object[] }>}
 */
export function deleteItems(ids) {
  return simulate(async () => {
    await ready();
    const user = requireUser();
    const list = toIdList(ids);
    if (list.length === 0) throw new ApiError(422, 'validation', 'Select at least one item to delete.');
    const targets = list.map((id) => ownedItem(user.id, id, { allowDeleted: true })).filter((item) => !item.deletedAt);
    const now = new Date().toISOString();
    const items = transaction(() => targets.map((item) => update('items', item.id, { deletedAt: now, updatedAt: now })));
    return { ids: items.map((item) => item.id), items };
  });
}

/**
 * Restores soft-deleted items.
 * @param {string|string[]} ids
 * @returns {Promise<{ ids: string[], items: object[] }>}
 */
export function restoreItems(ids) {
  return simulate(async () => {
    await ready();
    const user = requireUser();
    const list = toIdList(ids);
    const targets = list.map((id) => ownedItem(user.id, id, { allowDeleted: true })).filter((item) => item.deletedAt);
    const now = new Date().toISOString();
    const items = transaction(() => targets.map((item) => update('items', item.id, { deletedAt: null, updatedAt: now })));
    return { ids: items.map((item) => item.id), items };
  });
}

/**
 * Sets (or toggles, when value is omitted) the favourite flag.
 * @param {string} id
 * @param {boolean} [value]
 */
export function toggleFavorite(id, value) {
  return simulate(async () => {
    await ready();
    const user = requireUser();
    const item = ownedItem(user.id, id);
    const favorite = typeof value === 'boolean' ? value : !item.favorite;
    return transaction(() => update('items', item.id, { favorite, updatedAt: new Date().toISOString() }));
  });
}

/**
 * Adds sample items the user does not already have (inside a transaction).
 * @param {string} userId
 * @returns {object[]} inserted items
 */
export function importSampleItemsFor(userId) {
  const owned = new Set(
    table('items')
      .filter((item) => item.userId === userId && !item.deletedAt && item.sampleKey)
      .map((item) => item.sampleKey),
  );
  const fresh = buildSampleItems(userId).filter((item) => !owned.has(item.sampleKey));
  for (const item of fresh) insert('items', item);
  return fresh;
}

/**
 * Imports the sample wardrobe (skips pieces already imported).
 * @returns {Promise<{ imported: number, items: object[] }>}
 */
export function importSampleWardrobe() {
  return simulate(async () => {
    await ready();
    const user = requireUser();
    const items = transaction(() => importSampleItemsFor(user.id));
    return { imported: items.length, items };
  });
}

/**
 * Wear logs that include the item, newest first, with items attached.
 * @param {string} id
 */
export function getItemHistory(id) {
  return simulate(async () => {
    await ready();
    const user = requireUser();
    ownedItem(user.id, id, { allowDeleted: true });
    return table('wearLogs')
      .filter((log) => log.userId === user.id && log.itemIds.includes(id))
      .sort((a, b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt))
      .map(decorateLog);
  });
}
