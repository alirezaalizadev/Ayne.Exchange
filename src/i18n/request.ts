import { getRequestConfig } from 'next-intl/server';
import { routing } from './routing';
import type { Locale } from './routing';

/**
 * Loads the message dictionary for the active locale on the server.
 * Falls back to the default locale for unknown values.
 */
export default getRequestConfig(async ({ requestLocale }) => {
  let locale = await requestLocale;

  if (!locale || !routing.locales.includes(locale as Locale)) {
    locale = routing.defaultLocale;
  }

  return {
    locale,
    messages: (await import(`../../messages/${locale}.json`)).default,
    now: new Date(),
  };
});
