import CheckroomOutlined from '@mui/icons-material/CheckroomOutlined';
import LockOpenOutlined from '@mui/icons-material/LockOpenOutlined';
import LockOutlined from '@mui/icons-material/LockOutlined';
import SwapHorizOutlined from '@mui/icons-material/SwapHorizOutlined';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import { AnimatePresence, motion } from 'motion/react';
import ColorDots from '@/components/common/ColorDots';
import ItemThumb from '@/components/common/ItemThumb';
import cx from '@/components/common/cx';
import { SLOT_LABELS, SLOT_NOUNS } from './todayUtils';
import './SlotTile.scss';

const EASE = [0.2, 0, 0, 1];

/**
 * One slot of the outfit board: photo, slot label, name and colours.
 * Lock and Swap appear on hover or focus (always visible on touch screens).
 *
 * Props:
 * - slot: 'outerwear' | 'top' | 'bottom' | 'footwear' | 'accessory'
 * - item: Item or null (null renders a "nothing clean" placeholder)
 * - variant: 'core' (4/5 photo) | 'accessory' (square, smaller)
 * - locked, showLock (accessories lock as a row, so their tiles hide the per-tile lock)
 * - readOnly: no actions, laundry status shown on the photo (worn state)
 * - onOpen(id), onToggleLock(slot), onSwap({ slot, item, anchor })
 * - index: used to stagger the crossfade after a shuffle
 */
export default function SlotTile({
  slot,
  item,
  variant = 'core',
  locked = false,
  showLock = true,
  readOnly = false,
  onOpen,
  onToggleLock,
  onSwap,
  index = 0,
}) {
  const label = SLOT_LABELS[slot] ?? 'Item';
  const lowerLabel = label.toLowerCase();

  if (!item) {
    return (
      <div className={cx('slot-tile', `slot-tile--${variant}`, 'slot-tile--empty')}>
        <div className="slot-tile__media">
          <div className="slot-tile__placeholder">
            <CheckroomOutlined aria-hidden />
            <span>No clean {SLOT_NOUNS[slot] ?? 'pieces'}</span>
          </div>
        </div>
        <div className="slot-tile__meta">
          <span className="slot-tile__slot">{label}</span>
          <span className="slot-tile__name slot-tile__name--muted">Nothing to pick</span>
        </div>
      </div>
    );
  }

  return (
    <div className={cx('slot-tile', `slot-tile--${variant}`, locked && 'slot-tile--locked', readOnly && 'slot-tile--readonly')}>
      <div className="slot-tile__media">
        <button
          type="button"
          className="slot-tile__open"
          onClick={() => onOpen?.(item.id)}
          aria-label={`${label}: ${item.name}${locked ? ', locked' : ''}. View details`}
        >
          <AnimatePresence initial={false} mode="popLayout">
            <motion.span
              key={item.id}
              className="slot-tile__photo"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1, transition: { duration: 0.28, ease: EASE, delay: index * 0.04 } }}
              exit={{ opacity: 0, transition: { duration: 0.2, ease: EASE } }}
            >
              <ItemThumb item={item} ratio={variant === 'accessory' ? '1/1' : '4/5'} showStatus={readOnly} />
            </motion.span>
          </AnimatePresence>
        </button>

        {locked ? (
          <span className="slot-tile__lock-marker" aria-hidden>
            <LockOutlined />
            <span className="slot-tile__lock-text">Locked</span>
          </span>
        ) : null}

        {readOnly ? null : (
          <div className="slot-tile__actions">
            {showLock ? (
              <Tooltip title={locked ? `Unlock ${lowerLabel}` : `Lock ${lowerLabel}`}>
                <IconButton
                  className={cx('slot-tile__action', locked && 'slot-tile__action--on')}
                  aria-label={`Lock ${lowerLabel}`}
                  aria-pressed={locked}
                  onClick={() => onToggleLock?.(slot)}
                >
                  {locked ? <LockOutlined fontSize="small" /> : <LockOpenOutlined fontSize="small" />}
                </IconButton>
              </Tooltip>
            ) : null}
            <Tooltip title={`Swap ${slot === 'accessory' ? item.name.toLowerCase() : lowerLabel}`}>
              <IconButton
                className="slot-tile__action"
                aria-label={slot === 'accessory' ? `Swap ${item.name}` : `Swap ${lowerLabel}`}
                aria-haspopup="dialog"
                onClick={(event) => onSwap?.({ slot, item, anchor: event.currentTarget })}
              >
                <SwapHorizOutlined fontSize="small" />
              </IconButton>
            </Tooltip>
          </div>
        )}
      </div>

      <div className="slot-tile__meta">
        {variant === 'core' ? <span className="slot-tile__slot">{label}</span> : null}
        <div className="slot-tile__line">
          <span className="slot-tile__name" title={item.name}>
            {item.name}
          </span>
          <ColorDots colors={item.colors} size="sm" className="slot-tile__colors" />
        </div>
      </div>
    </div>
  );
}
