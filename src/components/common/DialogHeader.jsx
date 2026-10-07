import CloseOutlined from '@mui/icons-material/CloseOutlined';
import DialogTitle from '@mui/material/DialogTitle';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import cx from './cx';
import './DialogHeader.scss';

/**
 * Dialog title row with an optional subtitle, extra actions and a close button.
 * Uses MUI DialogTitle, so the dialog is automatically labelled by the title.
 *
 * Props: title, subtitle, actions (node, rendered before the close button),
 * onClose (omit to hide the close button), closeLabel (default "Close"), className.
 */
export default function DialogHeader({ title, subtitle, actions, onClose, closeLabel = 'Close', className }) {
  return (
    <div className={cx('dialog-header', className)}>
      <div className="dialog-header__titles">
        <DialogTitle className="dialog-header__title">{title}</DialogTitle>
        {subtitle ? <p className="dialog-header__subtitle">{subtitle}</p> : null}
      </div>
      {actions ? <div className="dialog-header__actions">{actions}</div> : null}
      {onClose ? (
        <Tooltip title={closeLabel}>
          <IconButton className="dialog-header__close" aria-label={closeLabel} onClick={onClose}>
            <CloseOutlined />
          </IconButton>
        </Tooltip>
      ) : null}
    </div>
  );
}
