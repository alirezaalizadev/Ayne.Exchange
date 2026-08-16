import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Lock, ShieldCheck, Building2, Info } from 'lucide-react';
import { Section } from '@/components/ui/section';
import { PageHero } from '@/components/layout/page-hero';
import { Reveal } from '@/components/ui/reveal';
import { StatsSection } from '@/components/home/stats-section';
import { FinalCta } from '@/components/home/final-cta';

export async function generateMetadata({
  params,
}: {
  params: { locale: string };
}): Promise<Metadata> {
  const { locale } = params;
  const t = await getTranslations({ locale, namespace: 'aboutPage' });
  return { title: t('title'), description: t('subtitle'), alternates: { canonical: '/about' } };
}

export default async function AboutPage({
  params,
}: {
  params: { locale: string };
}) {
  const { locale } = params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: 'aboutPage' });
  const tn = await getTranslations({ locale, namespace: 'nav' });

  const values = [
    { icon: Lock, title: t('value1Title'), body: t('value1Body') },
    { icon: ShieldCheck, title: t('value2Title'), body: t('value2Body') },
    { icon: Building2, title: t('value3Title'), body: t('value3Body') },
  ];

  return (
    <>
      <PageHero
        eyebrow={t('eyebrow')}
        title={t('title')}
        subtitle={t('subtitle')}
        breadcrumb={[{ label: tn('home'), href: '/' }, { label: tn('about') }]}
      />

      <Section>
        <div className="mx-auto max-w-3xl space-y-5 text-base leading-relaxed text-muted-foreground">
          <p>{t('p1')}</p>
          <p>{t('p2')}</p>
          <p>{t('p3')}</p>
        </div>
      </Section>

      <Section className="bg-surface/40 py-14">
        <h2 className="text-h2 font-semibold text-center">{t('valuesTitle')}</h2>
        <div className="mx-auto mt-10 grid max-w-4xl grid-cols-1 gap-4 sm:grid-cols-3">
          {values.map((v, i) => {
            const Icon = v.icon;
            return (
              <Reveal key={v.title} delay={i * 0.08}>
                <div className="surface-card h-full p-6">
                  <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-primary/20 bg-primary/10 text-primary">
                    <Icon className="h-5 w-5" />
                  </span>
                  <h3 className="mt-4 text-h3 font-semibold">{v.title}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">{v.body}</p>
                </div>
              </Reveal>
            );
          })}
        </div>
      </Section>

      <StatsSection />

      <div className="container">
        <div className="mx-auto flex max-w-3xl items-start gap-3 rounded-xl border border-border bg-surface-raised p-4 text-xs text-muted-foreground">
          <Info className="mt-0.5 h-4 w-4 shrink-0" />
          <p>{t('note')}</p>
        </div>
      </div>

      <FinalCta />
    </>
  );
}
