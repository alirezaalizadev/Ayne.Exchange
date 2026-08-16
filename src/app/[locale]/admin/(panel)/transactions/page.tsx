import { prisma } from '@/lib/db';
import { getCsrfToken } from '@/lib/auth/csrf';
import { PageHeader } from '@/components/admin/widgets';
import { TransactionManager, type TxItem } from '@/components/admin/transaction-manager';

export const metadata = { title: 'Transactions' };

export default async function AdminTransactionsPage() {
  const rows = await prisma.transaction.findMany({
    where: { deletedAt: null },
    orderBy: [{ order: 'asc' }, { occurredOn: 'desc' }],
    take: 200,
  });

  const items: TxItem[] = rows.map((t) => ({
    id: t.id,
    publicRef: t.publicRef,
    originCountry: t.originCountry,
    originCity: t.originCity,
    destinationCountry: t.destinationCountry,
    destinationCity: t.destinationCity,
    currency: t.currency,
    displayAmount: t.displayAmount.toString(),
    amountMode: t.amountDisplayMode,
    serviceKey: t.serviceKey,
    paymentMethod: t.paymentMethod,
    status: t.status,
    occurredOn: t.occurredOn.toISOString(),
    isPublished: t.isPublished,
    isFeatured: t.isFeatured,
    isDemo: t.isDemo,
  }));

  return (
    <>
      <PageHeader
        title="Transactions"
        description="Published entries appear on the public site (homepage + Payment Activity page). Never include names, IBANs, account numbers or SWIFT messages."
      />
      <TransactionManager items={items} csrf={getCsrfToken() ?? ''} />
    </>
  );
}
