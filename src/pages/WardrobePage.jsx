import AddOutlined from '@mui/icons-material/AddOutlined';
import CheckroomOutlined from '@mui/icons-material/CheckroomOutlined';
import ChecklistOutlined from '@mui/icons-material/ChecklistOutlined';
import GridViewOutlined from '@mui/icons-material/GridViewOutlined';
import SearchOffOutlined from '@mui/icons-material/SearchOffOutlined';
import ViewListOutlined from '@mui/icons-material/ViewListOutlined';
import Button from '@mui/material/Button';
import Skeleton from '@mui/material/Skeleton';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import Tooltip from '@mui/material/Tooltip';
import { useTheme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';
import { AnimatePresence, motion } from 'motion/react';
import { useMemo, useState } from 'react';
import cx from '@/components/common/cx';
import EmptyState from '@/components/common/EmptyState';
import ErrorState from '@/components/common/ErrorState';
import PageHeader from '@/components/layout/PageHeader';
import BulkActionBar from '@/components/wardrobe/BulkActionBar';
import ItemCard from '@/components/wardrobe/ItemCard';
import ItemRow, { ItemListHeader } from '@/components/wardrobe/ItemRow';
import useItemActions from '@/components/wardrobe/useItemActions';
import WardrobeSkeleton from '@/components/wardrobe/WardrobeSkeleton';
import WardrobeToolbar from '@/components/wardrobe/WardrobeToolbar';
import { DEFAULT_SORT, hasActiveFilters, useWardrobeParams } from '@/components/wardrobe/wardrobeParams';
import { useAuth } from '@/context/AuthContext';
import { useUI } from '@/context/UIContext';
import { CATEGORY_BY_ID } from '@/data/taxonomy';
import { useItems } from '@/hooks/api';
import useHotkeys from '@/hooks/useHotkeys';
import useItemDrawer from '@/hooks/useItemDrawer';
import useLoadSampleWardrobe from '@/hooks/useLoadSampleWardrobe';
import { formatCount } from '@/lib/format';
import { isUrgent } from '@/lib/laundry';
import './WardrobePage.scss';

const EASE = [0.2, 0, 0, 1];
const tileMotion = {
  layout: 'position',
  initial: { opacity: 0, scale: 0.96 },
  animate: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.96, transition: { duration: 0.16, ease: [0.3, 0, 1, 1] } },
  transition: { duration: 0.2, ease: EASE, layout: { duration: 0.28, ease: EASE } },
};

const listFade = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  transition: { duration: 0.16, ease: EASE },
};

const piecesLabel = (count) => formatCount(count, 'piece');

