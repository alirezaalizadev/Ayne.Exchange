import 'server-only';
import type { ExchangeRate, QuoteRequest, RateHistory, Transaction } from '@prisma/client';
import Big from 'big.js';
import { computeDisplayRate } from '@/lib/rates/service';
import { currencyMeta, currencies } from '@/lib/config/currencies';
import { countryByCode } from '@/lib/config/countries';

/**
 * API serializers. All money/rate numerics are DECIMAL STRINGS (never floats)
 * so clients can decode losslessly (Swift Decimal, etc.). Transaction amounts
 * are masked server-side according to their privacy display mode — raw amounts
 * never leave the server for ROUNDED / RANGE / HIDDEN rows.
 */

export function decStr(d: unknown): string | null {
  if (d == null) return null;
  const s = String(d);
  if (!s || s === 'NaN') return null;
  return s;
}

/** Render a JS number as a plain decimal string with bounded precision. */
export function numToDec(n: number | null, maxDp = 8): string | null {
  if (n == null || !isFinite(n)) return null;
  try {
    return new Big(n).round(maxDp, Big.roundHalfUp).toString();
  } catch {
    return null;
  }
}

export interface ApiCurrencyMeta {
  code: string;
  name: string;
  symbol: string;
  decimals: number;
  isCrypto: boolean;
  /** ISO-3166 country code used for the flag badge; null for crypto. */
  flag: string | null;
}

export function apiCurrency(code: string): ApiCurrencyMeta {
  const meta = currencyMeta(code);
  const def = currencies.find((c) => c.code === code.toUpperCase());
  return {
    code: code.toUpperCase(),
    name: meta?.name ?? code.toUpperCase(),
    symbol: meta?.symbol ?? '',
    decimals: meta?.decimals ?? 2,
    isCrypto: meta?.kind === 'crypto',
    flag: def?.flag ?? null,
  };
}

export interface ApiRate {
  id: string;
  pair: string;
  base: string;
  quote: string;
  label: string;
  buy: string | null;
  sell: string | null;
  displayRate: string | null;
  mode: string;
  provider: string;
  sourceLabel: string;
  featured: boolean;
  sortOrder: number;
  displayDecimals: number | null;
  lastUpdatedAt: string;
  baseCurrency: ApiCurrencyMeta;
  quoteCurrency: ApiCurrencyMeta;
}

export function serializeRate(r: ExchangeRate): ApiRate {
  return {
    id: r.id,
    pair: `${r.base}/${r.quote}`,
    base: r.base,
    quote: r.quote,
    label: r.displayLabel ?? `${r.base} / ${r.quote}`,
    buy: decStr(r.buyRate),
    sell: decStr(r.sellRate),
    displayRate: numToDec(computeDisplayRate(r)),
    mode: r.mode,
    provider: r.provider,
    sourceLabel: r.sourceLabel,
    featured: r.isFeatured,
    sortOrder: r.order,
    displayDecimals: r.displayDecimals ?? null,
    lastUpdatedAt: r.updatedAt.toISOString(),
    baseCurrency: apiCurrency(r.base),
    quoteCurrency: apiCurrency(r.quote),
  };
}

/** Admin projection — includes the raw inputs the editor needs. */
export function serializeAdminRate(r: ExchangeRate) {
  return {
    ...serializeRate(r),
    apiRate: decStr(r.apiRate),
    manualRate: decStr(r.manualRate),
    spreadPct: decStr(r.spreadPct),
    note: r.note,
    isPublished: r.isPublished,
    fetchedAt: r.fetchedAt?.toISOString() ?? null,
    createdAt: r.createdAt.toISOString(),
  };
}

export function serializeRateHistory(h: RateHistory) {
  return {
    id: h.id,
    value: decStr(h.value),
    buy: decStr(h.buyRate),
    sell: decStr(h.sellRate),
    mode: h.mode,
    source: h.source,
    changedBy: h.changedBy,
    recordedAt: h.recordedAt.toISOString(),
  };
}

