import { useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router';
import { CATEGORY_BY_ID, COLOR_BY_ID, LAUNDRY_STATUS_BY_ID, OCCASION_BY_ID } from '@/data/taxonomy';

/** Sort orders offered by the wardrobe (ids match wardrobeService.listItems). */
export const SORT_OPTIONS = [
  { id: 'recent', label: 'Recently added' },
  { id: 'most-worn', label: 'Most worn' },
  { id: 'least-worn', label: 'Least worn' },
  { id: 'last-worn', label: 'Last worn' },
  { id: 'name', label: 'Name A to Z' },
];

export const SORT_BY_ID = Object.fromEntries(SORT_OPTIONS.map((option) => [option.id, option]));
export const DEFAULT_SORT = 'recent';
export const VIEWS = ['grid', 'list'];

const splitList = (value, valid) =>
  [...new Set(String(value ?? '').split(',').map((part) => part.trim()))].filter((part) => part && valid[part]);

/**
 * Reads the wardrobe filters from URL search params.
 * Params: q, category, colors (comma list), status (comma list), occasion, fav=1, sort, view.
 * Unknown values are ignored so a hand-edited URL never breaks the page.
 * @param {URLSearchParams} searchParams
 */
export function parseWardrobeParams(searchParams) {
  const category = searchParams.get('category');
  const occasion = searchParams.get('occasion');
  const sort = searchParams.get('sort');
  const view = searchParams.get('view');
  return {
    q: searchParams.get('q') ?? '',
    category: category && CATEGORY_BY_ID[category] ? category : 'all',
    colors: splitList(searchParams.get('colors'), COLOR_BY_ID),
    status: splitList(searchParams.get('status'), LAUNDRY_STATUS_BY_ID),
    occasion: occasion && OCCASION_BY_ID[occasion] ? occasion : null,
    fav: searchParams.get('fav') === '1',
    sort: sort && SORT_BY_ID[sort] ? sort : DEFAULT_SORT,
    view: VIEWS.includes(view) ? view : 'grid',
  };
}

/**
 * Turns parsed params into the filters object for useItems. The page and the item drawer
 * both call this, so they share one React Query cache entry and the same order.
 */
export function toItemFilters(params) {
  return {
    q: params.q.trim() || undefined,
    category: params.category === 'all' ? undefined : params.category,
    colors: params.colors.length ? params.colors : undefined,
    status: params.status.length ? params.status : undefined,
    occasion: params.occasion ?? undefined,
    favorite: params.fav ? true : undefined,
    sort: params.sort,
  };
}

/** Number of filters set in the Filters panel (category and search have their own controls). */
export function countPanelFilters(params) {
  return params.colors.length + params.status.length + (params.occasion ? 1 : 0) + (params.fav ? 1 : 0);
}

/** True when anything narrows the results (search, category or panel filters). */
export function hasActiveFilters(params) {
  return Boolean(params.q.trim()) || params.category !== 'all' || countPanelFilters(params) > 0;
}

function writeParam(next, key, value) {
  if (value === undefined || value === null || value === '' || value === false) next.delete(key);
  else if (Array.isArray(value)) {
    if (value.length) next.set(key, value.join(','));
    else next.delete(key);
  } else next.set(key, value === true ? '1' : String(value));
}

/**
 * URL-backed wardrobe filters.
 * @returns {{ params: ReturnType<typeof parseWardrobeParams>, filters: object,
 *   update: (patch: object) => void, clearFilters: () => void }}
 */
export function useWardrobeParams() {
  const [searchParams, setSearchParams] = useSearchParams();
  const params = useMemo(() => parseWardrobeParams(searchParams), [searchParams]);
  const filters = useMemo(() => toItemFilters(params), [params]);

  const update = useCallback(
    (patch) => {
      // Start from the live URL, not the hook's snapshot: the router commits in a transition, so a
      // quick second change (or the debounced search) could otherwise write over the first one.
      const next = new URLSearchParams(window.location.search);
      for (const [name, value] of Object.entries(patch)) {
        if (name === 'category') writeParam(next, name, value === 'all' ? null : value);
        else if (name === 'sort') writeParam(next, name, value === DEFAULT_SORT ? null : value);
        else if (name === 'view') writeParam(next, name, value === 'grid' ? null : value);
        else writeParam(next, name, value);
      }
      setSearchParams(next, { replace: true, preventScrollReset: true });
    },
    [setSearchParams],
  );

  const clearFilters = useCallback(
    () => update({ q: null, category: null, colors: null, status: null, occasion: null, fav: null }),
    [update],
  );

  return { params, filters, update, clearFilters };
}
