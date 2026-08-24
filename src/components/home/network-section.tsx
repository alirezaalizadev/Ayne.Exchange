import { getLocale, getTranslations } from 'next-intl/server';
import { SectionHeading } from '@/components/ui/section';
import { NetworkLazy } from './network-lazy';
import { locations, REGION_COUNT } from '@/lib/config/network-locations';
import { routes, routeById, countryToCity } from '@/lib/config/network-routes';
import { getPublicTransactions } from '@/lib/transactions/service';
import { formatNumber } from '@/lib/format';

/**
 * Global payment network — immersive full-width section. Stat row values come
 * from the network config (visualization metadata only).
 *
 * Transaction-link layer: when published display-transactions match configured
 * corridors, those route ids are passed for gentle emphasis. Purely optional —
 * the map works fully with zero transactions, and an animation never claims to
 * be a live payment.
 */
export async function NetworkSection({ locale: localeProp }: { locale: string }) {
  const t = await getTranslations('network');
  const locale = localeProp || (await getLocale());
  const n = (v: number) => formatNumber(v, locale, { maximumFractionDigits: 0 });

  // Loosely-coupled emphasis routes from published transactions (never required).
  let emphasisRouteIds: string[] = [];
  try {
    const txs = await getPublicTransactions();
    const ids = new Set<string>();
    for (const tx of txs.slice(0, 20)) {
      const a = countryToCity[tx.originCountry];
      const b = countryToCity[tx.destinationCountry];
      if (!a || !b || a === b) continue;
      if (routeById[`${a}-${b}`]) ids.add(`${a}-${b}`);
      else if (routeById[`${b}-${a}`]) ids.add(`${b}-${a}`);
    }
    emphasisRouteIds = [...ids].slice(0, 6);
  } catch {
    /* map must work with zero transaction data */
  }

  const stats = [
    { value: n(locations.length), label: t('statLocations') },
    { value: n(REGION_COUNT), label: t('statRegions') },
    { value: n(routes.length), label: t('statRoutes') },
  ];

  return (
    <section className="relative w-full overflow-hidden bg-surface">
      {/* Radial illumination behind the network's centre of gravity + vignette */}
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div
          className="absolute left-1/2 top-[46%] h-[900px] w-[1300px] -translate-x-1/2 -translate-y-1/2 rounded-full"
          style={{ background: 'radial-gradient(closest-side, hsl(var(--primary) / 0.07), transparent 70%)' }}
        />
        <div
          className="absolute inset-0"
          style={{
            background:
              'linear-gradient(to bottom, hsl(var(--surface)) 0%, transparent 12%, transparent 88%, hsl(var(--surface)) 100%)',
          }}
        />
      </div>

      <div className="container relative pt-16 sm:pt-24 lg:pt-28">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <SectionHeading eyebrow={t('eyebrow')} title={t('title')} subtitle={t('subtitle')} />
          <div className="flex shrink-0 items-center gap-6 pb-1" dir="ltr">
            {stats.map((s) => (
              <div key={s.label} className="text-start rtl:text-end">
                <p className="text-2xl font-extrabold tracking-tight text-foreground">{s.value}</p>
                <p className="text-xs font-medium text-muted-foreground">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Full-width map + floating UI, no card boundary */}
      <div className="relative mx-auto mt-6 w-full max-w-[1600px] px-2 pb-10 sm:mt-10 sm:px-6 lg:pb-14">
        <NetworkLazy locationCount={locations.length} emphasisRouteIds={emphasisRouteIds} />
      </div>
    </section>
  );
}
