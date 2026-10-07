import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router';
import { useAuth } from '@/context/AuthContext';
import { useRecommendation, useWeather } from '@/hooks/api';
import { todayISO } from '@/lib/dates';
import { CORE_SLOTS, buildPreviewWeather, comboKey, countLocks, lockedFromItems, parseOccasion, parsePreview } from './todayUtils';

const SESSION_KEY = 'alclo.today';
const MAX_SHUFFLE_TRIES = 5;

function readSession() {
  const fresh = { date: todayISO(), seed: 0, locked: {}, exclude: [] };
  try {
    const stored = JSON.parse(sessionStorage.getItem(SESSION_KEY) ?? 'null');
    if (stored && stored.date === fresh.date && typeof stored.seed === 'number' && stored.locked) {
      const exclude = Array.isArray(stored.exclude) ? stored.exclude.filter((id) => typeof id === 'string') : [];
      return { ...fresh, seed: stored.seed, locked: stored.locked, exclude };
    }
  } catch {
    /* storage unavailable: start fresh */
  }
  return fresh;
}

/**
 * State and data for today's outfit.
 * URL: ?occasion=, ?view=flatlay, ?temp=&condition= (weather preview).
 * Session (survives a refresh, resets the next day): the shuffle seed and the locked slots.
 */
