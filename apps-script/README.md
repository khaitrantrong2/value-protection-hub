# Value Protection Hub — Apps Script Links and Atlas API

This folder holds the Google Apps Script template that serves a configured Google Sheet
as JSON. Sheet privacy and Web App access are separate settings; inspect both rather than
assuming the source is private because the frontend uses an API.
The legacy directory fetches the default Web App URL (`VITE_LINKS_API_URL`) and keeps its
existing mock fallback. The separate `?action=atlas` route never silently falls back to
demo after a live-source failure. See [Atlas editing and deployment](../docs/process-atlas.md).

## What each endpoint exposes

| Request | Returned data |
| --- | --- |
| Default URL, or an unrecognized `action` | `Links` where `IsActive=TRUE`; every nonempty `Categories` row with its header fields; every nonblank `Config` key/value; normalized `Portfolio` rows with a member, including member and Brand fields. |
| `?action=atlas` | Allowlisted fields from `AtlasStages`, `AtlasControls`, `AtlasReferences` and `AtlasConfig`, only where `Publication=Published` **and** `Visibility=Public`. |

Review the complete default response before authorizing public access, including Config
keys that the frontend does not display and the Portfolio sheet actually selected by the
reader. Atlas publication filtering does **not** secure the default endpoint or direct
access to the source Sheet. `Status`, `AccessNote`, hidden rows and hidden buttons are not
access controls.

**Required for Web App execution:** in Project Settings → Script properties, configure
`VPH_SPREADSHEET_ID` with the approved source Sheet's raw ID. The template opens that ID
server-side; do not put it in client data or accept it from request parameters. Active-sheet
fallback is for editor/legacy contexts, not a Web App deployment guarantee.
[Google special-method restrictions](https://developers.google.com/apps-script/guides/bound#special_methods).

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

1. Verify the target project, source Sheet, `VPH_SPREADSHEET_ID`, runtime and timezone.
   Preserve any existing source and deployment version before updating code.
2. **Deploy → New deployment → Web app**. Inspect the execution identity and access
   choices available in the account; obtain approval for the intended audience before
   granting new access or completing a new OAuth consent flow.
3. Choose the delivery path described below. This template does not select or enforce
   deployment access settings. When configured to execute as `Me`, requests run with the
   deployer's authority; a private source Sheet does not make a public API private.
   [Google: Web App permissions](https://developers.google.com/apps-script/guides/web#permissions).
4. For testing, an editor-only `/dev` URL runs the saved code; it is not the production
   endpoint for anonymous frontend readers. Use the deployed `/exec` URL for the chosen
   delivery path. [Google: test deployments](https://developers.google.com/apps-script/guides/web#test_a_web_app_deployment).
5. Verify both the default JSON response and `?action=atlas`, then configure the approved
   Web App URL as `VITE_LINKS_API_URL` in the appropriate frontend environment and redeploy
   the frontend. Vite exposes this variable in the client bundle; it is not a secret.

## 4. Browser access and delivery choices

**Direct public-safe JSON:** the current frontend sends a browser `GET` without Google
credentials. Anonymous Web App access can support this path only after the owner approves
the complete returned dataset for public access, including the default endpoint above.
Do not choose `Anyone` as a default or widen access just to resolve a fetch error. Check
the real browser request from the deployed frontend origin; saving code, a successful
editor run or a logged-in browser visit alone does not verify this integration.

Content Service redirects responses to a one-time `script.googleusercontent.com` URL.
Clients must follow redirects; browser `fetch()` does so by default. Authentication,
deployment settings and the actual response still need verification.
[Google: Content Service redirects](https://developers.google.com/apps-script/guides/content#redirects).

**Internal/authenticated delivery:** if the data requires restricted access, keep the
source and API restricted. Use an Apps Script HTML-service app with the appropriate
access policy and `google.script.run`, or implement an authenticated server-side proxy
that authorizes each viewer and accesses the source with suitable credentials. These
paths require integration work; the current unauthenticated external `fetch()` is not
an org sign-in flow. Internal hosting alone does not add API authentication.

JSONP is not implemented and is **not** an authentication or org-access workaround.
Google warns that another website can embed a JSONP endpoint and capture its returned
data; it is suitable only for read-only, non-sensitive responses.
[Google: JSONP security warning](https://developers.google.com/apps-script/guides/content#serve_jsonp_in_web_pages).

## 5. Security

- Verify source sharing separately. If the Sheet is publicly viewable or shared with
  anyone holding its link, Draft/Internal rows may be readable directly even though
  the Atlas endpoint excludes them.
- Keep private evidence, internal links and sensitive person/client/transaction data
  outside any dataset authorized for anonymous delivery. Public-safe summaries can
  identify evidence types without exposing the evidence itself.
- Do not commit real source IDs, credentials, deployment URLs or private links to this
  public repo. Store the approved source ID in Script Properties.
- A blank `AdminSheetUrl` hides a UI button only; a configured value is returned by the
  default Config endpoint. The absence of that button does not protect source access.
- `IsActive` filters Links only. It does not filter Categories, Config or Portfolio.
  Atlas applies its separate Public/Published gate before serializing its response.
- Publication is a display decision, not proof of control effectiveness, formal SOP
  approval or restricted access to the source.
