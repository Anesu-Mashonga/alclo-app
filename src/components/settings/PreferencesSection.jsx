import CloudOutlined from '@mui/icons-material/CloudOutlined';
import SensorsOutlined from '@mui/icons-material/SensorsOutlined';
import Autocomplete from '@mui/material/Autocomplete';
import Skeleton from '@mui/material/Skeleton';
import Slider from '@mui/material/Slider';
import TextField from '@mui/material/TextField';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import { useRef, useState } from 'react';
import OccasionToggle from '@/components/common/OccasionToggle';
import SectionCard from '@/components/common/SectionCard';
import WeatherIcon from '@/components/common/WeatherIcon';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { isLiveWeatherAvailable, useCities, useUpdatePreferences, useWeather } from '@/hooks/api';
import { conditionLabel } from '@/data/taxonomy';
import { formatTemp, lowerFirst } from '@/lib/format';
import AppearancePicker from './AppearancePicker';
import ChoiceCards from './ChoiceCards';
import SaveStatus from './SaveStatus';
import SettingRow from './SettingRow';
import SettingsPanel from './SettingsPanel';
import useAutosaveStatus from './useAutosaveStatus';
import './PreferencesSection.scss';

const URGENT_MARKS = [
  { value: 1, label: '1 day' },
  { value: 7, label: '1 week' },
  { value: 14, label: '2 weeks' },
];

const daysLabel = (days) => `${days} ${days === 1 ? 'day' : 'days'}`;

function WeatherPreview({ unit }) {
  const weather = useWeather();

  if (weather.isPending) {
    return (
      <div className="preferences-section__weather" aria-busy="true">
        <Skeleton variant="circular" width={20} height={20} />
        <Skeleton variant="text" width={220} />
      </div>
    );
  }
  if (weather.isError || !weather.data) {
    return (
      <div className="preferences-section__weather preferences-section__weather--muted">
        <span>Weather is not available right now. Your outfits use a mild day until it is back.</span>
      </div>
    );
  }

  const data = weather.data;
  const sourceLabel = data.source === 'live' ? 'Live weather' : 'Simulated weather';
  return (
    <div className="preferences-section__weather">
      <WeatherIcon condition={data.condition} className="preferences-section__weather-icon" />
      <span className="preferences-section__weather-text">
        Now in {data.city}: <strong className="u-tabular">{formatTemp(data.tempC, unit)}</strong>,{' '}
        {lowerFirst(data.description || conditionLabel(data.condition))}
      </span>
      <span className="preferences-section__weather-source">{sourceLabel}</span>
      {data.fallbackReason ? (
        <span className="preferences-section__weather-note">Live weather did not respond, so this is simulated for now.</span>
      ) : null}
    </div>
  );
}

/**
 * Settings > Preferences. Every control saves on change with a quiet inline status.
 * Saves run one after another so a quick series of changes always ends on the last one.
 */
