import LinearProgress from '@mui/material/LinearProgress';
import Logo from './Logo';
import './FullPageLoader.scss';

/**
 * Branded full-page loader while the session bootstraps. It fades in after a short delay
 * so fast loads never flash it.
 */
export default function FullPageLoader({ label = 'Loading Alclo' }) {
  return (
    <div className="full-page-loader" role="status" aria-live="polite">
      <div className="full-page-loader__inner">
        <Logo variant="full" size="lg" />
        <LinearProgress className="full-page-loader__bar" aria-label={label} />
        <span className="u-visually-hidden">{label}</span>
      </div>
    </div>
  );
}
