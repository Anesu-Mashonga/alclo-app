import CodeOutlined from '@mui/icons-material/CodeOutlined';
import LockOutlined from '@mui/icons-material/LockOutlined';
import PersonOutlineOutlined from '@mui/icons-material/PersonOutlineOutlined';
import StorageOutlined from '@mui/icons-material/StorageOutlined';
import TuneOutlined from '@mui/icons-material/TuneOutlined';

/**
 * Settings sections, in navigation order. The active one lives in `?section=`.
 * `keywords` feed the command palette so "password" or "city" finds the right section.
 */
export const SETTINGS_SECTIONS = [
  {
    id: 'profile',
    label: 'Profile',
    description: 'Name, email and avatar',
    icon: PersonOutlineOutlined,
    keywords: ['name', 'email', 'avatar', 'photo'],
  },
  {
    id: 'preferences',
    label: 'Preferences',
    description: 'Theme, weather and laundry',
    icon: TuneOutlined,
    keywords: ['theme', 'dark', 'light', 'city', 'weather', 'celsius', 'fahrenheit', 'occasion', 'urgent'],
  },
  {
    id: 'data',
    label: 'Data',
    description: 'Export and sample data',
    icon: StorageOutlined,
    keywords: ['export', 'download', 'json', 'sample', 'reset', 'demo'],
  },
  {
    id: 'developer',
    label: 'Developer',
    description: 'Latency and failures',
    icon: CodeOutlined,
    keywords: ['latency', 'slow', 'failure', 'errors', 'loading'],
  },
  {
    id: 'account',
    label: 'Account',
    description: 'Password and sign out',
    icon: LockOutlined,
    keywords: ['password', 'sign out', 'delete', 'security'],
  },
];

export const DEFAULT_SECTION = 'profile';

/** The section id for a `?section=` value, falling back to Profile. */
export function resolveSection(value) {
  return SETTINGS_SECTIONS.some((section) => section.id === value) ? value : DEFAULT_SECTION;
}

/** Link target for a section, keeping the path relative to /settings. */
export const sectionHref = (id) => (id === DEFAULT_SECTION ? '/settings' : `/settings?section=${id}`);
