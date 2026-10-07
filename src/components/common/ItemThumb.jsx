import CheckroomOutlined from '@mui/icons-material/CheckroomOutlined';
import { useState } from 'react';
import { COLOR_BY_ID } from '@/data/taxonomy';
import cx from './cx';
import StatusBadge from './StatusBadge';
import './ItemThumb.scss';

/**
 * Garment photo inside a light "photo well". Reserves its space with aspect-ratio so lists
 * never shift while images load. Falls back to a swatch of the item's first colour.
 *
 * @param {{
 *   item: { name: string, image?: string | null, colors?: string[], laundry?: { status: string } },
 *   size?: 'xs' | 'sm' | 'md' | 'lg',
 *   ratio?: '4/5' | '1/1',
 *   showStatus?: boolean,
 *   className?: string,
 * }} props
 *   xs = 40px, sm = 64px (fixed width); md and lg fill their container.
 *   showStatus shows a badge for items that are not clean.
 */
export default function ItemThumb({ item, size = 'md', ratio = '4/5', showStatus = false, className, ...rest }) {
  const [failedSrc, setFailedSrc] = useState(null);
  const src = item?.image || null;
  const showImage = Boolean(src) && failedSrc !== src;
  const name = item?.name ?? 'Item';
  const swatch = COLOR_BY_ID[item?.colors?.[0]]?.hex;
  const status = item?.laundry?.status;

  return (
    <div
      className={cx(
        'item-thumb',
        `item-thumb--${size}`,
        ratio === '1/1' ? 'item-thumb--square' : 'item-thumb--portrait',
        className,
      )}
      {...rest}
    >
      {showImage ? (
        <img
          className="item-thumb__img"
          src={src}
          alt={name}
          loading="lazy"
          decoding="async"
          draggable={false}
          onError={() => setFailedSrc(src)}
        />
      ) : (
        <div className="item-thumb__fallback" role="img" aria-label={name}>
          <span className="item-thumb__swatch" style={swatch ? { '--item-thumb-swatch': swatch } : undefined}>
            <CheckroomOutlined className="item-thumb__icon" aria-hidden />
          </span>
        </div>
      )}
      {showStatus && status && status !== 'clean' ? (
        <StatusBadge status={status} size="sm" className="item-thumb__status" />
      ) : null}
    </div>
  );
}
