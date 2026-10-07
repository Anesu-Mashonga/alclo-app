import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import * as authService from '@/services/authService';
import { DB_KEY, ready } from '@/services/api/db';
import { SESSION_KEY } from '@/services/api/session';
import { queryClient } from '@/hooks/api/queryClient';

const AuthContext = createContext(null);

const ANONYMOUS = { user: null, status: 'anonymous' };

/**
 * Provides the signed-in user and auth actions.
 * - Bootstraps once: waits for the local database, then restores the session.
 * - Signing out (here, in another tab, or by an expired session) clears the query cache.
 * - Uses the shared queryClient directly, so it works above or below QueryClientProvider.
 */
export function AuthProvider({ children }) {
  const [state, setState] = useState({ user: null, status: 'loading' });
  const userIdRef = useRef(null);

  useEffect(() => {
    userIdRef.current = state.user?.id ?? null;
  }, [state.user]);

  const applyUser = useCallback((user) => {
    setState(user ? { user, status: 'authenticated' } : ANONYMOUS);
  }, []);

  const signOutLocally = useCallback(() => {
    queryClient.clear();
    setState(ANONYMOUS);
  }, []);

  // Bootstrap: seed the local database on first run, then restore the session.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        await ready();
        const user = await authService.getCurrentUser();
        if (!cancelled) applyUser(user);
      } catch {
        if (!cancelled) applyUser(null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [applyUser]);

  // Other tabs: a sign-out or sign-in there updates this tab; data changes refresh queries.
  useEffect(() => {
    if (typeof window === 'undefined') return undefined;
    const onStorage = (event) => {
      if (event.key === SESSION_KEY || event.key === null) {
        authService
          .getCurrentUser()
          .then((user) => {
            if ((user?.id ?? null) !== userIdRef.current) queryClient.clear();
            applyUser(user);
          })
          .catch(() => {});
      }
      if (event.key === DB_KEY) queryClient.invalidateQueries();
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, [applyUser]);

  // A 401 from any query or mutation means the session ended: sign out here too.
  useEffect(() => {
    const handle = (error) => {
      if (error?.status === 401 && error?.code === 'unauthorized' && userIdRef.current) {
        queueMicrotask(signOutLocally);
      }
    };
    const onEvent = (event) => {
      if (event?.type === 'updated' && event.action?.type === 'error') handle(event.action.error);
    };
    const unsubscribeQueries = queryClient.getQueryCache().subscribe(onEvent);
    const unsubscribeMutations = queryClient.getMutationCache().subscribe(onEvent);
    return () => {
      unsubscribeQueries();
      unsubscribeMutations();
    };
  }, [signOutLocally]);

  const login = useCallback(
    async (values) => {
      const { user } = await authService.login(values);
      queryClient.clear();
      applyUser(user);
      return user;
    },
    [applyUser],
  );

  const signup = useCallback(
    async (values) => {
      const { user } = await authService.signup(values);
      queryClient.clear();
      applyUser(user);
      return user;
    },
    [applyUser],
  );

  const logout = useCallback(async () => {
    try {
      await authService.logout();
    } finally {
      signOutLocally();
    }
  }, [signOutLocally]);

  const refreshUser = useCallback(async () => {
    const user = await authService.getCurrentUser();
    if ((user?.id ?? null) !== userIdRef.current) queryClient.clear();
    applyUser(user);
    return user;
  }, [applyUser]);

  /** Saves profile fields and/or `preferences`, then updates the user in context. */
  const updateUser = useCallback(
    async (patch = {}) => {
      const { preferences, ...profile } = patch;
      let user = null;
      if (Object.keys(profile).length > 0) user = await authService.updateProfile(profile);
      if (preferences && Object.keys(preferences).length > 0) user = await authService.updatePreferences(preferences);
      if (user) applyUser(user);
      return user;
    },
    [applyUser],
  );

  const updatePreferences = useCallback(
    async (patch) => {
      const user = await authService.updatePreferences(patch);
      applyUser(user);
      return user;
    },
    [applyUser],
  );

  const completeOnboarding = useCallback(
    async (values) => {
      const result = await authService.completeOnboarding(values);
      applyUser(result.user);
      return result;
    },
    [applyUser],
  );

  const deleteAccount = useCallback(
    async (values) => {
      const result = await authService.deleteAccount(values);
      signOutLocally();
      return result;
    },
    [signOutLocally],
  );

  const value = useMemo(
    () => ({
      user: state.user,
      status: state.status,
      login,
      signup,
      logout,
      refreshUser,
      updateUser,
      updatePreferences,
      completeOnboarding,
      deleteAccount,
    }),
    [state, login, signup, logout, refreshUser, updateUser, updatePreferences, completeOnboarding, deleteAccount],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/**
 * Auth state and actions:
 * { user, status: 'loading'|'authenticated'|'anonymous', login(values), signup(values), logout(),
 *   refreshUser(), updateUser(patch), updatePreferences(patch), completeOnboarding(values), deleteAccount(values) }
 * login and signup throw ApiError (with fieldErrors on 422) for forms to display.
 */
// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside <AuthProvider>.');
  return context;
}
