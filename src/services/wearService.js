/**
 * Wear logging: records what was worn (updating wear counts and laundry),
 * exact undo, today's log and history.
 */
import { ApiError, assertValid, simulate } from './api/client';
import { find, insert, ready, removeWhere, requireUser, table, transaction, update } from './api/db';
import { activeItems, decorateLog, prefsOf, toIdList } from './api/helpers';
import { OCCASION_BY_ID } from '@/data/taxonomy';
import { applyWear } from '@/lib/laundry';
import { createId } from '@/lib/random';
import { addDays, dayjs, isISODate, todayISO } from '@/lib/dates';

const sameLaundry = (a, b) =>
  Boolean(a && b) &&
  a.status === b.status &&
  (a.wearsSinceWash ?? 0) === (b.wearsSinceWash ?? 0) &&
  (a.washAfter ?? null) === (b.washAfter ?? null) &&
  a.since === b.since;

const laterOf = (a, b) => (!a ? b : !b ? a : a > b ? a : b);

/**
 * Logs an outfit as worn. Washable items that reach their wash-after count move to the hamper.
 * @param {{ itemIds: string[], outfitId?: string|null, occasion?: string, weather?: object|null, date?: string }} values
 *   `date` is 'YYYY-MM-DD' (default today, never in the future).
 * @returns {Promise<{ log: object, items: object[], movedToHamper: object[] }>}
 */
export function wearItems({ itemIds, outfitId = null, occasion, weather = null, date } = {}) {
  return simulate(async () => {
    await ready();
    const user = requireUser();
    const today = todayISO();
    const day = date ?? today;
    const ids = toIdList(itemIds);
    assertValid({
      itemIds: ids.length === 0 ? 'Pick at least one item to wear.' : null,
      date: !isISODate(day) ? 'Choose a valid date.' : day > today ? 'You can only log outfits for today or earlier.' : null,
      occasion: occasion && !OCCASION_BY_ID[occasion] ? 'Choose an occasion.' : null,
    });

    const byId = new Map(activeItems(user.id).map((item) => [item.id, item]));
    const missing = ids.filter((id) => !byId.has(id));
    if (missing.length > 0) {
      throw new ApiError(404, 'not_found', 'Some of these items no longer exist. Refresh and try again.');
    }
    const outfit = outfitId ? find('outfits', outfitId) : null;
    const linkedOutfit = outfit && outfit.userId === user.id && !outfit.deletedAt ? outfit : null;

    const now = new Date();
    const wornAt = day === today ? now : dayjs(day).hour(12).minute(0).second(0).toDate();
    const wornAtISO = wornAt.toISOString();

    return transaction(() => {
      const snapshots = [];
      const updated = [];
      const movedToHamper = [];
      for (const id of ids) {
        const before = byId.get(id);
        const worn = applyWear(before, wornAt);
        const next = { ...worn, lastWornAt: laterOf(before.lastWornAt, worn.lastWornAt), updatedAt: now.toISOString() };
        update('items', id, next);
        snapshots.push({
          id,
          wearCount: before.wearCount ?? 0,
          lastWornAt: before.lastWornAt ?? null,
          updatedAt: before.updatedAt,
          laundry: { ...before.laundry },
          afterLaundry: { ...next.laundry },
          afterLastWornAt: next.lastWornAt,
        });
        updated.push(next);
        if (before.laundry?.status !== 'hamper' && next.laundry?.status === 'hamper') movedToHamper.push(next);
      }

      let outfitSnapshot = null;
      if (linkedOutfit) {
        outfitSnapshot = { id: linkedOutfit.id, wearCount: linkedOutfit.wearCount ?? 0, lastWornAt: linkedOutfit.lastWornAt ?? null };
        update('outfits', linkedOutfit.id, {
          wearCount: (linkedOutfit.wearCount ?? 0) + 1,
          lastWornAt: laterOf(linkedOutfit.lastWornAt, wornAtISO),
        });
      }

      const log = {
        id: createId('wear'),
        userId: user.id,
        date: day,
        itemIds: ids,
        outfitId: linkedOutfit?.id ?? null,
        occasion: occasion ?? linkedOutfit?.occasion ?? prefsOf(user).defaultOccasion,
        weather:
          weather && Number.isFinite(weather.tempC)
            ? { tempC: Math.round(weather.tempC), condition: weather.condition ?? 'clouds' }
            : null,
        snapshots,
        outfitSnapshot,
        wornAt: wornAtISO,
        createdAt: now.toISOString(),
      };
      insert('wearLogs', log);
      return { log: decorateLog(log), items: updated, movedToHamper };
    });
  });
}

