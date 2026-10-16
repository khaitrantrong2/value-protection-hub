<script setup lang="ts">
import { computed } from "vue";
import type { AtlasControl, AtlasReference, AtlasStage, AtlasStageId } from "../../types/atlas";
import AtlasStatus from "./AtlasStatus.vue";
import Icon from "../Icon.vue";
import { useLocale } from "../../i18n";
const { t, text } = useLocale();

const props = defineProps<{ stage: AtlasStage; controls: AtlasControl[]; references: AtlasReference[]; supportStages: AtlasStage[] }>();
const emit = defineEmits<{ stage: [id: AtlasStageId]; reference: [reference: AtlasReference] }>();
const branches = computed(() => props.stage.fork === "parallel" ? ["BRANCH-05A", "BRANCH-05B"].flatMap(id => {
  const reference = props.references.find(item => item.id === id && item.stageId === props.stage.id);
  return reference ? [reference] : [];
}) : []);
const raci = computed(() => [[text("Accountable", "Chịu trách nhiệm cuối cùng"), props.stage.raci.accountable], [text("Responsible", "Thực hiện"), props.stage.raci.responsible.join(" · ")], [text("Consulted", "Được tham vấn"), props.stage.raci.consulted.join(" · ")], [text("Informed", "Được thông báo"), props.stage.raci.informed.join(" · ")]]);
const processSteps = computed(() => [[text("Input", "Đầu vào"), props.stage.sipoc.input], [text("Process", "Hoạt động"), props.stage.sipoc.process], [text("Output", "Đầu ra"), props.stage.sipoc.output]]);
</script>

