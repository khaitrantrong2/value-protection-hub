<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from "vue";
import type { AtlasPayload } from "../../types/atlas";
import Icon from "../Icon.vue";
import { useLocale } from "../../i18n";
const { t, text } = useLocale();

const props = defineProps<{ source: "live" | "demo" | "unavailable"; meta?: AtlasPayload["meta"]; error?: string; refreshedAt?: string; isLoading: boolean }>();
const details = ref<HTMLDetailsElement | null>(null);
const summary = ref<HTMLElement | null>(null);
const label = computed(() => props.source === "live" ? props.error ? t("atlas.sourceRetained") : t("atlas.sourceLive") : props.source === "demo" ? t("atlas.sourceDemo") : props.isLoading ? t("atlas.sourceLoading") : t("atlas.sourceUnavailable"));
const errorLabel = computed(() => {
  if (!props.error) return "";
  if (props.source === "demo") return text("This is the bundled draft, not the latest Google Sheet content. Reload the page to retry the live source.", "Đây là bản nháp đóng gói, không phải nội dung Google Sheet mới nhất. Tải lại trang để thử nguồn trực tiếp.");
  if (props.error.includes("chưa hỗ trợ Atlas")) return text("The source API does not yet support Atlas. Update the Apps Script deployment.", "API nguồn chưa hỗ trợ Atlas. Cần cập nhật bản triển khai Apps Script.");
  if (props.error.includes("không hợp lệ")) return text("The published source or API configuration is invalid. Ask the source owner to review it.", "Nguồn xuất bản hoặc cấu hình API không hợp lệ. Nhờ chủ nguồn kiểm tra lại.");
  if (props.error.includes("hết thời gian")) return text("The source request timed out. Reload the page to retry.", "Yêu cầu tải nguồn hết thời gian. Hãy tải lại trang để thử lại.");
  return text("The source could not be loaded. Check the connection and reload the page.", "Chưa tải được nguồn. Kiểm tra kết nối và tải lại trang.");
});
function close() { if (details.value) details.value.open = false; summary.value?.focus({ preventScroll: true }); }
function outside(event: PointerEvent) { if (details.value?.open && !details.value.contains(event.target as Node)) details.value.open = false; }
onMounted(() => window.addEventListener("pointerdown", outside));
onBeforeUnmount(() => window.removeEventListener("pointerdown", outside));
</script>

<template>
  <details ref="details" class="atlas-source-info" @keydown.esc.stop.prevent="close">
    <summary ref="summary" :aria-label="`${t('atlas.sourceInfo')}: ${label}`"><span aria-hidden="true">ⓘ</span><span class="source-info-text">{{ t("atlas.sourceInfo") }}</span><span v-if="source !== 'live' || error" class="source-signal" aria-hidden="true">!</span></summary>
    <section class="atlas-source-popover" :aria-label="text('Source and map information', 'Thông tin nguồn và bản đồ')" data-lenis-prevent>
      <header><h2>{{ t("atlas.sourceInfo") }}</h2><button type="button" :aria-label="text('Close Source Info', 'Đóng thông tin nguồn')" @click="close"><Icon name="close" :size="16" /></button></header>
      <p class="source-label" role="status">{{ label }}</p>
      <dl><dt>{{ text("Publication", "Trạng thái xuất bản") }}</dt><dd>{{ meta?.processStatus || text('Draft', 'Bản nháp') }}</dd><dt>{{ text("Content version", "Phiên bản nội dung") }}</dt><dd>{{ meta?.contentVersion || 'D0' }}</dd><dt>{{ text("Effective from", "Hiệu lực từ") }}</dt><dd>{{ meta?.effectiveFrom || t('atlas.pendingApproval') }}</dd><dt>{{ text("Content updated", "Nội dung cập nhật") }}</dt><dd>{{ meta?.updatedAt || t('atlas.unspecified') }}</dd><dt>{{ text("Fetched", "Tải nguồn lúc") }}</dt><dd>{{ refreshedAt || text('No live-source fetch timestamp', 'Chưa có thời điểm tải nguồn trực tiếp') }}</dd></dl>
      <p v-if="error" class="source-warning" role="alert">{{ errorLabel }}</p>
      <p class="source-limit">{{ text("Reported practice is process-owner context, not tested operating effectiveness or an approved SOP.", "Thực tế được xác nhận là thông tin từ chủ quy trình, không phải kết luận kiểm tra tính hữu hiệu vận hành hay SOP đã phê duyệt.") }}</p>
      <details class="atlas-map-help"><summary>{{ text("Map controls & notation", "Thao tác & ký hiệu bản đồ") }}</summary><p>{{ text("Drag / scroll to pan. Ctrl/⌘ + scroll or +/− to zoom. Fit restores the overview. Click a stage to read its guide.", "Kéo / cuộn để di chuyển. Ctrl/⌘ + cuộn hoặc +/− để phóng to, thu nhỏ. Vừa khung đưa về tổng quan. Chọn một giai đoạn để đọc tài liệu.") }}</p><p>{{ text("Arrow keys pan; F fits; 1–8 opens the chapter guide. Dashed arrow: rework. Data lane connectors show supporting dependencies, not extra business stages.", "Phím mũi tên để di chuyển; F để vừa khung; 1–8 để mở chương. Mũi tên nét đứt: xử lý lại. Đường nối luồng dữ liệu thể hiện quan hệ hỗ trợ, không phải giai đoạn nghiệp vụ bổ sung.") }}</p></details>
    </section>
  </details>
