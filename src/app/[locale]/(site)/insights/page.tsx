import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Newspaper } from 'lucide-react';
import { Section } from '@/components/ui/section';
import { PageHero } from '@/components/layout/page-hero';

export async function generateMetadata({
  params,
}: {
  params: { locale: string };
}): Promise<Metadata> {
  const { locale } = params;
  const t = await getTranslations({ locale, namespace: 'insightsPage' });
  return { title: t('title'), description: t('subtitle'), alternates: { canonical: '/insights' } };
}

export default async function InsightsPage({
  params,
}: {
  params: { locale: string };
}) {
  const { locale } = params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: 'insightsPage' });
  const tn = await getTranslations({ locale, namespace: 'nav' });

  // Blog posts are served from the DB once the CMS phase is wired. Until an
  // admin publishes real articles, we show an honest empty state (no filler).
  const posts: unknown[] = [];

  return (
    <>
      <PageHero
        eyebrow={t('eyebrow')}
        title={t('title')}
        subtitle={t('subtitle')}
        breadcrumb={[{ label: tn('home'), href: '/' }, { label: tn('insights') }]}
      />
      <Section>
        {posts.length === 0 ? (
          <div className="mx-auto max-w-md rounded-2xl border border-dashed border-border bg-surface/50 p-10 text-center">
            <span className="mx-auto inline-flex h-12 w-12 items-center justify-center rounded-xl border border-border bg-surface-raised text-muted-foreground">
              <Newspaper className="h-5 w-5" />
            </span>
            <h2 className="mt-5 text-h3 font-semibold">{t('emptyTitle')}</h2>
            <p className="mt-2 text-sm text-muted-foreground">{t('emptyBody')}</p>
          </div>
        ) : null}
      </Section>
    </>
  );
}
