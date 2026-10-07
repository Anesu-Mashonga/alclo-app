/**
 * Outfit engine: picks a complete, explainable outfit from clean items for the
 * weather and occasion. Pure and deterministic for a given seed and `now`.
 *
 * Scoring per item (higher is better):
 * - warmth close to the target for the temperature band (weighted by slot, and two or more
 *   steps off costs disproportionately more)
 * - tagged for the occasion (bonus); pieces tagged only for other occasions lose points, more
 *   so the further their formality is from the occasion (joggers for work lose more than jeans)
 * - wet weather: waterproof outerwear and footwear win, sandals and delicate materials lose
 * - shorts, tanks and sandals lose below 14°C; heavy knits lose from 24°C
 * - not worn recently: min(daysSinceWorn, 14) * 0.5, minus 3 when worn yesterday or today
 * - favourite +1
 * - colour harmony with what is already picked (neutrals go with anything,
 *   at most two bold colours, no identical bold top and bottom)
 * - seeded jitter so shuffles give different but repeatable results
 */
import { daysSince } from './dates';
import { seededUnit } from './random';
import { formatTemp, lowerFirst, upperFirst } from './format';
import { colorLabel, isNeutralColor, occasionLabel, typeLabel } from '@/data/taxonomy';

export const CORE_SLOTS = ['top', 'bottom', 'footwear'];
const DISPLAY_ORDER = ['outerwear', 'top', 'bottom', 'footwear'];

const WET_CONDITIONS = new Set(['rain', 'drizzle', 'storm', 'snow']);
const OUTERWEAR_CONDITIONS = new Set(['rain', 'storm', 'snow', 'wind']);
const TARGET_WARMTH = { hot: 1, warm: 2, mild: 3, cool: 4, cold: 5 };
const WARMTH_WEIGHT = { outerwear: 2.2, top: 2, bottom: 1.3, footwear: 1, accessory: 0.4 };
const HEAVY_KNITS = new Set(['sweater', 'hoodie', 'sweatshirt', 'cardigan']);
const SUMMER_ONLY = new Set(['shorts', 'tank', 'sandals']);
const DELICATE_WORDS = /\b(suede|velvet|canvas|satin|silk|patent)\b/i;
const HEADWEAR = new Set(['cap', 'hat', 'bucket hat', 'beanie']);

const OCCASION_REASONS = {
  work: 'Dressed for work',
  casual: 'Relaxed enough for a casual day',
  party: 'Sharp enough for a party',
  date: 'Polished for a date',
  sport: 'Built to move for sport',
};

const JITTER = { core: 3, accessory: 2 };
/** Suggestions scoring this far below the best one are left out. */
const SUGGESTION_FLOOR = 14;

/** How dressed up a type is (1 = gym, 5 = office formal). Used when nothing tagged for the occasion is clean. */
const FORMALITY = {
  tank: 1,
  hoodie: 1,
  't-shirt': 2,
  sweatshirt: 2,
  polo: 3,
  'long-sleeve': 3,
  sweater: 4,
  shirt: 5,
  leggings: 1,
  sweatpants: 1,
  shorts: 1,
  'cargo pants': 2,
  skirt: 3,
  jeans: 3,
  chinos: 4,
  trousers: 5,
  sandals: 1,
  trainers: 2,
  sneakers: 2,
  boots: 3,
  loafers: 4,
  derbies: 5,
  heels: 5,
  windbreaker: 2,
  bomber: 2,
  'denim jacket': 2,
  parka: 2,
  'leather jacket': 3,
  jacket: 3,
  cardigan: 3,
  coat: 4,
  blazer: 5,
};
const OCCASION_FORMALITY = { sport: 1, casual: 2, party: 3, date: 4, work: 4 };

/** Points lost by a piece that is tagged, but not for this occasion. */
function occasionMismatchPenalty(item, occasion) {
  const formality = FORMALITY[item.type] ?? 3;
  const target = OCCASION_FORMALITY[occasion] ?? 2;
  if (occasion === 'sport') return 4 + 1.2 * Math.abs(formality - target);
  // Underdressing is worse than overdressing.
  const gap = formality - target;
  return 2.5 + (gap < 0 ? -gap * 2 : gap * 0.6);
}

