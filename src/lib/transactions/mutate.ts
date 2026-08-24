import 'server-only';
import { revalidatePath, revalidateTag } from 'next/cache';
import { prisma } from '@/lib/db';
import { logAudit } from '@/lib/audit';
import { TRANSACTIONS_TAG } from './service';

/**
 * Shared transaction mutation core — used by both the admin server actions
 * (cookie session) and the mobile admin API (bearer token). Callers handle
 * authentication; validation, refs, audit and cache invalidation live here.
 */

const ISO2 = /^[A-Z]{2}$/;

export const TX_STATUSES = ['COMPLETED', 'PROCESSING', 'PENDING', 'CANCELLED'] as const;
export const TX_AMOUNT_MODES = ['EXACT', 'ROUNDED', 'RANGE', 'HIDDEN'] as const;

export interface TransactionInput {
  originCountry: string;
  originCity?: string | null;
  destinationCountry: string;
  destinationCity?: string | null;
  currency: string;
  displayAmount: number;
  amountDisplayMode: (typeof TX_AMOUNT_MODES)[number];
  amountRangeMin?: number | null;
  amountRangeMax?: number | null;
  serviceKey: string;
  paymentMethod?: string | null;
  status: (typeof TX_STATUSES)[number];
  occurredOn: string;
  note?: string | null;
  isPublished: boolean;
  isFeatured: boolean;
  order?: number;
}

export interface MutateResult {
  ok: boolean;
  error?: string;
  id?: string;
  publicRef?: string;
}

export function validateTransactionInput(input: Partial<TransactionInput>): string | null {
  if (input.originCountry !== undefined && !ISO2.test(input.originCountry.toUpperCase())) return 'Invalid origin country.';
  if (input.destinationCountry !== undefined && !ISO2.test(input.destinationCountry.toUpperCase())) return 'Invalid destination country.';
  if (input.displayAmount !== undefined && !(input.displayAmount > 0)) return 'Amount must be positive.';
  if (input.status !== undefined && !TX_STATUSES.includes(input.status)) return 'Invalid status.';
  if (input.amountDisplayMode !== undefined && !TX_AMOUNT_MODES.includes(input.amountDisplayMode)) return 'Invalid amount mode.';
  return null;
}

/** Invalidate everywhere transactions are read (public tag + admin + pages). */
export function revalidateTransactions() {
  revalidateTag(TRANSACTIONS_TAG);
  revalidatePath('/admin/transactions');
  revalidatePath('/', 'layout');
}

const REF_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // no ambiguous chars

export async function genPublicRef(date: Date): Promise<string> {
  const { randomInt } = await import('crypto');
  const stamp = `${String(date.getFullYear()).slice(2)}${String(date.getMonth() + 1).padStart(2, '0')}${String(date.getDate()).padStart(2, '0')}`;
  for (let i = 0; i < 6; i++) {
    let s = '';
    for (let j = 0; j < 4; j++) s += REF_ALPHABET[randomInt(0, REF_ALPHABET.length)];
    const ref = `AYN-${stamp}-${s}`;
    const exists = await prisma.transaction.findUnique({ where: { publicRef: ref }, select: { id: true } });
    if (!exists) return ref;
  }
  return `AYN-${stamp}-${Date.now().toString(36).slice(-4).toUpperCase()}`;
}

interface Actor {
  adminId: string;
}

