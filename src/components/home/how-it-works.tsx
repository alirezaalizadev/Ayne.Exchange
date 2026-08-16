import { useTranslations } from 'next-intl';
import { FileText, ShieldCheck, FileCheck2, Handshake } from 'lucide-react';
import { Section, SectionHeading } from '@/components/ui/section';
import { Reveal } from '@/components/ui/reveal';

const STEPS = [
  { n: '01', icon: FileText, key: 'step1' },
  { n: '02', icon: ShieldCheck, key: 'step2' },
  { n: '03', icon: FileCheck2, key: 'step3' },
  { n: '04', icon: Handshake, key: 'step4' },
] as const;

export function HowItWorks() {
  const t = useTranslations('howItWorks');

  return (
    <Section className="relative overflow-hidden">
      <SectionHeading eyebrow={t('eyebrow')} title={t('title')} subtitle={t('subtitle')} />

      <div className="relative mt-14 grid grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-4">
        {/* connector line (desktop) */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-7 hidden h-px lg:block"
          style={{
            background:
              'linear-gradient(90deg, transparent, hsl(var(--border)) 10%, hsl(var(--border)) 90%, transparent)',
          }}
        />
        {STEPS.map((step, i) => {
          const Icon = step.icon;
          return (
            <Reveal key={step.n} delay={i * 0.1}>
              <div className="relative flex flex-col items-start">
                <div className="relative z-10 flex h-14 w-14 items-center justify-center rounded-2xl border border-border bg-surface shadow-sm">
                  <Icon className="h-6 w-6 text-primary" strokeWidth={1.75} />
                  <span className="absolute -end-2 -top-2 rounded-full bg-primary px-2 py-0.5 font-mono text-[0.65rem] font-semibold text-primary-foreground">
                    {step.n}
                  </span>
                </div>
                <h3 className="mt-5 text-h3 font-semibold">{t(`${step.key}Title`)}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {t(`${step.key}Body`)}
                </p>
              </div>
            </Reveal>
          );
        })}
      </div>
    </Section>
  );
}
