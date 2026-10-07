import CssBaseline from '@mui/material/CssBaseline';
import { StyledEngineProvider, ThemeProvider } from '@mui/material/styles';
import { QueryClientProvider } from '@tanstack/react-query';
import { MotionConfig } from 'motion/react';
import { RouterProvider } from 'react-router/dom';
import ThemeColorMeta from '@/components/layout/ThemeColorMeta';
import { AuthProvider } from '@/context/AuthContext';
import { ConfirmProvider } from '@/context/ConfirmContext';
import { ToastProvider } from '@/context/ToastContext';
import { UIProvider } from '@/context/UIContext';
import { queryClient } from '@/hooks/api/queryClient';
import { router } from '@/routes/router';
import theme, { COLOR_MODE_STORAGE_KEY } from '@/theme/theme';

/**
 * Provider stack. Order matters:
 * - StyledEngineProvider enableCssLayer wraps every MUI style in `@layer mui`, so plain
 *   component SCSS (unlayered) always overrides MUI without specificity fights.
 * - AuthProvider sits under QueryClientProvider because logout clears the query cache.
 * - Toast and Confirm sit outside the router so services, auth and pages can all use them.
 */
export default function App() {
  return (
    <StyledEngineProvider enableCssLayer>
      <ThemeProvider
        theme={theme}
        defaultMode="system"
        modeStorageKey={COLOR_MODE_STORAGE_KEY}
        disableTransitionOnChange
        noSsr
      >
        <CssBaseline enableColorScheme />
        <ThemeColorMeta />
        <QueryClientProvider client={queryClient}>
          <MotionConfig reducedMotion="user">
            <ToastProvider>
              <ConfirmProvider>
                <AuthProvider>
                  <UIProvider>
                    <RouterProvider router={router} />
                  </UIProvider>
                </AuthProvider>
              </ConfirmProvider>
            </ToastProvider>
          </MotionConfig>
        </QueryClientProvider>
      </ThemeProvider>
    </StyledEngineProvider>
  );
}
