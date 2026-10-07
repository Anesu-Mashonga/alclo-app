import Radio from '@mui/material/Radio';
import { useId } from 'react';
import cx from '@/components/common/cx';
import './WardrobeChoiceCard.scss';

/**
 * Large radio card (use inside a MUI RadioGroup). The whole card is the label, the radio keeps
 * native arrow-key behaviour, and the card shows the focus ring when the radio has focus.
 *
 * Props: value, checked (for styling), title, description, media (decorative preview), className.
 */
export default function WardrobeChoiceCard({ value, checked, title, description, media, className }) {
  const titleId = useId();
  const descriptionId = useId();

  return (
    <label className={cx('choice-card', checked && 'choice-card--checked', className)}>
      <span className="choice-card__head">
        <span className="choice-card__text">
          <span id={titleId} className="choice-card__title">
            {title}
          </span>
          <span id={descriptionId} className="choice-card__description">
            {description}
          </span>
        </span>
        <Radio
          value={value}
          className="choice-card__radio"
          slotProps={{ input: { 'aria-labelledby': titleId, 'aria-describedby': descriptionId } }}
        />
      </span>
      {media ? (
        <span className="choice-card__media" aria-hidden="true">
          {media}
        </span>
      ) : null}
    </label>
  );
}
