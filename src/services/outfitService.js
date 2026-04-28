import dayjs from 'dayjs';
import { v4 as uuidv4 } from 'uuid';
import { getFromStorage, setToStorage, KEYS } from './storage.js';

const delay = (ms = 500) => new Promise((r) => setTimeout(r, ms));
const ok = (data) => ({ success: true, data });

// ─── Recommendation Engine ────────────────────────────────────────────────────
function scoreItem(item, { occasion, weather }) {
  let score = 0;
  const hoursAgo = dayjs().diff(dayjs(item.lastWorn), 'hour');

  // Recency boost (higher = longer not worn)
  score += Math.min(hoursAgo / 24, 14) * 2;

  // Favorite boost
  if (item.favorite) score += 5;

  // Occasion-aware boosts
  const occasionTagMap = {
    work: ['work', 'formal', 'smart casual'],
    casual: ['casual', 'everyday', 'versatile'],
    party: ['party', 'formal', 'night out'],
    date: ['date', 'smart casual', 'party'],
    sport: ['sport', 'gym', 'outdoor'],
  };
  const targetTags = occasionTagMap[occasion] ?? ['casual'];
  const matchCount = item.tags.filter((t) => targetTags.includes(t)).length;
  score += matchCount * 8;

  // Weather-aware boosts
  const tempC = weather?.tempC ?? 20;
  const condition = weather?.condition ?? 'sunny';

  // Outerwear logic
  if (item.type === 'outer') {
    if (tempC < 12) score += 20;
    else if (tempC > 22) score -= 20;
  }

  // Rain shoe penalty
  if (item.type === 'shoes' && condition === 'rainy') {
    if (item.tags.includes('formal')) score -= 10;
    if (item.categoryLabel?.toLowerCase().includes('boot')) score += 8;
  }

  // Hot weather — prefer lighter items
  if (tempC > 28 && item.type === 'outer') score -= 30;
  if (tempC > 28 && item.tags.includes('summer')) score += 5;

  // Cold weather — prefer warming items
  if (tempC < 5 && item.type === 'outer') score += 15;

  // Laundry penalty
  if (item.inLaundry) score -= 100;

  return score;
}

function getReasonText(outfit, { occasion, weather }) {
  const weatherLabel = weather?.label ?? 'today\'s weather';
  const tempC = weather?.tempC ?? 20;
  const tempDesc = tempC < 8 ? 'cold' : tempC < 18 ? 'cool' : tempC < 26 ? 'pleasant' : 'warm';
  const topNames = outfit.items
    .filter((i) => i.type === 'top' || i.type === 'outer')
    .map((i) => i.name)
    .join(' + ');
  return `A ${tempDesc} ${weatherLabel} day calls for this ${occasion} look. ${topNames ? `Featuring ${topNames}.` : ''} All items haven't been worn recently.`;
}

export const outfitService = {
  async generateOutfit({ weather, occasion, wardrobe }) {
    await delay(700);
    if (!wardrobe || wardrobe.length === 0) {
      return ok({ outfit: null, reason: 'Your wardrobe is empty. Add some items first!' });
    }

    const availableItems = wardrobe.filter((i) => !i.inLaundry);
    const scored = availableItems.map((item) => ({
      item,
      score: scoreItem(item, { occasion, weather }),
    }));
    scored.sort((a, b) => b.score - a.score);

    const pick = (type) => scored.find((s) => s.item.type === type)?.item;

    const tops = scored.filter((s) => s.item.type === 'top');
    const bottoms = scored.filter((s) => s.item.type === 'bottom');
    const shoes = scored.filter((s) => s.item.type === 'shoes');
    const outers = scored.filter((s) => s.item.type === 'outer');
    const accessories = scored.filter((s) => s.item.type === 'accessories');

    const selected = [];
    if (tops[0]) selected.push(tops[0].item);
    if (bottoms[0]) selected.push(bottoms[0].item);
    if (shoes[0]) selected.push(shoes[0].item);

    const tempC = weather?.tempC ?? 20;
    if (tempC < 16 && outers[0]) selected.push(outers[0].item);

    accessories.slice(0, 2).forEach((s) => selected.push(s.item));

    if (selected.length === 0) {
      return ok({ outfit: null, reason: 'Not enough wardrobe items for a full outfit yet.' });
    }

    const outfit = {
      id: uuidv4(),
      date: new Date().toISOString(),
      weather,
      occasion,
      items: selected,
      reason: getReasonText({ items: selected }, { occasion, weather }),
      accepted: false,
    };

    return ok({ outfit });
  },

  async generateForOccasion({ occasion, wardrobe, weather }) {
    return outfitService.generateOutfit({ weather: weather ?? { tempC: 20, condition: 'sunny', label: 'Clear', icon: '☀️' }, occasion, wardrobe });
  },

  async acceptOutfit(outfit) {
    await delay(200);
    const history = getFromStorage(KEYS.OUTFIT_HISTORY, []);
    const existing = history.findIndex((o) => o.id === outfit.id);
    const accepted = { ...outfit, accepted: true };
    if (existing >= 0) history[existing] = accepted;
    else history.unshift(accepted);
    setToStorage(KEYS.OUTFIT_HISTORY, history.slice(0, 30)); // keep last 30
    return ok(accepted);
  },

  async getOutfitHistory() {
    await delay(300);
    return ok(getFromStorage(KEYS.OUTFIT_HISTORY, []));
  },
};
