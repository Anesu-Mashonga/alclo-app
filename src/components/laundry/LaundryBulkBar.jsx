import CheckOutlined from '@mui/icons-material/CheckOutlined';
import CloseOutlined from '@mui/icons-material/CloseOutlined';
import LocalLaundryServiceOutlined from '@mui/icons-material/LocalLaundryServiceOutlined';
import ShoppingBasketOutlined from '@mui/icons-material/ShoppingBasketOutlined';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import { AnimatePresence, motion } from 'motion/react';
import { eligibleFor } from './useLaundryMoves';
import './LaundryBulkBar.scss';

const ACTIONS = [
  { kind: 'wash', label: 'Wash', icon: LocalLaundryServiceOutlined },
  { kind: 'finish', label: 'Done', icon: CheckOutlined },
  {
    kind: 'clean',
    label: 'Mark clean',
    icon: CheckOutlined,
    skipWhen: 'finish',
  },
  { kind: 'hamper', label: 'To hamper', icon: ShoppingBasketOutlined },
];

/**
 * Sticky bar for the current selection (it can span columns): count, the moves that apply to
 * at least one selected piece, and Clear. Sits above the bottom navigation on phones.
 */
export default function LaundryBulkBar({ items, onMove, onClear }) {
  const count = items.length;
  const available = ACTIONS.map((action) => ({
    ...action,
    targets: eligibleFor(action.kind, items),
  })).filter((action) => action.targets.length > 0);
  // "Mark clean" on a selection that is only in the wash is the same as "Done"; show one of them.
  const onlyWashing = items.every((item) => item.laundry?.status === 'washing');
  const visible = available.filter((action) => !(action.skipWhen === 'finish' && onlyWashing));

  return (
    <AnimatePresence>
      {count > 0 ? (
        <motion.div
          key="laundry-bulk-bar"
          className="laundry-bulk-bar"
          role="region"
          aria-label="Selected pieces"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{
            opacity: 0,
            y: 16,
            transition: { duration: 0.16, ease: [0.3, 0, 1, 1] },
          }}
          transition={{ duration: 0.2, ease: [0.2, 0, 0, 1] }}
        >
          <span className="laundry-bulk-bar__count" aria-live="polite">
            {count} selected
          </span>
          <div className="laundry-bulk-bar__actions">
            {visible.map((action) => {
              const Icon = action.icon;
              const partial = action.targets.length < count;
              return (
                <Button
                  key={action.kind}
                  size="small"
                  variant="text"
                  className="laundry-bulk-bar__action"
                  startIcon={<Icon />}
                  onClick={() => onMove(action.kind, action.targets)}
                  aria-label={partial ? `${action.label} (${action.targets.length} of ${count})` : undefined}
                >
                  {partial ? `${action.label} (${action.targets.length})` : action.label}
                </Button>
              );
            })}
          </div>
          <Tooltip title="Clear selection (Esc)">
            <IconButton size="small" className="laundry-bulk-bar__close" aria-label="Clear selection" onClick={onClear}>
              <CloseOutlined fontSize="small" />
            </IconButton>
          </Tooltip>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
