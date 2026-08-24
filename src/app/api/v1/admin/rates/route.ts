import { prisma } from '@/lib/db';
import { handleApi, handleOptions, apiJson, readJson } from '@/lib/api/respond';
import { badRequest } from '@/lib/api/errors';
import { requireApiAdmin } from '@/lib/api/auth';
import { serializeAdminRate } from '@/lib/api/serialize';
import { parseRateBody } from '@/lib/api/rate-parse';
import { createRateRecord, type RateInput } from '@/lib/rates/mutate';

export const dynamic = 'force-dynamic';

/** GET /api/v1/admin/rates — all non-archived rates (incl. unpublished). */
export const GET = handleApi(async (request: Request) => {
  await requireApiAdmin(request);
  const rows = await prisma.exchangeRate.findMany({
    where: { deletedAt: null },
    orderBy: [{ order: 'asc' }, { base: 'asc' }, { quote: 'asc' }],
  });
  return apiJson(rows.map(serializeAdminRate), { meta: { count: rows.length } });
});

/** POST /api/v1/admin/rates — create a rate. */
export const POST = handleApi(async (request: Request) => {
  const admin = await requireApiAdmin(request);
  const body = (await readJson(request)) as Record<string, unknown>;
  const input = parseRateBody(body, false) as RateInput;

  const result = await createRateRecord(input, { adminId: admin.id, email: admin.email });
  if (!result.ok) throw badRequest(result.error);

  const created = await prisma.exchangeRate.findUnique({ where: { id: result.id! } });
  return apiJson(created ? serializeAdminRate(created) : { id: result.id }, { status: 201 });
});

export const OPTIONS = handleOptions;