/** Warmth penalty: one step off is mild, two or more steps cost disproportionately more. */
function warmthPenalty(gap, weight) {
  return weight * gap * (1 + 0.5 * Math.max(0, gap - 1));
}

/**
 * Temperature band used for warmth targets.
 * @param {number} tempC
 * @returns {'hot'|'warm'|'mild'|'cool'|'cold'}
 */
export function temperatureBand(tempC) {
  const t = Number(tempC);
  if (t >= 27) return 'hot';
  if (t >= 20) return 'warm';
  if (t >= 14) return 'mild';
  if (t >= 7) return 'cool';
  return 'cold';
}

/** True when the item can be picked: not deleted and clean. */
export function isEligible(item) {
  return Boolean(item) && !item.deletedAt && (item.laundry?.status ?? 'clean') === 'clean';
}

/**
 * Builds the scoring context for a weather snapshot.
 * The dressing temperature blends the current temperature with the day's high,
 * so an early start on a hot day does not produce a winter outfit.
 */
function buildContext({ weather, occasion = 'casual', now = new Date(), unit = 'C' }) {
  const current = Number.isFinite(weather?.tempC) ? weather.tempC : 22;
  const high = Number.isFinite(weather?.highC) ? weather.highC : null;
  const low = Number.isFinite(weather?.lowC) ? weather.lowC : null;
  const temp = Math.round(high !== null ? (current + Math.max(high, current)) / 2 : current);
  const band = temperatureBand(temp);
  const condition = weather?.condition ?? 'clouds';
  const wet = WET_CONDITIONS.has(condition) || (weather?.precipChance ?? 0) >= 0.6;
  const windy = condition === 'wind' || (weather?.windKph ?? 0) >= 35;
  const hour = new Date(now).getHours();
  const morningChill = low !== null && low <= 12 && (band === 'warm' || band === 'hot') && hour < 11;

  const needsOuterwear =
    band === 'mild' ||
    band === 'cool' ||
    band === 'cold' ||
    OUTERWEAR_CONDITIONS.has(condition) ||
    (condition === 'drizzle' && band !== 'hot') ||
    (wet && band !== 'hot') ||
    morningChill;

  const target = TARGET_WARMTH[band];
  // A layer worn for rain, wind or a cool morning on a warm day should stay light.
  const outerTarget = band === 'hot' || band === 'warm' ? 2 : target;

  return {
    temp,
    low,
    band,
    target,
    outerTarget,
    condition,
    wet,
    windy,
    clearSky: condition === 'clear',
    morningChill,
    needsOuterwear,
    occasion,
    now,
    unit,
  };
}

/**
 * Whether the weather calls for an outer layer.
 * @param {object} weather
 * @param {{ now?: Date }} [options]
 */
export function needsOuterwearFor(weather, options = {}) {
  return buildContext({ weather, now: options.now }).needsOuterwear;
}

function boldColors(item) {
  return (item.colors ?? []).slice(0, 2).filter((c) => !isNeutralColor(c));
}

function harmonyScore(item, slot, picked) {
  const itemBold = boldColors(item);
  if (itemBold.length === 0) return 0.5;
  const pickedBold = new Set(picked.flatMap(boldColors));
  const fresh = itemBold.filter((c) => !pickedBold.has(c));
  const hasMulti = itemBold.includes('multi') || pickedBold.has('multi');
  const total = pickedBold.size + fresh.length + (hasMulti ? 1 : 0);
  let score = 0;
  if (total > 2) score -= 3 * (total - 2);
  if (fresh.length === 0 && pickedBold.size > 0) score += 0.5;
  if (slot === 'top' || slot === 'bottom') {
    const counterpart = picked.find((p) => p.category === (slot === 'top' ? 'bottom' : 'top'));
    const primary = item.colors?.[0];
    if (counterpart && primary && counterpart.colors?.[0] === primary && !isNeutralColor(primary)) score -= 4;
  }
  return slot === 'accessory' ? score * 0.5 : score;
}