/** Selection state with Shift+click ranges over the visible order. */
function useSelection(visibleIds) {
  const [selected, setSelected] = useState(() => new Set());
  const [anchorId, setAnchorId] = useState(null);

  // Only count pieces that are still on screen (filters can hide selected ones).
  const visibleSelected = useMemo(() => visibleIds.filter((id) => selected.has(id)), [visibleIds, selected]);

  const toggle = (id, { range = false } = {}) => {
    setSelected((current) => {
      const next = new Set(current);
      const anchorIndex = anchorId ? visibleIds.indexOf(anchorId) : -1;
      const index = visibleIds.indexOf(id);
      if (range && anchorIndex !== -1 && index !== -1) {
        const [from, to] = anchorIndex < index ? [anchorIndex, index] : [index, anchorIndex];
        const turnOn = current.has(anchorId);
        for (const rangeId of visibleIds.slice(from, to + 1)) {
          if (turnOn) next.add(rangeId);
          else next.delete(rangeId);
        }
      } else if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
    if (!range) setAnchorId(id);
  };

  const selectAll = () => setSelected(new Set(visibleIds));
  const clear = () => {
    setSelected(new Set());
    setAnchorId(null);
  };

  return { selectedIds: visibleSelected, isSelected: (id) => selected.has(id), toggle, selectAll, clear };
}

export default function WardrobePage() {
  const theme = useTheme();
  const isPhone = useMediaQuery(theme.breakpoints.down('sm'), { noSsr: true });
  const { user } = useAuth();
  const ui = useUI();
  const { openItem } = useItemDrawer();
  const actions = useItemActions();
  const sample = useLoadSampleWardrobe();
  const { params, filters, update, clearFilters } = useWardrobeParams();
  const { data, isPending, error, refetch, isPlaceholderData } = useItems(filters);

  const items = useMemo(() => data?.items ?? [], [data]);
  const visibleIds = useMemo(() => items.map((item) => item.id), [items]);
  const selection = useSelection(visibleIds);
  const [selectMode, setSelectMode] = useState(false);
  const urgentAfter = user?.preferences?.urgentAfterDays ?? 3;
  // The header counts the whole wardrobe; the service's facet counts follow the panel filters.
  // Unfiltered, this is the same cache entry as the main list.
  const { data: everything } = useItems({ sort: DEFAULT_SORT });
  const total = everything?.counts?.all;
  const filtered = hasActiveFilters(params);
  const view = params.view;

  // A new filter set swaps the whole list with one quick fade; per-piece enter, exit and layout
  // moves are kept for changes within the same list (delete, restore, laundry moves).
  const signature = JSON.stringify(filters);
  const [listKey, setListKey] = useState(signature);
  if (data && !isPlaceholderData && listKey !== signature) setListKey(signature);

  const exitSelectMode = () => {
    setSelectMode(false);
    selection.clear();
  };

  useHotkeys({ escape: exitSelectMode }, { enabled: selectMode, ignoreInOverlays: true });

  const selectedItems = useMemo(() => {
    const ids = new Set(selection.selectedIds);
    return items.filter((item) => ids.has(item.id));
  }, [items, selection.selectedIds]);

  const handleActivate = (item, event) => {
    if (selectMode) selection.toggle(item.id, { range: event?.shiftKey });
    else openItem(item.id);
  };

  const runBulk = async (action) => {
    const result = await action(selectedItems);
    if (result) exitSelectMode();
  };

  const addItem = () =>
    ui.openItemForm({ mode: 'create', defaults: params.category !== 'all' ? { category: params.category } : undefined });


  const headerActions = (
    <>
      <Tooltip title={selectMode ? 'Leave selection mode' : 'Select several pieces'}>
        <span>
          <Button
            variant="outlined"
            color="inherit"
            className={cx('wardrobe-page__select', selectMode && 'wardrobe-page__select--on')}
            startIcon={<ChecklistOutlined />}
            aria-pressed={selectMode}
            disabled={!total}
            onClick={() => (selectMode ? exitSelectMode() : setSelectMode(true))}
          >
            {selectMode ? 'Done' : 'Select'}
          </Button>
        </span>
      </Tooltip>
      <ToggleButtonGroup
        exclusive
        size="small"
        className="wardrobe-page__view"
        value={view}
        onChange={(_event, next) => next && update({ view: next })}
        aria-label="View"
      >
        <ToggleButton value="grid" aria-label="Grid view">
          <Tooltip title="Grid view">
            <GridViewOutlined fontSize="small" />
          </Tooltip>
        </ToggleButton>
        <ToggleButton value="list" aria-label="List view">
          <Tooltip title="List view">
            <ViewListOutlined fontSize="small" />
          </Tooltip>
        </ToggleButton>
      </ToggleButtonGroup>
      {/* Phones already have Add in the top bar, right above this row. */}
      {isPhone ? null : (
        <Button variant="contained" startIcon={<AddOutlined />} onClick={addItem}>
          Add item
        </Button>
      )}
    </>
  );

  const subtitle =
    total === undefined ? <Skeleton variant="text" width={88} className="wardrobe-page__subtitle-skeleton" /> : piecesLabel(total);

  let content;
  if (isPending) {
    content = <WardrobeSkeleton view={view} />;
  } else if (error && !data) {
    content = <ErrorState title="Could not load your wardrobe" error={error} onRetry={() => refetch()} />;
  } else if (total === 0 && !filtered) {
    content = (
      <EmptyState
        icon={CheckroomOutlined}
        title="Your wardrobe is empty"
        description="Add the clothes you own and Alclo will plan outfits from them. Or load a sample wardrobe to look around first."
        action={
          <Button variant="contained" startIcon={<AddOutlined />} onClick={addItem}>
            Add item
          </Button>
        }
        secondaryAction={
          <Button variant="outlined" color="inherit" loading={sample.isPending} onClick={sample.load}>
            Load sample wardrobe
          </Button>
        }
      />
    );
  } else if (items.length === 0) {
    const onlyCategory = params.category !== 'all' && !params.q.trim() && filtered && hasOnlyCategory(params);
    const category = CATEGORY_BY_ID[params.category];
    content = onlyCategory ? (
      <EmptyState
        icon={CheckroomOutlined}
        title={`No ${category.label.toLowerCase()} yet`}
        description={`Add your ${category.label.toLowerCase()} so they can show up in outfit ideas.`}
        action={
          <Button variant="contained" startIcon={<AddOutlined />} onClick={addItem}>
            Add {category.singular.toLowerCase()}
          </Button>
        }
      />
    ) : (
      <EmptyState
        icon={SearchOffOutlined}
        title="Nothing matches these filters"
        description={
          params.q.trim()
            ? `No pieces match "${params.q.trim()}" with the current filters. Try another word or clear the filters.`
            : 'Try removing a filter, or clear them all to see everything again.'
        }
        action={
          <Button variant="outlined" color="inherit" onClick={clearFilters}>
            Clear filters
          </Button>
        }
      />
    );
  } else if (view === 'list') {
    content = (
      <motion.div
        key={`list-${listKey}`}
        className={cx('wardrobe-page__list', selectMode && 'wardrobe-page__list--selecting')}
        {...listFade}
      >
        <ItemListHeader selectMode={selectMode} />
        <div role="list" aria-label="Pieces">
          <AnimatePresence initial={false} mode="popLayout">
            {items.map((item) => (
              <motion.div key={item.id} role="none" className="wardrobe-page__row" {...tileMotion}>
                <ItemRow
                  item={item}
                  urgent={isUrgent(item, urgentAfter)}
                  selectMode={selectMode}
                  selected={selection.isSelected(item.id)}
                  actions={actions}
                  onActivate={handleActivate}
                  onOpen={(target) => openItem(target.id)}
                />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </motion.div>
    );
  } else {
    content = (
      <motion.ul
        key={`grid-${listKey}`}
        className={cx('wardrobe-page__grid', selectMode && 'wardrobe-page__grid--selecting')}
        aria-label="Pieces"
        {...listFade}
      >
        <AnimatePresence initial={false} mode="popLayout">
          {items.map((item) => (
            <motion.li key={item.id} className="wardrobe-page__cell" {...tileMotion}>
              <ItemCard
                item={item}
                urgent={isUrgent(item, urgentAfter)}
                selectMode={selectMode}
                selected={selection.isSelected(item.id)}
                onActivate={handleActivate}
                onToggleFavorite={actions.toggleFavorite}
              />
            </motion.li>
          ))}
        </AnimatePresence>
      </motion.ul>
    );
  }

  const showToolbar = !(total === 0 && !filtered) && !(error && !data);

  return (
    <div className={cx('wardrobe-page', selectMode && 'wardrobe-page--selecting')}>
      <PageHeader title="Wardrobe" subtitle={subtitle} actions={headerActions} />

      {showToolbar ? (
        <WardrobeToolbar params={params} update={update} clearFilters={clearFilters} data={data} compact={isPhone} />
      ) : null}

      <section
        className={cx('wardrobe-page__results', isPlaceholderData && 'wardrobe-page__results--stale')}
        aria-busy={isPending || isPlaceholderData || undefined}
        aria-label="Results"
      >
        {selectMode && items.length > 0 ? (
          <p className="wardrobe-page__select-hint">
            Click pieces to select them. Hold Shift to select a range. Press Esc to finish.
          </p>
        ) : null}
        {content}
      </section>

      <BulkActionBar
        open={selectMode}
        count={selection.selectedIds.length}
        total={items.length}
        onSelectAll={selection.selectAll}
        onClearSelection={selection.clear}
        onWear={() => runBulk(actions.wearToday)}
        onLaundry={() => runBulk(actions.sendToLaundry)}
        onDelete={() => runBulk(actions.deleteItems)}
        onCancel={exitSelectMode}
        pending={actions.pending}
      />
    </div>
  );
}

/** True when the category tab is the only thing narrowing the list. */
function hasOnlyCategory(params) {
  return !params.colors.length && !params.status.length && !params.occasion && !params.fav;
}
