import type { MetadataRoute } from 'next';
import { siteConfig } from '@/lib/config/site';
import { locales, defaultLocale } from '@/i18n/routing';
import { services } from '@/lib/config/services';

/**
 * Static route sitemap with per-locale alternates (hreflang). Dynamic content
 * (blog posts, landing pages) is appended once those are wired to the DB.
 */
const staticPaths = [
  '',
  '/services',
  '/rates',
  '/transactions',
  '/calculator',
  '/how-it-works',
  '/about',
  '/compliance',
  '/insights',
  '/contact',
  '/request-quote',
  '/privacy',
  '/terms',
  ...services.map((s) => `/services/${s.slug}`),
];

function url(locale: string, path: string) {
  const prefix = locale === defaultLocale ? '' : `/${locale}`;
  return `${siteConfig.domain}${prefix}${path}`;
}

export default function sitemap(): MetadataRoute.Sitemap {
  return staticPaths.map((path) => ({
    url: url(defaultLocale, path),
    lastModified: new Date(),
    changeFrequency: 'weekly',
    priority: path === '' ? 1 : 0.7,
    alternates: {
      languages: Object.fromEntries(locales.map((l) => [l, url(l, path)])),
    },
  }));
}
