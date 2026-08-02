export type CrewRank = "commander" | "lead" | "guardian" | "cadet";

export interface CrewMember {
  name: string;
  /** Full name(s) as used in the Google Sheet "Portfolio" tab's Member column, for matching. */
  aliases?: string[];
  roleShort: string;
  role: string;
  station: string;
  market: string;
  accent: string;
  clearance: string;
  rank: CrewRank;
  blurb: string;
}

export const crew: CrewMember[] = [
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
  },
  {
    name: "Ice",
    aliases: ["Ruchinan Narongphongphan"],
    roleShort: "TH GUARDIAN",
    role: "Value Protector",
    station: "TH Planet",
    market: "Thailand",
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
    accent: "#FB923C",
    clearance: "GAMMA-TH",
    rank: "guardian",
    blurb: "Holds the Thailand sector with Ice, securing claims and controlling receivable risk.",
  },
  {
    name: "Huệ",
    aliases: ["Hue Le My"],
    roleShort: "VN GUARDIAN",
    role: "Value Protector",
    station: "VN Planet",
    market: "Vietnam",
    accent: "#34D399",
    clearance: "GAMMA-VN",
    rank: "guardian",
    blurb:
      "Monitors and protects value across the Vietnam market, retrieving claims and holding the local control line.",
  },
  {
    name: "Hùng",
    aliases: ["Hung Tran Vu"],
    roleShort: "VN GUARDIAN",
    role: "Value Protector",
    station: "VN Planet",
    market: "Vietnam",
    accent: "#10B981",
    clearance: "GAMMA-VN",
    rank: "guardian",
    blurb: "Works the Vietnam sector alongside Huệ, securing receivables and navigating market-specific recovery.",
  },
  {
    name: "Nguyên",
    aliases: ["Nguyen Lam Hoang"],
    roleShort: "SG GUARDIAN",
    role: "Value Protector",
    station: "SG Moon",
    market: "Singapore",
    accent: "#60A5FA",
    clearance: "GAMMA-SG",
    rank: "guardian",
    blurb: "Navigates the Singapore hub — protecting regional positions and coordinating control from the SG moon.",
  },
  {
    name: "Ngân",
    aliases: ["Ngan Pham Thuy"],
    roleShort: "MY GUARDIAN",
    role: "Value Protector",
    station: "MY Moon",
    market: "Malaysia",
    accent: "#A78BFA",
    clearance: "GAMMA-MY",
    rank: "guardian",
    blurb: "Secures the Malaysia market — monitoring recovery and keeping local controls navigable.",
  },
  {
    name: "Thành",
    aliases: ["Thanh Bui Minh"],
    roleShort: "PH GUARDIAN",
    role: "Value Protector",
    station: "PH Planet",
    market: "Philippines",
    accent: "#38BDF8",
    clearance: "GAMMA-PH",
    rank: "guardian",
    blurb: "Guards the Philippines market — monitoring exposure and retrieving value with local precision.",
  },
  {
    name: "Andriani",
    aliases: ["Andriani Nursasrila Pasaribu"],
    roleShort: "ID GUARDIAN",
    role: "Value Protector",
    station: "ID Planet",
    market: "Indonesia",
    accent: "#F97316",
    clearance: "GAMMA-ID",
    rank: "guardian",
    blurb: "Guards the Indonesia market — securing exposure and retrieving value across the archipelago.",
  },
  {
    name: "Phương",
    aliases: ["Phuong Vo Yen"],
    roleShort: "CADET",
    role: "Intern / Cadet",
    station: "Cadet / Learning Pod",
    market: "Rotational",
    accent: "#F9A8D4",
    clearance: "CADET",
    rank: "cadet",
    blurb: "A cadet in the learning pod — training across stations to become the next value protector of the fleet.",
  },
];
