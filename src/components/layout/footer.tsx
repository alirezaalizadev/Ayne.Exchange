import { useTranslations } from 'next-intl';
import {
  Send,
  MessageCircle,
  ShieldCheck,
  Layers,
  ArrowLeftRight,
  Building2,
  Scale,
  type LucideIcon,
} from 'lucide-react';
import { Link } from '@/i18n/navigation';
import { services } from '@/lib/config/services';
import { siteConfig, whatsappLink, telegramLink } from '@/lib/config/site';
import { Logo } from '@/components/brand/logo';

export function Footer() {
  const t = useTranslations('footer');
  const tn = useTranslations('nav');
  const ts = useTranslations('services');
  const year = new Date().getFullYear();

  const payments = [
    { label: 'Business Payments to Europe', slug: 'business-payments-europe' },
    { label: 'Business Payments to Türkiye', slug: 'business-payments-turkiye' },
    { label: 'Payments to China', slug: 'payments-china' },
    { label: 'Payments to UAE', slug: 'payments-uae' },
  ];

  return (
    <footer className="relative border-t border-border bg-surface">
      <div className="container py-14">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-3 lg:grid-cols-6">
          {/* Brand */}
          <div className="col-span-2 lg:col-span-2">
            <Link href="/" aria-label="Ayne Exchange home">
              <Logo idSuffix="footer" />
            </Link>
            <p className="mt-4 max-w-xs text-sm text-muted-foreground">{t('tagline')}</p>
            <div className="mt-5 flex items-center gap-2">
              {siteConfig.contact.whatsapp && (
                <a
                  href={whatsappLink(siteConfig.contact.whatsapp)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-border text-muted-foreground transition-colors hover:text-foreground hover:border-primary/40"
                  aria-label={t('whatsapp')}
                >
                  <MessageCircle className="h-4 w-4" />
                </a>
              )}
              {siteConfig.contact.telegram && (
                <a
                  href={telegramLink(siteConfig.contact.telegram)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-border text-muted-foreground transition-colors hover:text-foreground hover:border-primary/40"
                  aria-label={t('telegram')}
                >
                  <Send className="h-4 w-4" />
                </a>
              )}
            </div>
          </div>

          {/* Services */}
          <FooterCol title={t('services')} icon={Layers}>
            {services.slice(0, 6).map((s) => (
              <FooterLink key={s.key} href={`/services/${s.slug}`}>
                {ts(`${s.key}.name`)}
              </FooterLink>
            ))}
          </FooterCol>

          {/* Payments */}
          <FooterCol title={t('payments')} icon={ArrowLeftRight}>
            {payments.map((p) => (
              <FooterLink key={p.slug} href={`/payments/${p.slug}`}>
                {p.label}
              </FooterLink>
            ))}
          </FooterCol>

          {/* Company */}
          <FooterCol title={t('company')} icon={Building2}>
            <FooterLink href="/about">{tn('about')}</FooterLink>
            <FooterLink href="/how-it-works">{tn('howItWorks')}</FooterLink>
            <FooterLink href="/compliance">{tn('compliance')}</FooterLink>
            <FooterLink href="/insights">{tn('insights')}</FooterLink>
            <FooterLink href="/contact">{tn('contact')}</FooterLink>
          </FooterCol>

          {/* Legal */}
          <FooterCol title={t('legal')} icon={Scale}>
            <FooterLink href="/rates">{tn('rates')}</FooterLink>
            <FooterLink href="/privacy">{t('privacy')}</FooterLink>
            <FooterLink href="/terms">{t('terms')}</FooterLink>
          </FooterCol>
        </div>

        {/* Disclaimer */}
        <div className="mt-12 rounded-xl border border-border bg-surface-raised p-4">
          <div className="flex items-start gap-3">
            <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
            <p className="text-xs leading-relaxed text-muted-foreground">
              <span className="font-medium text-foreground">{t('disclaimerTitle')}: </span>
              {t('disclaimer')}
            </p>
          </div>
        </div>

        <div className="mt-8 flex flex-col items-center justify-between gap-3 border-t border-border pt-6 text-xs text-muted-foreground sm:flex-row">
          <p>© {year} {siteConfig.name}. {t('rights')}</p>
          <p>{siteConfig.tagline}</p>
        </div>
      </div>
    </footer>
  );
}

function FooterCol({
  title,
  icon: Icon,
  children,
}: {
  title: string;
  icon?: LucideIcon;
  children: React.ReactNode;
}) {
  return (
    <div>
      <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold">
        {Icon && <Icon className="h-4 w-4 text-primary" strokeWidth={1.75} />}
        {title}
      </h3>
      <ul className="space-y-2.5">{children}</ul>
    </div>
  );
}

function FooterLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <li>
      <Link
        href={href}
        className="text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        {children}
      </Link>
    </li>
  );
}
