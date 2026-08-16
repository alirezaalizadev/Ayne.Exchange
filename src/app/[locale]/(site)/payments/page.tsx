import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { ArrowRight } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import { Section } from '@/components/ui/section';
import { PageHero } from '@/components/layout/page-hero';
import { paymentLandings } from '@/lib/config/payments';

export async function generateMetadata({
  params,
}: {
  params: { locale: string };
}): Promise<Metadata> {
  const { locale } = params;
  const t = await getTranslations({ locale, namespace: 'paymentsPage' });
  return { title: t('title'), description: t('subtitle'), alternates: { canonical: '/payments' } };
}

export default async function PaymentsIndexPage({
  params,
}: {
  params: { locale: string };
}) {
  const { locale } = params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: 'paymentsPage' });
  const tn = await getTranslations({ locale, namespace: 'nav' });

  return (
    <>
      <PageHero
        eyebrow={t('eyebrow')}
        title={t('title')}
        subtitle={t('subtitle')}
        breadcrumb={[{ label: tn('home'), href: '/' }, { label: tn('payments') }]}
      />
      <Section>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {paymentLandings.map((p) => (
            <Link
              key={p.slug}
              href={`/payments/${p.slug}`}
              className="group surface-card p-6 transition-all duration-base ease-premium hover:-translate-y-1 hover:border-primary/30 hover:shadow-lg"
            >
              <span className="text-xs font-medium uppercase tracking-wide text-primary">{p.region}</span>
              <h3 className="mt-2 text-h3 font-semibold">{p.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{p.intro}</p>
              <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-primary">
                {tn('services')}
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1 rtl:rotate-180" />
              </span>
            </Link>
          ))}
        </div>
        <p className="mt-6 text-xs text-muted-foreground/70">{t('disclaimer')}</p>
      </Section>
    </>
  );
}
