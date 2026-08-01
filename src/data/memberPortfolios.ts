import type { CrewMember } from "./crew";

/**
 * A row of a Value Protector's claimback scope — mirrors the Google Sheet
 * "Portfolio" tab columns: Member · Country · Brand · Class · Complexity · Platforms.
 *
 * Live data loads from the private Google Sheet via the Apps Script API (see
 * apps-script/README.md). The sample below is MOCK for layout only — never commit
 * real brand/scope data here.
 */
export interface PortfolioRow {
  member: string;
  country: string;
  brand: string;
  class: string;
  complexity: string;
  platforms: string[];
}

const SAMPLE: Pick<PortfolioRow, "class" | "complexity" | "platforms">[] = [
  { class: "Consignment", complexity: "Exceptional", platforms: ["Lazada", "Shopee", "Tiktok"] },
  { class: "Consignment", complexity: "Exceptional", platforms: ["Lazada", "Shopee", "Tiktok"] },
  { class: "Hybrid retail", complexity: "Exceptional", platforms: ["Shopee", "Tiktok"] },
  { class: "Hybrid retail", complexity: "Standard", platforms: ["Lazada", "Shopee", "Tiktok"] },
  { class: "Consignment", complexity: "Exceptional", platforms: ["Lazada", "Shopee"] },
  { class: "Hybrid retail", complexity: "Standard", platforms: ["Lazada", "Tiktok"] },
  { class: "Consignment", complexity: "Exceptional", platforms: ["Tiktok"] },
  { class: "Hybrid retail", complexity: "Standard", platforms: ["Lazada", "Shopee", "Tiktok"] },
];

/** Placeholder generator so every member profile renders until the Sheet is wired. */
export function mockPortfolioFor(member: CrewMember): PortfolioRow[] {
  const country = /vietnam|vn/i.test(member.market) ? "VN" : member.market.slice(0, 2).toUpperCase() || "VN";
  return SAMPLE.map((r, i) => ({
    member: member.name,
    country,
    brand: `${member.name} · Brand ${String.fromCharCode(65 + i)}`,
    class: r.class,
    complexity: r.complexity,
    platforms: r.platforms,
  }));
}
