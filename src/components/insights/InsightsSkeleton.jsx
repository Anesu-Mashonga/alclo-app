import Skeleton from '@mui/material/Skeleton';
import cx from '@/components/common/cx';
import InsightsKpis from './InsightsKpis';
import './InsightsSkeleton.scss';

function CardSkeleton({ area, children, wide = false }) {
  return (
    <div className={cx('insights-skeleton__card', `insights-page__area--${area}`)}>
      <Skeleton variant="text" width={wide ? '32%' : '48%'} className="insights-skeleton__title" />
      <Skeleton variant="text" width={wide ? '22%' : '36%'} className="insights-skeleton__subtitle" />
      <div className="insights-skeleton__body">{children}</div>
    </div>
  );
}

function Rows({ count = 5 }) {
  return Array.from({ length: count }, (_, index) => (
    <div key={index} className="insights-skeleton__row">
      <Skeleton variant="rounded" className="insights-skeleton__thumb" />
      <div className="insights-skeleton__row-text">
        <Skeleton variant="text" width="60%" />
        <Skeleton variant="text" width="35%" />
      </div>
    </div>
  ));
}

function HBars({ count = 5 }) {
  return Array.from({ length: count }, (_, index) => (
    <div key={index} className="insights-skeleton__hbar">
      <Skeleton variant="text" width={64} />
      <Skeleton variant="rounded" height={18} width={`${80 - index * 12}%`} />
    </div>
  ));
}

/** Loading layout that mirrors the Insights page grid card for card. */
export default function InsightsSkeleton({ rangeLabel }) {
  return (
    <div className="insights-skeleton" role="status" aria-busy="true">
      <span className="u-visually-hidden">Loading insights</span>
      <div aria-hidden="true" className="insights-page__content">
        <InsightsKpis loading rangeLabel={rangeLabel} />
        <div className="insights-page__grid">
          <CardSkeleton area="weekly" wide>
            <div className="insights-skeleton__columns">
              {[46, 70, 38, 88, 60, 74].map((height, index) => (
                <Skeleton key={index} variant="rounded" width={20} height={`${height}%`} />
              ))}
            </div>
          </CardSkeleton>
          <CardSkeleton area="most-worn">
            <Rows />
          </CardSkeleton>
          <CardSkeleton area="category">
            <HBars />
          </CardSkeleton>
          <CardSkeleton area="occasions">
            <HBars />
          </CardSkeleton>
          <CardSkeleton area="forgotten">
            <Rows />
          </CardSkeleton>
          <CardSkeleton area="colors">
            <Skeleton variant="rounded" height={20} className="insights-skeleton__swatches" />
            <Rows count={4} />
          </CardSkeleton>
        </div>
      </div>
    </div>
  );
}
