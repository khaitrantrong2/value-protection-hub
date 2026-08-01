import type { CrewMember } from "./crew";

/**
 * A row of a Value Protector's claimback scope — mirrors the Google Sheet columns
 * (Country · Brand · Class · Stream · In-Scope Platforms).
 *
 * MOCK DATA for layout only. Real per-member scope will be loaded from the private
 * Google Sheet (one tab, or a `Member` column) via the Apps Script API — see
 * apps-script/README.md. Do NOT commit real brand/scope data here.
 */
export interface PortfolioRow {
  country: string;
  brand: string;
  class: string; // Consignment | Hybrid retail
  stream: string; // Exceptional | Standard
  platforms: string[]; // Lazada | Shopee | Tiktok
}

const SAMPLE_SCOPE: PortfolioRow[] = [
  { country: "VN", brand: "Sample Brand A", class: "Consignment", stream: "Exceptional", platforms: ["Lazada", "Shopee", "Tiktok"] },
  { country: "VN", brand: "Sample Brand B", class: "Consignment", stream: "Exceptional", platforms: ["Lazada", "Shopee", "Tiktok"] },
  { country: "VN", brand: "Sample Brand C", class: "Hybrid retail", stream: "Exceptional", platforms: ["Shopee", "Tiktok"] },
  { country: "VN", brand: "Sample Brand D", class: "Hybrid retail", stream: "Standard", platforms: ["Lazada", "Shopee", "Tiktok"] },
  { country: "VN", brand: "Sample Brand E", class: "Consignment", stream: "Exceptional", platforms: ["Lazada", "Shopee"] },
  { country: "VN", brand: "Sample Brand F", class: "Hybrid retail", stream: "Standard", platforms: ["Lazada", "Tiktok"] },
  { country: "VN", brand: "Sample Brand G", class: "Consignment", stream: "Exceptional", platforms: ["Tiktok"] },
  { country: "VN", brand: "Sample Brand H", class: "Hybrid retail", stream: "Standard", platforms: ["Lazada", "Shopee", "Tiktok"] },
];

/** Placeholder generator so every member profile renders until the Sheet is wired. */
export function portfolioFor(member: CrewMember): PortfolioRow[] {
  const country = /vietnam|vn/i.test(member.market) ? "VN" : member.market.slice(0, 2).toUpperCase() || "VN";
  // Clone the sample and stamp the member's market so the mock reads coherently.
  return SAMPLE_SCOPE.map((row, i) => ({
    ...row,
    country,
    brand: `${member.name} · Brand ${String.fromCharCode(65 + i)}`,
  }));
}
