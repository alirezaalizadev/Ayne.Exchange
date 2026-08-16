import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { MessageCircle, Send, Mail, ArrowRight } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import { Section } from '@/components/ui/section';
import { PageHero } from '@/components/layout/page-hero';
import { Button } from '@/components/ui/button';
import { siteConfig, whatsappLink, telegramLink } from '@/lib/config/site';

export async function generateMetadata({
  params,
}: {
  params: { locale: string };
}): Promise<Metadata> {
  const { locale } = params;
  const t = await getTranslations({ locale, namespace: 'contactPage' });
  return { title: t('title'), description: t('subtitle'), alternates: { canonical: '/contact' } };
}

export default async function ContactPage({
  params,
}: {
  params: { locale: string };
}) {
  const { locale } = params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: 'contactPage' });
  const tn = await getTranslations({ locale, namespace: 'nav' });

  const channels = [
    siteConfig.contact.whatsapp && {
      icon: MessageCircle,
      title: t('whatsappTitle'),
      desc: t('whatsappDesc'),
      href: whatsappLink(siteConfig.contact.whatsapp, 'Hello Ayne Exchange'),
      accent: 'text-success',
    },
    siteConfig.contact.telegram && {
      icon: Send,
      title: t('telegramTitle'),
      desc: t('telegramDesc'),
      href: telegramLink(siteConfig.contact.telegram),
      accent: 'text-primary',
    },
    siteConfig.contact.email && {
      icon: Mail,
      title: t('emailTitle'),
      desc: t('emailDesc'),
      href: `mailto:${siteConfig.contact.email}`,
      accent: 'text-accent',
    },
  ].filter(Boolean) as {
    icon: typeof Mail;
    title: string;
    desc: string;
    href: string;
    accent: string;
  }[];

  return (
    <>
      <PageHero
        eyebrow={t('eyebrow')}
        title={t('title')}
        subtitle={t('subtitle')}
        breadcrumb={[{ label: tn('home'), href: '/' }, { label: tn('contact') }]}
      />
      <Section>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {channels.map((c) => {
            const Icon = c.icon;
            return (
              <a
                key={c.title}
                href={c.href}
                target="_blank"
                rel="noopener noreferrer"
                className="group surface-card flex flex-col p-6 transition-all duration-base ease-premium hover:-translate-y-1 hover:border-primary/30 hover:shadow-lg"
              >
                <span className={`inline-flex h-12 w-12 items-center justify-center rounded-xl border border-border bg-surface-raised ${c.accent}`}>
                  <Icon className="h-5 w-5" />
                </span>
                <h3 className="mt-5 text-h3 font-semibold">{c.title}</h3>
                <p className="mt-2 flex-1 text-sm text-muted-foreground">{c.desc}</p>
                <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-primary">
                  {t('open')}
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1 rtl:rotate-180" />
                </span>
              </a>
            );
          })}
        </div>

        <div className="mt-6 overflow-hidden rounded-2xl border border-border bg-gradient-to-br from-primary/10 to-accent/5 p-8 sm:p-10">
          <div className="flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-center">
            <div>
              <h2 className="text-h2 font-semibold">{t('quoteTitle')}</h2>
              <p className="mt-2 max-w-md text-muted-foreground">{t('quoteDesc')}</p>
            </div>
            <Button asChild variant="cta" size="xl" className="shrink-0">
              <Link href="/request-quote">
                {t('quoteCta')}
                <ArrowRight className="h-4 w-4 rtl:rotate-180" />
              </Link>
            </Button>
          </div>
        </div>
      </Section>
    </>
  );
}
