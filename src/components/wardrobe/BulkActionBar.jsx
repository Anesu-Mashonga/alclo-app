import CheckroomOutlined from '@mui/icons-material/CheckroomOutlined';
import DeleteOutlined from '@mui/icons-material/DeleteOutlined';
import LocalLaundryServiceOutlined from '@mui/icons-material/LocalLaundryServiceOutlined';
import Button from '@mui/material/Button';
import { AnimatePresence, motion } from 'motion/react';
import './BulkActionBar.scss';

/**
 * Floating action bar for selection mode. Sits above the mobile bottom navigation.
 * Actions are disabled until something is selected.
 */
export default function BulkActionBar({
  open,
  count,
  total,
  onSelectAll,
  onClearSelection,
  onWear,
  onLaundry,
  onDelete,
  onCancel,
  pending = {},
}) {
  const none = count === 0;
  const allSelected = total > 0 && count === total;

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          className="bulk-action-bar"
          role="region"
          aria-label="Selection actions"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 24, transition: { duration: 0.2, ease: [0.3, 0, 1, 1] } }}
          transition={{ duration: 0.28, ease: [0.2, 0, 0, 1] }}
        >
          <div className="bulk-action-bar__summary">
            <span className="bulk-action-bar__count" aria-live="polite">
              {count} selected
            </span>
            <Button
              size="small"
              variant="text"
              color="inherit"
              className="bulk-action-bar__select-all"
              onClick={allSelected ? onClearSelection : onSelectAll}
              disabled={total === 0}
            >
              {allSelected ? 'Select none' : `Select all ${total}`}
            </Button>
          </div>
          <div className="bulk-action-bar__actions">
            <Button
              variant="text"
              color="inherit"
              className="bulk-action-bar__action"
              startIcon={<CheckroomOutlined />}
              disabled={none}
              loading={pending.wear}
              loadingPosition="start"
              onClick={onWear}
            >
              Wear today
            </Button>
            <Button
              variant="text"
              color="inherit"
              className="bulk-action-bar__action"
              startIcon={<LocalLaundryServiceOutlined />}
              disabled={none}
              loading={pending.laundry}
              loadingPosition="start"
              onClick={onLaundry}
            >
              Send to laundry
            </Button>
            <Button
              variant="text"
              color="inherit"
              className="bulk-action-bar__action bulk-action-bar__action--danger"
              startIcon={<DeleteOutlined />}
              disabled={none}
              loading={pending.delete}
              loadingPosition="start"
              onClick={onDelete}
            >
              Delete
            </Button>
            <span className="bulk-action-bar__divider" aria-hidden />
            <Button variant="text" color="inherit" className="bulk-action-bar__cancel" onClick={onCancel}>
              Cancel
            </Button>
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
