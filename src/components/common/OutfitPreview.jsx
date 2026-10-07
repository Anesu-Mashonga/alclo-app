import CheckroomOutlined from '@mui/icons-material/CheckroomOutlined';
import { SLOTS } from '@/data/taxonomy';
import cx from './cx';
import ItemThumb from './ItemThumb';
import './OutfitPreview.scss';

function groupBySlot(items) {
  const groups = Object.fromEntries(SLOTS.map((slot) => [slot, []]));
  items.filter(Boolean).forEach((item) => {
    (groups[item.category] ?? groups.accessory).push(item);
  });
  return groups;
}

function orderBySlot(items) {
  const groups = groupBySlot(items);
  return SLOTS.flatMap((slot) => groups[slot]);
}

function Tile({ item, className }) {
  return <ItemThumb item={item} ratio="1/1" className={cx('outfit-preview__tile', className)} />;
}

function Flatlay({ items }) {
  const groups = groupBySlot(items);
  const upper = [groups.outerwear[0], groups.top[0]].filter(Boolean);
  const bottom = groups.bottom[0];
  const footwear = groups.footwear[0];
  const accessories = groups.accessory.slice(0, 3);

  return (
    <>
      <div className="outfit-preview__main">
        {upper.length > 0 ? (
          <div className={cx('outfit-preview__row', upper.length === 1 && 'outfit-preview__row--single')}>
            {upper.map((item) => (
              <Tile key={item.id} item={item} />
            ))}
          </div>
        ) : null}
        {bottom ? (
          <div className="outfit-preview__row outfit-preview__row--single">
            <Tile item={bottom} className="outfit-preview__tile--bottom" />
          </div>
        ) : null}
        {footwear ? (
          <div className="outfit-preview__row outfit-preview__row--single">
            <Tile item={footwear} className="outfit-preview__tile--feet" />
          </div>
        ) : null}
      </div>
      {accessories.length > 0 ? (
        <div className="outfit-preview__side">
          {accessories.map((item) => (
            <Tile key={item.id} item={item} />
          ))}
        </div>
      ) : null}
    </>
  );
}

function GridLayout({ items }) {
  const ordered = orderBySlot(items);
  const visible = ordered.slice(0, 4);
  const hidden = ordered.length - visible.length;

  return visible.map((item, index) => {
    const isLast = index === visible.length - 1;
    return (
      <div key={item.id} className="outfit-preview__cell">
        <Tile item={item} />
        {isLast && hidden > 0 ? (
          <span className="outfit-preview__more" aria-label={`${hidden} more`}>
            +{hidden}
          </span>
        ) : null}
      </div>
    );
  });
}

function Strip({ items, max }) {
  const ordered = orderBySlot(items);
  const visible = ordered.slice(0, max);
  const hidden = ordered.length - visible.length;

  return (
    <>
      {visible.map((item) => (
        <Tile key={item.id} item={item} />
      ))}
      {hidden > 0 ? (
        <span className="outfit-preview__more outfit-preview__more--inline" aria-label={`${hidden} more`}>
          +{hidden}
        </span>
      ) : null}
    </>
  );
}

/**
 * Compact composition of an outfit's items (Item objects, any order).
 *
 * Props:
 * - items: Item[]
 * - layout: 'grid' (default, 2 by 2 with "+N"), 'flatlay' (outerwear and top row, bottom,
 *   footwear, accessories column) or 'strip' (one row of small tiles)
 * - size: 'sm' | 'md' (default) | 'lg' (gaps, radius and strip tile size)
 * - max: strip only, tiles before "+N" (default 5)
 * - label: accessible name for the group (default lists the item names)
 * - className
 */
export default function OutfitPreview({ items = [], layout = 'grid', size = 'md', max = 5, label, className }) {
  const present = items.filter(Boolean);
  const names = present.map((item) => item.name).join(', ');
  const classes = cx('outfit-preview', `outfit-preview--${layout}`, `outfit-preview--${size}`, className);

  if (present.length === 0) {
    return (
      <div className={cx(classes, 'outfit-preview--empty')} role="img" aria-label={label ?? 'No items yet'}>
        <CheckroomOutlined aria-hidden />
      </div>
    );
  }

  return (
    <div className={classes} role="group" aria-label={label ?? `Outfit: ${names}`}>
      {layout === 'flatlay' ? <Flatlay items={present} /> : null}
      {layout === 'strip' ? <Strip items={present} max={max} /> : null}
      {layout !== 'flatlay' && layout !== 'strip' ? <GridLayout items={present} /> : null}
    </div>
  );
}
