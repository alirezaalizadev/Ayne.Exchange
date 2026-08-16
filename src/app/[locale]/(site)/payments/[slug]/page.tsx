import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { ArrowRight, ShieldCheck } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import { routing } from '@/i18n/routing';
import { paymentLandings, paymentLandingBySlug } from '@/lib/config/payments';
import { Section } from '@/components/ui/section';
import { PageHero } from '@/components/layout/page-hero';
import { Button } from '@/components/ui/button';
import { Reveal } from '@/components/ui/reveal';
import { ServiceCard } from '@/components/services/service-card';
import { services } from '@/lib/config/services';
import { BreadcrumbJsonLd } from '@/components/seo/json-ld';

export function generateStaticParams() {
  return routing.locales.flatMap((locale) =>
    paymentLandings.map((p) => ({ locale, slug: p.slug })),
  );
}

export async function generateMetadata({
  params,
}: {
  params: { locale: string; slug: string };
}): Promise<Metadata> {
  const { slug } = params;
  const landing = paymentLandingBySlug(slug);
  if (!landing) return {};
  return {
    title: landing.title,
    description: landing.intro,
    alternates: { canonical: `/payments/${slug}` },
  };
}

export default async function PaymentLandingPage({
  params,
}: {
  params: { locale: string; slug: string };
}) {
  const { locale, slug } = params;
  setRequestLocale(locale);
  const landing = paymentLandingBySlug(slug);
  if (!landing) notFound();

  const t = await getTranslations({ locale, namespace: 'servicePage' });
  const tp = await getTranslations({ locale, namespace: 'paymentsPage' });
  const tn = await getTranslations({ locale, namespace: 'nav' });

  const workflow = [t('workflow1'), t('workflow2'), t('workflow3'), t('workflow4')];
  const related = services.filter((s) => ['swift', 'sepa', 'business'].includes(s.key));

  return (
    <>
      <BreadcrumbJsonLd
        items={[
          { name: tn('home'), url: '/' },
          { name: tn('payments'), url: '/payments' },
          { name: landing.title, url: `/payments/${slug}` },
        ]}
      />
      <PageHero
        eyebrow={landing.region}
        title={landing.title}
        subtitle={landing.intro}
        breadcrumb={[
          { label: tn('home'), href: '/' },
          { label: tn('payments'), href: '/payments' },
          { label: landing.title },
        ]}
      >
        <Button asChild variant="cta" size="lg">
          <Link href="/request-quote">
            {t('requestQuote')}
            <ArrowRight className="h-4 w-4 rtl:rotate-180" />
          </Link>
        </Button>
      </PageHero>

      <Section>
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-2">
          <Reveal>
            <div>
              <h2 className="text-h2 font-semibold">{t('workflowTitle')}</h2>
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
            <div className="rounded-xl border border-primary/20 bg-primary/5 p-6">
              <div className="flex items-start gap-3">
                <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                <p className="text-xs leading-relaxed text-muted-foreground">{tp('disclaimer')}</p>
              </div>
            </div>
          </Reveal>
        </div>
      </Section>

      <Section className="bg-surface/40">
        <h2 className="text-h2 font-semibold">{t('relatedTitle')}</h2>
        <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
          {related.map((s) => (
            <ServiceCard key={s.key} service={s} />
          ))}
        </div>
      </Section>
    </>
  );
}
