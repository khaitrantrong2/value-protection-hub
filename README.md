# Value Protection Hub

**Claimback, AR & Finance Control Workspace**

A premium internal command center for the Value Protection / Claimback team — a single
3D-animated place to find trackers, review cockpits, AR monitoring files, GL analysis,
close templates, JE upload files, NetSuite saved searches, SOPs, training material and
project workspaces.

Built by transforming a 3D Vue/Three.js portfolio into an operational finance-tech hub.

> **This repository ships with mock data only.** Real internal links live in a private
> Google Sheet and are served at runtime via a Google Apps Script Web App. See
> [Security notes](#security-notes).

---

## Tech Stack

| Layer      | Technology                                   |
|------------|----------------------------------------------|
| Framework  | Vue 3 (`<script setup>`), TypeScript         |
| Build      | Vite 7                                        |
| 3D / WebGL | Three.js (lazy-loaded command scene)         |
| Animation  | GSAP + Lenis smooth scroll                    |
| Styles     | SCSS with shared mixins                        |
| Data API   | Google Apps Script Web App reading a Sheet    |

---

## Sections (one-page app)

1. **3D Command Hero** — title, subtitle, command search bar, quick stats, animated Three.js scene with floating data cards.
2. **Quick Access** — category chips for fast filtering.
3. **Link Directory** — premium card grid grouped by category, with search + country/status/criticality filters.
4. **Operations Map** — the claimback-to-cash flow: Source Data → Review Cockpit → Accrual/Booking → Invoice/CM/VRA → Net-off → Collection/AR Monitoring.
5. **Maintenance / Admin** — maintainer, last-updated, and optional source-sheet / request-link buttons.

---

## Setup

```bash
npm install
cp .env.example .env   # optional; leave VITE_LINKS_API_URL empty to use mock data
npm run dev            # http://localhost:3000
```

### Environment

| Variable | Description |
|----------|-------------|
| `VITE_LINKS_API_URL` | Google Apps Script Web App URL that returns Links / Categories / Config JSON. **If empty, the app uses bundled mock data.** |

---

## Data source: Google Sheet

The frontend expects JSON with `links`, optional `categories`, and optional `config`.

### `Links` tab columns

`ID`, `Category`, `Title`, `Description`, `URL`, `Owner`, `Country`, `Status`, `Tags`,
`AccessNote`, `Criticality`, `SortOrder`, `IsActive`, `LastUpdated`.

Rows where `IsActive` is not `TRUE` are ignored.

### `Categories` tab (optional)

`Category`, `Description`, `Color`, `Icon`, `SortOrder`.

### `Config` tab (optional)

Key/Value rows: `PortalName`, `Subtitle`, `Maintainer`, `AdminSheetUrl`,
`RequestLinkUrl`, `LastUpdatedNote`.

Full schema and column semantics: [`apps-script/README.md`](./apps-script/README.md).

---

## Apps Script deployment

1. Create the Google Sheet with the tabs above.
2. **Extensions → Apps Script**, paste [`apps-script/Code.gs`](./apps-script/Code.gs).
3. **Deploy → New deployment → Web app**, execute as **Me**, choose access per your policy.
4. Copy the Web App URL into `.env` as `VITE_LINKS_API_URL`.

CORS / access trade-offs and a JSONP alternative are documented in
[`apps-script/README.md`](./apps-script/README.md).

---

## Frontend deployment

### Option A — Vercel / Netlify (public frontend, data from Apps Script)

Best when a public frontend is acceptable and **no real internal links are hardcoded**
(this repo only contains mock data, so that holds by default).

1. Push to GitHub.
2. Import the repo in Vercel/Netlify.
   - Framework preset: **Vite**
   - Build command: `npm run build`
   - Output directory: `dist`
   - Node.js: 20.x+
3. Set `VITE_LINKS_API_URL` in the project's environment variables.
4. Deploy.

### Option B — Internal hosting only

If company security requires it, keep the app private and do not deploy publicly. Serve
`dist/` from an internal host, and restrict the Apps Script Web App accordingly.

> The frontend repository may be public **only** if it contains mock data and no real
> internal links.

---

## Security notes

- **Do not** hardcode real internal company links in this repository.
- **Do not** commit real Google Sheet IDs or deployment URLs if the repo is public.
- **Do not** commit confidential client or brand names unless intentionally public.
- **Do not** expose credentials, tokens, or private URLs.
- Mock data only in code; production links live in the private Google Sheet.
- The "Open source sheet" button only appears when `AdminSheetUrl` is explicitly set in `Config`.

---

## How to update links

1. Edit the private Google Sheet (`Links` tab). Set `IsActive = TRUE` to publish a row.
2. Add or adjust categories in the `Categories` tab (optional).
3. Tune the hub title, maintainer and admin buttons in the `Config` tab (optional).
4. Changes appear on the next page load — no redeploy needed.

To change the mock/dev dataset, edit `src/data/mockLinks.ts` and `src/data/mockCategories.ts`.

---

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Dev server on port 3000 |
| `npm run build` | Type-check + production build to `dist/` |
| `npm run preview` | Serve the production build |
| `npm run typecheck` | TypeScript check only |

---

## Performance & accessibility

- The Three.js scene is **lazy-loaded** during idle time and never blocks link search.
- If WebGL is unavailable or the scene fails, a static gradient fallback is shown and the
  directory stays fully usable.
- `prefers-reduced-motion` disables smooth scroll, scene animation, and reveal transitions.
- The scene pauses when the tab is hidden.

---

## Future improvements

- JSONP or server proxy for org-restricted Apps Script deployments.
- Admin authentication for editing links in-app.
- Command-palette keyboard shortcut (⌘K) overlay.
- Per-user favorites / recently opened.
- Usage analytics on most-opened links.

---

## Credits

3D scene, motion, and design language adapted from a Vue/Three.js portfolio into an
internal finance-control workspace. Data-serving layer via Google Apps Script.
