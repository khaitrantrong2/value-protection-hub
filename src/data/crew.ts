export type CrewRank = "commander" | "lead" | "guardian" | "cadet";

export interface CrewMember {
  name: string;
  /** Full name(s) / nicknames as used in the Google Sheet "Portfolio" tab's Member column, for matching. */
  aliases?: string[];
  roleShort: string;
  role: string;
  station: string;
  market: string;
  /** Market code for grouping guardians into country pods (TH, VN, SG, MY, PH, ID). */
  country?: string;
  accent: string;
  clearance: string;
  rank: CrewRank;
  blurb: string;
  /** Explanation shown on the portfolio page for members who hold no individual brand scope. */
  scopeNote?: string;
  /** false = kept in the roster but not rendered in the formation (e.g. reassigned). */
  active?: boolean;
}

export const crew: CrewMember[] = [
  // ───────────────────────── Commander ─────────────────────────
  {
    name: "Khải",
    aliases: ["Khai Tran Trong"],
    roleShort: "COMMANDER",
    role: "Team Lead / Commander",
    station: "Command Station",
    market: "Regional",
    accent: "#35D6FF",
    clearance: "ALPHA-01",
    rank: "commander",
    blurb:
      "Commands the Value Protection universe from the central station — setting direction, protecting critical assets, and navigating the fleet across every market.",
    scopeNote:
      "Khải commands the Value Protection universe — setting direction and protecting critical assets across every market, rather than carrying an individual brand portfolio.",
  },

  // ─────────────────── Control & Data (HQ leads) ───────────────────
  {
    name: "Thạch",
    aliases: ["Thach Huynh", "Thạch Huỳnh"],
    roleShort: "DATA ENGINE",
    role: "Data Automation / Claimback Engine",
    station: "Automation Core",
    market: "Regional",
    accent: "#7DD3FC",
    clearance: "BETA-04",
    rank: "lead",
    blurb:
      "Builds and runs the centralized claimback calculation engine and keeps the shared data pipeline flowing to every market.",
    scopeNote:
      "Thạch powers the centralized claimback engine — the calculation core, data pipeline and database behind every market's numbers — rather than holding an individual brand portfolio.",
  },
  {
    name: "Quang",
    aliases: ["Quang Tran", "Quang Trần"],
    roleShort: "DATA ENGINE",
    role: "Data Automation / Database",
    station: "Automation Core",
    market: "Regional",
    accent: "#A5B4FC",
    clearance: "BETA-05",
    rank: "lead",
    blurb:
      "Automates data flows and maintains the claimback database — the backbone that keeps every protector's data accurate and on time.",
    scopeNote:
      "Quang maintains the claimback database and automation that feed the whole fleet — centralized data support, not an individual brand portfolio.",
  },
  {
    name: "Lan",
    aliases: ["Lan Nguyen Thi Ngoc"],
    roleShort: "R2R LEAD",
    role: "R2R of Value Protector",
    station: "R2R Control Station",
    market: "Regional",
    accent: "#B388FF",
    clearance: "BETA-02",
    rank: "lead",
    blurb:
      "Steers record-to-report control from the R2R station — securing reconciliations and keeping the value-protection ledger accurate.",
    scopeNote:
      "Lan leads record-to-report control across all markets — securing reconciliations and the value-protection ledger — rather than carrying an individual brand portfolio.",
  },
  {
    name: "My",
    aliases: ["My Le Thi Tuyet"],
    roleShort: "AR LEAD",
    role: "AR Lead / Value Protector",
    station: "AR Control Station",
    market: "Regional",
    accent: "#5FD0C4",
    clearance: "BETA-03",
    rank: "lead",
    blurb:
      "Leads accounts-receivable protection from the AR control station — driving collections, ageing control, and recovery across the region.",
    scopeNote:
      "My leads accounts-receivable protection across the region — collections, ageing and recovery — rather than carrying an individual brand portfolio.",
  },

  // ───────────────────── Market guardians · TH ─────────────────────
  {
    name: "Ice",
    aliases: ["Ruchinan Narongphongphan"],
    roleShort: "TH GUARDIAN",
    role: "Value Protector",
    station: "TH Planet",
    market: "Thailand",
    country: "TH",
    accent: "#F59E0B",
    clearance: "GAMMA-TH",
    rank: "guardian",
    blurb: "Guards the Thailand market — monitoring exposure and retrieving value with local precision.",
  },
  {
    name: "Kla",
    aliases: ["Apiwat Sennoy"],
    roleShort: "TH GUARDIAN",
    role: "Value Protector",
    station: "TH Planet",
    market: "Thailand",
    country: "TH",
    accent: "#FB923C",
    clearance: "GAMMA-TH",
    rank: "guardian",
    blurb: "Holds the Thailand sector with Ice, securing claims and controlling receivable risk.",
  },
  {
    name: "Nhi",
    aliases: ["Nhi Phan"],
    roleShort: "TH GUARDIAN",
    role: "Value Protector",
    station: "TH Planet",
    market: "Thailand",
    country: "TH",
    accent: "#FBBF24",
    clearance: "GAMMA-TH",
    rank: "guardian",
    blurb: "Holds the Thailand marketplace line — a wide brand portfolio kept under tight receivable control.",
  },
  {
    name: "Jom Jam",
    aliases: ["Satida Chantabut", "Jom Jam"],
    roleShort: "TH GUARDIAN",
    role: "Value Protector",
    station: "TH Planet",
    market: "Thailand",
    country: "TH",
    accent: "#FCD34D",
    clearance: "GAMMA-TH",
    rank: "guardian",
    blurb: "Supports the Thailand sector, securing claims across assigned brands.",
  },

  // ───────────────────── Market guardians · VN ─────────────────────
  {
    name: "Huệ",
    aliases: ["Hue Le My", "Huệ Lê"],
    roleShort: "VN GUARDIAN",
    role: "Value Protector",
    station: "VN Planet",
    market: "Vietnam",
    country: "VN",
    accent: "#34D399",
    clearance: "GAMMA-VN",
    rank: "guardian",
    blurb:
      "Monitors and protects value across the Vietnam market, retrieving claims and holding the local control line.",
  },
  {
    name: "Hùng",
    aliases: ["Hung Tran Vu", "Hung Vu Tran", "Hùng Vũ"],
    roleShort: "VN GUARDIAN",
    role: "Value Protector",
    station: "VN Planet",
    market: "Vietnam",
    country: "VN",
    accent: "#10B981",
    clearance: "GAMMA-VN",
    rank: "guardian",
    blurb: "Works the Vietnam sector alongside Huệ, securing receivables and navigating market-specific recovery.",
  },

  // ───────────────────── Market guardians · SG ─────────────────────
  {
    name: "Nguyên",
    aliases: ["Nguyen Lam Hoang", "Nguyên Lâm"],
    roleShort: "SG GUARDIAN",
    role: "Value Protector",
    station: "SG Moon",
    market: "Singapore",
    country: "SG",
    accent: "#60A5FA",
    clearance: "GAMMA-SG",
    rank: "guardian",
    blurb: "Navigates the Singapore hub — protecting regional positions and coordinating control from the SG moon.",
  },

  // ───────────────────── Market guardians · MY ─────────────────────
  {
    name: "Ngân",
    aliases: ["Ngan Pham Thuy", "Ngân Phạm"],
    roleShort: "MY GUARDIAN",
    role: "Value Protector",
    station: "MY Moon",
    market: "Malaysia",
    country: "MY",
    accent: "#A78BFA",
    clearance: "GAMMA-MY",
    rank: "guardian",
    blurb: "Secures the Malaysia market — monitoring recovery and keeping local controls navigable.",
  },

  // ───────────────────── Market guardians · PH ─────────────────────
  {
    name: "Thành",
    aliases: ["Thanh Bui Minh", "Thành Bùi"],
    roleShort: "PH GUARDIAN",
    role: "Value Protector",
    station: "PH Planet",
    market: "Philippines",
    country: "PH",
    accent: "#38BDF8",
    clearance: "GAMMA-PH",
    rank: "guardian",
    blurb: "Guards the Philippines market — monitoring exposure and retrieving value with local precision.",
  },

  // ───────────────────── Market guardians · ID ─────────────────────
  {
    name: "Ngân Nguyễn",
    aliases: ["Ngan Nguyen Bao"],
    roleShort: "ID GUARDIAN",
    role: "Value Protector",
    station: "ID Planet",
    market: "Indonesia",
    country: "ID",
    accent: "#F97316",
    clearance: "GAMMA-ID",
    rank: "guardian",
    blurb: "Guards the Indonesia market — securing exposure and retrieving value across the archipelago.",
  },
  {
    name: "Linh",
    aliases: ["Linh Dinh Khanh", "Linh Đinh"],
    roleShort: "ID GUARDIAN",
    role: "Value Protector",
    station: "ID Planet",
    market: "Indonesia",
    country: "ID",
    accent: "#FB7185",
    clearance: "GAMMA-ID",
    rank: "guardian",
    blurb: "Holds the Indonesia sector with Ngân Nguyễn — monitoring recovery across local platforms.",
  },

  // ───────────────────────── Flex support ─────────────────────────
  {
    name: "Phương",
    aliases: ["Phuong Vo Yen"],
    roleShort: "FLEX SUPPORT",
    role: "Flex Support · Inventory (incoming)",
    station: "Roaming",
    market: "Rotational",
    accent: "#F9A8D4",
    clearance: "FLEX",
    rank: "cadet",
    blurb:
      "Roaming support across markets on ad-hoc country requests — soon transitioning into the Inventory mission.",
  },

  // ─────────── Reassigned — kept in the roster, hidden from the formation ───────────
  {
    name: "Andriani",
    aliases: ["Andriani Nursasrila Pasaribu"],
    roleShort: "AR · ID FINANCE",
    role: "AR / Country Finance (ID)",
    station: "ID Finance",
    market: "Indonesia",
    country: "ID",
    accent: "#F97316",
    clearance: "GAMMA-ID",
    rank: "guardian",
    active: false,
    blurb: "Reassigned to AR and Indonesia country-finance duties — on standby for the value-protection fleet.",
  },
];
