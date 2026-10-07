import { useId } from 'react';
import cx from './cx';
import './SectionCard.scss';

/**
 * Outlined card with a header row (title, optional subtitle, optional action on the right).
 * Renders a <section> labelled by its title.
 *
 * Props:
 * - title, subtitle, action
 * - padding: 'md' (default, 20/24px) | 'sm' (16px) | 'lg' (32px) | 'none' (body flush, header keeps padding)
 * - titleComponent: heading tag, default 'h2'
 * - className, id, plus any <section> attribute
 */
export default function SectionCard({
  title,
  subtitle,
  action,
  children,
  padding = 'md',
  titleComponent: TitleTag = 'h2',
  className,
  ...rest
}) {
  const headingId = useId();
  const hasHeader = Boolean(title || action);

  return (
    <section
      className={cx('section-card', `section-card--pad-${padding}`, className)}
      aria-labelledby={title ? headingId : undefined}
      {...rest}
    >
      {hasHeader ? (
        <header className="section-card__header">
          <div className="section-card__titles">
            {title ? (
              <TitleTag id={headingId} className="section-card__title">
                {title}
              </TitleTag>
            ) : null}
            {subtitle ? <p className="section-card__subtitle">{subtitle}</p> : null}
          </div>
          {action ? <div className="section-card__action">{action}</div> : null}
        </header>
      ) : null}
      <div className="section-card__body">{children}</div>
    </section>
  );
}
