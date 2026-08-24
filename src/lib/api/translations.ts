import 'server-only';
import en from '../../../messages/en.json';
import fa from '../../../messages/fa.json';
import ru from '../../../messages/ru.json';
import { locales, type Locale } from '@/i18n/routing';

/**
 * Read-only access to the site's translation catalogs for API responses
 * (service names/summaries etc.). The catalogs are the same files the web
 * front-end renders from — never a second copy.
 */

const catalogs: Record<string, Record<string, unknown>> = { en, fa, ru };

export function isLocale(value: string | null | undefined): value is Locale {
  return !!value && (locales as readonly string[]).includes(value);
}

export function normalizeLocale(value: string | null | undefined): Locale {
  return isLocale(value) ? value : 'en';
}

/** services.<key>.{name, short} for one locale, falling back to English. */
export function serviceCopy(key: string, locale: string): { name: string; summary: string } {
  const pick = (loc: string) => {
    const ns = (catalogs[loc]?.services ?? {}) as Record<string, { name?: string; short?: string }>;
    return ns[key];
  };
  const hit = pick(normalizeLocale(locale)) ?? pick('en');
  return { name: hit?.name ?? key, summary: hit?.short ?? '' };
}