function scoreItem(item, slot, ctx, picked, seed, penalties) {
  let score = 10;
  const reasons = [];
  const tempLabel = formatTemp(ctx.temp, ctx.unit);

  const target = slot === 'outerwear' ? ctx.outerTarget : ctx.target;
  const warmth = item.warmth ?? 3;
  const warmthGap = Math.abs(warmth - target);
  score -= warmthPenalty(warmthGap, WARMTH_WEIGHT[slot]);
  if (warmthGap === 0 && slot !== 'accessory') reasons.push(`Right weight for ${tempLabel}`);

  const occasions = item.occasions ?? [];
  if (occasions.includes(ctx.occasion)) {
    // Matching matters most where a mismatch shows: work and dates.
    score += ctx.occasion === 'work' || ctx.occasion === 'date' ? 5 : 3;
    reasons.push(`Good for ${lowerFirst(occasionLabel(ctx.occasion))}`);
  } else if (occasions.length > 0 && slot !== 'accessory') {
    score -= occasionMismatchPenalty(item, ctx.occasion);
  } else if (occasions.length > 0) {
    score -= 2.5;
  }

  if (ctx.wet) {
    if (item.waterproof && (slot === 'outerwear' || slot === 'footwear')) {
      score += slot === 'outerwear' ? 5 : 3;
      reasons.push('Waterproof');
    } else if (slot === 'outerwear') {
      score -= 2;
    }
    if (item.type === 'sandals') score -= 6;
    if (DELICATE_WORDS.test(item.name ?? '') && (slot === 'footwear' || slot === 'outerwear' || slot === 'accessory')) {
      score -= 3;
    }
  }

  if (ctx.temp < 14 && SUMMER_ONLY.has(item.type)) score -= 6;
  if (ctx.temp >= 24 && HEAVY_KNITS.has(item.type) && warmth >= 3) score -= ctx.temp > 26 ? 5 : 3;

  const days = daysSince(item.lastWornAt, ctx.now);
  score += Math.min(days ?? 14, 14) * 0.5;
  if (days !== null && days <= 1) score -= 3;
  if (days === null) reasons.push('Not worn yet');
  else if (days >= 7) reasons.push(`Not worn in ${days} days`);

  if (item.favorite) {
    score += 1;
    reasons.push('One of your favourites');
  }

  score += harmonyScore(item, slot, picked);
  score -= penalties?.[item.id] ?? 0;
  score += seededUnit(`${seed}:${item.id}`) * (slot === 'accessory' ? JITTER.accessory : JITTER.core);

  if (reasons.length === 0) reasons.push('Clean and ready');
  return { item, score: Math.round(score * 100) / 100, reasons: reasons.slice(0, 3) };
}

function rankInternal(items, slot, ctx, picked, { seed = 0, exclude = [], penalties = {}, types = null } = {}) {
  const pickedIds = new Set(picked.map((p) => p.id));
  const excluded = new Set(exclude);
  return items
    .filter(
      (item) =>
        isEligible(item) &&
        item.category === slot &&
        !pickedIds.has(item.id) &&
        !excluded.has(item.id) &&
        (!types || types.includes(item.type)),
    )
    .map((item) => scoreItem(item, slot, ctx, picked, seed, penalties))
    .sort((a, b) => b.score - a.score || String(a.item.id).localeCompare(String(b.item.id)));
}

/**
 * Ranks the clean, non-deleted items of one slot for the given context.
 * @param {{ items: object[], slot: string, weather?: object, occasion?: string, picked?: object[],
 *   now?: Date, seed?: number, exclude?: string[], unit?: 'C'|'F' }} params
 * @returns {{ item: object, score: number, reasons: string[] }[]}
 */
export function rankForSlot({ items, slot, weather, occasion = 'casual', picked = [], now = new Date(), seed = 0, exclude = [], unit = 'C' }) {
  const ctx = buildContext({ weather, occasion, now, unit });
  return rankInternal(items ?? [], slot, ctx, picked ?? [], { seed, exclude });
}

