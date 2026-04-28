import React, { useState } from "react";
import { Outlet, useNavigate, useLocation, Link } from "react-router-dom";
import {
  AppBar,
  Toolbar,
  IconButton,
  Typography,
  Avatar,
  Box,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  BottomNavigation,
  BottomNavigationAction,
  Tooltip,
  Menu,
  MenuItem,
  Divider,
  useMediaQuery,
  useTheme,
  Badge,
} from "@mui/material";
import {
  HomeRounded,
  CheckroomRounded,
  ExploreRounded,
  LocalLaundryServiceRounded,
  SettingsRounded,
  DarkModeRounded,
  LightModeRounded,
  MenuRounded,
  LogoutRounded,
  PersonRounded,
  NotificationsNoneRounded,
} from "@mui/icons-material";
import { useAuth } from "../../contexts/AuthContext.jsx";
import { useThemeMode } from "../../contexts/ThemeContext.jsx";
import "./AppShell.scss";

const NAV_ITEMS = [
  { label: "Home", icon: <HomeRounded />, path: "/app" },
  { label: "Wardrobe", icon: <CheckroomRounded />, path: "/app/wardrobe" },
  { label: "Explore", icon: <ExploreRounded />, path: "/app/explore" },
  {
    label: "Laundry",
    icon: <LocalLaundryServiceRounded />,
    path: "/app/laundry",
  },
  { label: "Settings", icon: <SettingsRounded />, path: "/app/settings" },
];

const DRAWER_WIDTH = 240;

export default function AppShell() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const { user, logout } = useAuth();
  const { darkMode, toggleDarkMode } = useThemeMode();
  const navigate = useNavigate();
  const location = useLocation();

  const activeIndex = NAV_ITEMS.findIndex((item) =>
    item.path === "/app"
      ? location.pathname === "/app"
      : location.pathname.startsWith(item.path),
  );

  const handleLogout = async () => {
    setAnchorEl(null);
    await logout();
    navigate("/login");
  };

  const sidebarContent = (
    <Box className="sidebar">
      <Box className="sidebar__brand">
        <Typography variant="h5" fontWeight={800} color="primary">
          alclo
        </Typography>
        <Typography variant="caption" color="text.secondary">
          Wardrobe Assistant
        </Typography>
      </Box>
      <Divider />
      <List className="sidebar__nav">
        {NAV_ITEMS.map((item) => {
          const active =
            item.path === "/app"
              ? location.pathname === "/app"
              : location.pathname.startsWith(item.path);
          return (
            <ListItem key={item.path} disablePadding>
              <ListItemButton
                component={Link}
                to={item.path}
                onClick={() => setDrawerOpen(false)}
                className={`sidebar__nav-item ${active ? "sidebar__nav-item--active" : ""}`}
                aria-current={active ? "page" : undefined}
              >
                <ListItemIcon className="sidebar__nav-icon">
                  {item.icon}
                </ListItemIcon>
                <ListItemText primary={item.label} />
              </ListItemButton>
            </ListItem>
          );
        })}
      </List>
      <Box className="sidebar__footer">
        <Divider />
        <Box className="sidebar__user">
          <Avatar
            src={user?.avatar}
            alt={user?.name}
            sx={{ width: 36, height: 36 }}
          />
          <Box sx={{ ml: 1.5, minWidth: 0 }}>
            <Typography variant="body2" fontWeight={600} noWrap>
              {user?.name}
            </Typography>
            <Typography variant="caption" color="text.secondary" noWrap>
              {user?.email}
            </Typography>
          </Box>
        </Box>
      </Box>
    </Box>
  );

  return (
    <Box className="app-shell">
      {/* AppBar */}
      <AppBar position="fixed" elevation={0} className="app-bar">
        <Toolbar className="app-bar__toolbar">
          {isMobile && (
            <IconButton
              edge="start"
              onClick={() => setDrawerOpen(true)}
              aria-label="Open navigation menu"
              sx={{ mr: 1 }}
            >
              <MenuRounded />
            </IconButton>
          )}
          <Typography
            variant="h6"
            fontWeight={800}
            color="primary"
            sx={{ flexGrow: 1, letterSpacing: "-0.02em" }}
          >
            alclo
          </Typography>

          <Tooltip
            title={darkMode ? "Switch to light mode" : "Switch to dark mode"}
          >
            <IconButton onClick={toggleDarkMode} aria-label="Toggle dark mode">
              {darkMode ? <LightModeRounded /> : <DarkModeRounded />}
            </IconButton>
          </Tooltip>

          <IconButton
            onClick={(e) => setAnchorEl(e.currentTarget)}
            aria-label="Open user menu"
            aria-haspopup="true"
          >
            <Avatar
              src={user?.avatar}
              alt={user?.name}
              sx={{ width: 32, height: 32 }}
            />
          </IconButton>

          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={() => setAnchorEl(null)}
            transformOrigin={{ horizontal: "right", vertical: "top" }}
            anchorOrigin={{ horizontal: "right", vertical: "bottom" }}
            PaperProps={{ sx: { mt: 1, minWidth: 180, borderRadius: 3 } }}
          >
            <Box sx={{ px: 2, py: 1.5 }}>
              <Typography variant="body2" fontWeight={600}>
                {user?.name}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {user?.email}
              </Typography>
            </Box>
            <Divider />
            <MenuItem
              onClick={() => {
                setAnchorEl(null);
                navigate("/app/settings");
              }}
            >
              <PersonRounded fontSize="small" sx={{ mr: 1.5 }} />
              Settings
            </MenuItem>
            <MenuItem onClick={handleLogout} sx={{ color: "error.main" }}>
              <LogoutRounded fontSize="small" sx={{ mr: 1.5 }} />
              Logout
            </MenuItem>
          </Menu>
        </Toolbar>
      </AppBar>

      {/* Sidebar — desktop permanent, mobile temporary */}
      {!isMobile ? (
        <Drawer
          variant="permanent"
          PaperProps={{ className: "drawer-paper" }}
          sx={{ width: DRAWER_WIDTH, flexShrink: 0 }}
        >
          {sidebarContent}
        </Drawer>
      ) : (
        <Drawer
          variant="temporary"
          open={drawerOpen}
          onClose={() => setDrawerOpen(false)}
          PaperProps={{ className: "drawer-paper" }}
          ModalProps={{ keepMounted: true }}
        >
          {sidebarContent}
        </Drawer>
      )}

      {/* Main Content */}
      <Box
        component="main"
        className={`app-shell__main ${!isMobile ? "app-shell__main--with-sidebar" : ""}`}
      >
        <Toolbar /> {/* spacer */}
        <Box className="app-shell__content">
          <Outlet />
        </Box>
        {isMobile && <Box sx={{ height: 64 }} />} {/* bottom nav spacer */}
      </Box>

      {/* Bottom Navigation — mobile only */}
      {isMobile && (
        <BottomNavigation
          value={activeIndex}
          onChange={(_, newVal) => navigate(NAV_ITEMS[newVal].path)}
          className="bottom-nav"
          showLabels
        >
          {NAV_ITEMS.map((item) => (
            <BottomNavigationAction
              key={item.path}
              label={item.label}
              icon={item.icon}
              aria-label={item.label}
            />
          ))}
        </BottomNavigation>
      )}
    </Box>
  );
}
