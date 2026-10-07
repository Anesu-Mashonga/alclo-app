import Button from '@mui/material/Button';
import { useId } from 'react';
import cx from '@/components/common/cx';
import './DemoAccountPanel.scss';

const DEMO_ACCOUNT = { email: 'demo@alclo.app', password: 'closet2026' };

/**
 * Outlined panel that offers the demo account. "Use demo account" fills the form and signs in.
 *
 * Props: onUse(credentials), loading, disabled, className.
 */
export default function DemoAccountPanel({ onUse, loading = false, disabled = false, className }) {
  const titleId = useId();

  return (
    <section className={cx('demo-panel', className)} aria-labelledby={titleId}>
      <h2 id={titleId} className="demo-panel__title">
        Exploring Alclo? Use the demo account.
      </h2>
      <dl className="demo-panel__creds">
        <div className="demo-panel__cred">
          <dt>Email</dt>
          <dd>{DEMO_ACCOUNT.email}</dd>
        </div>
        <div className="demo-panel__cred">
          <dt>Password</dt>
          <dd>{DEMO_ACCOUNT.password}</dd>
        </div>
      </dl>
      <Button
        variant="outlined"
        color="inherit"
        className="demo-panel__button"
        loading={loading}
        disabled={disabled}
        onClick={() => onUse?.(DEMO_ACCOUNT)}
      >
        Use demo account
      </Button>
    </section>
  );
}
