import { useColorScheme } from '@mui/material/styles';
import { useEffect } from 'react';
import { darkPalette, lightPalette } from '@/theme/palette';

/**
 * Keeps the browser UI colour (<meta name="theme-color">) in step with the chosen mode,
 * including a manual override of the system preference. Renders nothing.
 */
export default function ThemeColorMeta() {
  const { mode, systemMode } = useColorScheme();
  const resolved = mode === 'system' ? systemMode : mode;

  useEffect(() => {
    if (!resolved) return;
    const color = resolved === 'dark' ? darkPalette.background.default : lightPalette.background.default;
    document.querySelectorAll('meta[name="theme-color"]').forEach((meta) => meta.setAttribute('content', color));
  }, [resolved]);

  return null;
}
