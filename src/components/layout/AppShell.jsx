import { useTheme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';
import { lazy, Suspense, useEffect, useState } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router';
import cx from '@/components/common/cx';
import PageSkeleton from '@/components/common/PageSkeleton';
import { useUI } from '@/context/UIContext';
import useHotkeys from '@/hooks/useHotkeys';
import useItemDrawer from '@/hooks/useItemDrawer';
import useLocalStorage from '@/hooks/useLocalStorage';
import { preloadAppPages } from '@/routes/pages';
import MobileNav from './MobileNav';
import { ALL_DESTINATIONS } from './navigation';
import SideNav from './SideNav';
import SkipLink from './SkipLink';
import TopBar from './TopBar';
import './AppShell.scss';

// Global overlays load on first use so the shell stays light.
const loadItemDetailDrawer = () => import('@/components/wardrobe/ItemDetailDrawer');
const loadItemFormDialog = () => import('@/components/wardrobe/ItemFormDialog');
const loadCommandPalette = () => import('@/components/command/CommandPalette');
const loadShortcutsDialog = () => import('@/components/command/ShortcutsDialog');
const ItemDetailDrawer = lazy(loadItemDetailDrawer);
const ItemFormDialog = lazy(loadItemFormDialog);
const CommandPalette = lazy(loadCommandPalette);
const ShortcutsDialog = lazy(loadShortcutsDialog);

const SIDEBAR_STORAGE_KEY = 'alclo.sidebar';

/** Mount an overlay once it has been opened, then keep it mounted for its exit transition. */
function useMountOnFirstOpen(open) {
  const [mounted, setMounted] = useState(open);
  if (open && !mounted) setMounted(true);
  return mounted;
}

function GlobalOverlays() {
  const ui = useUI();
  const { itemId, closeItem } = useItemDrawer();
  const drawerMounted = useMountOnFirstOpen(Boolean(itemId));
  const formMounted = useMountOnFirstOpen(ui.itemForm.open);
  const paletteMounted = useMountOnFirstOpen(ui.commandPaletteOpen);
  const shortcutsMounted = useMountOnFirstOpen(ui.shortcutsOpen);

  // Warm the page and overlay chunks while the browser is idle so navigation feels instant.
  useEffect(() => {
    const preload = () => {
      preloadAppPages();
      loadCommandPalette();
      loadItemFormDialog();
      loadItemDetailDrawer();
      loadShortcutsDialog();
    };
    if ('requestIdleCallback' in window) {
      const handle = window.requestIdleCallback(preload, { timeout: 4000 });
      return () => window.cancelIdleCallback(handle);
    }
    const timer = window.setTimeout(preload, 1500);
    return () => window.clearTimeout(timer);
  }, []);

  return (
    <Suspense fallback={null}>
      {drawerMounted ? <ItemDetailDrawer itemId={itemId} onClose={closeItem} /> : null}
      {formMounted ? (
        <ItemFormDialog
          open={ui.itemForm.open}
          mode={ui.itemForm.mode}
          itemId={ui.itemForm.itemId}
          defaults={ui.itemForm.defaults}
          onClose={ui.closeItemForm}
        />
      ) : null}
      {paletteMounted ? <CommandPalette open={ui.commandPaletteOpen} onClose={ui.closeCommandPalette} /> : null}
      {shortcutsMounted ? <ShortcutsDialog open={ui.shortcutsOpen} onClose={ui.closeShortcuts} /> : null}
    </Suspense>
  );
}

function useGlobalHotkeys() {
  const ui = useUI();
  const navigate = useNavigate();

  // Ctrl/Cmd+K works everywhere, even while typing, and toggles the palette.
  useHotkeys({ 'mod+k': () => ui.toggleCommandPalette() }, { allowInInputs: true });

  const goTo = Object.fromEntries(ALL_DESTINATIONS.map((item) => [item.hotkey, () => navigate(item.to)]));

  useHotkeys(
    {
      n: () => ui.openItemForm({ mode: 'create' }),
      '?': () => ui.openShortcuts(),
      '/': () => {
        // Pages with a search box listen for this event and call preventDefault() to claim it.
        const event = new CustomEvent('alclo:focus-search', { cancelable: true });
        window.dispatchEvent(event);
        if (!event.defaultPrevented) ui.openCommandPalette();
      },
      ...goTo,
    },
    { ignoreInOverlays: true },
  );
}

/**
 * Authenticated app frame: skip link, navigation (sidebar, rail or bottom bar), top bar,
 * the main content column, global overlays and global keyboard shortcuts.
 * Renders `children` when given, otherwise the matched child route.
 */
export default function AppShell({ children }) {
  const theme = useTheme();
  const isDesktop = useMediaQuery(theme.breakpoints.up('md'), { noSsr: true });
  const isWide = useMediaQuery(theme.breakpoints.up('lg'), { noSsr: true });
  const [sidebar, setSidebar] = useLocalStorage(SIDEBAR_STORAGE_KEY, 'expanded');
  const { pathname } = useLocation();

  const collapsed = sidebar === 'collapsed';
  const navVariant = isWide && !collapsed ? 'full' : 'rail';
  const toggleSidebar = () => setSidebar(collapsed ? 'expanded' : 'collapsed');

  useGlobalHotkeys();

  // Remount the page wrapper per top-level path so its fade-in plays on navigation.
  const pageKey = pathname.split('/')[1] || 'today';

  return (
    <div className={cx('app-shell', isDesktop ? `app-shell--${navVariant}` : 'app-shell--mobile')}>
      <SkipLink />
      {isDesktop ? <SideNav variant={navVariant} canCollapse={isWide} onToggleCollapse={toggleSidebar} /> : null}
      <div className="app-shell__column">
        <TopBar variant={isDesktop ? 'desktop' : 'mobile'} />
        <main id="main-content" className="app-shell__main" tabIndex={-1}>
          <div className="app-shell__content">
            <Suspense key={pageKey} fallback={<PageSkeleton />}>
              <div className="app-shell__page">{children ?? <Outlet />}</div>
            </Suspense>
          </div>
        </main>
      </div>
      {isDesktop ? null : <MobileNav />}
      <GlobalOverlays />
    </div>
  );
}
