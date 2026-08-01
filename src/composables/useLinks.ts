import { computed, reactive, ref } from "vue";
import type { CategoryId, CountryCode, Criticality, LinkItem, LinkStatus, Scope, ViewMode } from "../types/links";
import { computeStats, filterLinks, loadLinks, sortLinks } from "../services/linkService";

const links = ref<LinkItem[]>([]);
const categories = ref<Awaited<ReturnType<typeof loadLinks>>["categories"]>([]);
const config = ref<Awaited<ReturnType<typeof loadLinks>>["config"] | null>(null);
const source = ref<"live" | "mock" | null>(null);
const error = ref<string | undefined>(undefined);
const isLoading = ref(true);

const filters = reactive({
  query: "",
  categoryId: "all" as CategoryId | "all",
  country: "all" as CountryCode | "all",
  status: "all" as LinkStatus | "all",
  criticality: "all" as Criticality | "all",
});

const scope = ref<Scope>("all");
const viewMode = ref<ViewMode>("compact");
const criticalOnly = ref(false);
const paletteOpen = ref(false);
const view = ref<"home" | "sector">("home");

const RECENT_WINDOW_DAYS = 30;

let hasLoaded = false;

async function fetchLinks() {
  isLoading.value = true;
  const result = await loadLinks();
  links.value = sortLinks(result.links);
  categories.value = result.categories;
  config.value = result.config;
  source.value = result.source;
  error.value = result.error;
  isLoading.value = false;
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

  const maxDate = computed(() => links.value.reduce((max, l) => Math.max(max, parseDate(l.lastUpdated)), 0));

  const recentCutoff = computed(() => maxDate.value - RECENT_WINDOW_DAYS * 24 * 60 * 60 * 1000);

  const criticalLinks = computed(() => baseLinks.value.filter((l) => l.criticality === "High"));

  const recentLinks = computed(() =>
    [...baseLinks.value].sort((a, b) => parseDate(b.lastUpdated) - parseDate(a.lastUpdated)),
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
    scope.value = next;
    criticalOnly.value = false;
    filters.query = "";
    view.value = "sector";
    window.scrollTo({ top: 0, behavior: "auto" });
  }

  function goHome() {
    view.value = "home";
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  return {
    view,
    openSector,
    goHome,
    links,
    categories,
    config,
    source,
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
  };
}
