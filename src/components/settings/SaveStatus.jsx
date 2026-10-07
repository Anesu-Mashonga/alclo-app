import CheckOutlined from '@mui/icons-material/CheckOutlined';
import CloudSyncOutlined from '@mui/icons-material/CloudSyncOutlined';
import ErrorOutlineOutlined from '@mui/icons-material/ErrorOutlineOutlined';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import cx from '@/components/common/cx';
import './SaveStatus.scss';

const COPY = {
  idle: 'Changes save automatically',
  saving: 'Saving',
  saved: 'Saved',
  error: 'Not saved',
};

/**
 * Quiet inline autosave indicator, announced politely to screen readers.
 * Props: status, onRetry (shown with the error state), idleLabel, className
 */
export default function SaveStatus({ status = 'idle', onRetry, idleLabel = COPY.idle, className }) {
  let icon = <CloudSyncOutlined fontSize="inherit" />;
  if (status === 'saving') icon = <CircularProgress size={12} thickness={6} color="inherit" />;
  if (status === 'saved') icon = <CheckOutlined fontSize="inherit" />;
  if (status === 'error') icon = <ErrorOutlineOutlined fontSize="inherit" />;

  return (
    <div className={cx('save-status', `save-status--${status}`, className)}>
      <span className="save-status__live" role="status" aria-live="polite">
        <span className="save-status__icon" aria-hidden>
          {icon}
        </span>
        <span className="save-status__text">{status === 'idle' ? idleLabel : COPY[status]}</span>
      </span>
      {status === 'error' && onRetry ? (
        <Button size="small" variant="text" color="inherit" className="save-status__retry" onClick={onRetry}>
          Retry
        </Button>
      ) : null}
    </div>
  );
}
