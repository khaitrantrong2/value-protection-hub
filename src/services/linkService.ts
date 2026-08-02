import type {
  CategoryDef,
  CategoryId,
  CategoryRow,
  ConfigRow,
  Criticality,
  CountryCode,
  LinkFilters,
  LinkItem,
  LinkRow,
  LinkStatus,
  LinksApiResponse,
  PortalConfig,
  PortfolioRowRaw,
} from "../types/links";
import type { PortfolioRow } from "../data/memberPortfolios";
import { mockCategories } from "../data/mockCategories";
import { mockLinks } from "../data/mockLinks";

const API_URL = import.meta.env.VITE_LINKS_API_URL as string | undefined;

const DEFAULT_CONFIG: PortalConfig = {
  portalName: "Value Protection Hub",
  subtitle: "Claimback, AR & Finance Control Workspace",
  maintainer: "Value Protection / Claimback Team",
  adminSheetUrl: "",
  requestLinkUrl: "",
  lastUpdatedNote: "",
};

const NAME_TO_ID: Record<string, CategoryId> = Object.fromEntries(
  mockCategories.map((c) => [c.name.toLowerCase(), c.id]),
) as Record<string, CategoryId>;

function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function toCategoryId(rawCategory: string): CategoryId {
  const known = NAME_TO_ID[rawCategory.trim().toLowerCase()];
  if (known) return known;
  return slugify(rawCategory) as CategoryId;
}

function toBool(value: string | boolean): boolean {
  if (typeof value === "boolean") return value;
  return String(value).trim().toUpperCase() === "TRUE";
}

function toNumber(value: string | number, fallback = 999): number {
  const n = typeof value === "number" ? value : Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function toTags(value: string): string[] {
  return value
    .split(/[,|]/)
    .map((tag) => tag.trim())
    .filter(Boolean);
}

function toStatus(value: string): LinkStatus {
  const v = value.trim().toLowerCase();
  if (v === "review") return "Review";
  if (v === "blocked") return "Blocked";
  if (v === "archived") return "Archived";
  return "Active";
}

function toCriticality(value: string): Criticality {
  const v = value.trim().toLowerCase();
  if (v === "high") return "High";
  if (v === "low") return "Low";
  return "Medium";
}

function toCountry(value: string): CountryCode | "" {
  const v = value.trim().toUpperCase();
  const known: CountryCode[] = ["VN", "SG", "MY", "ID", "PH", "TH", "Regional"];
  const match = known.find((c) => c.toUpperCase() === v);
  if (match) return match;
  return v ? "Regional" : "";
}

function parseLinkRow(row: LinkRow): LinkItem {
  return {
    id: String(row.ID ?? "").trim(),
    category: toCategoryId(row.Category ?? ""),
    title: String(row.Title ?? "").trim(),
    description: String(row.Description ?? "").trim(),
    url: String(row.URL ?? "").trim(),
    owner: String(row.Owner ?? "").trim(),
    country: toCountry(row.Country ?? ""),
    status: toStatus(row.Status ?? ""),
    tags: toTags(row.Tags ?? ""),
    accessNote: String(row.AccessNote ?? "").trim(),
    criticality: toCriticality(row.Criticality ?? ""),
    sortOrder: toNumber(row.SortOrder),
    isActive: toBool(row.IsActive ?? true),
    lastUpdated: String(row.LastUpdated ?? "").trim(),
  };
}

function parseCategoryRow(row: CategoryRow): CategoryDef {
  const id = toCategoryId(row.Category ?? "");
  const seed = mockCategories.find((c) => c.id === id);
  return {
    id,
    name: row.Category?.trim() || seed?.name || id,
    description: row.Description?.trim() || seed?.description || "",
    color: row.Color?.trim() || seed?.color || "var(--accent-gray)",
    icon: row.Icon?.trim() || seed?.icon || "folder",
    sortOrder: toNumber(row.SortOrder, seed?.sortOrder ?? 999),
  };
}

function parseConfigRows(rows: ConfigRow[] | undefined): PortalConfig {
  if (!rows || rows.length === 0) return DEFAULT_CONFIG;
  const map = new Map(rows.map((r) => [r.Key, r.Value]));
  return {
    portalName: map.get("PortalName") || DEFAULT_CONFIG.portalName,
    subtitle: map.get("Subtitle") || DEFAULT_CONFIG.subtitle,
    maintainer: map.get("Maintainer") || DEFAULT_CONFIG.maintainer,
    adminSheetUrl: map.get("AdminSheetUrl") || "",
    requestLinkUrl: map.get("RequestLinkUrl") || "",
    lastUpdatedNote: map.get("LastUpdatedNote") || "",
  };
}

/** Fills in any category referenced by a link but missing from the Categories tab / mock seed. */
function withFallbackCategories(links: LinkItem[], categories: CategoryDef[]): CategoryDef[] {
  const known = new Set(categories.map((c) => c.id));
  const missing = new Set(links.map((l) => l.category).filter((id) => !known.has(id)));
  const fallbacks: CategoryDef[] = Array.from(missing).map((id) => ({
    id,
    name: id,
    description: "",
    color: "var(--accent-gray)",
    icon: "folder",
    sortOrder: 999,
  }));
  return [...categories, ...fallbacks].sort((a, b) => a.sortOrder - b.sortOrder);
}

function parsePortfolioRow(row: PortfolioRowRaw): PortfolioRow {
  return {
    member: String(row.Member ?? "").trim(),
    country: String(row.Country ?? "").trim(),
    brand: String(row.Brand ?? "").trim(),
    class: String(row.Class ?? "").trim(),
    complexity: String(row.Complexity ?? "").trim(),
    platforms: String(row.Platforms ?? "")
      .split(/[,|]/)
      .map((p) => p.trim())
      .filter(Boolean),
  };
}

export interface LoadLinksResult {
  links: LinkItem[];
  categories: CategoryDef[];
  config: PortalConfig;
  portfolio: PortfolioRow[];
  source: "live" | "mock";
  error?: string;
}

const CACHE_KEY = "vph:data:v1";
const CACHE_TTL = 10 * 60 * 1000; // 10 minutes

/** Returns the last successful live payload from localStorage for instant first paint (stale-while-revalidate). */
export function readCachedLinks(): LoadLinksResult | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const c = JSON.parse(raw) as {
      ts: number;
      links: LinkItem[];
      categories: CategoryDef[];
      config: PortalConfig;
      portfolio?: PortfolioRow[];
    };
    if (!c.ts || Date.now() - c.ts > CACHE_TTL) return null;
    return { links: c.links, categories: c.categories, config: c.config, portfolio: c.portfolio ?? [], source: "live" };
  } catch {
    return null;
  }
}

