import ArrowForwardOutlined from '@mui/icons-material/ArrowForwardOutlined';
import PriorityHighOutlined from '@mui/icons-material/PriorityHighOutlined';
import Button from '@mui/material/Button';
import Skeleton from '@mui/material/Skeleton';
import { useId } from 'react';
import { Link as RouterLink } from 'react-router';
import ErrorState from '@/components/common/ErrorState';
import cx from '@/components/common/cx';
import { useAuth } from '@/context/AuthContext';
import { useLaundrySummary } from '@/hooks/api';
import { formatPercent, pluralize } from '@/lib/format';
import './LaundrySnapshot.scss';

/** Hamper, urgent and washing counts plus how much of the washable wardrobe is clean. */
export default function LaundrySnapshot({ className }) {
  const headingId = useId();
  const { user } = useAuth();
  const urgentAfter = user?.preferences?.urgentAfterDays ?? 3;
  const query = useLaundrySummary();
  const counts = query.data?.counts;
  const readiness = query.data?.readiness ?? 0;
  const urgent = counts?.urgent ?? 0;

  return (
    <section className={cx('laundry-snapshot', className)} aria-labelledby={headingId}>
      <header className="laundry-snapshot__header">
        <h2 id={headingId} className="laundry-snapshot__title">
          Laundry
        </h2>
        <Button
          component={RouterLink}
          to="/laundry"
          size="small"
          color="inherit"
          endIcon={<ArrowForwardOutlined />}
          className="laundry-snapshot__open"
        >
          Open laundry
        </Button>
      </header>

      {query.isPending ? (
        <div className="laundry-snapshot__body" aria-hidden>
          <div className="laundry-snapshot__stats">
            {[0, 1, 2].map((index) => (
              <Skeleton key={index} variant="rounded" height={64} />
            ))}
          </div>
          <Skeleton variant="text" width="80%" />
          <Skeleton variant="rounded" height={6} />
        </div>
      ) : null}

      {query.isError && !counts ? (
        <ErrorState compact title="Could not load laundry" error={query.error} onRetry={() => query.refetch()} />
      ) : null}

      {counts ? (
        <div className="laundry-snapshot__body">
          <dl className="laundry-snapshot__stats">
            <div className="laundry-snapshot__stat">
              <dt>In hamper</dt>
              <dd>{counts.hamper}</dd>
            </div>
            <div className={cx('laundry-snapshot__stat', urgent > 0 && 'laundry-snapshot__stat--urgent')}>
              <dt>
                {urgent > 0 ? <PriorityHighOutlined aria-hidden /> : null}
                Urgent
              </dt>
              <dd>{urgent}</dd>
            </div>
            <div className="laundry-snapshot__stat">
              <dt>In the wash</dt>
              <dd>{counts.washing}</dd>
            </div>
          </dl>

          {urgent > 0 ? (
            <p className="laundry-snapshot__urgent">
              <PriorityHighOutlined aria-hidden />
              {urgent} {pluralize(urgent, 'piece')} waiting {urgentAfter}+ days. Wash {urgent === 1 ? 'it' : 'them'} soon.
            </p>
          ) : null}

          <div className="laundry-snapshot__readiness">
            <p className="laundry-snapshot__line">
              <strong>{formatPercent(readiness)}</strong> of your washable clothes are clean
            </p>
            <div
              className="laundry-snapshot__meter"
              role="meter"
              aria-label="Washable clothes that are clean"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={Math.round(readiness * 100)}
              aria-valuetext={formatPercent(readiness)}
            >
              <span className="laundry-snapshot__meter-fill" style={{ '--fill': readiness }} />
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
