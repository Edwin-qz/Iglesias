# AGENTS.md

Casa Viva is a Spanish-language, offline-first church management demo built with React 18, Vite 5, and TypeScript. There is no backend: data lives in `localStorage` and is seeded on first load.

## Commands

- `npm run dev` — Vite dev server at http://localhost:5173
- `npm run build` — the only automated check; runs `tsc -b && vite build`
- `npm run preview` — serve the production build
- Use npm; `package-lock.json` is the lockfile. No `.env` or external service setup is required.
- There are no test or lint scripts. Verify changes with `npm run build` plus a manual browser check.
- The >500 kB chunk warning during build is expected for the current dependency set; it is not a failure.

## Architecture

- `src/main.tsx` mounts `src/App.tsx`. All routes and guards live in `App.tsx`: public landing/auth routes plus the `/app` tree protected by `RequireAuth` and per-module `Guard`.
- Global state is in `src/store/AppStore.tsx` (`useStore`). Writes go through `mutate(db => next)`, which persists the whole database.
- Seed data and demo accounts are in `src/data/seed.ts`. The database is `version: 4`; storage keys are `casaviva.db.v5` and `casaviva.session.v5` in `AppStore.tsx`. If seed content must reach existing browsers, bump the seed version and the key/version check together. `resetDemo()` re-seeds and logs out.
- Every church-scoped record has a `churchId`. Pages filter data by `currentChurchId` from `useStore`; `church` is the active church. Only `administrador` can switch churches, and switching updates that user's `churchId`.
- Route screens are in `src/pages`. Reuse the shared primitives in `src/components` (`ui.tsx`, `Modal`, `Toast`, `AppLayout`); do not duplicate them.
- Styles are split by area (`base.css`, `landing.css`, `auth.css`, `app.css`) and imported once in `main.tsx`. Per-church colors are CSS variables set from `church.theme`: `--church-primary`, `--church-deep`, `--church-accent`, `--church-soft`, `--church-tint`. Preserve this theming when adding UI.
- `src/lib/utils.ts` contains date, money, CSV, and Excel helpers. Store dates as ISO `YYYY-MM-DD` and parse them with `fromISO`, not `new Date('YYYY-MM-DD')`, to avoid timezone shifts. Use `formatMoney` for MXN and keep `es-MX` formatting.
- Reports export CSV and an HTML `.xls`; PDF is produced with `window.print()`. Print rules are in the stylesheets.
- Church coordinates are real Mérida locations. Use `src/lib/maps.ts` for Google Maps place/directions links instead of hardcoding URLs. Optional `church.photo` objects include Wikimedia credit, license, and source; `ChurchArt`/`ChurchMark` in `src/components/Brand.tsx` are the SVG fallback. Coordinates and photos are seed-managed; Settings only edits text fields, schedules, and logo.
- Auth is demo-only (FNV-1a password hash in `utils.ts`), not production security. Seeded accounts are `admin@casaviva.mx`, `pastor@casaviva.mx`, `secretario@casaviva.mx`, `tesorero@casaviva.mx`, and `coordinador@casaviva.mx`; all use password `demo1234`. New registrations become `coordinador`.

## Gotchas

- UI copy, labels, dates, and currency are Spanish/Mexican. Keep new user-facing text in Spanish and use `es-MX`/MXN.
- Do not add an API/network layer for app data; persistence is intentionally local. External fonts, Wikimedia images, and Google Maps are links only.
- `dist/`, `node_modules/`, and `*.tsbuildinfo` are generated. Never edit `dist/` by hand.
- The app uses `BrowserRouter`; direct route refreshes need the dev server or a host configured to fall back to `index.html`.
