import { prisma } from '@/lib/db';
import { handleApi, handleOptions, apiJsonCached } from '@/lib/api/respond';
import { notFound } from '@/lib/api/errors';
import { serializePublicTransaction } from '@/lib/api/serialize';

export const dynamic = 'force-dynamic';

/** GET /api/v1/transactions/:publicRef — one published transaction (AYN-…). */
export const GET = handleApi(
  async (request: Request, { params }: { params: { publicRef: string } }) => {
    const ref = decodeURIComponent(params.publicRef ?? '').toUpperCase().slice(0, 32);
    const tx = await prisma.transaction.findFirst({
      where: { publicRef: ref, isPublished: true, deletedAt: null },
    });
    if (!tx) throw notFound('Transaction not found.');
    return apiJsonCached(request, serializePublicTransaction(tx), { maxAge: 60 });
  },
);

export const OPTIONS = handleOptions;
