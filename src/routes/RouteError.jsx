import ErrorOutlineOutlined from '@mui/icons-material/ErrorOutlineOutlined';
import RefreshOutlined from '@mui/icons-material/RefreshOutlined';
import SearchOffOutlined from '@mui/icons-material/SearchOffOutlined';
import SystemUpdateAltOutlined from '@mui/icons-material/SystemUpdateAltOutlined';
import Button from '@mui/material/Button';
import { isRouteErrorResponse, Link, useRouteError } from 'react-router';
import cx from '@/components/common/cx';
import Logo from '@/components/layout/Logo';
import useDocumentTitle from '@/hooks/useDocumentTitle';
import './RouteError.scss';

const CHUNK_ERROR = /dynamically imported module|Importing a module script failed|Loading chunk|Failed to fetch/i;

function describe(error) {
  if (isRouteErrorResponse(error) && error.status === 404) {
    return {
      kind: 'not-found',
      title: 'We could not find that page',
      description: 'The link may be old or mistyped. Your wardrobe and outfits are all still here.',
    };
  }
  if (CHUNK_ERROR.test(String(error?.message ?? ''))) {
    return {
      kind: 'update',
      title: 'Alclo has been updated',
      description: 'Part of the app changed while this tab was open. Reload to get the latest version.',
    };
  }
  return {
    kind: 'crash',
    title: 'This page ran into a problem',
    description: 'Reloading usually fixes it. Your data is saved on this device, so nothing is lost.',
  };
}

const ICONS = {
  'not-found': SearchOffOutlined,
  update: SystemUpdateAltOutlined,
  crash: ErrorOutlineOutlined,
};

/**
 * Router error boundary. `inShell` keeps the app navigation around the message
 * (used for page-level errors); otherwise it renders a full branded page.
 */
export default function RouteError({ inShell = false }) {
  const error = useRouteError();
  const { kind, title, description } = describe(error);
  const Icon = ICONS[kind];
  useDocumentTitle(kind === 'not-found' ? 'Page not found' : 'Something went wrong');

  const details = import.meta.env.DEV && error ? String(error?.stack || error?.message || error) : null;

  return (
    <div className={cx('route-error', inShell ? 'route-error--in-shell' : 'route-error--page')}>
      {inShell ? null : (
        <Link to="/" className="route-error__brand" aria-label="Alclo, go to Today">
          <Logo />
        </Link>
      )}
      <div className="route-error__body" role="alert">
        <div className="route-error__icon">
          <Icon fontSize="inherit" aria-hidden />
        </div>
        <h1 className="route-error__title">{title}</h1>
        <p className="route-error__description">{description}</p>
        <div className="route-error__actions">
          {kind === 'not-found' ? null : (
            <Button variant="contained" startIcon={<RefreshOutlined />} onClick={() => window.location.reload()}>
              Reload page
            </Button>
          )}
          <Button
            variant={kind === 'not-found' ? 'contained' : 'outlined'}
            color={kind === 'not-found' ? 'primary' : 'inherit'}
            href="/"
          >
            Go to Today
          </Button>
        </div>
        {details ? (
          <details className="route-error__details">
            <summary>Technical details</summary>
            <pre>{details}</pre>
          </details>
        ) : null}
      </div>
    </div>
  );
}
