import CloudOffOutlined from '@mui/icons-material/CloudOffOutlined';
import ErrorOutlineOutlined from '@mui/icons-material/ErrorOutlineOutlined';
import RefreshOutlined from '@mui/icons-material/RefreshOutlined';
import Button from '@mui/material/Button';
import { useState } from 'react';
import cx from './cx';
import './ErrorState.scss';

const FALLBACK_MESSAGE = 'Something on our side did not respond. Try again in a moment.';

function isNetworkError(error) {
  return error?.code === 'network' || error?.status === 503;
}

/**
 * Error state with a way to recover. Pass the query error and `refetch` as onRetry.
 *
 * Props:
 * - title: default "Something went wrong"
 * - error: ApiError-like { message, code, status }; its message is shown
 * - onRetry: may return a promise; the button shows progress until it settles
 * - retryLabel: default "Try again"
 * - compact: smaller version for cards
 * - className
 */
export default function ErrorState({
  title = 'Something went wrong',
  error,
  onRetry,
  retryLabel = 'Try again',
  compact = false,
  className,
}) {
  const [retrying, setRetrying] = useState(false);
  const offline = isNetworkError(error);
  const message = error?.message || FALLBACK_MESSAGE;

  const handleRetry = async () => {
    setRetrying(true);
    try {
      await onRetry?.();
    } finally {
      setRetrying(false);
    }
  };

  return (
    <div className={cx('error-state', compact && 'error-state--compact', className)} role="alert">
      <div className="error-state__icon">
        {offline ? (
          <CloudOffOutlined fontSize="inherit" aria-hidden />
        ) : (
          <ErrorOutlineOutlined fontSize="inherit" aria-hidden />
        )}
      </div>
      <p className="error-state__title">{title}</p>
      <p className="error-state__message">{message}</p>
      {onRetry ? (
        <Button
          className="error-state__retry"
          variant="outlined"
          color="inherit"
          size={compact ? 'small' : 'medium'}
          startIcon={<RefreshOutlined />}
          loading={retrying}
          loadingPosition="start"
          onClick={handleRetry}
        >
          {retryLabel}
        </Button>
      ) : null}
    </div>
  );
}
