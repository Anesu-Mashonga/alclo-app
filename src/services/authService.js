import { v4 as uuidv4 } from 'uuid';
import { DEMO_USER } from '../data/seed.js';
import { getFromStorage, setToStorage, removeFromStorage, KEYS } from './storage.js';

const delay = (ms = 400) => new Promise((r) => setTimeout(r, ms));
const ok = (data) => ({ success: true, data });
const err = (code, message) => ({ success: false, error: { code, message } });

// ─── Init users store ─────────────────────────────────────────────────────────
function getUsers() {
  const users = getFromStorage(KEYS.USERS, []);
  // Ensure demo user always exists
  const hasDemo = users.find((u) => u.email === DEMO_USER.email);
  if (!hasDemo) {
    users.push({ ...DEMO_USER });
    setToStorage(KEYS.USERS, users);
  }
  return users;
}

// ─── Auth Service ─────────────────────────────────────────────────────────────
export const authService = {
  async signup({ name, email, password }) {
    await delay(500);
    const users = getUsers();
    const exists = users.find((u) => u.email.toLowerCase() === email.toLowerCase());
    if (exists) return err('EMAIL_TAKEN', 'An account with this email already exists.');
    const user = {
      id: uuidv4(),
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password,
      createdAt: new Date().toISOString(),
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(name)}&backgroundColor=b6e3f4`,
      preferences: {
        darkMode: false,
        defaultOccasion: 'casual',
        temperatureUnit: 'C',
      },
    };
    users.push(user);
    setToStorage(KEYS.USERS, users);
    return ok({ user: sanitize(user) });
  },

  async login({ email, password }) {
    await delay(600);
    const users = getUsers();
    const user = users.find(
      (u) => u.email.toLowerCase() === email.toLowerCase() && u.password === password
    );
    if (!user) return err('INVALID_CREDENTIALS', 'Invalid email or password.');
    setToStorage(KEYS.CURRENT_USER, user.id);
    return ok({ user: sanitize(user) });
  },

  async logout() {
    await delay(200);
    removeFromStorage(KEYS.CURRENT_USER);
    return ok(null);
  },

  getCurrentUser() {
    const userId = getFromStorage(KEYS.CURRENT_USER);
    if (!userId) return null;
    const users = getUsers();
    const user = users.find((u) => u.id === userId);
    return user ? sanitize(user) : null;
  },

  isAuthenticated() {
    return !!getFromStorage(KEYS.CURRENT_USER);
  },

  async updateUserPreferences(userId, prefs) {
    await delay(300);
    const users = getUsers();
    const idx = users.findIndex((u) => u.id === userId);
    if (idx === -1) return err('NOT_FOUND', 'User not found.');
    users[idx].preferences = { ...users[idx].preferences, ...prefs };
    setToStorage(KEYS.USERS, users);
    return ok({ user: sanitize(users[idx]) });
  },

  async updateProfile(userId, updates) {
    await delay(300);
    const users = getUsers();
    const idx = users.findIndex((u) => u.id === userId);
    if (idx === -1) return err('NOT_FOUND', 'User not found.');
    const allowed = ['name', 'avatar'];
    allowed.forEach((k) => {
      if (updates[k] !== undefined) users[idx][k] = updates[k];
    });
    setToStorage(KEYS.USERS, users);
    return ok({ user: sanitize(users[idx]) });
  },
};

function sanitize(user) {
  const { password: _p, ...safe } = user;
  return safe;
}
