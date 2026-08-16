import 'server-only';
import { unstable_cache } from 'next/cache';
import type { ExchangeRate } from '@prisma/client';
import { prisma } from '@/lib/db';
import type { RatePair } from './cross';

/** Cache tag — admin rate mutations call revalidateTag(RATES_TAG). */
export const RATES_TAG = 'rates';

export type RateCategory = 'CRYPTO' | 'IRAN' | 'TRY' | 'MAJOR' | 'REGIONAL';

export interface PublicRate {
  id: string;
  base: string;
  quote: string;
  label: string;
  display: number | null;
  buy: number | null;
  sell: number | null;
  sourceLabel: string;
  provider: string;
  mode: string;
  decimals: number | null;
  category: RateCategory;
  isFeatured: boolean;
  order: number;
  updatedAt: string;
}

const MAJORS = new Set(['USD', 'EUR', 'GBP', 'JPY', 'CHF', 'CAD', 'AUD']);
const CRYPTO = new Set(['BTC', 'ETH', 'USDT', 'USDC']);

function toNum(d: unknown): number | null {
  if (d == null) return null;
  const n = Number(d);
  return isFinite(n) ? n : null;
}

/** Resolve the mid/display rate from mode + inputs. Robust to missing values. */
export function computeDisplayRate(r: Pick<ExchangeRate, 'mode' | 'apiRate' | 'manualRate' | 'spreadPct'>): number | null {
  const api = toNum(r.apiRate);
  const manual = toNum(r.manualRate);
  const spread = toNum(r.spreadPct) ?? 0;
  switch (r.mode) {
    case 'MANUAL':
      return manual ?? api;
    case 'ADJUSTED':
      return api != null ? api * (1 + spread / 100) : manual;
    case 'AUTO':
    default:
      return api ?? manual;
  }
}

function categorize(base: string, quote: string): RateCategory {
  const b = base.toUpperCase();
  const q = quote.toUpperCase();
  if (CRYPTO.has(b) || CRYPTO.has(q)) return 'CRYPTO';
  if (b === 'IRR' || q === 'IRR') return 'IRAN';
  if (b === 'TRY' || q === 'TRY') return 'TRY';
  if (MAJORS.has(b) && MAJORS.has(q)) return 'MAJOR';
  return 'REGIONAL';
}

function toPublicRate(r: ExchangeRate): PublicRate {
  return {
    id: r.id,
    base: r.base,
    quote: r.quote,
    label: r.displayLabel ?? `${r.base} / ${r.quote}`,
    display: computeDisplayRate(r),
    buy: toNum(r.buyRate),
    sell: toNum(r.sellRate),
    sourceLabel: r.sourceLabel,
    provider: r.provider,
    mode: r.mode,
    decimals: r.displayDecimals ?? null,
    category: categorize(r.base, r.quote),
    isFeatured: r.isFeatured,
    order: r.order,
    updatedAt: r.updatedAt.toISOString(),
  };
}

/**
 * All published rates, cached and tagged. This is the ONE source of truth the
 * public site reads. Data is mapped to plain serializable objects inside the
 * cache so Prisma Decimals never leak out.
 */
const _getPublicRates = unstable_cache(
  async (): Promise<PublicRate[]> => {
    const rows = await prisma.exchangeRate.findMany({
      where: { isPublished: true, deletedAt: null },
      orderBy: [{ order: 'asc' }, { base: 'asc' }, { quote: 'asc' }],
    });
    return rows.map(toPublicRate);
  },
  ['public-rates'],
  { tags: [RATES_TAG], revalidate: 300 },
);

export function getPublicRates(): Promise<PublicRate[]> {
  return _getPublicRates();
}

export async function getFeaturedRates(): Promise<PublicRate[]> {
  const rates = await getPublicRates();
  return rates.filter((r) => r.isFeatured && r.display != null);
}

/** Most recent rate update timestamp (for honest "Updated HH:MM" labels). */
export async function getRatesUpdatedAt(): Promise<string | null> {
  const rates = await getPublicRates();
  if (rates.length === 0) return null;
  return rates.map((r) => r.updatedAt).sort().at(-1) ?? null;
}

/**
 * Pairs for the cross-rate engine (calculator + chips). Deduplicated by the
 * unordered currency pair so conflicting rows (e.g. USD/EUR vs EUR/USD, or the
 * same pair under two source labels) can't create an inconsistent graph. The
 * first row wins (rates are ordered by admin `order`, so priority is respected).
 */
export async function getRatePairs(): Promise<RatePair[]> {
  const rates = await getPublicRates();
  const seen = new Set<string>();
  const out: RatePair[] = [];
  for (const r of rates) {
    if (r.display == null || r.display <= 0) continue;
    const key = [r.base.toUpperCase(), r.quote.toUpperCase()].sort().join('|');
    if (seen.has(key)) continue;
    seen.add(key);
    out.push({ base: r.base, quote: r.quote, rate: r.display });
  }
  return out;
}