/** Accessory roles that make sense for the context, most important first. */
function accessoryRoles(ctx) {
  const roles = [];
  if (ctx.band === 'cold' || (ctx.band === 'cool' && ctx.windy)) {
    roles.push({ id: 'warmth', types: ['beanie', 'scarf'], reason: `Beanie for ${formatTemp(ctx.temp, ctx.unit)}` });
  }
  if (ctx.occasion === 'work') roles.push({ id: 'bag', types: ['bag'], reason: null });
  if (ctx.occasion === 'party' || ctx.occasion === 'date') roles.push({ id: 'necklace', types: ['necklace'], reason: null });
  if (ctx.clearSky && (ctx.band === 'hot' || ctx.band === 'warm')) {
    roles.push({ id: 'sunglasses', types: ['sunglasses'], reason: 'Sunglasses for the clear sky' });
  }
  if (ctx.clearSky && ctx.band === 'hot' && (ctx.occasion === 'casual' || ctx.occasion === 'sport')) {
    roles.push({ id: 'headwear', types: ['cap', 'bucket hat'], reason: 'Shade for your head in the sun' });
  } else if (ctx.occasion === 'sport' && !ctx.wet && ctx.band !== 'cold') {
    roles.push({ id: 'headwear', types: ['cap'], reason: null });
  }
  if (ctx.occasion === 'casual') roles.push({ id: 'bag', types: ['belt bag', 'bag'], reason: null });
  return roles;
}

function chooseAccessories(items, ctx, picked, options) {
  const chosen = [];
  const reasons = [];
  const usedRoles = new Set();
  for (const role of accessoryRoles(ctx)) {
    if (chosen.length >= 2) break;
    if (usedRoles.has(role.id)) continue;
    const hasHeadwear = chosen.some((c) => HEADWEAR.has(c.type));
    const types = role.types.filter((type) => !(hasHeadwear && HEADWEAR.has(type)));
    if (types.length === 0) continue;
    const ranked = rankInternal(items, 'accessory', ctx, [...picked, ...chosen], { ...options, types });
    const best = ranked[0];
    // Occasion driven roles need an item tagged for the occasion; weather roles only need a decent fit.
    const weatherRole = role.id === 'warmth' || role.id === 'sunglasses' || role.id === 'headwear';
    if (!best) continue;
    if (!weatherRole && !(best.item.occasions ?? []).includes(ctx.occasion)) continue;
    if (best.score < 4) continue;
    chosen.push(best.item);
    usedRoles.add(role.id);
    if (role.reason) reasons.push(role.reason);
  }
  return { chosen, reasons };
}

const PLURAL_TYPES = new Set([
  'jeans', 'chinos', 'trousers', 'cargo pants', 'shorts', 'sweatpants', 'leggings',
  'sneakers', 'trainers', 'boots', 'loafers', 'derbies', 'sandals', 'heels', 'sunglasses', 'glasses',
]);
const isPlural = (item) => PLURAL_TYPES.has(item.type);

/**
 * Core pieces that are clearly too warm, or too light without a warm layer on top.
 * Bottoms only count as too light when they are shorts-weight in the cold.
 */
function warmthMisfits(ctx, slots) {
  const warmLayer = slots.outerwear && (slots.outerwear.warmth ?? 3) >= ctx.target - 1;
  return ['outerwear', 'top', 'bottom']
    .map((slot) => ({ slot, item: slots[slot] }))
    .filter(({ item }) => item)
    .map(({ slot, item }) => ({ slot, item, gap: (item.warmth ?? 3) - (slot === 'outerwear' ? ctx.outerTarget : ctx.target) }))
    .filter(({ slot, item, gap }) => {
      if (gap >= 2) return true;
      if (gap > -2) return false;
      if (slot === 'bottom') return (item.warmth ?? 3) <= 1 && ctx.temp < 14;
      if (slot === 'top') return !warmLayer;
      return true;
    });
}

function pluralLabel(slot) {
  return { top: 'tops', bottom: 'bottoms', footwear: 'footwear', outerwear: 'outerwear' }[slot] ?? slot;
}

