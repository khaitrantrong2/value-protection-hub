import { reactive } from "vue";
import type { PortfolioSort } from "../data/crewDirectory";

// Reading preferences survive profile navigation; they never change source assignments.
const crewFilters = reactive({ query: "", market: "all", function: "all" });
const portfolioFilters = new Map<string, ReturnType<typeof createPortfolioFilters>>();
function createPortfolioFilters() { return reactive({ query: "", country: "all", platform: "all", complexity: "all", sort: "brand" as PortfolioSort }); }
export function useCrewDirectory() { return crewFilters; }
export function useMemberPortfolioFilters(id: string) {
  if (!portfolioFilters.has(id)) portfolioFilters.set(id, createPortfolioFilters());
  return portfolioFilters.get(id)!;
}
