<script setup lang="ts">
import { computed, onBeforeUnmount, ref } from "vue";
import type { LinkItem } from "../types/links";
import { getLinkDestination } from "../services/linkSafety";
import { useLocale } from "../i18n";
import Icon from "./Icon.vue";

const props = defineProps<{ link: LinkItem }>();
const { t, text } = useLocale();
const destination = computed(() => getLinkDestination(props.link));
const copyState = ref<"idle" | "copied" | "failed">("idle");
let timer: ReturnType<typeof setTimeout> | undefined;
async function copyLink() {
  if (!destination.value.href) return;
  try { await navigator.clipboard.writeText(destination.value.href); copyState.value = "copied"; }
  catch { copyState.value = "failed"; }
  if (timer) clearTimeout(timer);
  timer = setTimeout(() => copyState.value = "idle", 3000);
}
onBeforeUnmount(() => { if (timer) clearTimeout(timer); });
</script>

<template>
  <div class="vault-links">
    <div class="vault-links__buttons">
      <a v-if="destination.href" :href="destination.href" target="_blank" rel="noopener noreferrer" :aria-label="t('directory.openNamed', { title: link.title })">{{ text('Open', 'Mở') }}<Icon name="external" :size="13" /></a>
      <span v-else class="vault-links__unavailable" aria-disabled="true">{{ t('directory.noDestination') }}</span>
      <button v-if="destination.href" type="button" :aria-label="t('directory.copyNamed', { title: link.title })" @click="copyLink"><Icon name="copy" :size="14" /><span>{{ text('Copy', 'Chép') }}</span></button>
    </div>
    <p v-if="copyState !== 'idle'" class="vault-links__feedback" role="status">{{ t(copyState === 'copied' ? 'directory.copied' : 'directory.copyFailed') }}</p>
  </div>
</template>

<style scoped lang="scss">
.vault-links { min-width: 0; }
.vault-links__buttons { display: flex; align-items: center; flex-wrap: wrap; gap: 6px; }
.vault-links a,.vault-links button,.vault-links__unavailable { display: inline-flex; justify-content: center; align-items: center; gap: 5px; min-height: 36px; padding: 6px 9px; border: 1px solid var(--color-card-border); border-radius: 5px; font: inherit; font-size: 12px; line-height: 1.4; }
.vault-links a { color: var(--color-text-400); border-color: var(--color-card-border-hover); background: var(--color-beige-600); }
.vault-links a:hover { background: var(--color-cyan-muted); }
.vault-links button { cursor: pointer; color: var(--color-text-300); background: transparent; }
.vault-links__unavailable { max-width: 160px; color: var(--color-text-200); border-style: dashed; }
.vault-links__feedback { max-width: 180px; margin-top: 5px; color: var(--color-text-300); font-size: 11px; line-height: 1.4; overflow-wrap: anywhere; }
@media(max-width:760px) { .vault-links a,.vault-links button { min-height: 44px; padding-inline: 12px; } }
</style>
