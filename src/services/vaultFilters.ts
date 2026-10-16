import type { DirectoryQuickView, LinkItem } from "../types/links";
import { normalizeSearch } from "./search";

// Exact tags only: a project or review category does not establish analytics scope.
const analyticsTags = new Set(["analytics", "automation", "analytics automation", "data analytics", "data automation", "phan tich du lieu", "tu dong hoa"]);
const arTags = new Set(["ar", "ar tracker", "ar trackers", "accounts receivable", "receivables", "cong no", "theo doi cong no"]);

export function matchesVaultQuickView(link: LinkItem, quickView: DirectoryQuickView): boolean {
  const tags = link.tags.map(normalizeSearch);
  switch (quickView) {
    case "ar-trackers": return link.category === "ar-collection" || tags.some((tag) => arTags.has(tag));
    case "netsuite-links": return link.category === "netsuite-saved-searches";
    case "analytics-automation": return tags.some((tag) => analyticsTags.has(tag));
    case "review-cockpits": return link.category === "review-cockpits";
    case "project-workspace": return link.category === "project-workspace";
    case "process-documents": return link.category === "sop-policy-training";
    default: return true;
  }
}

export function filterVaultQuickView(links: LinkItem[], quickView: DirectoryQuickView): LinkItem[] {
  return links.filter((link) => matchesVaultQuickView(link, quickView));
}
