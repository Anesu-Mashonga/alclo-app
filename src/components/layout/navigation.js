import Checkroom from '@mui/icons-material/Checkroom';
import CheckroomOutlined from '@mui/icons-material/CheckroomOutlined';
import Insights from '@mui/icons-material/Insights';
import InsightsOutlined from '@mui/icons-material/InsightsOutlined';
import LocalLaundryService from '@mui/icons-material/LocalLaundryService';
import LocalLaundryServiceOutlined from '@mui/icons-material/LocalLaundryServiceOutlined';
import Settings from '@mui/icons-material/Settings';
import SettingsOutlined from '@mui/icons-material/SettingsOutlined';
import Style from '@mui/icons-material/Style';
import StyleOutlined from '@mui/icons-material/StyleOutlined';
import Today from '@mui/icons-material/Today';
import TodayOutlined from '@mui/icons-material/TodayOutlined';

/**
 * Primary navigation. Shared by the sidebar, bottom navigation, command palette and the
 * shortcuts dialog. `icon` is the Outlined variant; `activeIcon` is used for the current page.
 * `hotkey` is the "go to" sequence registered by AppShell.
 */
export const NAV_ITEMS = [
  { id: 'today', to: '/', end: true, label: 'Today', icon: TodayOutlined, activeIcon: Today, hotkey: 'g t' },
  { id: 'wardrobe', to: '/wardrobe', label: 'Wardrobe', icon: CheckroomOutlined, activeIcon: Checkroom, hotkey: 'g w' },
  { id: 'outfits', to: '/outfits', label: 'Outfits', icon: StyleOutlined, activeIcon: Style, hotkey: 'g o' },
  {
    id: 'laundry',
    to: '/laundry',
    label: 'Laundry',
    icon: LocalLaundryServiceOutlined,
    activeIcon: LocalLaundryService,
    hotkey: 'g l',
  },
  { id: 'insights', to: '/insights', label: 'Insights', icon: InsightsOutlined, activeIcon: Insights, hotkey: 'g i' },
];

export const SETTINGS_ITEM = {
  id: 'settings',
  to: '/settings',
  label: 'Settings',
  icon: SettingsOutlined,
  activeIcon: Settings,
  hotkey: 'g s',
};

/** Accessible name for the Laundry link while the hamper has items: "Laundry, 7 in the hamper". */
export const hamperLabel = (label, count) => `${label}, ${count} in the hamper`;

/** Every destination, for the command palette. */
export const ALL_DESTINATIONS = [...NAV_ITEMS, SETTINGS_ITEM];

/**
 * Keyboard shortcuts, grouped for the shortcuts dialog. `keys` lists the keys to press in
 * order; 'mod' renders as Ctrl (or the Command symbol on Apple devices).
 */
export const SHORTCUT_GROUPS = [
  {
    title: 'General',
    shortcuts: [
      { keys: ['mod', 'K'], label: 'Search or jump to' },
      { keys: ['N'], label: 'Add an item' },
      { keys: ['/'], label: 'Search this page' },
      { keys: ['?'], label: 'Show keyboard shortcuts' },
      { keys: ['mod', 'Z'], label: 'Undo the last change' },
      { keys: ['Esc'], label: 'Close a dialog or drawer' },
    ],
  },
  {
    title: 'Go to',
    shortcuts: ALL_DESTINATIONS.map((item) => ({
      keys: item.hotkey.split(' ').map((key) => key.toUpperCase()),
      label: item.label,
      then: true,
    })),
  },
];
