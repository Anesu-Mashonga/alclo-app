import cx from './cx';
import renderIcon from './renderIcon';
import './EmptyState.scss';

/**
 * Empty state that teaches the next step.
 *
 * Props:
 * - icon: element (<CheckroomOutlined />) or component (CheckroomOutlined)
 * - title, description
 * - action: usually a primary <Button>; secondaryAction: a quieter one
 * - compact: smaller version for use inside cards
 * - titleComponent: heading tag, default 'h2' (use 'h3' inside a SectionCard)
 * - className
 */
export default function EmptyState({
  icon,
  title,
  description,
  action,
  secondaryAction,
  compact = false,
  titleComponent: TitleTag = 'h2',
  className,
}) {
  return (
    <div className={cx('empty-state', compact && 'empty-state--compact', className)}>
      {icon ? <div className="empty-state__icon">{renderIcon(icon, { fontSize: 'inherit' })}</div> : null}
      <TitleTag className="empty-state__title">{title}</TitleTag>
      {description ? <p className="empty-state__description">{description}</p> : null}
      {action || secondaryAction ? (
        <div className="empty-state__actions">
          {action}
          {secondaryAction}
        </div>
      ) : null}
    </div>
  );
}
