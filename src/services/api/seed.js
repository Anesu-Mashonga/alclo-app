/**
 * Builds the initial database: seed users (passwords hashed here), the sample
 * wardrobe, saved outfits, plans and about 70 days of wear history for the demo
 * user, generated relative to today with seeded randomness.
 *
 * The history is simulated day by day with the real outfit engine and laundry
 * rules (wear -> hamper -> wash -> clean), so wear counts, last worn dates,
 * laundry states and insights all agree. A few deterministic adjustments then
 * shape the end state the demo relies on:
 * - 6 to 9 items in the hamper, 2 or 3 of them waiting 3 days or more (urgent)
 * - 2 to 4 items in the wash
 * - 4 to 6 items not worn in the last 30 days
 * - no wear log for today
 */
import { SAMPLE_BY_KEY, SAMPLE_WARDROBE } from '@/data/wardrobeItems';
import { SEED_USERS } from '@/data/users';
import { SEED_OUTFITS } from '@/data/outfits';
import { SEED_PLANS } from '@/data/plans';
import { recommendOutfit, temperatureBand } from '@/lib/outfitEngine';
import { applyWear, isWashable, setLaundryStatus } from '@/lib/laundry';
import { simulatedWeatherAt } from '@/lib/weatherSim';
import { createId, createRng, hashString, stableId } from '@/lib/random';
import { dayjs, daysBetween } from '@/lib/dates';
import { hashPassword, randomSalt } from './crypto';

export const HISTORY_DAYS = 70;
/** Evening of the last full wash before today (days relative to today). */
const FINAL_FULL_WASH = -6;
const FORGOTTEN_DAYS = 30;
const TARGET_WARMTH = { hot: 1, warm: 2, mild: 3, cool: 4, cold: 5 };

const clone = (value) => (typeof structuredClone === 'function' ? structuredClone(value) : JSON.parse(JSON.stringify(value)));

/**
 * Turns a sample wardrobe entry into an item row.
 * @param {object} sample entry from SAMPLE_WARDROBE
 * @param {{ id: string, userId: string, createdAt: string }} meta
 */
export function createItemRecord(sample, { id, userId, createdAt }) {
  return {
    id,
    userId,
    name: sample.name,
    category: sample.category,
    type: sample.type ?? null,
    colors: [...sample.colors],
    image: sample.image ?? null,
    occasions: [...(sample.occasions ?? [])],
    warmth: sample.warmth ?? 3,
    waterproof: Boolean(sample.waterproof),
    favorite: Boolean(sample.favorite),
    brand: sample.brand ?? null,
    price: sample.price ?? null,
    notes: sample.notes ?? '',
    wearCount: 0,
    lastWornAt: null,
    laundry: { status: 'clean', wearsSinceWash: 0, washAfter: sample.washAfter ?? null, since: createdAt },
    sampleKey: sample.key ?? null,
    createdAt,
    updatedAt: createdAt,
    deletedAt: null,
  };
}

/**
 * Fresh copies of the sample wardrobe for a user (random ids), e.g. for onboarding imports.
 * @param {string} userId
 * @param {{ now?: Date, keys?: string[] }} [options]
 */
export function buildSampleItems(userId, { now = new Date(), keys } = {}) {
  const source = keys ? keys.map((key) => SAMPLE_BY_KEY[key]).filter(Boolean) : SAMPLE_WARDROBE;
  return source.map((sample, index) =>
    createItemRecord(sample, {
      id: createId('itm'),
      userId,
      // Stagger timestamps so "recently added" sorting keeps the sample order.
      createdAt: new Date(now.getTime() - (source.length - index) * 1000).toISOString(),
    }),
  );
}

/** Deterministic plan for a calendar day: occasion, whether it is skipped, wake time. */
function dayPlan(date) {
  const iso = date.format('YYYY-MM-DD');
  const r = createRng(`plan:${iso}`);
  const dow = date.day();
  let occasion;
  if (dow === 5) {
    const roll = r.next();
    occasion = roll < 0.65 ? 'work' : roll < 0.9 ? 'party' : 'casual';
  } else if (dow >= 1 && dow <= 4) {
    occasion = r.chance(0.88) ? 'work' : 'casual';
  } else if (dow === 6) {
    occasion = r.weightedPick(
      [
        ['casual', 0.5],
        ['sport', 0.35],
        ['party', 0.15],
      ],
      (entry) => entry[1],
    )[0];
  } else {
    occasion = r.weightedPick(
      [
        ['casual', 0.55],
        ['date', 0.25],
        ['sport', 0.2],
      ],
      (entry) => entry[1],
    )[0];
  }
  const savedChance = occasion === 'work' || occasion === 'casual' ? 0.2 : 0.45;
  return { iso, occasion, skip: r.chance(0.1), minute: r.int(0, 50), useSaved: r.chance(savedChance), pick: r.int(0, 999) };
}

