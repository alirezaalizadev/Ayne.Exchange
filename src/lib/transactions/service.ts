import 'server-only';
import { unstable_cache } from 'next/cache';
import type { Transaction } from '@prisma/client';
import { prisma } from '@/lib/db';

export const TRANSACTIONS_TAG = 'transactions';

export interface PublicTransaction {
  id: string;
  publicRef: string;
  originCountry: string;
  originCity: string | null;
  destinationCountry: string;
  destinationCity: string | null;
  currency: string;
  amount: number;
  amountMode: string;
  rangeMin: number | null;
  rangeMax: number | null;
  serviceKey: string;
  paymentMethod: string | null;
  status: string;
  occurredOn: string;
  isFeatured: boolean;
}

function toPublic(t: Transaction): PublicTransaction {
  return {
    id: t.id,
    publicRef: t.publicRef ?? t.id.slice(-8).toUpperCase(),
    originCountry: t.originCountry,
    originCity: t.originCity,
    destinationCountry: t.destinationCountry,
    destinationCity: t.destinationCity,
    currency: t.currency,
    amount: Number(t.displayAmount),
    amountMode: t.amountDisplayMode,
    rangeMin: t.amountRangeMin != null ? Number(t.amountRangeMin) : null,
    rangeMax: t.amountRangeMax != null ? Number(t.amountRangeMax) : null,
    serviceKey: t.serviceKey,
    paymentMethod: t.paymentMethod,
    status: t.status === 'IN_PROGRESS' ? 'PROCESSING' : t.status,
    occurredOn: t.occurredOn.toISOString(),
    isFeatured: t.isFeatured,
  };
}

/** All published transactions (capped), cached + tagged. One source of truth. */
const _getPublicTransactions = unstable_cache(
  async (): Promise<PublicTransaction[]> => {
    const rows = await prisma.transaction.findMany({
      where: { isPublished: true, deletedAt: null },
      orderBy: [{ order: 'asc' }, { occurredOn: 'desc' }],
      take: 200,
    });
    return rows.map(toPublic);
  },
  ['public-transactions'],
  { tags: [TRANSACTIONS_TAG], revalidate: 300 },
);

export function getPublicTransactions(): Promise<PublicTransaction[]> {
  return _getPublicTransactions();
}

/** Featured transactions for the homepage; falls back to latest published. */
export async function getHomepageTransactions(limit = 8): Promise<PublicTransaction[]> {
  const all = await getPublicTransactions();
  const featured = all.filter((t) => t.isFeatured);
  return (featured.length ? featured : all).slice(0, limit);
}
