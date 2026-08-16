import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { ArrowRight, FileText, ShieldCheck } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import { routing } from '@/i18n/routing';
import { services, serviceBySlug } from '@/lib/config/services';
import { Button } from '@/components/ui/button';
import { Section } from '@/components/ui/section';
import { PageHero } from '@/components/layout/page-hero';
import { ServiceIcon } from '@/components/services/service-icon';
import { ServiceCard } from '@/components/services/service-card';
import { Reveal } from '@/components/ui/reveal';
import { BreadcrumbJsonLd, ServiceJsonLd } from '@/components/seo/json-ld';

export function generateStaticParams() {
  return routing.locales.flatMap((locale) =>
    services.map((s) => ({ locale, slug: s.slug })),
  );
}

export async function generateMetadata({
  params,
}: {
  params: { locale: string; slug: string };
}): Promise<Metadata> {
  const { locale, slug } = params;
  const service = serviceBySlug(slug);
  if (!service) return {};
  const t = await getTranslations({ locale, namespace: 'services' });
  return {
    title: t(`${service.key}.name`),
    description: t(`${service.key}.short`),
    alternates: { canonical: `/services/${slug}` },
  };
}

export default async function ServiceDetailPage({
  params,
}: {
  params: { locale: string; slug: string };
}) {
  const { locale, slug } = params;
  setRequestLocale(locale);
  const service = serviceBySlug(slug);
  if (!service) notFound();

  const t = await getTranslations({ locale, namespace: 'services' });
  const tp = await getTranslations({ locale, namespace: 'servicePage' });
  const tn = await getTranslations({ locale, namespace: 'nav' });

  const name = t(`${service.key}.name`);
  const workflow = [tp('workflow1'), tp('workflow2'), tp('workflow3'), tp('workflow4')];
  const related = services.filter((s) => s.key !== service.key).slice(0, 3);

  return (
    <>
      <BreadcrumbJsonLd
        items={[
          { name: tn('home'), url: '/' },
          { name: tn('services'), url: '/services' },
          { name, url: `/services/${slug}` },
        ]}
      />
      <ServiceJsonLd name={name} description={t(`${service.key}.short`)} url={`/services/${slug}`} />

      <PageHero
        eyebrow={tn('services')}
        title={name}
        subtitle={t(`${service.key}.short`)}
        breadcrumb={[
          { label: tn('home'), href: '/' },
          { label: tn('services'), href: '/services' },
          { label: name },
        ]}
      >
        <div className="flex flex-wrap gap-3">
          <Button asChild variant="cta" size="lg">
            <Link href={`/request-quote?service=${service.key}`}>
              {tp('requestQuote')}
              <ArrowRight className="h-4 w-4 rtl:rotate-180" />
            </Link>
          </Button>
          <ServiceIcon name={service.icon} accent={service.accent} className="h-11 w-11" />
        </div>
      </PageHero>

      {/* Workflow */}
      <Section>
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-2">
          <Reveal>
            <div>
              <h2 className="text-h2 font-semibold">{tp('workflowTitle')}</h2>
              <ol className="mt-6 space-y-4">
                {workflow.map((w, i) => (
                  <li key={i} className="flex gap-4">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-primary/30 bg-primary/10 font-mono text-xs font-semibold text-primary">
                      {i + 1}
                    </span>
                    <p className="pt-1 text-sm leading-relaxed text-muted-foreground">{w}</p>
                  </li>
                ))}
              </ol>
            </div>
          </Reveal>

          <Reveal delay={0.1}>
            <div className="space-y-4">
              <div className="surface-card p-6">
                <div className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-primary" />
                  <h3 className="text-h3 font-semibold">{tp('documentationTitle')}</h3>
                </div>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                  {tp('documentationBody')}
                </p>
              </div>
              <div className="rounded-xl border border-primary/20 bg-primary/5 p-6">
                <div className="flex items-start gap-3">
                  <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                  <p className="text-xs leading-relaxed text-muted-foreground">{tp('disclaimer')}</p>
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </Section>

      {/* Related */}
      <Section className="bg-surface/40">
        <h2 className="text-h2 font-semibold">{tp('relatedTitle')}</h2>
        <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
          {related.map((s) => (
            <ServiceCard key={s.key} service={s} />
          ))}
        </div>
      </Section>
    </>
  );
}
