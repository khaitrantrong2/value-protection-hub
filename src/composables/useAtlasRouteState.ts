import { onBeforeUnmount, onMounted, reactive } from "vue";
import { ATLAS_STAGE_IDS, type AtlasStageId } from "../types/atlas";
import type { AtlasChapterId, AtlasInspectorTab, AtlasLibraryGroup, AtlasLibraryOptions, AtlasRouteState } from "../types/atlasUi";

const inspectorTabs: readonly AtlasInspectorTab[] = ["summary", "ownership", "controls"];
const libraryGroups: readonly AtlasLibraryGroup[] = ["all", "document-step", "reason-code", "kpi", "pipeline-step", "settlement-route", "escalation", "record", "guidance"];
const isStage = (value: unknown): value is AtlasStageId => typeof value === "string" && ATLAS_STAGE_IDS.includes(value as AtlasStageId);
const isChapter = (value: unknown): value is AtlasChapterId => typeof value === "string" && /^0[1-8]$/.test(value);
const isTab = (value: unknown): value is AtlasInspectorTab => inspectorTabs.includes(value as AtlasInspectorTab);
const isGroup = (value: unknown): value is AtlasLibraryGroup => libraryGroups.includes(value as AtlasLibraryGroup);
const referenceId = (value: unknown): string | null => typeof value === "string" && /^[A-Za-z0-9][A-Za-z0-9_-]{0,79}$/.test(value) ? value : null;

export function isAtlasHash(hash: string): boolean {
  return hash === "#atlas" || hash.startsWith("#atlas?");
}

export function parseAtlasHash(hash: string): AtlasRouteState {
  const state: AtlasRouteState = { mode: "explore", stageId: null, chapterId: "01", inspectorTab: "summary", libraryGroup: null, libraryStage: "", referenceId: null };
  if (!isAtlasHash(hash) || hash.length > 1024) return state;
  const params = new URLSearchParams(hash.slice(7));
  const stage = params.get("stage"), chapter = params.get("chapter"), tab = params.get("tab"), group = params.get("library"), scope = params.get("scope");
  if (params.get("mode") === "story") state.mode = "story";
  if (isChapter(chapter)) state.chapterId = chapter;
  if (isStage(stage)) {
    state.stageId = stage;
    if (isChapter(stage)) state.chapterId = stage;
    if (isTab(tab)) state.inspectorTab = tab;
  }
  if (isGroup(group)) {
    state.libraryGroup = group;
    if (isStage(scope)) state.libraryStage = scope;
    state.referenceId = referenceId(params.get("ref"));
  }
  return state;
}

export function serializeAtlasHash(state: AtlasRouteState): string {
  const params = new URLSearchParams();
  if (state.mode === "story") params.set("mode", "story");
  if (isChapter(state.chapterId) && state.chapterId !== "01" && state.chapterId !== state.stageId) params.set("chapter", state.chapterId);
  if (isStage(state.stageId)) {
    params.set("stage", state.stageId);
    if (isTab(state.inspectorTab) && state.inspectorTab !== "summary") params.set("tab", state.inspectorTab);
  }
  if (isGroup(state.libraryGroup)) {
    params.set("library", state.libraryGroup);
    if (isStage(state.libraryStage)) params.set("scope", state.libraryStage);
    const id = referenceId(state.referenceId);
    if (id) params.set("ref", id);
  }
  const query = params.toString();
  return query ? `#atlas?${query}` : "#atlas";
}

export function useAtlasRouteState() {
  const state = reactive<AtlasRouteState>(parseAtlasHash(window.location.hash));
  function syncFromLocation() {
    if (isAtlasHash(window.location.hash)) Object.assign(state, parseAtlasHash(window.location.hash));
  }
  function commit(next: Partial<AtlasRouteState>, replace = false) {
    const hash = serializeAtlasHash({ ...state, ...next });
    Object.assign(state, parseAtlasHash(hash));
    if (window.location.hash !== hash) window.history[replace ? "replaceState" : "pushState"](window.history.state, "", hash);
  }
  onMounted(() => {
    syncFromLocation();
    window.addEventListener("hashchange", syncFromLocation);
    window.addEventListener("popstate", syncFromLocation);
  });
  onBeforeUnmount(() => {
    window.removeEventListener("hashchange", syncFromLocation);
    window.removeEventListener("popstate", syncFromLocation);
  });

  function selectStage(id: AtlasStageId) {
    if (isStage(id)) commit({ stageId: id, ...(isChapter(id) ? { chapterId: id } : {}) });
  }
  function closeStage() { commit({ stageId: null, inspectorTab: "summary" }, true); }
  function setInspectorTab(tab: AtlasInspectorTab) { if (isTab(tab)) commit({ inspectorTab: tab }, true); }
  function setMode(mode: AtlasRouteState["mode"]) {
    if (mode === "explore" || mode === "story") commit({ mode, stageId: null, inspectorTab: "summary" });
  }
  function setChapter(id: AtlasStageId) {
    if (isChapter(id)) commit({ chapterId: id, stageId: null, inspectorTab: "summary" });
  }
  function openLibrary(options: AtlasLibraryOptions = {}) {
    commit({ libraryGroup: isGroup(options.group) ? options.group : "all", libraryStage: isStage(options.stageId) ? options.stageId : "", referenceId: referenceId(options.referenceId) });
  }
  function closeLibrary() { commit({ libraryGroup: null, libraryStage: "", referenceId: null }, true); }
  function setLibraryGroup(group: AtlasLibraryGroup) {
    if (state.libraryGroup !== null && isGroup(group)) commit({ libraryGroup: group, referenceId: null }, true);
  }
  function setLibraryStage(id: AtlasStageId | "") {
    if (state.libraryGroup !== null && (id === "" || isStage(id))) commit({ libraryStage: id, referenceId: null }, true);
  }
  return { state, selectStage, closeStage, setInspectorTab, setMode, setChapter, openLibrary, closeLibrary, setLibraryGroup, setLibraryStage };
}
