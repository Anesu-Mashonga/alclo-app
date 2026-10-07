import AddOutlined from '@mui/icons-material/AddOutlined';
import CheckOutlined from '@mui/icons-material/CheckOutlined';
import LocalLaundryServiceOutlined from '@mui/icons-material/LocalLaundryServiceOutlined';
import Button from '@mui/material/Button';
import Skeleton from '@mui/material/Skeleton';
import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';
import useMediaQuery from '@mui/material/useMediaQuery';
import { LayoutGroup } from 'motion/react';
import { useCallback, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import EmptyState from '@/components/common/EmptyState';
import ErrorState from '@/components/common/ErrorState';
import SectionCard from '@/components/common/SectionCard';
import PageHeader from '@/components/layout/PageHeader';
import HamperInfo from '@/components/laundry/HamperInfo';
import LaundryBulkBar from '@/components/laundry/LaundryBulkBar';
import LaundryColumn from '@/components/laundry/LaundryColumn';
import LaundrySkeleton from '@/components/laundry/LaundrySkeleton';
import LaundrySummary from '@/components/laundry/LaundrySummary';
import LaundryToolbar from '@/components/laundry/LaundryToolbar';
import {
  COLUMN_BY_ID,
  COLUMNS,
  LAUNDRY_CATEGORIES,
  SORTS,
  laundrySubtitle,
  prepareColumn,
} from '@/components/laundry/laundryUtils';
import useLaundryMoves, { eligibleFor } from '@/components/laundry/useLaundryMoves';
import { useAuth } from '@/context/AuthContext';
import { useUI } from '@/context/UIContext';
import { useLaundry } from '@/hooks/api';
import useHotkeys from '@/hooks/useHotkeys';
import useItemDrawer from '@/hooks/useItemDrawer';
import './LaundryPage.scss';

const CATEGORY_IDS = new Set(LAUNDRY_CATEGORIES.map((option) => option.id));
const SORT_IDS = new Set(SORTS.map((option) => option.id));
const FILTER_KEYS = ['q', 'category', 'tab'];

export default function LaundryPage() {
  const { user } = useAuth();
  const ui = useUI();
  const navigate = useNavigate();
  const { openItem } = useItemDrawer();
  const desktop = useMediaQuery((theme) => theme.breakpoints.up('md'), {
    noSsr: true,
  });
  const urgentAfterDays = user?.preferences?.urgentAfterDays ?? 3;
  const { data, isPending, isError, error, refetch, dataUpdatedAt } = useLaundry();

  const [searchParams, setSearchParams] = useSearchParams();
  const q = searchParams.get('q') ?? '';
  const categoryParam = searchParams.get('category') ?? '';
  const category = CATEGORY_IDS.has(categoryParam) ? categoryParam : '';
  const sortParam = searchParams.get('sort') ?? '';
  const sort = SORT_IDS.has(sortParam) ? sortParam : 'waiting';
  const tabParam = searchParams.get('tab') ?? '';
  const tab = COLUMN_BY_ID[tabParam] ? tabParam : 'hamper';
  const filtered = Boolean(q.trim() || category);

  const [selection, setSelection] = useState(() => new Set());

  const updateParams = useCallback(
    (patch) => {
      if (FILTER_KEYS.some((key) => key in patch)) setSelection(new Set());
      setSearchParams(
        (current) => {
          const next = new URLSearchParams(current);
          for (const [key, value] of Object.entries(patch)) {
            if (value) next.set(key, value);
            else next.delete(key);
          }
          return next;
        },
        { replace: true, preventScrollReset: true },
      );
    },
    [setSearchParams],
  );

  const clearFilters = useCallback(() => updateParams({ q: '', category: '' }), [updateParams]);

  const setSelected = useCallback((ids, value) => {
    setSelection((current) => {
      const next = new Set(current);
      for (const id of ids) {
        if (value) next.add(id);
        else next.delete(id);
      }
      return next;
    });
  }, []);

  const clearSelection = useCallback(() => setSelection(new Set()), []);

  const dropFromSelection = useCallback((ids) => {
    setSelection((current) => {
      if (!ids.some((id) => current.has(id))) return current;
      const next = new Set(current);
      ids.forEach((id) => next.delete(id));
      return next;
    });
  }, []);

  const { move } = useLaundryMoves({ onMoved: dropFromSelection });

  useHotkeys({ escape: clearSelection }, { enabled: selection.size > 0, ignoreInOverlays: true });

  // Reasons are worked out against the time of the last fetch, so a render never reads the clock.
  const now = useMemo(() => new Date(dataUpdatedAt || 0), [dataUpdatedAt]);

  const columns = useMemo(
    () =>
      COLUMNS.map((column) => {
        const all = data?.[column.key] ?? [];
        return {
          column,
          total: all.length,
          items: prepareColumn(all, { columnId: column.id, q, category, sort }),
        };
      }),
    [data, q, category, sort],
  );

  const selectedItems = useMemo(() => {
    if (selection.size === 0) return [];
    return columns.flatMap(({ column }) => data?.[column.key] ?? []).filter((item) => selection.has(item.id));
  }, [columns, data, selection]);

  const hamperItems = data?.hamper ?? [];
  const washingItems = data?.washing ?? [];
  const selectedForWash = eligibleFor('wash', selectedItems);
  const startLabel = selectedForWash.length ? `Wash ${selectedForWash.length} selected` : 'Start a load';
  const canStart = selectedForWash.length > 0 || hamperItems.length > 0;
  const startLoad = () => move('wash', selectedForWash.length ? selectedForWash : hamperItems);
  const finishLoad = () => move('finish', washingItems);

  const nothingTracked = Boolean(data) && (data.counts?.washable ?? 0) === 0;

  const actions = (
    <>
      <HamperInfo urgentAfterDays={urgentAfterDays} />
      {washingItems.length > 0 ? (
        <Button variant="outlined" color="inherit" startIcon={<CheckOutlined />} onClick={finishLoad}>
          Finish load
        </Button>
      ) : null}
      <Button
        variant="contained"
        startIcon={<LocalLaundryServiceOutlined />}
        onClick={startLoad}
        disabled={!data || !canStart}
      >
        {startLabel}
      </Button>
    </>
  );

  const columnProps = (entry) => ({
    column: entry.column,
    items: entry.items,
    total: entry.total,
    filtered,
    selection,
    onSetSelected: setSelected,
    onOpen: openItem,
    onMove: move,
    onClearFilters: clearFilters,
    onStartLoad: startLoad,
    canStartLoad: hamperItems.length > 0,
    now,
  });

  let body;
  if (isPending) {
    body = (
      <>
        <LaundrySummary loading urgentAfterDays={urgentAfterDays} />
        <LaundrySkeleton desktop={desktop} />
      </>
    );
  } else if (isError && !data) {
    body = (
      <SectionCard>
        <ErrorState title="Could not load your laundry" error={error} onRetry={() => refetch()} />
      </SectionCard>
    );
  } else if (nothingTracked) {
    body = (
      <SectionCard>
        <EmptyState
          icon={LocalLaundryServiceOutlined}
          title="Nothing to wash yet"
          description="Tops, bottoms and outerwear you add show up here once you have worn them enough to need a wash."
          action={
            <Button variant="contained" startIcon={<AddOutlined />} onClick={() => ui.openItemForm({ mode: 'create' })}>
              Add item
            </Button>
          }
          secondaryAction={
            <Button variant="outlined" color="inherit" onClick={() => navigate('/wardrobe')}>
              Go to wardrobe
            </Button>
          }
        />
      </SectionCard>
    );
  } else {
    const [hamper, washing, clean] = columns;
    const active = columns.find((entry) => entry.column.id === tab) ?? hamper;
    body = (
      <>
        <LaundrySummary data={data} urgentAfterDays={urgentAfterDays} />
        <LaundryToolbar q={q} category={category} sort={sort} onChange={updateParams} />
        {desktop ? (
          <LayoutGroup id="laundry-board">
            <div className="laundry-page__board">
              <LaundryColumn {...columnProps(hamper)} />
              <div className="laundry-page__side">
                <LaundryColumn {...columnProps(washing)} />
                <LaundryColumn {...columnProps(clean)} />
              </div>
            </div>
          </LayoutGroup>
        ) : (
          <>
            <Tabs
              value={tab}
              onChange={(_event, value) => updateParams({ tab: value === 'hamper' ? '' : value })}
              variant="fullWidth"
              aria-label="Laundry lists"
              className="laundry-page__tabs"
            >
              {columns.map(({ column, total }) => (
                <Tab
                  key={column.id}
                  value={column.id}
                  id={`laundry-tab-${column.id}`}
                  aria-controls={`laundry-panel-${column.id}`}
                  aria-label={`${column.tabLabel}, ${total}`}
                  label={
                    <span className="laundry-page__tab-label">
                      {column.tabLabel}
                      <span className="laundry-page__tab-count">{total}</span>
                    </span>
                  }
                />
              ))}
            </Tabs>
            <LayoutGroup id="laundry-tabs">
              <LaundryColumn
                key={active.column.id}
                {...columnProps(active)}
                tabbed
                role="tabpanel"
                id={`laundry-panel-${active.column.id}`}
                aria-labelledby={`laundry-tab-${active.column.id}`}
              />
            </LayoutGroup>
          </>
        )}
        <LaundryBulkBar items={selectedItems} onMove={move} onClear={clearSelection} />
      </>
    );
  }

  return (
    <div className="laundry-page">
      <PageHeader
        title="Laundry"
        subtitle={
          isPending ? (
            <Skeleton width={220} component="span" className="laundry-page__subtitle-skeleton" />
          ) : (
            laundrySubtitle(data?.counts)
          )
        }
        actions={actions}
      />
      {body}
    </div>
  );
}
