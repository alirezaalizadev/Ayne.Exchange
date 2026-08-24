import { prisma } from '@/lib/db';
import { handleApi, handleOptions, apiJson, readJson } from '@/lib/api/respond';
import { badRequest, notFound } from '@/lib/api/errors';
import { requireApiAdmin } from '@/lib/api/auth';
import { serializeAdminRate } from '@/lib/api/serialize';
import { updateRateRecord, archiveRateRecord } from '@/lib/rates/mutate';
import { parseRateBody } from '@/lib/api/rate-parse';

export const dynamic = 'force-dynamic';

type Ctx = { params: { id: string } };

/** GET /api/v1/admin/rates/:id */
export const GET = handleApi(async (request: Request, { params }: Ctx) => {
  await requireApiAdmin(request);
  const row = await prisma.exchangeRate.findFirst({ where: { id: params.id, deletedAt: null } });
  if (!row) throw notFound('Rate not found.');
  return apiJson(serializeAdminRate(row));
});

/** PATCH /api/v1/admin/rates/:id — partial update (audited, history recorded). */
export const PATCH = handleApi(async (request: Request, { params }: Ctx) => {
  const admin = await requireApiAdmin(request);
  const body = (await readJson(request)) as Record<string, unknown>;
  const input = parseRateBody(body, true);
  delete input.base; // pair identity is immutable via PATCH
  delete input.quote;
  delete input.sourceLabel;

  const result = await updateRateRecord(params.id, input, { adminId: admin.id, email: admin.email });
  if (!result.ok) {
    if (result.error === 'Rate not found.') throw notFound(result.error);
    throw badRequest(result.error);
  }
  const row = await prisma.exchangeRate.findUnique({ where: { id: params.id } });
  return apiJson(row ? serializeAdminRate(row) : { id: params.id });
});

/** DELETE /api/v1/admin/rates/:id — archive (soft delete, audited). */
export const DELETE = handleApi(async (request: Request, { params }: Ctx) => {
  const admin = await requireApiAdmin(request);
  const result = await archiveRateRecord(params.id, { adminId: admin.id, email: admin.email });
  if (!result.ok) throw notFound(result.error);
  return apiJson({ archived: true, id: params.id });
});

export const OPTIONS = handleOptions;
