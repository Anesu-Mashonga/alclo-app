import ChevronRightOutlined from '@mui/icons-material/ChevronRightOutlined';
import LockOpenOutlined from '@mui/icons-material/LockOpenOutlined';
import LockOutlined from '@mui/icons-material/LockOutlined';
import Button from '@mui/material/Button';
import ColorDots from '@/components/common/ColorDots';
import OutfitPreview from '@/components/common/OutfitPreview';
import StatusBadge from '@/components/common/StatusBadge';
import cx from '@/components/common/cx';
import SlotTile from './SlotTile';
import { CORE_SLOTS, SLOT_LABELS } from './todayUtils';
import './OutfitBoard.scss';

function boardSlots(slots, needsOuterwear) {
  return CORE_SLOTS.filter((slot) => slot !== 'outerwear' || slots.outerwear || needsOuterwear);
}

/**
 * The outfit itself, as slot tiles or as a flat lay with a legend.
 *
 * Props:
 * - slots: { outerwear, top, bottom, footwear, accessory: [] }
 * - needsOuterwear: show the outerwear slot even when nothing clean fits it
 * - locked: lock map (slot -> id, accessory -> ids)
 * - view: 'tiles' | 'flatlay'
 * - readOnly: worn state (no lock or swap, laundry status visible)
 * - onOpen(id), onToggleLock(slot), onSwap({ slot, item, anchor })
 */
export default function OutfitBoard({
  slots,
  needsOuterwear = false,
  locked = {},
  view = 'tiles',
  readOnly = false,
  onOpen,
  onToggleLock,
  onSwap,
}) {
  const core = boardSlots(slots, needsOuterwear);
  const accessories = slots.accessory ?? [];
  const accessoriesLocked = Boolean(locked.accessory?.length);

  if (view === 'flatlay') {
    const items = [...CORE_SLOTS.map((slot) => slots[slot]), ...accessories].filter(Boolean);
    return (
      <div className="outfit-board outfit-board--flatlay">
        <div className="outfit-board__flatlay-well">
          <OutfitPreview items={items} layout="flatlay" size="lg" className="outfit-board__flatlay" />
        </div>
        <ul className="outfit-board__legend" aria-label="Pieces in this outfit">
          {items.map((item) => {
            const slot = item.category;
            const isLocked = slot === 'accessory' ? accessoriesLocked : locked[slot] === item.id;
            return (
              <li key={item.id}>
                <button type="button" className="outfit-board__legend-row" onClick={() => onOpen?.(item.id)}>
                  <span className="outfit-board__legend-text">
                    <span className="outfit-board__legend-slot">
                      {SLOT_LABELS[slot] ?? 'Item'}
                      {isLocked && !readOnly ? (
                        <span className="outfit-board__legend-lock">
                          <LockOutlined aria-hidden />
                          Locked
                        </span>
                      ) : null}
                    </span>
                    <span className="outfit-board__legend-name">{item.name}</span>
                  </span>
                  {readOnly && item.laundry?.status && item.laundry.status !== 'clean' ? (
                    <StatusBadge status={item.laundry.status} size="sm" />
                  ) : (
                    <ColorDots colors={item.colors} size="sm" />
                  )}
                  <ChevronRightOutlined className="outfit-board__legend-chevron" aria-hidden />
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    );
  }

  return (
    <div className="outfit-board">
      <div className={cx('outfit-board__core', `outfit-board__core--${core.length}`)}>
        {core.map((slot, index) => (
          <SlotTile
            key={slot}
            slot={slot}
            item={slots[slot]}
            locked={Boolean(locked[slot]) && locked[slot] === slots[slot]?.id}
            readOnly={readOnly}
            onOpen={onOpen}
            onToggleLock={onToggleLock}
            onSwap={onSwap}
            index={index}
          />
        ))}
      </div>

      {accessories.length > 0 ? (
        <div className="outfit-board__accessories">
          <div className="outfit-board__accessories-header">
            <h3 className="outfit-board__accessories-title">Accessories</h3>
            {readOnly ? null : (
              <Button
                size="small"
                color="inherit"
                className={cx('outfit-board__accessories-lock', accessoriesLocked && 'outfit-board__accessories-lock--on')}
                aria-pressed={accessoriesLocked}
                startIcon={accessoriesLocked ? <LockOutlined /> : <LockOpenOutlined />}
                onClick={() => onToggleLock?.('accessory')}
              >
                Lock accessories
              </Button>
            )}
          </div>
          <div className="outfit-board__accessory-row">
            {accessories.map((item, index) => (
              <SlotTile
                // Keyed by position so focus stays on the Swap button after a swap.
                key={index}
                slot="accessory"
                variant="accessory"
                item={item}
                showLock={false}
                locked={accessoriesLocked}
                readOnly={readOnly}
                onOpen={onOpen}
                onSwap={onSwap}
                index={core.length + index}
              />
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
