import { prisma } from '@/lib/db';
import { handleApi, handleOptions, apiJsonCached } from '@/lib/api/respond';
import { notFound } from '@/lib/api/errors';
import { serviceBySlug } from '@/lib/config/services';
import { serviceCopy, normalizeLocale } from '@/lib/api/translations';

export const dynamic = 'force-dynamic';

/** GET /api/v1/services/:slug?locale=en */
export const GET = handleApi(
  async (request: Request, { params }: { params: { slug: string } }) => {
    const url = new URL(request.url);
    const locale = normalizeLocale(url.searchParams.get('locale'));
    const def = serviceBySlug(decodeURIComponent(params.slug ?? ''));
    if (!def) throw notFound('Service not found.');

    const db = await prisma.service.findUnique({ where: { key: def.key } }).catch(() => null);
    if (db && !db.isPublished) throw notFound('Service not found.');

    const copy = serviceCopy(def.key, locale);
    return apiJsonCached(
      request,
      {
        key: def.key,
        slug: def.slug,
        icon: def.icon,
        accent: def.accent,
        name: copy.name,
        summary: copy.summary,
        sortOrder: db?.order ?? 0,
      },
      { maxAge: 300, meta: { locale } },
    );
  },
);

export const OPTIONS = handleOptions;
