import Skeleton from '@mui/material/Skeleton';
import './LaundrySkeleton.scss';

const WIDTHS = ['62%', '48%', '70%', '55%', '66%', '44%'];

function SkeletonColumn({ rows }) {
  return (
    <div className="laundry-skeleton__card">
      <div className="laundry-skeleton__header">
        <div className="laundry-skeleton__titles">
          <Skeleton variant="text" width={120} height={24} />
          <Skeleton variant="text" width={180} height={18} />
        </div>
        <Skeleton variant="rounded" width={92} height={36} />
      </div>
      <div className="laundry-skeleton__select" />
      <div className="laundry-skeleton__rows">
        {Array.from({ length: rows }, (_, index) => (
          <div key={index} className="laundry-skeleton__row">
            <Skeleton variant="rounded" width={18} height={18} className="laundry-skeleton__check" />
            <Skeleton variant="rounded" width={40} height={50} className="laundry-skeleton__thumb" />
            <div className="laundry-skeleton__text">
              <Skeleton variant="text" width={WIDTHS[index % WIDTHS.length]} height={20} />
              <Skeleton variant="text" width="38%" height={16} />
            </div>
            <Skeleton variant="rounded" width={72} height={36} className="laundry-skeleton__action" />
          </div>
        ))}
      </div>
    </div>
  );
}

const CHIP_WIDTHS = [44, 58, 80, 92];

/** Mirrors LaundryToolbar: search field, category chips, sort. */
function SkeletonToolbar() {
  return (
    <div className="laundry-skeleton__toolbar">
      <Skeleton variant="rounded" height={44} className="laundry-skeleton__search" />
      <div className="laundry-skeleton__filters">
        {CHIP_WIDTHS.map((width) => (
          <Skeleton key={width} variant="rounded" width={width} height={32} className="laundry-skeleton__chip" />
        ))}
        <Skeleton variant="rounded" height={24} className="laundry-skeleton__sort" />
      </div>
    </div>
  );
}

/** Board placeholder with the same shape as the loaded board (three columns or tabs plus one list). */
export default function LaundrySkeleton({ desktop }) {
  return (
    <div className="laundry-skeleton" aria-busy="true">
      <span className="u-visually-hidden" role="status">
        Loading your laundry
      </span>
      <SkeletonToolbar />
      {desktop ? (
        <div className="laundry-skeleton__board">
          <SkeletonColumn rows={6} />
          <div className="laundry-skeleton__side">
            <SkeletonColumn rows={3} />
            <SkeletonColumn rows={2} />
          </div>
        </div>
      ) : (
        <>
          <div className="laundry-skeleton__tabs">
            <Skeleton variant="text" width={84} height={24} />
            <Skeleton variant="text" width={96} height={24} />
            <Skeleton variant="text" width={64} height={24} />
          </div>
          <SkeletonColumn rows={5} />
        </>
      )}
    </div>
  );
}
