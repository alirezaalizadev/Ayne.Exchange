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
    <div className="relative">
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute inset-x-0 top-0 h-64 bg-radial-glow opacity-70" />
      </div>
      <div className="container max-w-2xl py-16 sm:py-20">
        <div className="mb-8 text-center">
          <h1 className="text-h1 font-semibold">{t('title')}</h1>
          <p className="mx-auto mt-3 max-w-md text-muted-foreground">{t('subtitle')}</p>
        </div>
        <Suspense fallback={<div className="surface-card h-96 animate-pulse" />}>
          <QuoteForm />
        </Suspense>
      </div>
    </div>
  );
}
