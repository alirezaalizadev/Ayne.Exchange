import { Suspense } from 'react';
import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { QuoteForm } from '@/components/quote/quote-form';

export async function generateMetadata({
  params,
}: {
  params: { locale: string };
}): Promise<Metadata> {
  const { locale } = params;
  const t = await getTranslations({ locale, namespace: 'quote' });
  return { title: t('title'), description: t('subtitle') };
}

export default async function RequestQuotePage({
  params,
}: {
  params: { locale: string };
}) {
  const { locale } = params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: 'quote' });

  return (
    <div className="bg-surface">
      <div className="container max-w-2xl py-16 sm:py-24">
        <div className="mb-10 text-center">
          <h1 className="text-h1">{t('title')}</h1>
          <p className="mx-auto mt-4 max-w-md text-lg text-muted-foreground">{t('subtitle')}</p>
        </div>
        <Suspense fallback={<div className="surface-card h-96 animate-pulse" />}>
          <QuoteForm />
        </Suspense>
      </div>
    </div>
  );
}
