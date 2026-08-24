import { prisma } from '@/lib/db';
import { handleApi, handleOptions, apiJson, readJson } from '@/lib/api/respond';
import { badRequest, notFound } from '@/lib/api/errors';
import { requireApiAdmin } from '@/lib/api/auth';
import { serializeAdminTransaction } from '@/lib/api/serialize';
import { parseTransactionBody } from '@/lib/api/transaction-parse';
import {
  updateTransactionRecord,
  setTransactionPublished,
  setTransactionFeatured,
  softDeleteTransaction,
} from '@/lib/transactions/mutate';

export const dynamic = 'force-dynamic';

type Ctx = { params: { id: string } };

/** GET /api/v1/admin/transactions/:id */
export const GET = handleApi(async (request: Request, { params }: Ctx) => {
  await requireApiAdmin(request);
  const row = await prisma.transaction.findFirst({ where: { id: params.id, deletedAt: null } });
  if (!row) throw notFound('Transaction not found.');
  return apiJson(serializeAdminTransaction(row));
});

/**
 * PATCH /api/v1/admin/transactions/:id — partial update. `isPublished` /
 * `isFeatured` route through the dedicated publish/feature paths so the audit
 * log reads the same as the web admin.
 */
export const PATCH = handleApi(async (request: Request, { params }: Ctx) => {
  const admin = await requireApiAdmin(request);
  const body = (await readJson(request)) as Record<string, unknown>;
  const actor = { adminId: admin.id };

  const exists = await prisma.transaction.findFirst({ where: { id: params.id, deletedAt: null }, select: { id: true } });
  if (!exists) throw notFound('Transaction not found.');

  const input = parseTransactionBody(body, true);
  const { isPublished, isFeatured, ...rest } = input;

  if (Object.keys(rest).length > 0) {
    const result = await updateTransactionRecord(params.id, rest, actor);
    if (!result.ok) throw badRequest(result.error);
  }
  if (isPublished !== undefined) {
    const result = await setTransactionPublished(params.id, isPublished, actor);
    if (!result.ok) throw badRequest(result.error);
  }
  if (isFeatured !== undefined) {
    const result = await setTransactionFeatured(params.id, isFeatured, actor);
    if (!result.ok) throw badRequest(result.error);
  }

  const row = await prisma.transaction.findUnique({ where: { id: params.id } });
  return apiJson(row ? serializeAdminTransaction(row) : { id: params.id });
});

/** DELETE /api/v1/admin/transactions/:id — soft delete (audited). */
export const DELETE = handleApi(async (request: Request, { params }: Ctx) => {
  const admin = await requireApiAdmin(request);
  const result = await softDeleteTransaction(params.id, { adminId: admin.id });
  if (!result.ok) throw notFound(result.error);
  return apiJson({ deleted: true, id: params.id });
});

export const OPTIONS = handleOptions;
