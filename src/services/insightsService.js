/**
 * Insights: utilisation, wear trends, most worn and forgotten pieces, colour and
 * occasion mix, and wardrobe gaps matched to catalogue products.
 */
import { simulate } from './api/client';
import { ready, requireUser, table } from './api/db';
import { activeItems } from './api/helpers';
import { CATEGORIES, OCCASIONS, isNeutralColor } from '@/data/taxonomy';
import { productsForGap } from '@/data/catalog';
import { isWashable } from '@/lib/laundry';
import { addDays, dateRange, daysBetween, daysSince, startOfWeek, todayISO } from '@/lib/dates';
import { lowerFirst } from '@/lib/format';

/** Items not worn for this many days (or never) count as forgotten. */
export const FORGOTTEN_AFTER_DAYS = 30;
/** New items get this long before they can be called forgotten. */
const NEW_ITEM_GRACE_DAYS = 14;

const count = (items, predicate) => items.filter(predicate).length;
const isWork = (item) => (item.occasions ?? []).includes('work');

/**
 * Gap rules. Each test returns null when there is no gap, or a reason sentence.
 * The `id` matches catalogue products' `fills`.
 */
export const GAP_RULES = [
  {
    id: 'light-rain-layer',
    title: 'A light rain layer',
    test: (items) => {
      const outer = items.filter((i) => i.category === 'outerwear');
      if (outer.some((i) => i.waterproof && (i.warmth ?? 3) <= 3)) return null;
      const heavy = outer.find((i) => i.waterproof);
      return heavy
        ? `Your only waterproof layer is the ${lowerFirst(heavy.name)}, which is too warm for summer storms.`
        : 'Nothing you own keeps the rain off.';
    },
  },
  {
    id: 'work-tops',
    title: 'More tops for work',
    test: (items) => {
      const n = count(items, (i) => i.category === 'top' && isWork(i));
      return n >= 4 ? null : `Only ${n} of your tops ${n === 1 ? 'is' : 'are'} tagged for work, so they are often in the laundry.`;
    },
  },
  {
    id: 'work-bottoms',
    title: 'A second pair of work trousers',
    test: (items) => {
      const n = count(items, (i) => i.category === 'bottom' && isWork(i));
      if (n >= 2) return null;
      return n === 1
        ? 'You have one pair of work trousers, so every work outfit depends on it.'
        : 'None of your bottoms are tagged for work.';
    },
  },
  {
    id: 'rain-footwear',
    title: 'Shoes for wet days',
    test: (items) => (items.some((i) => i.category === 'footwear' && i.waterproof) ? null : 'None of your shoes are waterproof.'),
  },
  {
    id: 'work-footwear',
    title: 'Another pair of work shoes',
    test: (items) => {
      const n = count(items, (i) => i.category === 'footwear' && isWork(i));
      return n >= 2 ? null : `Only ${n} pair of your shoes ${n === 1 ? 'is' : 'are'} tagged for work.`;
    },
  },
  {
    id: 'neutral-bottoms',
    title: 'An easy neutral bottom',
    test: (items) => {
      const n = count(items, (i) => i.category === 'bottom' && isNeutralColor(i.colors?.[0]));
      return n >= 3 ? null : 'Neutral bottoms go with almost every top, and you have few of them.';
    },
  },
  {
    id: 'warm-layers',
    title: 'A warm knit',
    test: (items) =>
      count(items, (i) => i.category === 'top' && (i.warmth ?? 1) >= 3) >= 2 ? null : 'You have few warm tops for cold mornings.',
  },
  {
    id: 'warm-outerwear',
    title: 'A warm coat',
    test: (items) =>
      items.some((i) => i.category === 'outerwear' && (i.warmth ?? 1) >= 4)
        ? null
        : 'Nothing you own is warm enough for the coldest days.',
  },
  {
    id: 'everyday-tops',
    title: 'More everyday tops',
    test: (items) => {
      const n = count(items, (i) => i.category === 'top');
      return n >= 7 ? null : `With ${n} ${n === 1 ? 'top' : 'tops'}, laundry day comes around fast.`;
    },
  },
  {
    id: 'everyday-sneakers',
    title: 'Everyday sneakers',
    test: (items) =>
      count(items, (i) => i.type === 'sneakers' || i.type === 'trainers') >= 2
        ? null
        : 'One more pair of casual shoes would share the load.',
  },
];

/**
 * Wardrobe statistics for the last `rangeDays` days (wears, mix) and all-time totals.
 * @param {{ rangeDays?: number }} [params]
 * @returns {Promise<{
 *   range: { from: string, to: string, days: number },
 *   totals: { items: number, washable: number, favorites: number, wornDistinct: number, utilization: number,
 *     avgWears: number, totalValue: number, avgCostPerWear: number|null, outfitsLogged: number },
 *   wearsByWeek: { weekStart: string, count: number }[],
 *   byCategory: { category: string, count: number, worn: number }[],
 *   mostWorn: { item: object, count: number }[],
 *   forgotten: { item: object, daysSinceWorn: number|null }[],
 *   colorMix: { color: string, count: number, share: number }[],
 *   occasionMix: { occasion: string, count: number }[],
 *   gaps: { id: string, title: string, reason: string, product: object }[]
 * }>}
 */
