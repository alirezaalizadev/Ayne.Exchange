import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Info } from 'lucide-react';
import { Section } from '@/components/ui/section';
import { PageHero } from '@/components/layout/page-hero';
import { RateCard } from '@/components/rates/rate-card';
import { ExchangeCalculator } from '@/components/rates/exchange-calculator';
import { getPublicRates, getRatePairs, getRatesUpdatedAt, type RateCategory } from '@/lib/rates/service';

export async function generateMetadata({
  params,
}: {
  params: { locale: string };
}): Promise<Metadata> {
  const { locale } = params;
  const t = await getTranslations({ locale, namespace: 'ratesPage' });
  return { title: t('title'), description: t('subtitle'), alternates: { canonical: '/rates' } };
}

const CATEGORY_ORDER: { key: RateCategory; labelKey: string }[] = [
  { key: 'TRY', labelKey: 'catTRY' },
  { key: 'IRAN', labelKey: 'catIran' },
  { key: 'MAJOR', labelKey: 'catMajor' },
  { key: 'REGIONAL', labelKey: 'catRegional' },
  { key: 'CRYPTO', labelKey: 'catCrypto' },
];

export default async function RatesPage({ params }: { params: { locale: string } }) {
  const { locale } = params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: 'ratesPage' });
  const tn = await getTranslations({ locale, namespace: 'nav' });

  const [rates, pairs, updatedAt] = await Promise.all([getPublicRates(), getRatePairs(), getRatesUpdatedAt()]);
  const hasIran = rates.some((r) => r.category === 'IRAN');

  return (
    <>
      <PageHero
        eyebrow={t('eyebrow')}
        title={t('title')}
        subtitle={t('subtitle')}
        breadcrumb={[{ label: tn('home'), href: '/' }, { label: tn('rates') }]}
      />

      <Section>
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          <div className="space-y-10 lg:col-span-2">
            {rates.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-border bg-surface/50 p-10 text-center text-sm text-muted-foreground">
                {t('empty')}
              </div>
            ) : (
              CATEGORY_ORDER.map(({ key, labelKey }) => {
                const group = rates.filter((r) => r.category === key);
                if (group.length === 0) return null;
                return (
                  <div key={key}>
                    <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                      {t(labelKey)}
                    </h2>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      {group.map((r) => (
                        <RateCard key={r.id} rate={r} locale={locale} />
                      ))}
                    </div>
                  </div>
                );
              })
            )}

            {hasIran && (
              <div className="rounded-xl border border-warning/30 bg-warning/10 p-4">
                <div className="flex items-start gap-3">
                  <Info className="mt-0.5 h-4 w-4 shrink-0 text-warning" />
                  <div>
                    <p className="text-sm font-medium">{t('iranNoteTitle')}</p>
                    <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{t('iranNote')}</p>
                  </div>
                </div>
              </div>
            )}

            <p className="text-xs text-muted-foreground/70">{t('disclaimer')}</p>
          </div>

          <div className="lg:col-span-1">
            <div className="sticky top-24">
              <ExchangeCalculator pairs={pairs} updatedAt={updatedAt} />
            </div>
          </div>
        </div>
      </Section>
    </>
  );
}
