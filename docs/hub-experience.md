# Hub experience: bilingual UI and team-first discovery

## Decisions

Keep Vue/Vite, existing brand tokens and GSAP. Improve the whole Hub instead of creating
a separate visual system for Atlas or Crew.

**Interface language is not business approval.** Pinned vue-i18n 11.4.14 owns UI catalogs.
Original process records remain the source of truth. The optional Sheet overlay only
translates complete logical records matching the current whole-record fingerprint.
No runtime machine translation or auto-review. See [translation contract](atlas-translations.md).

**Presentation is not a reporting line.** Crew groups describe collaboration functions
and market coverage, not an organizational hierarchy. All active people use the same
card. Lead responsibilities remain visible without a central hero, command wording or
clearance badge. Inactive identities are retained in source but hidden from active roster.

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
- Directory Cards/List and filters remain usable on narrow screens; filter URL state is shareable. Crew/profile filters are retained in-session only.
- Native dialogs contain focus and restore it when closed. Page shortcuts ignore inputs, selects, editable content and open dialogs. Skip link, visible focus and reduced motion are preserved.
- Source states distinguish live, retained/stale, unavailable and explicit demo. Original timestamps survive failed refreshes; late responses cannot overwrite newer requests.
- Missing/blocked/invalid destinations have no Open. Session-link warnings do not claim access was checked; copy success/failure is visible.
- Explore retains its canvas through Guide navigation. Locale, source popover and pipeline visibility do not reframe it.

## Selective repository reuse

Reference patterns, not unreviewed runtime installations:

- [impeccable harden](https://github.com/khaitrantrong2/impeccable/blob/cf3d2fa07d3ad1814ac5fbbbb5b2043b795eaef1/.agents/skills/impeccable/reference/harden.md) and [adapt](https://github.com/khaitrantrong2/impeccable/blob/cf3d2fa07d3ad1814ac5fbbbb5b2043b795eaef1/.agents/skills/impeccable/reference/adapt.md): source/error/empty states, long copy, responsive layout, language and focus.
- [taste-skillkhai](https://github.com/khaitrantrong2/taste-skillkhai/tree/1a6dc0a5ac5d0152120938bf66ed67ea2ec8e552): spacing, typography and restrained interactions, preserving Hub's brand.
- [puppeteerkhai](https://github.com/khaitrantrong2/puppeteerkhai/tree/4a56c699e50f0cd5ff87dd10e43f7defaf3d95a0): search/filter/link/source test coverage principles. Actual verification uses Node regression tests and browser inspection, not an installed Puppeteer runner.
- Existing GSAP remains scoped/cleaned up. diagram-design remains the Atlas relationship reference; see process-atlas.md. Atropos tilt and ppt-master deck tooling are not added to this operational frontend.

## Release gates

Run npm test, npm run build, dependency audit and git diff --check. Inspect the actual
configured preview for desktop/mobile navigation, EN/VI context, search/filter/link states,
Crew symmetry and Atlas camera stability. Fixtures do not prove live permissions,
operating effectiveness or cross-browser certification. Review preview before production
merge. Do not broaden source access for a demo. Rollback via previous Vercel deployment,
prior API version and Sheet version history.
