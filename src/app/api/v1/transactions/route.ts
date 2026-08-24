import type { Prisma } from '@prisma/client';
import { prisma } from '@/lib/db';
import { handleApi, handleOptions, apiJsonCached, pagination } from '@/lib/api/respond';
import { serializePublicTransaction } from '@/lib/api/serialize';

export const dynamic = 'force-dynamic';

const ISO2 = /^[A-Z]{2}$/i;

/**
 * GET /api/v1/transactions — published transactions, paginated + filterable.
 * Query: page, pageSize, service, currency, origin, destination, dateFrom,
 * dateTo, ref, featured. Only public-safe fields; amounts masked server-side.
 */
export const GET = handleApi(async (request: Request) => {
  const url = new URL(request.url);
  const { page, pageSize, skip, take } = pagination(url);

  const where: Prisma.TransactionWhereInput = { isPublished: true, deletedAt: null };
  const service = url.searchParams.get('service');
  if (service) where.serviceKey = service.slice(0, 32);
  const currency = url.searchParams.get('currency');
  if (currency) where.currency = currency.toUpperCase().slice(0, 8);
  const origin = url.searchParams.get('origin');
  if (origin && ISO2.test(origin)) where.originCountry = origin.toUpperCase();
  const destination = url.searchParams.get('destination');
  if (destination && ISO2.test(destination)) where.destinationCountry = destination.toUpperCase();
  const ref = url.searchParams.get('ref');
  if (ref) where.publicRef = ref.toUpperCase().slice(0, 32);
  if (url.searchParams.get('featured') === 'true') where.isFeatured = true;

  const dateFrom = url.searchParams.get('dateFrom');
  const dateTo = url.searchParams.get('dateTo');
  if (dateFrom || dateTo) {
    const range: Prisma.DateTimeFilter = {};
    if (dateFrom && !isNaN(Date.parse(dateFrom))) range.gte = new Date(dateFrom);
    if (dateTo && !isNaN(Date.parse(dateTo))) range.lte = new Date(dateTo);
    where.occurredOn = range;
  }

  const [total, rows] = await Promise.all([
    prisma.transaction.count({ where }),
    prisma.transaction.findMany({
      where,
      orderBy: [{ order: 'asc' }, { occurredOn: 'desc' }],
      skip,
      take,
    }),
  ]);

  return apiJsonCached(request, rows.map(serializePublicTransaction), {
    maxAge: 30,
    meta: { page, pageSize, total, totalPages: Math.max(1, Math.ceil(total / pageSize)) },
  });
});

export const OPTIONS = handleOptions;
