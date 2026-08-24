import type { Prisma } from '@prisma/client';
import { prisma } from '@/lib/db';
import { handleApi, handleOptions, apiJson, readJson, pagination } from '@/lib/api/respond';
import { badRequest } from '@/lib/api/errors';
import { requireApiAdmin } from '@/lib/api/auth';
import { serializeAdminTransaction } from '@/lib/api/serialize';
import { parseTransactionBody } from '@/lib/api/transaction-parse';
import { createTransactionRecord, type TransactionInput } from '@/lib/transactions/mutate';

export const dynamic = 'force-dynamic';

/** GET /api/v1/admin/transactions — all non-deleted rows (incl. unpublished). */
export const GET = handleApi(async (request: Request) => {
  await requireApiAdmin(request);
  const url = new URL(request.url);
  const { page, pageSize, skip, take } = pagination(url, { pageSize: 30, maxPageSize: 100 });

  const where: Prisma.TransactionWhereInput = { deletedAt: null };
  const published = url.searchParams.get('published');
  if (published === 'true') where.isPublished = true;
  if (published === 'false') where.isPublished = false;
  const service = url.searchParams.get('service');
  if (service) where.serviceKey = service.slice(0, 32);

  const [total, rows] = await Promise.all([
    prisma.transaction.count({ where }),
    prisma.transaction.findMany({
      where,
      orderBy: [{ order: 'asc' }, { occurredOn: 'desc' }],
      skip,
      take,
    }),
  ]);

  return apiJson(rows.map(serializeAdminTransaction), {
    meta: { page, pageSize, total, totalPages: Math.max(1, Math.ceil(total / pageSize)) },
  });
});

/** POST /api/v1/admin/transactions — create (publicRef generated server-side). */
export const POST = handleApi(async (request: Request) => {
  const admin = await requireApiAdmin(request);
  const body = (await readJson(request)) as Record<string, unknown>;
  const input = parseTransactionBody(body, false) as TransactionInput;

  const result = await createTransactionRecord(input, { adminId: admin.id });
  if (!result.ok) throw badRequest(result.error);

  const created = await prisma.transaction.findUnique({ where: { id: result.id! } });
  return apiJson(created ? serializeAdminTransaction(created) : { id: result.id }, { status: 201 });
});

export const OPTIONS = handleOptions;
