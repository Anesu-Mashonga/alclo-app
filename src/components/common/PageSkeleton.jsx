import Skeleton from '@mui/material/Skeleton';
import cx from './cx';
import './PageSkeleton.scss';

function Header() {
  return (
    <div className="page-skeleton__header">
      <Skeleton variant="text" className="page-skeleton__title" />
      <Skeleton variant="text" className="page-skeleton__subtitle" />
    </div>
  );
}

function Grid({ count = 8 }) {
  return (
    <>
      <div className="page-skeleton__toolbar">
        <Skeleton variant="rounded" className="page-skeleton__search" />
        {[0, 1, 2, 3].map((key) => (
          <Skeleton key={key} variant="rounded" className="page-skeleton__chip" />
        ))}
      </div>
      <div className="page-skeleton__grid">
        {Array.from({ length: count }, (_, index) => (
          <div key={index} className="page-skeleton__card">
            <Skeleton variant="rounded" className="page-skeleton__photo" />
            <Skeleton variant="text" width="70%" />
            <Skeleton variant="text" width="40%" />
          </div>
        ))}
      </div>
    </>
  );
}

function List({ count = 6 }) {
  return (
    <div className="page-skeleton__list">
      {Array.from({ length: count }, (_, index) => (
        <div key={index} className="page-skeleton__row">
          <Skeleton variant="rounded" className="page-skeleton__thumb" />
          <div className="page-skeleton__row-text">
            <Skeleton variant="text" width="45%" />
            <Skeleton variant="text" width="25%" />
          </div>
        </div>
      ))}
    </div>
  );
}

function Dashboard() {
  return (
    <>
      <div className="page-skeleton__stats">
        {[0, 1, 2, 3].map((key) => (
          <Skeleton key={key} variant="rounded" className="page-skeleton__stat" />
        ))}
      </div>
      <div className="page-skeleton__panels">
        <Skeleton variant="rounded" className="page-skeleton__panel page-skeleton__panel--wide" />
        <Skeleton variant="rounded" className="page-skeleton__panel" />
      </div>
    </>
  );
}

function Form() {
  return (
    <div className="page-skeleton__form">
      {[0, 1, 2, 3].map((key) => (
        <div key={key} className="page-skeleton__field">
          <Skeleton variant="text" width={120} />
          <Skeleton variant="rounded" height={44} />
        </div>
      ))}
    </div>
  );
}

const VARIANTS = { default: Dashboard, dashboard: Dashboard, grid: Grid, list: List, form: Form };

/**
 * Page-shaped loading placeholder for Suspense fallbacks and first loads.
 *
 * Props:
 * - variant: 'default' | 'dashboard' | 'grid' | 'list' | 'form'
 * - header: show the title placeholder (default true)
 * - label: accessible loading text (default "Loading page")
 * - className
 */
export default function PageSkeleton({ variant = 'default', header = true, label = 'Loading page', className }) {
  const Body = VARIANTS[variant] ?? Dashboard;

  return (
    <div className={cx('page-skeleton', className)} role="status" aria-busy="true">
      <span className="u-visually-hidden">{label}</span>
      <div aria-hidden="true">
        {header ? <Header /> : null}
        <Body />
      </div>
    </div>
  );
}
