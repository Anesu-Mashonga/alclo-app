import AddOutlined from '@mui/icons-material/AddOutlined';
import CheckOutlined from '@mui/icons-material/CheckOutlined';
import CloseOutlined from '@mui/icons-material/CloseOutlined';
import EditCalendarOutlined from '@mui/icons-material/EditCalendarOutlined';
import HistoryOutlined from '@mui/icons-material/HistoryOutlined';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Skeleton from '@mui/material/Skeleton';
import Tooltip from '@mui/material/Tooltip';
import { useId } from 'react';
import cx from '@/components/common/cx';
import OutfitPreview from '@/components/common/OutfitPreview';
import WeatherIcon from '@/components/common/WeatherIcon';
import { conditionLabel, occasionLabel } from '@/data/taxonomy';
import { dayjs, formatTime } from '@/lib/dates';
import { formatTemp } from '@/lib/format';
import { laundryFlag } from './outfitUtils';
import './PlannerDay.scss';

/**
 * One day in the planner week.
 *
 * Props:
 * - date ('YYYY-MM-DD'), state: 'past' | 'today' | 'future'
 * - plan (decorated plan or null), log (latest wear log for the day or null)
 * - forecast ({ highC, lowC, condition } or null), unit
 * - onPlan(), onClear(), onWear(), wearing (bool)
 */
export default function PlannerDay({ date, state, plan, log, forecast, unit = 'C', onPlan, onClear, onWear, wearing }) {
  const headingId = useId();
  const day = dayjs(date);
  const isPast = state === 'past';
  const isToday = state === 'today';
  const showLog = Boolean(log) && (isPast || (isToday && !plan));
  const fullLabel = day.format('dddd D MMMM');

  let body;
  if (showLog) {
    const name = log.outfit?.name ?? (log.occasion ? `${occasionLabel(log.occasion)} outfit` : 'Logged outfit');
    body = (
      <div className="planner-day__content">
        <OutfitPreview items={log.items} layout="grid" size="sm" className="planner-day__preview" />
        <div className="planner-day__text">
          <p className="planner-day__status">
            <HistoryOutlined aria-hidden className="planner-day__status-icon" />
            {isToday ? `Worn today at ${formatTime(log.wornAt ?? log.createdAt)}` : 'Worn'}
          </p>
          <p className="planner-day__name">{name}</p>
        </div>
      </div>
    );
  } else if (plan) {
    const flag = !isPast ? laundryFlag(plan.items) : null;
    const name = plan.outfit?.name ?? `${occasionLabel(plan.occasion)} outfit`;
    body = (
      <div className="planner-day__content">
        <OutfitPreview items={plan.items} layout="grid" size="sm" className="planner-day__preview" />
        <div className="planner-day__text">
          {isPast ? (
            <p className="planner-day__status">Planned, not logged</p>
          ) : (
            <p className="planner-day__status">{occasionLabel(plan.occasion)}</p>
          )}
          <p className="planner-day__name">{name}</p>
          {plan.note ? <p className="planner-day__note">{plan.note}</p> : null}
          {flag ? <p className="planner-day__flag">{flag}</p> : null}
        </div>
      </div>
    );
  } else if (isPast) {
    body = <p className="planner-day__empty">Nothing logged</p>;
  } else {
    body = (
      <Button
        variant="text"
        color="inherit"
        className="planner-day__plan"
        startIcon={<AddOutlined />}
        onClick={onPlan}
        aria-label={`Plan outfit for ${fullLabel}`}
      >
        Plan outfit
      </Button>
    );
  }

  const canEdit = Boolean(plan) && !isPast && !showLog;

  return (
    <section
      className={cx(
        'planner-day',
        `planner-day--${state}`,
        !plan && !showLog && !isPast && 'planner-day--open',
      )}
      aria-labelledby={headingId}
      aria-current={isToday ? 'date' : undefined}
    >
      <header className="planner-day__header">
        <h3 id={headingId} className="planner-day__date">
          <span className="planner-day__weekday">{day.format('ddd')}</span>
          <span className="planner-day__daynum">{day.format('D')}</span>
          <span className="u-visually-hidden">{day.format(' MMMM')}</span>
          {isToday ? <span className="planner-day__today">Today</span> : null}
        </h3>
        {!forecast && isPast && log?.weather ? (
          <p className="planner-day__forecast">
            <WeatherIcon condition={log.weather.condition} className="planner-day__forecast-icon" />
            <span className="u-visually-hidden">{conditionLabel(log.weather.condition)}, </span>
            <span className="planner-day__temps">{formatTemp(log.weather.tempC, unit, { unit: false })}</span>
          </p>
        ) : null}
        {forecast ? (
          <p className="planner-day__forecast">
            <WeatherIcon condition={forecast.condition} className="planner-day__forecast-icon" />
            <span className="u-visually-hidden">{conditionLabel(forecast.condition)}, </span>
            <span className="planner-day__temps">
              {formatTemp(forecast.highC, unit, { unit: false })}
              <span className="planner-day__low"> / {formatTemp(forecast.lowC, unit, { unit: false })}</span>
            </span>
          </p>
        ) : null}
      </header>

      {body}

      {canEdit ? (
        <div className="planner-day__actions">
          {isToday ? (
            <Button
              variant="contained"
              color="ink"
              size="small"
              startIcon={<CheckOutlined />}
              loading={wearing}
              loadingPosition="start"
              onClick={onWear}
              className="planner-day__wear"
            >
              Wear today
            </Button>
          ) : null}
          <Button
            variant="outlined"
            color="inherit"
            size="small"
            startIcon={<EditCalendarOutlined />}
            onClick={onPlan}
            aria-label={`Change the plan for ${fullLabel}`}
            className="planner-day__change"
          >
            Change
          </Button>
          <Tooltip title="Clear this day">
            <IconButton
              size="small"
              className="planner-day__clear"
              aria-label={`Clear the plan for ${fullLabel}`}
              onClick={onClear}
            >
              <CloseOutlined fontSize="small" />
            </IconButton>
          </Tooltip>
        </div>
      ) : null}
    </section>
  );
}

/** Skeleton with the same shape as a planned day. */
export function PlannerDaySkeleton() {
  return (
    <div className="planner-day planner-day--skeleton" aria-hidden>
      <div className="planner-day__header">
        <Skeleton variant="rounded" className="planner-day__sk-date" />
        <Skeleton variant="rounded" className="planner-day__sk-forecast" />
      </div>
      <div className="planner-day__content">
        <Skeleton variant="rounded" className="planner-day__preview planner-day__sk-preview" />
        <div className="planner-day__text">
          <Skeleton variant="rounded" className="planner-day__sk-line" />
          <Skeleton variant="rounded" className="planner-day__sk-line planner-day__sk-line--short" />
        </div>
      </div>
    </div>
  );
}
