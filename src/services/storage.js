// ─── LocalStorage Helpers ─────────────────────────────────────────────────────
const KEYS = {
  USERS: 'alclo_users',
  CURRENT_USER: 'alclo_current_user',
  WARDROBE: 'alclo_wardrobe',
  OUTFIT_HISTORY: 'alclo_outfit_history',
};

export { KEYS };

export function getFromStorage(key, fallback = null) {
  try {
    const raw = localStorage.getItem(key);
    if (raw === null) return fallback;
    return JSON.parse(raw);
  } catch {
    console.warn(`[storage] Corrupt data for key "${key}", resetting.`);
    localStorage.removeItem(key);
    return fallback;
  }
}

export function setToStorage(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.error('[storage] Failed to write:', e);
  }
}

export function removeFromStorage(key) {
  localStorage.removeItem(key);
}
