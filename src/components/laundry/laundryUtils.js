import { CATEGORIES } from '@/data/taxonomy';
import { laundryReason } from '@/lib/laundry';

/** Columns of the laundry board, in flow order. `key` is the overview list, `tab` the URL value. */
export const COLUMNS = [
  {
    id: 'hamper',
    key: 'hamper',
    status: 'hamper',
    label: 'Hamper',
    tabLabel: 'Hamper',
  },
  {
    id: 'washing',
    key: 'washing',
    status: 'washing',
    label: 'In the wash',
    tabLabel: 'In the wash',
  },
  {
    id: 'clean',
    key: 'recentlyCleaned',
    status: 'clean',
    label: 'Recently cleaned',
    tabLabel: 'Clean',
  },
];

export const COLUMN_BY_ID = Object.fromEntries(COLUMNS.map((column) => [column.id, column]));

/** Only these categories go through the laundry. */
export const LAUNDRY_CATEGORIES = CATEGORIES.filter((category) => ['top', 'bottom', 'outerwear'].includes(category.id));

export const SORTS = [
  { id: 'waiting', label: 'Waiting longest' },
  { id: 'name', label: 'Name' },
  { id: 'category', label: 'Category' },
];

const CATEGORY_ORDER = Object.fromEntries(CATEGORIES.map((category, index) => [category.id, index]));

const byName = (a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: 'base' });

function bySince(a, b) {
  return String(a.laundry?.since ?? '').localeCompare(String(b.laundry?.since ?? ''));
}

/**
 * Filters and sorts one column. "Waiting longest" keeps urgent pieces first in the hamper and shows
 * the most recently washed pieces first in the clean column (that is the useful order there).
 */
export function prepareColumn(items, { columnId, q, category, sort }) {
  const needle = q.trim().toLowerCase();
  const filtered = items.filter((item) => {
    if (category && item.category !== category) return false;
    if (!needle) return true;
    return [item.name, item.type, item.brand, ...(item.colors ?? [])]
      .filter(Boolean)
      .some((value) => String(value).toLowerCase().includes(needle));
  });
  const sorted = [...filtered];
  if (sort === 'name') sorted.sort(byName);
  else if (sort === 'category') {
    sorted.sort((a, b) => (CATEGORY_ORDER[a.category] ?? 9) - (CATEGORY_ORDER[b.category] ?? 9) || byName(a, b));
  } else if (columnId === 'clean') sorted.sort((a, b) => bySince(b, a));
  else if (columnId === 'hamper')
    sorted.sort((a, b) => Number(Boolean(b.urgent)) - Number(Boolean(a.urgent)) || bySince(a, b));
  else sorted.sort(bySince);
  return sorted;
}

/** Reason line for a row, recomputed so optimistic moves read correctly before the refetch lands. */
export function reasonFor(item, now = new Date()) {
  return laundryReason(item, now) || item.reason || '';
}

/** "1 piece" / "3 pieces" */
export function pieces(count) {
  return `${count} ${count === 1 ? 'piece' : 'pieces'}`;
}

/** Page subtitle from the overview counts. */
export function laundrySubtitle(counts) {
  if (!counts) return '';
  const { hamper = 0, urgent = 0, washing = 0 } = counts;
  if (hamper > 0) {
    const waiting = `${pieces(hamper)} waiting`;
    const extra = [urgent > 0 ? `${urgent} urgent` : null, washing > 0 ? `${washing} in the wash` : null].filter(
      Boolean,
    );
    return extra.length ? `${waiting}, ${extra.join(', ')}` : waiting;
  }
  if (washing > 0) return `Nothing waiting. ${pieces(washing)} in the wash.`;
  return 'Everything you have worn is clean.';
}

/** Tile hint for the hamper: how long the oldest piece has waited. */
export function waitHint(days) {
  if (!days) return 'Everything went in today';
  return `Longest wait ${days} ${days === 1 ? 'day' : 'days'}`;
}

/** Tile hint for the wash: when the oldest piece went in. */
export function washHint(days) {
  if (!days) return 'Started today';
  if (days === 1) return 'Started yesterday';
  return `Started ${days} days ago`;
}

/** Which list each item id sits in, with its index, for an overview object. */
function locate(overview) {
  const map = new Map();
  for (const column of COLUMNS) {
    (overview?.[column.key] ?? []).forEach((item, index) => map.set(item.id, { key: column.key, index, item }));
  }
  return map;
}

/**
 * Optimistic Undo: puts the pieces in `snapshot` back where they were in `before` (the overview
 * captured just before the move) without touching any other piece, then recomputes the counts.
 * The server restore runs alongside and the refetch replaces this with the real state.
 */
export function restoreOverview(current, before, snapshot) {
  if (!current || !before || !Array.isArray(snapshot) || snapshot.length === 0) return current;
  const ids = new Set(snapshot.map((entry) => entry.id));
  const previous = locate(before);
  const next = Object.fromEntries(
    COLUMNS.map((column) => [column.key, current[column.key].filter((item) => !ids.has(item.id))]),
  );

  const returning = [...ids]
    .map((id) => previous.get(id))
    .filter(Boolean)
    .sort((a, b) => a.index - b.index);
  for (const { key, index, item } of returning) {
    const list = next[key];
    list.splice(Math.min(index, list.length), 0, item);
  }

  const { washable = 0 } = current.counts ?? {};
  const hamper = next.hamper.length;
  const washing = next.washing.length;
  const clean = Math.max(0, washable - hamper - washing);
  return {
    ...current,
    ...next,
    counts: {
      ...current.counts,
      hamper,
      urgent: next.hamper.filter((item) => item.urgent).length,
      washing,
      clean,
    },
    readiness: washable ? Math.round((clean / washable) * 100) / 100 : 1,
  };
}
