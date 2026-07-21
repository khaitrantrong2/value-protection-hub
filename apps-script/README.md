# Value Protection Hub — Apps Script Links API

This folder holds the Google Apps Script that turns a **private Google Sheet** into a
JSON API for the Value Protection Hub frontend. The frontend fetches from the deployed
Web App URL (`VITE_LINKS_API_URL`) and falls back to bundled mock data when that variable
is empty or the request fails.

## 1. Create the Google Sheet

Create a Sheet and add these tabs.

### Tab: `Links` (required)

| Column | Notes |
|--------|-------|
| ID | Unique key, e.g. `CB-001` |
| Category | Category name (matches a row in `Categories`) or a slug |
| Title | Link title |
| Description | Short description |
| URL | The real destination link |
| Owner | Person / team responsible |
| Country | `VN`, `SG`, `MY`, `ID`, `PH`, `TH`, or `Regional` |
| Status | `Active`, `Review`, `Blocked`, or `Archived` |
| Tags | Comma-separated, e.g. `tracker, monthly` |
| AccessNote | Any access restriction note (marks the item as "restricted") |
| Criticality | `High`, `Medium`, or `Low` |
| SortOrder | Number used for ordering within a category |
| IsActive | `TRUE` / `FALSE` — rows that are not `TRUE` are ignored |
| LastUpdated | Date (any date cell; returned as `yyyy-MM-dd`) |

### Tab: `Categories` (optional)

| Column | Notes |
|--------|-------|
| Category | Category name |
| Description | Shown under the category heading |
| Color | CSS color or `var(--accent-…)` token |
| Icon | Icon key (see `src/components/Icon.vue`) |
| SortOrder | Number used for ordering categories |

If omitted, the frontend uses its built-in default categories.

### Tab: `Config` (optional)

Two columns: `Key` and `Value`. Supported keys:

| Key | Purpose |
|-----|---------|
| PortalName | Overrides the hub title |
| Subtitle | Overrides the subtitle |
| Maintainer | Shown in the Maintenance section |
| AdminSheetUrl | If set, shows an "Open source sheet" button. **Leave blank to keep the sheet hidden.** |
| RequestLinkUrl | If set, shows a "Request new link" button |
| LastUpdatedNote | Free-text "last updated" note |

## 2. Add the script

1. In the Sheet: **Extensions → Apps Script**.
2. Replace the default `Code.gs` with the contents of [`Code.gs`](./Code.gs).
3. Save.

## 3. Deploy as a Web App

1. **Deploy → New deployment → Web app**.
2. **Execute as:** `Me`.
3. **Who has access:** pick according to your security policy:
   - `Anyone` — required for the public frontend to fetch directly via `fetch()`.
     Only use this if the Sheet contains **no** confidential data you are unwilling to
     expose to anyone with the URL. The API returns whatever rows are `IsActive = TRUE`.
   - `Anyone within <your org>` — more restrictive, but a browser `fetch()` from a public
     site will **not** be authenticated, so the frontend cannot read it directly. Use the
     `google.script.run` / embedded approach below, or host the frontend internally.
4. Copy the Web App URL and set it as `VITE_LINKS_API_URL` in the frontend `.env`.

## 4. CORS notes

A Web App deployed with **"Anyone"** access serves `ContentService` JSON that a browser
can read cross-origin for simple `GET` requests, which is what the frontend does. No custom
headers are sent, so the request stays a "simple" CORS request and works from the browser.

If you must restrict access to your org and cannot expose "Anyone":

- **Option A — JSONP:** wrap the response in a callback. Add a `callback` param handler in
  `doGet` and return `ContentService` text as `application/javascript`. The frontend then
  loads it via a `<script>` tag instead of `fetch`. (Not implemented here to keep v1 simple.)
- **Option B — Embedded / internal hosting:** serve the frontend from an internal host and
  read the Sheet with `google.script.run` from an Apps Script HTML page, or use a small
  server-side proxy that holds credentials. Keep the app private per your security policy.

Keep the first version simple: deploy with "Anyone", ensure the Sheet holds only data you
are comfortable serving, and restrict via internal hosting later if required.

## 5. Security

- The **real** links live only in this private Sheet — never in the frontend repo.
- Do not paste real Sheet IDs, deployment URLs, or internal links into the public repo.
- `AdminSheetUrl` is only surfaced when you explicitly set it in `Config`.
- Rows with `IsActive` other than `TRUE` are never returned.
