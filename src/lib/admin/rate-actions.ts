'use server';

import { requireAdmin } from '@/lib/auth/guard';
import { verifyCsrf } from '@/lib/auth/csrf';
import {
  createRateRecord,
  updateRateRecord,
  archiveRateRecord,
  bulkUpdateRateRecords,
  type RateInput,
  type BulkRateItem,
} from '@/lib/rates/mutate';

/**
 * Web admin server actions for rates. Thin wrappers: cookie auth + CSRF here,
 * business logic (validation, history, audit, cache invalidation) lives in
 * src/lib/rates/mutate.ts — shared with the mobile admin API.
 */

export interface ActionResult {
  ok: boolean;
  error?: string;
  id?: string;
}

export async function createRate(input: RateInput & { csrf: string }): Promise<ActionResult> {
  const admin = await requireAdmin();
  if (!verifyCsrf(input.csrf)) return { ok: false, error: 'Invalid session token.' };
  return createRateRecord(input, { adminId: admin.id, email: admin.email });
}

export async function updateRate(input: Partial<RateInput> & { id: string; csrf: string }): Promise<ActionResult> {
  const admin = await requireAdmin();
  if (!verifyCsrf(input.csrf)) return { ok: false, error: 'Invalid session token.' };
  const { id, csrf: _csrf, ...rest } = input;
  return updateRateRecord(id, rest, { adminId: admin.id, email: admin.email });
}

export async function archiveRate(input: { id: string; csrf: string }): Promise<ActionResult> {
  const admin = await requireAdmin();
  if (!verifyCsrf(input.csrf)) return { ok: false, error: 'Invalid session token.' };
  return archiveRateRecord(input.id, { adminId: admin.id, email: admin.email });
}

/** Fast multi-row buy/sell/manual update inside one DB transaction. */
export async function bulkUpdateRates(input: {
  items: BulkRateItem[];
  csrf: string;
}): Promise<ActionResult> {
  const admin = await requireAdmin();
  if (!verifyCsrf(input.csrf)) return { ok: false, error: 'Invalid session token.' };
  return bulkUpdateRateRecords(input.items, { adminId: admin.id, email: admin.email });
}