function dressingTarget(weather) {
  const temp = Math.round((weather.tempC + Math.max(weather.highC, weather.tempC)) / 2);
  return { temp, target: TARGET_WARMTH[temperatureBand(temp)] };
}

/**
 * Simulates the demo user's history from scratch.
 * @returns {{ items: Map<string, object>, logs: object[] }}
 */
function simulateHistory({ baseItems, outfits, userId, city, today, forced, excludedRecent }) {
  const items = new Map(baseItems.map((item) => [item.id, clone(item)]));
  const logs = [];
  const washRng = createRng(`wash:${userId}`);
  let nextWash = -HISTORY_DAYS + washRng.int(3, 5);

  for (let offset = -HISTORY_DAYS; offset <= -1; offset += 1) {
    const date = today.add(offset, 'day');

    // Morning: yesterday's load comes out of the wash.
    const morning = date.hour(7).minute(30).toDate();
    for (const item of items.values()) {
      if (item.laundry.status === 'washing') items.set(item.id, setLaundryStatus(item, 'clean', morning));
    }

    const plan = dayPlan(date);
    const lock = {};
    for (const [slot, value] of Object.entries(forced[offset] ?? {})) {
      const ids = Array.isArray(value) ? value : [value];
      const usable = ids.filter((id) => items.get(id)?.laundry.status === 'clean');
      if (usable.length > 0) lock[slot] = slot === 'accessory' ? usable : usable[0];
    }
    const hasLock = Object.keys(lock).length > 0;

    if (!plan.skip || hasLock) {
      const wornAt = date.hour(8).minute(plan.minute);
      const weather = simulatedWeatherAt(city, date, 8);
      const { temp, target } = dressingTarget(weather);
      const exclude = offset >= -35 ? [...excludedRecent] : [];
      let itemIds = null;
      let outfitId = null;

      if (plan.useSaved && !hasLock) {
        const fits = outfits.filter(
          (outfit) =>
            outfit.occasion === plan.occasion &&
            outfit.itemIds.every((id) => {
              const item = items.get(id);
              if (!item || item.laundry.status !== 'clean' || exclude.includes(id)) return false;
              // People carry a jacket they like, so only tops and bottoms must suit the temperature.
              if (item.category !== 'top' && item.category !== 'bottom') return true;
              return Math.abs((item.warmth ?? 3) - target) <= 1;
            }),
        );
        if (fits.length > 0) {
          const outfit = fits[plan.pick % fits.length];
          itemIds = [...outfit.itemIds];
          outfitId = outfit.id;
        }
      }

      if (!itemIds) {
        const rec = recommendOutfit({
          items: [...items.values()],
          weather,
          occasion: plan.occasion,
          seed: hashString(`${userId}:${plan.iso}`) % 100000,
          locked: lock,
          exclude,
          now: wornAt.toDate(),
        });
        itemIds = rec.itemIds;
      }

      if (itemIds.length >= 2) {
        const snapshots = itemIds.map((id) => {
          const item = items.get(id);
          return { id, wearCount: item.wearCount, lastWornAt: item.lastWornAt, laundry: { ...item.laundry } };
        });
        for (const id of itemIds) items.set(id, applyWear(items.get(id), wornAt.toDate()));
        snapshots.forEach((snapshot) => {
          snapshot.afterLaundry = { ...items.get(snapshot.id).laundry };
        });
        logs.push({
          id: stableId('wear', `${userId}:${plan.iso}`),
          userId,
          date: plan.iso,
          itemIds,
          outfitId,
          occasion: plan.occasion,
          weather: { tempC: temp, condition: weather.condition },
          snapshots,
          createdAt: wornAt.toISOString(),
        });
      }
    }

    // Evening: laundry day. Regular loads take the oldest 5 to 8 items; the last one takes everything.
    const finalWash = offset === FINAL_FULL_WASH;
    if (finalWash || (offset === nextWash && offset < FINAL_FULL_WASH)) {
      const evening = date.hour(19).minute(30).toDate();
      const hamper = [...items.values()]
        .filter((item) => item.laundry.status === 'hamper')
        .sort((a, b) => a.laundry.since.localeCompare(b.laundry.since));
      const load = finalWash ? hamper : hamper.slice(0, washRng.int(5, 8));
      for (const item of load) items.set(item.id, setLaundryStatus(item, 'washing', evening));
      if (!finalWash) nextWash = offset + washRng.int(3, 5);
    }
  }
  return { items, logs };
}