function writeCache(result: LoadLinksResult): void {
  try {
    localStorage.setItem(
      CACHE_KEY,
      JSON.stringify({
        ts: Date.now(),
        links: result.links,
        categories: result.categories,
        config: result.config,
        portfolio: result.portfolio,
      }),
    );
  } catch {
    /* storage unavailable / quota exceeded */
  }
}

function loadMock(error?: string): LoadLinksResult {
  return {
    links: mockLinks.filter((l) => l.isActive),
    categories: [...mockCategories].sort((a, b) => a.sortOrder - b.sortOrder),
    config: DEFAULT_CONFIG,
    portfolio: [],
    source: "mock",
    error,
  };
}

export async function loadLinks(): Promise<LoadLinksResult> {
  if (!API_URL) {
    return loadMock();
  }

  try {
    const response = await fetch(API_URL, { method: "GET" });
    if (!response.ok) throw new Error(`API responded with ${response.status}`);

    const data = (await response.json()) as LinksApiResponse;
    const links = (data.links ?? []).map(parseLinkRow).filter((l) => l.isActive && l.id);
    const categories = withFallbackCategories(
      links,
      (data.categories ?? []).map(parseCategoryRow).length
        ? (data.categories ?? []).map(parseCategoryRow)
        : [...mockCategories],
    );
    const config = parseConfigRows(data.config);
    const portfolio = (data.portfolio ?? []).map(parsePortfolioRow).filter((p) => p.member);

    const result: LoadLinksResult = { links, categories, config, portfolio, source: "live" };
    writeCache(result);
    return result;
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return { ...loadMock(message), error: "Unable to load live links. Showing local mock data." };
  }
}

export function sortLinks(links: LinkItem[]): LinkItem[] {
  return [...links].sort((a, b) => {
    if (a.sortOrder !== b.sortOrder) return a.sortOrder - b.sortOrder;
    if (a.category !== b.category) return a.category.localeCompare(b.category);
    return a.title.localeCompare(b.title);
  });
}

export function filterLinks(links: LinkItem[], filters: LinkFilters): LinkItem[] {
  const query = filters.query.trim().toLowerCase();

  return links.filter((link) => {
    if (filters.categoryId !== "all" && link.category !== filters.categoryId) return false;
    if (filters.country !== "all" && link.country !== filters.country) return false;
    if (filters.status !== "all" && link.status !== filters.status) return false;
    if (filters.criticality !== "all" && link.criticality !== filters.criticality) return false;

    if (!query) return true;

    const haystack = [link.title, link.description, link.category, link.owner, link.country, link.status, ...link.tags]
      .join(" ")
      .toLowerCase();

    return haystack.includes(query);
  });
}

export function computeStats(links: LinkItem[], categories: CategoryDef[]) {
  return {
    activeLinks: links.filter((l) => l.status === "Active").length,
    categories: categories.length,
    criticalFiles: links.filter((l) => l.criticality === "High").length,
    restrictedItems: links.filter((l) => Boolean(l.accessNote)).length,
  };
}
