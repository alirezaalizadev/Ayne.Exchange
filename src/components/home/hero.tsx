import { getTranslations } from 'next-intl/server';
import { ArrowRight } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import { Button } from '@/components/ui/button';
import { ExchangeCalculator } from '@/components/rates/exchange-calculator';
import { getRatePairs, getRatesUpdatedAt } from '@/lib/rates/service';

/**
 * Product-first hero: massive headline + short copy on the left, the REAL
 * working exchange calculator as the visual anchor on the right. One subtle
 * accent shape behind the calculator — nothing else competes.
 */
export async function Hero() {
  const t = await getTranslations('hero');
  const [pairs, updatedAt] = await Promise.all([getRatePairs(), getRatesUpdatedAt()]);

  return (
    <section className="relative overflow-hidden">
      <div className="container grid grid-cols-1 items-center gap-12 py-16 sm:py-20 lg:grid-cols-12 lg:gap-10 lg:py-28">
        {/* Headline */}
        <div className="lg:col-span-6">
          <h1 className="max-w-[14ch] text-display-lg text-balance animate-fade-up">
            {t('titleLine1')} <span className="text-primary">{t('titleHighlight')}</span>
          </h1>

          <p
            className="mt-6 max-w-[34rem] text-lg leading-relaxed text-muted-foreground sm:text-xl animate-fade-up"
            style={{ animationDelay: '70ms' }}
          >
            {t('subtitle')}
          </p>

          <div
            className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center animate-fade-up"
            style={{ animationDelay: '140ms' }}
          >
            <Button asChild variant="cta" size="xl">
              <Link href="/request-quote">
                {t('ctaPrimary')}
                <ArrowRight className="h-4 w-4 rtl:rotate-180" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="xl">
              <Link href="/services">{t('ctaSecondary')}</Link>
            </Button>
          </div>
        </div>

        {/* The product: real calculator */}
        <div className="relative lg:col-span-5 lg:col-start-8 animate-fade-up" style={{ animationDelay: '120ms' }}>
          {/* single soft accent shape behind the card */}
          <div
            aria-hidden
            className="absolute -end-10 -top-10 hidden h-64 w-64 rounded-[3rem] bg-primary-muted lg:block"
          />
          <div className="relative">
            <ExchangeCalculator pairs={pairs} updatedAt={updatedAt} />
          </div>
        </div>
      </div>
    </section>
  );
}
