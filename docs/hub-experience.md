# Hub experience: the Value Protection universe

## Decisions

Keep Vue/Vite, existing brand tokens and GSAP. Improve the whole Hub instead of creating
a separate visual system for Atlas or Crew.

**The public UI is English-only until business translations are complete.** The
EN/VI switch is removed and legacy VI preferences cannot enable a partial interface.
Catalogs and pinned vue-i18n 11.4.14 remain as review-gated infrastructure, not a claim
that business content has been translated. Interface language is not business approval.
Original process records remain the source of truth. The optional Sheet overlay only
translates complete logical records matching the current whole-record fingerprint.
No runtime machine translation or auto-review. See [translation contract](atlas-translations.md).

**Presentation is not a reporting line.** Crew groups describe collaboration functions
and market coverage, not an organizational hierarchy. Active people use varied hulls
and deterministic multicolor liveries. Khai has a signature Aegis hull at his request,
not a central hero or an inferred reporting line. Inactive identities are retained in
source but hidden from the active roster.

**Portfolio counts are not performance.** Distinguish unique brand names, published scope
rows and canonical platforms. These are not workload, exposure, completeness or ranking.
Unavailable source is not zero responsibility. Who-owns search uses explicit profile/role/
portfolio text, never inferred approval authority. RACI stays in governed process sources.

## Editing and language workflow

1. Header EN/VI changes the root lang query without overwriting the hash. Back/Forward
   and Directory filters retain context. Locale changes do not Fit/remount Atlas.
2. Edit UI catalogs in src/i18n/messages/ with key parity. Edit Crew copy there and
   stable identity/grouping in src/data/crew.ts. Portfolio data stays in its Sheet tab.
3. Edit business records in existing Atlas tabs. Prepare translation rows against the
   published normalized record fingerprint, exact IDs and allowlisted fields.
4. Start new translation work Draft / Draft / Internal. A human reviews financial meaning,
   applicability and completeness before Reviewed / Published / Public. Translation review
   is not control approval. Source edits invalidate old translations until reviewed again.
5. Refresh Atlas. Incomplete/stale overlays retain the entire source record and show fallback.

The optional tab starts with headers/validation only. This foundation does not make all
business content bilingual. Directory/portfolio source text keeps its source language.
English UI default is not an authoritative-language declaration.

## Interaction and reliability

- Five destinations remain available on desktop and native mobile menu.
- Search groups routes, processes, assets and people; accent folding and curated finance synonyms improve discovery without duplicating records.
- Directory defaults to a semantic six-column table with sticky headings. Source/time tooltip sits beside search; Country/View/Category are compact controls. Cards remain optional; legacy status/priority URL filters show removable active chips, not another filter panel. Portfolio filters live in table headings and retain state in-session.
- Native dialogs contain focus and restore it when closed. Page shortcuts ignore inputs, selects, editable content and open dialogs. Skip link, visible focus and reduced motion are preserved.
- Source states distinguish live, retained/stale, unavailable and explicit demo. Original timestamps survive failed refreshes; late responses cannot overwrite newer requests.
- Missing/blocked/invalid destinations have no Open. Session-link warnings do not claim access was checked; copy success/failure is visible.
- Explore retains its canvas through Guide navigation. Source popover and pipeline visibility do not reframe it. Source/version/publication notes are not repeated across the Guide; evidence-to-locate placeholders are hidden without changing underlying evidence states.
- Reloading the page refetches the source; there are no manual Refresh source controls. Original timestamps and stale/error notices remain. The legacy API may cache briefly.

## Galaxy and fleet meaning

Intrepid is the central protected planet; ten source categories are vault planets; each
active team member is a ship. Home is the system map, Crew is the fleet explorer,
Directory is the working library and Atlas is the business process. Do not reuse ships
as category icons or imply that a lead is the central body everyone reports to.

Vault scope owners come from published resource Owner values. Brand portfolio assignments
do not establish ownership of a category vault. Empty/unavailable source is not proof
of no responsibility or no resources. Movement, vessel type and location encode no rank,
performance, control effectiveness or financial risk.

Home selection highlights a target and opens a non-modal inspector; camera does not pan,
zoom or Fit. Crew selection opens a full member page with an internally scrolling table
and Excel-style column filters. Only hovered, focused
or selected ships pause; other ships retain their time-based speed. Labels remain upright.
Pause, reduced-motion and hidden-tab cleanup are supported. Tiny Crew maps become an
internally scrollable static picker; small Home maps use one grouped planet/person
selector and decorative fleet, avoiding overlapping moving touch targets.

## Quick views are not a new source taxonomy

`type=review-cockpits` is operational/performance review; `type=project-workspace` is
development. They are distinct exact-category views. Neither automatically belongs to
Analytics & Automation. That view requires an exact normalized analytics/automation tag
from the explicit allowlist in `src/services/vaultFilters.ts`; title substrings do not
qualify. AR Trackers uses the AR category or explicit AR tags, not all claimback files.
Country/type/source-category/search/status/priority are AND-combined. Country counts
reflect the other active filters and keep all six markets visible even at zero.

Existing Sheet categories and API records are not rewritten. New `type` URL values are
allowlisted; unknown values fall back to All. `mode=cards` is explicit; no mode or legacy
`mode=compact` uses the table. Clear filters also clears the quick view.

## Typography

The local Outfit/Urbanist subsets lack several Vietnamese glyphs. UI uses pinned
`@fontsource/be-vietnam-pro@5.3.0` at four weights with self-hosted Vietnamese/Latin
subsets and its OFL license. Logo artwork is unchanged. Verify names and financial
wording in both languages; do not treat a computed font-family string alone as glyph proof.
[Fontsource package](https://fontsource.org/fonts/be-vietnam-pro/use),
[upstream license](https://github.com/google/fonts/blob/main/ofl/bevietnampro/OFL.txt).

## Selective repository reuse

Reference patterns, not unreviewed runtime installations:

- [impeccable harden](https://github.com/khaitrantrong2/impeccable/blob/cf3d2fa07d3ad1814ac5fbbbb5b2043b795eaef1/.agents/skills/impeccable/reference/harden.md) and [adapt](https://github.com/khaitrantrong2/impeccable/blob/cf3d2fa07d3ad1814ac5fbbbb5b2043b795eaef1/.agents/skills/impeccable/reference/adapt.md): source/error/empty states, long copy, responsive layout, language and focus.
- [taste-skillkhai](https://github.com/khaitrantrong2/taste-skillkhai/tree/1a6dc0a5ac5d0152120938bf66ed67ea2ec8e552): spacing, typography and restrained interactions, preserving Hub's brand.
- [puppeteerkhai](https://github.com/khaitrantrong2/puppeteerkhai/tree/4a56c699e50f0cd5ff87dd10e43f7defaf3d95a0): search/filter/link/source test coverage principles. Actual verification uses Node regression tests and browser inspection, not an installed Puppeteer runner.
- Existing GSAP remains scoped/cleaned up. diagram-design remains the Atlas relationship reference; see process-atlas.md. Atropos tilt and ppt-master deck tooling are not added to this operational frontend.

## Release gates

Run npm test, npm run build, dependency audit and git diff --check. Inspect the actual
configured preview for desktop/mobile navigation, English-only legacy-language handling,
search/filter/link states, Crew identity and Atlas camera stability. Fixtures do not prove live permissions,
operating effectiveness or cross-browser certification. Review preview before production
merge. Do not broaden source access for a demo. Rollback via previous Vercel deployment,
prior API version and Sheet version history.
