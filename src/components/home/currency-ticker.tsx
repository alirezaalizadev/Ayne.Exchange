import { getLocale, getTranslations } from 'next-intl/server';
import { getFeaturedRates } from '@/lib/rates/service';
import { CurrencyPairIcons } from '@/components/ui/currency-icon';
import { formatRate } from '@/lib/format';

/**
 * Homepage rate ticker — driven by the admin-managed DB rates that are marked
 * "featured". Values are locale-formatted (display only). If nothing is
 * featured, the ticker renders nothing (no hardcoded fallback).
 */
export async function CurrencyTicker() {
  const t = await getTranslations('ticker');
  const locale = await getLocale();
  const rates = await getFeaturedRates();
  if (rates.length === 0) return null;

  const items = rates.map((r) => ({
    base: r.base,
    quote: r.quote,
    pair: r.label,
    value: r.display != null ? formatRate(r.display, r.base, r.quote, locale, r.decimals) : '—',
  }));

  // Pad so the marquee fills wide screens, then duplicate for a seamless loop.
  const base = [...items];
  while (base.length < 10) base.push(...items);
  const track = [...base, ...base];

  return (
    <div className="relative border-y border-border bg-surface/60">
      <div className="container flex items-center gap-4 py-3">
        <span className="hidden shrink-0 items-center gap-1.5 text-xs font-medium text-muted-foreground sm:flex">
          <span className="inline-block h-1.5 w-1.5 rounded-full bg-accent" />
          {t('label')}
        </span>
        <div className="group relative flex-1 overflow-hidden [mask-image:linear-gradient(90deg,transparent,black_6%,black_94%,transparent)]">
          <div className="flex w-max animate-marquee items-center gap-8 group-hover:[animation-play-state:paused]">
            {track.map((item, i) => (
              <span key={i} className="flex items-center gap-2 text-sm">
                <CurrencyPairIcons base={item.base} quote={item.quote} size={16} />
                <span className="text-muted-foreground">{item.pair}</span>
                <span className="font-mono tabular-nums font-medium" dir="ltr">
                  {item.value}
                </span>
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