<template>
  <article class="guide-stage" :data-stage-id="stage.id">
    <header class="guide-chapter-heading"><p class="guide-chapter-index">{{ stage.kind === 'chapter' ? text('BUSINESS PROCESS', 'QUY TRÌNH NGHIỆP VỤ') : text('SUPPORTING CAPABILITY', 'QUY TRÌNH HỖ TRỢ') }} · {{ stage.id }}</p><h2 id="atlas-guide-title" tabindex="-1">{{ stage.title }}</h2><p class="guide-question">{{ stage.businessQuestion }}</p><div class="guide-chapter-meta"><AtlasStatus :state="stage.practiceState" /><span>{{ stage.roleTag }}</span></div></header>

    <section class="guide-section" data-guide-section="summary"><h3><span>01</span> {{ text("Scope & business purpose", "Phạm vi & mục đích nghiệp vụ") }}</h3><p>{{ stage.narrative || text('No narrative published for this stage.', 'Chưa xuất bản diễn giải cho giai đoạn này.') }}</p><dl class="guide-facts"><dt>{{ text("Applicability", "Phạm vi áp dụng") }}</dt><dd>{{ stage.applicability || t('atlas.unspecified') }}</dd></dl></section>

    <section class="guide-section"><h3><span>02</span> {{ text("Process & handoffs", "Hoạt động & bàn giao") }}</h3><div class="guide-mini-flow"><section v-for="([label, value], index) in processSteps" :key="label"><h4>{{ label }}</h4><p>{{ value || t('atlas.unspecified') }}</p><Icon v-if="index < processSteps.length - 1" class="guide-flow-arrow" name="arrowRight" :size="16" /></section></div><dl class="guide-facts"><dt>{{ text("Supplier", "Bên cung cấp đầu vào") }}</dt><dd>{{ stage.sipoc.supplier || t('atlas.unspecified') }}</dd><dt>{{ text("Customer / next owner", "Bên nhận / phụ trách tiếp theo") }}</dt><dd>{{ stage.sipoc.customer || t('atlas.unspecified') }}</dd></dl>
      <aside v-if="stage.caution" class="guide-boundary"><strong>{{ text("Process boundary", "Ranh giới quy trình") }}</strong><p>{{ stage.caution }}</p></aside>
      <div v-if="branches.length" class="guide-parallel"><p class="guide-parallel-label">{{ text("Parallel workstreams · not sequential gates", "Hai luồng song song · không phải điều kiện tuần tự") }}</p><div class="guide-branch-grid"><section v-for="branch in branches" :key="branch.id"><AtlasStatus :state="branch.practiceState" /><h4>{{ branch.title }}</h4><p>{{ branch.body }}</p><p v-if="branch.applicability" class="guide-small">{{ branch.applicability }}</p></section></div></div>
    </section>

    <section class="guide-section" data-guide-section="ownership" tabindex="-1"><h3><span>03</span> {{ text("Ownership & responsibilities", "Vai trò & trách nhiệm") }}</h3><dl class="guide-raci"><div v-for="([label, value], index) in raci" :key="label"><dt><span>{{ ['A','R','C','I'][index] }}</span>{{ label }}</dt><dd>{{ value || t('atlas.unspecified') }}</dd></div></dl></section>

    <section class="guide-section" data-guide-section="controls" tabindex="-1"><h3><span>04</span> {{ text("Risks & controls", "Rủi ro & kiểm soát") }} <small>{{ controls.length }}</small></h3><p v-if="!controls.length" class="guide-empty">{{ text("No control record is published for this stage.", "Chưa có bản ghi kiểm soát được xuất bản cho giai đoạn này.") }}</p>
      <article v-for="control in controls" :key="control.id" class="guide-control"><header><span class="guide-record-id">{{ control.id }}</span><h4>{{ control.title }}</h4><AtlasStatus :state="control.practiceState" control /></header><dl class="guide-control-facts"><dt>{{ text("What could go wrong", "Rủi ro có thể xảy ra") }}</dt><dd>{{ control.wcgw || t('atlas.unspecified') }}</dd><dt>{{ text("Assertions", "Cơ sở dẫn liệu") }}</dt><dd>{{ control.assertions.join(' · ') || t('atlas.unspecified') }}</dd><dt>{{ text("Control activity", "Hoạt động kiểm soát") }}</dt><dd>{{ control.nature === "preventive" ? text("Preventive", "Phòng ngừa") : control.nature === "detective" ? text("Detective", "Phát hiện") : text("Mixed", "Kết hợp") }} · {{ control.frequency || text('Frequency not specified', 'Chưa ghi tần suất') }}<br>{{ text("Owner", "Vai trò phụ trách") }}: {{ control.ownerRole || t('atlas.unspecified') }}</dd><dt>{{ text("Evidence status", "Trạng thái bằng chứng") }}</dt><dd><AtlasStatus :state="control.evidenceState" /><p>{{ control.evidenceLocation || text('No evidence location recorded', 'Chưa ghi nơi lưu bằng chứng') }}</p></dd><dt>{{ text("Limitation / residual risk", "Giới hạn / rủi ro còn lại") }}</dt><dd>{{ control.limitation || t('atlas.unspecified') }}</dd></dl><footer><p>{{ text("Source basis", "Cơ sở nguồn") }}: {{ control.sourceBasis || t('atlas.unspecified') }}</p><span>{{ control.contentVersion || t('atlas.noVersion') }}</span></footer></article>
    </section>

    <section class="guide-section"><h3><span>05</span> {{ text("Supporting capabilities", "Quy trình hỗ trợ") }}</h3><template v-if="stage.pipeline.length"><p class="guide-small">{{ text("Technical handoffs support the business process; these labels do not imply that every step is automated.", "Các điểm bàn giao kỹ thuật hỗ trợ quy trình nghiệp vụ; tên gọi không hàm ý mọi bước đã tự động hóa.") }}</p><ol class="guide-pipeline"><li v-for="(step, index) in stage.pipeline" :key="index"><span>{{ String(index + 1).padStart(2,'0') }}</span>{{ step }}</li></ol></template><div v-if="supportStages.length" class="guide-support-links"><button v-for="support in supportStages" :key="support.id" type="button" @click="emit('stage', support.id)"><span>{{ support.id }}</span><span><strong>{{ support.shortTitle }}</strong><small>{{ support.businessQuestion }}</small></span><Icon name="arrowRight" :size="18" /></button></div><p v-if="stage.kind === 'supporting' && stage.supports.length" class="guide-small">{{ text('Supports business stages:', 'Hỗ trợ các giai đoạn nghiệp vụ:') }} {{ stage.supports.join(' · ') }}</p><p v-if="!stage.pipeline.length && !supportStages.length && !stage.supports.length" class="guide-small">{{ text("No supporting capability is linked to this chapter in the published source.", "Nguồn xuất bản chưa liên kết quy trình hỗ trợ cho chương này.") }}</p></section>

    <section class="guide-section"><h3><span>06</span> {{ text("Related references", "Tham chiếu liên quan") }} <small>{{ references.length }}</small></h3><p class="guide-small">{{ references.length ? text('Open a definition or document sequence in the reference appendix.', 'Mở định nghĩa hoặc trình tự chứng từ trong phụ lục tham chiếu.') : text('No related reference is linked to this chapter in the published source.', 'Nguồn xuất bản chưa liên kết tham chiếu nào cho chương này.') }}</p><div v-if="references.length" class="guide-reference-links"><button v-for="item in references" :key="item.id" type="button" @click="emit('reference', item)"><span>{{ item.id }}</span><strong>{{ item.title }}</strong><Icon name="arrowRight" :size="14" /></button></div></section>

    <details class="guide-source-basis"><summary>{{ text("Document notes", "Ghi chú tài liệu") }}</summary><dl class="guide-facts"><dt>{{ text("Content version", "Phiên bản nội dung") }}</dt><dd>{{ stage.contentVersion || t('atlas.unspecified') }}</dd><dt>{{ text("Effective from", "Hiệu lực từ") }}</dt><dd>{{ stage.effectiveFrom || t('atlas.pendingApproval') }}</dd><dt v-if="stage.updatedAt">{{ text("Content updated", "Nội dung cập nhật") }}</dt><dd v-if="stage.updatedAt">{{ stage.updatedAt }}</dd><dt>{{ text("Source basis", "Cơ sở nguồn") }}</dt><dd>{{ stage.sourceBasis || t('atlas.unspecified') }}</dd></dl></details>
  </article>
