import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { PageHero } from '@/components/layout/page-hero';
import { Section } from '@/components/ui/section';
import { LegalNotice, LegalBody } from '@/components/legal/legal-notice';

export async function generateMetadata({
  params,
}: {
  params: { locale: string };
}): Promise<Metadata> {
  const { locale } = params;
  const t = await getTranslations({ locale, namespace: 'legal' });
  return { title: t('privacyTitle'), robots: { index: true, follow: true }, alternates: { canonical: '/privacy' } };
}

export default async function PrivacyPage({
  params,
}: {
  params: { locale: string };
}) {
  const { locale } = params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: 'legal' });
  const tn = await getTranslations({ locale, namespace: 'nav' });

  return (
    <>
      <PageHero
        title={t('privacyTitle')}
        breadcrumb={[{ label: tn('home'), href: '/' }, { label: t('privacyTitle') }]}
      />
      <Section>
        <div className="mx-auto max-w-2xl">
          <LegalNotice />
          <LegalBody>
            <h2>Information we collect</h2>
            <p>
              We collect only the information you provide through enquiry forms — such as your
              chosen contact method and details, the corridor and currencies for your request, and
              any notes you add. We do not require you to create an account.
            </p>
            <h2>How we use your information</h2>
            <p>
              Your information is used solely to review and respond to your enquiry, and to conduct
              the compliance checks described in our compliance approach. We do not sell your data.
            </p>
            <h2>Analytics</h2>
            <p>
              We keep privacy-conscious, aggregate analytics (for example page views and which
              services are viewed). We do not place your contact details or enquiry contents into
              analytics events.
            </p>
            <h2>Data retention</h2>
            <p>
              Enquiries are retained for as long as needed to serve you and to meet legitimate
              business and legal requirements, then archived or removed.
            </p>
            <h2>Your rights</h2>
            <p>
              You may request access to, correction of, or deletion of your enquiry data by
              contacting us through the channels on our contact page. Applicable rights depend on
              your jurisdiction.
            </p>
            <h2>Contact</h2>
            <p>Reach us through the channels listed on the contact page for any privacy request.</p>
          </LegalBody>
        </div>
      </Section>
    </>
  );
}
