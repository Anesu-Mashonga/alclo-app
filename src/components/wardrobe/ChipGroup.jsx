import Chip from '@mui/material/Chip';
import { useRef } from 'react';
import cx from '@/components/common/cx';
import './ChipGroup.scss';

const NEXT_KEYS = ['ArrowRight', 'ArrowDown'];
const PREV_KEYS = ['ArrowLeft', 'ArrowUp'];

/**
 * Selectable chips.
 * - Single select (default): a radio group with one tab stop; arrow keys move and select.
 *   `allowDeselect` lets a second click clear the choice (optional filters).
 * - `multiple`: toggle buttons (aria-pressed), each its own tab stop.
 *
 * @param {{ id?: string, labelledBy?: string, label?: string, options: { id: string, label: string, icon?: React.ReactElement }[],
 *   value: string | string[] | null, onChange: (value: any) => void, multiple?: boolean, allowDeselect?: boolean,
 *   size?: 'small' | 'medium', invalid?: boolean, describedBy?: string, className?: string }} props
 */
export default function ChipGroup({
  id,
  labelledBy,
  label,
  options,
  value,
  onChange,
  multiple = false,
  allowDeselect = false,
  size = 'medium',
  invalid = false,
  describedBy,
  className,
}) {
  const refs = useRef([]);
  const selectedList = multiple ? (value ?? []) : value ? [value] : [];
  const isSelected = (optionId) => selectedList.includes(optionId);
  const focusIndex = multiple ? -1 : Math.max(0, options.findIndex((option) => option.id === value));

  const toggle = (optionId) => {
    if (multiple) {
      onChange(isSelected(optionId) ? selectedList.filter((v) => v !== optionId) : [...selectedList, optionId]);
    } else if (value === optionId) {
      if (allowDeselect) onChange(null);
    } else {
      onChange(optionId);
    }
  };

  const handleKeyDown = (event, index) => {
    if (multiple) return;
    let next = null;
    if (NEXT_KEYS.includes(event.key)) next = (index + 1) % options.length;
    else if (PREV_KEYS.includes(event.key)) next = (index - 1 + options.length) % options.length;
    else if (event.key === 'Home') next = 0;
    else if (event.key === 'End') next = options.length - 1;
    if (next === null) return;
    event.preventDefault();
    refs.current[next]?.focus();
    onChange(options[next].id);
  };

  return (
    <div
      id={id}
      role={multiple ? 'group' : 'radiogroup'}
      aria-labelledby={labelledBy}
      aria-label={labelledBy ? undefined : label}
      aria-describedby={describedBy}
      aria-invalid={invalid || undefined}
      className={cx('chip-group', invalid && 'chip-group--invalid', className)}
    >
      {options.map((option, index) => {
        const selected = isSelected(option.id);
        const a11y = multiple
          ? { 'aria-pressed': selected }
          : { role: 'radio', 'aria-checked': selected, tabIndex: index === focusIndex ? 0 : -1 };
        return (
          <Chip
            key={option.id}
            ref={(node) => {
              refs.current[index] = node;
            }}
            label={option.label}
            icon={option.icon}
            size={size}
            variant={selected ? 'filled' : 'outlined'}
            color={selected ? 'primary' : 'default'}
            className="chip-group__chip"
            onClick={() => toggle(option.id)}
            onKeyDown={(event) => handleKeyDown(event, index)}
            {...a11y}
          />
        );
      })}
    </div>
  );
}
