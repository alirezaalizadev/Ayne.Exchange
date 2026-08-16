import { prisma } from '@/lib/db';
import { getCsrfToken } from '@/lib/auth/csrf';
import { computeDisplayRate } from '@/lib/rates/service';
import { PageHeader } from '@/components/admin/widgets';
import { RateAdmin, type RateAdminItem } from '@/components/admin/rate-admin';

export const metadata = { title: 'Exchange Rates' };

export default async function AdminRatesPage() {
  const rows = await prisma.exchangeRate.findMany({
    where: { deletedAt: null },
    orderBy: [{ order: 'asc' }, { base: 'asc' }, { quote: 'asc' }],
  });

  const items: RateAdminItem[] = rows.map((r) => ({
    id: r.id,
    base: r.base,
    quote: r.quote,
    sourceLabel: r.sourceLabel,
    displayLabel: r.displayLabel,
    apiRate: r.apiRate != null ? r.apiRate.toString() : null,
    manualRate: r.manualRate != null ? r.manualRate.toString() : null,
    buyRate: r.buyRate != null ? r.buyRate.toString() : null,
    sellRate: r.sellRate != null ? r.sellRate.toString() : null,
    spreadPct: r.spreadPct != null ? r.spreadPct.toString() : null,
    displayRate: computeDisplayRate(r),
    mode: r.mode,
    provider: r.provider,
    isPublished: r.isPublished,
    isFeatured: r.isFeatured,
    order: r.order,
    updatedAt: r.updatedAt.toISOString(),
  }));

  return (
    <>
      <PageHeader
        title="Exchange Rates"
        description="One source of truth — changes here update the public site, homepage ticker and calculator."
      />
      <RateAdmin items={items} csrf={getCsrfToken() ?? ''} />
    </>
  );
}
