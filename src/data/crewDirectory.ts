import type { CrewFunction, CrewMember } from "./crew";
import type { PortfolioRow } from "./memberPortfolios";

export const CREW_FUNCTIONS: CrewFunction[] = ["team", "automation", "r2r", "ar", "claimback", "support"];
export const CREW_MARKETS = ["Regional", "TH", "VN", "SG", "MY", "PH", "ID", "Rotational"] as const;

export function crewSearchKey(value: string): string {
  return value.normalize("NFD").replace(/\p{Diacritic}/gu, "").replace(/[đĐ]/g, "d").toLowerCase().replace(/\s+/g, " ").trim();
}

export function canonicalPlatform(value: string): string {
  const clean = value.trim().replace(/\s+/g, " ");
  const key = clean.toLowerCase().replace(/[^a-z0-9]/g, "");
  return ({ tiktok: "TikTok Shop", tiktokshop: "TikTok Shop", shopee: "Shopee", lazada: "Lazada" } as Record<string, string>)[key] ?? clean;
}

export function portfolioPlatforms(rows: PortfolioRow[]): string[] {
  const names = new Map<string, string>();
  for (const row of rows) for (const raw of row.platforms) {
    const label = canonicalPlatform(raw);
    if (label) names.set(label.toLowerCase(), label);
  }
  return [...names.values()].sort((a, b) => a.localeCompare(b));
}

export function portfolioSummary(rows: PortfolioRow[]) {
  const brands = new Set(rows.map(row => row.brand.trim().replace(/\s+/g, " ").toLowerCase()).filter(Boolean));
  return { brands: brands.size, rows: rows.length, platforms: portfolioPlatforms(rows).length, unnamedRows: rows.filter(row => !row.brand.trim()).length };
}

export function matchesCrew(member: CrewMember, query: string, market: string, role: string, scope: PortfolioRow[], localizedCopy = ""): boolean {
  if (member.active === false) return false;
  if (market !== "all" && (member.country || member.market) !== market) return false;
  if (role !== "all" && member.function !== role) return false;
  const terms = crewSearchKey(query).split(" ").filter(Boolean);
  const searchable = crewSearchKey([member.name, ...(member.aliases ?? []), member.role, member.roleShort, member.market, member.country, member.blurb, localizedCopy,
    ...scope.flatMap(row => [row.brand, row.country, row.class, row.complexity, ...row.platforms.map(canonicalPlatform)])].join(" "));
  return terms.every(term => searchable.includes(term));
}

export type PortfolioSort = "brand" | "brand-desc" | "country";
export function filterPortfolio(rows: PortfolioRow[], filters: { query: string; country: string; platform: string; complexity: string; sort: PortfolioSort }, locale = "en"): PortfolioRow[] {
  const terms = crewSearchKey(filters.query).split(" ").filter(Boolean);
  const result = rows.filter(row => (filters.country === "all" || row.country === filters.country)
    && (filters.platform === "all" || row.platforms.some(platform => canonicalPlatform(platform).toLowerCase() === filters.platform.toLowerCase()))
    && (filters.complexity === "all" || row.complexity === filters.complexity)
    && terms.every(term => {
      const value = crewSearchKey([row.brand, row.country, row.class, row.complexity, ...row.platforms.map(canonicalPlatform)].join(' '));
      return term.length <= 2 ? value.split(/\s+/).includes(term) : value.includes(term);
    }));
  const collator = new Intl.Collator(locale, { sensitivity: "base", numeric: true });
  return result.sort((a, b) => filters.sort === "country" ? collator.compare(a.country, b.country) || collator.compare(a.brand, b.brand)
    : collator.compare(a.brand, b.brand) * (filters.sort === "brand-desc" ? -1 : 1));
}
