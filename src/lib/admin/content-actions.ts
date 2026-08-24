'use server';

import { prisma } from '@/lib/db';
import { requireAdmin } from '@/lib/auth/guard';
import { verifyCsrf } from '@/lib/auth/csrf';
import {
  createTransactionRecord,
  updateTransactionRecord,
  setTransactionPublished,
  setTransactionFeatured,
  softDeleteTransaction,
  type TransactionInput,
} from '@/lib/transactions/mutate';

/**
 * Web admin server actions for transactions. Thin wrappers: cookie auth + CSRF
 * here, business logic (validation, refs, audit, cache invalidation) lives in
 * src/lib/transactions/mutate.ts — shared with the mobile admin API.
 */

export interface ActionResult {
  ok: boolean;
  error?: string;
}

export type { TransactionInput };

export async function createTransaction(input: TransactionInput & { csrf: string }): Promise<ActionResult> {
  const admin = await requireAdmin();
  if (!verifyCsrf(input.csrf)) return { ok: false, error: 'Invalid session token.' };
  return createTransactionRecord(input, { adminId: admin.id });
}

export async function updateTransaction(
  input: Partial<TransactionInput> & { id: string; csrf: string },
): Promise<ActionResult> {
  const admin = await requireAdmin();
  if (!verifyCsrf(input.csrf)) return { ok: false, error: 'Invalid session token.' };
  const { id, csrf: _csrf, ...rest } = input;
  return updateTransactionRecord(id, rest, { adminId: admin.id });
}

export async function toggleTransactionPublish(input: { id: string; csrf: string }): Promise<ActionResult> {
  const admin = await requireAdmin();
  if (!verifyCsrf(input.csrf)) return { ok: false, error: 'Invalid session token.' };
  const tx = await prisma.transaction.findUnique({ where: { id: input.id } });
  if (!tx) return { ok: false, error: 'Not found.' };
  return setTransactionPublished(input.id, !tx.isPublished, { adminId: admin.id });
}

export async function toggleTransactionFeatured(input: { id: string; csrf: string }): Promise<ActionResult> {
  const admin = await requireAdmin();
  if (!verifyCsrf(input.csrf)) return { ok: false, error: 'Invalid session token.' };
  const tx = await prisma.transaction.findUnique({ where: { id: input.id } });
  if (!tx) return { ok: false, error: 'Not found.' };
  return setTransactionFeatured(input.id, !tx.isFeatured, { adminId: admin.id });
}

export async function deleteTransaction(input: { id: string; csrf: string }): Promise<ActionResult> {
  const admin = await requireAdmin();
  if (!verifyCsrf(input.csrf)) return { ok: false, error: 'Invalid session token.' };
  return softDeleteTransaction(input.id, { adminId: admin.id });
}
