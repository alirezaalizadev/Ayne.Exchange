import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { services } from '@/lib/config/services';
import { Section } from '@/components/ui/section';
import { PageHero } from '@/components/layout/page-hero';
import { ServiceCard } from '@/components/services/service-card';

export async function generateMetadata({
  params,
}: {
  params: { locale: string };
}): Promise<Metadata> {
  const { locale } = params;
  const t = await getTranslations({ locale, namespace: 'services' });
  return { title: t('title'), description: t('subtitle'), alternates: { canonical: '/services' } };
}

export default async function ServicesPage({
  params,
}: {
  params: { locale: string };
}) {
  const { locale } = params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: 'services' });
  const tn = await getTranslations({ locale, namespace: 'nav' });

  return (
    <>
      <PageHero
        eyebrow={t('eyebrow')}
        title={t('title')}
        subtitle={t('subtitle')}
        breadcrumb={[{ label: tn('home'), href: '/' }, { label: tn('services') }]}
      />
      <Section>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {services.map((s) => (
            <ServiceCard key={s.key} service={s} />
          ))}
        </div>
      </Section>
    </>
  );
}
