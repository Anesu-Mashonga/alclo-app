/**
 * MUI component overrides (spec 1.3 shape, 1.5 motion).
 *
 * Every colour is read from `theme.vars` so the overrides follow the active colour scheme
 * through CSS variables. `theme.applyStyles('dark', ...)` is used only where the two schemes
 * need structurally different styles.
 *
 * Radius rule: controls 10px, surfaces 16px, photo wells 12px, chips and pills 999px.
 */
import { alertClasses } from '@mui/material/Alert';
import { autocompleteClasses } from '@mui/material/Autocomplete';
import { bottomNavigationActionClasses } from '@mui/material/BottomNavigationAction';
import { chipClasses } from '@mui/material/Chip';
import { inputLabelClasses } from '@mui/material/InputLabel';
import { listItemButtonClasses } from '@mui/material/ListItemButton';
import { listItemIconClasses } from '@mui/material/ListItemIcon';
import { menuItemClasses } from '@mui/material/MenuItem';
import { outlinedInputClasses } from '@mui/material/OutlinedInput';
import { switchClasses } from '@mui/material/Switch';
import { tabClasses } from '@mui/material/Tab';
import { toggleButtonClasses } from '@mui/material/ToggleButton';
import { toggleButtonGroupClasses } from '@mui/material/ToggleButtonGroup';
import { tooltipClasses } from '@mui/material/Tooltip';

export const EASE_STANDARD = 'cubic-bezier(0.2, 0, 0, 1)';
export const EASE_EXIT = 'cubic-bezier(0.3, 0, 1, 1)';

const RADIUS_CONTROL = 10;
const RADIUS_SURFACE = 16;
const RADIUS_PILL = 999;

const SOFT_TONES = ['success', 'warning', 'error', 'info'];

/** Shared press feedback for buttons and other tappable controls. */
function pressable(scale = 0.98) {
  return {
    '&:active:not(.Mui-disabled)': { transform: `scale(${scale})` },
    '@media (prefers-reduced-motion: reduce)': {
      '&:active:not(.Mui-disabled)': { transform: 'none' },
    },
  };
}

function quickTransition(...properties) {
  return properties.map((property) => `${property} 120ms ${EASE_STANDARD}`).join(', ');
}

/** Raised surface used by menus, popovers and autocomplete listboxes. */
function overlaySurface(theme) {
  return {
    backgroundColor: theme.vars.palette.alclo.surfaceRaised,
    backgroundImage: 'none',
    borderRadius: RADIUS_SURFACE,
    boxShadow: theme.vars.palette.alclo.shadowOverlay,
    border: 0,
  };
}

/** Selected look for list rows, menu items and nav items. */
function selectedSoft(theme) {
  return {
    backgroundColor: theme.vars.palette.alclo.accentSoft,
    color: theme.vars.palette.alclo.onAccentSoft,
  };
}

