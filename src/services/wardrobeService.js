import { v4 as uuidv4 } from 'uuid';
import { SEED_WARDROBE } from '../data/seed.js';
import { getFromStorage, setToStorage, KEYS } from './storage.js';

const delay = (ms) => new Promise((r) => setTimeout(r, ms ?? Math.random() * 300 + 200));
const ok = (data) => ({ success: true, data });
const err = (code, message) => ({ success: false, error: { code, message } });

function getWardrobe() {
  return getFromStorage(KEYS.WARDROBE, null);
}

function saveWardrobe(items) {
  setToStorage(KEYS.WARDROBE, items);
}

export const wardrobeService = {
  async seedInitialDataIfEmpty() {
    const items = getWardrobe();
    if (!items || items.length === 0) {
      saveWardrobe(SEED_WARDROBE.map((i) => ({ ...i, id: uuidv4() })));
    }
  },

  async getAllItems() {
    await delay();
    return ok(getWardrobe() ?? []);
  },

  async getItemById(id) {
    await delay(150);
    const items = getWardrobe() ?? [];
    const item = items.find((i) => i.id === id);
    if (!item) return err('NOT_FOUND', 'Item not found.');
    return ok(item);
  },

  async createItem(payload) {
    await delay();
    const items = getWardrobe() ?? [];
    const now = new Date().toISOString();
    const item = {
      id: uuidv4(),
      name: payload.name,
      type: payload.type,
      categoryLabel: payload.categoryLabel ?? '',
      color: payload.color ?? '#9E9E9E',
      imageUrl: payload.imageUrl ?? '',
      lastWorn: payload.lastWorn ?? now,
      favorite: payload.favorite ?? false,
      inLaundry: payload.inLaundry ?? false,
      tags: payload.tags ?? [],
      createdAt: now,
      updatedAt: now,
    };
    items.push(item);
    saveWardrobe(items);
    return ok(item);
  },

  async updateItem(id, payload) {
    await delay();
    const items = getWardrobe() ?? [];
    const idx = items.findIndex((i) => i.id === id);
    if (idx === -1) return err('NOT_FOUND', 'Item not found.');
    items[idx] = { ...items[idx], ...payload, updatedAt: new Date().toISOString() };
    saveWardrobe(items);
    return ok(items[idx]);
  },

  async deleteItem(id) {
    await delay();
    const items = getWardrobe() ?? [];
    const idx = items.findIndex((i) => i.id === id);
    if (idx === -1) return err('NOT_FOUND', 'Item not found.');
    items.splice(idx, 1);
    saveWardrobe(items);
    return ok({ id });
  },

  async toggleFavorite(id) {
    const items = getWardrobe() ?? [];
    const item = items.find((i) => i.id === id);
    if (!item) return err('NOT_FOUND', 'Item not found.');
    return wardrobeService.updateItem(id, { favorite: !item.favorite });
  },

  async bulkUpdate(ids, patch) {
    await delay();
    const items = getWardrobe() ?? [];
    const now = new Date().toISOString();
    ids.forEach((id) => {
      const idx = items.findIndex((i) => i.id === id);
      if (idx !== -1) items[idx] = { ...items[idx], ...patch, updatedAt: now };
    });
    saveWardrobe(items);
    return ok({ updated: ids.length });
  },
};
