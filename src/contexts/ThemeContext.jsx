import React, { createContext, useContext, useState, useEffect } from "react";
import { useAuth } from "./AuthContext.jsx";
import { ThemeProvider as MuiThemeProvider, CssBaseline } from "@mui/material";
import { lightTheme, darkTheme } from "../styles/theme.js";

const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
  const { user, updatePreferences } = useAuth();
  const [darkMode, setDarkMode] = useState(
    () => user?.preferences?.darkMode ?? false,
  );

  useEffect(() => {
    if (user?.preferences?.darkMode !== undefined) {
      setDarkMode(user.preferences.darkMode);
    }
  }, [user?.preferences?.darkMode]);

  const toggleDarkMode = async () => {
    const next = !darkMode;
    setDarkMode(next);
    if (user) {
      await updatePreferences({ darkMode: next });
    }
  };

  return (
    <ThemeContext.Provider value={{ darkMode, toggleDarkMode }}>
      <MuiThemeProvider theme={darkMode ? darkTheme : lightTheme}>
        <CssBaseline />
        {children}
      </MuiThemeProvider>
    </ThemeContext.Provider>
  );
}

export const useThemeMode = () => {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useThemeMode must be used inside ThemeProvider");
  return ctx;
};
