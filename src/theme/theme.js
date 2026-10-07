import { createTheme } from '@mui/material/styles';
import { components, EASE_EXIT, EASE_STANDARD } from './components';
import { darkPalette, lightPalette } from './palette';

export const FONT_FAMILY = '"Geist Variable", system-ui, -apple-system, "Segoe UI", Roboto, sans-serif';

/** localStorage key MUI uses for the colour mode. The inline script in index.html reads it too. */
export const COLOR_MODE_STORAGE_KEY = 'alclo-color-mode';

/*
 * Shadows resolve through palette tokens so they follow the active scheme.
 * Index 1-3 is the subtle "raised" look (switch thumb, selected segment); every higher
 * elevation is the overlay shadow (menus, popovers, dialogs, snackbars).
 */
const RAISED = 'var(--mui-palette-alclo-shadowRaised)';
const OVERLAY = 'var(--mui-palette-alclo-shadowOverlay)';
const shadows = ['none', RAISED, RAISED, RAISED, ...Array(21).fill(OVERLAY)];

const BELOW_MD = '@media (max-width:899.95px)';

const theme = createTheme({
  cssVariables: { colorSchemeSelector: 'data' },
  colorSchemes: {
    // `overlays: []` removes MUI's dark-mode elevation overlay image, so dark surfaces stay flat.
    light: { palette: lightPalette, overlays: [] },
    dark: { palette: darkPalette, overlays: [] },
  },
  shape: { borderRadius: 10 },
  shadows,
  // Opt-in keyboard focus ring: 2px primary outline with a 2px offset on every ButtonBase.
  focusVisible: true,
  motion: { reducedMotion: 'system' },
  typography: {
    fontFamily: FONT_FAMILY,
    fontSize: 14,
    htmlFontSize: 16,
    fontWeightLight: 400,
    fontWeightRegular: 400,
    fontWeightMedium: 500,
    fontWeightBold: 600,
    h1: {
      fontSize: '2rem',
      fontWeight: 600,
      letterSpacing: '-0.02em',
      lineHeight: 1.2,
      [BELOW_MD]: { fontSize: '1.625rem' },
    },
    h2: { fontSize: '1.5rem', fontWeight: 600, letterSpacing: '-0.015em', lineHeight: 1.25 },
    h3: { fontSize: '1.25rem', fontWeight: 600, letterSpacing: '-0.01em', lineHeight: 1.3 },
    h4: { fontSize: '1.0625rem', fontWeight: 600, letterSpacing: '-0.005em', lineHeight: 1.35 },
    h5: { fontSize: '1rem', fontWeight: 600, letterSpacing: 0, lineHeight: 1.4 },
    h6: { fontSize: '0.9375rem', fontWeight: 600, letterSpacing: 0, lineHeight: 1.4 },
    subtitle1: { fontSize: '1rem', fontWeight: 500, lineHeight: 1.5, letterSpacing: 0 },
    subtitle2: { fontSize: '0.875rem', fontWeight: 600, lineHeight: 1.45, letterSpacing: 0 },
    body1: { fontSize: '1rem', lineHeight: 1.55, letterSpacing: 0 },
    body2: { fontSize: '0.875rem', lineHeight: 1.5, letterSpacing: 0 },
    caption: { fontSize: '0.8125rem', lineHeight: 1.4, letterSpacing: 0 },
    overline: {
      fontSize: '0.75rem',
      fontWeight: 600,
      lineHeight: 1.4,
      letterSpacing: '0.02em',
      textTransform: 'none',
    },
    button: { fontWeight: 600, letterSpacing: 0, textTransform: 'none' },
  },
  transitions: {
    duration: {
      shortest: 120,
      shorter: 160,
      short: 200,
      standard: 280,
      complex: 320,
      enteringScreen: 280,
      leavingScreen: 200,
    },
    easing: {
      easeInOut: EASE_STANDARD,
      easeOut: EASE_STANDARD,
      easeIn: EASE_EXIT,
      sharp: EASE_EXIT,
    },
  },
  components,
});

export default theme;
