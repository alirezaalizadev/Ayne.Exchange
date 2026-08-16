'use server';

import { revalidatePath, revalidateTag } from 'next/cache';
import { prisma } from '@/lib/db';
import { requireAdmin } from '@/lib/auth/guard';
import { verifyCsrf } from '@/lib/auth/csrf';
import { logAudit } from '@/lib/audit';
import { TRANSACTIONS_TAG } from '@/lib/transactions/service';

export interface ActionResult {
  ok: boolean;
  error?: string;
}

const ISO2 = /^[A-Z]{2}$/;

/** Invalidate everywhere transactions are read (public tag + admin + pages). */
function revalidateTransactions() {
  revalidateTag(TRANSACTIONS_TAG);
  revalidatePath('/admin/transactions');
  revalidatePath('/', 'layout');
}

// ------------------------------ Transactions -------------------------------

const STATUSES = ['COMPLETED', 'PROCESSING', 'PENDING', 'CANCELLED'] as const;
const AMOUNT_MODES = ['EXACT', 'ROUNDED', 'RANGE', 'HIDDEN'] as const;

export interface TransactionInput {
  originCountry: string;
  originCity?: string | null;
  destinationCountry: string;
  destinationCity?: string | null;
  currency: string;
  displayAmount: number;
  amountDisplayMode: (typeof AMOUNT_MODES)[number];
  amountRangeMin?: number | null;
  amountRangeMax?: number | null;
  serviceKey: string;
  paymentMethod?: string | null;
  status: (typeof STATUSES)[number];
  occurredOn: string;
  note?: string | null;
  isPublished: boolean;
  isFeatured: boolean;
  order?: number;
}

function validateTx(input: Partial<TransactionInput>): string | null {
  if (input.originCountry !== undefined && !ISO2.test(input.originCountry.toUpperCase())) return 'Invalid origin country.';
  if (input.destinationCountry !== undefined && !ISO2.test(input.destinationCountry.toUpperCase())) return 'Invalid destination country.';
  if (input.displayAmount !== undefined && !(input.displayAmount > 0)) return 'Amount must be positive.';
  if (input.status !== undefined && !STATUSES.includes(input.status)) return 'Invalid status.';
  if (input.amountDisplayMode !== undefined && !AMOUNT_MODES.includes(input.amountDisplayMode)) return 'Invalid amount mode.';
  return null;
}

const REF_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // no ambiguous chars

async function genPublicRef(date: Date): Promise<string> {
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

export async function createTransaction(input: TransactionInput & { csrf: string }): Promise<ActionResult> {
  const admin = await requireAdmin();
  if (!verifyCsrf(input.csrf)) return { ok: false, error: 'Invalid session token.' };
  const err = validateTx(input);
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
  await logAudit({ adminId: admin.id, action: 'transaction.create', entityType: 'Transaction', entityId: tx.id });
  revalidateTransactions();
  return { ok: true };
}

export async function updateTransaction(
  input: Partial<TransactionInput> & { id: string; csrf: string },
): Promise<ActionResult> {
  const admin = await requireAdmin();
  if (!verifyCsrf(input.csrf)) return { ok: false, error: 'Invalid session token.' };
  const err = validateTx(input);
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

  try {
    await prisma.transaction.update({ where: { id: input.id }, data });
  } catch {
    return { ok: false, error: 'Transaction not found.' };
  }
  await logAudit({ adminId: admin.id, action: 'transaction.update', entityType: 'Transaction', entityId: input.id });
  revalidateTransactions();
  return { ok: true };
}

export async function toggleTransactionPublish(input: { id: string; csrf: string }): Promise<ActionResult> {
  const admin = await requireAdmin();
  if (!verifyCsrf(input.csrf)) return { ok: false, error: 'Invalid session token.' };
  const tx = await prisma.transaction.findUnique({ where: { id: input.id } });
  if (!tx) return { ok: false, error: 'Not found.' };
  await prisma.transaction.update({ where: { id: input.id }, data: { isPublished: !tx.isPublished } });
  await logAudit({
    adminId: admin.id,
    action: tx.isPublished ? 'transaction.unpublish' : 'transaction.publish',
    entityType: 'Transaction',
    entityId: tx.id,
  });
  revalidateTransactions();
  return { ok: true };
}

export async function toggleTransactionFeatured(input: { id: string; csrf: string }): Promise<ActionResult> {
  const admin = await requireAdmin();
  if (!verifyCsrf(input.csrf)) return { ok: false, error: 'Invalid session token.' };
  const tx = await prisma.transaction.findUnique({ where: { id: input.id } });
  if (!tx) return { ok: false, error: 'Not found.' };
  await prisma.transaction.update({ where: { id: input.id }, data: { isFeatured: !tx.isFeatured } });
  await logAudit({ adminId: admin.id, action: 'transaction.feature', entityType: 'Transaction', entityId: tx.id });
  revalidateTransactions();
  return { ok: true };
}

export async function deleteTransaction(input: { id: string; csrf: string }): Promise<ActionResult> {
  const admin = await requireAdmin();
  if (!verifyCsrf(input.csrf)) return { ok: false, error: 'Invalid session token.' };
  await prisma.transaction.update({
    where: { id: input.id },
    data: { deletedAt: new Date(), isPublished: false, isFeatured: false },
  });
  await logAudit({ adminId: admin.id, action: 'transaction.delete', entityType: 'Transaction', entityId: input.id });
  revalidateTransactions();
  return { ok: true };
}
