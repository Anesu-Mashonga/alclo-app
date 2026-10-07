import { useId } from 'react';
import cx from '@/components/common/cx';
import './SettingsPanel.scss';

/**
 * The content area for one settings section: an h2 with a short description, an optional
 * aside (autosave status, reset link) and a stack of cards.
 */
export default function SettingsPanel({ title, description, aside, children, className }) {
  const headingId = useId();

  return (
    <section className={cx('settings-panel', className)} aria-labelledby={headingId}>
      <header className="settings-panel__header">
        <div className="settings-panel__titles">
          <h2 id={headingId} className="settings-panel__title">
            {title}
          </h2>
          {description ? <p className="settings-panel__description">{description}</p> : null}
        </div>
        {aside ? <div className="settings-panel__aside">{aside}</div> : null}
      </header>
      <div className="settings-panel__body">{children}</div>
    </section>
  );
}
