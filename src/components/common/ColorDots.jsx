import Tooltip from '@mui/material/Tooltip';
import { COLOR_BY_ID } from '@/data/taxonomy';
import cx from './cx';
import './ColorDots.scss';

// "Multicolour" is drawn as three flat bands (no gradients).
const MULTI_BANDS = ['red', 'yellow', 'blue'].map((id) => COLOR_BY_ID[id]?.hex ?? '#A1A1AA');

/**
 * Colour swatches for an item. The full list is available as an accessible name and a tooltip.
 *
 * @param {{ colors: string[], max?: number, size?: 'sm' | 'md', className?: string }} props
 */
export default function ColorDots({ colors = [], max = 3, size = 'md', className }) {
  const entries = colors.map((id) => COLOR_BY_ID[id] ?? { id, label: id, hex: '#A1A1AA' });
  if (entries.length === 0) return null;

  const visible = entries.slice(0, max);
  const hidden = entries.length - visible.length;
  const names = entries.map((entry) => entry.label).join(', ');

  return (
    <Tooltip title={names} describeChild>
      <span className={cx('color-dots', `color-dots--${size}`, className)} role="img" aria-label={`Colours: ${names}`}>
        {visible.map((entry) =>
          entry.id === 'multi' ? (
            <span key={entry.id} className="color-dots__dot color-dots__dot--multi">
              {MULTI_BANDS.map((hex) => (
                <span key={hex} style={{ backgroundColor: hex }} />
              ))}
            </span>
          ) : (
            <span key={entry.id} className="color-dots__dot" style={{ backgroundColor: entry.hex }} />
          ),
        )}
        {hidden > 0 ? <span className="color-dots__more">+{hidden}</span> : null}
      </span>
    </Tooltip>
  );
}
