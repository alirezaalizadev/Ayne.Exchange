import { useTranslations } from 'next-intl';
import { Section, SectionHeading } from '@/components/ui/section';
import { Reveal } from '@/components/ui/reveal';
import { homeStats } from '@/lib/config/stats';
import { StatCounter } from './stat-counter';

export function StatsSection() {
  const t = useTranslations('stats');

  return (
    <Section>
      <SectionHeading eyebrow={t('eyebrow')} title={t('title')} subtitle={t('subtitle')} />

      <div className="mx-auto mt-12 grid max-w-5xl grid-cols-2 gap-4 lg:grid-cols-4">
        {homeStats.map((s, i) => (
          <Reveal key={s.labelKey} delay={i * 0.08}>
            <div className="surface-card h-full p-6 text-center">
              <div className="font-display text-4xl font-semibold text-gradient sm:text-5xl">
                <StatCounter
                  to={s.to}
                  prefix={s.prefix}
                  suffix={s.suffix}
                  text={s.textKey ? t(s.textKey) : undefined}
                />
              </div>
              <p className="mt-3 text-sm text-muted-foreground">{t(s.labelKey)}</p>
            </div>
          </Reveal>
        ))}
      </div>
    </Section>
  );
}
