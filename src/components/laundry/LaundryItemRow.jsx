import CheckOutlined from '@mui/icons-material/CheckOutlined';
import LocalLaundryServiceOutlined from '@mui/icons-material/LocalLaundryServiceOutlined';
import ShoppingBasketOutlined from '@mui/icons-material/ShoppingBasketOutlined';
import Button from '@mui/material/Button';
import ButtonBase from '@mui/material/ButtonBase';
import Checkbox from '@mui/material/Checkbox';
import Tooltip from '@mui/material/Tooltip';
import { motion } from 'motion/react';
import { useId } from 'react';
import cx from '@/components/common/cx';
import ItemThumb from '@/components/common/ItemThumb';
import StatusBadge from '@/components/common/StatusBadge';
import { typeLabel } from '@/data/taxonomy';
import { reasonFor } from './laundryUtils';
import './LaundryItemRow.scss';

const EASE = [0.2, 0, 0, 1];

/** Quick actions per column: the first is the main move, shown as an outlined button. */
const ACTIONS = {
  hamper: [
    {
      kind: 'wash',
      label: 'Wash',
      icon: LocalLaundryServiceOutlined,
      primary: true,
    },
    {
      kind: 'clean',
      label: 'Mark clean',
      icon: CheckOutlined,
      hint: 'Mark clean without washing',
    },
  ],
  washing: [{ kind: 'finish', label: 'Done', icon: CheckOutlined, primary: true }],
  clean: [{ kind: 'hamper', label: 'Back to hamper', icon: ShoppingBasketOutlined }],
};

/** Moves keyboard focus to the previous or next row in the same list. */
function focusSibling(current, step) {
  const list = current.closest('.laundry-list');
  if (!list) return;
  const rows = [...list.querySelectorAll('.laundry-row__main')];
  const index = rows.indexOf(current);
  rows[index + step]?.focus();
}

/**
 * One piece in a laundry column: select checkbox, photo, name, type, why it is here,
 * an urgent tag, and quick moves. The row body opens the item drawer.
 */
export default function LaundryItemRow({ item, columnId, selected, onToggleSelect, onOpen, onMove, now, ref }) {
  const reasonId = useId();
  const reason = reasonFor(item, now);
  const urgent = columnId === 'hamper' && Boolean(item.urgent);
  const type = item.type ? typeLabel(item.type) : null;
  const actions = ACTIONS[columnId] ?? [];

  const handleKeyDown = (event) => {
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      focusSibling(event.currentTarget, event.key === 'ArrowDown' ? 1 : -1);
    }
  };

  return (
    <motion.li
      ref={ref}
      layout="position"
      layoutId={`laundry-${item.id}`}
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{
        opacity: 0,
        scale: 0.98,
        transition: { duration: 0.16, ease: [0.3, 0, 1, 1] },
      }}
      transition={{ duration: 0.28, ease: EASE }}
      className={cx(
        'laundry-row',
        columnId === 'washing' && 'laundry-row--single',
        selected && 'laundry-row--selected',
        urgent && 'laundry-row--urgent',
      )}
      data-item-id={item.id}
    >
      <Checkbox
        className="laundry-row__check"
        size="small"
        checked={selected}
        onChange={(event) =>
          onToggleSelect(item.id, {
            shiftKey: Boolean(event.nativeEvent?.shiftKey),
          })
        }
        slotProps={{ input: { 'aria-label': `Select ${item.name}` } }}
      />

      <ButtonBase
        className="laundry-row__main"
        onClick={() => onOpen(item.id)}
        onKeyDown={handleKeyDown}
        aria-label={`${item.name}${urgent ? ', urgent' : ''}`}
        aria-describedby={reasonId}
      >
        <ItemThumb item={item} size="xs" aria-hidden />
        <span className="laundry-row__text">
          <span className="laundry-row__title">
            <span className="laundry-row__name">{item.name}</span>
            {urgent ? <StatusBadge status="hamper" urgent size="sm" className="laundry-row__urgent" /> : null}
          </span>
          <span className="laundry-row__meta" id={reasonId}>
            {type ? `${type} · ${reason}` : reason}
          </span>
        </span>
      </ButtonBase>

      <div className="laundry-row__actions">
        {actions.map((action) => {
          const Icon = action.icon;
          const button = (
            <Button
              key={action.kind}
              size="small"
              variant={action.primary ? 'outlined' : 'text'}
              color="inherit"
              className={cx(
                'laundry-row__action',
                action.primary ? 'laundry-row__action--primary' : 'laundry-row__action--secondary',
              )}
              startIcon={<Icon />}
              onClick={() => onMove(action.kind, [item])}
              aria-label={`${action.label}, ${item.name}`}
            >
              <span className="laundry-row__action-label">{action.label}</span>
            </Button>
          );
          return action.hint ? (
            <Tooltip key={action.kind} title={action.hint}>
              {button}
            </Tooltip>
          ) : (
            button
          );
        })}
      </div>
    </motion.li>
  );
}
