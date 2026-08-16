'use client';

import * as React from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { ArrowUpRight, ArrowUpDown, ArrowLeftRight, AlertCircle } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import { Button } from '@/components/ui/button';
import { CurrencySelect } from './currency-select';
import { currencies } from '@/lib/config/currencies';
import { convertAmount, getCrossRate, currenciesInPairs, type RatePair } from '@/lib/rates/cross';
import { parseLocalizedNumber, formatNumber, formatRate, getCurrencyPrecision } from '@/lib/format';
import { cn } from '@/lib/utils';

/**
 * Premium "exchange desk" calculator. All conversion logic is unchanged —
 * admin-managed DB pairs via the shared cross-rate engine; the amount is a true
 * NUMBER, plain-decimal while editing, locale-formatted on blur. This redesign
 * is visual: terminal surface, flag currency selectors, premium swap, rate bar.
 */
export function ExchangeCalculator({
  compact = false,
  pairs = [],
  updatedAt,
}: {
  compact?: boolean;
  pairs?: RatePair[];
  updatedAt?: string | null;
}) {
  const t = useTranslations('calculator');
  const locale = useLocale();

  const available = React.useMemo(() => {
    const present = new Set(currenciesInPairs(pairs));
    const list = currencies.filter((c) => present.has(c.code)).map((c) => c.code);
    return list.length ? list : currencies.map((c) => c.code);
  }, [pairs]);

  const [value, setValue] = React.useState<number>(10000);
  const [from, setFrom] = React.useState(() => (available.includes('USD') ? 'USD' : available[0] ?? 'USD'));
  const [to, setTo] = React.useState(() => (available.includes('EUR') ? 'EUR' : available[1] ?? 'EUR'));
  const [editing, setEditing] = React.useState(false);
  const [raw, setRaw] = React.useState('');
  const [swapped, setSwapped] = React.useState(false);

  const result = convertAmount(pairs, value, from, to);
  const rate = getCrossRate(pairs, from, to);
  const noRates = pairs.length === 0;
  const unavailable = !noRates && (rate === null || result === null);

  const displayAmount = editing
    ? raw
    : formatNumber(value, locale, {
        minimumFractionDigits: 0,
        maximumFractionDigits: getCurrencyPrecision(from),
      });

  const onFocus = () => {
    setEditing(true);
    setRaw(Number.isFinite(value) ? String(value) : '');
  };
  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setRaw(e.target.value);
    const parsed = parseLocalizedNumber(e.target.value, locale);
    if (parsed !== null) setValue(parsed);
  };

  const swap = () => {
    setFrom(to);
    setTo(from);
    setSwapped((s) => !s);
  };

  const updatedLabel = React.useMemo(() => {
    if (!updatedAt) return null;
    const d = new Date(updatedAt);
    if (isNaN(d.getTime())) return null;
    return new Intl.DateTimeFormat(locale === 'fa' ? 'fa-IR' : locale === 'ru' ? 'ru-RU' : 'en-GB', {
      hour: '2-digit',
      minute: '2-digit',
    }).format(d);
  }, [updatedAt, locale]);

  const quoteHref = `/request-quote?service=exchange&from=${from}&to=${to}&amount=${Math.round(value)}`;

  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-2xl border border-border bg-card shadow-lg',
        // subtle inner illumination
        'before:pointer-events-none before:absolute before:inset-x-0 before:top-0 before:h-40',
        'before:bg-[radial-gradient(60%_100%_at_50%_0%,hsl(var(--primary)/0.10),transparent_75%)]',
      )}
    >
      {/* Header */}
      <div className="relative flex items-center justify-between border-b border-border/70 px-6 py-4">
        <div className="flex items-center gap-3">
          <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-primary/25 bg-primary/10 text-primary">
            <ArrowLeftRight className="h-[1.1rem] w-[1.1rem]" strokeWidth={1.75} />
          </span>
          <div>
            <p className="text-sm font-bold leading-tight">{t('title')}</p>
            <p className="text-xs text-muted-foreground">{t('panelSubtitle')}</p>
          </div>
        </div>
        {updatedLabel && (
          <span className="hidden items-center gap-1.5 rounded-full border border-border bg-surface-raised px-2.5 py-1 text-[0.65rem] font-medium text-muted-foreground sm:inline-flex">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-accent" />
            {t('updatedAt', { time: updatedLabel })}
          </span>
        )}
      </div>

      <div className="relative space-y-3 p-6">
        {noRates ? (
          <div className="flex items-start gap-3 rounded-xl border border-border bg-surface-raised p-4">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-warning" />
            <p className="text-sm text-muted-foreground">{t('unavailable')}</p>
          </div>
        ) : (
          <>
            {/* YOU SEND */}
            <div className="rounded-xl border border-border bg-surface-raised/80 p-4 transition-colors focus-within:border-primary/40">
              <div className="flex items-center justify-between">
                <label className="text-[0.7rem] font-semibold uppercase tracking-[0.1em] text-muted-foreground">
                  {t('youSend')}
                </label>
              </div>
              <div className="mt-2.5 flex items-center gap-3">
                <input
                  inputMode="decimal"
                  dir="ltr"
                  value={displayAmount}
                  onFocus={onFocus}
                  onChange={onChange}
                  onBlur={() => setEditing(false)}
                  aria-label={t('youSend')}
                  className="w-full bg-transparent text-start text-3xl font-bold tabular-nums outline-none"
                />
                <CurrencySelect value={from} onChange={setFrom} available={available} />
              </div>
            </div>

            {/* Swap */}
            <div className="relative flex justify-center py-0.5">
              <div className="absolute top-1/2 h-px w-full -translate-y-1/2 bg-border" />
              <button
                type="button"
                onClick={swap}
                title={t('swapTooltip')}
                aria-label={t('swapTooltip')}
                className={cn(
                  'relative z-10 inline-flex h-11 w-11 items-center justify-center rounded-full',
                  'border border-primary/30 bg-card text-primary shadow-glow',
                  'transition-all duration-base ease-premium hover:scale-105 active:scale-95',
                )}
              >
                <ArrowUpDown
                  className={cn('h-[1.1rem] w-[1.1rem] transition-transform duration-base ease-premium', swapped && 'rotate-180')}
                  strokeWidth={2}
                />
              </button>
            </div>

            {/* YOU RECEIVE */}
            <div className="rounded-xl border border-primary/25 bg-primary/[0.06] p-4">
              <label className="text-[0.7rem] font-semibold uppercase tracking-[0.1em] text-muted-foreground">
                {t('estimatedConversion')}
              </label>
              <div className="mt-2.5 flex items-center gap-3">
                <div
                  key={`${from}-${to}-${result ?? 'na'}`}
                  className="w-full animate-fade-in text-start text-3xl font-bold tabular-nums text-primary"
                  dir="ltr"
                >
                  {result !== null
                    ? formatNumber(result, locale, {
                        minimumFractionDigits: getCurrencyPrecision(to),
                        maximumFractionDigits: getCurrencyPrecision(to),
                      })
                    : '—'}
                </div>
                <CurrencySelect value={to} onChange={setTo} available={available} />
              </div>
            </div>

            {/* Rate bar */}
            <div className="flex items-center justify-between rounded-lg border border-border/70 bg-surface-raised/60 px-3.5 py-2.5 text-sm">
              {unavailable ? (
                <span className="flex items-center gap-2 text-muted-foreground">
                  <AlertCircle className="h-3.5 w-3.5 text-warning" />
                  {t('unavailable')}
                </span>
              ) : (
                <>
                  <span className="text-xs text-muted-foreground">{t('exchangeRate')}</span>
                  <span className="font-semibold tabular-nums" dir="ltr">
                    1 {from} = {rate !== null ? formatRate(rate, from, to, locale) : '—'} {to}
                  </span>
                </>
              )}
            </div>
          </>
        )}
      </div>

      {/* Footer */}
      <div className="relative border-t border-border/70 bg-surface-raised/40 px-6 py-4">
        <p className="text-[0.68rem] leading-relaxed text-muted-foreground">{t('disclaimer')}</p>
        {!compact && (
          <Button asChild variant="cta" size="lg" className="mt-3 w-full font-semibold">
            <Link href={quoteHref}>
              {t('cta')}
              <ArrowUpRight className="h-4 w-4 rtl:-scale-x-100" />
            </Link>
          </Button>
        )}
      </div>
    </div>
  );
}
