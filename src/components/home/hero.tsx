import { getTranslations } from 'next-intl/server';
import { ArrowRight } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import { Button } from '@/components/ui/button';
import { Hero3D } from '@/components/three/hero-3d';

/**
 * Hero: massive headline + CTAs on the left (server-rendered, interactive
 * immediately — always the LCP), the AYNE FINANCIAL CORE 3D sculpture on the
 * right. The sculpture is decorative, lazy-loaded, and never blocks text.
 */
export async function Hero() {
  const t = await getTranslations('hero');

  return (
    <section className="relative overflow-hidden">
      {/* subtle radial glow + faint grid behind the object (token-driven) */}
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
        <div
          className="absolute end-[-5%] top-1/2 h-[720px] w-[720px] -translate-y-1/2 rounded-full"
          style={{ background: 'radial-gradient(closest-side, hsl(var(--primary) / 0.08), transparent 72%)' }}
        />
        <div
          className="absolute end-0 top-0 h-full w-1/2 opacity-[0.5]"
          style={{
            backgroundImage:
              'linear-gradient(hsl(var(--border) / 0.55) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--border) / 0.55) 1px, transparent 1px)',
            backgroundSize: '56px 56px',
            maskImage: 'radial-gradient(70% 70% at 60% 50%, black, transparent)',
            WebkitMaskImage: 'radial-gradient(70% 70% at 60% 50%, black, transparent)',
          }}
        />
      </div>

      <div className="container grid grid-cols-1 items-center gap-8 py-14 sm:py-16 lg:grid-cols-12 lg:gap-6 lg:py-20">
        {/* Headline — renders immediately, never waits for the scene */}
        <div className="relative z-10 lg:col-span-6">
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

        {/* AYNE FINANCIAL CORE — large, unboxed, slight edge bleed */}
        <div className="relative h-[340px] sm:h-[420px] lg:col-span-6 lg:h-[560px] lg:-me-8 xl:h-[640px] xl:-me-14">
          <Hero3D />
        </div>
      </div>
    </section>
  );
}