</template>

<style scoped>
.atlas-source-info { position: relative; flex: none; font-size: 12px; }
.atlas-source-info>summary { display: flex; align-items: center; gap: 8px; min-height: 44px; padding: 8px 12px; border: 1px solid var(--color-card-border); border-radius: 8px; list-style: none; cursor: pointer; background: var(--space-navy); color: var(--color-text-400); white-space: nowrap; }
.atlas-source-info>summary::-webkit-details-marker { display: none; }
.source-signal { color: var(--color-orange-400); font-weight: 600; }
.atlas-source-popover { position: absolute; top: calc(100% + 8px); right: 0; z-index: var(--z-index-cards); width: min(390px,calc(100vw - 32px)); max-height: calc(100dvh - var(--height-header) - 128px); overflow: auto; overscroll-behavior: contain; padding: 16px; border: 1px solid var(--color-card-border-hover); border-radius: var(--radius-md); background: var(--space-navy); box-shadow: 0 16px 48px var(--space-abyss); scrollbar-width: thin; }
header { display: flex; align-items: center; justify-content: space-between; gap: 12px; }
h2 { font-size: 16px; font-weight: 500; }
button { display: inline-flex; align-items: center; justify-content: center; gap: 8px; min-height: 44px; padding: 8px 12px; border: 1px solid var(--color-card-border); border-radius: 6px; color: var(--color-text-400); background: var(--space-deep); cursor: pointer; }
header button { width: 44px; padding: 8px; }
.source-label { margin-top: 12px; color: var(--color-cyan-400); font-size: 13px; }
dl { display: grid; grid-template-columns: 100px minmax(0,1fr); gap: 8px 12px; padding: 16px 0; margin: 16px 0; border-block: 1px solid var(--color-card-border); font-size: 11px; line-height: 1.5; }
dt { color: var(--color-text-300); } dd { margin: 0; color: var(--color-text-400); overflow-wrap: anywhere; }
p { font-size: 12px; line-height: 1.6; color: var(--color-text-300); overflow-wrap: anywhere; }
.source-warning { padding: 8px; border-left: 2px solid var(--color-orange-400); background: var(--color-orange-muted); margin-bottom: 12px; }
.atlas-map-help { margin-top: 16px; font-size: 12px; color: var(--color-text-300); }
.atlas-map-help summary { cursor: pointer; min-height: 44px; padding: 12px 0; color: var(--color-text-400); }
.atlas-map-help p+p { margin-top: 8px; }
summary:focus-visible,button:focus-visible { outline: 2px solid var(--color-orange-400); outline-offset: 2px; }
@media(max-width:540px) { .atlas-source-info>summary { position: relative; width: 44px; padding: 8px; justify-content: center; } .source-info-text { display: none; } .source-signal { position: absolute; right: 4px; top: 3px; font-size: 10px; } }
</style>
