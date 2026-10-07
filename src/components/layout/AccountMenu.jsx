import DarkModeOutlined from '@mui/icons-material/DarkModeOutlined';
import KeyboardOutlined from '@mui/icons-material/KeyboardOutlined';
import LightModeOutlined from '@mui/icons-material/LightModeOutlined';
import LogoutOutlined from '@mui/icons-material/LogoutOutlined';
import SettingsOutlined from '@mui/icons-material/SettingsOutlined';
import Divider from '@mui/material/Divider';
import IconButton from '@mui/material/IconButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import { useColorScheme } from '@mui/material/styles';
import Tooltip from '@mui/material/Tooltip';
import { useId, useState } from 'react';
import { Link } from 'react-router';
import Kbd from '@/components/common/Kbd';
import UserAvatar from '@/components/common/UserAvatar';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { useUI } from '@/context/UIContext';
import './AccountMenu.scss';

/**
 * Avatar button with the account menu: identity, Settings, Keyboard shortcuts, Sign out.
 * `showThemeItem` adds a light/dark switch (used on mobile, where the top bar has no theme toggle).
 */
export default function AccountMenu({ showThemeItem = false, size = 'medium' }) {
  const { user, logout } = useAuth();
  const { openShortcuts } = useUI();
  const toast = useToast();
  const { mode, systemMode, setMode } = useColorScheme();
  const [anchorEl, setAnchorEl] = useState(null);
  const [signingOut, setSigningOut] = useState(false);
  const buttonId = useId();
  const menuId = useId();
  const open = Boolean(anchorEl);
  const close = () => setAnchorEl(null);

  const resolvedMode = (mode === 'system' ? systemMode : mode) ?? 'light';
  const nextMode = resolvedMode === 'dark' ? 'light' : 'dark';

  const handleShortcuts = () => {
    close();
    openShortcuts();
  };

  const handleTheme = () => {
    setMode(nextMode);
    close();
  };

  // RequireAuth sends us to /login as soon as the session ends; the toast confirms it.
  const handleSignOut = async () => {
    if (signingOut) return;
    setSigningOut(true);
    close();
    try {
      await logout();
      toast.show({ message: 'Signed out' });
    } catch (error) {
      setSigningOut(false);
      toast.error(error?.message || 'Could not sign out. Try again.');
    }
  };

  return (
    <>
      <Tooltip title="Account">
        <IconButton
          id={buttonId}
          className="account-menu__trigger"
          size={size}
          aria-label={user?.name ? `Account menu for ${user.name}` : 'Account menu'}
          aria-haspopup="menu"
          aria-controls={open ? menuId : undefined}
          aria-expanded={open ? 'true' : undefined}
          onClick={(event) => setAnchorEl(event.currentTarget)}
        >
          <UserAvatar user={user} size={32} />
        </IconButton>
      </Tooltip>
      <Menu
        id={menuId}
        anchorEl={anchorEl}
        open={open}
        onClose={close}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        slotProps={{
          list: { 'aria-labelledby': buttonId },
          paper: { className: 'account-menu__paper' },
        }}
      >
        <div className="account-menu__identity" role="none">
          <UserAvatar user={user} size={40} />
          <div className="account-menu__who">
            <p className="account-menu__name">{user?.name ?? 'Your account'}</p>
            {user?.email ? <p className="account-menu__email">{user.email}</p> : null}
          </div>
        </div>
        <Divider />
        <MenuItem component={Link} to="/settings" onClick={close}>
          <ListItemIcon>
            <SettingsOutlined />
          </ListItemIcon>
          <ListItemText>Settings</ListItemText>
        </MenuItem>
        <MenuItem onClick={handleShortcuts}>
          <ListItemIcon>
            <KeyboardOutlined />
          </ListItemIcon>
          <ListItemText>Keyboard shortcuts</ListItemText>
          <Kbd aria-hidden="true">?</Kbd>
        </MenuItem>
        {showThemeItem ? (
          <MenuItem onClick={handleTheme}>
            <ListItemIcon>{nextMode === 'dark' ? <DarkModeOutlined /> : <LightModeOutlined />}</ListItemIcon>
            <ListItemText>{nextMode === 'dark' ? 'Use dark theme' : 'Use light theme'}</ListItemText>
          </MenuItem>
        ) : null}
        <Divider />
        <MenuItem onClick={handleSignOut} disabled={signingOut}>
          <ListItemIcon>
            <LogoutOutlined />
          </ListItemIcon>
          <ListItemText>Sign out</ListItemText>
        </MenuItem>
      </Menu>
    </>
  );
}
