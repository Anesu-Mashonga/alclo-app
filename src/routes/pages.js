import { lazy } from 'react';

/*
 * Route-level code splitting. Each page is its own chunk; `preloadAppPages` warms the main
 * pages while the browser is idle after sign-in so later navigation does not wait on the network.
 */
const loaders = {
  today: () => import('@/pages/TodayPage'),
  wardrobe: () => import('@/pages/WardrobePage'),
  outfits: () => import('@/pages/OutfitsPage'),
  laundry: () => import('@/pages/LaundryPage'),
  insights: () => import('@/pages/InsightsPage'),
  settings: () => import('@/pages/SettingsPage'),
  notFound: () => import('@/pages/NotFoundPage'),
  login: () => import('@/pages/auth/LoginPage'),
  signup: () => import('@/pages/auth/SignupPage'),
  forgotPassword: () => import('@/pages/auth/ForgotPasswordPage'),
  welcome: () => import('@/pages/auth/WelcomePage'),
};

export const TodayPage = lazy(loaders.today);
export const WardrobePage = lazy(loaders.wardrobe);
export const OutfitsPage = lazy(loaders.outfits);
export const LaundryPage = lazy(loaders.laundry);
export const InsightsPage = lazy(loaders.insights);
export const SettingsPage = lazy(loaders.settings);
export const NotFoundPage = lazy(loaders.notFound);
export const LoginPage = lazy(loaders.login);
export const SignupPage = lazy(loaders.signup);
export const ForgotPasswordPage = lazy(loaders.forgotPassword);
export const WelcomePage = lazy(loaders.welcome);

/** Fetch the main app page chunks in the background (safe to call more than once). */
export function preloadAppPages() {
  [loaders.today, loaders.wardrobe, loaders.outfits, loaders.laundry, loaders.insights, loaders.settings].forEach(
    (load) => {
      load().catch(() => {
        // A failed preload is retried by the real navigation; nothing to report here.
      });
    },
  );
}
