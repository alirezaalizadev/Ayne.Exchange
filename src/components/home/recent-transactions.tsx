import { getTranslations } from 'next-intl/server';
import { ArrowRight } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import { Section, SectionHeading } from '@/components/ui/section';
import { Reveal } from '@/components/ui/reveal';
import { Button } from '@/components/ui/button';
import { TransactionCard } from '@/components/transactions/transaction-card';
import { getHomepageTransactions } from '@/lib/transactions/service';

export async function RecentTransactions() {
  const t = await getTranslations('transactions');
  const txs = await getHomepageTransactions(6);
  if (txs.length === 0) return null; // no fabricated fallback

  return (
    <Section surface="elevated">
      <SectionHeading eyebrow={t('eyebrow')} title={t('homeTitle')} subtitle={t('homeSubtitle')} />

      <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {txs.map((tx, i) => (
          <Reveal key={tx.id} delay={(i % 3) * 0.06}>
            <TransactionCard tx={tx} />
          </Reveal>
        ))}
      </div>

      <div className="mt-8 text-center">
        <Button asChild variant="outline" size="lg">
          <Link href="/transactions">
            {t('viewAll')}
            <ArrowRight className="h-4 w-4 rtl:rotate-180" />
          </Link>
        </Button>
      </div>
    </Section>
  );
}
