import { ALL_DESTINATIONS } from '@/components/layout/navigation';

/**
 * Keyboard shortcuts for the shortcuts dialog. `keys` are pressed together unless `then`
 * is set (a sequence such as G then W). 'mod' renders as Ctrl, or the Command symbol on
 * Apple devices. `where` names the page a shortcut belongs to, if it is not global.
 */
export const SHORTCUT_SECTIONS = [
  {
    id: 'navigation',
    title: 'Navigation',
    shortcuts: [
      { keys: ['mod', 'K'], label: 'Search or jump to' },
      ...ALL_DESTINATIONS.map((item) => ({
        keys: item.hotkey.split(' ').map((key) => key.toUpperCase()),
        label: `Go to ${item.label}`,
        then: true,
      })),
    ],
  },
  {
    id: 'actions',
    title: 'Actions',
    shortcuts: [
      { keys: ['N'], label: 'Add an item' },
      { keys: ['/'], label: 'Search this page' },
      { keys: ['R'], label: 'Shuffle the outfit', where: 'Today' },
      { keys: ['mod', 'Z'], label: 'Undo the last change' },
      { keys: ['?'], label: 'Show keyboard shortcuts' },
    ],
  },
  {
    id: 'lists',
    title: 'Lists',
    shortcuts: [
      { keys: ['↑', '↓'], label: 'Move through results', alt: true },
      { keys: ['Enter'], label: 'Open the highlighted result' },
      { keys: ['←', '→'], label: 'Previous or next piece', where: 'Item details', alt: true },
      { keys: ['Shift', 'Click'], label: 'Select a range', where: 'Wardrobe' },
      { keys: ['Esc'], label: 'Close, or leave selection' },
    ],
  },
];