function buildWarnings(ctx, items, slots) {
  const warnings = [];
  const active = items.filter((item) => !item.deletedAt);
  const slotsToCheck = ctx.needsOuterwear ? [...CORE_SLOTS, 'outerwear'] : CORE_SLOTS;
  for (const slot of slotsToCheck) {
    if (slots[slot]) continue;
    const inCategory = active.filter((item) => item.category === slot);
    const inLaundry = inCategory.filter((item) => (item.laundry?.status ?? 'clean') !== 'clean').length;
    const label = pluralLabel(slot);
    if (inCategory.length === 0) {
      warnings.push(
        slot === 'outerwear'
          ? 'Add a jacket or coat for days like this.'
          : `Add some ${label} to get complete outfits.`,
      );
    } else if (inLaundry > 0) {
      warnings.push(`No clean ${label} right now. ${inLaundry} ${inLaundry === 1 ? 'is' : 'are'} in the laundry.`);
    } else {
      warnings.push(`None of your ${label} are free for this outfit.`);
    }
  }
  // Explain fallbacks: the pieces for this occasion are in the laundry.
  for (const slot of CORE_SLOTS) {
    const picked = slots[slot];
    if (!picked || (picked.occasions ?? []).length === 0 || picked.occasions.includes(ctx.occasion)) continue;
    const forOccasion = active.filter((item) => item.category === slot && (item.occasions ?? []).includes(ctx.occasion));
    if (forOccasion.length === 0) continue;
    const occasionName = lowerFirst(occasionLabel(ctx.occasion));
    const clean = forOccasion.filter(isEligible);
    if (clean.length === 0) {
      warnings.push(`No clean ${occasionName} ${pluralLabel(slot)} right now, so this uses your ${lowerFirst(picked.name)}.`);
    } else if (clean.every((item) => (item.warmth ?? 3) - ctx.target >= 2)) {
      warnings.push(
        `Your clean ${occasionName} ${pluralLabel(slot)} are too warm for ${formatTemp(ctx.temp, ctx.unit)}, so this uses your ${lowerFirst(picked.name)}.`,
      );
    }
  }
  const t = formatTemp(ctx.temp, ctx.unit);
  for (const { item, gap } of warmthMisfits(ctx, slots)) {
    const name = lowerFirst(item.name);
    const plural = isPlural(item);
    warnings.push(
      gap > 0
        ? `Your ${name} ${plural ? 'run' : 'runs'} warm for ${t}.`
        : `Your ${name} ${plural ? 'are' : 'is'} light for ${t}, so layer up.`,
    );
  }
  if (ctx.wet && slots.outerwear && !slots.outerwear.waterproof) {
    const hasCleanWaterproof = active.some(
      (item) => item.category === 'outerwear' && item.waterproof && isEligible(item),
    );
    if (!hasCleanWaterproof) warnings.push('Nothing waterproof is clean, so take an umbrella.');
  }
  return warnings;
}

function temperatureReason(ctx, slots) {
  const t = formatTemp(ctx.temp, ctx.unit);
  // Only describe the outfit as right for the weather when it is.
  if (warmthMisfits(ctx, slots).length > 0) return `Closest match for ${t} from what is clean`;
  switch (ctx.band) {
    case 'hot':
      return `Light layers for ${t}`;
    case 'warm':
      if (slots.outerwear && ctx.morningChill && ctx.low !== null) {
        return `Light layer for a ${formatTemp(ctx.low, ctx.unit)} morning`;
      }
      return `Breathable pieces for ${t}`;
    case 'mild':
      if (!slots.outerwear) return `Mid-weight pieces for ${t}`;
      return (slots.outerwear.warmth ?? 3) >= 4 ? `A warm layer for ${t}` : `A light jacket for ${t}`;
    case 'cool':
      return `Warm layers for ${t}`;
    default:
      return `Bundled up for ${t}`;
  }
}

function weatherReason(ctx, slots) {
  if (ctx.wet) {
    const what = ctx.condition === 'snow' ? 'snow' : ctx.condition === 'drizzle' ? 'drizzle' : 'rain';
    if (slots.outerwear?.waterproof) return `Waterproof ${lowerFirst(typeLabel(slots.outerwear.type))} for the ${what}`;
    if (slots.footwear?.waterproof) return `${upperFirst(typeLabel(slots.footwear.type))} that handle the ${what}`;
    return null;
  }
  if (ctx.windy && slots.outerwear) return `${upperFirst(typeLabel(slots.outerwear.type))} to block the wind`;
  return null;
}

