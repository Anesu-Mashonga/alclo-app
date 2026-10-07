import AddOutlined from '@mui/icons-material/AddOutlined';
import ArrowForwardOutlined from '@mui/icons-material/ArrowForwardOutlined';
import EventOutlined from '@mui/icons-material/EventOutlined';
import LockOutlined from '@mui/icons-material/LockOutlined';
import Button from '@mui/material/Button';
import Skeleton from '@mui/material/Skeleton';
import { useId } from 'react';
import { Link as RouterLink } from 'react-router';
import ErrorState from '@/components/common/ErrorState';
import OutfitPreview from '@/components/common/OutfitPreview';
import cx from '@/components/common/cx';
import { occasionLabel } from '@/data/taxonomy';
import { usePlans, useWearLogs } from '@/hooks/api';
import { formatDate, todayISO, weekDates } from '@/lib/dates';
import './WeekPlan.scss';

const PLANNER_URL = '/outfits?tab=planner';

function planName(plan) {
  return plan.outfit?.name || plan.note || `${occasionLabel(plan.occasion)} outfit`;
}

function latestLogByDate(logs = []) {
  const map = new Map();
  for (const log of logs) {
    const current = map.get(log.date);
    if (!current || String(log.createdAt) > String(current.createdAt)) map.set(log.date, log);
  }
  return map;
}

function DayCell({ date, today, plan, log }) {
  const isToday = date === today;
  const isPast = date < today;
  const dayName = formatDate(date, 'ddd');
  const fullName = formatDate(date, 'dddd D MMMM');
  const shown = log ?? plan ?? null;
  const items = shown?.items ?? [];

  let label = null;
  if (log) label = log.outfit?.name ?? 'Worn';
  else if (plan) label = planName(plan);

  return (
    <li
      className={cx('week-plan__day', isToday && 'week-plan__day--today', isPast && 'week-plan__day--past')}
      aria-current={isToday ? 'date' : undefined}
    >
      <div className="week-plan__date" aria-label={isToday ? `Today, ${fullName}` : fullName}>
        <span className="week-plan__dow">{isToday ? 'Today' : dayName}</span>
        <span className="week-plan__num">{formatDate(date, 'D')}</span>
      </div>
      <div className="week-plan__content">
        {items.length > 0 ? (
          <>
            <OutfitPreview
              items={items}
              layout="strip"
              size="sm"
              max={2}
              label={`${log ? 'Worn' : 'Planned'}: ${items.map((item) => item.name).join(', ')}`}
              className="week-plan__strip"
            />
            <span className="week-plan__label">
              {log && !log.outfit?.name ? null : <span className="u-visually-hidden">{log ? 'Worn: ' : 'Planned: '}</span>}
              {label}
            </span>
          </>
        ) : isPast ? (
          <span className="week-plan__muted">Nothing logged</span>
        ) : (
          <RouterLink to={PLANNER_URL} className="week-plan__plan-link" aria-label={`Plan an outfit for ${fullName}`}>
            <AddOutlined aria-hidden />
            Plan
          </RouterLink>
        )}
      </div>
    </li>
  );
}

/**
 * This week at a glance: planned outfits for coming days, what was worn on past days, and a
 * prompt to use today's plan. Rows in a narrow column, seven columns when there is room.
 */
export default function WeekPlan({ todayLog, onUsePlan, className }) {
  const headingId = useId();
  const today = todayISO();
  const days = weekDates(today);
  const plansQuery = usePlans({ from: days[0], to: days[6] });
  const logsQuery = useWearLogs({ from: days[0], to: today });

  const plans = plansQuery.data ?? [];
  const planByDate = new Map(plans.map((plan) => [plan.date, plan]));
  const logByDate = latestLogByDate(logsQuery.data ?? []);
  if (todayLog) logByDate.set(today, todayLog);
  const todayPlan = planByDate.get(today);
  const loading = plansQuery.isPending || logsQuery.isPending;
  const failed = (plansQuery.isError && !plansQuery.data) || (logsQuery.isError && !logsQuery.data);

  return (
    <section className={cx('week-plan', className)} aria-labelledby={headingId}>
      <header className="week-plan__header">
        <h2 id={headingId} className="week-plan__title">
          This week
        </h2>
        <Button
          component={RouterLink}
          to={PLANNER_URL}
          size="small"
          color="inherit"
          endIcon={<ArrowForwardOutlined />}
          className="week-plan__open"
        >
          Planner
        </Button>
      </header>

      {todayPlan && !todayLog && todayPlan.items?.length ? (
        <div className="week-plan__callout">
          <EventOutlined aria-hidden className="week-plan__callout-icon" />
          <p className="week-plan__callout-text">
            You planned <strong>&lsquo;{planName(todayPlan)}&rsquo;</strong> for today
          </p>
          <Button
            size="small"
            variant="contained"
            color="ink"
            startIcon={<LockOutlined />}
            onClick={() => onUsePlan?.(todayPlan)}
            className="week-plan__use"
          >
            Use it
          </Button>
        </div>
      ) : null}

      {loading ? (
        <ul className="week-plan__days" aria-hidden>
          {days.map((date) => (
            <li key={date} className="week-plan__day">
              <div className="week-plan__date">
                <Skeleton variant="text" width={28} />
                <Skeleton variant="text" width={18} />
              </div>
              <div className="week-plan__content">
                <Skeleton variant="rounded" width={88} height={40} />
              </div>
            </li>
          ))}
        </ul>
      ) : null}

      {!loading && failed ? (
        <ErrorState
          compact
          title="Could not load this week"
          error={plansQuery.error ?? logsQuery.error}
          onRetry={() => Promise.all([plansQuery.refetch(), logsQuery.refetch()])}
        />
      ) : null}

      {!loading && !failed ? (
        <ol className="week-plan__days">
          {days.map((date) => (
            <DayCell key={date} date={date} today={today} plan={planByDate.get(date)} log={logByDate.get(date)} />
          ))}
        </ol>
      ) : null}
    </section>
  );
}