/** Privacy rounding — mirrors src/lib/transactions/display.ts roundNice(). */
export function roundNice(v: number): number {
  if (v >= 100000) return Math.round(v / 5000) * 5000;
  if (v >= 10000) return Math.round(v / 1000) * 1000;
  if (v >= 1000) return Math.round(v / 500) * 500;
  return Math.round(v / 100) * 100;
}

export interface ApiTransaction {
  publicRef: string;
  originCountry: string;
  originCity: string | null;
  destinationCountry: string;
  destinationCity: string | null;
  originCountryName: string | null;
  destinationCountryName: string | null;
  currency: string;
  currencyMeta: ApiCurrencyMeta;
  /** Masked per amountMode: EXACT → exact, ROUNDED → privacy-rounded, RANGE/HIDDEN → null. */
  amount: string | null;
  amountMode: string;
  rangeMin: string | null;
  rangeMax: string | null;
  serviceKey: string;
  paymentMethod: string | null;
  status: string;
  occurredOn: string;
  featured: boolean;
}

export function serializePublicTransaction(t: Transaction): ApiTransaction {
  const mode = t.amountDisplayMode;
  const exact = Number(t.displayAmount);
  let amount: string | null = null;
  let rangeMin: string | null = null;
  let rangeMax: string | null = null;
  if (mode === 'EXACT') {
    amount = decStr(t.displayAmount);
  } else if (mode === 'ROUNDED') {
    amount = numToDec(roundNice(exact), 2);
  } else if (mode === 'RANGE') {
    rangeMin = decStr(t.amountRangeMin) ?? numToDec(roundNice(exact), 2);
    rangeMax = decStr(t.amountRangeMax);
  }
  return {
    publicRef: t.publicRef ?? t.id.slice(-8).toUpperCase(),
    originCountry: t.originCountry,
    originCity: t.originCity,
    destinationCountry: t.destinationCountry,
    destinationCity: t.destinationCity,
    originCountryName: countryByCode(t.originCountry)?.name ?? null,
    destinationCountryName: countryByCode(t.destinationCountry)?.name ?? null,
    currency: t.currency,
    currencyMeta: apiCurrency(t.currency),
    amount,
    amountMode: mode,
    rangeMin,
    rangeMax,
    serviceKey: t.serviceKey,
    paymentMethod: t.paymentMethod,
    status: t.status === 'IN_PROGRESS' ? 'PROCESSING' : t.status,
    occurredOn: t.occurredOn.toISOString(),
    featured: t.isFeatured,
  };
}

/** Admin projection — full row, exact values (admin is authenticated). */
export function serializeAdminTransaction(t: Transaction) {
  return {
    id: t.id,
    publicRef: t.publicRef,
    originCountry: t.originCountry,
    originCity: t.originCity,
    destinationCountry: t.destinationCountry,
    destinationCity: t.destinationCity,
    currency: t.currency,
    displayAmount: decStr(t.displayAmount),
    amountDisplayMode: t.amountDisplayMode,
    amountRangeMin: decStr(t.amountRangeMin),
    amountRangeMax: decStr(t.amountRangeMax),
    serviceKey: t.serviceKey,
    paymentMethod: t.paymentMethod,
    status: t.status,
    occurredOn: t.occurredOn.toISOString(),
    note: t.note,
    isPublished: t.isPublished,
    isFeatured: t.isFeatured,
    order: t.order,
    createdAt: t.createdAt.toISOString(),
    updatedAt: t.updatedAt.toISOString(),
  };
}

export function serializeAdminQuote(q: QuoteRequest) {
  return {
    id: q.id,
    reference: q.reference,
    serviceKey: q.serviceKey,
    sendAmount: decStr(q.sendAmount),
    sendCurrency: q.sendCurrency,
    receiveCurrency: q.receiveCurrency,
    originCountry: q.originCountry,
    destinationCountry: q.destinationCountry,
    purpose: q.purpose,
    clientType: q.clientType,
    timing: q.timing,
    notes: q.notes,
    contactMethod: q.contactMethod,
    contactValue: q.contactValue,
    status: q.status,
    locale: q.locale,
    createdAt: q.createdAt.toISOString(),
    updatedAt: q.updatedAt.toISOString(),
  };
}
