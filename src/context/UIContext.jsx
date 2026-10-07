import { createContext, useCallback, useContext, useMemo, useState } from 'react';

const UIContext = createContext(null);

const CLOSED_FORM = { open: false, mode: 'create', itemId: null, defaults: null };

/**
 * App-wide UI state for the global overlays that AppShell mounts:
 * the item form dialog, the command palette and the keyboard shortcuts dialog.
 */
export function UIProvider({ children }) {
  const [itemForm, setItemForm] = useState(CLOSED_FORM);
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const [shortcutsOpen, setShortcutsOpen] = useState(false);

  /** @param {{ mode: 'create', defaults?: object } | { mode: 'edit', itemId: string }} [options] */
  const openItemForm = useCallback((options = { mode: 'create' }) => {
    const mode = options.mode === 'edit' ? 'edit' : 'create';
    setCommandPaletteOpen(false);
    setItemForm({
      open: true,
      mode,
      itemId: mode === 'edit' ? (options.itemId ?? null) : null,
      defaults: options.defaults ?? null,
    });
  }, []);

  // Keep mode and itemId while the dialog plays its exit transition.
  const closeItemForm = useCallback(() => setItemForm((current) => ({ ...current, open: false })), []);

  const openCommandPalette = useCallback(() => setCommandPaletteOpen(true), []);
  const closeCommandPalette = useCallback(() => setCommandPaletteOpen(false), []);
  const toggleCommandPalette = useCallback(() => setCommandPaletteOpen((open) => !open), []);

  const openShortcuts = useCallback(() => {
    setCommandPaletteOpen(false);
    setShortcutsOpen(true);
  }, []);
  const closeShortcuts = useCallback(() => setShortcutsOpen(false), []);

  const value = useMemo(
    () => ({
      itemForm,
      openItemForm,
      closeItemForm,
      commandPaletteOpen,
      openCommandPalette,
      closeCommandPalette,
      toggleCommandPalette,
      shortcutsOpen,
      openShortcuts,
      closeShortcuts,
    }),
    [
      itemForm,
      openItemForm,
      closeItemForm,
      commandPaletteOpen,
      openCommandPalette,
      closeCommandPalette,
      toggleCommandPalette,
      shortcutsOpen,
      openShortcuts,
      closeShortcuts,
    ],
  );

  return <UIContext.Provider value={value}>{children}</UIContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useUI() {
  const context = useContext(UIContext);
  if (!context) throw new Error('useUI must be used inside <UIProvider>.');
  return context;
}
