import { getTranslations } from 'next-intl/server';
import { TrendingUp } from 'lucide-react';
import { Section } from '@/components/ui/section';
import { Reveal } from '@/components/ui/reveal';
import { ExchangeCalculator } from '@/components/rates/exchange-calculator';
import { getRatePairs, getRatesUpdatedAt } from '@/lib/rates/service';

export async function CalculatorSection() {
  const t = await getTranslations('calculator');
  const [pairs, updatedAt] = await Promise.all([getRatePairs(), getRatesUpdatedAt()]);

  return (
    <Section surface="panel">
      <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-2">
        <Reveal>
          <div>
            <p className="eyebrow mb-3 inline-flex items-center gap-1.5">
              <TrendingUp className="h-3.5 w-3.5" />
              {t('eyebrow')}
            </p>
            <h2 className="text-h1 font-semibold text-balance">{t('title')}</h2>
            <p className="mt-4 max-w-md text-base text-muted-foreground">{t('disclaimer')}</p>
          </div>
        </Reveal>
        <Reveal delay={0.1}>
          <div className="mx-auto w-full max-w-md">
            <ExchangeCalculator pairs={pairs} updatedAt={updatedAt} />
          </div>
        </Reveal>
      </div>
    </Section>
  );
}
