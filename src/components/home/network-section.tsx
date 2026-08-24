import { getLocale, getTranslations } from 'next-intl/server';
import { SectionHeading } from '@/components/ui/section';
import { GlobalNetworkMap } from './global-network-map';
import { locations, REGION_COUNT } from '@/lib/config/network-locations';
import { routes } from '@/lib/config/network-routes';
import { formatNumber } from '@/lib/format';

/**
 * Global payment network — immersive full-width section. The map blends into
 * the section background (radial illumination + vignette); no card boundary.
 * Stat row values are computed from the network config — visualization
 * metadata only, never transaction claims.
 */
export async function NetworkSection({ locale: localeProp }: { locale: string }) {
  const t = await getTranslations('network');
  const locale = localeProp || (await getLocale());
  const n = (v: number) => formatNumber(v, locale, { maximumFractionDigits: 0 });

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
          {/* Compact stat row — from config */}
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

      {/* Full-width map, no card */}
      <div className="relative mx-auto mt-6 w-full max-w-[1600px] px-2 pb-10 sm:mt-10 sm:px-6 lg:pb-14">
        <GlobalNetworkMap />
      </div>
    </section>
  );
}
