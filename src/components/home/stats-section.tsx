import { useTranslations } from 'next-intl';
import { Section, SectionHeading } from '@/components/ui/section';
import { Reveal } from '@/components/ui/reveal';
import { homeStats } from '@/lib/config/stats';
import { StatCounter } from './stat-counter';

/** Trust figures: huge bold numerals, quiet labels, no boxes. */
export function StatsSection() {
  const t = useTranslations('stats');

  return (
    <Section>
      <SectionHeading eyebrow={t('eyebrow')} title={t('title')} subtitle={t('subtitle')} />

      <div className="mt-12 grid grid-cols-2 gap-x-6 gap-y-10 lg:grid-cols-4">
        {homeStats.map((s, i) => (
          <Reveal key={s.labelKey} delay={i * 0.06}>
            <div>
              <div className="text-4xl font-extrabold tracking-tight text-primary sm:text-5xl lg:text-6xl">
                <StatCounter
                  to={s.to}
                  prefix={s.prefix}
                  suffix={s.suffix}
                  text={s.textKey ? t(s.textKey) : undefined}
                />
              </div>
              <p className="mt-3 max-w-[15rem] text-sm leading-snug text-muted-foreground">{t(s.labelKey)}</p>
            </div>
          </Reveal>
        ))}
      </div>
    </Section>
  );
}
