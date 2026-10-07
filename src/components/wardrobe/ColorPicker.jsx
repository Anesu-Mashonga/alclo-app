import CheckOutlined from '@mui/icons-material/CheckOutlined';
import CloseOutlined from '@mui/icons-material/CloseOutlined';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import { useRef, useState } from 'react';
import cx from '@/components/common/cx';
import { COLOR_BY_ID, COLORS } from '@/data/taxonomy';
import ColorSwatch from './ColorSwatch';
import { isLightColor } from './itemFormat';
import './ColorPicker.scss';

/** Number of swatches per visual row, read from the rendered grid. */
function columnsOf(buttons) {
  if (buttons.length === 0) return 1;
  const top = buttons[0].offsetTop;
  const count = buttons.findIndex((button) => button.offsetTop !== top);
  return count === -1 ? buttons.length : count;
}

/**
 * Named colour swatch grid (multi-select, keyboard accessible with one tab stop and arrow keys).
 * With `ordered`, the first pick is the main colour and the picks are listed underneath, where
 * any of them can be made the main colour or removed.
 *
 * @param {{ id?: string, value: string[], onChange: (ids: string[]) => void, max?: number, ordered?: boolean,
 *   labelledBy?: string, label?: string, describedBy?: string, invalid?: boolean, size?: 'md' | 'sm', className?: string }} props
 */
export default function ColorPicker({
  id,
  value = [],
  onChange,
  max = Infinity,
  ordered = false,
  labelledBy,
  label = 'Colours',
  describedBy,
  invalid = false,
  size = 'md',
  className,
}) {
  const gridRef = useRef(null);
  const [activeId, setActiveId] = useState(null);
  const full = value.length >= max;
  const tabStop = activeId ?? value[0] ?? COLORS[0].id;

  const toggle = (colorId) => {
    if (value.includes(colorId)) onChange(value.filter((v) => v !== colorId));
    else if (!full) onChange([...value, colorId]);
  };

  const makeMain = (colorId) => onChange([colorId, ...value.filter((v) => v !== colorId)]);

  const handleKeyDown = (event, index) => {
    const buttons = [...(gridRef.current?.querySelectorAll('[data-swatch]') ?? [])];
    const columns = columnsOf(buttons);
    const moves = {
      ArrowRight: 1,
      ArrowLeft: -1,
      ArrowDown: columns,
      ArrowUp: -columns,
    };
    let next = null;
    if (event.key in moves) next = index + moves[event.key];
    else if (event.key === 'Home') next = 0;
    else if (event.key === 'End') next = buttons.length - 1;
    if (next === null) return;
    event.preventDefault();
    next = Math.min(buttons.length - 1, Math.max(0, next));
    setActiveId(COLORS[next].id);
    buttons[next]?.focus();
  };

  return (
    <div className={cx('color-picker', `color-picker--${size}`, className)}>
      <div
        id={id}
        ref={gridRef}
        role="group"
        aria-labelledby={labelledBy}
        aria-label={labelledBy ? undefined : label}
        aria-describedby={describedBy}
        aria-invalid={invalid || undefined}
        className={cx('color-picker__grid', invalid && 'color-picker__grid--invalid')}
      >
        {COLORS.map((color, index) => {
          const selected = value.includes(color.id);
          const position = value.indexOf(color.id);
          const blocked = !selected && full;
          const name = ordered && position === 0 ? `${color.label}, main colour` : color.label;
          return (
            <Tooltip key={color.id} title={color.label} enterDelay={250} disableInteractive>
              <button
                type="button"
                data-swatch
                className={cx(
                  'color-picker__swatch',
                  selected && 'color-picker__swatch--selected',
                  blocked && 'color-picker__swatch--blocked',
                  isLightColor(color.hex) ? 'color-picker__swatch--light' : 'color-picker__swatch--dark',
                )}
                aria-label={name}
                aria-pressed={selected}
                aria-disabled={blocked || undefined}
                tabIndex={color.id === tabStop ? 0 : -1}
                onFocus={() => setActiveId(color.id)}
                onClick={() => toggle(color.id)}
                onKeyDown={(event) => handleKeyDown(event, index)}
              >
                <ColorSwatch color={color.id} size={size === 'sm' ? 28 : 32} className="color-picker__fill" />
                {selected ? (
                  <span className="color-picker__mark" aria-hidden>
                    {ordered && value.length > 1 ? position + 1 : <CheckOutlined fontSize="inherit" />}
                  </span>
                ) : null}
              </button>
            </Tooltip>
          );
        })}
      </div>
      {ordered && value.length > 0 ? (
        <ul className="color-picker__picked" aria-label="Chosen colours">
          {value.map((colorId, index) => {
            const colorName = COLOR_BY_ID[colorId]?.label ?? colorId;
            return (
              <li key={colorId} className={cx('color-picker__chip', index === 0 && 'color-picker__chip--main')}>
                <ColorSwatch color={colorId} size={14} />
                {index === 0 ? (
                  <span className="color-picker__chip-label">
                    {colorName} <span className="color-picker__chip-note">Main colour</span>
                  </span>
                ) : (
                  <Tooltip title="Make this the main colour">
                    <button
                      type="button"
                      className="color-picker__chip-label color-picker__chip-label--button"
                      aria-label={`Make ${colorName} the main colour`}
                      onClick={() => makeMain(colorId)}
                    >
                      {colorName}
                    </button>
                  </Tooltip>
                )}
                <Tooltip title="Remove">
                  <IconButton
                    size="small"
                    className="color-picker__chip-remove"
                    aria-label={`Remove ${colorName}`}
                    onClick={() => onChange(value.filter((v) => v !== colorId))}
                  >
                    <CloseOutlined fontSize="inherit" />
                  </IconButton>
                </Tooltip>
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
}
