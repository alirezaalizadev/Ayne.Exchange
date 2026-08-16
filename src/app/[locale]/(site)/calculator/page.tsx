import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Section } from '@/components/ui/section';
import { PageHero } from '@/components/layout/page-hero';
import { ExchangeCalculator } from '@/components/rates/exchange-calculator';
import { getRatePairs, getRatesUpdatedAt } from '@/lib/rates/service';

export async function generateMetadata({
  params,
}: {
  params: { locale: string };
}): Promise<Metadata> {
  const { locale } = params;
  const t = await getTranslations({ locale, namespace: 'calculator' });
  return { title: t('title'), description: t('disclaimer'), alternates: { canonical: '/calculator' } };
}

export default async function CalculatorPage({
  params,
}: {
  params: { locale: string };
}) {
  const { locale } = params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: 'calculator' });
  const tn = await getTranslations({ locale, namespace: 'nav' });
  const [pairs, updatedAt] = await Promise.all([getRatePairs(), getRatesUpdatedAt()]);

  return (
    <>
      <PageHero
        eyebrow={t('eyebrow')}
        title={t('title')}
        subtitle={t('disclaimer')}
        breadcrumb={[{ label: tn('home'), href: '/' }, { label: t('title') }]}
      />
      <Section>
        <div className="mx-auto w-full max-w-lg">
          <ExchangeCalculator pairs={pairs} updatedAt={updatedAt} />
        </div>
      </Section>
    </>
  );
}
