export type LinkStatus = "Active" | "Review" | "Blocked" | "Archived";
export type Criticality = "High" | "Medium" | "Low";
export type CountryCode = "VN" | "SG" | "MY" | "ID" | "PH" | "TH" | "Regional";

export const CATEGORY_IDS = [
  "claimback-trackers",
  "monthly-closing",
  "review-cockpits",
  "ar-collection",
  "netsuite-saved-searches",
  "templates-upload-files",
  "sop-policy-training",
  "project-workspace",
  "country-working-files",
  "admin-access",
] as const;

export type CategoryId = (typeof CATEGORY_IDS)[number];

export interface LinkItem {
  id: string;
  category: CategoryId;
  title: string;
  description: string;
  url: string;
  owner: string;
  country: CountryCode | "";
  status: LinkStatus;
  tags: string[];
  accessNote: string;
  criticality: Criticality;
  sortOrder: number;
  isActive: boolean;
  lastUpdated: string;
}

export interface CategoryDef {
  id: CategoryId;
  name: string;
  description: string;
  color: string;
  icon: string;
  sortOrder: number;
}

export interface PortalConfig {
  portalName: string;
  subtitle: string;
  maintainer: string;
  adminSheetUrl: string;
  requestLinkUrl: string;
  lastUpdatedNote: string;
}

/** Raw row shape as returned by the Apps Script "Links" tab — every cell is a string/boolean from Sheets. */
export interface LinkRow {
  ID: string;
  Category: string;
  Title: string;
  Description: string;
  URL: string;
  Owner: string;
  Country: string;
  Status: string;
  Tags: string;
  AccessNote: string;
  Criticality: string;
  SortOrder: string | number;
  IsActive: string | boolean;
  LastUpdated: string;
}

export interface CategoryRow {
  Category: string;
  Description: string;
  Color: string;
  Icon: string;
  SortOrder: string | number;
}

export interface ConfigRow {
  Key: string;
  Value: string;
}

export interface LinksApiResponse {
  links: LinkRow[];
  categories?: CategoryRow[];
  config?: ConfigRow[];
}

export interface LinkFilters {
  query: string;
  categoryId: CategoryId | "all";
  country: CountryCode | "all";
  status: LinkStatus | "all";
  criticality: Criticality | "all";
}

export type ViewMode = "compact" | "cards";

/** Special (non-category) selections in the Category Navigator. */
export type SpecialScope = "all" | "critical" | "recent";

export type Scope = SpecialScope | CategoryId;
