import React, { useState } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Switch,
  FormControlLabel,
  Button,
  Divider,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Avatar,
  TextField,
  CircularProgress,
} from "@mui/material";
import {
  LogoutRounded,
  DeleteForeverRounded,
  DarkModeRounded,
  RestoreRounded,
} from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext.jsx";
import { useThemeMode } from "../../contexts/ThemeContext.jsx";
import { useSnackbar } from "../../contexts/SnackbarContext.jsx";
import { OCCASIONS } from "../../data/seed.js";
import { KEYS, setToStorage } from "../../services/storage.js";
import { SEED_WARDROBE } from "../../data/seed.js";
import { v4 as uuidv4 } from "uuid";
import PageContainer from "../../components/common/PageContainer.jsx";
import ConfirmDialog from "../../components/common/ConfirmDialog.jsx";
import "./Settings.scss";

function SettingsSection({ title, children }) {
  return (
    <Card className="settings-card" elevation={0}>
      <CardContent>
        <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 2 }}>
          {title}
        </Typography>
        {children}
      </CardContent>
    </Card>
  );
}

export default function Settings() {
  const { user, logout, updatePreferences, updateProfile } = useAuth();
  const { darkMode, toggleDarkMode } = useThemeMode();
  const { show } = useSnackbar();
  const navigate = useNavigate();
  const [logoutConfirm, setLogoutConfirm] = useState(false);
  const [resetConfirm, setResetConfirm] = useState(false);
  const [name, setName] = useState(user?.name ?? "");
  const [savingProfile, setSavingProfile] = useState(false);

  const handleOccasionChange = async (occasion) => {
    await updatePreferences({ defaultOccasion: occasion });
    show("Default occasion updated.", "success");
  };

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const handleReset = () => {
    setToStorage(
      KEYS.WARDROBE,
      SEED_WARDROBE.map((i) => ({ ...i, id: uuidv4() })),
    );
    setToStorage(KEYS.OUTFIT_HISTORY, []);
    show("App data has been reset to defaults.", "info");
    setResetConfirm(false);
  };

  const handleSaveProfile = async () => {
    if (!name.trim()) {
      show("Name cannot be empty.", "error");
      return;
    }
    setSavingProfile(true);
    await updateProfile({ name: name.trim() });
    setSavingProfile(false);
    show("Profile updated!", "success");
  };

  return (
    <PageContainer
      title="Settings"
      subtitle="Manage your account and preferences"
    >
      <Box className="settings-layout">
        {/* Profile */}
        <SettingsSection title="Profile">
          <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 3 }}>
            <Avatar
              src={user?.avatar}
              alt={user?.name}
              sx={{ width: 64, height: 64 }}
            />
            <Box>
              <Typography variant="subtitle2" fontWeight={600}>
                {user?.name}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {user?.email}
              </Typography>
            </Box>
          </Box>
          <TextField
            fullWidth
            label="Display name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            size="small"
            sx={{ mb: 2 }}
          />
          <Button
            variant="contained"
            onClick={handleSaveProfile}
            disabled={savingProfile}
            size="small"
          >
            {savingProfile ? (
              <CircularProgress size={18} color="inherit" />
            ) : (
              "Save Profile"
            )}
          </Button>
        </SettingsSection>

        {/* Appearance */}
        <SettingsSection title="Appearance">
          <FormControlLabel
            control={
              <Switch
                checked={darkMode}
                onChange={toggleDarkMode}
                inputProps={{ "aria-label": "Toggle dark mode" }}
              />
            }
            label={
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <DarkModeRounded fontSize="small" />
                <span>Dark Mode</span>
              </Box>
            }
          />
        </SettingsSection>

        {/* Preferences */}
        <SettingsSection title="Preferences">
          <FormControl fullWidth size="small">
            <InputLabel>Default Occasion</InputLabel>
            <Select
              value={user?.preferences?.defaultOccasion ?? "casual"}
              onChange={(e) => handleOccasionChange(e.target.value)}
              label="Default Occasion"
            >
              {OCCASIONS.map((o) => (
                <MenuItem key={o.value} value={o.value}>
                  {o.icon} {o.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </SettingsSection>

        {/* Danger Zone */}
        <SettingsSection title="Data & Account">
          <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
            <Button
              variant="outlined"
              color="warning"
              startIcon={<RestoreRounded />}
              onClick={() => setResetConfirm(true)}
              fullWidth
            >
              Reset App Data to Defaults
            </Button>
            <Divider />
            <Button
              variant="outlined"
              color="error"
              startIcon={<LogoutRounded />}
              onClick={() => setLogoutConfirm(true)}
              fullWidth
            >
              Log Out
            </Button>
          </Box>
        </SettingsSection>

        {/* About */}
        <Card className="settings-card" elevation={0}>
          <CardContent>
            <Typography variant="subtitle1" fontWeight={700} gutterBottom>
              About Alclo
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Alclo v1.0.0 — Your AI wardrobe assistant.
              <br />
              Built with React, MUI, and SCSS.
              <br />
              Demo mode: all data is stored locally in your browser.
            </Typography>
          </CardContent>
        </Card>
      </Box>

      <ConfirmDialog
        open={logoutConfirm}
        title="Log out?"
        message="You will be returned to the login screen."
        onConfirm={handleLogout}
        onCancel={() => setLogoutConfirm(false)}
        confirmLabel="Log Out"
        confirmColor="error"
      />

      <ConfirmDialog
        open={resetConfirm}
        title="Reset app data?"
        message="This will restore the default wardrobe dataset and clear your outfit history. Your account will remain."
        onConfirm={handleReset}
        onCancel={() => setResetConfirm(false)}
        confirmLabel="Reset Data"
        confirmColor="warning"
      />
    </PageContainer>
  );
}