/**
 * Undoes a wear log. Items whose laundry has not changed since are restored exactly;
 * items that were washed or moved afterwards keep their current laundry state.
 * @param {string} logId
 * @returns {Promise<{ log: object, items: object[] }>}
 */
export function undoWear(logId) {
  return simulate(async () => {
    await ready();
    const user = requireUser();
    const log = find('wearLogs', logId);
    if (!log || log.userId !== user.id) {
      throw new ApiError(404, 'not_found', 'That outfit log no longer exists.');
    }
    const wornAt = log.wornAt ?? log.createdAt;
    return transaction(() => {
      const restored = [];
      for (const snapshot of log.snapshots ?? []) {
        const item = find('items', snapshot.id);
        if (!item) continue;
        const untouched = sameLaundry(item.laundry, snapshot.afterLaundry);
        const lastWornUnchanged = item.lastWornAt === (snapshot.afterLastWornAt ?? wornAt);
        const next = {
          ...item,
          wearCount: Math.max(0, (item.wearCount ?? 0) - 1),
          lastWornAt: lastWornUnchanged ? snapshot.lastWornAt : item.lastWornAt,
          laundry: untouched ? { ...snapshot.laundry } : item.laundry,
        };
        // Nothing else happened since: put the row back exactly as it was.
        next.updatedAt = untouched && lastWornUnchanged ? (snapshot.updatedAt ?? item.updatedAt) : new Date().toISOString();
        update('items', item.id, next);
        restored.push(next);
      }
      if (log.outfitId) {
        const outfit = find('outfits', log.outfitId);
        if (outfit) {
          const snap = log.outfitSnapshot;
          const unchanged = snap && outfit.lastWornAt === laterOf(snap.lastWornAt, wornAt);
          update('outfits', outfit.id, {
            wearCount: Math.max(0, (outfit.wearCount ?? 0) - 1),
            lastWornAt: unchanged ? snap.lastWornAt : outfit.lastWornAt,
          });
        }
      }
      removeWhere('wearLogs', (row) => row.id === log.id);
      return { log, items: restored };
    });
  });
}

/**
 * The most recent log for today, with items attached, or null.
 */
export function getTodayLog() {
  return simulate(async () => {
    await ready();
    const user = requireUser();
    const today = todayISO();
    const logs = table('wearLogs')
      .filter((log) => log.userId === user.id && log.date === today)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    return logs[0] ? decorateLog(logs[0]) : null;
  });
}

/**
 * Wear logs in an inclusive date range (default: the last 30 days), newest first.
 * @param {{ from?: string, to?: string }} [range] 'YYYY-MM-DD' dates
 */
export function listWearLogs({ from, to } = {}) {
  return simulate(async () => {
    await ready();
    const user = requireUser();
    const end = to ?? todayISO();
    const start = from ?? addDays(end, -29);
    assertValid({
      from: isISODate(start) ? null : 'Choose a valid start date.',
      to: isISODate(end) ? null : 'Choose a valid end date.',
    });
    return table('wearLogs')
      .filter((log) => log.userId === user.id && log.date >= start && log.date <= end)
      .sort((a, b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt))
      .map(decorateLog);
  });
}
