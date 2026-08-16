import { getTranslations } from 'next-intl/server';
import { SectionHeading } from '@/components/ui/section';
import { GlobalNetworkMap } from './global-network-map';
import { getRatePairs } from '@/lib/rates/service';
import { getCrossRate } from '@/lib/rates/cross';
import { formatRate } from '@/lib/format';
import { cn } from '@/lib/utils';

/** Small premium financial chip floated around the map. */
function Chip({
  className,
  label,
  value,
  delay = 0,
}: {
  className?: string;
  label: string;
  value: string;
  delay?: number;
}) {
  return (
    <div
      className={cn(
        'float-chip pointer-events-none absolute hidden items-center gap-2 rounded-xl border border-border glass-strong px-3 py-2 shadow-md lg:flex',
        className,
      )}
      style={{ animationDelay: `${delay}s` }}
    >
      <span className="text-[0.7rem] font-medium text-muted-foreground">{label}</span>
      <span className="font-mono text-sm font-semibold tabular-nums">{value}</span>
    </div>
  );
}

function Badge({ className, text, delay = 0 }: { className?: string; text: string; delay?: number }) {
  return (
    <div
      className={cn(
        'float-chip pointer-events-none absolute hidden rounded-lg border border-primary/20 bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary shadow-sm lg:block',
        className,
      )}
      style={{ animationDelay: `${delay}s` }}
    >
      {text}
    </div>
  );
}

export async function NetworkSection({ locale }: { locale: string }) {
  const t = await getTranslations('network');
  const pairs = await getRatePairs();

  const rate = (b: string, q: string) => {
    const r = getCrossRate(pairs, b, q);
    return r !== null ? formatRate(r, b, q, locale) : null;
  };
  const eurUsd = rate('EUR', 'USD');
  const eurTry = rate('EUR', 'TRY');
  const usdAed = rate('USD', 'AED');

  return (
    <section className="relative overflow-hidden border-y border-border/60 bg-surface/30 py-20 sm:py-28 lg:py-32">
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute inset-x-0 top-24 h-[600px] bg-radial-glow opacity-60" />
        <div className="absolute inset-0 grid-texture opacity-30" />
      </div>

      <div className="container">
        <SectionHeading eyebrow={t('eyebrow')} title={t('title')} subtitle={t('subtitle')} />
      </div>

      <div className="relative mx-auto mt-8 w-full max-w-[1440px] px-3 sm:mt-12 sm:px-6">
        <div className="relative">
          <GlobalNetworkMap className="h-[260px] sm:h-[520px] lg:h-[660px] xl:h-[740px]" />

          {/* Floating financial indicators — indicative reference values, not live */}
          <Badge text="SWIFT" className="left-[3%] top-[8%]" delay={0} />
          <Badge text="SEPA" className="right-[5%] bottom-[16%]" delay={1.5} />
          {eurUsd && <Chip label="EUR / USD" value={eurUsd} className="right-[4%] top-[12%]" delay={0.6} />}
          {eurTry && <Chip label="EUR / TRY" value={eurTry} className="left-[4%] bottom-[14%]" delay={2.2} />}
          {usdAed && <Chip label="USD / AED" value={usdAed} className="left-[30%] top-[4%]" delay={1.1} />}
        </div>
      </div>
    </section>
  );
}
