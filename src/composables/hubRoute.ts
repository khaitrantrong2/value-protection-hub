import { CATEGORY_IDS, type CountryCode, type Criticality, type LinkStatus, type Scope, type ViewMode } from "../types/links";

export type HubView = "home" | "sector" | "crew" | "member" | "atlas" | "start";
export interface HubRoute {
  view: HubView;
  scope: Scope;
  country: CountryCode | "all";
  status: LinkStatus | "all";
  criticality: Criticality | "all";
  query: string;
  viewMode: ViewMode;
  memberId: string;
}
const defaults = (): HubRoute => ({ view: "home", scope: "all", country: "all", status: "all", criticality: "all", query: "", viewMode: "cards", memberId: "" });
const countries = ["VN", "TH", "SG", "MY", "PH", "ID", "Regional"];
const statuses = ["Active", "Review", "Blocked", "Archived"];
const criticalities = ["High", "Medium", "Low"];

export function parseHubHash(hash: string): HubRoute {
  const state = defaults();
  if (hash.length > 1600) return state;
  const [path, query = ""] = hash.replace(/^#/, "").split("?", 2);
  const params = new URLSearchParams(query);
  if (path === "atlas") return { ...state, view: "atlas" };
  if (path === "crew" || path === "start") return { ...state, view: path };
  if (path === "member") {
    const id = params.get("id") ?? "";
    return { ...state, view: "member", memberId: /^[a-z][a-z0-9-]{0,63}$/.test(id) ? id : "" };
  }
  if (path !== "directory") return state;
  state.view = "sector";
  const scope = params.get("scope") ?? "all";
  if (["all", "critical", "recent", ...CATEGORY_IDS].includes(scope)) state.scope = scope as Scope;
  const country = params.get("country") ?? "all";
  if (countries.includes(country)) state.country = country as CountryCode;
  const status = params.get("status") ?? "all";
  if (statuses.includes(status)) state.status = status as LinkStatus;
  const criticality = params.get("criticality") ?? "all";
  if (criticalities.includes(criticality)) state.criticality = criticality as Criticality;
  state.query = (params.get("q") ?? "").slice(0, 200);
  state.viewMode = params.get("mode") === "compact" ? "compact" : "cards";
  return state;
}

export function serializeHubHash(state: HubRoute): string {
  if (state.view === "home") return "#home";
  if (state.view === "atlas") return "#atlas";
  if (state.view === "crew" || state.view === "start") return `#${state.view}`;
  const params = new URLSearchParams();
  if (state.view === "member") { if (state.memberId) params.set("id", state.memberId); return `#member${params.size ? `?${params}` : ""}`; }
  if (state.scope !== "all") params.set("scope", state.scope);
  if (state.country !== "all") params.set("country", state.country);
  if (state.status !== "all") params.set("status", state.status);
  if (state.criticality !== "all") params.set("criticality", state.criticality);
  if (state.query) params.set("q", state.query.slice(0, 200));
  if (state.viewMode === "compact") params.set("mode", "compact");
  return `#directory${params.size ? `?${params}` : ""}`;
}
