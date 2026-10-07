/**
 * Alclo colour tokens (spec section 1.1).
 *
 * Neutral base is the zinc family; the single accent is Alclo Rose. Status colours are reserved
 * for laundry and weather semantics and always ship with a `.soft` background and an `.onSoft`
 * foreground so pages can build tinted pills without inventing colours.
 *
 * With `cssVariables` enabled every leaf below becomes a CSS variable, for example
 * `--mui-palette-alclo-photoWell` or `--mui-palette-success-soft`. SCSS must read colours through
 * those variables so the active colour scheme always applies.
 */

/** Zinc scale, shared by both schemes (MUI `grey`). */
export const zinc = {
  50: '#FAFAFA',
  100: '#F4F4F5',
  200: '#E4E4E7',
  300: '#D4D4D8',
  400: '#A1A1AA',
  500: '#71717A',
  600: '#52525B',
  700: '#3F3F46',
  800: '#27272A',
  900: '#18181B',
  950: '#09090B',
  A100: '#F4F4F5',
  A200: '#E4E4E7',
  A400: '#A1A1AA',
  A700: '#3F3F46',
};

const light = {
  surfaceRaised: '#FFFFFF',
  surfaceSunken: '#ECECEE',
  accentSoft: '#FBE8EF',
  onAccentSoft: '#8E1844',
  ink: '#18181B',
  onInk: '#FAFAFA',
  hover: 'rgba(24, 24, 27, 0.04)',
  photoWell: '#F1F1F0',
};

const dark = {
  surfaceRaised: '#1F1F23',
  surfaceSunken: '#0C0C0E',
  accentSoft: '#3A1A27',
  onAccentSoft: '#F9B6CD',
  ink: '#F4F4F5',
  onInk: '#18181B',
  hover: 'rgba(244, 244, 245, 0.06)',
  photoWell: '#DCDCDE',
};

const status = {
  light: {
    success: { main: '#15803D', soft: '#E7F5EC', onSoft: '#166534', contrastText: '#FFFFFF' },
    warning: { main: '#B45309', soft: '#FDF0DC', onSoft: '#92400E', contrastText: '#FFFFFF' },
    error: { main: '#C2261C', soft: '#FDE8E6', onSoft: '#A3201A', contrastText: '#FFFFFF' },
    info: { main: '#2459C9', soft: '#E6EEFB', onSoft: '#1E4BA8', contrastText: '#FFFFFF' },
  },
  dark: {
    success: { main: '#4ADE80', soft: '#12301E', onSoft: '#86EFAC', contrastText: '#18181B' },
    warning: { main: '#FBBF24', soft: '#33240C', onSoft: '#FCD34D', contrastText: '#18181B' },
    error: { main: '#F97066', soft: '#3A1514', onSoft: '#FCA5A5', contrastText: '#18181B' },
    info: { main: '#7AA5F8', soft: '#14233F', onSoft: '#A5C4FA', contrastText: '#18181B' },
  },
};

/** MUI Alert reads these component tokens; pointing them at our soft tokens gives soft alerts. */
function alertTokens(tones) {
  return Object.fromEntries(
    Object.entries(tones).flatMap(([name, tone]) => [
      [`${name}Color`, tone.onSoft],
      [`${name}StandardBg`, tone.soft],
      [`${name}IconColor`, tone.main],
    ]),
  );
}

