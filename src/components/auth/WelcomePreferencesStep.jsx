import AddOutlined from '@mui/icons-material/AddOutlined';
import CheckOutlined from '@mui/icons-material/CheckOutlined';
import ErrorOutlineOutlined from '@mui/icons-material/ErrorOutlineOutlined';
import Autocomplete from '@mui/material/Autocomplete';
import Chip from '@mui/material/Chip';
import Link from '@mui/material/Link';
import TextField from '@mui/material/TextField';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import { useId } from 'react';
import cx from '@/components/common/cx';
import OccasionToggle from '@/components/common/OccasionToggle';
import { OCCASIONS } from '@/data/taxonomy';
import { useCities } from '@/hooks/api';
import './WelcomePreferencesStep.scss';

const UNITS = [
  { value: 'C', label: '°C', name: 'Celsius' },
  { value: 'F', label: '°F', name: 'Fahrenheit' },
];

/**
 * Keeps the default occasion inside the chosen set.
 * @param {string[]} occasions
 * @param {string | null} current
 */
function coerceDefaultOccasion(occasions, current) {
  if (occasions.includes(current)) return current;
  return OCCASIONS.find((option) => occasions.includes(option.id))?.id ?? null;
}

/**
 * Step 1 of onboarding: occasions (multi), default occasion (single, limited to the chosen ones),
 * home city and temperature unit.
 *
 * Props: values { occasions, defaultOccasion, city, tempUnit }, onChange(patch), showErrors.
 */
export default function WelcomePreferencesStep({ values, onChange, showErrors }) {
  const ids = {
    occasions: useId(),
    occasionsHint: useId(),
    occasionsError: useId(),
    defaultHint: useId(),
    unit: useId(),
  };
  const cities = useCities();

  const occasionsError = showErrors && values.occasions.length === 0 ? 'Pick at least one occasion.' : null;
  const chosenOptions = OCCASIONS.filter((option) => values.occasions.includes(option.id));

  const toggleOccasion = (id) => {
    const next = values.occasions.includes(id)
      ? values.occasions.filter((value) => value !== id)
      : OCCASIONS.map((option) => option.id).filter((value) => value === id || values.occasions.includes(value));
    onChange({ occasions: next, defaultOccasion: coerceDefaultOccasion(next, values.defaultOccasion) });
  };

  // Until the city list arrives, offer the saved city alone so the field never looks empty.
  const cityOptions = cities.data?.length ? cities.data : [{ id: 'saved', name: values.city, country: '' }];
  const cityValue = cityOptions.find((option) => option.name === values.city) ?? cityOptions[0];

  return (
    <div className="welcome-prefs">
      <fieldset className="welcome-prefs__field" aria-describedby={cx(ids.occasionsHint, occasionsError && ids.occasionsError)}>
        <legend className="welcome-prefs__label" id={ids.occasions}>
          What do you dress for?
        </legend>
        <p className="welcome-prefs__hint" id={ids.occasionsHint}>
          Pick all that apply. You can change this later in Settings.
        </p>
        <div className="welcome-prefs__chips">
          {OCCASIONS.map((option) => {
            const selected = values.occasions.includes(option.id);
            return (
              <Chip
                key={option.id}
                label={option.label}
                icon={selected ? <CheckOutlined /> : <AddOutlined />}
                variant={selected ? 'filled' : 'outlined'}
                color={selected ? 'primary' : 'default'}
                onClick={() => toggleOccasion(option.id)}
                aria-pressed={selected}
                data-occasion={option.id}
                className={cx('welcome-prefs__chip', selected && 'welcome-prefs__chip--selected')}
              />
            );
          })}
        </div>
        {occasionsError ? (
          <p className="welcome-prefs__error" id={ids.occasionsError} role="alert">
            <ErrorOutlineOutlined aria-hidden />
            {occasionsError}
          </p>
        ) : null}
      </fieldset>

      <div className="welcome-prefs__field">
        <span className="welcome-prefs__label">
          Default occasion
        </span>
        <p className="welcome-prefs__hint" id={ids.defaultHint}>
          Today opens with outfit ideas for this.
        </p>
        {chosenOptions.length > 0 ? (
          <OccasionToggle
            value={values.defaultOccasion}
            onChange={(id) => onChange({ defaultOccasion: id })}
            options={chosenOptions}
            label="Default occasion"
            className="welcome-prefs__default"
          />
        ) : (
          <p className="welcome-prefs__placeholder">Pick an occasion above first.</p>
        )}
      </div>

      <div className="welcome-prefs__row">
        <Autocomplete
          className="welcome-prefs__city"
          options={cityOptions}
          value={cityValue}
          onChange={(_event, option) => option && onChange({ city: option.name })}
          getOptionLabel={(option) => option.name}
          isOptionEqualToValue={(option, value) => option.name === value.name}
          loading={cities.isPending}
          disableClearable
          autoHighlight
          openOnFocus
          renderOption={({ key, ...props }, option) => (
            <li key={key} {...props}>
              <span className="welcome-prefs__city-option">
                <span>{option.name}</span>
                {option.country ? <span className="welcome-prefs__country">{option.country}</span> : null}
              </span>
            </li>
          )}
          renderInput={(params) => (
            <TextField
              {...params}
              name="city"
              label="Home city"
              helperText={
                cities.isError ? (
                  <>
                    Could not load the city list.{' '}
                    <Link component="button" type="button" onClick={() => cities.refetch()}>
                      Try again
                    </Link>
                  </>
                ) : (
                  'Outfit ideas follow the weather here.'
                )
              }
            />
          )}
        />

        <div className="welcome-prefs__field welcome-prefs__unit">
          <span className="welcome-prefs__label" id={ids.unit}>
            Temperature
          </span>
          <ToggleButtonGroup
            exclusive
            value={values.tempUnit}
            onChange={(_event, next) => next && onChange({ tempUnit: next })}
            aria-labelledby={ids.unit}
            className="welcome-prefs__units"
          >
            {UNITS.map((unit) => (
              <ToggleButton key={unit.value} value={unit.value} aria-label={unit.name}>
                {unit.label}
              </ToggleButton>
            ))}
          </ToggleButtonGroup>
        </div>
      </div>
    </div>
  );
}
