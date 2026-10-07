import CloseOutlined from '@mui/icons-material/CloseOutlined';
import SearchOutlined from '@mui/icons-material/SearchOutlined';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import IconButton from '@mui/material/IconButton';
import InputAdornment from '@mui/material/InputAdornment';
import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';
import TextField from '@mui/material/TextField';
import Tooltip from '@mui/material/Tooltip';
import { useEffect, useRef, useState } from 'react';
import cx from '@/components/common/cx';
import Kbd from '@/components/common/Kbd';
import { CATEGORIES, COLOR_BY_ID, LAUNDRY_STATUS_BY_ID, occasionLabel } from '@/data/taxonomy';
import ColorSwatch from './ColorSwatch';
import SortMenu from './SortMenu';
import WardrobeFilters from './WardrobeFilters';
import { countPanelFilters } from './wardrobeParams';
import './WardrobeToolbar.scss';

const SEARCH_DELAY = 200;

/** Search box that writes `q` to the URL 200ms after typing stops and follows outside changes. */
function SearchField({ value, onSearch, compact = false }) {
  const inputRef = useRef(null);
  const timerRef = useRef(null);
  const [text, setText] = useState(value);
  const [synced, setSynced] = useState(value);
  const [scheduled, setScheduled] = useState(value);

  // Follow URL changes we did not make (Clear all, back/forward).
  if (value !== synced) {
    setSynced(value);
    if (value !== scheduled) {
      setText(value);
      setScheduled(value);
    }
  }

  useEffect(() => {
    const focusSearch = (event) => {
      if (!inputRef.current) return;
      event.preventDefault();
      inputRef.current.focus();
      inputRef.current.select();
    };
    window.addEventListener('alclo:focus-search', focusSearch);
    return () => {
      window.removeEventListener('alclo:focus-search', focusSearch);
      window.clearTimeout(timerRef.current);
    };
  }, []);

  const schedule = (next, delay = SEARCH_DELAY) => {
    setText(next);
    setScheduled(next);
    window.clearTimeout(timerRef.current);
    if (delay === 0) onSearch(next);
    else timerRef.current = window.setTimeout(() => onSearch(next), delay);
  };

  return (
    <TextField
      className="wardrobe-toolbar__search"
      type="search"
      placeholder={compact ? 'Name, type or colour' : 'Search by name, type or colour'}
      value={text}
      onChange={(event) => schedule(event.target.value)}
      onKeyDown={(event) => {
        if (event.key === 'Escape' && text) {
          event.preventDefault();
          event.stopPropagation();
          schedule('', 0);
        }
      }}
      inputRef={inputRef}
      slotProps={{
        htmlInput: { 'aria-label': 'Search your wardrobe', enterKeyHint: 'search', autoComplete: 'off' },
        input: {
          startAdornment: (
            <InputAdornment position="start">
              <SearchOutlined fontSize="small" />
            </InputAdornment>
          ),
          endAdornment: text ? (
            <InputAdornment position="end">
              <Tooltip title="Clear search">
                <IconButton
                  size="small"
                  aria-label="Clear search"
                  onClick={() => {
                    schedule('', 0);
                    inputRef.current?.focus();
                  }}
                >
                  <CloseOutlined fontSize="small" />
                </IconButton>
              </Tooltip>
            </InputAdornment>
          ) : (
            <InputAdornment position="end" className="wardrobe-toolbar__kbd">
              <Kbd>/</Kbd>
            </InputAdornment>
          ),
        },
      }}
    />
  );
}

