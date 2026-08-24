import { handleApi, handleOptions, apiJson, readJson } from '@/lib/api/respond';
import { badRequest } from '@/lib/api/errors';
import { requireApiAdmin } from '@/lib/api/auth';
import { bulkUpdateRateRecords, type BulkRateItem } from '@/lib/rates/mutate';

export const dynamic = 'force-dynamic';

function num(v: unknown): number | null | undefined {
  if (v === undefined) return undefined;
  if (v === null || v === '') return null;
  const n = typeof v === 'string' ? Number(v) : (v as number);
  return typeof n === 'number' && isFinite(n) ? n : null;
}

/**
 * PATCH /api/v1/admin/rates/bulk — { items: [{ id, manualRate?, buyRate?, sellRate? }] }
 * One DB transaction; history + audit recorded, caches invalidated.
 */
export const PATCH = handleApi(async (request: Request) => {
  const admin = await requireApiAdmin(request);
  const body = (await readJson(request)) as { items?: unknown };
  if (!Array.isArray(body.items) || body.items.length === 0) throw badRequest('items[] is required.');
  if (body.items.length > 200) throw badRequest('Too many items (max 200).');

  const items: BulkRateItem[] = body.items.map((raw) => {
    const it = raw as Record<string, unknown>;
    if (typeof it.id !== 'string' || !it.id) throw badRequest('Every item needs an id.');
    return {
      id: it.id,
      manualRate: num(it.manualRate),
      buyRate: num(it.buyRate),
      sellRate: num(it.sellRate),
    };
  });

  const result = await bulkUpdateRateRecords(items, { adminId: admin.id, email: admin.email });
  if (!result.ok) throw badRequest(result.error);
  return apiJson({ updated: items.length });
});

export const OPTIONS = handleOptions;
