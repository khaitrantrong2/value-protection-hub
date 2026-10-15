import type { AtlasReferenceGroup, AtlasStageId } from "./atlas";

export type AtlasInspectorTab = "summary" | "ownership" | "controls";
export type AtlasLibraryGroup = AtlasReferenceGroup | "all";
export type AtlasChapterId = Exclude<AtlasStageId, "A" | "B">;

/** Shareable reading context only. Camera, dragging and hover never belong in the URL. */
export interface AtlasRouteState {
  mode: "explore" | "story";
  stageId: AtlasStageId | null;
  chapterId: AtlasChapterId;
  inspectorTab: AtlasInspectorTab;
  libraryGroup: AtlasLibraryGroup | null;
  libraryStage: AtlasStageId | "";
  referenceId: string | null;
}

export interface AtlasLibraryOptions {
  group?: AtlasLibraryGroup;
  stageId?: AtlasStageId | "";
  referenceId?: string | null;
}