export default function PreferencesSection() {
  const { user } = useAuth();
  const toast = useToast();
  const updatePreferences = useUpdatePreferences();
  const autosave = useAutosaveStatus();
  const cities = useCities();
  const [pending, setPending] = useState({});
  const [urgentDraft, setUrgentDraft] = useState(null);
  const [lastPatch, setLastPatch] = useState(null);
  const queue = useRef(Promise.resolve());

  const prefs = { ...(user?.preferences ?? {}), ...pending };
  const liveAvailable = isLiveWeatherAvailable();

  const save = (patch) => {
    setPending((current) => ({ ...current, ...patch }));
    setLastPatch(patch);
    const run = queue.current.catch(() => {}).then(() => updatePreferences.mutateAsync(patch));
    queue.current = run;
    const clear = () =>
      setPending((current) => {
        const next = { ...current };
        for (const key of Object.keys(patch)) if (next[key] === patch[key]) delete next[key];
        return next;
      });
    autosave
      .track(run)
      .then(clear)
      .catch((error) => {
        clear();
        toast.error(error?.message || 'Could not save that change. Try again.');
      });
  };

  const cityOptions = cities.data ?? [];
  const cityValue = cityOptions.find((city) => city.name === prefs.city) ?? (prefs.city ? { id: prefs.city, name: prefs.city, country: '' } : null);
  const options = cityValue && !cityOptions.some((city) => city.name === cityValue.name) ? [cityValue, ...cityOptions] : cityOptions;

  const urgentValue = urgentDraft ?? prefs.urgentAfterDays ?? 3;

  return (
    <SettingsPanel
      title="Preferences"
      description="Choose how Alclo looks and what it plans around."
      aside={<SaveStatus status={autosave.status} onRetry={lastPatch ? () => save(lastPatch) : undefined} />}
    >
      <SectionCard title="Appearance" titleComponent="h3">
        <SettingRow label="Theme" description="Pick light or dark, or follow your device." stack>
          {({ labelId, descriptionId }) => <AppearancePicker labelledBy={labelId} describedBy={descriptionId} />}
        </SettingRow>
      </SectionCard>

      <SectionCard title="Weather" titleComponent="h3" subtitle="Outfits are planned around the weather in your home city.">
        <SettingRow label="Temperature unit" description="Used for the forecast and outfit reasons.">
          {({ labelId }) => (
            <ToggleButtonGroup
              exclusive
              value={prefs.tempUnit ?? 'C'}
              onChange={(_event, next) => next && next !== prefs.tempUnit && save({ tempUnit: next })}
              aria-labelledby={labelId}
              className="preferences-section__unit"
            >
              <ToggleButton value="C" aria-label="Celsius">
                °C
              </ToggleButton>
              <ToggleButton value="F" aria-label="Fahrenheit">
                °F
              </ToggleButton>
            </ToggleButtonGroup>
          )}
        </SettingRow>

        <SettingRow label="Home city" description="Where you get dressed most days.">
          {({ labelId }) => (
            <Autocomplete
              className="preferences-section__city"
              options={options}
              value={cityValue}
              loading={cities.isPending}
              loadingText="Loading cities"
              noOptionsText={cities.isError ? 'Could not load cities' : 'No cities match'}
              disableClearable
              autoHighlight
              getOptionLabel={(option) => option?.name ?? ''}
              isOptionEqualToValue={(option, selected) => option.name === selected.name}
              onChange={(_event, next) => next && next.name !== prefs.city && save({ city: next.name })}
              renderOption={(props, option) => {
                const { key, ...rest } = props;
                return (
                  <li key={key} {...rest}>
                    <span className="preferences-section__city-option">
                      <span>{option.name}</span>
                      {option.country ? <span className="preferences-section__city-country">{option.country}</span> : null}
                    </span>
                  </li>
                );
              }}
              renderInput={(params) => (
                <TextField
                  {...params}
                  placeholder="Search cities"
                  slotProps={{
                    ...params.slotProps,
                    htmlInput: { ...params.slotProps?.htmlInput, 'aria-labelledby': labelId },
                  }}
                />
              )}
            />
          )}
        </SettingRow>

        <SettingRow
          label="Weather source"
          description={
            liveAvailable
              ? 'Live weather comes from OpenWeather. Today asks for your location only when you choose Use my location.'
              : 'Live weather needs an OpenWeather API key (OPENWEATHER_API_KEY in your .env file). Until then Alclo simulates it.'
          }
          stack
        >
          {({ labelId, descriptionId }) => (
            <div className="preferences-section__source">
              <ChoiceCards
                value={prefs.weatherSource ?? 'simulated'}
                onChange={(next) => next !== prefs.weatherSource && save({ weatherSource: next })}
                labelledBy={labelId}
                describedBy={descriptionId}
                options={[
                  {
                    value: 'simulated',
                    title: 'Simulated',
                    icon: CloudOutlined,
                    description: 'Believable daily weather from climate averages. Works offline.',
                  },
                  {
                    value: 'live',
                    title: 'Live',
                    icon: SensorsOutlined,
                    disabled: !liveAvailable,
                    description: liveAvailable
                      ? 'Current conditions and forecast for your city from OpenWeather.'
                      : 'Not available: no API key is set.',
                  },
                ]}
              />
              <WeatherPreview unit={prefs.tempUnit ?? 'C'} />
            </div>
          )}
        </SettingRow>
      </SectionCard>

      <SectionCard title="Outfits and laundry" titleComponent="h3">
        <SettingRow label="Default occasion" description="Today opens with outfits for this occasion." stack>
          <OccasionToggle
            value={prefs.defaultOccasion}
            onChange={(next) => next !== prefs.defaultOccasion && save({ defaultOccasion: next })}
            label="Default occasion"
            className="preferences-section__occasion"
          />
        </SettingRow>

        <SettingRow
          label="Mark laundry urgent after"
          description="Pieces waiting in the hamper longer than this are flagged as urgent."
          align="start"
        >
          {({ labelId }) => (
            <div className="preferences-section__urgent">
              <span className="preferences-section__urgent-value u-tabular" aria-hidden>
                {daysLabel(urgentValue)}
              </span>
              <Slider
                className="preferences-section__slider"
                min={1}
                max={14}
                step={1}
                marks={URGENT_MARKS}
                value={urgentValue}
                onChange={(_event, next) => setUrgentDraft(next)}
                onChangeCommitted={(_event, next) => {
                  setUrgentDraft(null);
                  if (next !== prefs.urgentAfterDays) save({ urgentAfterDays: next });
                }}
                getAriaValueText={daysLabel}
                valueLabelDisplay="off"
                slotProps={{ input: { 'aria-labelledby': labelId } }}
              />
            </div>
          )}
        </SettingRow>
      </SectionCard>
    </SettingsPanel>
  );
}