function recencyReason(ctx, core) {
  const stale = core
    .map((item) => ({ item, days: daysSince(item.lastWornAt, ctx.now) }))
    .filter(({ days }) => days === null || days >= 14);
  if (stale.length === 0) return null;
  if (stale.length === 1) {
    const { item, days } = stale[0];
    if (days === null) return `Gives your ${lowerFirst(item.name)} a first outing`;
    return `Brings back your ${lowerFirst(item.name)} after ${Math.floor(days / 7)} weeks`;
  }
  const known = stale.filter(({ days }) => days !== null).map(({ days }) => days);
  const weeks = known.length > 0 ? Math.max(2, Math.floor(Math.min(...known) / 7)) : 2;
  return `Brings back pieces you have not worn in ${weeks} weeks`;
}

function colourReason(core) {
  const primaries = core.map((item) => item.colors?.[0]).filter(Boolean);
  const bold = [...new Set(primaries.filter((c) => !isNeutralColor(c)))];
  if (primaries.length < 2) return null;
  if (bold.length === 0) return 'Neutral colours that all work together';
  if (bold.length === 1 && bold[0] !== 'multi') return `One ${lowerFirst(colorLabel(bold[0]))} accent against neutrals`;
  if (bold.length === 1) return 'One bold print kept simple around it';
  return null;
}

function buildReasons(ctx, slots, accessoryReasons) {
  const core = DISPLAY_ORDER.map((slot) => slots[slot]).filter(Boolean);
  const reasons = [];
  if (core.length > 0) reasons.push(temperatureReason(ctx, slots));
  const weather = weatherReason(ctx, slots);
  if (weather) reasons.push(weather);

  // Claim the occasion only when every tagged top, bottom and pair of shoes is meant for it.
  const basics = CORE_SLOTS.map((slot) => slots[slot]).filter(Boolean);
  const offOccasion = basics.some((item) => (item.occasions ?? []).length > 0 && !item.occasions.includes(ctx.occasion));
  if (basics.length > 0 && !offOccasion) reasons.push(OCCASION_REASONS[ctx.occasion]);

  const recency = recencyReason(ctx, core);
  if (recency) reasons.push(recency);

  if (reasons.length < 4) {
    const colour = colourReason(core);
    if (colour && reasons.length < 3) reasons.push(colour);
  }
  if (reasons.length < 2 && core.some((item) => item.favorite)) reasons.push('Built around your favourites');
  if (reasons.length < 4 && accessoryReasons.length > 0) reasons.push(accessoryReasons[0]);
  if (reasons.length < 2 && core.length > 0) reasons.push(`Picked for ${lowerFirst(occasionLabel(ctx.occasion))}`);
  return [...new Set(reasons.filter(Boolean))].slice(0, 4);
}

/**
 * Recommends one complete outfit.
 * @param {{
 *   items: object[], weather?: object, occasion?: string, seed?: number,
 *   locked?: Record<string, string|string[]>, exclude?: string[], now?: Date, unit?: 'C'|'F',
 *   penalties?: Record<string, number>
 * }} params `locked` maps slot -> itemId (accessory may be an array). `penalties` lowers
 *   specific items' scores (used for variety across suggestions).
 * @returns {{ slots: { outerwear: object|null, top: object|null, bottom: object|null, footwear: object|null,
 *   accessory: object[] }, itemIds: string[], needsOuterwear: boolean, reasons: string[], warnings: string[],
 *   score: number, seed: number, occasion: string, band: string, tempC: number }}
 */