export const lightPalette = {
  mode: 'light',
  primary: { main: '#B21F57', dark: '#8E1844', light: '#D04A7C', contrastText: '#FFFFFF' },
  secondary: { main: '#3F3F46', dark: '#27272A', light: '#71717A', contrastText: '#FAFAFA' },
  // A neutral solid colour for "ink" buttons: <Button variant="contained" color="ink">.
  ink: { main: light.ink, dark: '#3F3F46', light: '#52525B', contrastText: light.onInk },
  ...status.light,
  grey: zinc,
  background: { default: '#F4F4F5', paper: '#FFFFFF' },
  divider: '#E4E4E7',
  text: { primary: '#18181B', secondary: '#52525B', disabled: '#A1A1AA' },
  action: {
    active: '#52525B',
    hover: light.hover,
    hoverOpacity: 0.04,
    selected: 'rgba(24, 24, 27, 0.08)',
    selectedOpacity: 0.08,
    disabled: 'rgba(24, 24, 27, 0.34)',
    disabledBackground: 'rgba(24, 24, 27, 0.08)',
    disabledOpacity: 0.38,
    focus: 'rgba(24, 24, 27, 0.12)',
    focusOpacity: 0.12,
    activatedOpacity: 0.12,
  },
  alclo: {
    ...light,
    borderStrong: '#D4D4D8',
    backdrop: 'rgba(9, 9, 11, 0.42)',
    shadowRaised: '0 1px 2px rgb(24 24 27 / 0.08), 0 1px 1px rgb(24 24 27 / 0.04)',
    shadowOverlay:
      '0 12px 32px -8px rgb(24 24 27 / 0.18), 0 2px 6px rgb(24 24 27 / 0.06), 0 0 0 1px rgb(24 24 27 / 0.05)',
  },
  Alert: alertTokens(status.light),
  Avatar: { defaultBg: light.accentSoft },
  Button: { inheritContainedBg: light.surfaceSunken, inheritContainedHoverBg: '#E4E4E7' },
  Chip: { defaultBorder: '#D4D4D8', defaultIconColor: '#52525B', defaultAvatarColor: '#52525B' },
  LinearProgress: { primaryBg: light.accentSoft },
  Skeleton: { bg: 'rgba(24, 24, 27, 0.07)' },
  SnackbarContent: { bg: light.ink, color: light.onInk },
  Tooltip: { bg: light.ink },
};

export const darkPalette = {
  mode: 'dark',
  primary: { main: '#F07AA5', dark: '#F59AB9', light: '#E05C8C', contrastText: '#18181B' },
  secondary: { main: '#D4D4D8', dark: '#E4E4E7', light: '#A1A1AA', contrastText: '#18181B' },
  ink: { main: dark.ink, dark: '#D4D4D8', light: '#E4E4E7', contrastText: dark.onInk },
  ...status.dark,
  grey: zinc,
  background: { default: '#111113', paper: '#18181B' },
  divider: '#2E2E33',
  text: { primary: '#F4F4F5', secondary: '#A1A1AA', disabled: '#63636B' },
  action: {
    active: '#A1A1AA',
    hover: dark.hover,
    hoverOpacity: 0.06,
    selected: 'rgba(244, 244, 245, 0.1)',
    selectedOpacity: 0.1,
    disabled: 'rgba(244, 244, 245, 0.32)',
    disabledBackground: 'rgba(244, 244, 245, 0.08)',
    disabledOpacity: 0.38,
    focus: 'rgba(244, 244, 245, 0.12)',
    focusOpacity: 0.12,
    activatedOpacity: 0.16,
  },
  alclo: {
    ...dark,
    borderStrong: '#3F3F46',
    backdrop: 'rgba(0, 0, 0, 0.62)',
    shadowRaised: '0 1px 2px rgb(0 0 0 / 0.5), 0 0 0 1px rgb(255 255 255 / 0.04)',
    shadowOverlay: '0 16px 40px -8px rgb(0 0 0 / 0.6), 0 0 0 1px #2E2E33',
  },
  Alert: alertTokens(status.dark),
  Avatar: { defaultBg: dark.accentSoft },
  Button: { inheritContainedBg: '#27272A', inheritContainedHoverBg: '#3F3F46' },
  Chip: { defaultBorder: '#3F3F46', defaultIconColor: '#A1A1AA', defaultAvatarColor: '#A1A1AA' },
  LinearProgress: { primaryBg: dark.accentSoft },
  Skeleton: { bg: 'rgba(244, 244, 245, 0.08)' },
  SnackbarContent: { bg: dark.ink, color: dark.onInk },
  Tooltip: { bg: dark.ink },
};
