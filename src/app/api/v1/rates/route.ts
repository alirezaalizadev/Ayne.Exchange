import { prisma } from '@/lib/db';
import { handleApi, handleOptions, apiJsonCached } from '@/lib/api/respond';
import { serializeRate } from '@/lib/api/serialize';

export const dynamic = 'force-dynamic';

/**
 * GET /api/v1/rates — all enabled pairs with currency metadata.
 * Conditional GET: ETag + Last-Modified; a rate change in admin produces a new
 * `updatedAt`, therefore a new ETag — clients revalidate cheaply with 304s.
 */
export const GET = handleApi(async (request: Request) => {
  const rows = await prisma.exchangeRate.findMany({
    where: { isPublished: true, deletedAt: null },
    orderBy: [{ order: 'asc' }, { base: 'asc' }, { quote: 'asc' }],
  });
  const rates = rows.map(serializeRate);
  const lastModified = rows.length
    ? new Date(Math.max(...rows.map((r) => r.updatedAt.getTime())))
    : null;
  return apiJsonCached(request, rates, {
    lastModified,
    maxAge: 30,
    meta: { count: rates.length, lastUpdatedAt: lastModified?.toISOString() ?? null },
  });
});

export const OPTIONS = handleOptions;
