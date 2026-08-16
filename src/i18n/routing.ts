import { defineRouting } from 'next-intl/routing';

/**
 * Supported locales. Adding a new language later = one entry here + one
 * message file under /messages. Everything else adapts automatically.
 */
export const locales = ['en', 'fa', 'ru'] as const;
export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = 'en';

/** Right-to-left locales. */
export const rtlLocales: Locale[] = ['fa'];

export const localeMeta: Record<
  Locale,
  { label: string; native: string; dir: 'ltr' | 'rtl'; flag: string }
> = {
  en: { label: 'English', native: 'English', dir: 'ltr', flag: '🇬🇧' },
  fa: { label: 'Persian', native: 'فارسی', dir: 'rtl', flag: '🇮🇷' },
  ru: { label: 'Russian', native: 'Русский', dir: 'ltr', flag: '🇷🇺' },
};

export function getDir(locale: string): 'ltr' | 'rtl' {
  return rtlLocales.includes(locale as Locale) ? 'rtl' : 'ltr';
}

export const routing = defineRouting({
  locales,
  defaultLocale,
  localePrefix: 'as-needed',
});
