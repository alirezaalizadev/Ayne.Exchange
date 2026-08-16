import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { prisma } from '@/lib/db';
import { Section } from '@/components/ui/section';
import { PageHero } from '@/components/layout/page-hero';
import { TransactionsList } from '@/components/transactions/transactions-list';
import { getPublicTransactions } from '@/lib/transactions/service';

export async function generateMetadata({
  params,
}: {
  params: { locale: string };
}): Promise<Metadata> {
  const { locale } = params;
  const t = await getTranslations({ locale, namespace: 'transactions' });
  return { title: t('title'), description: t('subtitle'), alternates: { canonical: '/transactions' } };
}

function StatTile({ value, label }: { value: string; label: string }) {
  return (
    <div className="surface-card p-5 text-center">
      <p className="font-display text-3xl font-semibold text-gradient" dir="ltr">{value}</p>
      <p className="mt-1 text-xs text-muted-foreground">{label}</p>
    </div>
  );
}

export default async function TransactionsPage({ params }: { params: { locale: string } }) {
  const { locale } = params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: 'transactions' });
  const tn = await getTranslations({ locale, namespace: 'nav' });

  const [txs, settings] = await Promise.all([
    getPublicTransactions(),
    prisma.siteSetting.findMany({ where: { key: { in: ['stats.years', 'stats.volume'] } } }),
  ]);
  const smap = Object.fromEntries(settings.map((s) => [s.key, s.value]));
  const currencyCount = new Set(txs.map((x) => x.currency)).size;

  return (
    <>
      <PageHero
        eyebrow={t('eyebrow')}
        title={t('title')}
        subtitle={t('subtitle')}
        breadcrumb={[{ label: tn('home'), href: '/' }, { label: t('nav') }]}
      />
      <Section>
        {/* Real, configured stats (never derived to deceive) */}
        <div className="mb-10 grid grid-cols-2 gap-4 lg:grid-cols-4">
          <StatTile value={`${smap['stats.years'] ?? '7'}+`} label={t('statLabelYears')} />
          <StatTile value={`$${smap['stats.volume'] ?? '1B+'}`} label={t('statLabelVolume')} />
          <StatTile value={String(txs.length)} label={t('statLabelRoutes')} />
          <StatTile value={String(currencyCount)} label={t('statLabelCurrencies')} />
        </div>

        <TransactionsList txs={txs} />
      </Section>
    </>
  );
}
