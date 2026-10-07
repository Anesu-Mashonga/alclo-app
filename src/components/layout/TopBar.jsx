import AddOutlined from '@mui/icons-material/AddOutlined';
import SearchOutlined from '@mui/icons-material/SearchOutlined';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import useScrollTrigger from '@mui/material/useScrollTrigger';
import { Link } from 'react-router';
import cx from '@/components/common/cx';
import Kbd from '@/components/common/Kbd';
import ThemeToggle from '@/components/common/ThemeToggle';
import { useUI } from '@/context/UIContext';
import { IS_MAC, MOD_KEY_LABEL } from '@/hooks/useHotkeys';
import AccountMenu from './AccountMenu';
import Logo from './Logo';
import './TopBar.scss';

function SearchTrigger({ onClick }) {
  return (
    <button
      type="button"
      className="top-bar__search"
      onClick={onClick}
      aria-label="Search or jump to"
      aria-keyshortcuts={IS_MAC ? 'Meta+K' : 'Control+K'}
      aria-haspopup="dialog"
    >
      <SearchOutlined className="top-bar__search-icon" aria-hidden />
      <span className="top-bar__search-text">Search or jump to</span>
      <span className="top-bar__search-keys" aria-hidden="true">
        <Kbd>{MOD_KEY_LABEL}</Kbd>
        <Kbd>K</Kbd>
      </span>
    </button>
  );
}

/**
 * App bar at the top of the content column.
 * - variant "desktop" (md and up): search field trigger, Add item, theme toggle, account menu. 64px.
 * - variant "mobile" (below md): logo, search, add and account icons. 56px.
 * Gains a hairline border once the page scrolls.
 */
export default function TopBar({ variant = 'desktop' }) {
  const { openCommandPalette, openItemForm } = useUI();
  const scrolled = useScrollTrigger({ disableHysteresis: true, threshold: 4 });
  const addItem = () => openItemForm({ mode: 'create' });

  if (variant === 'mobile') {
    return (
      <header className={cx('top-bar', 'top-bar--mobile', scrolled && 'top-bar--scrolled')}>
        <Link to="/" className="top-bar__home" aria-label="Alclo, go to Today">
          <Logo size="sm" />
        </Link>
        <div className="top-bar__actions">
          <Tooltip title="Search">
            <IconButton aria-label="Search or jump to" aria-haspopup="dialog" onClick={openCommandPalette}>
              <SearchOutlined />
            </IconButton>
          </Tooltip>
          <Tooltip title="Add item">
            <IconButton aria-label="Add item" onClick={addItem}>
              <AddOutlined />
            </IconButton>
          </Tooltip>
          <AccountMenu showThemeItem />
        </div>
      </header>
    );
  }

  return (
    <header className={cx('top-bar', 'top-bar--desktop', scrolled && 'top-bar--scrolled')}>
      <SearchTrigger onClick={openCommandPalette} />
      <div className="top-bar__actions">
        <Button
          variant="contained"
          startIcon={<AddOutlined />}
          onClick={addItem}
          aria-keyshortcuts="N"
          className="top-bar__add"
        >
          Add item
        </Button>
        <ThemeToggle />
        <AccountMenu />
      </div>
    </header>
  );
}
