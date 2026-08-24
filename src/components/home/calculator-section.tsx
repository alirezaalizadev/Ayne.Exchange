import { getTranslations } from 'next-intl/server';
import { Section, SectionHeading } from '@/components/ui/section';
import { Reveal } from '@/components/ui/reveal';
import { ExchangeCalculator } from '@/components/rates/exchange-calculator';
import { getRatePairs, getRatesUpdatedAt } from '@/lib/rates/service';

/**
 * The exchange calculator in its own full section directly below the hero —
 * same component, same admin-managed rate data, unchanged functionality.
 */
export async function CalculatorSection() {
  const t = await getTranslations('calculator');
  const [pairs, updatedAt] = await Promise.all([getRatePairs(), getRatesUpdatedAt()]);

  return (
    <Section id="calculator" surface="elevated">
      <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-12">
        <div className="lg:col-span-6">
          <SectionHeading eyebrow={t('eyebrow')} title={t('title')} subtitle={t('disclaimer')} />
        </div>
        <Reveal delay={0.08} className="lg:col-span-5 lg:col-start-8">
          <div className="mx-auto w-full max-w-md">
            <ExchangeCalculator pairs={pairs} updatedAt={updatedAt} />
          </div>
        </Reveal>
      </div>
    </Section>
  );
}
