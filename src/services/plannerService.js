/**
 * Planner: one plan per user per date, pointing at a saved outfit and/or items.
 */
import { assertValid, simulate } from './api/client';
import { find, insert, ready, removeWhere, requireUser, table, transaction, update } from './api/db';
import { activeItems, decoratePlan, prefsOf, toIdList } from './api/helpers';
import { OCCASION_BY_ID } from '@/data/taxonomy';
import { addDays, isISODate, startOfWeek, todayISO } from '@/lib/dates';
import { createId } from '@/lib/random';

/**
 * Plans in an inclusive date range, oldest first. Default: this week and next (Monday start).
 * @param {{ from?: string, to?: string }} [range]
 */
export function listPlans({ from, to } = {}) {
  return simulate(async () => {
    await ready();
    const user = requireUser();
    const start = from ?? startOfWeek(todayISO());
    const end = to ?? addDays(start, 13);
    assertValid({
      from: isISODate(start) ? null : 'Choose a valid start date.',
      to: isISODate(end) ? null : 'Choose a valid end date.',
    });
    return table('plans')
      .filter((plan) => plan.userId === user.id && plan.date >= start && plan.date <= end)
      .sort((a, b) => a.date.localeCompare(b.date))
      .map(decoratePlan);
  });
}

/**
 * Creates or replaces the plan for a date.
 * Needs an outfit or at least one item; with only an outfit, its items are used.
 * @param {{ date: string, outfitId?: string|null, itemIds?: string[], occasion?: string, note?: string }} values
 */
export function setPlan({ date, outfitId = null, itemIds, occasion, note = '' } = {}) {
  return simulate(async () => {
    await ready();
    const user = requireUser();
    const outfit = outfitId ? find('outfits', outfitId) : null;
    const validOutfit = outfit && outfit.userId === user.id && !outfit.deletedAt ? outfit : null;
    const owned = new Set(activeItems(user.id).map((item) => item.id));
    const ids = toIdList(itemIds ?? validOutfit?.itemIds ?? []).filter((id) => owned.has(id));
    const resolvedOccasion = occasion ?? validOutfit?.occasion ?? prefsOf(user).defaultOccasion;
    const text = String(note ?? '').trim();

    assertValid({
      date: isISODate(date) ? null : 'Choose a date.',
      outfitId: outfitId && !validOutfit ? 'That outfit no longer exists.' : null,
      itemIds: ids.length === 0 ? 'Pick an outfit or at least one item.' : null,
      occasion: OCCASION_BY_ID[resolvedOccasion] ? null : 'Choose an occasion.',
      note: text.length > 140 ? 'Keep the note under 140 characters.' : null,
    });

    const now = new Date().toISOString();
    const existing = table('plans').find((plan) => plan.userId === user.id && plan.date === date);
    const fields = { outfitId: validOutfit?.id ?? null, itemIds: ids, occasion: resolvedOccasion, note: text, updatedAt: now };
    const plan = transaction(() =>
      existing
        ? update('plans', existing.id, fields)
        : insert('plans', { id: createId('plan'), userId: user.id, date, ...fields, createdAt: now }),
    );
    return decoratePlan(plan);
  });
}

/**
 * Removes the plan for a date. Returns the removed plan so the UI can offer Undo via setPlan.
 * @param {string} date 'YYYY-MM-DD'
 * @returns {Promise<{ date: string, previous: object|null }>}
 */
export function clearPlan(date) {
  return simulate(async () => {
    await ready();
    const user = requireUser();
    assertValid({ date: isISODate(date) ? null : 'Choose a date.' });
    const removed = transaction(() => removeWhere('plans', (plan) => plan.userId === user.id && plan.date === date));
    return { date, previous: removed[0] ?? null };
  });
}
