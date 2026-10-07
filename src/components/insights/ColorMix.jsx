import Tooltip from '@mui/material/Tooltip';
import { useMemo } from 'react';
import cx from '@/components/common/cx';
import { COLOR_BY_ID } from '@/data/taxonomy';
import { formatCount, formatPercent } from '@/lib/format';
import './ColorMix.scss';

/** Colours beyond this many fold into "Other" so the bar never needs a ninth hue. */
const MAX_COLORS = 7;
const OTHER_HEX = '#A1A1AA';

/**
 * Colour mix: a proportional swatch bar of the main colour of every piece worn
 * (weighted by wears), using the garments' own colours, plus a ranked list with names
 * and counts so identity never depends on telling two swatches apart.
 */
export default function ColorMix({ colorMix, busy }) {
  const entries = useMemo(() => {
    const total = colorMix.reduce((sum, row) => sum + row.count, 0);
    const head = colorMix.slice(0, MAX_COLORS).map((row) => ({
      id: row.color,
      label: COLOR_BY_ID[row.color]?.label ?? row.color,
      hex: COLOR_BY_ID[row.color]?.hex ?? OTHER_HEX,
      count: row.count,
      share: total ? row.count / total : 0,
    }));
    const tail = colorMix.slice(MAX_COLORS);
    if (tail.length) {
      const count = tail.reduce((sum, row) => sum + row.count, 0);
      head.push({
        id: 'other',
        label: `Other (${tail.length})`,
        hex: OTHER_HEX,
        count,
        share: total ? count / total : 0,
        other: true,
      });
    }
    return head;
  }, [colorMix]);

  return (
    <div className={cx('color-mix', busy && 'color-mix--busy')}>
      <div className="color-mix__bar" aria-hidden="true">
        {entries.map((entry) => (
          <Tooltip
            key={entry.id}
            title={`${entry.label}: ${formatCount(entry.count, 'wear')}, ${formatPercent(entry.share)}`}
            placement="top"
            enterDelay={80}
            describeChild
          >
            <span
              className={cx('color-mix__segment', entry.other && 'color-mix__segment--other')}
              style={{ '--swatch': entry.hex, flexGrow: entry.count }}
            />
          </Tooltip>
        ))}
      </div>
      <ol className="color-mix__list" aria-label="Colours worn, most worn first">
        {entries.map((entry) => (
          <li key={entry.id} className="color-mix__item">
            <span
              className={cx('color-mix__dot', entry.other && 'color-mix__dot--other')}
              style={{ '--swatch': entry.hex }}
              aria-hidden="true"
            />
            <span className="color-mix__name">{entry.label}</span>
            <span className="color-mix__count">{formatCount(entry.count, 'wear')}</span>
            <span className="color-mix__share">{formatPercent(entry.share)}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}
