import { useTranslations } from 'next-intl';
import { ShieldCheck, ScanSearch, FileSearch, Lock, ArrowRight } from 'lucide-react';
import { Section } from '@/components/ui/section';
import { Reveal } from '@/components/ui/reveal';
import { Button } from '@/components/ui/button';
import { Link } from '@/i18n/navigation';

const POINTS = [
  { icon: ScanSearch, key: 'point1' },
  { icon: ShieldCheck, key: 'point2' },
  { icon: FileSearch, key: 'point3' },
  { icon: Lock, key: 'point4' },
] as const;

export function ComplianceSection({ showStatement = false }: { showStatement?: boolean }) {
  const t = useTranslations('compliance');

  return (
    <Section surface="grid">
      <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-2">
        <Reveal>
          <div>
            <p className="eyebrow mb-3">{t('eyebrow')}</p>
            <h2 className="text-h1 font-semibold text-balance">{t('title')}</h2>
            <p className="mt-4 text-base text-muted-foreground">{t('subtitle')}</p>

            {showStatement && (
              <div className="mt-8 rounded-xl border border-primary/20 bg-primary/5 p-4">
                <p className="text-sm leading-relaxed text-foreground">{t('statement')}</p>
              </div>
            )}

            <Button asChild variant="outline" size="lg" className="mt-6">
              <Link href="/compliance">
                {t('cta')}
                <ArrowRight className="h-4 w-4 rtl:rotate-180" />
              </Link>
            </Button>
          </div>
        </Reveal>

        <Reveal delay={0.1}>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {POINTS.map((p) => {
              const Icon = p.icon;
              return (
                <div key={p.key} className="surface-card p-5">
                  <span className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-accent/20 bg-accent/10 text-accent">
                    <Icon className="h-5 w-5" strokeWidth={1.75} />
                  </span>
                  <p className="mt-4 text-sm font-medium">{t(p.key)}</p>
                </div>
              );
            })}
          </div>
        </Reveal>
      </div>
    </Section>
  );
}
