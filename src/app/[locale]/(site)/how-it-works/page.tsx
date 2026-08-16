import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { PageHero } from '@/components/layout/page-hero';
import { HowItWorks } from '@/components/home/how-it-works';
import { ComplianceSection } from '@/components/home/compliance-section';
import { FinalCta } from '@/components/home/final-cta';

export async function generateMetadata({
  params,
}: {
  params: { locale: string };
}): Promise<Metadata> {
  const { locale } = params;
  const t = await getTranslations({ locale, namespace: 'howItWorks' });
  return { title: t('title'), description: t('subtitle'), alternates: { canonical: '/how-it-works' } };
}

export default async function HowItWorksPage({
  params,
}: {
  params: { locale: string };
}) {
  const { locale } = params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: 'howItWorks' });
  const tn = await getTranslations({ locale, namespace: 'nav' });

  return (
    <>
      <PageHero
        eyebrow={t('eyebrow')}
        title={t('title')}
        subtitle={t('subtitle')}
        breadcrumb={[{ label: tn('home'), href: '/' }, { label: tn('howItWorks') }]}
      />
      <HowItWorks />
      <ComplianceSection />
      <FinalCta />
    </>
  );
}
