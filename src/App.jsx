import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext.jsx";
import { ThemeProvider } from "./contexts/ThemeContext.jsx";
import { SnackbarProvider } from "./contexts/SnackbarContext.jsx";
import RequireAuth from "./components/layout/RequireAuth.jsx";
import AppShell from "./components/layout/AppShell.jsx";
import Login from "./pages/auth/Login.jsx";
import Signup from "./pages/auth/Signup.jsx";
import Dashboard from "./pages/dashboard/Dashboard.jsx";
import Wardrobe from "./pages/wardrobe/Wardrobe.jsx";
import Explore from "./pages/explore/Explore.jsx";
import Laundry from "./pages/laundry/Laundry.jsx";
import Settings from "./pages/settings/Settings.jsx";
import NotFound from "./pages/NotFound.jsx";

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ThemeProvider>
          <SnackbarProvider>
            <Routes>
              {/* Public routes */}
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />

              {/* Protected routes */}
              <Route
                path="/app"
                element={
                  <RequireAuth>
                    <AppShell />
                  </RequireAuth>
                }
              >
                <Route index element={<Dashboard />} />
                <Route path="wardrobe" element={<Wardrobe />} />
                <Route path="explore" element={<Explore />} />
                <Route path="laundry" element={<Laundry />} />
                <Route path="settings" element={<Settings />} />
              </Route>

              {/* Redirect root */}
              <Route path="/" element={<Navigate to="/app" replace />} />

              {/* 404 */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </SnackbarProvider>
        </ThemeProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