/** Removable chips for the active panel filters, plus Clear all. */
function ActiveFilters({ params, update, clearFilters, resultCount }) {
  const chips = [
    ...params.colors.map((id) => ({
      key: `color-${id}`,
      label: COLOR_BY_ID[id]?.label ?? id,
      icon: <ColorSwatch color={id} size={12} className="wardrobe-toolbar__chip-swatch" />,
      onDelete: () => update({ colors: params.colors.filter((value) => value !== id) }),
    })),
    ...params.status.map((id) => ({
      key: `status-${id}`,
      label: LAUNDRY_STATUS_BY_ID[id]?.label ?? id,
      onDelete: () => update({ status: params.status.filter((value) => value !== id) }),
    })),
    ...(params.occasion
      ? [{ key: 'occasion', label: occasionLabel(params.occasion), onDelete: () => update({ occasion: null }) }]
      : []),
    ...(params.fav ? [{ key: 'fav', label: 'Favourites', onDelete: () => update({ fav: null }) }] : []),
  ];

  if (chips.length === 0 && !params.q.trim()) return null;

  return (
    <div className="wardrobe-toolbar__active" aria-label="Active filters">
      {resultCount !== undefined ? (
        <span className="wardrobe-toolbar__result-count" role="status">
          {resultCount} {resultCount === 1 ? 'result' : 'results'}
        </span>
      ) : null}
      {chips.map((chip) => (
        <Chip
          key={chip.key}
          size="small"
          label={chip.label}
          icon={chip.icon}
          onDelete={chip.onDelete}
          className="wardrobe-toolbar__chip"
          aria-label={`${chip.label}, remove filter`}
        />
      ))}
      <Button size="small" variant="text" color="inherit" onClick={clearFilters} className="wardrobe-toolbar__clear">
        Clear all
      </Button>
    </div>
  );
}

/**
 * Sticky wardrobe toolbar: search, Filters, Sort and category tabs with counts.
 * Everything reads from and writes to the URL search params.
 */
export default function WardrobeToolbar({ params, update, clearFilters, data, compact = false }) {
  const sentinelRef = useRef(null);
  const [stuck, setStuck] = useState(false);
  const counts = data?.counts;

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel || typeof IntersectionObserver === 'undefined') return undefined;
    const shell = document.querySelector('.app-shell');
    const topbar = parseInt(getComputedStyle(shell ?? document.documentElement).getPropertyValue('--alclo-topbar-height'), 10) || 64;
    const observer = new IntersectionObserver(([entry]) => setStuck(!entry.isIntersecting), {
      rootMargin: `-${topbar + 1}px 0px 0px 0px`,
    });
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [compact]);

  const tabs = [
    { id: 'all', label: 'All', count: counts?.all },
    ...CATEGORIES.map((category) => ({ id: category.id, label: category.label, count: counts?.byCategory?.[category.id] })),
  ];

  return (
    <>
      <div ref={sentinelRef} className="wardrobe-toolbar__sentinel" aria-hidden />
      <div className={cx('wardrobe-toolbar', stuck && 'wardrobe-toolbar--stuck')} role="search" aria-label="Wardrobe filters">
        <div className="wardrobe-toolbar__row">
          <SearchField value={params.q} compact={compact} onSearch={(q) => update({ q: q.trim() ? q : null })} />
          <WardrobeFilters
            params={params}
            update={update}
            total={data?.total}
            counts={counts}
            compact={compact}
          />
          <SortMenu value={params.sort} onChange={(sort) => update({ sort })} compact={compact} />
        </div>
        <Tabs
          className="wardrobe-toolbar__tabs"
          value={params.category}
          onChange={(_event, category) => update({ category })}
          variant="scrollable"
          scrollButtons={false}
          aria-label="Category"
        >
          {tabs.map((tab) => (
            <Tab
              key={tab.id}
              value={tab.id}
              className="wardrobe-toolbar__tab"
              label={
                <span className="wardrobe-toolbar__tab-label">
                  {tab.label}
                  {tab.count !== undefined ? <span className="wardrobe-toolbar__tab-count">{tab.count}</span> : null}
                </span>
              }
            />
          ))}
        </Tabs>
      </div>
      <ActiveFilters
        params={params}
        update={update}
        clearFilters={clearFilters}
        resultCount={countPanelFilters(params) || params.q ? data?.total : undefined}
      />
    </>
  );
}
