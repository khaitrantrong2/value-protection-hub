import { ref } from "vue";
import { atlasDemo } from "../data/atlasDemo";
import { fetchAtlas } from "../services/atlasService";
import type { AtlasPayload } from "../types/atlas";

const data = ref<AtlasPayload | null>(null);
const source = ref<"live" | "demo" | "unavailable">("unavailable");
const isLoading = ref(false);
const error = ref<string>();
const refreshedAt = ref<string>();
let request: AbortController | undefined;
let generation = 0;

/** Atlas is read-only; Sheet edits are published by the source owner, not this page. */
export function useAtlas() {
  function previewDraft() {
    ++generation;
    request?.abort();
    data.value = atlasDemo;
    source.value = "demo";
    error.value = "Đang xem bản draft đóng gói trong repo, không phải nội dung Google Sheet mới nhất. Refresh source để thử kết nối live.";
    isLoading.value = false;
    refreshedAt.value = undefined;
  }
  async function refresh() {
    const current = ++generation;
    request?.abort();
    const apiUrl = import.meta.env.VITE_LINKS_API_URL as string | undefined;
    if (!apiUrl?.trim()) {
      data.value = atlasDemo;
      source.value = "demo";
      error.value = undefined;
      isLoading.value = false;
      refreshedAt.value = undefined;
      return;
    }
    request = new AbortController();
    isLoading.value = true;
    error.value = undefined;
    try {
      const next = await fetchAtlas(apiUrl.trim(), request.signal);
      if (current !== generation) return;
      data.value = next;
      source.value = "live";
      refreshedAt.value = new Date().toISOString();
    } catch (err) {
      if (current !== generation || (err instanceof Error && err.name === "AbortError")) return;
      if (source.value !== "live") {
        data.value = null;
        source.value = "unavailable";
      }
      error.value = err instanceof Error ? err.message : "Không thể cập nhật nội dung Atlas.";
      if (data.value && source.value === "live") error.value += " Đang giữ bản đọc thành công gần nhất, không phải dữ liệu mới.";
    } finally {
      if (current === generation) isLoading.value = false;
    }
  }
  return { data, source, isLoading, error, refreshedAt, refresh, previewDraft };
}
