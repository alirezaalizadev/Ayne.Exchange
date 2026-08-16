import { Badge } from '@/components/ui/badge';
import { CurrencyPairIcons } from '@/components/ui/currency-icon';
import { formatRate } from '@/lib/format';
import type { PublicRate } from '@/lib/rates/service';

/**
 * Rate card driven entirely by the admin-managed DB rate. Shows separate
 * buy/sell when configured, otherwise a single indicative rate.
 */
export function RateCard({ rate, locale }: { rate: PublicRate; locale: string }) {
  const fmt = (v: number | null) =>
    v != null ? formatRate(v, rate.base, rate.quote, locale, rate.decimals) : '—';

  const hasBuySell = rate.buy != null || rate.sell != null;

  return (
    <div className="surface-card p-5 transition-all duration-base ease-premium hover:border-primary/30">
      <div className="flex items-center justify-between">
        <span className="flex items-center gap-2.5">
          <CurrencyPairIcons base={rate.base} quote={rate.quote} size={22} />
          <span className="font-mono text-sm font-medium text-muted-foreground">{rate.label}</span>
        </span>
        <Badge variant="default">{rate.sourceLabel}</Badge>
      </div>

      {hasBuySell ? (
        <div className="mt-3 grid grid-cols-2 gap-3">
          <div className="rounded-lg border border-border bg-surface-raised p-2.5">
            <p className="text-[0.65rem] uppercase tracking-wide text-muted-foreground">Buy</p>
            <p className="mt-0.5 font-display text-lg font-semibold tabular-nums text-success" dir="ltr">
              {fmt(rate.buy ?? rate.display)}
            </p>
          </div>
          <div className="rounded-lg border border-border bg-surface-raised p-2.5">
            <p className="text-[0.65rem] uppercase tracking-wide text-muted-foreground">Sell</p>
            <p className="mt-0.5 font-display text-lg font-semibold tabular-nums text-primary" dir="ltr">
              {fmt(rate.sell ?? rate.display)}
            </p>
          </div>
        </div>
      ) : (
        <>
          <p className="mt-3 font-display text-2xl font-semibold tabular-nums" dir="ltr">
            {fmt(rate.display)}
          </p>
          <p className="mt-1 text-xs text-muted-foreground" dir="ltr">
            1 {rate.base} = {fmt(rate.display)} {rate.quote}
          </p>
        </>
      )}
    </div>
  );
}
