import CheckOutlined from '@mui/icons-material/CheckOutlined';
import cx from '@/components/common/cx';
import ColorDots from '@/components/common/ColorDots';
import ItemThumb from '@/components/common/ItemThumb';
import StatusBadge from '@/components/common/StatusBadge';
import FavoriteButton from './FavoriteButton';
import { itemKind, wearCountLabel } from './itemFormat';
import './ItemCard.scss';

/**
 * Wardrobe grid card: photo well, favourite toggle, laundry badge when not clean,
 * name, type with colours and wear count. The whole card opens the item drawer; in
 * selection mode it becomes a checkbox (Shift+click selects a range).
 */
export default function ItemCard({ item, urgent = false, selectMode = false, selected = false, onActivate, onToggleFavorite }) {
  const status = item.laundry?.status ?? 'clean';
  const kind = itemKind(item);

  const mainProps = selectMode
    ? { role: 'checkbox', 'aria-checked': selected }
    : { 'aria-haspopup': 'dialog' };

  return (
    <article
      className={cx('item-card', selectMode && 'item-card--selecting', selected && 'item-card--selected')}
      data-item-id={item.id}
    >
      <div className="item-card__media">
        <ItemThumb item={item} size="md" className="item-card__thumb" />
        {status !== 'clean' ? (
          <StatusBadge status={status} urgent={urgent} size="sm" className="item-card__status" />
        ) : null}
        {selectMode ? (
          <span className={cx('item-card__check', selected && 'item-card__check--on')} aria-hidden>
            {selected ? <CheckOutlined fontSize="inherit" /> : null}
          </span>
        ) : (
          <FavoriteButton
            item={item}
            variant="photo"
            className="item-card__favorite"
            onToggle={() => onToggleFavorite?.(item)}
          />
        )}
      </div>
      <div className="item-card__body">
        <button
          type="button"
          className="item-card__main"
          data-card-main
          onClick={(event) => onActivate?.(item, event)}
          onMouseDown={(event) => {
            // Shift+click selects a range; keep the browser from selecting text as well.
            if (event.shiftKey) event.preventDefault();
          }}
          {...mainProps}
        >
          <span className="item-card__name">{item.name}</span>
        </button>
        <div className="item-card__meta">
          <span className="item-card__type">{kind}</span>
          <ColorDots colors={item.colors} size="sm" className="item-card__colors" />
        </div>
        <p className="item-card__wears">{wearCountLabel(item.wearCount)}</p>
      </div>
    </article>
  );
}
