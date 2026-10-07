import Skeleton from '@mui/material/Skeleton';
import cx from './cx';
import renderIcon from './renderIcon';
import './StatTile.scss';

/**
 * Compact stat: label, big tabular number, optional hint and icon.
 *
 * Props:
 * - label, value, hint
 * - icon: element or icon component
 * - tone: 'neutral' (default) | 'primary' | 'success' | 'warning' | 'error' | 'info'
 *   (tints the icon bubble; the number stays neutral for readability)
 * - loading: show a skeleton in place of the value
 * - className
 */
export default function StatTile({ label, value, hint, icon, tone = 'neutral', loading = false, className }) {
  return (
    <div className={cx('stat-tile', `stat-tile--${tone}`, className)}>
      <div className="stat-tile__top">
        <span className="stat-tile__label">{label}</span>
        {icon ? <span className="stat-tile__icon">{renderIcon(icon, { fontSize: 'inherit' })}</span> : null}
      </div>
      <div className="stat-tile__value">{loading ? <Skeleton width="55%" /> : value}</div>
      {hint ? <div className="stat-tile__hint">{hint}</div> : null}
    </div>
  );
}
