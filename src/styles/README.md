# Styling guide (read before writing any .scss)

Plain `ComponentName.scss` next to the component, imported with `import './ComponentName.scss'`.
Never `*.module.scss`, never CSS-in-JS files. `sx` only for trivial one-offs (two properties at most).

Every `.scss` file already starts with `@use "@/styles/abstracts" as *;` (injected by vite), so all
tokens and mixins below are available without an import. Do not add CSS output to `abstracts/`.

## Cascade layers (why your SCSS always wins)

`index.html` declares `@layer base, mui;` before any stylesheet loads.

| Layer | Contents | Priority |
|---|---|---|
| `base` | element defaults and the global focus ring (`global.scss`) | lowest |
| `mui` | every MUI style (`StyledEngineProvider enableCssLayer`) | middle |
| unlayered | component and page SCSS (your files) | highest |

So a plain class beats MUI no matter how specific MUI's selector is. Consequences:

- Target your own BEM classes, for example `.wardrobe-card__photo` or `.item-filters .MuiChip-root`.
  Never write bare element selectors like `.my-page button {}`: they would override every MUI
  button inside, including colours and sizes.
- To restyle a MUI part, pass `className` and target it: `.outfit-card.MuiCard-root { ... }`.
- `sx` lives inside the `mui` layer, so your SCSS beats `sx` too. Do not mix both on one property.

## Colour: always CSS variables

MUI generates these from `src/theme/palette.js`; they switch automatically between light and dark.
Prefer the SCSS aliases on the right.

| CSS variable | SCSS alias | Use |
|---|---|---|
| `--mui-palette-background-default` | `$c-bg` | page background |
| `--mui-palette-background-paper` | `$c-paper` | cards, sidebar |
| `--mui-palette-alclo-surfaceRaised` | `$c-raised` | menus, dialogs, raised panels |
| `--mui-palette-alclo-surfaceSunken` | `$c-sunken` | segmented track, wells, icon bubbles |
| `--mui-palette-divider` | `$c-divider` | 1px borders |
| `--mui-palette-alclo-borderStrong` | `$c-border-strong` | input and outlined button borders |
| `--mui-palette-alclo-hover` | `$c-hover` | row and tile hover tint |
| `--mui-palette-alclo-backdrop` | `$c-backdrop` | modal scrim |
| `--mui-palette-text-primary` / `-secondary` / `-disabled` | `$c-text` / `$c-text-secondary` / `$c-text-disabled` | text |
| `--mui-palette-primary-main` / `-dark` / `-contrastText` | `$c-primary` / `$c-primary-dark` / `$c-on-primary` | Alclo Rose |
| `--mui-palette-alclo-accentSoft` / `-onAccentSoft` | `$c-accent-soft` / `$c-on-accent-soft` | selected chips, active nav |
| `--mui-palette-alclo-ink` / `-onInk` | `$c-ink` / `$c-on-ink` | neutral solid surfaces (toasts, tooltips) |
| `--mui-palette-alclo-photoWell` | `$c-photo-well` | garment photo wells (stay light in dark mode) |
| `--mui-palette-success-main` / `-soft` / `-onSoft` | `$c-success` / `$c-success-soft` / `$c-on-success-soft` | clean |
| `--mui-palette-warning-*` | `$c-warning*` | hamper |
| `--mui-palette-error-*` | `$c-error*` | urgent, destructive |
| `--mui-palette-info-*` | `$c-info*` | washing, weather |
| `--mui-palette-alclo-shadowRaised` | `$shadow-raised` | selected segment, switch thumb |
| `--mui-palette-alclo-shadowOverlay` | `$shadow-overlay` | menus, popovers, dialogs, bulk bar |

Status colours never stand alone: pair them with an icon or text (see `StatusBadge`).
Garment colour hexes from `src/data/taxonomy.js` are data, not palette, and may be used inline.
No gradients anywhere (`linear-gradient`, `radial-gradient`, `conic-gradient`).

## Layout and shape tokens

- Spacing: `$space-1` 8px through `$space-6` 48px. Gutters: `@include page-gutters;` (16 / 24 / 32).
- Radius rule: controls `$radius-control` 10px, surfaces `$radius-surface` 16px, photo wells
  `$radius-well` 12px, chips and pills `$radius-pill`. Small inner tiles may use `$radius-sm` 8px.
- Motion: `$duration-fast` 120ms (hover, press), `$duration-base` 200ms, `$duration-slow` 280ms;
  `$ease-standard`, `$ease-exit`. Animate only transform and opacity.
- Z-index: page sticky toolbars `$z-sticky` (10) with `top: var(--alclo-topbar-height)`;
  bulk action bar `$z-bulk-bar` (20). MUI overlays use MUI's own scale.
- Shell variables (set at runtime): `--alclo-topbar-height` (56px mobile, 64px desktop) on
  `.app-shell`, and `--alclo-bottom-inset` on `<html>` (bottom navigation height below md, else unset).
  Sticky bottom bars: `bottom: calc(var(--alclo-bottom-inset, 0px) + 16px)`.

## Mixins

| Mixin | What it does |
|---|---|
| `up($bp)`, `down($bp)`, `between($a, $b)` | media queries matching MUI (`xs 0, sm 600, md 900, lg 1200, xl 1536`) |
| `focus-ring($offset: 2px)` | 2px primary outline on `:focus-visible` (use on custom buttons and links) |
| `visually-hidden` | hide visually, keep for screen readers (also `.u-visually-hidden`) |
| `pressable($scale: 0.98)` | press feedback with reduced-motion guard |
| `motion-safe` | wraps animations so they only run without reduced-motion preference |
| `hover-capable` | hover styles only on real hover devices |
| `tabular` | tabular numbers for stats and counters (also `.u-tabular`) |
| `truncate`, `line-clamp($n)` | ellipsis |
| `photo-well($radius, $padding)` | light well with `mix-blend-mode: multiply` image (prefer the `ItemThumb` component) |
| `card-surface($padding)` | flat paper card with 1px divider border and 16px radius |
| `overlay-surface` | raised surface with the overlay shadow |
| `scrollbar-hidden` | horizontal scrollers without a visible bar |
| `page-gutters` | responsive 16 / 24 / 32px inline padding |
| `dark-scheme`, `light-scheme` | scheme-specific structure (rarely needed: colours already switch) |

Theme switching in SCSS, if you really need different structure per scheme:

```scss
.weather-card {
  border-color: $c-divider; // switches automatically, no branching needed
  @include dark-scheme { box-shadow: none; } // compiles to [data-dark] .weather-card
}
```

## Naming

BEM, prefixed by the block, one block per component file:
`.item-card`, `.item-card__photo`, `.item-card--selected`. Pages use the page name as the block:
`.wardrobe-page`, `.wardrobe-page__toolbar`.
