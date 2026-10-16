import { computed, reactive, ref, watch } from "vue";
import type { CategoryId, CountryCode, Criticality, DirectorySource, LinkItem, LinkStatus, Scope, ViewMode } from "../types/links";
import { crew, type CrewMember } from "../data/crew";
import type { PortfolioRow } from "../data/memberPortfolios";
import { isAtlasHash } from "./useAtlasRouteState";
import { parseHubHash, serializeHubHash, type HubRoute, type HubView } from "./hubRoute";
import {
  computeStats,
  filterLinks,
  loadLinks,
  readCachedLinks,
  previewLinks,
  sortLinks,
  type LoadLinksResult,
} from "../services/linkService";

const links = ref<LinkItem[]>([]);
const categories = ref<Awaited<ReturnType<typeof loadLinks>>["categories"]>([]);
const config = ref<Awaited<ReturnType<typeof loadLinks>>["config"] | null>(null);
const source = ref<DirectorySource | null>(null);
const refreshedAt = ref<string | undefined>(undefined);
const error = ref<string | undefined>(undefined);
const isLoading = ref(true);
const portfolioRows = ref<PortfolioRow[]>([]);

const initialRoute = parseHubHash(window.location.hash);
const filters = reactive({
  query: initialRoute.query,
  categoryId: "all" as CategoryId | "all",
  country: initialRoute.country as CountryCode | "all",
  status: initialRoute.status as LinkStatus | "all",
  criticality: initialRoute.criticality as Criticality | "all",
});

const scope = ref<Scope>(initialRoute.scope);
const viewMode = ref<ViewMode>(initialRoute.viewMode);
const criticalOnly = ref(false);
const paletteOpen = ref(false);
const view = ref<HubView>(isAtlasHash(window.location.hash) ? "atlas" : initialRoute.view);
const selectedMember = ref<CrewMember | null>(crew.find((member) => member.id === initialRoute.memberId && member.active !== false) ?? null);
let syncingRoute = false;

// Shared navigation state lives for the app lifetime, including hash links and browser history.
function syncHubView() {
  syncingRoute = true;
  const state = parseHubHash(window.location.hash);
  view.value = isAtlasHash(window.location.hash) ? "atlas" : state.view;
  if (state.view === "sector") {
    scope.value = state.scope;
    filters.query = state.query;
    filters.country = state.country;
    filters.status = state.status;
    filters.criticality = state.criticality;
    viewMode.value = state.viewMode;
    criticalOnly.value = false;
  }
  if (state.view === "member") selectedMember.value = crew.find((member) => member.id === state.memberId && member.active !== false) ?? null;
  syncingRoute = false;
}
window.addEventListener("hashchange", syncHubView);
window.addEventListener("popstate", syncHubView);

function routeState(nextView = view.value): HubRoute {
  return { view: nextView, scope: scope.value, country: filters.country, status: filters.status, criticality: criticalOnly.value ? "High" : filters.criticality, query: filters.query, viewMode: viewMode.value, memberId: selectedMember.value?.id ?? "" };
}
function writeRoute(nextView: HubView, replace = false) {
  const hash = serializeHubHash(routeState(nextView));
  view.value = nextView;
  if (window.location.hash !== hash) window.history[replace ? "replaceState" : "pushState"](window.history.state, "", window.location.pathname + window.location.search + hash);
}
watch([() => filters.query, () => filters.country, () => filters.status, () => filters.criticality, scope, viewMode, criticalOnly], () => {
  if (!syncingRoute && view.value === "sector") writeRoute("sector", true);
}, { flush: "sync" });

const RECENT_WINDOW_DAYS = 30;

let hasLoaded = false;
let hasVerifiedSnapshot = false;
let requestGeneration = 0;
let pendingRequest: AbortController | null = null;

function applyResult(result: LoadLinksResult) {
  links.value = sortLinks(result.links);
  categories.value = result.categories;
  config.value = result.config;
  source.value = result.source;
  refreshedAt.value = result.refreshedAt;
  error.value = result.error;
  portfolioRows.value = result.portfolio;
}

async function fetchLinks() {
  const generation = ++requestGeneration;
  pendingRequest?.abort();
  const controller = new AbortController();
  pendingRequest = controller;
  if (!hasVerifiedSnapshot && source.value !== "mock") {
    const cached = readCachedLinks();
    if (cached) { applyResult(cached); hasVerifiedSnapshot = true; }
  }
  if (source.value === "mock") {
    links.value = []; categories.value = []; portfolioRows.value = []; config.value = null;
    refreshedAt.value = undefined; source.value = "unavailable"; hasVerifiedSnapshot = false;
  }
  isLoading.value = true;
  error.value = undefined;
  try {
    const result = await loadLinks({ signal: controller.signal });
    if (generation !== requestGeneration) return;
    applyResult(result);
    hasVerifiedSnapshot = true;
  } catch {
    if (generation !== requestGeneration) return;
    source.value = hasVerifiedSnapshot ? "stale" : "unavailable";
    error.value = hasVerifiedSnapshot ? "directory.staleWarning" : "directory.unavailableWarning";
  } finally {
    if (generation === requestGeneration) { isLoading.value = false; pendingRequest = null; }
  }
}

function previewDirectory() {
  ++requestGeneration; pendingRequest?.abort(); pendingRequest = null;
  applyResult(previewLinks()); hasVerifiedSnapshot = false; isLoading.value = false;
}