export default function useTodayOutfit() {
  const { user } = useAuth();
  const prefs = user?.preferences ?? {};
  const unit = prefs.tempUnit ?? 'C';
  const [searchParams, setSearchParams] = useSearchParams();

  const defaultOccasion = parseOccasion(prefs.defaultOccasion) ?? 'casual';
  const occasion = parseOccasion(searchParams.get('occasion')) ?? defaultOccasion;
  const view = searchParams.get('view') === 'flatlay' ? 'flatlay' : 'tiles';
  const preview = parsePreview(searchParams);

  const [session, setSession] = useState(readSession);
  const [shuffle, setShuffle] = useState(null);
  const [stuckCount, setStuckCount] = useState(0);
  const { seed, locked } = session;
  const lockedIds = useMemo(() => new Set(Object.values(locked).flat().filter(Boolean)), [locked]);
  // A locked piece always wins, so never send it as excluded.
  const exclude = useMemo(() => session.exclude.filter((id) => !lockedIds.has(id)), [session.exclude, lockedIds]);

  useEffect(() => {
    try {
      sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
    } catch {
      /* ignore */
    }
  }, [session]);

  const weatherQuery = useWeather();
  const realWeather = weatherQuery.data ?? null;
  const previewTemp = preview?.tempC ?? null;
  const previewCondition = preview?.condition ?? null;
  const weather = useMemo(
    () =>
      previewCondition
        ? buildPreviewWeather(realWeather, { tempC: previewTemp, condition: previewCondition })
        : realWeather,
    [realWeather, previewTemp, previewCondition],
  );
  const weatherSettled = weatherQuery.isSuccess || weatherQuery.isError;

  const recQuery = useRecommendation(
    { occasion, weather: weather ?? undefined, seed, locked, exclude },
    { enabled: Boolean(preview) || weatherSettled },
  );
  const rec = recQuery.data ?? null;
  const settled = Boolean(rec) && !recQuery.isPlaceholderData && !recQuery.isFetching;

  // A shuffle that lands on the same pieces tries again (adjusting state during render). The first
  // retry only changes the seed; later ones also leave out the current piece of one unlocked slot,
  // so a thin wardrobe still gets a visible change when any other clean piece fits.
  if (shuffle && settled) {
    const unchanged = comboKey(rec.itemIds) === shuffle.fromKey;
    const open = CORE_SLOTS.filter((slot) => !locked[slot] && rec.slots[slot]);
    if (unchanged && shuffle.tries < MAX_SHUFFLE_TRIES && (shuffle.tries === 0 || open.length > 0)) {
      const tries = shuffle.tries + 1;
      setShuffle({ ...shuffle, tries });
      setSession((current) => {
        const next = { ...current, seed: current.seed + 1 };
        if (tries > 1) {
          const slot = open[(tries - 2) % open.length];
          next.exclude = [...new Set([...current.exclude, rec.slots[slot].id])];
        }
        return next;
      });
    } else {
      setShuffle(null);
      if (unchanged) setStuckCount((count) => count + 1);
    }
  }

  const updateParams = useCallback(
    (patch) => {
      setSearchParams(
        (current) => {
          const next = new URLSearchParams(current);
          for (const [key, value] of Object.entries(patch)) {
            if (value === null || value === undefined || value === '') next.delete(key);
            else next.set(key, String(value));
          }
          return next;
        },
        { replace: true, preventScrollReset: true },
      );
    },
    [setSearchParams],
  );

  const setOccasion = useCallback(
    (id) => {
      updateParams({ occasion: id === defaultOccasion ? null : id });
      setSession((current) => ({ ...current, seed: 0, exclude: [] }));
    },
    [defaultOccasion, updateParams],
  );

  const setView = useCallback((next) => updateParams({ view: next === 'flatlay' ? 'flatlay' : null }), [updateParams]);

  const setPreview = useCallback(
    (next) => updateParams(next ? { temp: next.tempC, condition: next.condition } : { temp: null, condition: null }),
    [updateParams],
  );

  const setLocked = useCallback((updater) => {
    setSession((current) => {
      const next = typeof updater === 'function' ? updater(current.locked) : updater;
      return { ...current, locked: next ?? {} };
    });
  }, []);

  const shuffleOutfit = useCallback(() => {
    if (!rec) return;
    setShuffle({ fromKey: comboKey(rec.itemIds), tries: 0 });
    // Each shuffle starts from the full wardrobe again; only its own retries leave pieces out.
    setSession((current) => ({ ...current, seed: current.seed + 1, exclude: [] }));
  }, [rec]);

  /** Lock or unlock one core slot, or the whole accessories row. */
  const toggleLock = useCallback(
    (slot) => {
      if (!rec) return;
      setLocked((current) => {
        const next = { ...current };
        if (slot === 'accessory') {
          if (next.accessory?.length) delete next.accessory;
          else next.accessory = rec.slots.accessory.map((item) => item.id);
        } else if (next[slot]) {
          delete next[slot];
        } else if (rec.slots[slot]) {
          next[slot] = rec.slots[slot].id;
        }
        return next;
      });
    },
    [rec, setLocked],
  );

  /**
   * Places an item in its slot and locks it. For accessories, `replacingId` is the accessory being
   * swapped out (the rest of the row is kept and the row is locked).
   */
  const placeItem = useCallback(
    (item, { replacingId = null } = {}) => {
      if (!item) return;
      setLocked((current) => {
        if (item.category !== 'accessory') return { ...current, [item.category]: item.id };
        const shown = rec?.slots.accessory.map((entry) => entry.id) ?? [];
        const base = current.accessory?.length ? current.accessory : shown;
        let ids = replacingId ? base.map((id) => (id === replacingId ? item.id : id)) : [...base, item.id];
        if (!ids.includes(item.id)) ids = [...ids, item.id];
        return { ...current, accessory: [...new Set(ids)].slice(-3) };
      });
    },
    [rec, setLocked],
  );

  const lockItems = useCallback((items) => setLocked(lockedFromItems(items)), [setLocked]);
  const clearLocks = useCallback(() => setLocked({}), [setLocked]);

  return {
    user,
    unit,
    occasion,
    defaultOccasion,
    view,
    preview,
    weatherQuery,
    realWeather,
    weather,
    recQuery,
    rec,
    locked,
    lockCount: countLocks(locked),
    isShuffling: Boolean(shuffle) || (recQuery.isPlaceholderData && recQuery.isFetching),
    /** Increments each time a shuffle could not find a different combination. */
    stuckCount,
    setOccasion,
    setView,
    setPreview,
    setLocked,
    shuffleOutfit,
    toggleLock,
    placeItem,
    lockItems,
    clearLocks,
  };
}
