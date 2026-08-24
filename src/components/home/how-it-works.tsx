import { useTranslations } from 'next-intl';
import { Section, SectionHeading } from '@/components/ui/section';
import { Reveal } from '@/components/ui/reveal';

const STEPS = ['step1', 'step2', 'step3', 'step4'] as const;

/** Four big friendly numbered steps — typography does the work. */
export function HowItWorks() {
  const t = useTranslations('howItWorks');

  return (
    <Section>
      <SectionHeading eyebrow={t('eyebrow')} title={t('title')} subtitle={t('subtitle')} />

      <div className="mt-12 grid grid-cols-1 gap-x-8 gap-y-10 sm:grid-cols-2 lg:grid-cols-4">
        {STEPS.map((key, i) => (
          <Reveal key={key} delay={i * 0.08}>
            <div>
              <span className="text-5xl font-extrabold tracking-tight text-primary/25 sm:text-6xl">
                {i + 1}
              </span>
              <h3 className="mt-4 text-lg font-bold leading-snug">{t(`${key}Title`)}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{t(`${key}Body`)}</p>
            </div>
          </Reveal>
        ))}
      </div>
    </Section>
  );
}
