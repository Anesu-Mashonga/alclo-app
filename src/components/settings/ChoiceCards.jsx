import Radio from '@mui/material/Radio';
import { createElement, useId } from 'react';
import cx from '@/components/common/cx';
import './ChoiceCards.scss';

/**
 * Radio group rendered as side-by-side cards with a title, description and icon.
 * Uses native radios (via MUI Radio), so arrow keys and screen readers work as expected.
 *
 * Props: value, onChange(value), options [{ value, title, description, icon, disabled }],
 * labelledBy, describedBy, className
 */
export default function ChoiceCards({ value, onChange, options, labelledBy, describedBy, className }) {
  const name = useId();

  return (
    <div
      role="radiogroup"
      aria-labelledby={labelledBy}
      aria-describedby={describedBy}
      className={cx('choice-cards', className)}
    >
      {options.map((option) => {
        const checked = option.value === value;
        const descriptionId = `${name}-${option.value}-description`;
        return (
          <label
            key={option.value}
            className={cx(
              'choice-cards__card',
              checked && 'choice-cards__card--checked',
              option.disabled && 'choice-cards__card--disabled',
            )}
          >
            <span className="choice-cards__head">
              {option.icon ? (
                <span className="choice-cards__icon" aria-hidden>
                  {createElement(option.icon, { fontSize: 'inherit' })}
                </span>
              ) : null}
              <span className="choice-cards__title">{option.title}</span>
              <Radio
                className="choice-cards__radio"
                name={name}
                value={option.value}
                checked={checked}
                disabled={option.disabled}
                onChange={() => onChange(option.value)}
                slotProps={{ input: { 'aria-describedby': descriptionId } }}
              />
            </span>
            {option.description ? (
              <span id={descriptionId} className="choice-cards__description">
                {option.description}
              </span>
            ) : null}
          </label>
        );
      })}
    </div>
  );
}
