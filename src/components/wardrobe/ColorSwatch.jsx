import { COLOR_BY_ID } from '@/data/taxonomy';
import cx from '@/components/common/cx';
import './ColorSwatch.scss';

// "Multicolour" is three flat colour bands side by side.
const MULTI_BANDS = ['red', 'yellow', 'blue'].map((id) => COLOR_BY_ID[id]?.hex ?? '#A1A1AA');

/**
 * Decorative round swatch for a taxonomy colour id. The caller provides the colour name as text.
 * @param {{ color: string, size?: number, className?: string }} props
 */
export default function ColorSwatch({ color, size = 14, className }) {
  const entry = COLOR_BY_ID[color];
  const style = { '--color-swatch-size': `${size}px` };
  if (color === 'multi') {
    return (
      <span className={cx('color-swatch', 'color-swatch--multi', className)} style={style} aria-hidden>
        {MULTI_BANDS.map((hex) => (
          <span key={hex} style={{ backgroundColor: hex }} />
        ))}
      </span>
    );
  }
  return (
    <span
      className={cx('color-swatch', className)}
      style={{ ...style, backgroundColor: entry?.hex ?? '#A1A1AA' }}
      aria-hidden
    />
  );
}
