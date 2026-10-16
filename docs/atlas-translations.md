# Reviewed Atlas translations

The optional `Translations` Sheet tab extends the existing API without changing source records or requiring a second frontend request. `action=atlas` includes an optional `atlas.translations`; `action=translations` returns the same eligible overlay rows. Old deployments without the extension remain supported.

Header contract: `EntityType, EntityID, Field, Locale, Text, SourceFingerprint, ReviewStatus, Publication, Visibility`.

- `EntityType`: `stage`, `control`, `reference`; `EntityID`: exact published source ID. Never a title/name match.
- `Field`: exact allowlisted dotted path in `ATLAS_TRANSLATABLE_FIELDS` (identical in Apps Script and TypeScript). IDs, URLs, source/evidence locations, dates, links, versions, control/evidence states, order and counts are excluded.
- `Locale`: `en` or `vi`. `Text`: plain text, never HTML. Array fields (`raci.responsible`, `raci.consulted`, `raci.informed`, `pipeline`, `assertions`) use a JSON string array with the same item count as the source.
- `SourceFingerprint`: `sha256:` followed by lowercase SHA-256 of UTF-8 canonical JSON of the **entire published normalized source record**. Recursively sort object keys using JavaScript `.sort()`; preserve array order. Use `atlasSourceFingerprint_` / `atlasSourceFingerprint` rather than manually hashing a Sheet row. Any source content, state, linkage or version change invalidates the old overlay.
- Eligibility requires exact `ReviewStatus=Reviewed`, `Publication=Published`, `Visibility=Public`. Do not set these values automatically. Start new rows as `Draft`, `Draft`, `Internal`; a human reviewer makes each publication decision.

The frontend independently recomputes the fingerprint. It translates a whole logical record only when every nonblank allowlisted field has exactly one current reviewed translation. A missing field, stale fingerprint, invalid array or duplicate makes the entire record fall back to the source; source text is never blanked or partially substituted. Source-language fallback is explicitly disclosed. A reviewed translation is not approval of the process or evidence of operating effectiveness.

Missing/malformed/oversized optional tab returns no translations; the source API keeps working. No translation engine, third-party translation API or automatic upload is used. Sheet access controls still govern the underlying source: API publication filters do not make a publicly shared Sheet private.
