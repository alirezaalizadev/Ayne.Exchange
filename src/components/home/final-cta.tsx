import { useTranslations } from 'next-intl';
import { ArrowRight } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import { Button } from '@/components/ui/button';
import { Reveal } from '@/components/ui/reveal';

/** Strong accent-colored closing band: bold white headline, white pill CTA. */
export function FinalCta() {
  const t = useTranslations('finalCta');

  return (
    <section className="bg-primary py-16 text-primary-foreground sm:py-24">
      <div className="container">
        <Reveal>
          <div className="grid grid-cols-1 items-center gap-8 lg:grid-cols-12">
            <div className="lg:col-span-7">
              <h2 className="max-w-[18ch] text-display text-balance text-primary-foreground">
                {t('title')}
              </h2>
              <p className="mt-4 max-w-[32rem] text-lg text-primary-foreground/80">{t('subtitle')}</p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row lg:col-span-4 lg:col-start-9 lg:justify-end">
              <Button
                asChild
                size="xl"
                className="bg-background text-foreground hover:bg-background hover:brightness-95"
              >
                <Link href="/request-quote">
                  {t('primary')}
                  <ArrowRight className="h-4 w-4 rtl:rotate-180" />
                </Link>
              </Button>
              <Button
                asChild
                size="xl"
                variant="ghost"
                className="border-2 border-primary-foreground/40 text-primary-foreground hover:bg-primary-foreground/10"
              >
                <Link href="/contact">{t('secondary')}</Link>
              </Button>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
