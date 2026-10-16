export type Locale = 'en' | 'vi';
export const LOCALE_STORAGE_KEY = 'vph:locale:v1';
export const isLocale = (value: unknown): value is Locale => value === 'en' || value === 'vi';

export function resolveLocale(search: string, saved: unknown): Locale {
  const explicit = new URLSearchParams(search).get('lang');
  return isLocale(explicit) ? explicit : isLocale(saved) ? saved : 'en';
}

/** Locale is outside the Atlas hash contract; all page/filter/hash context is preserved. */
export function localeURL(href: string, locale: Locale): string {
  const url = new URL(href);
  url.searchParams.set('lang', locale);
  return `${url.pathname}${url.search}${url.hash}`;
}
