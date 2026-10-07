import { useColorScheme } from '@mui/material/styles';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import './AppearancePicker.scss';

const OPTIONS = [
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
  { value: 'system', label: 'System' },
];

/**
 * A miniature of the app shell. `scheme` sets data-light / data-dark on the tile, which
 * re-scopes MUI's CSS variables, so each preview uses the real theme tokens for its mode.
 */
function SchemePreview({ scheme }) {
  const attrs = scheme === 'dark' ? { 'data-dark': '' } : { 'data-light': '' };
  return (
    <span className="appearance-preview" {...attrs}>
      <span className="appearance-preview__rail" />
      <span className="appearance-preview__main">
        <span className="appearance-preview__line appearance-preview__line--title" />
        <span className="appearance-preview__card">
          <span className="appearance-preview__well" />
          <span className="appearance-preview__well" />
          <span className="appearance-preview__well" />
        </span>
        <span className="appearance-preview__line appearance-preview__line--accent" />
      </span>
    </span>
  );
}

/**
 * Light / Dark / System segmented control with live preview tiles. Backed by MUI's
 * useColorScheme, so the choice applies instantly and persists under 'alclo-color-mode'.
 */
export default function AppearancePicker({ labelledBy, describedBy }) {
  const { mode, systemMode, setMode } = useColorScheme();
  const value = mode ?? 'system';

  return (
    <ToggleButtonGroup
      exclusive
      value={value}
      onChange={(_event, next) => next && setMode(next)}
      aria-labelledby={labelledBy}
      aria-describedby={describedBy}
      className="appearance-picker"
    >
      {OPTIONS.map((option) => (
        <ToggleButton key={option.value} value={option.value} className="appearance-picker__option">
          <span className="appearance-picker__tile" aria-hidden>
            {option.value === 'system' ? (
              <span className="appearance-picker__split">
                <SchemePreview scheme="light" />
                <SchemePreview scheme="dark" />
              </span>
            ) : (
              <SchemePreview scheme={option.value} />
            )}
          </span>
          <span className="appearance-picker__label">
            {option.label}
            {option.value === 'system' && systemMode ? (
              <span className="appearance-picker__hint">Now {systemMode}</span>
            ) : null}
          </span>
        </ToggleButton>
      ))}
    </ToggleButtonGroup>
  );
}