export async function createTransactionRecord(input: TransactionInput, actor: Actor): Promise<MutateResult> {
  const err = validateTransactionInput(input);
  if (err) return { ok: false, error: err };

  const occurredOn = new Date(input.occurredOn);
  if (isNaN(occurredOn.getTime())) return { ok: false, error: 'Invalid date.' };
  const publicRef = await genPublicRef(occurredOn);

  const tx = await prisma.transaction.create({
    data: {
      publicRef,
      originCountry: input.originCountry.toUpperCase(),
      originCity: input.originCity || null,
      destinationCountry: input.destinationCountry.toUpperCase(),
      destinationCity: input.destinationCity || null,
      currency: input.currency.toUpperCase().slice(0, 8),
      displayAmount: input.displayAmount,
      amountDisplayMode: input.amountDisplayMode,
      amountRangeMin: input.amountRangeMin ?? null,
      amountRangeMax: input.amountRangeMax ?? null,
      serviceKey: input.serviceKey,
      paymentMethod: input.paymentMethod || null,
      status: input.status,
      occurredOn,
      note: input.note || null,
      isDemo: false,
      isPublished: input.isPublished,
      isFeatured: input.isFeatured,
      order: input.order ?? 0,
    },
  });
  await logAudit({ adminId: actor.adminId, action: 'transaction.create', entityType: 'Transaction', entityId: tx.id });
  revalidateTransactions();
  return { ok: true, id: tx.id, publicRef };
}

export async function updateTransactionRecord(
  id: string,
  input: Partial<TransactionInput>,
  actor: Actor,
): Promise<MutateResult> {
  const err = validateTransactionInput(input);
  if (err) return { ok: false, error: err };

  const data: Record<string, unknown> = {};
  const keys: (keyof TransactionInput)[] = [
    'originCity', 'destinationCity', 'currency', 'displayAmount', 'amountDisplayMode',
    'amountRangeMin', 'amountRangeMax', 'serviceKey', 'paymentMethod', 'status', 'note', 'isPublished', 'isFeatured', 'order',
  ];
  for (const k of keys) if (input[k] !== undefined) data[k] = input[k];
  if (input.originCountry !== undefined) data.originCountry = input.originCountry.toUpperCase();
  if (input.destinationCountry !== undefined) data.destinationCountry = input.destinationCountry.toUpperCase();
  if (input.occurredOn !== undefined) {
    const d = new Date(input.occurredOn);
    if (isNaN(d.getTime())) return { ok: false, error: 'Invalid date.' };
    data.occurredOn = d;
  }
  if (input.currency !== undefined) data.currency = String(input.currency).toUpperCase().slice(0, 8);

  try {
    await prisma.transaction.update({ where: { id }, data });
  } catch {
    return { ok: false, error: 'Transaction not found.' };
  }
  await logAudit({ adminId: actor.adminId, action: 'transaction.update', entityType: 'Transaction', entityId: id });
  revalidateTransactions();
  return { ok: true, id };
}

export async function setTransactionPublished(id: string, published: boolean, actor: Actor): Promise<MutateResult> {
  try {
    await prisma.transaction.update({ where: { id }, data: { isPublished: published } });
  } catch {
    return { ok: false, error: 'Not found.' };
  }
  await logAudit({
    adminId: actor.adminId,
    action: published ? 'transaction.publish' : 'transaction.unpublish',
    entityType: 'Transaction',
    entityId: id,
  });
  revalidateTransactions();
  return { ok: true, id };
}

export async function setTransactionFeatured(id: string, featured: boolean, actor: Actor): Promise<MutateResult> {
  try {
    await prisma.transaction.update({ where: { id }, data: { isFeatured: featured } });
  } catch {
    return { ok: false, error: 'Not found.' };
  }
  await logAudit({ adminId: actor.adminId, action: 'transaction.feature', entityType: 'Transaction', entityId: id });
  revalidateTransactions();
  return { ok: true, id };
}

export async function softDeleteTransaction(id: string, actor: Actor): Promise<MutateResult> {
  try {
    await prisma.transaction.update({
      where: { id },
      data: { deletedAt: new Date(), isPublished: false, isFeatured: false },
    });
  } catch {
    return { ok: false, error: 'Not found.' };
  }
  await logAudit({ adminId: actor.adminId, action: 'transaction.delete', entityType: 'Transaction', entityId: id });
  revalidateTransactions();
  return { ok: true, id };
}
