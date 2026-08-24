import { prisma } from '@/lib/db';
import { handleApi, handleOptions, apiJson } from '@/lib/api/respond';
import { notFound } from '@/lib/api/errors';
import { requireApiAdmin } from '@/lib/api/auth';
import { serializeRateHistory } from '@/lib/api/serialize';

export const dynamic = 'force-dynamic';

/** GET /api/v1/admin/rates/:id/history — recent history entries (newest first). */
export const GET = handleApi(
  async (request: Request, { params }: { params: { id: string } }) => {
    await requireApiAdmin(request);
    const rate = await prisma.exchangeRate.findUnique({ where: { id: params.id }, select: { id: true } });
    if (!rate) throw notFound('Rate not found.');

    const url = new URL(request.url);
    const take = Math.min(200, Math.max(1, Number(url.searchParams.get('limit')) || 50));
    const rows = await prisma.rateHistory.findMany({
      where: { rateId: params.id },
      orderBy: { recordedAt: 'desc' },
      take,
    });
    return apiJson(rows.map(serializeRateHistory), { meta: { count: rows.length } });
  },
);

export const OPTIONS = handleOptions;
