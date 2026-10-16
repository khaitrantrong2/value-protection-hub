import type { CategoryId, LinkItem } from '../types/links';

export interface VaultPlanet {
  id: CategoryId;
  x: number;
  y: number;
  size: number;
  color: string;
  surface: 'terrain' | 'bands' | 'craters';
  rings?: boolean;
  scope: { en: string; vi: string };
}

/** Stable positions are navigation geography, not ownership or a process sequence. */
export const vaultPlanets: VaultPlanet[] = [
  { id: 'claimback-trackers', x: 29, y: 29, size: 76, color: '#C4A7FF', surface: 'terrain', scope: { en: 'Claimback working files and trackers for calculation, review and follow-up.', vi: 'File làm việc và tracker claimback phục vụ tính toán, review và theo dõi.' } },
  { id: 'sop-policy-training', x: 62, y: 25, size: 66, color: '#B6A7E9', surface: 'craters', rings: true, scope: { en: 'Operating procedures, policies and training references for the team.', vi: 'Quy trình vận hành, chính sách và tài liệu đào tạo của team.' } },
  { id: 'netsuite-saved-searches', x: 73, y: 51, size: 82, color: '#92A7DF', surface: 'bands', rings: true, scope: { en: 'NetSuite saved searches and system views. Access depends on your ERP permissions.', vi: 'Saved search và màn hình NetSuite. Truy cập phụ thuộc quyền ERP của bạn.' } },
  { id: 'country-working-files', x: 28, y: 72, size: 60, color: '#A0BAC7', surface: 'terrain', scope: { en: 'Market-specific working files across the six Southeast Asian markets.', vi: 'File làm việc theo từng thị trường tại sáu nước Đông Nam Á.' } },
  { id: 'templates-upload-files', x: 16, y: 48, size: 48, color: '#C5BAE5', surface: 'craters', scope: { en: 'Reusable templates, upload files and working-paper formats.', vi: 'Biểu mẫu dùng chung, file upload và định dạng working paper.' } },
  { id: 'review-cockpits', x: 47, y: 14, size: 52, color: '#A7B6D7', surface: 'bands', scope: { en: 'Operational and performance review tools. Kept separate from development workspaces.', vi: 'Công cụ review vận hành và hiệu suất. Tách biệt với workspace phát triển.' } },
  { id: 'admin-access', x: 15, y: 18, size: 44, color: '#B1A2D1', surface: 'craters', scope: { en: 'Access requests and administrative resources. A listed link does not grant access.', vi: 'Yêu cầu truy cập và tài nguyên quản trị. Có link không đồng nghĩa đã được cấp quyền.' } },
  { id: 'ar-collection', x: 58, y: 80, size: 70, color: '#BAACE7', surface: 'terrain', scope: { en: 'AR monitoring, ageing and settlement follow-up. Settlement is not always cash collected.', vi: 'Theo dõi AR, tuổi nợ và tất toán. Tất toán không mặc định là đã thu tiền.' } },
  { id: 'project-workspace', x: 84, y: 76, size: 55, color: '#A995D7', surface: 'terrain', scope: { en: 'Development projects, improvement initiatives and their working spaces.', vi: 'Dự án phát triển, sáng kiến cải tiến và không gian làm việc liên quan.' } },
  { id: 'monthly-closing', x: 84, y: 26, size: 50, color: '#B6B2CB', surface: 'bands', scope: { en: 'Period-end calendars, accrual working files and closing references.', vi: 'Lịch đóng sổ, file accrual và tài liệu cuối kỳ.' } },
];

export function vaultResources(links: LinkItem[], category: CategoryId): LinkItem[] {
  return links.filter(link => link.isActive && link.category === category)
    .slice().sort((a, b) => a.sortOrder - b.sortOrder || a.title.localeCompare(b.title));
}

/** Display only explicitly published resource-owner values. Never infer a crew-to-vault relation. */
export function vaultOwners(links: LinkItem[]): string[] {
  return [...new Set(links.map(link => link.owner.trim()).filter(Boolean))].sort((a, b) => a.localeCompare(b));
}
