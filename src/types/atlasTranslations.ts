/** Translations are a separate publication decision, never a change to source/control state. */
export const ATLAS_TRANSLATION_COLUMNS = ["EntityType", "EntityID", "Field", "Locale", "Text", "SourceFingerprint", "ReviewStatus", "Publication", "Visibility"] as const;
export const ATLAS_TRANSLATABLE_FIELDS = {
  stage: ["shortTitle", "title", "businessQuestion", "roleTag", "sipoc.supplier", "sipoc.input", "sipoc.process", "sipoc.output", "sipoc.customer", "raci.accountable", "raci.responsible", "raci.consulted", "raci.informed", "narrative", "caution", "applicability", "pipeline"],
  control: ["title", "wcgw", "assertions", "frequency", "ownerRole", "limitation"],
  reference: ["title", "body", "applicability"],
} as const;
export type AtlasTranslationEntity = keyof typeof ATLAS_TRANSLATABLE_FIELDS;
export interface AtlasTranslation {
  entityType: AtlasTranslationEntity;
  entityId: string;
  field: string;
  locale: "en" | "vi";
  text: string;
  sourceFingerprint: string;
  reviewStatus: "Reviewed";
  publication: "Published";
  visibility: "Public";
}
