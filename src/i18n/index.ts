import { computed, watch } from 'vue';
import { createI18n } from 'vue-i18n';
import { messages as shellMessages } from './messages/shell';
import { messages as crewMessages } from './messages/crew';
import { messages as directoryMessages } from './messages/directory';
import { messages as atlasMessages } from './messages/atlas';
import { isLocale, localeURL, LOCALE_STORAGE_KEY, resolveLocale, type Locale } from './localeState';

function savedLocale(): string | null {
  try { return localStorage.getItem(LOCALE_STORAGE_KEY); } catch { return null; }
}

export const i18n = createI18n({
  legacy: false,
  locale: resolveLocale(typeof window === 'undefined' ? '' : window.location.search ?? '', savedLocale()),
  fallbackLocale: 'en',
  messages: {
    en: { ...shellMessages.en, ...crewMessages.en, ...directoryMessages.en, ...atlasMessages.en },
    vi: { ...shellMessages.vi, ...crewMessages.vi, ...directoryMessages.vi, ...atlasMessages.vi },
  },
  missingWarn: import.meta.env.DEV,
  fallbackWarn: import.meta.env.DEV,
});

const locale = computed(() => i18n.global.locale.value as Locale);

function setLocale(value: Locale) {
  if (!isLocale(value)) return;
  i18n.global.locale.value = value;
  try { localStorage.setItem(LOCALE_STORAGE_KEY, value); } catch { /* preference storage is optional */ }
  if (typeof window !== 'undefined' && window.location.href) {
    const next = localeURL(window.location.href, value);
    window.history.replaceState(window.history.state, '', next);
  }
}

export function useLocale() {
  return {
    locale,
    setLocale,
    t: (key: string, params: Record<string, string | number> = {}) => i18n.global.t(key, params),
    text: (english: string, vietnamese: string) => locale.value === 'vi' ? vietnamese : english,
  };
}

export function startLocaleSync(): () => void {
  const applyDocument = () => {
    document.documentElement.lang = locale.value;
    document.title = locale.value === 'vi' ? 'Value Protection Hub — Quy trình, tài liệu & đội ngũ' : 'Value Protection Hub — Process, resources & team';
  };
  const stop = watch(locale, applyDocument, { immediate: true });
  const onHistory = () => {
    i18n.global.locale.value = resolveLocale(window.location.search, savedLocale());
  };
  window.addEventListener('popstate', onHistory);
  return () => { stop(); window.removeEventListener('popstate', onHistory); };
}
