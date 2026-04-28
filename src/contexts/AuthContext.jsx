import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import { authService } from "../services/authService.js";
import { wardrobeService } from "../services/wardrobeService.js";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const current = authService.getCurrentUser();
    setUser(current);
    if (current) {
      wardrobeService.seedInitialDataIfEmpty();
    }
    setLoading(false);
  }, []);

  const login = useCallback(async (credentials) => {
    const res = await authService.login(credentials);
    if (res.success) {
      setUser(res.data.user);
      wardrobeService.seedInitialDataIfEmpty();
    }
    return res;
  }, []);

  const signup = useCallback(async (payload) => {
    return authService.signup(payload);
  }, []);

  const logout = useCallback(async () => {
    await authService.logout();
    setUser(null);
  }, []);

  const updatePreferences = useCallback(
    async (prefs) => {
      if (!user) return;
      const res = await authService.updateUserPreferences(user.id, prefs);
      if (res.success) setUser(res.data.user);
      return res;
    },
    [user],
  );

  const updateProfile = useCallback(
    async (updates) => {
      if (!user) return;
      const res = await authService.updateProfile(user.id, updates);
      if (res.success) setUser(res.data.user);
      return res;
    },
    [user],
  );

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        signup,
        logout,
        updatePreferences,
        updateProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
};
