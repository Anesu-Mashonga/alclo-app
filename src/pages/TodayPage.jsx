import { useReducedMotion } from 'motion/react';
import { useRef } from 'react';
import OccasionToggle from '@/components/common/OccasionToggle';
import PageHeader from '@/components/layout/PageHeader';
import LaundrySnapshot from '@/components/today/LaundrySnapshot';
import NotWornLately from '@/components/today/NotWornLately';
import OutfitCard from '@/components/today/OutfitCard';
import OutfitCardSkeleton from '@/components/today/OutfitCardSkeleton';
import WeatherCard from '@/components/today/WeatherCard';
import WeekPlan from '@/components/today/WeekPlan';
import WornOutfit from '@/components/today/WornOutfit';
import { firstName, greetingFor } from '@/components/today/todayUtils';
import useTodayOutfit from '@/components/today/useTodayOutfit';
import { useToast } from '@/context/ToastContext';
import { useItems, useTodayLog } from '@/hooks/api';
import { formatDate } from '@/lib/dates';
import './TodayPage.scss';

const ALL_ITEMS = {};

export default function TodayPage() {
  const today = useTodayOutfit();
  const toast = useToast();
  const reduceMotion = useReducedMotion();
  const outfitRef = useRef(null);
  const todayLogQuery = useTodayLog();
  const itemsQuery = useItems(ALL_ITEMS);

  const now = new Date();
  const name = firstName(today.user?.name);
  const title = name ? `${greetingFor(now)}, ${name}` : greetingFor(now);
  const log = todayLogQuery.data ?? null;
  const wardrobeEmpty = itemsQuery.data?.counts?.all === 0;
  const initialLoading = todayLogQuery.isPending || itemsQuery.isPending;
  const lockedIds = Object.values(today.locked).flat();

  const bringOutfitIntoView = () => {
    const node = outfitRef.current;
    if (!node) return;
    const rect = node.getBoundingClientRect();
    if (rect.top < 0 || rect.top > window.innerHeight * 0.5) {
      node.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' });
    }
  };

  const withUndo = (message, change) => {
    const before = today.locked;
    change();
    toast.show({ message, action: { label: 'Undo', onClick: () => today.setLocked(before) } });
  };

  const handleUsePlan = (plan) => {
    const planName = plan.outfit?.name || plan.note || 'your plan';
    withUndo(`Locked in ${planName} for today`, () => today.lockItems(plan.items ?? []));
    bringOutfitIntoView();
  };

  const handleWearItem = (item) => {
    withUndo(`${item.name} is in today's outfit`, () => today.placeItem(item));
    bringOutfitIntoView();
  };

  let outfit;
  if (initialLoading) outfit = <OutfitCardSkeleton />;
  else if (log) outfit = <WornOutfit log={log} view={today.view} onViewChange={today.setView} unit={today.unit} />;
  else outfit = <OutfitCard today={today} wardrobeEmpty={wardrobeEmpty} />;

  return (
    <div className="today-page">
      <PageHeader
        title={title}
        documentTitle="Today"
        subtitle={formatDate(now, 'dddd, D MMMM')}
        className="today-page__header"
        actions={
          log ? null : (
            <OccasionToggle
              value={today.occasion}
              onChange={today.setOccasion}
              label="Occasion for today's outfit"
              className="today-page__occasion"
            />
          )
        }
      />

      <div className="today-page__grid">
        <div className="today-page__main" ref={outfitRef}>
          {outfit}
        </div>
        <aside className="today-page__side" aria-label="Today at a glance">
          <WeatherCard
            weatherQuery={today.weatherQuery}
            unit={today.unit}
            preview={today.preview}
            onPreview={today.setPreview}
            className="today-page__weather"
          />
          <LaundrySnapshot className="today-page__laundry" />
          <WeekPlan todayLog={log} onUsePlan={handleUsePlan} className="today-page__week" />
        </aside>
        {wardrobeEmpty ? null : (
          <NotWornLately
            itemsQuery={itemsQuery}
            lockedIds={log ? [] : lockedIds}
            disabled={Boolean(log)}
            onWear={handleWearItem}
            className="today-page__forgotten"
          />
        )}
      </div>
    </div>
  );
}
