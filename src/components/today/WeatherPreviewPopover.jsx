import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import Popover from '@mui/material/Popover';
import Slider from '@mui/material/Slider';
import { useId, useState } from 'react';
import WeatherIcon from '@/components/common/WeatherIcon';
import { CONDITIONS } from '@/data/taxonomy';
import { formatTemp } from '@/lib/format';
import { PREVIEW_MAX_C, PREVIEW_MIN_C } from './todayUtils';
import './WeatherPreviewPopover.scss';

function PreviewForm({ initial, unit, onApply, onCancel }) {
  const titleId = useId();
  const sliderLabelId = useId();
  const conditionLabelId = useId();
  const [tempC, setTempC] = useState(initial.tempC);
  const [condition, setCondition] = useState(initial.condition);

  const handleConditionKey = (event, index) => {
    const keys = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 };
    if (!(event.key in keys)) return;
    event.preventDefault();
    const next = CONDITIONS[(index + keys[event.key] + CONDITIONS.length) % CONDITIONS.length];
    setCondition(next.id);
    event.currentTarget.parentElement?.querySelector(`[data-condition="${next.id}"]`)?.focus();
  };

  return (
    <form
      className="weather-preview"
      aria-labelledby={titleId}
      onSubmit={(event) => {
        event.preventDefault();
        onApply({ tempC, condition });
      }}
    >
      <div className="weather-preview__header">
        <h2 id={titleId} className="weather-preview__title">
          Try other weather
        </h2>
        <p className="weather-preview__subtitle">See what you would wear. Your real forecast stays as it is.</p>
      </div>

      <div className="weather-preview__field">
        <div className="weather-preview__label-row">
          <span id={sliderLabelId} className="weather-preview__label">
            Temperature
          </span>
          <span className="weather-preview__value" aria-hidden>
            {formatTemp(tempC, unit)}
          </span>
        </div>
        <Slider
          value={tempC}
          min={PREVIEW_MIN_C}
          max={PREVIEW_MAX_C}
          step={1}
          onChange={(_event, value) => setTempC(value)}
          getAriaValueText={(value) => formatTemp(value, unit)}
          slotProps={{ input: { 'aria-labelledby': sliderLabelId } }}
          className="weather-preview__slider"
        />
        <div className="weather-preview__range" aria-hidden>
          <span>{formatTemp(PREVIEW_MIN_C, unit)}</span>
          <span>{formatTemp(PREVIEW_MAX_C, unit)}</span>
        </div>
      </div>

      <div className="weather-preview__field">
        <span id={conditionLabelId} className="weather-preview__label">
          Conditions
        </span>
        <div role="radiogroup" aria-labelledby={conditionLabelId} className="weather-preview__conditions">
          {CONDITIONS.map((option, index) => {
            const selected = option.id === condition;
            return (
              <Chip
                key={option.id}
                role="radio"
                aria-checked={selected}
                tabIndex={selected ? 0 : -1}
                data-condition={option.id}
                icon={<WeatherIcon condition={option.id} />}
                label={option.label}
                variant={selected ? 'filled' : 'outlined'}
                onClick={() => setCondition(option.id)}
                onKeyDown={(event) => handleConditionKey(event, index)}
              />
            );
          })}
        </div>
      </div>

      <div className="weather-preview__actions">
        <Button variant="outlined" color="inherit" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" variant="contained">
          Preview outfit
        </Button>
      </div>
    </form>
  );
}

/**
 * "Try other weather": temperature slider and condition chips. Applying puts the outfit card
 * into a preview for that weather (kept in the URL). Give it a new key per opening to reset the form.
 */
export default function WeatherPreviewPopover({ open, anchorEl, initial, unit, onApply, onClose }) {
  return (
    <Popover
      open={open}
      anchorEl={anchorEl}
      onClose={onClose}
      anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
      transformOrigin={{ vertical: 'top', horizontal: 'left' }}
      slotProps={{ paper: { className: 'weather-preview__paper', role: 'dialog', 'aria-label': 'Try other weather' } }}
    >
      <PreviewForm initial={initial} unit={unit} onApply={onApply} onCancel={onClose} />
    </Popover>
  );
}