function isForgotten(item, today) {
  return !item.lastWornAt || daysBetween(item.lastWornAt, today) >= FORGOTTEN_DAYS;
}

/** Best day in the last four weeks to bring a forgotten item out, with a cost (lower is better). */
function bestDayFor(item, { today, city, forced }) {
  let best = null;
  for (let offset = -28; offset <= -2; offset += 1) {
    const slotTaken = item.category === 'accessory' ? (forced[offset]?.accessory?.length ?? 0) > 0 : Boolean(forced[offset]?.[item.category]);
    if (slotTaken) continue;
    const date = today.add(offset, 'day');
    const plan = dayPlan(date);
    const { target } = dressingTarget(simulatedWeatherAt(city, date, 8));
    let cost = (item.occasions ?? []).includes(plan.occasion) ? 0 : 3;
    if (item.category !== 'accessory') cost += Math.abs((item.warmth ?? 3) - target) * 2;
    else if (item.type === 'beanie' || item.type === 'scarf') cost += Math.abs(5 - target) * 2;
    cost += ((hashString(`${item.id}:${offset}`) % 100) / 1000);
    if (!best || cost < best.cost) best = { offset, cost };
  }
  return best;
}

/** Shapes the final laundry state (see the module comment) without touching wear history. */
function finalizeLaundry(items, { today, userId, occasion }) {
  const rng = createRng(`laundry-end:${userId}:${today.format('YYYY-MM-DD')}`);
  const urgentTarget = rng.int(2, 3);
  const hamperTarget = rng.int(6, 9);
  const freshTarget = hamperTarget - urgentTarget;
  const washTarget = rng.int(2, 4);
  const dayOf = (iso) => daysBetween(iso, today) * -1; // 0 = today, -1 = yesterday...

  const list = () => [...items.values()];
  const bySince = (a, b) => a.laundry.since.localeCompare(b.laundry.since);
  // Keep the demo's first outfit sensible: if no light or mid-weight top or bottom for the default
  // occasion is clean, the one waiting longest in the hamper went through a load that finished
  // yesterday morning.
  const yesterdayMorning = today.add(-1, 'day').hour(8).toDate();
  const needed = (i) => i.occasions.includes(occasion) && (i.warmth ?? 3) <= 3;
  for (const category of ['top', 'bottom']) {
    const forOccasion = list().filter((i) => i.category === category && needed(i));
    if (forOccasion.length === 0 || forOccasion.some((i) => i.laundry.status === 'clean')) continue;
    const rescue = forOccasion
      .filter((i) => i.laundry.status === 'hamper' && dayOf(i.laundry.since) <= -2)
      .sort(bySince)[0];
    if (rescue) items.set(rescue.id, setLaundryStatus(rescue, 'clean', yesterdayMorning));
  }

  const urgent = list().filter((i) => i.laundry.status === 'hamper' && dayOf(i.laundry.since) <= -3).sort(bySince);
  const fresh = list().filter((i) => i.laundry.status === 'hamper' && dayOf(i.laundry.since) > -3).sort(bySince);

  // Clean items worn since the last full wash can be tossed in the hamper by hand
  // (never the pieces the default occasion needs, so today's outfit stays sensible).
  const candidates = (fromDay, toDay) =>
    list()
      .filter(
        (i) =>
          i.laundry.status === 'clean' &&
          isWashable(i) &&
          !needed(i) &&
          (i.laundry.wearsSinceWash ?? 0) > 0 &&
          i.lastWornAt &&
          dayOf(i.lastWornAt) >= fromDay &&
          dayOf(i.lastWornAt) <= toDay,
      )
      .sort((a, b) => a.lastWornAt.localeCompare(b.lastWornAt));

  // Tossed into the hamper on the evening of `day` (never before the item was last worn).
  const toss = (item, day) => {
    const wornDay = dayOf(item.lastWornAt);
    const tossDay = Math.max(day, wornDay);
    const tossedAt = today.add(tossDay, 'day').hour(21).minute(rng.int(0, 40)).toDate();
    const next = setLaundryStatus(item, 'hamper', tossedAt);
    items.set(item.id, next);
    return next;
  };

  // Urgent: worn recently, or worn a while ago and tossed in four days ago.
  for (const item of [...candidates(-5, -3), ...candidates(-HISTORY_DAYS, -6)]) {
    if (urgent.length >= urgentTarget) break;
    urgent.push(toss(item, -4));
  }
  // Fresh: worn in the last two days, or worn earlier and tossed in yesterday.
  for (const item of [...candidates(-2, -1), ...candidates(-HISTORY_DAYS, -3)]) {
    if (fresh.length >= freshTarget) break;
    if (items.get(item.id).laundry.status !== 'clean') continue;
    fresh.push(toss(item, -1));
  }

  // Yesterday evening's load: the oldest overflow first.
  const washing = [];
  while (urgent.length > urgentTarget && washing.length < 4) washing.push(urgent.shift());
  while (fresh.length > freshTarget && washing.length < 4) washing.push(fresh.shift());
  // Anything still over the target was washed the day before and is clean again.
  const earlierLoad = [];
  while (urgent.length > urgentTarget) earlierLoad.push(urgent.shift());

  if (washing.length < washTarget) {
    for (const item of [...candidates(-5, -1), ...candidates(-HISTORY_DAYS, -6)]) {
      if (washing.length >= washTarget) break;
      if (!washing.includes(item)) washing.push(item);
    }
  }
  if (washing.length < 2 && urgent.length + fresh.length > 6) washing.push(fresh.shift());

  const yesterday = today.add(-1, 'day');
  const loadStart = yesterday.hour(19).minute(30).toDate();
  for (const item of washing) {
    const current = items.get(item.id);
    items.set(item.id, setLaundryStatus(current, 'washing', loadStart));
  }
  for (const item of earlierLoad) {
    const current = items.get(item.id);
    items.set(item.id, setLaundryStatus(current, 'clean', yesterday.hour(8).toDate()));
  }
}

