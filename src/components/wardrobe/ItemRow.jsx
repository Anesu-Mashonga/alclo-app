import CheckOutlined from '@mui/icons-material/CheckOutlined';
import cx from '@/components/common/cx';
import ColorDots from '@/components/common/ColorDots';
import ItemThumb from '@/components/common/ItemThumb';
import StatusBadge from '@/components/common/StatusBadge';
import { relativeDayLabel } from '@/lib/dates';
import ItemActionsMenu from './ItemActionsMenu';
import { itemKind, wearCountLabel } from './itemFormat';
import './ItemRow.scss';

/** Column labels for the list view (visual only; each row carries its own text). */
export function ItemListHeader({ selectMode }) {
  return (
    <div className={cx('item-row', 'item-row--header', selectMode && 'item-row--selecting')} aria-hidden>
      {selectMode ? <span /> : null}
      <span className="item-row__head item-row__head--piece">Piece</span>
      <span className="item-row__head item-row__colors">Colours</span>
      <span className="item-row__head item-row__status">Status</span>
      <span className="item-row__head item-row__wears">Wears</span>
      <span className="item-row__head item-row__last">Last worn</span>
      {selectMode ? null : <span />}
    </div>
  );
}

/**
 * List view row: thumb, name and type, colours, laundry status, wears, last worn and an
 * overflow menu. The row opens the item drawer, or toggles selection in selection mode.
 */
export default function ItemRow({ item, urgent = false, selectMode = false, selected = false, actions, onActivate, onOpen }) {
  const status = item.laundry?.status ?? 'clean';
  const mainProps = selectMode ? { role: 'checkbox', 'aria-checked': selected } : { 'aria-haspopup': 'dialog' };
  const lastWorn = item.lastWornAt ? relativeDayLabel(item.lastWornAt) : 'Never';

  return (
    <div
      role="listitem"
      className={cx('item-row', selectMode && 'item-row--selecting', selected && 'item-row--selected')}
      data-item-id={item.id}
    >
      {selectMode ? (
        <span className={cx('item-row__check', selected && 'item-row__check--on')} aria-hidden>
          {selected ? <CheckOutlined fontSize="inherit" /> : null}
        </span>
      ) : null}
      <div className="item-row__piece">
        <ItemThumb item={item} size="xs" ratio="1/1" className="item-row__thumb" />
        <div className="item-row__titles">
          <button
            type="button"
            className="item-row__main"
            data-card-main
            onClick={(event) => onActivate?.(item, event)}
            onMouseDown={(event) => {
              if (event.shiftKey) event.preventDefault();
            }}
            {...mainProps}
          >
            <span className="item-row__name">{item.name}</span>
          </button>
          <span className="item-row__type">
            {itemKind(item)}
            <span className="item-row__inline-wears">, {wearCountLabel(item.wearCount).toLowerCase()}</span>
          </span>
        </div>
      </div>
      <span className="item-row__colors">
        <ColorDots colors={item.colors} size="sm" max={4} />
      </span>
      <span className={cx('item-row__status', status === 'clean' && 'item-row__status--clean')}>
        <StatusBadge status={status} urgent={urgent} size="sm" />
      </span>
      <span className="item-row__wears">
        <span className="u-visually-hidden">Wears: </span>
        {item.wearCount ?? 0}
      </span>
      <span className="item-row__last">
        <span className="u-visually-hidden">Last worn: </span>
        {lastWorn}
      </span>
      {selectMode ? null : (
        <span className="item-row__menu">
          <ItemActionsMenu item={item} actions={actions} onOpen={onOpen} />
        </span>
      )}
    </div>
  );
}
