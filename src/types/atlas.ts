import type { AtlasTranslation } from "./atlasTranslations";
/** One editable content contract for the Atlas canvas, story and stage detail. */
export const ATLAS_STAGE_IDS = ["01", "02", "03", "04", "05", "06", "07", "08", "A", "B"] as const;
export type AtlasStageId = (typeof ATLAS_STAGE_IDS)[number];
export type AtlasPracticeState = "reported" | "proposed" | "develop";
export type AtlasEvidenceState = "to-locate" | "located";
export type AtlasControlNature = "preventive" | "detective" | "mixed";
export type AtlasReferenceGroup = "reason-code" | "document-step" | "settlement-route" | "escalation" | "kpi" | "record" | "pipeline-step" | "guidance";

export interface AtlasStage {
  id: AtlasStageId;
  kind: "chapter" | "supporting";
  order: number;
  shortTitle: string;
  title: string;
  businessQuestion: string;
  roleTag: string;
  sipoc: { supplier: string; input: string; process: string; output: string; customer: string };
  raci: { accountable: string; responsible: string[]; consulted: string[]; informed: string[] };
  narrative: string;
  caution: string;
  fork: "none" | "parallel" | "settlement-route" | "qo-mode";
  applicability: string;
  practiceState: AtlasPracticeState;
  /** Technical handoff labels, not proof that every step is automated. */
  pipeline: string[];
  supports: AtlasStageId[];
  referenceIds: string[];
  contentVersion: string;
  effectiveFrom: string;
  updatedAt: string;
  sourceBasis: string;
}

export interface AtlasControl {
  id: string;
  stageId: AtlasStageId;
  title: string;
  wcgw: string;
  assertions: string[];
  nature: AtlasControlNature;
  frequency: string;
  ownerRole: string;
  practiceState: AtlasPracticeState;
  evidenceLocation: string;
  evidenceState: AtlasEvidenceState;
  limitation: string;
  contentVersion: string;
  sourceBasis: string;
}

export interface AtlasReference {
  id: string;
  stageId: AtlasStageId | "";
  order: number;
  group: AtlasReferenceGroup;
  title: string;
  body: string;
  applicability: string;
  /** Blank for internal evidence locations; only allowlisted public HTTPS URLs are serialized. */
  url: string;
  practiceState: AtlasPracticeState;
  contentVersion: string;
}

export interface AtlasPayload {
  schemaVersion: 1;
  meta: {
    contentVersion: string;
    processStatus: string;
    effectiveFrom: string;
    updatedAt: string;
    generatedAt: string;
    subtitle: string;
  };
  stages: AtlasStage[];
  controls: AtlasControl[];
  references: AtlasReference[];
  /** Optional reviewed overlays; absent on the legacy deployment. Source records stay authoritative. */
  translations?: AtlasTranslation[];
}

export type AtlasApiResponse = { ok: true; atlas: AtlasPayload } | { ok: false; error: { code: string; message: string } };

/** Columns are header-mapped. Publication is not a control-effectiveness judgement. */
export const ATLAS_STAGE_COLUMNS = [
  "ID", "Kind", "Order", "ShortTitle", "Title", "BusinessQuestion", "RoleTag", "Supplier", "Input", "Process", "Output", "Customer",
  "Accountable", "Responsible", "Consulted", "Informed", "Narrative", "Caution", "Fork", "Applicability", "PracticeState", "Pipeline",
  "Supports", "ReferenceIDs", "Publication", "Visibility", "ContentVersion", "EffectiveFrom", "UpdatedAt", "SourceBasis",
] as const;
export const ATLAS_CONTROL_COLUMNS = [
  "ID", "StageID", "Title", "WCGW", "Assertions", "Nature", "Frequency", "OwnerRole", "PracticeState", "EvidenceLocation", "EvidenceState",
  "Limitation", "Publication", "Visibility", "ContentVersion", "SourceBasis",
] as const;
export const ATLAS_REFERENCE_COLUMNS = [
  "ID", "StageID", "Order", "Group", "Title", "Body", "Applicability", "URL", "PracticeState", "Publication", "Visibility", "ContentVersion",
] as const;
export const ATLAS_CONFIG_COLUMNS = ["Key", "Value", "Publication", "Visibility"] as const;
