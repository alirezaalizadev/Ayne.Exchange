import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { PageHero } from '@/components/layout/page-hero';
import { ComplianceSection } from '@/components/home/compliance-section';
import { HowItWorks } from '@/components/home/how-it-works';

export async function generateMetadata({
  params,
}: {
  params: { locale: string };
}): Promise<Metadata> {
  const { locale } = params;
  const t = await getTranslations({ locale, namespace: 'compliance' });
  return { title: t('title'), description: t('subtitle'), alternates: { canonical: '/compliance' } };
}

export default async function CompliancePage({
  params,
}: {
  params: { locale: string };
}) {
  const { locale } = params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: 'compliance' });
  const tn = await getTranslations({ locale, namespace: 'nav' });

  return (
    <>
      <PageHero
        eyebrow={t('eyebrow')}
        title={t('title')}
        subtitle={t('subtitle')}
        breadcrumb={[{ label: tn('home'), href: '/' }, { label: tn('compliance') }]}
      />
      <ComplianceSection showStatement />
      <HowItWorks />
    </>
  );
}
