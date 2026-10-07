import CheckCircleOutlined from '@mui/icons-material/CheckCircleOutlined';
import CheckOutlined from '@mui/icons-material/CheckOutlined';
import LocalLaundryServiceOutlined from '@mui/icons-material/LocalLaundryServiceOutlined';
import ShoppingBasketOutlined from '@mui/icons-material/ShoppingBasketOutlined';
import Button from '@mui/material/Button';
import Checkbox from '@mui/material/Checkbox';
import { AnimatePresence } from 'motion/react';
import { useId, useRef } from 'react';
import cx from '@/components/common/cx';
import EmptyState from '@/components/common/EmptyState';
import SectionCard from '@/components/common/SectionCard';
import LaundryItemRow from './LaundryItemRow';
import './LaundryColumn.scss';

const COPY = {
  hamper: {
    subtitle: 'Worn enough to need a wash',
    emptyIcon: ShoppingBasketOutlined,
    emptyTitle: 'Nothing waiting',
    emptyText: 'Everything you have worn is clean.',
  },
  washing: {
    subtitle: 'Mark them done once dry',
    emptyIcon: LocalLaundryServiceOutlined,
    emptyTitle: 'No load running',
    emptyText: 'Start a load from the hamper and the pieces wait here until they are dry.',
  },
  clean: {
    subtitle: 'Washed in the last 2 days',
    emptyIcon: CheckCircleOutlined,
    emptyTitle: 'Nothing washed lately',
    emptyText: 'Freshly washed pieces show up here for 2 days.',
  },
};

/** Column bulk move: acts on the selected pieces in this column, or on every visible piece. */
function bulkAction(columnId, { selectedCount, visibleCount, filtered }) {
  if (columnId === 'hamper') {
    if (selectedCount)
      return {
        kind: 'wash',
        label: `Wash ${selectedCount}`,
        icon: LocalLaundryServiceOutlined,
      };
    return {
      kind: 'wash',
      label: filtered ? `Wash ${visibleCount} shown` : 'Wash all',
      icon: LocalLaundryServiceOutlined,
    };
  }
  if (columnId === 'washing') {
    if (selectedCount)
      return {
        kind: 'finish',
        label: `Mark ${selectedCount} done`,
        icon: CheckOutlined,
      };
    return {
      kind: 'finish',
      label: filtered ? `Mark ${visibleCount} done` : 'All done',
      icon: CheckOutlined,
    };
  }
  if (selectedCount)
    return {
      kind: 'hamper',
      label: `Move ${selectedCount} to hamper`,
      icon: ShoppingBasketOutlined,
    };
  return null;
}

/**
 * One board column (Hamper, In the wash, Recently cleaned) as a SectionCard: title with count,
 * a column bulk move, select all, animated rows and an empty state that explains the column.
 */
export default function LaundryColumn({
  column,
  items,
  total,
  filtered,
  selection,
  onSetSelected,
  onOpen,
  onMove,
  onClearFilters,
  onStartLoad,
  canStartLoad,
  now,
  tabbed = false,
  className,
  ...sectionProps
}) {
  const copy = COPY[column.id];
  const selectAllId = useId();
  const anchorRef = useRef(null);
  const selectedHere = items.filter((item) => selection.has(item.id));
  const allSelected = items.length > 0 && selectedHere.length === items.length;
  const someSelected = selectedHere.length > 0 && !allSelected;
  const action = bulkAction(column.id, {
    selectedCount: selectedHere.length,
    visibleCount: items.length,
    filtered,
  });

  const handleToggle = (id, { shiftKey }) => {
    const nextValue = !selection.has(id);
    const anchor = anchorRef.current;
    const from = items.findIndex((item) => item.id === anchor);
    const to = items.findIndex((item) => item.id === id);
    if (shiftKey && from !== -1 && to !== -1) {
      const [start, end] = from < to ? [from, to] : [to, from];
      const range = items.slice(start, end + 1).map((item) => item.id);
      onSetSelected(range, selection.has(anchor));
    } else {
      onSetSelected([id], nextValue);
    }
    anchorRef.current = id;
  };

  const ActionIcon = action?.icon;
  const bulkButton =
    action && items.length > 0 ? (
      <Button
        size="small"
        variant="outlined"
        color="inherit"
        className="laundry-column__bulk"
        startIcon={<ActionIcon />}
        onClick={() => onMove(action.kind, selectedHere.length ? selectedHere : items)}
      >
        {action.label}
      </Button>
    ) : null;

  const title = (
    <span className="laundry-column__title">
      {/* One hidden string carries the spoken name, so Chrome reads "Hamper, 9 pieces" without a stray space. */}
      <span aria-hidden="true">{column.label}</span>
      <span className="laundry-column__count" aria-hidden="true">
        {total}
      </span>
      <span className="u-visually-hidden">{`${column.label}, ${total} ${total === 1 ? 'piece' : 'pieces'}`}</span>
    </span>
  );

  return (
    <SectionCard
      title={title}
      subtitle={copy.subtitle}
      action={bulkButton}
      padding="none"
      className={cx('laundry-column', `laundry-column--${column.id}`, tabbed && 'laundry-column--tabbed', className)}
      {...sectionProps}
    >
      {items.length > 0 ? (
        <div className="laundry-column__select-all">
          <Checkbox
            id={selectAllId}
            size="small"
            className="laundry-column__select-all-box"
            checked={allSelected}
            indeterminate={someSelected}
            onChange={() =>
              onSetSelected(
                items.map((item) => item.id),
                !allSelected,
              )
            }
          />
          <label htmlFor={selectAllId} className="laundry-column__select-all-label">
            {allSelected ? 'Deselect all' : `Select all ${items.length}`}
            <span className="u-visually-hidden">{` in ${column.label.toLowerCase()}`}</span>
          </label>
          {selectedHere.length > 0 ? (
            <span className="laundry-column__selected-count" aria-live="polite">
              {selectedHere.length} selected
            </span>
          ) : null}
        </div>
      ) : null}

      <ul className="laundry-list" aria-label={column.label}>
        <AnimatePresence initial={false}>
          {items.map((item) => (
            <LaundryItemRow
              key={item.id}
              item={item}
              columnId={column.id}
              selected={selection.has(item.id)}
              onToggleSelect={handleToggle}
              onOpen={onOpen}
              onMove={onMove}
              now={now}
            />
          ))}
        </AnimatePresence>
      </ul>

      {total === 0 ? (
        <EmptyState
          compact
          titleComponent="h3"
          icon={copy.emptyIcon}
          title={copy.emptyTitle}
          description={copy.emptyText}
          className="laundry-column__empty"
          action={
            column.id === 'washing' && canStartLoad ? (
              <Button
                variant="outlined"
                color="inherit"
                onClick={onStartLoad}
                startIcon={<LocalLaundryServiceOutlined />}
              >
                Start a load
              </Button>
            ) : null
          }
        />
      ) : null}

      {total > 0 && items.length === 0 ? (
        <div className="laundry-column__no-match">
          <p className="laundry-column__no-match-text">
            {`No matches here. ${total} ${total === 1 ? 'piece is' : 'pieces are'} hidden by your filters.`}
          </p>
          <Button size="small" variant="text" onClick={onClearFilters}>
            Clear filters
          </Button>
        </div>
      ) : null}
    </SectionCard>
  );
}
