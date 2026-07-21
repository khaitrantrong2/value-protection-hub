import { computed, reactive, ref } from "vue";
import type { CategoryId, CountryCode, Criticality, LinkStatus } from "../types/links";
import { computeStats, filterLinks, loadLinks, sortLinks } from "../services/linkService";

const links = ref<ReturnType<typeof sortLinks>>([]);
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

export function useLinks() {
  if (!hasLoaded) {
    hasLoaded = true;
    fetchLinks();
  }

  const filteredLinks = computed(() => filterLinks(links.value, filters));

  const groupedByCategory = computed(() => {
    const groups = new Map<CategoryId, typeof links.value>();
    for (const link of filteredLinks.value) {
      const list = groups.get(link.category) ?? [];
      list.push(link);
      groups.set(link.category, list);
    }
    return categories.value
      .filter((category) => groups.has(category.id))
      .map((category) => ({ category, links: groups.get(category.id) ?? [] }));
  });

  const stats = computed(() => computeStats(links.value, categories.value));

  const availableCountries = computed(() => {
    const set = new Set(links.value.map((l) => l.country).filter(Boolean));
    return Array.from(set).sort();
  });

  function clearFilters() {
    filters.query = "";
    filters.categoryId = "all";
    filters.country = "all";
    filters.status = "all";
    filters.criticality = "all";
  }

  return {
    links,
    categories,
    config,
    source,
    error,
    isLoading,
    filters,
    filteredLinks,
    groupedByCategory,
    stats,
    availableCountries,
    clearFilters,
    refresh: fetchLinks,
  };
}
