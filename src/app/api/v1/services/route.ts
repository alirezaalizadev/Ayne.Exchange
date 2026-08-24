import { prisma } from '@/lib/db';
import { handleApi, handleOptions, apiJsonCached } from '@/lib/api/respond';
import { services } from '@/lib/config/services';
import { serviceCopy, normalizeLocale } from '@/lib/api/translations';

export const dynamic = 'force-dynamic';

/**
 * GET /api/v1/services?locale=en — canonical service catalog (static config +
 * DB publish flags + localized copy from the same catalogs the web renders).
 */
export const GET = handleApi(async (request: Request) => {
  const url = new URL(request.url);
  const locale = normalizeLocale(url.searchParams.get('locale'));

  const dbRows = await prisma.service.findMany().catch(() => []);
  const byKey = new Map(dbRows.map((s) => [s.key, s]));

  const list = services
    .filter((s) => byKey.get(s.key)?.isPublished !== false)
    .map((s) => {
      const copy = serviceCopy(s.key, locale);
      return {
        key: s.key,
        slug: s.slug,
        icon: s.icon,
        accent: s.accent,
        name: copy.name,
        summary: copy.summary,
        sortOrder: byKey.get(s.key)?.order ?? 0,
      };
    })
    .sort((a, b) => a.sortOrder - b.sortOrder);

  return apiJsonCached(request, list, { maxAge: 300, meta: { locale } });
});

export const OPTIONS = handleOptions;
