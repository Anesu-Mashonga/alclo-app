import DarkModeOutlined from '@mui/icons-material/DarkModeOutlined';
import LightModeOutlined from '@mui/icons-material/LightModeOutlined';
import SettingsBrightnessOutlined from '@mui/icons-material/SettingsBrightnessOutlined';
import IconButton from '@mui/material/IconButton';
import { useColorScheme } from '@mui/material/styles';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import Tooltip from '@mui/material/Tooltip';
import cx from './cx';
import './ThemeToggle.scss';

const MODES = [
  { value: 'light', label: 'Light', icon: <LightModeOutlined /> },
  { value: 'dark', label: 'Dark', icon: <DarkModeOutlined /> },
  { value: 'system', label: 'System', icon: <SettingsBrightnessOutlined /> },
];

/**
 * Colour mode control backed by MUI's useColorScheme (persisted under 'alclo-color-mode').
 *
 * Props:
 * - variant: 'icon' (default) toggles light and dark; the tooltip names the next mode.
 *            'segmented' shows Light / Dark / System.
 * - size: IconButton or ToggleButton size ('small' | 'medium' | 'large')
 * - className
 */
export default function ThemeToggle({ variant = 'icon', size = 'medium', className }) {
  const { mode, systemMode, setMode } = useColorScheme();
  const activeMode = mode ?? 'system';
  const resolved = (activeMode === 'system' ? systemMode : activeMode) ?? 'light';

  if (variant === 'segmented') {
    return (
      <ToggleButtonGroup
        exclusive
        value={activeMode}
        onChange={(_event, next) => next && setMode(next)}
        aria-label="Theme"
        size={size}
        className={cx('theme-toggle', 'theme-toggle--segmented', className)}
      >
        {MODES.map((option) => (
          <ToggleButton key={option.value} value={option.value}>
            {option.icon}
            {option.label}
          </ToggleButton>
        ))}
      </ToggleButtonGroup>
    );
  }

  const next = resolved === 'dark' ? 'light' : 'dark';
  const label = `Switch to ${next} theme`;

  return (
    <Tooltip title={label}>
      <IconButton
        aria-label={label}
        size={size}
        onClick={() => setMode(next)}
        className={cx('theme-toggle', 'theme-toggle--icon', className)}
      >
        {resolved === 'dark' ? <LightModeOutlined /> : <DarkModeOutlined />}
      </IconButton>
    </Tooltip>
  );
}
