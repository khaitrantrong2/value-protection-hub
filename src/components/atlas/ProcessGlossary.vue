<script setup lang="ts">
import { useLocale } from '../../i18n';
const { t, text } = useLocale();
const terms = ['claimback', 'accrual', 'settlement', 'control'];
</script>

<template>
  <details class="process-glossary">
    <summary>{{ text('Glossary · financial distinctions', 'Thuật ngữ · các phân biệt tài chính') }}</summary>
    <p>{{ t('shell.readingSubtitle') }}</p>
    <dl><div v-for="term in terms" :key="term"><dt>{{ t('shell.' + term + 'Term') }}</dt><dd>{{ t('shell.' + term + 'Def') }}</dd></div></dl>
  </details>
</template>

<style scoped>
.process-glossary { margin-top: 24px; padding-top: 16px; border-top: 1px solid var(--color-card-border); }
summary { cursor: pointer; padding: 8px 0; min-height: 44px; font-size: 14px; color: var(--color-cyan-400); }
p,dd { font-size: 13px; line-height: 1.75; color: var(--color-text-300); }
dl { display: grid; grid-template-columns: repeat(2,minmax(0,1fr)); gap: 16px 24px; margin-top: 16px; }
dt { font-size: 14px; font-weight: 500; margin-bottom: 8px; }
@media(max-width:640px) { dl { grid-template-columns: minmax(0,1fr); } }
</style>
