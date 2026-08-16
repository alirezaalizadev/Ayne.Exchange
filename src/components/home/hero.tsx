import { getLocale, getTranslations } from 'next-intl/server';
import { ArrowRight } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import { Button } from '@/components/ui/button';
import { getRatePairs } from '@/lib/rates/service';
import { getCrossRate } from '@/lib/rates/cross';
import { formatRate } from '@/lib/format';
import { cn } from '@/lib/utils';

/** Decorative floating currency chip used in the hero background. */
function FloatChip({
  pair,
  value,
  className,
  delay = 0,
}: {
  pair: string;
  value: string;
  className?: string;
  delay?: number;
}) {
  return (
    <div
      className={cn(
        'float-chip absolute flex items-center gap-2 rounded-xl border border-border/70 glass px-3 py-2 shadow-sm',
        className,
      )}
      style={{ animationDelay: `${delay}s` }}
    >
      <span className="text-[0.7rem] font-medium text-muted-foreground">{pair}</span>
      <span className="font-mono text-xs font-semibold tabular-nums text-foreground/80">{value}</span>
    </div>
  );
}

export async function Hero() {
  const t = await getTranslations('hero');
  const locale = await getLocale();
  const pairs = await getRatePairs();
  const fx = (base: string, quote: string) => {
    const r = getCrossRate(pairs, base, quote);
    return r !== null ? formatRate(r, base, quote, locale) : '';
  };

  return (
    <section className="relative overflow-hidden">
      {/* Ambient financial background */}
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-b from-background via-background to-surface/30" />
        <div
          className="hero-blob"
          style={{
            top: '-8%',
            left: '8%',
            width: '46%',
            height: '70%',
            background: 'radial-gradient(circle, hsl(var(--primary) / 0.22), transparent 70%)',
            animation: 'drift-a 16s ease-in-out infinite',
          }}
        />
        <div
          className="hero-blob"
          style={{
            top: '4%',
            right: '4%',
            width: '42%',
            height: '64%',
            background: 'radial-gradient(circle, hsl(var(--accent) / 0.18), transparent 70%)',
            animation: 'drift-b 20s ease-in-out infinite',
          }}
        />
        <div className="absolute inset-0 grid-texture opacity-40" />
        <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-background to-transparent" />
      </div>

      {/* Decorative floating currency chips (desktop only, non-interactive) */}
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 hidden lg:block">
        <FloatChip pair="USD / EUR" value={fx('USD', 'EUR')} className="left-[7%] top-[24%] opacity-70" delay={0} />
        <FloatChip pair="EUR / TRY" value={fx('EUR', 'TRY')} className="right-[8%] top-[20%] opacity-70" delay={1.4} />
        <FloatChip pair="GBP / USD" value={fx('GBP', 'USD')} className="left-[12%] bottom-[16%] opacity-60" delay={2.6} />
        <FloatChip pair="USD / AED" value={fx('USD', 'AED')} className="right-[11%] bottom-[20%] opacity-60" delay={0.8} />
      </div>

      <div className="container flex min-h-[78vh] flex-col items-center justify-center py-20 text-center sm:min-h-[72vh]">
        <div className="mx-auto max-w-3xl">
          <p className="eyebrow mb-5 animate-fade-in">{t('eyebrow')}</p>

          <h1 className="text-display-lg font-semibold text-balance animate-fade-up">
            {t('titleLine1')} <span className="text-gradient">{t('titleHighlight')}</span>
          </h1>

          <p
            className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg animate-fade-up"
            style={{ animationDelay: '80ms' }}
          >
            {t('subtitle')}
          </p>

          <div
            className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row animate-fade-up"
            style={{ animationDelay: '160ms' }}
          >
            <Button asChild variant="cta" size="xl" className="w-full sm:w-auto">
              <Link href="/request-quote">
                {t('ctaPrimary')}
                <ArrowRight className="h-4 w-4 rtl:rotate-180" />
              </Link>
            </Button>
            <Button asChild variant="secondary" size="xl" className="w-full sm:w-auto">
              <Link href="/services">{t('ctaSecondary')}</Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