/**
 * Generates the demo user's history with targeted adjustments (see module comment).
 * @returns {{ items: object[], logs: object[], outfits: object[] }}
 */
export function buildDemoHistory({ baseItems, outfits, userId, city, defaultOccasion = 'casual', now = new Date() }) {
  const today = dayjs(now).startOf('day');
  const forced = {};
  const excludedRecent = new Set();
  let result = null;

  for (let pass = 0; pass < 6; pass += 1) {
    result = simulateHistory({ baseItems, outfits, userId, city, today, forced, excludedRecent });
    const forgotten = [...result.items.values()].filter((item) => isForgotten(item, today));
    if (forgotten.length >= 4 && forgotten.length <= 6) break;

    if (forgotten.length > 6) {
      // Bring back the easiest items to wear on a suitable recent day.
      const ranked = forgotten
        .map((item) => ({ item, best: bestDayFor(item, { today, city, forced }) }))
        .filter((entry) => entry.best)
        .sort((a, b) => a.best.cost - b.best.cost);
      for (const { item, best } of ranked.slice(0, forgotten.length - 5)) {
        forced[best.offset] = forced[best.offset] ?? {};
        if (item.category === 'accessory') {
          forced[best.offset].accessory = [...(forced[best.offset].accessory ?? []), item.id];
        } else {
          forced[best.offset][item.category] = item.id;
        }
      }
    } else {
      // Leave a few occasional pieces in the closet for the last five weeks.
      const recentCounts = new Map();
      for (const log of result.logs) {
        if (daysBetween(log.date, today) > FORGOTTEN_DAYS) continue;
        for (const id of log.itemIds) recentCounts.set(id, (recentCounts.get(id) ?? 0) + 1);
      }
      const forcedIds = new Set(
        Object.values(forced).flatMap((slots) => Object.values(slots).flatMap((v) => (Array.isArray(v) ? v : [v]))),
      );
      const priority = { accessory: 0, outerwear: 1, footwear: 2, bottom: 3, top: 4 };
      const pool = [...result.items.values()]
        .filter((item) => !isForgotten(item, today) && !forcedIds.has(item.id) && !excludedRecent.has(item.id))
        .sort(
          (a, b) =>
            priority[a.category] - priority[b.category] ||
            (recentCounts.get(a.id) ?? 0) - (recentCounts.get(b.id) ?? 0) ||
            a.id.localeCompare(b.id),
        );
      for (const item of pool.slice(0, 5 - forgotten.length)) excludedRecent.add(item.id);
    }
  }

  finalizeLaundry(result.items, { today, userId, occasion: defaultOccasion });

  const logs = result.logs;
  const finalOutfits = outfits.map((outfit) => {
    const worn = logs.filter((log) => log.outfitId === outfit.id);
    const last = worn.reduce((latest, log) => (!latest || log.createdAt > latest ? log.createdAt : latest), null);
    return { ...outfit, wearCount: worn.length, lastWornAt: last };
  });

  return { items: [...result.items.values()], logs, outfits: finalOutfits };
}