export function recommendOutfit({
  items,
  weather,
  occasion = 'casual',
  seed = 0,
  locked = {},
  exclude = [],
  now = new Date(),
  unit = 'C',
  penalties = {},
}) {
  const ctx = buildContext({ weather, occasion, now, unit });
  const all = (items ?? []).filter((item) => !item.deletedAt);
  const byId = new Map(all.map((item) => [item.id, item]));
  const slots = { outerwear: null, top: null, bottom: null, footwear: null, accessory: [] };
  const picked = [];
  let score = 0;

  for (const [slot, value] of Object.entries(locked ?? {})) {
    if (!value) continue;
    if (slot === 'accessory') {
      for (const id of Array.isArray(value) ? value : [value]) {
        const item = byId.get(id);
        if (item && item.category === 'accessory' && !slots.accessory.includes(item)) {
          slots.accessory.push(item);
          picked.push(item);
        }
      }
    } else if (slot in slots) {
      const item = byId.get(value);
      if (item && item.category === slot) {
        slots[slot] = item;
        picked.push(item);
      }
    }
  }

  const options = { seed, exclude, penalties };
  const order = ctx.needsOuterwear ? [...CORE_SLOTS, 'outerwear'] : CORE_SLOTS;
  for (const slot of order) {
    if (slots[slot]) {
      score += scoreItem(slots[slot], slot, ctx, picked.filter((p) => p !== slots[slot]), seed, penalties).score;
      continue;
    }
    const best = rankInternal(all, slot, ctx, picked, options)[0];
    if (best) {
      slots[slot] = best.item;
      picked.push(best.item);
      score += best.score;
    }
  }

  let accessoryReasons = [];
  if (slots.accessory.length === 0) {
    const { chosen, reasons } = chooseAccessories(all, ctx, picked, options);
    slots.accessory = chosen;
    picked.push(...chosen);
    accessoryReasons = reasons;
  }

  const itemIds = [...DISPLAY_ORDER.map((slot) => slots[slot]?.id), ...slots.accessory.map((item) => item.id)].filter(Boolean);

  return {
    slots,
    itemIds,
    needsOuterwear: ctx.needsOuterwear,
    reasons: buildReasons(ctx, slots, accessoryReasons),
    warnings: buildWarnings(ctx, all, slots),
    score: Math.round(score * 10) / 10,
    seed,
    occasion,
    band: ctx.band,
    tempC: ctx.temp,
  };
}

/**
 * Several distinct outfits for the same context, best first.
 * Items already used get a growing penalty so later suggestions explore the wardrobe.
 * Optional `seed` (a batch number, default 0) and `avoid` (item ids already shown, each counted as
 * one earlier use) give a fresh batch for "More ideas"; the defaults keep the original output.
 * @param {{ items: object[], weather?: object, occasion?: string, count?: number, now?: Date, unit?: 'C'|'F',
 *   seed?: number, avoid?: string[] }} params
 * @returns {ReturnType<typeof recommendOutfit>[]}
 */
export function generateSuggestions({
  items,
  weather,
  occasion = 'casual',
  count = 6,
  now = new Date(),
  unit = 'C',
  seed = 0,
  avoid = [],
}) {
  const results = [];
  const seen = new Set();
  const usage = {};
  for (const id of avoid ?? []) usage[id] = (usage[id] ?? 0) + 1;
  const maxAttempts = count * 6;
  const seedBase = (Number(seed) || 0) * 100;
  for (let attempt = 0; attempt < maxAttempts && results.length < count; attempt += 1) {
    const penalties = Object.fromEntries(Object.entries(usage).map(([id, n]) => [id, n * 2.5]));
    const rec = recommendOutfit({ items, weather, occasion, seed: seedBase + attempt + 1, now, unit, penalties });
    if (!rec.slots.top && !rec.slots.bottom && !rec.slots.footwear) break;
    const key = DISPLAY_ORDER.map((slot) => rec.slots[slot]?.id ?? '-').join('|');
    // Repeats still count as usage, so the next attempt moves further away from them.
    for (const id of rec.itemIds) usage[id] = (usage[id] ?? 0) + 1;
    if (seen.has(key)) continue;
    seen.add(key);
    results.push(rec);
  }
  // Drop ideas that are much weaker than the best one (they only exist to fill the count).
  const best = results[0]?.score ?? 0;
  return results.filter((rec, index) => index < 2 || rec.score >= best - SUGGESTION_FLOOR);
}
