'use server';

import { revalidatePath, revalidateTag } from 'next/cache';
import type { Prisma } from '@prisma/client';
import { prisma } from '@/lib/db';
import { requireAdmin } from '@/lib/auth/guard';
import { verifyCsrf } from '@/lib/auth/csrf';
import { logAudit } from '@/lib/audit';
import { RATES_TAG, computeDisplayRate } from '@/lib/rates/service';

export interface ActionResult {
  ok: boolean;
  error?: string;
  id?: string;
}

const CODE = /^[A-Z]{2,8}$/;
const MODES = ['AUTO', 'MANUAL', 'ADJUSTED'] as const;
type Mode = (typeof MODES)[number];

/** Invalidate every surface that reads rates: public tag + admin + public pages. */
function revalidateRates() {
  revalidateTag(RATES_TAG);
  revalidatePath('/admin/rates');
  revalidatePath('/', 'layout'); // homepage ticker/hero/network + /rates + /calculator
}

async function recordHistory(rateId: string, changedBy: string) {
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

interface RateInput {
  base: string;
  quote: string;
  sourceLabel: string;
  mode: Mode;
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

function validate(input: Partial<RateInput>): string | null {
  if (input.base !== undefined && !CODE.test(input.base)) return 'Base code must be 2–8 uppercase letters.';
  if (input.quote !== undefined && !CODE.test(input.quote)) return 'Quote code must be 2–8 uppercase letters.';
  if (input.base && input.quote && input.base === input.quote) return 'Base and quote must differ.';
  for (const k of ['manualRate', 'apiRate', 'buyRate', 'sellRate'] as const) {
    const v = input[k];
    if (v != null && (!(typeof v === 'number') || v <= 0)) return 'Rates must be positive numbers.';
  }
  if (input.mode && !MODES.includes(input.mode)) return 'Invalid mode.';
  return null;
}

export async function createRate(input: RateInput & { csrf: string }): Promise<ActionResult> {
  const admin = await requireAdmin();
  if (!verifyCsrf(input.csrf)) return { ok: false, error: 'Invalid session token.' };
  const base = input.base.toUpperCase();
  const quote = input.quote.toUpperCase();
  const err = validate({ ...input, base, quote });
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
  await recordHistory(created.id, admin.email);
  await logAudit({ adminId: admin.id, action: 'rate.create', entityType: 'ExchangeRate', entityId: created.id, metadata: { base, quote } });
  revalidateRates();
  return { ok: true, id: created.id };
}

export async function updateRate(input: Partial<RateInput> & { id: string; csrf: string }): Promise<ActionResult> {
  const admin = await requireAdmin();
  if (!verifyCsrf(input.csrf)) return { ok: false, error: 'Invalid session token.' };
  const err = validate(input);
  if (err) return { ok: false, error: err };

  const data: Prisma.ExchangeRateUpdateInput = {};
  const assign = <K extends keyof RateInput>(k: K) => {
    if (input[k] !== undefined) (data as Record<string, unknown>)[k] = input[k];
  };
  (['mode', 'manualRate', 'apiRate', 'buyRate', 'sellRate', 'spreadPct', 'displayLabel', 'displayDecimals', 'note', 'isPublished', 'isFeatured', 'order'] as const).forEach(assign);

  try {
    await prisma.exchangeRate.update({ where: { id: input.id }, data });
  } catch {
    return { ok: false, error: 'Rate not found.' };
  }
  await recordHistory(input.id, admin.email);
  await logAudit({ adminId: admin.id, action: 'rate.update', entityType: 'ExchangeRate', entityId: input.id });
  revalidateRates();
  return { ok: true };
}

export async function archiveRate(input: { id: string; csrf: string }): Promise<ActionResult> {
  const admin = await requireAdmin();
  if (!verifyCsrf(input.csrf)) return { ok: false, error: 'Invalid session token.' };
  await prisma.exchangeRate.update({
    where: { id: input.id },
    data: { deletedAt: new Date(), isPublished: false, isFeatured: false },
  });
  await logAudit({ adminId: admin.id, action: 'rate.archive', entityType: 'ExchangeRate', entityId: input.id });
  revalidateRates();
  return { ok: true };
}

/** Fast multi-row buy/sell/manual update inside one DB transaction. */
export async function bulkUpdateRates(input: {
  items: { id: string; manualRate?: number | null; buyRate?: number | null; sellRate?: number | null }[];
  csrf: string;
}): Promise<ActionResult> {
  const admin = await requireAdmin();
  if (!verifyCsrf(input.csrf)) return { ok: false, error: 'Invalid session token.' };

  for (const it of input.items) {
    for (const k of ['manualRate', 'buyRate', 'sellRate'] as const) {
      const v = it[k];
      if (v != null && (typeof v !== 'number' || v <= 0)) return { ok: false, error: `Invalid value for ${it.id}.` };
    }
  }

  try {
    await prisma.$transaction(
      input.items.map((it) =>
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

  await Promise.all(input.items.map((it) => recordHistory(it.id, admin.email)));
  await logAudit({ adminId: admin.id, action: 'rate.bulk_update', metadata: { count: input.items.length } });
  revalidateRates();
  return { ok: true };
}