export const components = {
  // CssBaseline already paints body with background.default and text.primary (as CSS variables).
  MuiCssBaseline: {
    styleOverrides: {
      html: {
        WebkitFontSmoothing: 'antialiased',
        MozOsxFontSmoothing: 'grayscale',
        textRendering: 'optimizeLegibility',
      },
      'strong, b': { fontWeight: 600 },
    },
  },

  MuiButtonBase: {
    // Pressed scale + hover tint + focus ring replace the Material ripple.
    defaultProps: { disableRipple: true },
  },

  MuiButton: {
    defaultProps: { disableElevation: true },
    styleOverrides: {
      root: ({ theme }) => ({
        minHeight: 40,
        padding: '0 16px',
        borderRadius: RADIUS_CONTROL,
        textTransform: 'none',
        fontWeight: 600,
        fontSize: '0.9375rem',
        lineHeight: 1.25,
        letterSpacing: 0,
        whiteSpace: 'nowrap',
        transition: quickTransition('background-color', 'border-color', 'color', 'box-shadow', 'transform'),
        ...pressable(0.98),
        variants: [
          { props: { size: 'small' }, style: { minHeight: 32, padding: '0 12px', fontSize: '0.8125rem' } },
          { props: { size: 'large' }, style: { minHeight: 48, padding: '0 22px', fontSize: '1rem' } },
          { props: { variant: 'text' }, style: { padding: '0 12px' } },
          { props: { variant: 'text', size: 'small' }, style: { padding: '0 8px' } },
          {
            props: { variant: 'outlined', color: 'inherit' },
            style: {
              borderColor: theme.vars.palette.alclo.borderStrong,
              color: theme.vars.palette.text.primary,
              '@media (hover: hover)': {
                '&:hover': {
                  backgroundColor: theme.vars.palette.alclo.hover,
                  borderColor: theme.vars.palette.alclo.borderStrong,
                },
              },
            },
          },
          {
            props: { variant: 'text', color: 'inherit' },
            style: {
              '@media (hover: hover)': {
                '&:hover': { backgroundColor: theme.vars.palette.alclo.hover },
              },
            },
          },
          {
            props: { variant: 'contained', color: 'inherit' },
            style: { color: theme.vars.palette.text.primary },
          },
        ],
      }),
      startIcon: { marginRight: 6 },
      endIcon: { marginLeft: 6 },
    },
  },

  MuiIconButton: {
    styleOverrides: {
      root: ({ theme }) => ({
        borderRadius: RADIUS_CONTROL,
        '--IconButton-hoverBg': theme.vars.palette.alclo.hover,
        transition: quickTransition('background-color', 'color', 'transform'),
        ...pressable(0.94),
        variants: [
          { props: { size: 'small' }, style: { padding: 6, fontSize: '1.125rem' } },
          { props: { size: 'large' }, style: { padding: 12 } },
        ],
      }),
    },
  },

  MuiFab: {
    defaultProps: { color: 'primary' },
    styleOverrides: {
      root: ({ theme }) => ({
        boxShadow: theme.vars.palette.alclo.shadowOverlay,
        textTransform: 'none',
        fontWeight: 600,
        ...pressable(0.96),
      }),
    },
  },

  MuiCard: {
    defaultProps: { variant: 'outlined' },
    styleOverrides: {
      root: ({ theme }) => ({
        borderRadius: RADIUS_SURFACE,
        backgroundColor: theme.vars.palette.background.paper,
        backgroundImage: 'none',
      }),
    },
  },

  MuiCardContent: {
    styleOverrides: {
      root: { padding: 20, '&:last-child': { paddingBottom: 20 } },
    },
  },

  MuiPaper: {
    styleOverrides: {
      root: { backgroundImage: 'none' },
      outlined: ({ theme }) => ({ borderColor: theme.vars.palette.divider }),
    },
  },

  MuiChip: {
    styleOverrides: {
      root: ({ theme }) => ({
        height: 32,
        borderRadius: RADIUS_PILL,
        fontWeight: 500,
        fontSize: '0.875rem',
        letterSpacing: 0,
        transition: quickTransition('background-color', 'border-color', 'color', 'transform'),
        [`& .${chipClasses.label}`]: { paddingLeft: 12, paddingRight: 12 },
        [`& .${chipClasses.icon}`]: { fontSize: 18, marginLeft: 10, marginRight: -4, color: 'inherit' },
        [`& .${chipClasses.deleteIcon}`]: { fontSize: 18, marginRight: 6, color: 'inherit', opacity: 0.7 },
        [`& .${chipClasses.deleteIcon}:hover`]: { color: 'inherit', opacity: 1 },
        [`&.${chipClasses.clickable}`]: pressable(0.97),
        variants: [
          {
            props: { size: 'small' },
            style: {
              height: 24,
              fontSize: '0.8125rem',
              [`& .${chipClasses.label}`]: { paddingLeft: 8, paddingRight: 8 },
              [`& .${chipClasses.icon}`]: { fontSize: 16, marginLeft: 6, marginRight: -2 },
              [`& .${chipClasses.deleteIcon}`]: { fontSize: 16, marginRight: 4 },
            },
          },
          {
            props: { variant: 'filled', color: 'default' },
            style: {
              backgroundColor: theme.vars.palette.alclo.surfaceSunken,
              color: theme.vars.palette.text.primary,
              [`&.${chipClasses.clickable}:hover`]: { backgroundColor: theme.vars.palette.divider },
            },
          },
          {
            props: { variant: 'outlined', color: 'default' },
            style: {
              borderColor: theme.vars.palette.alclo.borderStrong,
              color: theme.vars.palette.text.primary,
              [`&.${chipClasses.clickable}:hover`]: { backgroundColor: theme.vars.palette.alclo.hover },
            },
          },
          // "Selected" chips: color="primary" renders the soft rose look, not a solid fill.
          {
            props: { variant: 'filled', color: 'primary' },
            style: {
              ...selectedSoft(theme),
              [`&.${chipClasses.clickable}:hover`]: selectedSoft(theme),
            },
          },
          {
            props: { variant: 'outlined', color: 'primary' },
            style: {
              borderColor: theme.vars.palette.primary.main,
              color: theme.vars.palette.alclo.onAccentSoft,
              backgroundColor: theme.vars.palette.alclo.accentSoft,
            },
          },
          ...SOFT_TONES.map((tone) => ({
            props: { variant: 'filled', color: tone },
            style: {
              backgroundColor: theme.vars.palette[tone].soft,
              color: theme.vars.palette[tone].onSoft,
              [`&.${chipClasses.clickable}:hover`]: {
                backgroundColor: theme.vars.palette[tone].soft,
                color: theme.vars.palette[tone].onSoft,
              },
            },
          })),
        ],
        // Toggle chips can also express state through ARIA instead of color.
        '&[aria-pressed="true"], &[aria-checked="true"]': {
          ...selectedSoft(theme),
          borderColor: 'transparent',
        },
      }),
    },
  },

  MuiInputLabel: {
    // Labels sit above the field and never float or overlap the value.
    defaultProps: { shrink: true },
    styleOverrides: {
      root: ({ theme }) => ({
        position: 'relative',
        transform: 'none',
        maxWidth: '100%',
        marginBottom: 6,
        fontSize: '0.875rem',
        lineHeight: 1.4,
        fontWeight: 500,
        whiteSpace: 'normal',
        overflow: 'visible',
        pointerEvents: 'auto',
        userSelect: 'auto',
        color: theme.vars.palette.text.primary,
        [`&.${inputLabelClasses.focused}`]: { color: theme.vars.palette.text.primary },
        [`&.${inputLabelClasses.error}`]: { color: theme.vars.palette.error.main },
        [`&.${inputLabelClasses.disabled}`]: { color: theme.vars.palette.text.disabled },
        '& .MuiFormLabel-asterisk': { color: theme.vars.palette.text.secondary },
      }),
      shrink: { transform: 'none' },
      outlined: { transform: 'none' },
    },
  },

  MuiFormLabel: {
    styleOverrides: {
      root: ({ theme }) => ({
        fontSize: '0.875rem',
        fontWeight: 500,
        color: theme.vars.palette.text.primary,
        '&.Mui-focused': { color: theme.vars.palette.text.primary },
      }),
    },
  },

  MuiOutlinedInput: {
    defaultProps: { notched: false },
    styleOverrides: {
      root: ({ theme }) => ({
        borderRadius: RADIUS_CONTROL,
        backgroundColor: theme.vars.palette.background.paper,
        fontSize: '1rem',
        transition: quickTransition('box-shadow', 'background-color'),
        [`& .${outlinedInputClasses.notchedOutline}`]: {
          borderColor: theme.vars.palette.alclo.borderStrong,
          transition: quickTransition('border-color'),
        },
        [`&:hover .${outlinedInputClasses.notchedOutline}`]: {
          borderColor: theme.vars.palette.text.secondary,
        },
        [`&.${outlinedInputClasses.focused} .${outlinedInputClasses.notchedOutline}`]: {
          borderColor: theme.vars.palette.primary.main,
          borderWidth: 2,
        },
        [`&.${outlinedInputClasses.error} .${outlinedInputClasses.notchedOutline}`]: {
          borderColor: theme.vars.palette.error.main,
        },
        [`&.${outlinedInputClasses.disabled}`]: {
          backgroundColor: theme.vars.palette.alclo.surfaceSunken,
        },
        [`&.${outlinedInputClasses.disabled} .${outlinedInputClasses.notchedOutline}`]: {
          borderColor: theme.vars.palette.divider,
        },
        variants: [
          { props: { size: 'small' }, style: { fontSize: '0.9375rem' } },
        ],
      }),
      input: ({ theme }) => ({
        padding: '10.5px 14px',
        '&::placeholder': { color: theme.vars.palette.text.secondary, opacity: 0.75 },
        variants: [{ props: { size: 'small' }, style: { padding: '6.5px 12px' } }],
      }),
      multiline: { padding: 0 },
      inputMultiline: { padding: '10.5px 14px' },
      adornedStart: { paddingLeft: 12 },
      adornedEnd: { paddingRight: 8 },
    },
  },

  MuiInputAdornment: {
    styleOverrides: {
      root: ({ theme }) => ({ color: theme.vars.palette.text.secondary }),
    },
  },

  MuiFormHelperText: {
    styleOverrides: {
      root: ({ theme }) => ({
        marginLeft: 0,
        marginRight: 0,
        marginTop: 6,
        fontSize: '0.8125rem',
        lineHeight: 1.4,
        color: theme.vars.palette.text.secondary,
        '&.Mui-error': { color: theme.vars.palette.error.main },
      }),
    },
  },

  MuiTextField: {
    defaultProps: { variant: 'outlined' },
  },

  MuiSelect: {
    styleOverrides: {
      icon: ({ theme }) => ({ color: theme.vars.palette.text.secondary, right: 10 }),
    },
  },

  MuiMenu: {
    styleOverrides: {
      paper: ({ theme }) => ({ ...overlaySurface(theme), minWidth: 200 }),
      list: { padding: 6 },
    },
  },

  MuiMenuItem: {
    styleOverrides: {
      root: ({ theme }) => ({
        minHeight: 40,
        gap: 12,
        padding: '8px 12px',
        borderRadius: RADIUS_CONTROL,
        fontSize: '0.9375rem',
        '&:hover': { backgroundColor: theme.vars.palette.alclo.hover },
        [`&.${menuItemClasses.selected}, &.${menuItemClasses.selected}:hover`]: selectedSoft(theme),
        [`& .${listItemIconClasses.root}`]: { minWidth: 0, color: 'inherit' },
        [`& .${listItemIconClasses.root} svg`]: { fontSize: 20 },
        '& + .MuiDivider-root': { marginTop: 6, marginBottom: 6 },
      }),
    },
  },

  MuiPopover: {
    styleOverrides: {
      paper: ({ theme }) => overlaySurface(theme),
    },
  },

  MuiAutocomplete: {
    styleOverrides: {
      paper: ({ theme }) => ({ ...overlaySurface(theme), marginTop: 6 }),
      listbox: { padding: 6 },
      option: ({ theme }) => ({
        borderRadius: RADIUS_CONTROL,
        minHeight: 40,
        [`&.${autocompleteClasses.focused}`]: { backgroundColor: theme.vars.palette.alclo.hover },
        '&[aria-selected="true"]': selectedSoft(theme),
        [`&[aria-selected="true"].${autocompleteClasses.focused}`]: selectedSoft(theme),
      }),
      tag: { margin: 2 },
    },
  },

  MuiDialog: {
    styleOverrides: {
      paper: ({ theme }) => ({
        borderRadius: RADIUS_SURFACE,
        backgroundColor: theme.vars.palette.alclo.surfaceRaised,
        backgroundImage: 'none',
        boxShadow: theme.vars.palette.alclo.shadowOverlay,
      }),
      paperFullScreen: { borderRadius: 0, boxShadow: 'none' },
    },
  },

  MuiDialogTitle: {
    styleOverrides: {
      root: {
        padding: '20px 24px 8px',
        fontSize: '1.25rem',
        fontWeight: 600,
        lineHeight: 1.3,
        letterSpacing: '-0.01em',
      },
    },
  },

  MuiDialogContent: {
    styleOverrides: {
      root: { padding: '8px 24px 20px' },
    },
  },

  MuiDialogActions: {
    styleOverrides: {
      root: { padding: '12px 24px 20px', gap: 8, '& > :not(style) ~ :not(style)': { marginLeft: 0 } },
    },
  },

  MuiBackdrop: {
    styleOverrides: {
      root: ({ theme }) => ({
        variants: [
          {
            props: { invisible: false },
            style: { backgroundColor: theme.vars.palette.alclo.backdrop },
          },
        ],
      }),
    },
  },

  MuiDrawer: {
    styleOverrides: {
      paper: ({ theme, ownerState }) => ({
        backgroundColor: theme.vars.palette.background.paper,
        backgroundImage: 'none',
        ...(ownerState.variant === 'temporary' && {
          boxShadow: theme.vars.palette.alclo.shadowOverlay,
          ...(ownerState.anchor === 'right' && {
            borderTopLeftRadius: RADIUS_SURFACE,
            borderBottomLeftRadius: RADIUS_SURFACE,
          }),
          ...(ownerState.anchor === 'left' && {
            borderTopRightRadius: RADIUS_SURFACE,
            borderBottomRightRadius: RADIUS_SURFACE,
          }),
          ...(ownerState.anchor === 'bottom' && {
            borderTopLeftRadius: RADIUS_SURFACE,
            borderTopRightRadius: RADIUS_SURFACE,
          }),
        }),
      }),
    },
  },

  MuiTooltip: {
    defaultProps: { arrow: true, enterDelay: 400, enterNextDelay: 150 },
    styleOverrides: {
      tooltip: ({ theme }) => ({
        backgroundColor: theme.vars.palette.alclo.ink,
        color: theme.vars.palette.alclo.onInk,
        fontSize: '0.8125rem',
        fontWeight: 500,
        lineHeight: 1.4,
        padding: '6px 10px',
        borderRadius: 8,
        maxWidth: 280,
      }),
      arrow: ({ theme }) => ({ color: theme.vars.palette.alclo.ink }),
      popper: {
        [`&[data-popper-placement*="bottom"] .${tooltipClasses.tooltip}`]: { marginTop: '8px !important' },
        [`&[data-popper-placement*="top"] .${tooltipClasses.tooltip}`]: { marginBottom: '8px !important' },
      },
    },
  },

  MuiTabs: {
    styleOverrides: {
      root: { minHeight: 44 },
      indicator: ({ theme }) => ({
        height: 2,
        borderRadius: 2,
        backgroundColor: theme.vars.palette.primary.main,
      }),
    },
  },

  MuiTab: {
    styleOverrides: {
      root: ({ theme }) => ({
        minHeight: 44,
        minWidth: 0,
        padding: '10px 14px',
        textTransform: 'none',
        fontWeight: 600,
        fontSize: '0.9375rem',
        letterSpacing: 0,
        color: theme.vars.palette.text.secondary,
        transition: quickTransition('color', 'background-color'),
        '&:hover': { color: theme.vars.palette.text.primary },
        [`&.${tabClasses.selected}`]: { color: theme.vars.palette.text.primary },
      }),
    },
  },

  MuiToggleButtonGroup: {
    // Segmented control: sunken pill track with a raised selected segment.
    styleOverrides: {
      root: ({ theme }) => ({
        backgroundColor: theme.vars.palette.alclo.surfaceSunken,
        borderRadius: RADIUS_PILL,
        padding: 3,
        gap: 2,
        [`& .${toggleButtonGroupClasses.grouped}`]: {
          margin: 0,
          border: 0,
          borderRadius: RADIUS_PILL,
        },
        [`& .${toggleButtonGroupClasses.firstButton}, & .${toggleButtonGroupClasses.middleButton}, & .${toggleButtonGroupClasses.lastButton}`]:
          {
            margin: 0,
            border: 0,
            borderRadius: RADIUS_PILL,
          },
      }),
    },
  },

  MuiToggleButton: {
    styleOverrides: {
      root: ({ theme }) => ({
        minHeight: 34,
        padding: '0 14px',
        gap: 6,
        border: 0,
        borderRadius: RADIUS_PILL,
        textTransform: 'none',
        fontWeight: 600,
        fontSize: '0.875rem',
        letterSpacing: 0,
        color: theme.vars.palette.text.secondary,
        transition: quickTransition('background-color', 'color', 'box-shadow', 'transform'),
        '&:hover': { backgroundColor: 'transparent', color: theme.vars.palette.text.primary },
        [`&.${toggleButtonClasses.selected}, &.${toggleButtonClasses.selected}:hover`]: {
          backgroundColor: theme.vars.palette.alclo.surfaceRaised,
          color: theme.vars.palette.text.primary,
          boxShadow: theme.vars.palette.alclo.shadowRaised,
        },
        '& svg': { fontSize: 18 },
        ...pressable(0.97),
        variants: [
          { props: { size: 'small' }, style: { minHeight: 28, padding: '0 10px', fontSize: '0.8125rem' } },
          { props: { size: 'large' }, style: { minHeight: 42, padding: '0 18px', fontSize: '0.9375rem' } },
        ],
      }),
    },
  },

  MuiSwitch: {
    styleOverrides: {
      root: ({ theme }) => ({
        width: 44,
        height: 26,
        padding: 0,
        overflow: 'visible',
        margin: 7,
        [`& .${switchClasses.switchBase}`]: {
          padding: 3,
          color: theme.vars.palette.common.white,
          '&:hover': { backgroundColor: 'transparent' },
          [`&.${switchClasses.checked}`]: {
            transform: 'translateX(18px)',
            color: theme.vars.palette.common.white,
            '&:hover': { backgroundColor: 'transparent' },
          },
          [`&.${switchClasses.checked} + .${switchClasses.track}`]: {
            backgroundColor: theme.vars.palette.primary.main,
            opacity: 1,
          },
          [`&.${switchClasses.disabled} + .${switchClasses.track}`]: { opacity: 0.45 },
          [`&.${switchClasses.disabled} .${switchClasses.thumb}`]: { boxShadow: 'none' },
        },
        [`& .${switchClasses.thumb}`]: {
          width: 20,
          height: 20,
          boxShadow: theme.vars.palette.alclo.shadowRaised,
        },
        [`& .${switchClasses.track}`]: {
          borderRadius: 13,
          opacity: 1,
          backgroundColor: theme.vars.palette.alclo.borderStrong,
        },
        variants: [
          {
            props: { size: 'small' },
            style: {
              width: 36,
              height: 20,
              padding: 0,
              [`& .${switchClasses.switchBase}`]: {
                padding: 3,
                [`&.${switchClasses.checked}`]: { transform: 'translateX(16px)' },
              },
              [`& .${switchClasses.thumb}`]: { width: 14, height: 14 },
              [`& .${switchClasses.track}`]: { borderRadius: 10 },
            },
          },
        ],
      }),
    },
  },

  MuiCheckbox: {
    styleOverrides: {
      root: ({ theme }) => ({
        color: theme.vars.palette.alclo.borderStrong,
        borderRadius: 8,
        '&:hover': { backgroundColor: theme.vars.palette.alclo.hover },
      }),
    },
  },

  MuiRadio: {
    styleOverrides: {
      root: ({ theme }) => ({
        color: theme.vars.palette.alclo.borderStrong,
        '&:hover': { backgroundColor: theme.vars.palette.alclo.hover },
      }),
    },
  },

  MuiFormControlLabel: {
    styleOverrides: {
      label: { fontSize: '0.9375rem' },
    },
  },

  MuiBadge: {
    styleOverrides: {
      badge: ({ theme }) => ({
        fontWeight: 600,
        fontSize: '0.6875rem',
        fontVariantNumeric: 'tabular-nums',
        height: 18,
        minWidth: 18,
        padding: '0 5px',
        borderRadius: RADIUS_PILL,
        boxShadow: `0 0 0 2px ${theme.vars.palette.background.paper}`,
      }),
      dot: { height: 8, minWidth: 8, padding: 0 },
    },
  },

  MuiAvatar: {
    styleOverrides: {
      root: { fontWeight: 600, letterSpacing: '0.01em' },
      colorDefault: ({ theme }) => ({
        backgroundColor: theme.vars.palette.alclo.accentSoft,
        color: theme.vars.palette.alclo.onAccentSoft,
      }),
    },
  },

  MuiSkeleton: {
    defaultProps: { animation: 'pulse' },
    styleOverrides: {
      root: { borderRadius: 8 },
      rounded: { borderRadius: 12 },
      text: { borderRadius: 6 },
    },
  },

  MuiAlert: {
    defaultProps: { variant: 'standard' },
    styleOverrides: {
      root: {
        borderRadius: 12,
        padding: '8px 14px',
        alignItems: 'flex-start',
        fontSize: '0.875rem',
        [`& .${alertClasses.icon}`]: { opacity: 1, fontSize: 20, padding: '9px 0', marginRight: 10 },
        [`& .${alertClasses.message}`]: { padding: '9px 0' },
        [`& .${alertClasses.action}`]: { paddingTop: 2 },
      },
    },
  },

  MuiAlertTitle: {
    styleOverrides: {
      root: { fontWeight: 600, fontSize: '0.9375rem', marginBottom: 2, marginTop: 0 },
    },
  },

  MuiSnackbarContent: {
    styleOverrides: {
      root: ({ theme }) => ({
        backgroundColor: theme.vars.palette.alclo.ink,
        color: theme.vars.palette.alclo.onInk,
        borderRadius: 12,
        boxShadow: theme.vars.palette.alclo.shadowOverlay,
        fontSize: '0.9375rem',
        padding: '6px 8px 6px 16px',
      }),
    },
  },

  MuiLinearProgress: {
    styleOverrides: {
      root: { height: 6, borderRadius: RADIUS_PILL },
      bar: { borderRadius: RADIUS_PILL },
    },
  },

  MuiCircularProgress: {
    defaultProps: { thickness: 4.5 },
  },

  MuiList: {
    styleOverrides: {
      padding: { paddingTop: 6, paddingBottom: 6 },
    },
  },

  MuiListItemButton: {
    styleOverrides: {
      root: ({ theme }) => ({
        borderRadius: RADIUS_CONTROL,
        transition: quickTransition('background-color', 'color'),
        '&:hover': { backgroundColor: theme.vars.palette.alclo.hover },
        [`&.${listItemButtonClasses.selected}, &.${listItemButtonClasses.selected}:hover`]: selectedSoft(theme),
        [`&.${listItemButtonClasses.selected} .${listItemIconClasses.root}`]: { color: 'inherit' },
      }),
    },
  },

  MuiListItemIcon: {
    styleOverrides: {
      root: ({ theme }) => ({ minWidth: 36, color: theme.vars.palette.text.secondary }),
    },
  },

  MuiListItemText: {
    styleOverrides: {
      primary: { fontSize: '0.9375rem', fontWeight: 500 },
      secondary: { fontSize: '0.8125rem' },
    },
  },

  MuiDivider: {
    styleOverrides: {
      root: ({ theme }) => ({ borderColor: theme.vars.palette.divider }),
    },
  },

  MuiBottomNavigation: {
    styleOverrides: {
      root: ({ theme }) => ({
        height: 64,
        backgroundColor: theme.vars.palette.background.paper,
      }),
    },
  },

  MuiBottomNavigationAction: {
    styleOverrides: {
      root: ({ theme }) => ({
        minWidth: 0,
        padding: '6px 4px 8px',
        gap: 4,
        color: theme.vars.palette.text.secondary,
        transition: quickTransition('color'),
        [`&.${bottomNavigationActionClasses.selected}`]: { color: theme.vars.palette.text.primary },
        '& svg': { fontSize: 24 },
      }),
      label: {
        fontSize: '0.75rem',
        fontWeight: 600,
        lineHeight: 1.2,
        letterSpacing: 0,
        [`&.${bottomNavigationActionClasses.selected}`]: { fontSize: '0.75rem' },
      },
    },
  },

  MuiLink: {
    defaultProps: { underline: 'hover' },
    styleOverrides: {
      root: { fontWeight: 500, textUnderlineOffset: '0.18em' },
    },
  },

  MuiAppBar: {
    defaultProps: { elevation: 0, color: 'inherit' },
  },
};
