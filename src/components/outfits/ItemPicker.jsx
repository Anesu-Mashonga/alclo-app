import ArrowBackOutlined from '@mui/icons-material/ArrowBackOutlined';
import CheckOutlined from '@mui/icons-material/CheckOutlined';
import ClearOutlined from '@mui/icons-material/ClearOutlined';
import SearchOutlined from '@mui/icons-material/SearchOutlined';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import InputAdornment from '@mui/material/InputAdornment';
import TextField from '@mui/material/TextField';
import { useMemo, useRef, useState } from 'react';
import ColorDots from '@/components/common/ColorDots';
import cx from '@/components/common/cx';
import EmptyState from '@/components/common/EmptyState';
import ItemThumb from '@/components/common/ItemThumb';
import { CATEGORY_BY_ID, colorLabel, typeLabel } from '@/data/taxonomy';
import './ItemPicker.scss';

const STATUS_ORDER = { clean: 0, hamper: 1, washing: 2 };

function matches(item, query) {
  if (!query) return true;
  const haystack = [item.name, item.type, item.brand, ...(item.colors ?? []).map(colorLabel)]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
  return query
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean)
    .every((word) => haystack.includes(word));
}

/** Moves focus between tiles with the arrow keys, by visual row. */
function handleGridKeys(event, container) {
  const keys = ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End'];
  if (!keys.includes(event.key) || !container) return;
  const tiles = [...container.querySelectorAll('[data-picker-tile]')];
  const index = tiles.indexOf(document.activeElement);
  if (index < 0) return;
  const top = tiles[0].offsetTop;
  const columns = Math.max(1, tiles.filter((tile) => tile.offsetTop === top).length);
  let next = index;
  if (event.key === 'ArrowLeft') next = index - 1;
  if (event.key === 'ArrowRight') next = index + 1;
  if (event.key === 'ArrowUp') next = index - columns;
  if (event.key === 'ArrowDown') next = index + columns;
  if (event.key === 'Home') next = 0;
  if (event.key === 'End') next = tiles.length - 1;
  next = Math.min(tiles.length - 1, Math.max(0, next));
  if (next !== index) {
    event.preventDefault();
    tiles[next].focus();
  }
}

/**
 * Searchable grid of pieces for one outfit slot. Pieces in the laundry stay selectable but are flagged.
 *
 * Props:
 * - slot: category id, items: every wardrobe item
 * - selectedIds: ids currently chosen for this slot
 * - multiple: accessories allow up to `max` picks
 * - onPick(item): select (or toggle when multiple)
 * - onBack()
 */
export default function ItemPicker({ slot, items = [], selectedIds = [], multiple = false, max = 1, onPick, onBack }) {
  const [query, setQuery] = useState('');
  const gridRef = useRef(null);
  const category = CATEGORY_BY_ID[slot];
  const label = slot === 'accessory' ? 'accessories' : (category?.label ?? 'pieces').toLowerCase();
  const title = multiple ? `Choose ${label}` : `Choose ${slot === 'outerwear' ? 'outerwear' : `a ${category?.singular.toLowerCase() ?? 'piece'}`}`;

  const inSlot = useMemo(
    () =>
      items
        .filter((item) => item.category === slot && !item.deletedAt)
        .sort(
          (a, b) =>
            (STATUS_ORDER[a.laundry?.status] ?? 0) - (STATUS_ORDER[b.laundry?.status] ?? 0) ||
            a.name.localeCompare(b.name),
        ),
    [items, slot],
  );
  const visible = inSlot.filter((item) => matches(item, query.trim()));
  const full = multiple && selectedIds.length >= max;

  return (
    <div className="item-picker">
      <div className="item-picker__header">
        <Button
          variant="text"
          color="inherit"
          startIcon={<ArrowBackOutlined />}
          onClick={onBack}
          className="item-picker__back"
        >
          {multiple ? 'Done' : 'Back to outfit'}
        </Button>
        <h3 className="item-picker__title">{title}</h3>
        {multiple ? (
          <p className="item-picker__count" aria-live="polite">
            {selectedIds.length} of {max} chosen
          </p>
        ) : null}
      </div>

      <TextField
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder={`Search ${label}`}
        size="small"
        fullWidth
        autoFocus
        className="item-picker__search"
        slotProps={{
          htmlInput: { 'aria-label': `Search ${label}` },
          input: {
            startAdornment: (
              <InputAdornment position="start">
                <SearchOutlined fontSize="small" />
              </InputAdornment>
            ),
            endAdornment: query ? (
              <InputAdornment position="end">
                <IconButton size="small" aria-label="Clear search" onClick={() => setQuery('')} edge="end">
                  <ClearOutlined fontSize="small" />
                </IconButton>
              </InputAdornment>
            ) : null,
          },
        }}
      />

      {inSlot.length === 0 ? (
        <EmptyState
          compact
          titleComponent="h4"
          title={`No ${label} in your wardrobe yet`}
          description="Add some from the Wardrobe page, then come back to finish this outfit."
        />
      ) : visible.length === 0 ? (
        <EmptyState
          compact
          titleComponent="h4"
          title={`No ${label} match "${query.trim()}"`}
          action={
            <Button variant="outlined" color="inherit" size="small" onClick={() => setQuery('')}>
              Clear search
            </Button>
          }
        />
      ) : (
        <ul
          ref={gridRef}
          className="item-picker__grid"
          aria-label={title}
          onKeyDown={(event) => handleGridKeys(event, gridRef.current)}
        >
          {visible.map((item) => {
            const selected = selectedIds.includes(item.id);
            const status = item.laundry?.status ?? 'clean';
            const disabled = full && !selected;
            const statusText = status === 'hamper' ? 'In hamper' : status === 'washing' ? 'In the wash' : null;
            return (
              <li key={item.id}>
                <button
                  type="button"
                  data-picker-tile
                  className={cx('item-picker__tile', selected && 'item-picker__tile--selected')}
                  aria-pressed={selected}
                  aria-disabled={disabled || undefined}
                  aria-label={[item.name, statusText, selected ? 'chosen' : null].filter(Boolean).join(', ')}
                  onClick={() => {
                    if (!disabled) onPick(item);
                  }}
                >
                  <span className="item-picker__photo">
                    <ItemThumb item={item} ratio="1/1" showStatus />
                    {selected ? (
                      <span className="item-picker__check" aria-hidden>
                        <CheckOutlined fontSize="small" />
                      </span>
                    ) : null}
                  </span>
                  <span className="item-picker__name">{item.name}</span>
                  <span className="item-picker__meta">
                    <span className="item-picker__type">{typeLabel(item.type) || category?.singular}</span>
                    <ColorDots colors={item.colors} size="sm" />
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
      {full ? <p className="item-picker__hint">You have chosen 3 accessories. Remove one to pick another.</p> : null}
    </div>
  );
}
