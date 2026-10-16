<script setup lang="ts">
import { computed, nextTick, ref, watch } from "vue";
import type { AtlasReference, AtlasReferenceGroup, AtlasStage, AtlasStageId } from "../../types/atlas";
import type { AtlasLibraryGroup } from "../../types/atlasUi";
import AtlasStatus from "./AtlasStatus.vue";
import Icon from "../Icon.vue";
import { useLocale } from "../../i18n";
import { matchesSearch } from '../../services/search';
const { t, text } = useLocale();

const props = defineProps<{ references: AtlasReference[]; stages: AtlasStage[]; group: AtlasLibraryGroup; groupNames: Record<AtlasReferenceGroup, string>; referenceId?: string | null }>();
const emit = defineEmits<{ group: [group: AtlasLibraryGroup]; stage: [id: AtlasStageId] }>();
const search = ref("");
const root = ref<HTMLElement | null>(null);
const groupCounts = computed(() => Object.entries(props.groupNames).map(([id, title]) => ({ id: id as AtlasReferenceGroup, title, count: props.references.filter(item => item.group === id).length })));
const searched = computed(() => {
  return props.references.filter(item => matchesSearch(search.value, [item.id, item.title, item.body, item.applicability, props.groupNames[item.group]]));
});
const groups = computed(() => groupCounts.value.filter(group => props.group === "all" || props.group === group.id).map(group => ({ ...group, items: searched.value.filter(item => item.group === group.id).sort((a, b) => a.order - b.order || a.id.localeCompare(b.id)) })).filter(group => group.items.length));
const count = computed(() => groups.value.reduce((total, group) => total + group.items.length, 0));
const title = computed(() => props.group === "all" ? t("atlas.appendix") : props.groupNames[props.group]);
function relatedStages(reference: AtlasReference) { return props.stages.filter(stage => stage.id === reference.stageId || stage.referenceIds.includes(reference.id)).sort((a, b) => a.order - b.order); }
function publicLink(value: string) {
  try { const url = new URL(value); return url.protocol === "https:" && !url.username && !url.password ? url.href : undefined; } catch { return undefined; }
}
function changeGroup(event: Event) { emit("group", (event.target as HTMLSelectElement).value as AtlasLibraryGroup); }
watch(() => props.referenceId, async () => {
  if (!props.referenceId) return;
  search.value = "";
  await nextTick();
  [...(root.value?.querySelectorAll<HTMLElement>("[data-guide-reference]") ?? [])].find(item => item.dataset.guideReference === props.referenceId)?.focus({ preventScroll: true });
});
</script>

<template>
  <article ref="root" class="guide-references">
    <header><p class="guide-reference-eyebrow">{{ text("REFERENCE APPENDIX", "PHỤ LỤC THAM CHIẾU") }}</p><h2 id="atlas-guide-title" tabindex="-1">{{ title }}</h2><p>{{ text("Definitions, document sequences and handoffs used in the process. These records provide context; they are not conclusions on control effectiveness.", "Định nghĩa, trình tự chứng từ và điểm bàn giao trong quy trình. Những bản ghi này cung cấp bối cảnh, không phải kết luận về tính hữu hiệu kiểm soát.") }}</p></header>
    <div class="guide-reference-filters"><label><span>{{ text("Search the source", "Tìm trong nội dung nguồn") }}</span><input v-model="search" type="search" maxlength="300" :placeholder="text('Reference ID, title or definition', 'Mã, tiêu đề hoặc định nghĩa tham chiếu')" autocomplete="off"></label><label><span>{{ text("Reference type", "Loại tham chiếu") }}</span><select :value="group" @change="changeGroup"><option value="all">{{ text("All types", "Tất cả loại") }} ({{ references.length }})</option><option v-for="item in groupCounts" :key="item.id" :value="item.id">{{ item.title }} ({{ item.count }})</option></select></label></div>
    <p class="guide-reference-count" role="status" aria-live="polite">{{ text(`${count} of ${references.length} source references`, `${count} / ${references.length} tham chiếu nguồn`) }}<span v-if="search"> {{ text("matching", "khớp với") }} “{{ search }}”</span></p>
    <div v-if="!count" class="guide-reference-empty"><h3>{{ text("No matching references", "Không có tham chiếu phù hợp") }}</h3><p>{{ text("Try another search or reference type. The published source has not changed.", "Thử từ khóa hoặc loại tham chiếu khác. Nội dung nguồn đã xuất bản không thay đổi.") }}</p><button type="button" @click="search = ''; emit('group', 'all')">{{ text("Reset filters", "Xóa bộ lọc") }}</button></div>
    <section v-for="section in groups" :key="section.id" class="guide-reference-group"><h3>{{ section.title }} <span>{{ section.items.length }}</span></h3><article v-for="item in section.items" :key="item.id" :data-guide-reference="item.id" tabindex="-1" class="guide-reference-record" :class="{ 'is-selected': item.id === referenceId }"><header><span class="guide-reference-id">{{ item.id }}</span><h4>{{ item.title }}</h4><AtlasStatus :state="item.practiceState" /></header><p>{{ item.body || text('No definition published.', 'Chưa xuất bản định nghĩa.') }}</p><dl v-if="item.applicability"><dt>{{ text("Applicability", "Phạm vi áp dụng") }}</dt><dd>{{ item.applicability }}</dd></dl><div v-if="relatedStages(item).length" class="guide-reference-stages"><span>{{ text("Process context", "Bối cảnh quy trình") }}</span><button v-for="stage in relatedStages(item)" :key="stage.id" type="button" @click="emit('stage', stage.id)">{{ stage.id }} · {{ stage.shortTitle }}<Icon name="arrowRight" :size="14" /></button></div><footer><span>{{ item.contentVersion || t('atlas.noVersion') }}</span><a v-if="publicLink(item.url)" :href="publicLink(item.url)" target="_blank" rel="noopener noreferrer">{{ text("Public reference", "Tham chiếu công khai") }} <Icon name="external" :size="14" /></a></footer></article></section>
  </article>
