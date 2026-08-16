import { setRequestLocale } from 'next-intl/server';
import { getTranslations } from 'next-intl/server';
import type { Metadata } from 'next';
import { Hero } from '@/components/home/hero';
import { CurrencyTicker } from '@/components/home/currency-ticker';
import { StatsSection } from '@/components/home/stats-section';
import { ServicesSection } from '@/components/home/services-section';
import { NetworkSection } from '@/components/home/network-section';
import { CalculatorSection } from '@/components/home/calculator-section';
import { HowItWorks } from '@/components/home/how-it-works';
import { RecentTransactions } from '@/components/home/recent-transactions';
import { ComplianceSection } from '@/components/home/compliance-section';
import { FinalCta } from '@/components/home/final-cta';
import { OrganizationJsonLd } from '@/components/seo/json-ld';

export async function generateMetadata({
  params,
}: {
  params: { locale: string };
}): Promise<Metadata> {
  const { locale } = params;
  const t = await getTranslations({ locale, namespace: 'meta' });
  return {
    title: t('defaultTitle'),
    description: t('defaultDescription'),
    alternates: { canonical: locale === 'en' ? '/' : `/${locale}` },
  };
}

export default async function HomePage({
  params,
}: {
  params: { locale: string };
}) {
  const { locale } = params;
  setRequestLocale(locale);

  return (
    <>
      <OrganizationJsonLd />
      <Hero />
      <CurrencyTicker />
      <StatsSection />
      <ServicesSection />
      <NetworkSection locale={locale} />
      <CalculatorSection />
      <RecentTransactions />
      <HowItWorks />
      <ComplianceSection />
      <FinalCta />
    </>
  );
}
