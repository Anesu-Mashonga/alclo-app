# Alclo

Alclo plans what to wear from the clothes you own. It looks at the weather, the occasion and what is actually clean.

This is the web version, built with React, Vite, Material UI and SCSS. For now it is frontend only. A mock backend in `src/services` stores everything in your browser's localStorage. It handles signup, login and create/edit/delete for wardrobe items, outfits, plans and laundry.

## Run it

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # production build into dist/
npm run lint
```

To explore with sample data, sign in with the demo account: `demo@alclo.app` / `closet2026`. The login page also has a "Use demo account" button. A new signup starts empty and goes through a short onboarding, where you can load the sample wardrobe.

## What's inside

| Page | What it does |
|---|---|
| Today | Outfit of the day from the weather, the occasion and clean clothes. You can lock a piece, swap it, shuffle the rest, save the outfit or wear it (with Undo). "Try other weather" previews a different forecast. |
| Wardrobe | Search, filters and sort, all kept in the URL. Grid or list view, multi-select with bulk actions, an item drawer (`?item=<id>`, works from any page) and an add/edit form with photo upload. |
| Outfits | Outfit ideas by occasion, saved outfits, an outfit builder and a weekly planner. |
| Laundry | Hamper, then in the wash, then recently cleaned. Pieces go to the hamper on their own when they reach their wash limit. Every move can be undone. |
| Insights | Wear activity, usage by category, most worn and forgotten pieces, cost per wear, and gaps worth filling. |
| Settings | Profile, preferences (theme, units, city, weather source), data export and reset, simulated latency and errors, and account settings. |

Keyboard shortcuts:

| Keys | Action |
|---|---|
| `Ctrl/Cmd + K` | Command palette |
| `N` | New item |
| `/` | Search |
| `?` | All shortcuts |
| `G` then `T`, `W`, `O`, `L` or `I` | Go to a page |

## Project layout

```
src/
  theme/       MUI theme: light + dark colour schemes, typography, component overrides
  styles/      SCSS tokens, mixins and global styles (see src/styles/README.md)
  components/  layout (shell), common (shared UI) and one folder per feature
  pages/       one page per route, each with its own .scss
  data/        dummy data "tables": users, wardrobe items, outfits, plans, catalog, weather
  services/    mock REST-style backend (latency, errors, validation, auth, persistence)
  hooks/api/   React Query hooks, the only way the UI talks to services
  lib/         outfit recommendation engine, laundry rules, dates, formatting
```

### Connecting a real backend

Pages only use the hooks in `src/hooks/api`. To switch to a real API, change the functions in `src/services/*Service.js` to call `fetch` and keep their signatures. The UI does not need to change.

## Design notes

- **Colour:** neutral zinc surfaces let the clothing photos carry the colour. The single accent is the Alclo rose from the original app, recalibrated for contrast: `#B21F57` in light mode and `#F07AA5` in dark mode. Both pass WCAG AA. Green, amber, red and blue are only used for laundry and weather states, and always alongside an icon or text.
- **Dark mode:** uses MUI's `ThemeProvider` with CSS variables. Choose Light, Dark or System from the top bar or in Settings. SCSS reads the same `--mui-palette-*` variables, so every custom style follows the theme.
- **Styling:** plain `Component.scss` files next to each component, using BEM class names. No CSS modules, no gradients, no emoji icons (icons come from `@mui/icons-material`).
- **Interaction:** Undo instead of confirmation for anything reversible. Explanations for every recommendation. Filters and tabs stay in the URL. Skeletons while loading, plus empty and error states with retry. Full keyboard support and respect for reduced-motion settings.

## Data and weather

- Demo data lives in localStorage. Settings > Data > Reset demo data regenerates it. If you haven't changed anything, the demo also refreshes itself once a day so its history stays current.
- Weather is simulated by default from city climate profiles. If `OPENWEATHER_API_KEY` is set in `.env` and you choose Live in Settings, the Today page can use real weather for your location. It only asks for location permission when you click "Use my location".
