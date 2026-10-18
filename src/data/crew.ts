import type { FleetHull } from "../services/fleetMotion";

export type CrewRank = "commander" | "lead" | "guardian" | "cadet";
export type CrewFunction = "team" | "automation" | "r2r" | "ar" | "claimback" | "support";
export type CrewGroup = "regional" | "market" | "flex";

export interface CrewMember {
  /** Stable navigation identity. Names and Sheet aliases are never translated. */
  id: string;
  name: string;
  aliases?: string[];
  function: CrewFunction;
  group: CrewGroup;
  profileKey: string;
  roleShort: string;
  role: string;
  station: string;
  market: string;
  country?: string;
  accent: string;
  /** Legacy visual metadata, not an access level or reporting relationship. */
  clearance: string;
  rank: CrewRank;
  /** Optional hull override for a market protector (otherwise derived from rank/function). */
  craft?: FleetHull;
  blurb: string;
  scopeNote?: string;
  active?: boolean;
}

/** Groups describe collaboration and market coverage, not formal reporting lines. */
export const crew: CrewMember[] = [
  { id: "khai", name: "Khải", aliases: ["Khai Tran Trong"], function: "team", group: "regional", profileKey: "teamLead", roleShort: "TEAM LEAD", role: "Team Lead", station: "Regional collaboration", market: "Regional", accent: "#F5B342", clearance: "ALPHA-01", rank: "commander", blurb: "Coordinates Value Protection priorities, process improvements and cross-market collaboration." },
  { id: "thach", name: "Thạch", aliases: ["Thach Huynh", "Thạch Huỳnh"], function: "automation", group: "regional", profileKey: "engine", roleShort: "DATA AUTOMATION", role: "Data Automation / Claimback Engine", station: "Data automation", market: "Regional", accent: "#7DD3FC", clearance: "BETA-04", rank: "lead", blurb: "Builds and runs the shared claimback calculation engine and its data pipeline." },
  { id: "quang", name: "Quang", aliases: ["Quang Tran", "Quang Trần"], function: "automation", group: "regional", profileKey: "database", roleShort: "DATA AUTOMATION", role: "Data Automation / Database", station: "Data automation", market: "Regional", accent: "#A5B4FC", clearance: "BETA-05", rank: "lead", blurb: "Maintains the claimback database and shared automation data flows." },
  { id: "lan", name: "Lan", aliases: ["Lan Nguyen Thi Ngoc"], function: "r2r", group: "regional", profileKey: "r2r", roleShort: "R2R", role: "R2R of Value Protection", station: "Record-to-report", market: "Regional", accent: "#B388FF", clearance: "BETA-02", rank: "lead", blurb: "Coordinates record-to-report work and reconciliations for Value Protection." },
  { id: "my", name: "My", aliases: ["My Le Thi Tuyet"], function: "ar", group: "regional", profileKey: "ar", roleShort: "AR", role: "AR Lead / Value Protection", station: "Accounts receivable", market: "Regional", accent: "#5FD0C4", clearance: "BETA-03", rank: "lead", blurb: "Coordinates accounts-receivable monitoring, ageing follow-up and collections across markets." },
  { id: "ice", name: "Ice", aliases: ["Ruchinan Narongphongphan"], function: "claimback", group: "market", profileKey: "claimback", roleShort: "CLAIMBACK", role: "Value Protector", station: "Thailand", market: "Thailand", country: "TH", accent: "#F59E0B", clearance: "GAMMA-TH", rank: "guardian", craft: "interceptor", blurb: "Handles claimback activities for the published country and brand scope." },
  { id: "kla", name: "Kla", aliases: ["Apiwat Sennoy"], function: "claimback", group: "market", profileKey: "claimback", roleShort: "CLAIMBACK", role: "Value Protector", station: "Thailand", market: "Thailand", country: "TH", accent: "#F59E0B", clearance: "GAMMA-TH", rank: "guardian", craft: "sentinel", blurb: "Handles claimback activities for the published country and brand scope." },
  { id: "nhi", name: "Nhi", aliases: ["Nhi Phan"], function: "claimback", group: "market", profileKey: "claimback", roleShort: "CLAIMBACK", role: "Value Protector", station: "Thailand", market: "Thailand", country: "TH", accent: "#F59E0B", clearance: "GAMMA-TH", rank: "guardian", blurb: "Handles claimback activities for the published country and brand scope." },
  { id: "jom-jam", name: "Jom Jam", aliases: ["Satida Chantabut", "Jom Jam"], function: "claimback", group: "market", profileKey: "claimback", roleShort: "CLAIMBACK", role: "Value Protector", station: "Thailand", market: "Thailand", country: "TH", accent: "#F59E0B", clearance: "GAMMA-TH", rank: "guardian", blurb: "Handles claimback activities for the published country and brand scope." },
  { id: "hue", name: "Huệ", aliases: ["Hue Le My", "Huệ Lê"], function: "claimback", group: "market", profileKey: "claimback", roleShort: "CLAIMBACK", role: "Value Protector", station: "Vietnam", market: "Vietnam", country: "VN", accent: "#34D399", clearance: "GAMMA-VN", rank: "guardian", craft: "battlecruiser", blurb: "Handles claimback activities for the published country and brand scope." },
  { id: "hung", name: "Hùng", aliases: ["Hung Tran Vu", "Hung Vu Tran", "Hùng Vũ"], function: "claimback", group: "market", profileKey: "claimback", roleShort: "CLAIMBACK", role: "Value Protector", station: "Vietnam", market: "Vietnam", country: "VN", accent: "#34D399", clearance: "GAMMA-VN", rank: "guardian", blurb: "Handles claimback activities for the published country and brand scope." },
  { id: "nguyen", name: "Nguyên", aliases: ["Nguyen Lam Hoang", "Nguyên Lâm"], function: "claimback", group: "market", profileKey: "claimback", roleShort: "CLAIMBACK", role: "Value Protector", station: "Singapore", market: "Singapore", country: "SG", accent: "#60A5FA", clearance: "GAMMA-SG", rank: "guardian", blurb: "Handles claimback activities for the published country and brand scope." },
  { id: "ngan-pham", name: "Ngân", aliases: ["Ngan Pham Thuy", "Ngân Phạm"], function: "claimback", group: "market", profileKey: "claimback", roleShort: "CLAIMBACK", role: "Value Protector", station: "Malaysia", market: "Malaysia", country: "MY", accent: "#A78BFA", clearance: "GAMMA-MY", rank: "guardian", craft: "battlecruiser", blurb: "Handles claimback activities for the published country and brand scope." },
  { id: "thanh", name: "Thành", aliases: ["Thanh Bui Minh", "Thành Bùi"], function: "claimback", group: "market", profileKey: "claimback", roleShort: "CLAIMBACK", role: "Value Protector", station: "Philippines", market: "Philippines", country: "PH", accent: "#38BDF8", clearance: "GAMMA-PH", rank: "guardian", blurb: "Handles claimback activities for the published country and brand scope." },
  { id: "ngan-nguyen", name: "Ngân Nguyễn", aliases: ["Ngan Nguyen Bao"], function: "claimback", group: "market", profileKey: "claimback", roleShort: "CLAIMBACK", role: "Value Protector", station: "Indonesia", market: "Indonesia", country: "ID", accent: "#F97316", clearance: "GAMMA-ID", rank: "guardian", blurb: "Handles claimback activities for the published country and brand scope." },
  { id: "linh", name: "Linh", aliases: ["Linh Dinh Khanh", "Linh Đinh"], function: "claimback", group: "market", profileKey: "claimback", roleShort: "CLAIMBACK", role: "Value Protector", station: "Indonesia", market: "Indonesia", country: "ID", accent: "#F97316", clearance: "GAMMA-ID", rank: "guardian", craft: "sentinel", blurb: "Handles claimback activities for the published country and brand scope." },
  { id: "phuong", name: "Phương", aliases: ["Phuong Vo Yen"], function: "support", group: "flex", profileKey: "support", roleShort: "FLEX SUPPORT", role: "Flex Support · Inventory (incoming)", station: "Cross-market support", market: "Rotational", accent: "#60A5FA", clearance: "FLEX", rank: "cadet", blurb: "Provides ad-hoc country support, with an incoming transition to inventory work." },
  { id: "andriani", name: "Andriani", aliases: ["Andriani Nursasrila Pasaribu"], function: "ar", group: "market", profileKey: "countryFinance", roleShort: "AR · ID FINANCE", role: "AR / Country Finance (ID)", station: "Indonesia finance", market: "Indonesia", country: "ID", accent: "#F97316", clearance: "GAMMA-ID", rank: "guardian", active: false, blurb: "Reassigned to AR and Indonesia country-finance duties; retained in the source roster." },
];
