# Process Atlas: chỉnh nội dung và kết nối live

Atlas là material business understanding/onboarding, không phải transaction engine,
approved SOP hoặc kết luận operating effectiveness. Map, Walkthrough và detail panel
đọc cùng một content contract: `src/types/atlas.ts`.

## Khai/team sửa gì ở đâu?

| Tab | Nội dung | Field quan trọng |
| --- | --- | --- |
| AtlasStages | 01–08 và supporting A/B; SIPOC, RACI, narrative | ShortTitle, Title, BusinessQuestion, Narrative, Caution |
| AtlasControls | Risk/control/evidence theo stage | WCGW, OwnerRole, PracticeState, EvidenceState, Limitation |
| AtlasReferences | Reason codes, document steps, routes, pipeline, KPI | Group, Title, Body, Applicability |
| AtlasConfig | Metadata của bản phát hành | ContentVersion, ProcessStatus, EffectiveFrom, UpdatedAt, Subtitle |
| AtlasGuide | Hướng dẫn ngay trong Sheet | Không được serialize qua API |

Sau khi API đã deploy đúng: sửa và lưu Sheet → **Refresh source** hoặc reload page.
Atlas không dùng server cache/localStorage. Layout, branch geometry, zoom hoặc thay schema
cần sửa code và deploy frontend; thay wording không cần build lại.

## Workspace ba tầng

Desktop mặc định là board toàn phần chiều cao còn lại dưới header của Hub, không có page
scroll lồng với canvas. Không cần bật Focus map riêng.

- **L1 Explore**: business flow 01–08 và lane hỗ trợ A Data pipeline/B Master data cùng một map.
  Dotted links diễn tả dependency từ `Supports`, không phải thêm bước tuần tự vào flow.
- **L2 Stage Inspector**: chọn stage để mở Summary, Ownership hoặc Risks & controls.
  Chỉ nội dung tab đang chọn được render; phần body cuộn riêng, header/close/tabs vẫn giữ chỗ.
- **L3 Reference Library**: launcher dưới board mở modal có search, reference type và stage
  context. Toàn bộ reference dùng cùng source, không nhân bản thành một dataset khác.
  Đóng modal quay lại inspector/map cũ; không thay đổi camera.

Chọn stage giữ nguyên zoom. Card đã thấy không làm camera di chuyển; card bị che chỉ pan
tối thiểu. Resize/mở/đóng inspector không tự Fit. Fit chỉ chạy lần đầu có viewport hoặc
khi người xem yêu cầu; pan/zoom trực tiếp hủy animation cũ. Chuyển Explore/Walkthrough giữ
Canvas mounted nên không reset camera. Màn hình 840px trở xuống dùng linear walkthrough;
supporting capabilities được liên kết trong context của chapter.

Keyboard: 1–8 chọn chapter/stage; Escape đóng library trước, rồi inspector. Trên canvas,
arrow keys pan, +/- zoom, F Fit. Trong inspector, arrow/Home/End đổi tab. Nội dung global
không render thành các bảng kéo dài bên dưới map.

Reading context có deep link, không đưa camera vào URL:

- `#atlas?stage=04&tab=controls`: inspector của stage 04.
- `#atlas?mode=story&chapter=05`: walkthrough chapter 05.
- `#atlas?stage=04&library=reason-code&scope=04&ref=R1`: reference trong context stage.

Back/Forward khôi phục stage/tab/library; query IDs/enums được kiểm tra và giới hạn độ dài.
UI reading state nằm ở `src/types/atlasUi.ts`; content contract `src/types/atlas.ts` và API
schema version 1 không đổi. Đổi tab/filter không fetch API hoặc ghi Sheet.

### Design references và giới hạn reuse

Giữ Vue/Vite, scoped CSS, fonts và color tokens của Hub. Reuse hướng dẫn, không thêm các
fork thành runtime dependencies:

