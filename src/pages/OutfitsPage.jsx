import AddOutlined from '@mui/icons-material/AddOutlined';
import Button from '@mui/material/Button';
import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';
import { useCallback, useId, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router';
import PageHeader from '@/components/layout/PageHeader';
import IdeasTab from '@/components/outfits/IdeasTab';
import OutfitBuilderDialog from '@/components/outfits/OutfitBuilderDialog';
import { OutfitsContext } from '@/components/outfits/OutfitsContext';
import PlanDialog from '@/components/outfits/PlanDialog';
import PlannerTab from '@/components/outfits/PlannerTab';
import SavedTab from '@/components/outfits/SavedTab';
import { SAVED_SORTS, TABS, validOccasion, weekStartFrom } from '@/components/outfits/outfitUtils';
import { useAuth } from '@/context/AuthContext';
import { useOutfits } from '@/hooks/api';
import { startOfWeek } from '@/lib/dates';
import './OutfitsPage.scss';

const TAB_LABELS = { ideas: 'Ideas', saved: 'Saved', planner: 'Planner' };

/**
 * Outfits: ideas for today, saved outfits and the week planner.
 * URL state: ?tab=ideas|saved|planner, ?occasion=, ?sort=recent|most|name, ?week=YYYY-MM-DD (Monday),
 * ?new=1 (optionally &items=id,id) opens the builder, ?edit=<outfitId> edits a saved outfit.
 */
export default function OutfitsPage() {
  const { user } = useAuth();
  const [params, setParams] = useSearchParams();
  const baseId = useId();
  const [planTarget, setPlanTarget] = useState(null); // { date, plan }

  const tab = TABS.includes(params.get('tab')) ? params.get('tab') : 'ideas';
  const defaultOccasion = user?.preferences?.defaultOccasion ?? 'casual';
  const occasion = validOccasion(params.get('occasion'), defaultOccasion);
  const sort = SAVED_SORTS.some((option) => option.id === params.get('sort')) ? params.get('sort') : 'recent';
  const week = weekStartFrom(params.get('week'));

  const editId = params.get('edit');
  const builderOpen = params.get('new') === '1' || Boolean(editId);
  const builderInitial = useMemo(() => {
    const items = params.get('items');
    return items ? { itemIds: items.split(',').filter(Boolean), occasion } : null;
  }, [params, occasion]);

  const { data: outfits } = useOutfits();

  const updateParams = useCallback(
    (patch, { replace = true } = {}) => {
      setParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          for (const [key, value] of Object.entries(patch)) {
            if (value === null || value === undefined || value === '') next.delete(key);
            else next.set(key, value);
          }
          return next;
        },
        { replace, preventScrollReset: true },
      );
    },
    [setParams],
  );

  const goToTab = useCallback(
    (next) => updateParams({ tab: next === 'ideas' ? null : next }, { replace: false }),
    [updateParams],
  );

  const openBuilder = useCallback(
    ({ mode = 'create', outfitId = null, itemIds = null } = {}) => {
      if (mode === 'edit' && outfitId) updateParams({ edit: outfitId, new: null, items: null }, { replace: false });
      else updateParams({ new: '1', edit: null, items: itemIds?.length ? itemIds.join(',') : null }, { replace: false });
    },
    [updateParams],
  );

  const closeBuilder = useCallback(() => updateParams({ new: null, edit: null, items: null }), [updateParams]);

  const openPlan = useCallback(({ date, plan = null }) => setPlanTarget({ date, plan }), []);

  const context = useMemo(() => ({ openBuilder, openPlan, goToTab }), [openBuilder, openPlan, goToTab]);

  const savedLabel = outfits ? `Saved (${outfits.length})` : TAB_LABELS.saved;

  return (
    <OutfitsContext.Provider value={context}>
      <div className="outfits-page">
        <PageHeader
          title="Outfits"
          subtitle="Ideas for today, the outfits you saved and your week ahead."
          actions={
            <Button
              variant="contained"
              startIcon={<AddOutlined />}
              onClick={() => openBuilder({ mode: 'create' })}
              className="outfits-page__new"
            >
              New outfit
            </Button>
          }
        >
          <Tabs
            value={tab}
            onChange={(_event, value) => goToTab(value)}
            aria-label="Outfit views"
            variant="scrollable"
            scrollButtons={false}
            className="outfits-page__tabs"
          >
            {TABS.map((id) => (
              <Tab
                key={id}
                value={id}
                label={id === 'saved' ? savedLabel : TAB_LABELS[id]}
                id={`${baseId}-tab-${id}`}
                aria-controls={`${baseId}-panel-${id}`}
              />
            ))}
          </Tabs>
        </PageHeader>

        <div
          role="tabpanel"
          id={`${baseId}-panel-${tab}`}
          aria-labelledby={`${baseId}-tab-${tab}`}
          className="outfits-page__panel"
        >
          {tab === 'ideas' ? (
            <IdeasTab occasion={occasion} onOccasionChange={(next) => updateParams({ occasion: next })} />
          ) : null}
          {tab === 'saved' ? (
            <SavedTab sort={sort} onSortChange={(next) => updateParams({ sort: next === 'recent' ? null : next })} />
          ) : null}
          {tab === 'planner' ? (
            <PlannerTab
              week={week}
              onWeekChange={(next) => updateParams({ week: next === startOfWeek(new Date()) ? null : next })}
            />
          ) : null}
        </div>
      </div>

      <OutfitBuilderDialog
        open={builderOpen}
        mode={editId ? 'edit' : 'create'}
        outfitId={editId}
        initial={builderInitial}
        onClose={closeBuilder}
      />
      <PlanDialog
        open={Boolean(planTarget)}
        date={planTarget?.date}
        plan={planTarget?.plan ?? null}
        onClose={() => setPlanTarget(null)}
      />
    </OutfitsContext.Provider>
  );
}
