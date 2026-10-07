import CheckCircleOutlined from '@mui/icons-material/CheckCircleOutlined';
import CloseOutlined from '@mui/icons-material/CloseOutlined';
import ErrorOutlineOutlined from '@mui/icons-material/ErrorOutlineOutlined';
import InfoOutlined from '@mui/icons-material/InfoOutlined';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import './Toast.scss';

const SEVERITY_ICONS = {
  success: CheckCircleOutlined,
  error: ErrorOutlineOutlined,
  info: InfoOutlined,
};

/**
 * Visual toast card (ink surface). Rendered by ToastProvider inside a Snackbar; use
 * `useToast()` rather than this component directly.
 */
export default function Toast({ ref, message, severity = 'neutral', action, onAction, onDismiss, ...rest }) {
  const Icon = SEVERITY_ICONS[severity];

  return (
    <div ref={ref} className={`toast toast--${severity}`} {...rest}>
      {Icon ? <Icon className="toast__icon" fontSize="small" aria-hidden /> : null}
      <p className="toast__message">{message}</p>
      <div className="toast__actions">
        {action ? (
          <Button className="toast__action" size="small" color="inherit" onClick={onAction}>
            {action.label}
          </Button>
        ) : null}
        <IconButton className="toast__close" size="small" color="inherit" aria-label="Dismiss" onClick={onDismiss}>
          <CloseOutlined fontSize="small" />
        </IconButton>
      </div>
    </div>
  );
}