- [diagram-design / swimlane](https://github.com/khaitrantrong2/diagram-design/blob/11b08eade8049c441ed3df1895e3b527c26c0fbe/skills/diagram-design/references/type-swimlane.md):
  phân biệt sequence với supporting dependencies; overview tách khỏi detail.
- [impeccable / distill](https://github.com/khaitrantrong2/impeccable/blob/cf3d2fa07d3ad1814ac5fbbbb5b2043b795eaef1/.agents/skills/impeccable/reference/distill.md)
  và [adapt](https://github.com/khaitrantrong2/impeccable/blob/cf3d2fa07d3ad1814ac5fbbbb5b2043b795eaef1/.agents/skills/impeccable/reference/adapt.md):
  loại bỏ thông tin trùng tầng, mobile dùng linear view thay vì thu nhỏ desktop canvas.
- [Vue conditional rendering](https://vuejs.org/guide/essentials/conditional.html#v-if-vs-v-show):
  Canvas dùng `v-show` để giữ instance/camera; inspector tab và library chỉ render khi cần.
- [Native dialog](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/dialog):
  L3 dùng modal top layer/focus handling; không resize canvas phía sau.

Không thêm tilt/Atropos, ScrollTrigger pin hoặc smooth-scroll vào workspace: việc đọc flow,
camera ổn định và keyboard navigation được ưu tiên. Deck tooling nằm ngoài phạm vi page.

Hai nhánh 05 dùng reference IDs `BRANCH-05A` và `BRANCH-05B`: sửa Title/Body/Applicability
ở AtlasReferences để Map và Walkthrough cùng cập nhật; không cần sửa paragraph trong Vue.

Giữ nguyên headers và IDs. Stage IDs là text `01`–`08`, `A`, `B`, không chuyển thành số.
Danh sách dùng `|`; Pipeline dùng một handoff trên mỗi dòng. Không để phần tử trống/trùng.
Supports, ReferenceIDs, StageID phải trỏ đến record đang được publish.

## Publication và evidence không phải một khái niệm

- API chỉ xuất đúng `Publication=Published` **và** `Visibility=Public`.
- `reported`: process owner xác nhận practice, chưa chứng minh mọi case/country hoặc OE.
- `proposed`: đề xuất chưa coi là practice hiện hữu. `develop`: đang phát triển.
- `to-locate`: cần tìm evidence. `located`: đã định vị, không có nghĩa auditor đã kiểm chứng.
- EffectiveFrom để trống cho tới khi có approval; ngày dùng `YYYY-MM-DD`.
- Published chỉ là quyết định hiển thị, không phải SOP approval hoặc control sign-off.

Ẩn record đang được tham chiếu sẽ làm Atlas fail closed. Thay đổi các record phụ thuộc
trong cùng một batch hoặc sửa liên kết trước, kiểm tra rồi publish.

**Visibility không bảo vệ source Sheet.** Nếu Sheet là Anyone with the link, cả Internal
và Draft vẫn có thể bị đọc trực tiếp. Không lưu client/person names, rates/amounts,
transaction IDs, internal URLs hoặc evidence paths vào source/public repo. EvidenceLocation
chỉ ghi loại bằng chứng; bằng chứng thật giữ ở kho riêng có quyền truy cập.

## Business guardrails

05 monthly close và KAM/Brand confirmation chạy song song; amount approval và JE approval
là hai gate. QO carry-forward chỉ chuyển billing/budget consumption, giữ original MoA.
AP-CN có thể bypass invoice/AR với N/A có căn cứ. Credit/value correction/write-off không
phải cash collection. Mix routes theo component phải có authority và không double recovery.
Supporting A dùng technical pipeline hiện hữu; price validation layer giữ trạng thái develop.
Single accountable per stage không thay thế các delegated approvals. Preset/balanced upload
không tự chứng minh period, amounts, duplicates, grouping hoặc mapping đã đúng.

## API contract

GET `VITE_LINKS_API_URL?action=atlas` trả:

```json
{ "ok": true, "atlas": { "schemaVersion": 1, "meta": {}, "stages": [], "controls": [], "references": [] } }
```

Các fields cụ thể và header arrays nằm trong `src/types/atlas.ts`; server mapping nằm trong
`apps-script/Code.gs`. Headers được map theo tên. Unknown columns không serialize.
Server kiểm ID, enum, lengths, orders, dates và referential integrity. No published rows
là valid empty content, không có demo fallback. Invalid publication trả lỗi generic
`ATLAS_INVALID`; source exception trả `ATLAS_UNAVAILABLE`, không trả raw cells hoặc stack.

Reference URL để trống hoặc HTTPS đúng host allowlist trong server/client. Allowlist chỉ
cho public documentation; không dùng URL field để đưa Vault/private evidence ra internet.
Vue render text escaping, không dùng v-html. Frontend giới hạn response, timeout 20s,
hủy request cũ và copy fields vào object mới. Nếu refresh lỗi sau một lần đọc thành công,
giữ last-good in-memory **với warning**, không ghi là dữ liệu mới.

## One-time deployment gate

1. Xác định project **đang phục vụ đúng source Sheet**; không overwrite project lạ.
2. Backup phiên bản source và deployment hiện tại. Project Settings → Script properties:
   đặt `VPH_SPREADSHEET_ID` bằng raw ID của source Sheet đã được duyệt (không phải URL).
   Template dùng `openById`; không hardcode ID vào public repo hoặc nhận ID từ request.
   `getActiveSpreadsheet` chỉ là fallback khi chạy trong editor, không phải cấu hình Web App.
   [Google xác nhận special methods không dùng được trong Web App](https://developers.google.com/apps-script/guides/bound#special_methods);
   [openById reference](https://developers.google.com/apps-script/reference/spreadsheet/spreadsheet-app#openById(String)).
3. Cập nhật additive `action=atlas` route, giữ default legacy response. Human duyệt access
   settings trước deploy; không tự mở public/external quyền hoặc đổi Sheet sharing.
4. GET default API vẫn đúng Links/Categories/Config/Portfolio. GET `?action=atlas` phải đúng
   schema và counts được duyệt. Test Public/Published filtering ở fixture, không đưa private
   canary vào source Sheet publicly viewable.
5. Cập nhật đúng `VITE_LINKS_API_URL` trên Vercel nếu endpoint đổi, redeploy frontend.
   VITE variables nằm trong client bundle, **không phải secret**.
6. Smoke test refresh, published empty/error states, navigation, canvas và mobile story
   trên preview trước merge. Chỉ mark live khi browser đọc API thực thành công.

Không coi seed Sheet, local tests hoặc build thành công là bằng chứng live integration.
Kiểm tra deployment và source state thực tế ở browser theo từng release.

## Verification / rollback

`npm run typecheck`, `npm test`, `npm run build`. API/service fixtures cover privacy filters,
header parity, edits/uncached refresh, old API, bad URLs/schema/links, timeouts and cancellation.
Browser gate: 320/840/1024/1440px; min/Fit/medium/max zoom; title inside cards; 05 A/B,
detail panel, keyboard 1–8/Escape, offscreen Tab order, mobile Next and reduced motion.
Camera math/lifecycle, route/history, workspace mount retention, reduced-motion branch và request races có test riêng; không coi
synthetic tests là bằng chứng API live hoặc visual verification.

Rollback frontend bằng previous Vercel deployment; rollback API bằng saved deployment
version; rollback content bằng Sheet version history. Giữ Atlas tabs để recover/review,
không xóa hoặc sửa bốn tab legacy. Không merge/deploy production trước human review.
