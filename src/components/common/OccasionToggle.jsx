import { LayoutGroup, motion } from 'motion/react';
import { useId, useRef } from 'react';
import { OCCASIONS } from '@/data/taxonomy';
import cx from './cx';
import './OccasionToggle.scss';

const NEXT_KEYS = new Set(['ArrowRight', 'ArrowDown']);
const PREV_KEYS = new Set(['ArrowLeft', 'ArrowUp']);

/**
 * Single-select segmented pills with radio semantics.
 * Keyboard: Tab focuses the selected option; arrows, Home and End move and select.
 *
 * Props:
 * - value: selected option id (or null)
 * - onChange(id): called with the newly selected id
 * - options: [{ id, label }] (default OCCASIONS)
 * - size: 'md' | 'sm'
 * - label: accessible name of the group (default "Occasion")
 * - fullWidth: stretch options to fill the row
 * - className
 */
export default function OccasionToggle({
  value,
  onChange,
  options = OCCASIONS,
  size = 'md',
  label = 'Occasion',
  fullWidth = false,
  className,
}) {
  const groupId = useId();
  const optionRefs = useRef([]);
  const selectedIndex = options.findIndex((option) => option.id === value);
  const tabStop = selectedIndex >= 0 ? selectedIndex : 0;

  const select = (index) => {
    const option = options[index];
    if (!option) return;
    if (option.id !== value) onChange?.(option.id);
    optionRefs.current[index]?.focus();
  };

  const handleKeyDown = (event, index) => {
    const last = options.length - 1;
    let next = null;
    if (NEXT_KEYS.has(event.key)) next = index === last ? 0 : index + 1;
    else if (PREV_KEYS.has(event.key)) next = index === 0 ? last : index - 1;
    else if (event.key === 'Home') next = 0;
    else if (event.key === 'End') next = last;
    if (next === null) return;
    event.preventDefault();
    select(next);
  };

  return (
    <LayoutGroup id={groupId}>
      <div
        role="radiogroup"
        aria-label={label}
        className={cx('occasion-toggle', `occasion-toggle--${size}`, fullWidth && 'occasion-toggle--full', className)}
      >
        {options.map((option, index) => {
          const selected = option.id === value;
          return (
            <button
              key={option.id}
              ref={(node) => {
                optionRefs.current[index] = node;
              }}
              type="button"
              role="radio"
              aria-checked={selected}
              tabIndex={index === tabStop ? 0 : -1}
              className={cx('occasion-toggle__option', selected && 'occasion-toggle__option--selected')}
              onClick={() => select(index)}
              onKeyDown={(event) => handleKeyDown(event, index)}
            >
              {selected ? (
                <motion.span
                  layoutId="occasion-thumb"
                  className="occasion-toggle__thumb"
                  transition={{ type: 'spring', bounce: 0.12, duration: 0.28 }}
                  aria-hidden
                />
              ) : null}
              <span className="occasion-toggle__label">{option.label}</span>
            </button>
          );
        })}
      </div>
    </LayoutGroup>
  );
}