</template>

<style scoped>
.guide-reference-eyebrow { color: var(--color-cyan-400); font-size: 11px; letter-spacing: .08em; }
h2 { font-size: clamp(26px,3vw,38px); font-weight: 500; line-height: 1.15; letter-spacing: -.025em; margin-top: 12px; overflow-wrap: anywhere; }
.guide-references>header>p:last-child { margin-top: 20px; max-width: 65ch; }
p,dd { color: var(--color-text-300); font-size: 15px; line-height: 1.75; white-space: pre-line; overflow-wrap: anywhere; }
.guide-reference-filters { display: grid; grid-template-columns: minmax(0,1.4fr) minmax(0,1fr); gap: 20px; margin-top: 28px; padding: 20px 0; border-top: 1px solid var(--color-card-border); border-bottom: 1px solid var(--color-card-border); }
label { display: grid; gap: 8px; min-width: 0; }
label>span { font-size: 12px; color: var(--color-text-300); }
input,select { min-width: 0; width: 100%; min-height: 44px; border: 1px solid var(--color-card-border); border-radius: 6px; padding: 8px 12px; background: var(--space-navy); color: var(--color-text-400); font: inherit; font-size: 14px; }
input::placeholder { color: var(--color-text-300); opacity: .8; }
.guide-reference-count { font-size: 12px; margin-top: 16px; }
.guide-reference-group { margin-top: 32px; }
h3 { font-size: 18px; line-height: 1.4; font-weight: 500; margin-bottom: 16px; }
h3>span { color: var(--color-text-300); font-size: 12px; margin-left: 8px; font-weight: 400; }
.guide-reference-record { padding: 24px 0; border-top: 1px solid var(--color-card-border); scroll-margin-top: 24px; }
.guide-reference-record>p { max-width: 65ch; }
.guide-reference-record>header { display: flex; flex-wrap: wrap; gap: 8px 12px; align-items: baseline; margin-bottom: 16px; }
.guide-reference-id { color: var(--color-cyan-400); font-size: 11px; }
h4 { flex: 1; min-width: 180px; font-size: 17px; font-weight: 500; line-height: 1.5; overflow-wrap: anywhere; }
.guide-reference-record.is-selected { padding: 20px; border: 1px solid var(--color-cyan-400); border-radius: 8px; background: var(--color-command-bg-soft); }
dl { margin-top: 20px; }
dt,.guide-reference-stages>span { color: var(--color-text-400); font-size: 12px; line-height: 1.5; }
dd { font-size: 13px; margin: 8px 0 0; }
.guide-reference-stages { display: flex; flex-wrap: wrap; align-items: center; gap: 8px; margin-top: 20px; }
.guide-reference-stages>span { flex: 0 0 100%; }
button { display: inline-flex; align-items: center; gap: 8px; min-height: 44px; border: 1px solid var(--color-card-border); border-radius: 6px; padding: 8px 12px; background: var(--space-navy); color: var(--color-text-400); font-size: 12px; text-align: left; cursor: pointer; }
button:hover { background: var(--color-command-bg-soft); border-color: var(--color-card-border-hover); }
.guide-reference-record>footer { display: flex; flex-wrap: wrap; justify-content: space-between; align-items: center; gap: 8px 20px; margin-top: 20px; color: var(--color-text-300); font-size: 11px; }
a { display: inline-flex; align-items: center; gap: 4px; min-height: 44px; color: var(--color-cyan-400); text-decoration: underline; font-size: 12px; }
.guide-reference-empty { padding: 28px 0; }
.guide-reference-empty p { margin-bottom: 20px; }
button:focus-visible,input:focus-visible,select:focus-visible,a:focus-visible,[tabindex='-1']:focus-visible { outline: 2px solid var(--color-orange-400); outline-offset: 3px; }
@media(max-width:840px) { .guide-reference-filters { grid-template-columns: minmax(0,1fr); gap: 16px; } input,select { font-size: 16px; } p,dd { font-size: 14px; } .guide-reference-record.is-selected { padding: 16px; } h4 { font-size: 16px; min-width: 160px; } }
</style>
