import CheckCircleOutlined from '@mui/icons-material/CheckCircleOutlined';
import LocalLaundryServiceOutlined from '@mui/icons-material/LocalLaundryServiceOutlined';
import PriorityHighOutlined from '@mui/icons-material/PriorityHighOutlined';
import ShoppingBasketOutlined from '@mui/icons-material/ShoppingBasketOutlined';
import { createElement } from 'react';
import cx from './cx';
import './StatusBadge.scss';

const STATUSES = {
  clean: { label: 'Clean', icon: CheckCircleOutlined, tone: 'success' },
  hamper: { label: 'In hamper', icon: ShoppingBasketOutlined, tone: 'warning' },
  washing: { label: 'In the wash', icon: LocalLaundryServiceOutlined, tone: 'info' },
  urgent: { label: 'Urgent', icon: PriorityHighOutlined, tone: 'error' },
};

/**
 * Laundry status pill: icon + text, never colour alone.
 *
 * @param {{ status: 'clean'|'hamper'|'washing', urgent?: boolean, size?: 'md'|'sm', label?: string, className?: string }} props
 */
export default function StatusBadge({ status = 'clean', urgent = false, size = 'md', label, className, ...rest }) {
  const config = (urgent ? STATUSES.urgent : STATUSES[status]) ?? STATUSES.clean;

  return (
    <span className={cx('status-badge', `status-badge--${config.tone}`, `status-badge--${size}`, className)} {...rest}>
      {createElement(config.icon, { className: 'status-badge__icon', 'aria-hidden': true })}
      <span className="status-badge__label">{label ?? config.label}</span>
    </span>
  );
}
