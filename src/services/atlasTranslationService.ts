import type { AtlasPayload, AtlasControl, AtlasReference, AtlasStage } from "../types/atlas";
import { ATLAS_TRANSLATABLE_FIELDS, type AtlasTranslation, type AtlasTranslationEntity } from "../types/atlasTranslations";

type Entity = AtlasStage | AtlasControl | AtlasReference;
const plain = (value: unknown): value is Record<string, unknown> => !!value && typeof value === "object" && !Array.isArray(value);
const validText = (value: unknown): value is string => typeof value === "string" && value.length <= 12000 && !/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/.test(value);

/** Optional extensions fail closed on their own; malformed translations never hide the valid source. */
export function parseAtlasTranslations(value: unknown): AtlasTranslation[] {
  if (!Array.isArray(value) || value.length > 1000) return [];
  const translations: AtlasTranslation[] = [];
  for (const row of value) {
    if (!plain(row) || !["stage", "control", "reference"].includes(String(row.entityType))) return [];
    const entityType = row.entityType as AtlasTranslationEntity;
    if (!(ATLAS_TRANSLATABLE_FIELDS[entityType] as readonly string[]).includes(String(row.field)) ||
      typeof row.entityId !== "string" || !/^(?:0[1-8]|[AB]|[A-Za-z][A-Za-z0-9_-]{0,63})$/.test(row.entityId) ||
      !["en", "vi"].includes(String(row.locale)) || !validText(row.text) || !row.text.trim() ||
      typeof row.sourceFingerprint !== "string" || !/^sha256:[a-f0-9]{64}$/.test(row.sourceFingerprint) ||
      row.reviewStatus !== "Reviewed" || row.publication !== "Published" || row.visibility !== "Public") return [];
    translations.push({ entityType, entityId: row.entityId, field: String(row.field), locale: row.locale as "en" | "vi", text: row.text,
      sourceFingerprint: row.sourceFingerprint, reviewStatus: "Reviewed", publication: "Published", visibility: "Public" });
  }
  return translations;
}

/** Canonical JSON is shared with Apps Script; key sorting is locale independent. */
export function canonicalAtlasRecord(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(canonicalAtlasRecord).join(",")}]`;
  if (plain(value)) return `{${Object.keys(value).sort().map(key => `${JSON.stringify(key)}:${canonicalAtlasRecord(value[key])}`).join(",")}}`;
  return JSON.stringify(value);
}
export async function atlasSourceFingerprint(entity: Entity): Promise<string> {
  const digest = await globalThis.crypto.subtle.digest("SHA-256", new TextEncoder().encode(canonicalAtlasRecord(entity)));
  return `sha256:${Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, "0")).join("")}`;
}
function getField(entity: Entity, path: string): unknown {
  return path.split(".").reduce<unknown>((value, key) => plain(value) ? value[key] : undefined, entity);
}
function putField(entity: Entity, path: string, value: string | string[]): void {
  const parts = path.split(".");
  const target = parts.length === 1 ? entity : (entity as unknown as Record<string, Record<string, unknown>>)[parts[0]];
  (target as unknown as Record<string, unknown>)[parts[parts.length - 1]] = value;
}
function translationValue(row: AtlasTranslation, source: unknown): string | string[] | undefined {
  if (typeof source === "string") return row.text.trim();
  if (!Array.isArray(source)) return undefined;
  try {
    const values: unknown = JSON.parse(row.text);
    if (!Array.isArray(values) || values.length !== source.length || values.some(value => !validText(value) || !value.trim())) return undefined;
    return values as string[];
  } catch { return undefined; }
}
async function translateEntity<T extends Entity>(entity: T, type: AtlasTranslationEntity, rows: AtlasTranslation[], locale: "en" | "vi"): Promise<{ entity: T; translated: boolean }> {
  const selected = rows.filter(row => row.entityType === type && row.entityId === entity.id && row.locale === locale);
  if (!selected.length || !globalThis.crypto?.subtle) return { entity, translated: false };
  const fingerprint = await atlasSourceFingerprint(entity);
  const required = ATLAS_TRANSLATABLE_FIELDS[type].filter(field => {
    const value = getField(entity, field); return typeof value === "string" ? !!value.trim() : Array.isArray(value) && value.length > 0;
  });
  const translated = new Map<string, string | string[]>();
  for (const field of required) {
    const candidates = selected.filter(row => row.field === field);
    if (candidates.length !== 1 || candidates[0].sourceFingerprint !== fingerprint) return { entity, translated: false };
    const value = translationValue(candidates[0], getField(entity, field));
    if (value === undefined) return { entity, translated: false };
    translated.set(field, value);
  }
  // Extra stale/duplicate rows also make this logical record ineligible.
  if (selected.some(row => row.sourceFingerprint !== fingerprint || selected.filter(other => other.field === row.field).length !== 1)) return { entity, translated: false };
  // Published records are validated JSON. Vue props may be Proxies, which structuredClone cannot clone.
  const copy = JSON.parse(JSON.stringify(entity)) as T;
  for (const [field, value] of translated) putField(copy, field, value);
  return { entity: copy, translated: true };
}
export async function localizeAtlasPayload(source: AtlasPayload, locale: "en" | "vi") {
  const rows = parseAtlasTranslations(source.translations);
  const stages = await Promise.all(source.stages.map(entity => translateEntity(entity, "stage", rows, locale)));
  const controls = await Promise.all(source.controls.map(entity => translateEntity(entity, "control", rows, locale)));
  const references = await Promise.all(source.references.map(entity => translateEntity(entity, "reference", rows, locale)));
  const translatedKeys = new Set([
    ...stages.filter(item => item.translated).map(item => `stage:${item.entity.id}`),
    ...controls.filter(item => item.translated).map(item => `control:${item.entity.id}`),
    ...references.filter(item => item.translated).map(item => `reference:${item.entity.id}`),
  ]);
  return { data: { ...source, stages: stages.map(item => item.entity), controls: controls.map(item => item.entity), references: references.map(item => item.entity) }, translatedKeys };
}
