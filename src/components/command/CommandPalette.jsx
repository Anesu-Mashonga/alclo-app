import AddOutlined from '@mui/icons-material/AddOutlined';
import DarkModeOutlined from '@mui/icons-material/DarkModeOutlined';
import KeyboardOutlined from '@mui/icons-material/KeyboardOutlined';
import KeyboardReturnOutlined from '@mui/icons-material/KeyboardReturnOutlined';
import LightModeOutlined from '@mui/icons-material/LightModeOutlined';
import LocalLaundryServiceOutlined from '@mui/icons-material/LocalLaundryServiceOutlined';
import LogoutOutlined from '@mui/icons-material/LogoutOutlined';
import SearchOutlined from '@mui/icons-material/SearchOutlined';
import StyleOutlined from '@mui/icons-material/StyleOutlined';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import Skeleton from '@mui/material/Skeleton';
import { useColorScheme } from '@mui/material/styles';
import { createElement, useEffect, useId, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router';
import cx from '@/components/common/cx';
import ItemThumb from '@/components/common/ItemThumb';
import Kbd from '@/components/common/Kbd';
import StatusBadge from '@/components/common/StatusBadge';
import { ALL_DESTINATIONS } from '@/components/layout/navigation';
import { SETTINGS_SECTIONS, sectionHref } from '@/components/settings/settingsSections';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { useUI } from '@/context/UIContext';
import { colorLabel, getCategory, occasionLabel, typeLabel } from '@/data/taxonomy';
import { useItems, useLaundry, useLaundryAction, useOutfits } from '@/hooks/api';
import useDebouncedValue from '@/hooks/useDebouncedValue';
import useItemDrawer from '@/hooks/useItemDrawer';
import { formatCount } from '@/lib/format';
import { matchRank, matchesTerms, termsOf } from './paletteSearch';
import './CommandPalette.scss';

const PAGE_KEYWORDS = {
  today: ['home', 'outfit', 'weather', 'recommendation'],
  wardrobe: ['clothes', 'pieces', 'items', 'closet'],
  outfits: ['saved', 'ideas', 'planner', 'week', 'plan'],
  laundry: ['hamper', 'wash', 'clean', 'dirty'],
  insights: ['stats', 'charts', 'most worn', 'cost per wear'],
  settings: ['preferences', 'profile', 'account'],
};

const SECTION_LABELS = {
  profile: 'Profile settings',
  preferences: 'Preferences',
  data: 'Data and export',
  developer: 'Developer settings',
  account: 'Account and password',
};

const MAX_PIECES = 6;
const MAX_OUTFITS = 4;

const hotkeyLabel = (hotkey) => hotkey.split(' ').map((key) => key.toUpperCase());

/** Sorts matches so labels that start with the query come first, keeping the original order otherwise. */
function rankOptions(options, terms) {
  if (terms.length === 0) return options;
  return options
    .filter((option) => matchesTerms(terms, option.label, option.keywords ?? []))
    .map((option, index) => ({ option, index, rank: matchRank(terms, option.label) }))
    .sort((a, b) => a.rank - b.rank || a.index - b.index)
    .map((entry) => entry.option);
}

function OptionIcon({ icon }) {
  return (
    <span className="command-palette__icon" aria-hidden>
      {createElement(icon, { fontSize: 'inherit' })}
    </span>
  );
}

/**
 * Global command palette (Ctrl/Cmd+K): search pages, actions, wardrobe pieces and saved outfits.
 * Combobox + listbox pattern: focus stays in the input, Up/Down move the active option
 * (aria-activedescendant), Enter runs it, Esc closes. Hovering an option makes it active.
 */
export default function CommandPalette({ open, onClose }) {
  const navigate = useNavigate();
  const ui = useUI();
  const toast = useToast();
  const { logout } = useAuth();
  const { openItem } = useItemDrawer();
  const { mode, systemMode, setMode } = useColorScheme();
  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);
  const listRef = useRef(null);
  const inputRef = useRef(null);
  const baseId = useId();
  const listboxId = `${baseId}-listbox`;

  const trimmed = query.trim();
  const debounced = useDebouncedValue(trimmed, 150);
  const searching = trimmed.length > 0;
  const terms = useMemo(() => termsOf(trimmed), [trimmed]);

  const items = useItems({ q: debounced }, { enabled: open && debounced.length > 0 });
  const outfits = useOutfits({ enabled: open && searching });
  const laundry = useLaundry({ enabled: open });
  const { startWash, restore } = useLaundryAction();

  const resolvedMode = (mode === 'system' || !mode ? systemMode : mode) ?? 'light';
  const nextMode = resolvedMode === 'dark' ? 'light' : 'dark';
  const hamperIds = (laundry.data?.hamper ?? []).map((item) => item.id);

  const startLoad = () => {
    if (hamperIds.length === 0) {
      navigate('/laundry');
      return;
    }
    startWash.mutate(hamperIds, {
      onSuccess: (result) => {
        const moved = result?.items?.length ?? hamperIds.length;
        toast.show({
          message: `Started a load of ${formatCount(moved, 'piece')}`,
          action: result?.snapshot ? { label: 'Undo', onClick: () => restore.mutate(result.snapshot) } : undefined,
        });
      },
      onError: (error) => toast.error(error?.message || 'Could not start the load. Try again.'),
    });
  };

  const signOut = async () => {
    try {
      await logout();
      toast.show({ message: 'Signed out' });
    } catch (error) {
      toast.error(error?.message || 'Could not sign out. Try again.');
    }
  };

  const pageOptions = [
    ...ALL_DESTINATIONS.map((destination) => ({
      id: `page-${destination.id}`,
      label: destination.label,
      icon: destination.icon,
      keys: hotkeyLabel(destination.hotkey),
      keysThen: true,
      keywords: PAGE_KEYWORDS[destination.id] ?? [],
      run: () => navigate(destination.to),
    })),
    // Settings sections only appear while searching, so the default list stays short.
    ...(searching
      ? SETTINGS_SECTIONS.map((section) => ({
          id: `settings-${section.id}`,
          label: SECTION_LABELS[section.id] ?? section.label,
          secondary: section.description,
          icon: section.icon,
          keywords: ['settings', section.label, ...section.keywords],
          run: () => navigate(sectionHref(section.id)),
        }))
      : []),
  ];

  const actionOptions = [
    {
      id: 'action-add-item',
      label: 'Add item',
      secondary: 'Photo, name, colours and more',
      icon: AddOutlined,
      keys: ['N'],
      keywords: ['new', 'piece', 'create', 'upload'],
      run: () => ui.openItemForm({ mode: 'create' }),
    },
    {
      id: 'action-new-outfit',
      label: 'New outfit',
      secondary: 'Put together and save a look',
      icon: StyleOutlined,
      keywords: ['create', 'save', 'builder', 'look'],
      run: () => navigate('/outfits?tab=saved&new=1'),
    },
    {
      id: 'action-start-load',
      label: 'Start a load',
      secondary: laundry.isSuccess
        ? hamperIds.length > 0
          ? `Wash the ${formatCount(hamperIds.length, 'piece')} in the hamper`
          : 'The hamper is empty. Opens Laundry.'
        : 'Wash everything in the hamper',
      icon: LocalLaundryServiceOutlined,
      keywords: ['laundry', 'wash', 'hamper'],
      run: startLoad,
    },
    {
      id: 'action-theme',
      label: `Switch to ${nextMode} theme`,
      icon: nextMode === 'dark' ? DarkModeOutlined : LightModeOutlined,
      keywords: ['theme', 'dark', 'light', 'mode', 'appearance', 'colour'],
      run: () => setMode(nextMode),
    },
    {
      id: 'action-shortcuts',
      label: 'Keyboard shortcuts',
      icon: KeyboardOutlined,
      keys: ['?'],
      keywords: ['keys', 'hotkeys', 'help'],
      run: () => ui.openShortcuts(),
    },
    {
      id: 'action-sign-out',
      label: 'Sign out',
      icon: LogoutOutlined,
      keywords: ['log out', 'logout', 'leave'],
      run: signOut,
    },
  ];

  // The server result can lag the input (debounce, keepPreviousData, or the cached full list while
  // the query is still empty), so the same word-prefix match is applied here. Pieces shown always
  // match what is typed, and cached pieces appear instantly.
  const matchingPieces = searching
    ? (items.data?.items ?? [])
        .filter((item) =>
          matchesTerms(
            terms,
            item.name,
            typeLabel(item.type) ?? '',
            item.brand ?? '',
            getCategory(item.category)?.label ?? '',
            (item.colors ?? []).map((color) => colorLabel(color) ?? ''),
          ),
        )
        .map((item, index) => ({ item, index, rank: matchRank(terms, item.name) }))
        .sort((a, b) => a.rank - b.rank || a.index - b.index)
        .map((entry) => entry.item)
    : [];

  const pieceOptions = searching
    ? matchingPieces.slice(0, MAX_PIECES).map((item) => ({
        id: `piece-${item.id}`,
        label: item.name,
        secondary: [typeLabel(item.type), item.brand].filter(Boolean).join(', '),
        item,
        run: () => openItem(item.id),
      }))
    : [];

  const outfitList = Array.isArray(outfits.data) ? outfits.data : (outfits.data?.outfits ?? []);
  const outfitOptions = searching
    ? outfitList
        .filter((outfit) => matchesTerms(terms, outfit.name, occasionLabel(outfit.occasion) ?? ''))
        .slice(0, MAX_OUTFITS)
        .map((outfit) => ({
          id: `outfit-${outfit.id}`,
          label: outfit.name,
          secondary: [occasionLabel(outfit.occasion), formatCount(outfit.itemIds?.length ?? 0, 'piece')]
            .filter(Boolean)
            .join(', '),
          icon: StyleOutlined,
          run: () => navigate('/outfits?tab=saved'),
        }))
    : [];

  const piecesSettled = debounced === trimmed && items.isSuccess && !items.isPlaceholderData && !items.isFetching;
  const piecesLoading = searching && !piecesSettled && !items.isError && pieceOptions.length === 0;

  const groups = [
    { id: 'pages', title: 'Pages', options: rankOptions(pageOptions, terms) },
    { id: 'actions', title: 'Actions', options: rankOptions(actionOptions, terms) },
    { id: 'pieces', title: 'Pieces', options: pieceOptions, loading: piecesLoading },
    { id: 'outfits', title: 'Saved outfits', options: outfitOptions },
  ].filter((group) => group.options.length > 0 || group.loading);

  const flat = groups.flatMap((group) => group.options);
  const active = flat.length > 0 ? Math.min(activeIndex, flat.length - 1) : -1;
  const activeOption = active >= 0 ? flat[active] : null;
  const optionDomId = (option) => `${baseId}-${option.id}`;
  const noResults = searching && flat.length === 0 && !piecesLoading;

  // Put the caret in the search box as soon as the dialog can take focus. The fade starts
  // from visibility: hidden, where focus() silently fails, so retry on the next frames.
  useEffect(() => {
    if (!open) return undefined;
    let frame = 0;
    let tries = 0;
    const tryFocus = () => {
      const input = inputRef.current;
      if (input && document.activeElement !== input) input.focus({ preventScroll: true });
      tries += 1;
      if ((!input || document.activeElement !== input) && tries < 40) frame = requestAnimationFrame(tryFocus);
    };
    tryFocus();
    return () => cancelAnimationFrame(frame);
  }, [open]);

  // Keep the active option in view while moving with the keyboard.
  useEffect(() => {
    if (!activeOption) return;
    const node = document.getElementById(optionDomId(activeOption));
    node?.scrollIntoView({ block: 'nearest' });
    // optionDomId is derived from baseId, which never changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeOption?.id]);

  const run = (option) => {
    if (!option) return;
    onClose();
    option.run();
  };

  const handleKeyDown = (event) => {
    if (event.nativeEvent.isComposing) return;
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      if (flat.length === 0) return;
      const step = event.key === 'ArrowDown' ? 1 : -1;
      setActiveIndex((Math.max(active, 0) + step + flat.length) % flat.length);
    } else if (event.key === 'Enter') {
      event.preventDefault();
      run(activeOption);
    } else if ((event.key === 'Home' || event.key === 'End') && event.ctrlKey) {
      event.preventDefault();
      setActiveIndex(event.key === 'Home' ? 0 : flat.length - 1);
    }
  };

  const indexById = new Map(flat.map((option, index) => [option.id, index]));

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth={false}
      className="command-palette"
      // The focus trap would otherwise move focus to the paper; the search input takes it instead.
      disableAutoFocus
      slotProps={{
        // MUI 9 puts role="dialog" on the paper, so the accessible name goes there.
        paper: { 'aria-label': 'Search Alclo', className: 'command-palette__paper' },
        transition: {
          onExited: () => {
            setQuery('');
            setActiveIndex(0);
          },
        },
      }}
    >
      <div className="command-palette__search">
        <SearchOutlined className="command-palette__search-icon" aria-hidden />
        <input
          ref={inputRef}
          className="command-palette__input"
          type="text"
          role="combobox"
          aria-expanded="true"
          aria-controls={listboxId}
          aria-activedescendant={activeOption ? optionDomId(activeOption) : undefined}
          aria-autocomplete="list"
          aria-label="Search pages, actions and pieces"
          placeholder="Search pages, actions and pieces"
          autoComplete="off"
          autoCorrect="off"
          spellCheck={false}
          autoFocus
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
            setActiveIndex(0);
          }}
          onKeyDown={handleKeyDown}
        />
        <Kbd className="command-palette__esc">Esc</Kbd>
        <Button variant="text" color="inherit" className="command-palette__cancel" onClick={onClose}>
          Cancel
        </Button>
      </div>

      <div ref={listRef} id={listboxId} role="listbox" aria-label="Results" className="command-palette__results">
        {groups.map((group) => {
          const headingId = `${baseId}-${group.id}-heading`;
          return (
            <div key={group.id} role="group" aria-labelledby={headingId} className="command-palette__group">
              <div id={headingId} className="command-palette__group-title">
                {group.title}
              </div>
              {group.options.map((option) => {
                const index = indexById.get(option.id);
                const selected = index === active;
                return (
                  <div
                    key={option.id}
                    id={optionDomId(option)}
                    role="option"
                    aria-selected={selected}
                    className={cx('command-palette__option', selected && 'command-palette__option--active')}
                    onMouseMove={() => {
                      if (index !== active) setActiveIndex(index);
                    }}
                    onClick={() => run(option)}
                  >
                    {option.item ? (
                      <ItemThumb item={option.item} size="xs" ratio="1/1" className="command-palette__thumb" />
                    ) : (
                      <OptionIcon icon={option.icon} />
                    )}
                    <span className="command-palette__text">
                      <span className="command-palette__label">{option.label}</span>
                      {option.secondary ? <span className="command-palette__secondary">{option.secondary}</span> : null}
                    </span>
                    {option.item && option.item.laundry?.status && option.item.laundry.status !== 'clean' ? (
                      <StatusBadge status={option.item.laundry.status} size="sm" className="command-palette__status" />
                    ) : null}
                    {option.keys ? (
                      <span className="command-palette__keys" aria-hidden>
                        {option.keys.map((key, keyIndex) => (
                          <span key={key} className="command-palette__key">
                            {option.keysThen && keyIndex > 0 ? <span className="command-palette__then">then</span> : null}
                            <Kbd>{key}</Kbd>
                          </span>
                        ))}
                      </span>
                    ) : null}
                    <KeyboardReturnOutlined className="command-palette__enter" aria-hidden />
                  </div>
                );
              })}
              {group.loading
                ? [0, 1].map((row) => (
                    <div key={row} className="command-palette__option command-palette__option--loading" aria-hidden>
                      <Skeleton variant="rounded" width={40} height={40} />
                      <span className="command-palette__text">
                        <Skeleton variant="text" width="45%" />
                        <Skeleton variant="text" width="25%" />
                      </span>
                    </div>
                  ))
                : null}
            </div>
          );
        })}
        {noResults ? (
          <div className="command-palette__empty" role="status">
            <p className="command-palette__empty-title">No matches for &lsquo;{trimmed}&rsquo;</p>
            <p className="command-palette__empty-text">Try a page, an action or the name of a piece.</p>
          </div>
        ) : null}
        {piecesLoading ? (
          <span className="u-visually-hidden" role="status">
            Searching your wardrobe
          </span>
        ) : null}
      </div>

      <footer className="command-palette__footer" aria-hidden>
        <span className="command-palette__hint">
          <Kbd>&uarr;</Kbd>
          <Kbd>&darr;</Kbd> to move
        </span>
        <span className="command-palette__hint">
          <Kbd>Enter</Kbd> to open
        </span>
        <span className="command-palette__hint">
          <Kbd>Esc</Kbd> to close
        </span>
      </footer>
    </Dialog>
  );
}
