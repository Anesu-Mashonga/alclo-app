/**
 * Laundry: hamper and wash queues with reasons and urgency, state moves that
 * return an Undo snapshot, and snapshot restore.
 */
import { ApiError, simulate } from './api/client';
import { find, ready, requireUser, transaction, update } from './api/db';
import { activeItems, ownedItem, prefsOf, toIdList } from './api/helpers';
import { daysInStatus, isUrgent, isWashable, laundryReason, setLaundryStatus } from '@/lib/laundry';

const RECENT_HOURS = 48;

/** Item plus computed laundry fields: urgent, daysInStatus, reason. */
function decorate(item, urgentAfterDays, now) {
  return {
    ...item,
    urgent: isUrgent(item, urgentAfterDays, now),
    daysInStatus: daysInStatus(item, now),
    reason: laundryReason(item, now),
  };
}

/**
 * Laundry overview for the signed-in user.
 * Hamper is sorted urgent first, then oldest first. `readiness` is the share of washable items that are clean.
 * @returns {Promise<{ hamper: object[], washing: object[], recentlyCleaned: object[],
 *   counts: { hamper: number, urgent: number, washing: number, clean: number, washable: number }, readiness: number }>}
 */
export function getLaundry() {
  return simulate(async () => {
    await ready();
    const user = requireUser();
    const now = new Date();
    const { urgentAfterDays } = prefsOf(user);
    const washable = activeItems(user.id).filter(isWashable).map((item) => decorate(item, urgentAfterDays, now));

    const hamper = washable
      .filter((item) => item.laundry.status === 'hamper')
      .sort((a, b) => Number(b.urgent) - Number(a.urgent) || a.laundry.since.localeCompare(b.laundry.since));
    const washing = washable
      .filter((item) => item.laundry.status === 'washing')
      .sort((a, b) => a.laundry.since.localeCompare(b.laundry.since));
    const clean = washable.filter((item) => item.laundry.status === 'clean');
    const cutoff = now.getTime() - RECENT_HOURS * 3600000;
    const recentlyCleaned = clean
      .filter((item) => {
        const since = new Date(item.laundry.since).getTime();
        // Items created clean were never washed, so they do not count as "just cleaned".
        return since >= cutoff && since - new Date(item.createdAt).getTime() > 60000 && (item.laundry.wearsSinceWash ?? 0) === 0;
      })
      .sort((a, b) => b.laundry.since.localeCompare(a.laundry.since));

    return {
      hamper,
      washing,
      recentlyCleaned,
      counts: {
        hamper: hamper.length,
        urgent: hamper.filter((item) => item.urgent).length,
        washing: washing.length,
        clean: clean.length,
        washable: washable.length,
      },
      readiness: washable.length === 0 ? 1 : Math.round((clean.length / washable.length) * 100) / 100,
    };
  });
}

/**
 * Moves the given items to `to` when their current status is in `from`.
 * Items that are not washable, or already elsewhere, are skipped.
 */
function transition(ids, { from, to }) {
  return simulate(async () => {
    await ready();
    const user = requireUser();
    const list = toIdList(ids);
    if (list.length === 0) throw new ApiError(422, 'validation', 'Select at least one item.');
    const items = list.map((id) => ownedItem(user.id, id));
    const washable = items.filter(isWashable);
    if (washable.length === 0) {
      throw new ApiError(422, 'not_washable', 'Shoes and accessories do not go through the laundry.');
    }
    const movable = washable.filter((item) => from.includes(item.laundry.status));
    const now = new Date();
    const { urgentAfterDays } = prefsOf(user);
    return transaction(() => {
      const snapshot = movable.map((item) => ({ id: item.id, laundry: { ...item.laundry } }));
      const changed = movable.map((item) => {
        const next = { ...setLaundryStatus(item, to, now), updatedAt: now.toISOString() };
        update('items', item.id, next);
        return decorate(next, urgentAfterDays, now);
      });
      const movedIds = new Set(movable.map((item) => item.id));
      return { items: changed, snapshot, skipped: list.filter((id) => !movedIds.has(id)) };
    });
  });
}

/**
 * Puts items in the hamper (from clean, or taken back out of the wash).
 * @param {string|string[]} ids
 * @returns {Promise<{ items: object[], snapshot: { id: string, laundry: object }[], skipped: string[] }>}
 */
export function moveToHamper(ids) {
  return transition(ids, { from: ['clean', 'washing'], to: 'hamper' });
}

/**
 * Starts a wash (from the hamper, or straight from clean).
 * @param {string|string[]} ids
 */
export function startWash(ids) {
  return transition(ids, { from: ['hamper', 'clean'], to: 'washing' });
}

/**
 * Finishes a wash: washing items become clean with their wear counter reset.
 * @param {string|string[]} ids
 */
export function finishWash(ids) {
  return transition(ids, { from: ['washing'], to: 'clean' });
}

/**
 * Marks items clean without a wash cycle (for example, aired out).
 * @param {string|string[]} ids
 */
export function markClean(ids) {
  return transition(ids, { from: ['hamper', 'washing'], to: 'clean' });
}

/**
 * Restores laundry states from a snapshot returned by a move (Undo).
 * @param {{ id: string, laundry: object }[]} snapshot
 * @returns {Promise<{ items: object[] }>}
 */
export function restoreLaundry(snapshot) {
  return simulate(async () => {
    await ready();
    const user = requireUser();
    const entries = Array.isArray(snapshot) ? snapshot : [];
    const now = new Date();
    const { urgentAfterDays } = prefsOf(user);
    return transaction(() => {
      const items = [];
      for (const entry of entries) {
        const item = find('items', entry?.id);
        if (!item || item.userId !== user.id || !entry.laundry) continue;
        const next = update('items', item.id, { laundry: { ...entry.laundry }, updatedAt: now.toISOString() });
        items.push(decorate(next, urgentAfterDays, now));
      }
      return { items };
    });
  });
}
