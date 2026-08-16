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
  return { title: t('termsTitle'), alternates: { canonical: '/terms' } };
}

export default async function TermsPage({
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
        title={t('termsTitle')}
        breadcrumb={[{ label: tn('home'), href: '/' }, { label: t('termsTitle') }]}
      />
      <Section>
        <div className="mx-auto max-w-2xl">
          <LegalNotice />
          <LegalBody>
            <h2>Nature of the service</h2>
            <p>
              Ayne Exchange provides presentation, consultation and enquiry services relating to
              international payments and currency exchange. It is not a bank or a licensed financial
              institution, and the website does not itself execute financial transactions.
            </p>
            <h2>No guarantees</h2>
            <p>
              Indicative rates and information are provided for orientation only and may be delayed
              or change. We do not guarantee payment completion, timing, or any specific exchange
              rate. Final pricing is provided by quote and subject to review.
            </p>
            <h2>Compliance and acceptable use</h2>
            <p>
              Service availability depends on jurisdiction, transaction type and compliance review.
              You agree not to use our services to circumvent applicable sanctions, anti-money-
              laundering rules, banking restrictions, reporting obligations or financial
              regulations. We may decline any request at our discretion.
            </p>
            <h2>Your responsibilities</h2>
            <p>
              You are responsible for the accuracy of the information you provide and for ensuring
              your transactions comply with all laws applicable to you.
            </p>
            <h2>Limitation of liability</h2>
            <p>
              To the extent permitted by law, Ayne Exchange is not liable for indirect or
              consequential losses arising from use of this website or reliance on indicative
              information.
            </p>
            <h2>Governing law</h2>
            <p>
              The governing law and jurisdiction will be specified here once finalized. Please
              consult qualified counsel before relying on these terms.
            </p>
          </LegalBody>
        </div>
      </Section>
    </>
  );
}
