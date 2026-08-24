'use client';

import * as React from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { ArrowRight, Pause, Play, ChevronDown } from 'lucide-react';
import { GlobalNetworkMap, type NetworkTick, type TransferInfo } from './global-network-map';
import { flagEmoji } from '@/lib/config/countries';
import { formatNumber } from '@/lib/format';
import { cn } from '@/lib/utils';

/**
 * Client shell around the map: network activity chip, "current connections"
 * side panel (desktop floats, mobile stacks below), collapsible legend and a
 * pause control. All values describe the VISUALIZATION state/config — never
 * transaction volume or live-payment claims.
 */
export function NetworkExperience({
  locationCount,
  emphasisRouteIds,
}: {
  locationCount: number;
  emphasisRouteIds: string[];
}) {
  const t = useTranslations('network');
  const locale = useLocale();
  const [tick, setTick] = React.useState<NetworkTick | null>(null);
  const [ready, setReady] = React.useState(false);
  const [userPaused, setUserPaused] = React.useState(false);
  const [legendOpen, setLegendOpen] = React.useState(false);

  const n = (v: number) => formatNumber(v, locale, { maximumFractionDigits: 0 });

  return (
    <div className="relative">
      <GlobalNetworkMap
        onTick={setTick}
        onReady={() => setReady(true)}
        userPaused={userPaused}
        emphasisRouteIds={emphasisRouteIds}
      />

      {/* Floating UI — fades in after the entrance sequence settles */}
      <div
        className={cn(
          'pointer-events-none absolute inset-0 transition-opacity duration-700 ease-premium',
          ready ? 'opacity-100' : 'opacity-0',
        )}
      >
        {/* Activity chip + pause (top-start) */}
        <div className="pointer-events-auto absolute start-1 top-0 flex items-center gap-2 sm:start-2">
          <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card/90 px-3 py-1.5 text-[0.7rem] font-semibold text-muted-foreground shadow-xs backdrop-blur-sm">
            <span className={cn('inline-block h-1.5 w-1.5 rounded-full', userPaused ? 'bg-muted-foreground' : 'bg-success')} />
            <span className="uppercase tracking-[0.08em]">{t('activityLabel')}</span>
            <span className="hidden text-muted-foreground/80 sm:inline" dir="ltr">
              {t('activityValues', { locations: n(locationCount), routes: n(tick?.activeCount ?? 0) })}
            </span>
          </span>
          <button
            type="button"
            onClick={() => setUserPaused((v) => !v)}
            aria-label={userPaused ? t('resume') : t('pause')}
            title={userPaused ? t('resume') : t('pause')}
            className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-border bg-card/90 text-muted-foreground shadow-xs backdrop-blur-sm transition-colors hover:text-foreground"
          >
            {userPaused ? <Play className="h-3.5 w-3.5" /> : <Pause className="h-3.5 w-3.5" />}
          </button>
        </div>

        {/* Desktop side panel — current connections */}
        <aside className="pointer-events-auto absolute end-1 top-8 hidden w-64 rounded-2xl border border-border bg-card/95 p-4 shadow-md backdrop-blur-sm lg:block">
          <p className="text-[0.65rem] font-bold uppercase tracking-[0.1em] tracking-wide text-muted-foreground">
            {t('panelTitle')}
          </p>
          <ul className="mt-3 space-y-2.5">
            {(tick?.transfers ?? []).map((tr) => (
              <TransferRow key={tr.id} tr={tr} />
            ))}
            {(!tick || tick.transfers.length === 0) && (
              <li className="text-xs text-muted-foreground">—</li>
            )}
          </ul>
        </aside>

        {/* Legend (bottom-start, collapsible; collapsed by default) */}
        <div className="pointer-events-auto absolute bottom-0 start-1 sm:start-2">
          <button
            type="button"
            onClick={() => setLegendOpen((v) => !v)}
            aria-expanded={legendOpen}
            className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card/90 px-3 py-1.5 text-[0.7rem] font-semibold text-muted-foreground shadow-xs backdrop-blur-sm transition-colors hover:text-foreground"
          >
            {t('legend')}
            <ChevronDown className={cn('h-3 w-3 transition-transform', legendOpen && 'rotate-180')} />
          </button>
          {legendOpen && (
            <div className="mt-2 space-y-1.5 rounded-xl border border-border bg-card/95 p-3 text-[0.7rem] text-muted-foreground shadow-md backdrop-blur-sm">
              <LegendRow dot="h-2.5 w-2.5 rounded-full bg-primary ring-2 ring-primary/20" label={t('legendHub')} />
              <LegendRow dot="h-2 w-2 rounded-full bg-primary/70" label={t('legendRegional')} />
              <LegendRow dot="h-px w-4 bg-primary/30" label={t('legendLine')} />
              <LegendRow dot="h-0.5 w-4 rounded bg-primary" label={t('legendActive')} />
            </div>
          )}
        </div>
      </div>

      {/* Mobile: connections list below the map */}
      <div
        className={cn(
          'mt-4 transition-opacity duration-700 lg:hidden',
          ready ? 'opacity-100' : 'opacity-0',
        )}
      >
        <p className="text-[0.65rem] font-bold uppercase tracking-[0.1em] text-muted-foreground">
          {t('panelTitle')}
        </p>
        <ul className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
          {(tick?.transfers ?? []).slice(0, 4).map((tr) => (
            <TransferRow key={tr.id} tr={tr} card />
          ))}
        </ul>
      </div>
    </div>
  );
}

function TransferRow({ tr, card = false }: { tr: TransferInfo; card?: boolean }) {
  return (
    <li
      className={cn(
        'flex items-center gap-2 text-xs font-medium animate-fade-in',
        card && 'rounded-xl border border-border bg-card px-3 py-2',
      )}
      dir="ltr"
    >
      <Flag code={tr.from.countryCode} />
      <span className="truncate">{tr.from.city}</span>
      <ArrowRight className="h-3 w-3 shrink-0 text-primary" />
      <Flag code={tr.to.countryCode} />
      <span className="truncate">{tr.to.city}</span>
    </li>
  );
}

function Flag({ code }: { code: string }) {
  return (
    <span className="inline-flex h-5 w-5 shrink-0 items-center justify-center overflow-hidden rounded-full border border-border bg-surface text-[0.65rem] leading-none">
      {flagEmoji(code) || code}
    </span>
  );
}

function LegendRow({ dot, label }: { dot: string; label: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className={cn('inline-block shrink-0', dot)} />
      {label}
    </div>
  );
}