</template>

<style scoped>
.guide-chapter-index { color: var(--color-cyan-400); font-size: 11px; letter-spacing: .08em; }
h2 { font-size: clamp(24px,2.6vw,34px); font-weight: 600; line-height: 1.25; letter-spacing: -.025em; margin-top: 8px; overflow-wrap: anywhere; text-wrap: balance; }
.guide-question { margin-top: 12px; font-size: 16px; line-height: 1.6; color: var(--color-text-400); }
.guide-chapter-meta { display: flex; flex-wrap: wrap; gap: 8px 16px; align-items: center; margin-top: 12px; font-size: 12px; color: var(--color-text-300); }
.guide-section { padding-top: 20px; margin-top: 24px; border-top: 1px solid var(--color-card-border); }
.guide-section>p { max-width: 78ch; }
h3 { display: flex; flex-wrap: wrap; align-items: baseline; gap: 10px; font-size: 16px; line-height: 1.5; font-weight: 500; margin-bottom: 12px; }
h3>span { font-size: 11px; color: var(--color-cyan-400); font-variant-numeric: tabular-nums; }
h3>small { color: var(--color-text-300); font-size: 12px; font-weight: 400; }
p,dd { font-size: 14px; line-height: 1.7; color: var(--color-text-300); white-space: pre-line; overflow-wrap: anywhere; }
.guide-facts { display: grid; grid-template-columns: 132px minmax(0,1fr); gap: 8px 16px; margin-top: 16px; }
dt { color: var(--color-text-400); font-size: 12px; line-height: 1.6; } dd { margin: 0; }
.guide-mini-flow { display: grid; grid-template-columns: repeat(3,minmax(0,1fr)); border: 1px solid var(--color-card-border); border-radius: 8px; background: var(--space-navy); }
.guide-mini-flow section { position: relative; padding: 16px; min-width: 0; }
.guide-mini-flow section+section { border-left: 1px solid var(--color-card-border); }
h4 { font-size: 15px; font-weight: 500; line-height: 1.5; overflow-wrap: anywhere; }
.guide-mini-flow h4 { margin-bottom: 10px; color: var(--color-cyan-400); font-size: 12px; }
.guide-mini-flow p { font-size: 13px; line-height: 1.65; }
.guide-flow-arrow { position: absolute; right: -8px; top: 22px; z-index: 1; color: var(--color-cyan-400); background: var(--space-navy); }
.guide-boundary { margin-top: 24px; padding: 16px 20px; border-left: 2px solid var(--color-orange-400); background: var(--color-orange-muted); }
.guide-boundary strong { font-size: 12px; font-weight: 500; color: var(--color-orange-400); }
.guide-boundary p { margin-top: 8px; font-size: 14px; }
.guide-parallel { margin-top: 28px; }
.guide-parallel-label { color: var(--color-cyan-400); font-size: 12px; margin-bottom: 12px; }
.guide-branch-grid { display: grid; grid-template-columns: repeat(2,minmax(0,1fr)); gap: 16px; }
.guide-branch-grid section { padding: 20px; border: 1px solid var(--color-card-border); border-radius: 8px; background: var(--space-navy); }
.guide-branch-grid h4 { margin: 12px 0; }
.guide-branch-grid p { font-size: 14px; }
.guide-small { font-size: 12px; line-height: 1.65; margin-top: 10px; }
.guide-raci { display: grid; grid-template-columns: repeat(2,minmax(0,1fr)); gap: 20px 32px; }
.guide-raci>div { border-bottom: 1px solid var(--color-card-border); padding-bottom: 16px; }
.guide-raci dt { display: flex; align-items: baseline; gap: 8px; margin-bottom: 8px; }
.guide-raci dt>span { color: var(--color-cyan-400); font-size: 16px; }
.guide-empty { margin-top: 16px; }
.guide-control { margin-top: 24px; border: 1px solid var(--color-card-border); border-radius: 8px; overflow: hidden; }
.guide-control>header { display: flex; flex-wrap: wrap; align-items: center; gap: 8px 12px; padding: 16px 20px; background: var(--space-navy); border-bottom: 1px solid var(--color-card-border); }
.guide-control>header h4 { flex: 1; min-width: 160px; }
.guide-record-id { color: var(--color-cyan-400); font-size: 11px; font-variant-numeric: tabular-nums; }
.guide-control-facts { display: grid; grid-template-columns: 140px minmax(0,1fr); gap: 16px 20px; padding: 20px; }
.guide-control-facts dd { font-size: 14px; line-height: 1.65; }
.guide-control-facts dd p { font-size: 13px; margin-top: 8px; }
.guide-control>footer { display: grid; gap: 8px; padding: 12px 20px; border-top: 1px solid var(--color-card-border); color: var(--color-text-300); font-size: 11px; }
.guide-control>footer p { font-size: 11px; line-height: 1.6; }
.guide-pipeline { list-style: none; margin-top: 20px; }
.guide-pipeline li { display: grid; grid-template-columns: 24px minmax(0,1fr); gap: 12px; padding: 12px 0; border-bottom: 1px solid var(--color-card-border); font-size: 14px; line-height: 1.65; color: var(--color-text-300); overflow-wrap: anywhere; }
.guide-pipeline li>span { font-size: 11px; color: var(--color-cyan-400); }
.guide-support-links { margin-top: 20px; }
button { min-height: 44px; color: var(--color-text-400); border: 1px solid var(--color-card-border); border-radius: 6px; background: var(--space-navy); cursor: pointer; text-align: left; }
button:hover { background: var(--color-command-bg-soft); border-color: var(--color-card-border-hover); }
.guide-support-links button { display: grid; grid-template-columns: 28px minmax(0,1fr) 18px; align-items: center; gap: 12px; width: 100%; padding: 16px; margin-top: 12px; }
.guide-support-links button>span:first-child { color: var(--color-cyan-400); font-size: 18px; }
.guide-support-links strong { font-size: 14px; font-weight: 500; }
.guide-support-links small { display: block; color: var(--color-text-300); font-size: 12px; line-height: 1.5; margin-top: 6px; }
.guide-reference-links { display: grid; grid-template-columns: repeat(2,minmax(0,1fr)); gap: 8px; margin-top: 16px; }
.guide-reference-links button { display: grid; grid-template-columns: auto minmax(0,1fr) 14px; gap: 8px; align-items: center; padding: 12px; }
.guide-reference-links span { font-size: 10px; color: var(--color-cyan-400); }
.guide-reference-links strong { font-size: 12px; font-weight: 400; line-height: 1.5; overflow-wrap: anywhere; }
.guide-source-basis { margin-top: 24px; padding-top: 12px; border-top: 1px solid var(--color-card-border); }
.guide-source-basis summary { cursor: pointer; min-height: 44px; padding: 12px 0; color: var(--color-text-300); font-size: 12px; }
.guide-source-basis dd { font-size: 12px; line-height: 1.65; }
button:focus-visible,summary:focus-visible,[tabindex='-1']:focus-visible { outline: 2px solid var(--color-orange-400); outline-offset: 3px; }
@media(max-width:840px) { .guide-mini-flow { grid-template-columns: minmax(0,1fr); } .guide-mini-flow section+section { border-left: 0; border-top: 1px solid var(--color-card-border); } .guide-flow-arrow { right: 20px; top: auto; bottom: -8px; transform: rotate(90deg); } }
@media(max-width:840px) { .guide-section { margin-top: 28px; padding-top: 24px; } .guide-raci,.guide-reference-links,.guide-branch-grid { grid-template-columns: minmax(0,1fr); } .guide-control-facts,.guide-facts { grid-template-columns: minmax(0,1fr); gap: 8px; } .guide-facts dd+dt,.guide-control-facts dd+dt { margin-top: 8px; } .guide-control>header,.guide-control-facts { padding: 16px; } .guide-control>footer { padding: 12px 16px; } .guide-question { font-size: 16px; } p,dd { font-size: 14px; line-height: 1.75; } }
</style>
