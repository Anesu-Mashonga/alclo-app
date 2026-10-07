import { createBrowserRouter } from 'react-router';
import AppShell from '@/components/layout/AppShell';
import NotFoundRoute from './NotFoundRoute';
import {
  ForgotPasswordPage,
  InsightsPage,
  LaundryPage,
  LoginPage,
  OutfitsPage,
  SettingsPage,
  SignupPage,
  TodayPage,
  WardrobePage,
  WelcomePage,
} from './pages';
import RedirectIfAuthed from './RedirectIfAuthed';
import RequireAuth from './RequireAuth';
import RequireOnboarded, { RedirectIfOnboarded } from './RequireOnboarded';
import RootLayout from './RootLayout';
import RouteError from './RouteError';

/**
 * Route map (spec section 3).
 *
 *   /login /signup /forgot-password   anonymous only (signed-in people are sent on)
 *   /welcome                          signed in, not yet onboarded
 *   / /wardrobe /outfits /laundry /insights /settings   signed in + onboarded, inside AppShell
 *   *                                 404 (inside AppShell when signed in)
 *
 * Page errors render inside the shell; anything above the shell falls back to a full page.
 */
export const router = createBrowserRouter([
  {
    element: <RootLayout />,
    errorElement: <RouteError />,
    children: [
      {
        element: <RedirectIfAuthed />,
        children: [
          { path: 'login', element: <LoginPage /> },
          { path: 'signup', element: <SignupPage /> },
          { path: 'forgot-password', element: <ForgotPasswordPage /> },
        ],
      },
      {
        element: <RequireAuth />,
        children: [
          {
            element: <RedirectIfOnboarded />,
            children: [{ path: 'welcome', element: <WelcomePage /> }],
          },
          {
            element: <RequireOnboarded />,
            children: [
              {
                element: <AppShell />,
                children: [
                  {
                    errorElement: <RouteError inShell />,
                    children: [
                      { index: true, element: <TodayPage /> },
                      { path: 'wardrobe', element: <WardrobePage /> },
                      { path: 'outfits', element: <OutfitsPage /> },
                      { path: 'laundry', element: <LaundryPage /> },
                      { path: 'insights', element: <InsightsPage /> },
                      { path: 'settings', element: <SettingsPage /> },
                    ],
                  },
                ],
              },
            ],
          },
        ],
      },
      { path: '*', element: <NotFoundRoute /> },
    ],
  },
]);
