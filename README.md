# Value Protection Hub

Vue 3 / TypeScript / Vite workspace for finding Value Protection resources, understanding
the claimback lifecycle, and discovering the team's published responsibilities.
The interface retains the Hub's purple/amethyst identity with an English UI,
keyboard navigation and reduced-motion support. Translation catalogs remain in source;
the public language switch is disabled until business-content translation is complete.

## Destinations

- **Universe** — Intrepid at the core, ten resource-vault planets and a fleet of real Value Protectors; selected scope opens without moving the camera.
- **Start here** — three compact flight paths for business understanding, team/responsibilities and daily work; vocabulary lives in the Process Guide.
- **Directory** — table by default, optional compact cards, search, country/type/category/status/priority filters and truthful source/link states.
- **Team** — all active protector ships, individual hulls/liveries and full-page portfolios with column-header filters; not an inferred org chart. Khai's signature hull is a visual identity only.
- **Process Atlas** — Explore canvas and a separate document-style Process Guide reading the same records.

## Run and verify

```sh
npm ci
# Optional: copy .env.example to .env and configure the existing approved Web App URL.
npm run dev
npm test
npm run build
```

Dev defaults to port 3000. Build includes TypeScript checking; `npm run typecheck`
runs it separately. `npm run preview` serves `dist/`.

`VITE_LINKS_API_URL` is a public client configuration value, not a secret. Configured
API failure never silently substitutes demonstration data. A validated cached Directory
snapshot is labelled retained/stale with its original fetch time; otherwise source is
unavailable. Bundled Directory examples require an explicit preview action. Without an
API, Directory starts unavailable; Atlas development uses a clearly labelled bundled draft.

## Edit content

| Content | Edit location | Release |
| --- | --- | --- |
| Resources / categories / configuration / portfolio | Existing Links, Categories, Config, Portfolio Sheet tabs | Reload page; legacy API may cache briefly |
| Process / controls / references / metadata | AtlasStages, AtlasControls, AtlasReferences, AtlasConfig | Publish eligible records, then reload page |
| Reviewed process translations | Optional Translations Sheet tab | Review-gated infrastructure only; not exposed in the English-only release |
| UI labels / Crew profile copy | src/i18n/messages/ | Frontend build/deploy |
| Crew identities / grouping / active roster | src/data/crew.ts | Frontend build/deploy; preserve stable IDs |
| Layout / interactions / schema | Components / services / types | Tests, build and preview review |

Keep IDs as text (`01` is not `1`). Publication/API labels do not change actual
Sheet or file sharing permissions. Verify access separately.

- [Hub experience and translation boundary](docs/hub-experience.md)
- [Atlas editing, business guardrails and API](docs/process-atlas.md)
- [Reviewed translations contract](docs/atlas-translations.md)
- [Apps Script setup and legacy schemas](apps-script/README.md)

## Navigation and language

The public interface is English-only. Legacy `?lang=vi` links and stored preferences
also resolve to English without changing the page/filter hash. Original business text
is not rewritten or declared authoritative by the interface language. EN/VI catalogs
and the reviewed-overlay contract remain available for a future complete translation.

Examples: `/#crew`, `/#member?id=khai`,
`/#directory?country=VN&q=accrual`, `/#atlas?mode=guide&stage=04&tab=controls`.
Directory filters (including allowlisted `type`) are shareable; portfolio filters persist in-session, not in the URL.
Table is the default; `mode=cards` selects cards, and legacy `mode=compact` links remain valid.
Ctrl/⌘K opens search. Escape closes a modal before any underlying page shortcut.

## Deployment and rollback

Keep Vue/Vite. Vercel: build `npm run build`, output `dist`, configure
`VITE_LINKS_API_URL` in intended environments. Review branch preview before merging;
a local build is not proof of live source integration.

Update the existing approved Apps Script deployment to a new version; preserve its URL
and access settings. Optional translations do not require changing Vercel configuration.
Rollback frontend with the previous Vercel deployment, API with the prior version,
and content with Sheet version history. Do not delete legacy tabs to roll back.

## Security and evidence

- Do not commit confidential links, credentials, financial records or private evidence.
- Public frontend/API can expose returned records. API publication filters do not make the source Sheet private.
- Validated HTTPS destinations only; missing/blocked/unsafe links have no Open. Valid syntax does not prove access or link health.
- Errors are generic; retained/demo data is not freshly loaded live content.
- No external translation service. Incomplete/stale translations retain source and disclose fallback.
- Reported practice, located evidence and published text do not establish approval or operating effectiveness. Correction/write-off is not cash collection.

Universe and Crew use CSS/SVG and scoped GSAP; the legacy Three.js scene is not mounted.
Ships are people, planets are vaults. Only hovered/focused/selected ships pause; camera
and other ships are unaffected. Pause/reduced-motion and compact-screen selectors keep
discovery accessible. Team, Directory and Atlas route components load on demand.
No new tilt, smooth-scroll or scroll-pinning is introduced into the process workspace.

UI text uses pinned self-hosted Be Vietnam Pro 5.3.0 at weights 400/500/600/700, including
Vietnamese and Latin subsets. No Google Fonts request is made at runtime. Original logo
assets remain unchanged. Font copyright/license is shipped in `public/fonts/OFL-BeVietnamPro.txt`.
