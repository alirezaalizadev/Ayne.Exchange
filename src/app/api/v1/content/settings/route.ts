import { prisma } from '@/lib/db';
import { handleApi, handleOptions, apiJsonCached } from '@/lib/api/respond';
import { siteConfig } from '@/lib/config/site';
import { currencies, currencyMeta } from '@/lib/config/currencies';
import { apiCurrency } from '@/lib/api/serialize';
import { locales, localeMeta } from '@/i18n/routing';
import { homeStats } from '@/lib/config/stats';

export const dynamic = 'force-dynamic';

const CRYPTO_CODES = ['USDT', 'USDC', 'BTC', 'ETH'];

/**
 * GET /api/v1/content/settings — public app configuration: contact channels,
 * trust statistics, supported currencies & languages, feature flags.
 * Nothing secret leaves this endpoint.
 */
export const GET = handleApi(async (request: Request) => {
  const rows = await prisma.siteSetting
    .findMany({ where: { key: { in: ['brand.name', 'contact.whatsapp', 'contact.telegram', 'contact.email', 'stats.years', 'stats.volume'] } } })
    .catch(() => []);
  const s = new Map(rows.map((r) => [r.key, r.value]));

  const data = {
    brand: { name: s.get('brand.name') || siteConfig.name },
    contact: {
      whatsapp: s.get('contact.whatsapp') || siteConfig.contact.whatsapp,
      telegram: s.get('contact.telegram') || siteConfig.contact.telegram,
      email: s.get('contact.email') || siteConfig.contact.email,
    },
    stats: {
      yearsExperience: s.get('stats.years') || String(homeStats.find((x) => x.labelKey === 'yearsExperience')?.to ?? 7),
      transactionVolume: s.get('stats.volume') || '$1B+',
      network: 'global',
      routes: 'multiple',
    },
    currencies: [
      ...currencies.map((c) => apiCurrency(c.code)),
      ...CRYPTO_CODES.map((code) => apiCurrency(code)).filter((c) => currencyMeta(c.code) != null),
    ],
    languages: locales.map((l) => ({
      code: l,
      label: localeMeta[l].label,
      native: localeMeta[l].native,
      dir: localeMeta[l].dir,
    })),
    features: {
      pushNotifications: process.env.MOBILE_PUSH_ENABLED === 'true',
    },
  };

  return apiJsonCached(request, data, { maxAge: 60 });
});

export const OPTIONS = handleOptions;
