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
import { matchesSearch } from "./search";
import { getLinkDestination } from "./linkSafety";

const API_URL = (import.meta.env.VITE_LINKS_API_URL as string | undefined)?.trim() ?? "";

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
  return v === "active" ? "Active" : "Review";
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
    category: toCategoryId(String(row.Category ?? "")),
    title: String(row.Title ?? "").trim(),
    description: String(row.Description ?? "").trim(),
    url: String(row.URL ?? "").trim(),
    owner: String(row.Owner ?? "").trim(),
    country: toCountry(String(row.Country ?? "")),
    status: toStatus(String(row.Status ?? "")),
    tags: toTags(String(row.Tags ?? "")),
    accessNote: String(row.AccessNote ?? "").trim(),
    criticality: toCriticality(String(row.Criticality ?? "")),
    sortOrder: toNumber(row.SortOrder),
    isActive: toBool(row.IsActive ?? true),
    lastUpdated: String(row.LastUpdated ?? "").trim(),
  };
}

function parseCategoryRow(row: CategoryRow): CategoryDef {
  const id = toCategoryId(String(row.Category ?? ""));
  const seed = mockCategories.find((c) => c.id === id);
  return {
    id,
    name: String(row.Category ?? "").trim() || seed?.name || id,
    description: String(row.Description ?? "").trim() || seed?.description || "",
    color: String(row.Color ?? "").trim() || seed?.color || "var(--accent-gray)",
    icon: String(row.Icon ?? "").trim() || seed?.icon || "folder",
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
    adminSheetUrl: getLinkDestination({ url: map.get("AdminSheetUrl") || "" }).href ?? "",
    requestLinkUrl: getLinkDestination({ url: map.get("RequestLinkUrl") || "" }).href ?? "",
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
  source: "live" | "stale" | "mock";
  refreshedAt?: string;
  error?: string;
}

const CACHE_KEY = "vph:data:v2:";
const CACHE_TTL = 10 * 60 * 1000; // 10 minutes
const MAX_BYTES = 2 * 1024 * 1024;
const REQUEST_TIMEOUT = 12000;
type CacheStorage = Pick<Storage, "getItem" | "setItem">;
export interface DirectoryLoadOptions { apiUrl?: string; signal?: AbortSignal; fetcher?: typeof fetch; storage?: CacheStorage | null }

function cacheStorage(options: DirectoryLoadOptions): CacheStorage | null {
  if (options.storage !== undefined) return options.storage;
  try { return typeof localStorage === "undefined" ? null : localStorage; } catch { return null; }
}
function cacheKey(apiUrl: string): string {
  let hash = 2166136261;
  for (const char of apiUrl) hash = Math.imul(hash ^ char.charCodeAt(0), 16777619);
  return CACHE_KEY + (hash >>> 0).toString(36);
}
function rowArray(value: unknown, max: number): value is Record<string, string | number | boolean | null>[] {
  return Array.isArray(value) && value.length <= max && value.every((row) => row && typeof row === "object" && !Array.isArray(row) && Object.keys(row).length <= 50 && Object.values(row).every((cell) => cell == null || typeof cell === "boolean" || (typeof cell === "number" && Number.isFinite(cell)) || (typeof cell === "string" && cell.length <= 12000)));
}
function parsePayload(value: unknown): Omit<LoadLinksResult, "source" | "refreshedAt"> {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error();
  const data = value as Record<string, unknown>;
  if (!rowArray(data.links, 5000) || (data.categories !== undefined && !rowArray(data.categories, 100)) || (data.config !== undefined && !rowArray(data.config, 100)) || (data.portfolio !== undefined && !rowArray(data.portfolio, 20000))) throw new Error();
  const rows = data as unknown as LinksApiResponse;
  const parsedLinks = rows.links.map(parseLinkRow);
  if (parsedLinks.some(link => link.isActive && (!link.id || !link.title))) throw new Error();
  const links = parsedLinks.filter(link => link.isActive);
  if (new Set(links.map((link) => link.id)).size !== links.length) throw new Error();
  const parsedCategories = (rows.categories ?? []).map(parseCategoryRow);
  return { links, categories: withFallbackCategories(links, parsedCategories.length ? parsedCategories : [...mockCategories]), config: parseConfigRows(rows.config), portfolio: (rows.portfolio ?? []).map(parsePortfolioRow).filter((row) => row.member) };
}

function validCachedResult(value: unknown): value is LoadLinksResult {
  if (!value || typeof value !== "object") return false;
  const result = value as LoadLinksResult;
  const strings = (record: unknown, keys: string[]) => !!record && typeof record === "object" && keys.every((key) => typeof (record as Record<string, unknown>)[key] === "string");
  const stringArray = (items: unknown): items is string[] => Array.isArray(items) && items.length <= 100 && items.every((item) => typeof item === "string");
  const linksValid = Array.isArray(result.links) && result.links.length <= 5000 && result.links.every((link) => strings(link, ["id", "title", "url", "description", "owner", "category", "country", "status", "criticality", "lastUpdated", "accessNote"]) && Number.isFinite(link.sortOrder) && typeof link.isActive === "boolean" && stringArray(link.tags));
  const categoriesValid = Array.isArray(result.categories) && result.categories.length <= 100 && result.categories.every((category) => strings(category, ["id", "name", "icon", "color", "description"]) && Number.isFinite(category.sortOrder));
  const portfolioValid = Array.isArray(result.portfolio) && result.portfolio.length <= 20000 && result.portfolio.every((row) => strings(row, ["member", "country", "brand", "class", "complexity"]) && stringArray(row.platforms));
  return linksValid && categoriesValid && portfolioValid && strings(result.config, ["portalName", "subtitle", "maintainer", "adminSheetUrl", "requestLinkUrl", "lastUpdatedNote"]);
}

/** A retained copy is never relabelled live; its original fetch timestamp is preserved. */
export function readCachedLinks(options: DirectoryLoadOptions = {}): LoadLinksResult | null {
  try {
    const apiUrl = options.apiUrl ?? API_URL;
    if (!apiUrl) return null;
    const raw = cacheStorage(options)?.getItem(cacheKey(apiUrl));
    if (!raw || raw.length > MAX_BYTES) return null;
    const c = JSON.parse(raw);
    if (c.apiUrl !== apiUrl || !Number.isFinite(c.ts) || c.ts > Date.now() || Date.now() - c.ts > CACHE_TTL || !validCachedResult(c.result) || c.result.refreshedAt !== new Date(c.ts).toISOString()) return null;
    return { ...c.result, config: { ...c.result.config, adminSheetUrl: getLinkDestination({ url: c.result.config.adminSheetUrl }).href ?? "", requestLinkUrl: getLinkDestination({ url: c.result.config.requestLinkUrl }).href ?? "" }, source: "stale" };
  } catch {
    return null;
  }
}

function writeCache(result: LoadLinksResult, apiUrl: string, options: DirectoryLoadOptions): void {
  try {
    cacheStorage(options)?.setItem(cacheKey(apiUrl), JSON.stringify({ apiUrl, ts: Date.parse(result.refreshedAt ?? ""), result }));
  } catch {
    /* storage unavailable / quota exceeded */
  }
}

export function previewLinks(): LoadLinksResult {
  return {
    links: mockLinks.filter((l) => l.isActive),
    categories: [...mockCategories].sort((a, b) => a.sortOrder - b.sortOrder),
    config: DEFAULT_CONFIG,
    portfolio: [],
    source: "mock",
  };
}

export async function loadLinks(options: DirectoryLoadOptions = {}): Promise<LoadLinksResult> {
  const apiUrl = options.apiUrl ?? API_URL;
  const controller = new AbortController();
  const abort = () => controller.abort();
  let timeout: ReturnType<typeof setTimeout> | undefined;
  options.signal?.addEventListener("abort", abort, { once: true });
  try {
    if (!getLinkDestination({ url: apiUrl }).href || options.signal?.aborted) throw new Error();
    const request = (async () => {
      const response = await (options.fetcher ?? fetch)(apiUrl, { method: "GET", signal: controller.signal, credentials: "omit" });
      if (!response.ok || Number(response.headers.get("content-length") ?? 0) > MAX_BYTES) throw new Error();
      if (!response.body) { const text = await response.text(); if (text.length > MAX_BYTES) throw new Error(); return JSON.parse(text); }
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let bytes = 0, text = "";
      try {
        for (;;) {
          const chunk = await reader.read();
          if (chunk.done) break;
          bytes += chunk.value.byteLength;
          if (bytes > MAX_BYTES) { await reader.cancel(); throw new Error(); }
          text += decoder.decode(chunk.value, { stream: true });
        }
        return JSON.parse(text + decoder.decode());
      } finally { reader.releaseLock(); }
    })();
    const data = await Promise.race([request, new Promise<never>((_, reject) => { timeout = setTimeout(() => { controller.abort(); reject(new Error()); }, REQUEST_TIMEOUT); })]);
    if (controller.signal.aborted) throw new Error();
    const result: LoadLinksResult = { ...parsePayload(data), source: "live", refreshedAt: new Date().toISOString() };
    writeCache(result, apiUrl, options);
    return result;
  } catch { throw new Error("Directory source unavailable. No live data could be verified."); }
  finally { if (timeout) clearTimeout(timeout); options.signal?.removeEventListener("abort", abort); }
}

export function sortLinks(links: LinkItem[]): LinkItem[] {
  return [...links].sort((a, b) => {
    if (a.sortOrder !== b.sortOrder) return a.sortOrder - b.sortOrder;
    if (a.category !== b.category) return a.category.localeCompare(b.category);
    return a.title.localeCompare(b.title);
  });
}

export function filterLinks(links: LinkItem[], filters: LinkFilters): LinkItem[] {
  const query = filters.query.trim();

  return links.filter((link) => {
    if (filters.categoryId !== "all" && link.category !== filters.categoryId) return false;
    if (filters.country !== "all" && link.country !== filters.country) return false;
    if (filters.status !== "all" && link.status !== filters.status) return false;
    if (filters.criticality !== "all" && link.criticality !== filters.criticality) return false;

    if (!query) return true;

    return matchesSearch(query, [link.title, link.description, link.category, link.owner, link.country, link.status, ...link.tags]);
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
