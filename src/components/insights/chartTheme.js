import { useColorScheme, useTheme } from '@mui/material/styles';
import { zinc } from '@/theme/palette';

/*
 * Chart colours for the active scheme.
 *
 * x-charts writes series colours into SVG `fill` attributes, where CSS variables do not
 * resolve, so we read the concrete hex values for the current scheme from the theme.
 * Encoding (validated with the dataviz checks, see the P-INSIGHTS report):
 * - worn: Alclo Rose. Every measure of wear uses it, so rose always means "worn".
 * - notWorn: a zinc step that sits clear of the card surface but stays quiet (de-emphasis).
 *   It is never the only cue: the legend and the "6 of 9" end labels carry the values too.
 */
const NOT_WORN = { light: zinc[300], dark: zinc[600] };

function domScheme() {
  if (typeof document === 'undefined') return 'light';
  return document.documentElement.hasAttribute('data-dark') ? 'dark' : 'light';
}

/** Resolved chart colours for the current colour scheme. */
export function useChartColors() {
  const theme = useTheme();
  const { colorScheme } = useColorScheme();
  const scheme = colorScheme === 'dark' || colorScheme === 'light' ? colorScheme : domScheme();
  const palette = theme.colorSchemes?.[scheme]?.palette ?? theme.palette;
  return {
    scheme,
    worn: palette.primary.main,
    notWorn: NOT_WORN[scheme],
  };
}

/** Classes passed to every chart tooltip so it picks up the Alclo overlay styling. */
export const TOOLTIP_CLASSES = { root: 'insights-tooltip' };