export function getInsights({ rangeDays = 30 } = {}) {
  return simulate(async () => {
    await ready();
    const user = requireUser();
    const days = Math.min(365, Math.max(7, Math.round(Number(rangeDays) || 30)));
    const to = todayISO();
    const from = addDays(to, -(days - 1));
    const now = new Date();

    const items = activeItems(user.id);
    const byId = new Map(items.map((item) => [item.id, item]));
    const logs = table('wearLogs').filter((log) => log.userId === user.id && log.date >= from && log.date <= to);

    const wearCounts = new Map();
    for (const log of logs) {
      for (const id of log.itemIds) if (byId.has(id)) wearCounts.set(id, (wearCounts.get(id) ?? 0) + 1);
    }
    const totalItemWears = [...wearCounts.values()].reduce((sum, n) => sum + n, 0);

    const priced = items.filter((item) => typeof item.price === 'number');
    const totalValue = priced.reduce((sum, item) => sum + item.price, 0);
    const pricedWears = priced.reduce((sum, item) => sum + (item.wearCount ?? 0), 0);

    // Weeks (Monday start) overlapping the range.
    const weekStarts = [...new Set(dateRange(from, to).map((date) => startOfWeek(date)))];
    const wearsByWeek = weekStarts.map((weekStart) => {
      const weekEnd = addDays(weekStart, 6);
      return { weekStart, count: logs.filter((log) => log.date >= weekStart && log.date <= weekEnd).length };
    });

    const byCategory = CATEGORIES.map(({ id }) => {
      const inCategory = items.filter((item) => item.category === id);
      return { category: id, count: inCategory.length, worn: inCategory.filter((item) => wearCounts.has(item.id)).length };
    });

    const mostWorn = [...wearCounts.entries()]
      .sort((a, b) => b[1] - a[1] || byId.get(a[0]).name.localeCompare(byId.get(b[0]).name))
      .slice(0, 5)
      .map(([id, n]) => ({ item: byId.get(id), count: n }));

    const forgotten = items
      .filter((item) => daysBetween(item.createdAt, now) >= NEW_ITEM_GRACE_DAYS)
      .map((item) => ({ item, daysSinceWorn: daysSince(item.lastWornAt, now) }))
      .filter(({ daysSinceWorn }) => daysSinceWorn === null || daysSinceWorn >= FORGOTTEN_AFTER_DAYS)
      .sort(
        (a, b) =>
          (b.daysSinceWorn ?? Infinity) - (a.daysSinceWorn ?? Infinity) || a.item.name.localeCompare(b.item.name),
      );

    const colorCounts = new Map();
    for (const log of logs) {
      for (const id of log.itemIds) {
        const color = byId.get(id)?.colors?.[0];
        if (color) colorCounts.set(color, (colorCounts.get(color) ?? 0) + 1);
      }
    }
    const colorMix = [...colorCounts.entries()]
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
      .map(([color, n]) => ({
        color,
        count: n,
        share: totalItemWears ? Math.round((n / totalItemWears) * 100) / 100 : 0,
      }));

    const occasionMix = OCCASIONS.map(({ id }) => ({
      occasion: id,
      count: logs.filter((log) => log.occasion === id).length,
    }));

    const gaps = GAP_RULES.map((rule) => ({ rule, reason: rule.test(items) }))
      .filter(({ reason }) => Boolean(reason))
      .map(({ rule, reason }) => ({
        id: rule.id,
        title: rule.title,
        reason,
        product: productsForGap(rule.id)[0] ?? null,
      }))
      .filter((gap) => gap.product)
      .slice(0, 3);

    return {
      range: { from, to, days },
      totals: {
        items: items.length,
        washable: items.filter(isWashable).length,
        favorites: items.filter((item) => item.favorite).length,
        wornDistinct: wearCounts.size,
        utilization: items.length ? Math.round((wearCounts.size / items.length) * 100) / 100 : 0,
        avgWears: items.length ? Math.round((totalItemWears / items.length) * 10) / 10 : 0,
        totalValue: Math.round(totalValue * 100) / 100,
        avgCostPerWear: pricedWears > 0 ? Math.round((totalValue / pricedWears) * 100) / 100 : null,
        outfitsLogged: logs.length,
      },
      wearsByWeek,
      byCategory,
      mostWorn,
      forgotten,
      colorMix,
      occasionMix,
      gaps,
    };
  });
}