/** Diacritic-insensitive, word-order-independent key: "Hung Tran Vu" and "Tran Vu Hung" → same. */
function nameKey(s: string): string {
  return s
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean)
    .sort()
    .join(" ");
}

/** Live per-member claimback scope from the Sheet, matched by crew name or configured aliases. */
function memberScope(member: CrewMember): PortfolioRow[] {
  const keys = new Set([member.name, ...(member.aliases ?? [])].map(nameKey));
  return portfolioRows.value.filter((r) => keys.has(nameKey(r.member)));
}

function parseDate(value: string): number {
  const t = Date.parse(value);
  return Number.isNaN(t) ? 0 : t;
}

export function useLinks() {
  if (!hasLoaded) {
    hasLoaded = true;
    fetchLinks();
  }

  /** Links after search + facet filters (country/status/criticality) but NOT scope. Drives counts + scope. */
  const baseLinks = computed(() => filterLinks(links.value, { ...filters, categoryId: "all" }));

  const recentCutoff = computed(() => Date.now() - RECENT_WINDOW_DAYS * 24 * 60 * 60 * 1000);

  const criticalLinks = computed(() => baseLinks.value.filter((l) => l.criticality === "High"));

  const recentLinks = computed(() =>
    baseLinks.value.filter((link) => parseDate(link.lastUpdated) >= recentCutoff.value).sort((a, b) => parseDate(b.lastUpdated) - parseDate(a.lastUpdated)),
  );

  const recentCount = computed(() => baseLinks.value.filter((l) => parseDate(l.lastUpdated) >= recentCutoff.value).length);

  const categoryCounts = computed(() => {
    const map = new Map<CategoryId, number>();
    for (const link of baseLinks.value) map.set(link.category, (map.get(link.category) ?? 0) + 1);
    return map;
  });

  /** The links shown in the center workspace for the current scope + toggles. */
  const workspaceLinks = computed(() => {
    let result: LinkItem[];
    if (scope.value === "all") result = baseLinks.value;
    else if (scope.value === "critical") result = criticalLinks.value;
    else if (scope.value === "recent") result = recentLinks.value;
    else result = baseLinks.value.filter((l) => l.category === scope.value);

    if (criticalOnly.value) result = result.filter((l) => l.criticality === "High");
    return result;
  });

  const scopeLabel = computed(() => {
    if (scope.value === "all") return "All links";
    if (scope.value === "critical") return "Critical files";
    if (scope.value === "recent") return "Recently updated";
    return categories.value.find((c) => c.id === scope.value)?.name ?? "Links";
  });

  const activeCategory = computed(() =>
    ["all", "critical", "recent"].includes(scope.value)
      ? null
      : (categories.value.find((c) => c.id === scope.value) ?? null),
  );

  const stats = computed(() => computeStats(links.value, categories.value));

  const availableCountries = computed(() => {
    const set = new Set(links.value.map((l) => l.country).filter(Boolean));
    return Array.from(set).sort();
  });

  const hasActiveFilters = computed(
    () =>
      Boolean(filters.query) ||
      filters.country !== "all" ||
      filters.status !== "all" ||
      filters.criticality !== "all" ||
      criticalOnly.value ||
      scope.value !== "all",
  );

  function clearFilters() {
    filters.query = "";
    filters.categoryId = "all";
    filters.country = "all";
    filters.status = "all";
    filters.criticality = "all";
    criticalOnly.value = false;
    scope.value = "all";
  }

  function selectScope(next: Scope) {
    scope.value = next;
  }

  function openSector(next: Scope) {
    syncingRoute = true;
    clearFilters();
    scope.value = next;
    syncingRoute = false;
    writeRoute("sector");
  }

  function goHome() {
    writeRoute("home");
  }

  function openCrew() {
    writeRoute("crew");
  }

  function openMember(member: CrewMember) {
    selectedMember.value = member;
    writeRoute("member");
  }
  function openMemberById(id: string): boolean {
    const member = crew.find((candidate) => candidate.id === id && candidate.active !== false);
    if (!member) return false;
    openMember(member); return true;
  }
  function openStart() { writeRoute("start"); }

  function openAtlas(stageId?: string) {
    if (stageId && /^(?:0[1-8]|A|B)$/.test(stageId)) {
      view.value = "atlas";
      const hash = `#atlas?mode=guide&stage=${stageId}`;
      if (window.location.hash !== hash) window.history.pushState(window.history.state, "", window.location.pathname + window.location.search + hash);
      // Atlas owns its query state; notify its existing listener instead of duplicating that state.
      if (typeof window.dispatchEvent === "function") window.dispatchEvent(new Event("hashchange"));
      return;
    }
    if (isAtlasHash(window.location.hash)) { view.value = "atlas"; return; }
    writeRoute("atlas");
  }

  return {
    view,
    selectedMember,
    openSector,
    goHome,
    openCrew,
    openMember,
    openMemberById,
    openAtlas,
    openStart,
    memberScope,
    links,
    categories,
    config,
    source,
    refreshedAt,
    error,
    isLoading,
    filters,
    scope,
    viewMode,
    criticalOnly,
    paletteOpen,
    baseLinks,
    workspaceLinks,
    criticalLinks,
    recentLinks,
    recentCount,
    categoryCounts,
    scopeLabel,
    activeCategory,
    stats,
    availableCountries,
    hasActiveFilters,
    clearFilters,
    selectScope,
    refresh: fetchLinks,
    refreshLinks: fetchLinks,
    previewDirectory,
  };
}
