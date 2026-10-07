import ChevronLeftOutlined from '@mui/icons-material/ChevronLeftOutlined';
import ChevronRightOutlined from '@mui/icons-material/ChevronRightOutlined';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import { useMemo, useState } from 'react';
import ErrorState from '@/components/common/ErrorState';
import { useAuth } from '@/context/AuthContext';
import { usePlans, useWearLogs, useWeather } from '@/hooks/api';
import { addDays, startOfWeek, todayISO } from '@/lib/dates';
import { useOutfitsPage } from './OutfitsContext';
import PlannerDay, { PlannerDaySkeleton } from './PlannerDay';
import useOutfitActions from './useOutfitActions';
import { datesOfWeek, weekRangeLabel } from './outfitUtils';
import './PlannerTab.scss';

/**
 * "Planner" tab: one week of planned outfits, with what was actually worn on past days.
 * Props: week ('YYYY-MM-DD' Monday), onWeekChange(monday)
 */
export default function PlannerTab({ week, onWeekChange }) {
  const { user } = useAuth();
  const unit = user?.preferences?.tempUnit ?? 'C';
  const today = todayISO();
  const thisWeek = startOfWeek(today);
  const dates = useMemo(() => datesOfWeek(week), [week]);
  const sunday = dates[6];
  const lastLoggable = sunday < today ? sunday : today;
  const hasPast = week <= today;

  const plansQuery = usePlans({ from: week, to: sunday });
  const logsQuery = useWearLogs({ from: week, to: lastLoggable }, { enabled: hasPast });
  const { data: weather } = useWeather();
  const actions = useOutfitActions();
  const { openPlan } = useOutfitsPage();
  const [wearingDate, setWearingDate] = useState(null);

  const plansByDate = useMemo(() => new Map((plansQuery.data ?? []).map((plan) => [plan.date, plan])), [plansQuery.data]);
  const logsByDate = useMemo(() => {
    const map = new Map();
    // Logs come newest first; keep the latest per day.
    for (const log of hasPast ? (logsQuery.data ?? []) : []) if (!map.has(log.date)) map.set(log.date, log);
    return map;
  }, [logsQuery.data, hasPast]);
  const forecastByDate = useMemo(
    () => new Map((weather?.forecast ?? []).map((day) => [day.date, day])),
    [weather?.forecast],
  );

  const upcoming = dates.filter((date) => date >= today);
  const plannedUpcoming = upcoming.filter((date) => plansByDate.has(date)).length;
  const loading = plansQuery.isPending || (hasPast && logsQuery.isPending);
  const failed = (plansQuery.isError && !plansQuery.data) || (hasPast && logsQuery.isError && !logsQuery.data);

  const summary =
    upcoming.length === 0
      ? 'A past week: here is what you wore.'
      : `${plannedUpcoming} of ${upcoming.length} ${upcoming.length === 1 ? 'day' : 'days'} ahead planned`;

  return (
    <div className="planner-tab">
      <div className="planner-tab__toolbar">
        <div className="planner-tab__nav">
          <Tooltip title="Previous week">
            <IconButton
              aria-label="Previous week"
              className="planner-tab__nav-btn"
              onClick={() => onWeekChange(addDays(week, -7))}
            >
              <ChevronLeftOutlined />
            </IconButton>
          </Tooltip>
          <h2 className="planner-tab__range" aria-live="polite">
            {weekRangeLabel(week)}
          </h2>
          <Tooltip title="Next week">
            <IconButton
              aria-label="Next week"
              className="planner-tab__nav-btn"
              onClick={() => onWeekChange(addDays(week, 7))}
            >
              <ChevronRightOutlined />
            </IconButton>
          </Tooltip>
        </div>
        <div className="planner-tab__meta">
          {!loading && !failed ? <p className="planner-tab__summary">{summary}</p> : null}
          <Button
            variant="outlined"
            color="inherit"
            size="small"
            disabled={week === thisWeek}
            onClick={() => onWeekChange(thisWeek)}
            className="planner-tab__this-week"
          >
            This week
          </Button>
        </div>
      </div>

      {failed ? (
        <ErrorState
          title="Could not load this week"
          error={plansQuery.error ?? logsQuery.error}
          onRetry={() => Promise.all([plansQuery.refetch(), hasPast ? logsQuery.refetch() : null])}
          className="planner-tab__state"
        />
      ) : (
        <ol className="planner-tab__week" aria-label={`Week of ${weekRangeLabel(week)}`} aria-busy={loading || undefined}>
          {dates.map((date) => {
            const state = date < today ? 'past' : date === today ? 'today' : 'future';
            const plan = plansByDate.get(date) ?? null;
            return (
              <li key={date} className="planner-tab__day">
                {loading ? (
                  <PlannerDaySkeleton />
                ) : (
                  <PlannerDay
                    date={date}
                    state={state}
                    plan={plan}
                    log={logsByDate.get(date) ?? null}
                    forecast={forecastByDate.get(date) ?? null}
                    unit={unit}
                    wearing={wearingDate === date}
                    onPlan={() => openPlan({ date, plan })}
                    onClear={() => actions.unplan(date)}
                    onWear={async () => {
                      setWearingDate(date);
                      await actions.wear({
                        itemIds: plan.items.map((item) => item.id),
                        outfitId: plan.outfitId,
                        occasion: plan.occasion,
                        weather,
                      });
                      setWearingDate(null);
                    }}
                  />
                )}
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
}
