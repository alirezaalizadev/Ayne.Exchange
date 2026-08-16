import { useTranslations } from 'next-intl';
import { ArrowRight } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import { Button } from '@/components/ui/button';
import { Reveal } from '@/components/ui/reveal';

export function FinalCta() {
  const t = useTranslations('finalCta');

  return (
    <section className="relative overflow-hidden py-20 sm:py-28">
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-radial-glow opacity-80" />
        <div className="absolute inset-0 grid-texture opacity-50" />
      </div>
      <div className="container">
        <Reveal>
          <div className="mx-auto max-w-2xl rounded-2xl border border-border glass p-8 text-center shadow-lg sm:p-12">
            <h2 className="text-h1 font-semibold text-balance">{t('title')}</h2>
            <p className="mx-auto mt-4 max-w-lg text-base text-muted-foreground">{t('subtitle')}</p>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Button asChild variant="cta" size="xl" className="w-full sm:w-auto">
                <Link href="/request-quote">
                  {t('primary')}
                  <ArrowRight className="h-4 w-4 rtl:rotate-180" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="xl" className="w-full sm:w-auto">
                <Link href="/contact">{t('secondary')}</Link>
              </Button>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
