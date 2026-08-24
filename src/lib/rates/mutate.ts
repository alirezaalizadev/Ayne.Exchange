import 'server-only';
import { revalidatePath, revalidateTag } from 'next/cache';
import type { Prisma } from '@prisma/client';
import { prisma } from '@/lib/db';
import { logAudit } from '@/lib/audit';
import { RATES_TAG, computeDisplayRate } from './service';

/**
 * Shared rate mutation core — the ONE implementation used by both the admin
 * server actions (cookie session) and the mobile admin API (bearer token).
 * Callers are responsible for authentication; everything else (validation,
 * history, audit, cache invalidation) happens here.
 */

export const RATE_MODES = ['AUTO', 'MANUAL', 'ADJUSTED'] as const;
export type RateMode = (typeof RATE_MODES)[number];

const CODE = /^[A-Z]{2,8}$/;

export interface RateInput {
  base: string;
  quote: string;
  sourceLabel: string;
  mode: RateMode;
  manualRate: number | null;
  apiRate: number | null;
  buyRate: number | null;
  sellRate: number | null;
  spreadPct: number | null;
  displayLabel: string | null;
  displayDecimals: number | null;
  note: string | null;
  isPublished: boolean;
  isFeatured: boolean;
  order: number;
}

export interface MutateResult {
  ok: boolean;
  error?: string;
  id?: string;
}

export function validateRateInput(input: Partial<RateInput>): string | null {
  if (input.base !== undefined && !CODE.test(input.base)) return 'Base code must be 2–8 uppercase letters.';
  if (input.quote !== undefined && !CODE.test(input.quote)) return 'Quote code must be 2–8 uppercase letters.';
  if (input.base && input.quote && input.base === input.quote) return 'Base and quote must differ.';
  for (const k of ['manualRate', 'apiRate', 'buyRate', 'sellRate'] as const) {
    const v = input[k];
    if (v != null && (!(typeof v === 'number') || v <= 0)) return 'Rates must be positive numbers.';
  }
  if (input.mode && !RATE_MODES.includes(input.mode)) return 'Invalid mode.';
  return null;
}

/** Invalidate every surface that reads rates: public tag + admin + public pages. */
export function revalidateRates() {
  revalidateTag(RATES_TAG);
  revalidatePath('/admin/rates');
  revalidatePath('/', 'layout'); // homepage ticker/hero/network + /rates + /calculator
}

export async function recordRateHistory(rateId: string, changedBy: string) {
  const r = await prisma.exchangeRate.findUnique({ where: { id: rateId } });
  if (!r) return;
  const value = computeDisplayRate(r);
  if (value == null) return;
  await prisma.rateHistory
    .create({
      data: {
        rateId,
        value,
        buyRate: r.buyRate,
        sellRate: r.sellRate,
        mode: r.mode,
        source: r.sourceLabel,
        changedBy,
      },
    })
    .catch(() => {});
}

interface Actor {
  adminId: string;
  email: string;
}

export async function createRateRecord(input: RateInput, actor: Actor): Promise<MutateResult> {
  const base = input.base.toUpperCase();
  const quote = input.quote.toUpperCase();
  const err = validateRateInput({ ...input, base, quote });
  if (err) return { ok: false, error: err };

  const exists = await prisma.exchangeRate.findFirst({
    where: { base, quote, sourceLabel: input.sourceLabel, deletedAt: null },
  });
  if (exists) return { ok: false, error: 'This pair + source already exists.' };

  const created = await prisma.exchangeRate.create({
    data: {
      base,
      quote,
      sourceLabel: input.sourceLabel || 'market',
      mode: input.mode,
      manualRate: input.manualRate,
      apiRate: input.apiRate,
      buyRate: input.buyRate,
      sellRate: input.sellRate,
      spreadPct: input.spreadPct,
      displayLabel: input.displayLabel,
      displayDecimals: input.displayDecimals,
      note: input.note,
      isPublished: input.isPublished,
      isFeatured: input.isFeatured,
      order: input.order || 0,
      provider: input.mode === 'MANUAL' ? 'manual' : 'admin',
    },
  });
  await recordRateHistory(created.id, actor.email);
  await logAudit({ adminId: actor.adminId, action: 'rate.create', entityType: 'ExchangeRate', entityId: created.id, metadata: { base, quote } });
  revalidateRates();
  return { ok: true, id: created.id };
}

export async function updateRateRecord(
  id: string,
  input: Partial<RateInput>,
  actor: Actor,
): Promise<MutateResult> {
  const err = validateRateInput(input);
  if (err) return { ok: false, error: err };

  const data: Prisma.ExchangeRateUpdateInput = {};
  const assign = <K extends keyof RateInput>(k: K) => {
    if (input[k] !== undefined) (data as Record<string, unknown>)[k] = input[k];
  };
  (['mode', 'manualRate', 'apiRate', 'buyRate', 'sellRate', 'spreadPct', 'displayLabel', 'displayDecimals', 'note', 'isPublished', 'isFeatured', 'order'] as const).forEach(assign);

  try {
    await prisma.exchangeRate.update({ where: { id }, data });
  } catch {
    return { ok: false, error: 'Rate not found.' };
  }
  await recordRateHistory(id, actor.email);
  await logAudit({ adminId: actor.adminId, action: 'rate.update', entityType: 'ExchangeRate', entityId: id });
  revalidateRates();
  return { ok: true, id };
}

export async function archiveRateRecord(id: string, actor: Actor): Promise<MutateResult> {
  try {
    await prisma.exchangeRate.update({
      where: { id },
      data: { deletedAt: new Date(), isPublished: false, isFeatured: false },
    });
  } catch {
    return { ok: false, error: 'Rate not found.' };
  }
  await logAudit({ adminId: actor.adminId, action: 'rate.archive', entityType: 'ExchangeRate', entityId: id });
  revalidateRates();
  return { ok: true, id };
}

export interface BulkRateItem {
  id: string;
  manualRate?: number | null;
  buyRate?: number | null;
  sellRate?: number | null;
}

/** Fast multi-row buy/sell/manual update inside one DB transaction. */
export async function bulkUpdateRateRecords(items: BulkRateItem[], actor: Actor): Promise<MutateResult> {
  for (const it of items) {
    for (const k of ['manualRate', 'buyRate', 'sellRate'] as const) {
      const v = it[k];
      if (v != null && (typeof v !== 'number' || v <= 0)) return { ok: false, error: `Invalid value for ${it.id}.` };
    }
  }

  try {
    await prisma.$transaction(
      items.map((it) =>
        prisma.exchangeRate.update({
          where: { id: it.id },
          data: {
            ...(it.manualRate !== undefined ? { manualRate: it.manualRate } : {}),
            ...(it.buyRate !== undefined ? { buyRate: it.buyRate } : {}),
            ...(it.sellRate !== undefined ? { sellRate: it.sellRate } : {}),
          },
        }),
      ),
    );
  } catch {
    return { ok: false, error: 'Bulk update failed — no changes were saved.' };
  }

  await Promise.all(items.map((it) => recordRateHistory(it.id, actor.email)));
  await logAudit({ adminId: actor.adminId, action: 'rate.bulk_update', metadata: { count: items.length } });
  revalidateRates();
  return { ok: true };
}