/**
 * Builds every seed table.
 * @param {{ now?: Date }} [options]
 * @returns {Promise<{ users: object[], items: object[], outfits: object[], wearLogs: object[], plans: object[] }>}
 */
export async function buildSeedData({ now = new Date() } = {}) {
  const today = dayjs(now).startOf('day');
  const tables = { users: [], items: [], outfits: [], wearLogs: [], plans: [] };

  for (const seedUser of SEED_USERS) {
    const userId = stableId('usr', seedUser.email);
    const createdAt = today.add(-seedUser.createdDaysAgo, 'day').hour(18).minute(12).toISOString();
    const salt = randomSalt();
    // Demo data: the plaintext seed password is hashed here and then discarded.
    const passwordHash = await hashPassword(seedUser.password, salt);
    tables.users.push({
      id: userId,
      name: seedUser.name,
      email: seedUser.email.toLowerCase(),
      passwordHash,
      salt,
      avatar: { ...seedUser.avatar },
      onboarded: seedUser.onboarded,
      preferences: { ...seedUser.preferences, occasions: [...seedUser.preferences.occasions] },
      createdAt,
      updatedAt: createdAt,
    });

    const samples =
      seedUser.wardrobe === 'full' ? SAMPLE_WARDROBE : (seedUser.wardrobe ?? []).map((key) => SAMPLE_BY_KEY[key]).filter(Boolean);
    const itemRng = createRng(`items:${userId}`);
    const baseItems = samples.map((sample, index) => {
      const added = dayjs(createdAt)
        .add(Math.min(seedUser.createdDaysAgo - 1, 2 + Math.floor(index / 6) + itemRng.int(0, 3)), 'day')
        .hour(itemRng.int(8, 21))
        .minute(itemRng.int(0, 59))
        .toISOString();
      return createItemRecord(sample, { id: stableId('itm', `${userId}:${sample.key}`), userId, createdAt: added });
    });
    const itemIdByKey = Object.fromEntries(baseItems.map((item) => [item.sampleKey, item.id]));

    if (seedUser.wardrobe !== 'full') {
      tables.items.push(...baseItems);
      continue;
    }

    const outfits = SEED_OUTFITS.map((seed, index) => {
      const outfitCreated = today.add(-(60 - index * 7), 'day').hour(20).minute(5 + index).toISOString();
      return {
        id: stableId('out', `${userId}:${seed.key}`),
        userId,
        name: seed.name,
        itemIds: seed.itemKeys.map((key) => itemIdByKey[key]).filter(Boolean),
        occasion: seed.occasion,
        favorite: Boolean(seed.favorite),
        wearCount: 0,
        lastWornAt: null,
        createdAt: outfitCreated,
        updatedAt: outfitCreated,
        deletedAt: null,
      };
    });

    const history = buildDemoHistory({
      baseItems,
      outfits,
      userId,
      city: seedUser.preferences.city,
      defaultOccasion: seedUser.preferences.defaultOccasion,
      now,
    });
    tables.items.push(...history.items);
    tables.outfits.push(...history.outfits);
    tables.wearLogs.push(...history.logs);

    const outfitIdByKey = Object.fromEntries(SEED_OUTFITS.map((seed, i) => [seed.key, history.outfits[i].id]));
    for (const plan of SEED_PLANS) {
      const date = today.add(plan.dayOffset, 'day').format('YYYY-MM-DD');
      const outfitId = plan.outfitKey ? (outfitIdByKey[plan.outfitKey] ?? null) : null;
      const itemIds = plan.outfitKey
        ? (history.outfits.find((o) => o.id === outfitId)?.itemIds ?? [])
        : (plan.itemKeys ?? []).map((key) => itemIdByKey[key]).filter(Boolean);
      const createdAtPlan = today.add(-1, 'day').hour(21).minute(10).toISOString();
      tables.plans.push({
        id: stableId('plan', `${userId}:${date}`),
        userId,
        date,
        outfitId,
        itemIds,
        occasion: plan.occasion,
        note: plan.note ?? '',
        createdAt: createdAtPlan,
        updatedAt: createdAtPlan,
      });
    }
  }
  return tables;
}
