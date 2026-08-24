import type { Prisma, QuoteStatus } from '@prisma/client';
import { prisma } from '@/lib/db';
import { handleApi, handleOptions, apiJson, pagination } from '@/lib/api/respond';
import { requireApiAdmin } from '@/lib/api/auth';
import { serializeAdminQuote } from '@/lib/api/serialize';

export const dynamic = 'force-dynamic';

const STATUSES: QuoteStatus[] = ['NEW', 'REVIEWING', 'CONTACTED', 'QUOTED', 'COMPLETED', 'REJECTED', 'ARCHIVED'];

/**
 * GET /api/v1/admin/quotes — quote requests with search / filter / pagination.
 * Query: page, pageSize, status, service, search (reference or contact).
 */
export const GET = handleApi(async (request: Request) => {
  await requireApiAdmin(request);
  const url = new URL(request.url);
  const { page, pageSize, skip, take } = pagination(url);

  const where: Prisma.QuoteRequestWhereInput = { deletedAt: null };
  const status = url.searchParams.get('status');
  if (status && STATUSES.includes(status as QuoteStatus)) where.status = status as QuoteStatus;
  const service = url.searchParams.get('service');
  if (service) where.serviceKey = service.slice(0, 32);
  const search = url.searchParams.get('search');
  if (search) {
    const q = search.slice(0, 120);
    where.OR = [{ reference: { contains: q } }, { contactValue: { contains: q } }];
  }

  const [total, rows, statusCounts] = await Promise.all([
    prisma.quoteRequest.count({ where }),
    prisma.quoteRequest.findMany({ where, orderBy: { createdAt: 'desc' }, skip, take }),
    prisma.quoteRequest.groupBy({ by: ['status'], where: { deletedAt: null }, _count: true }),
  ]);

  return apiJson(rows.map(serializeAdminQuote), {
    meta: {
      page,
      pageSize,
      total,
      totalPages: Math.max(1, Math.ceil(total / pageSize)),
      statusCounts: Object.fromEntries(statusCounts.map((s) => [s.status, s._count])),
    },
  });
});

export const OPTIONS = handleOptions;
