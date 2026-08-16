/**
 * Starter destination/service landing pages. In production these are also
 * creatable from the admin CMS (LandingPage model); this static set seeds the
 * initial, genuinely-useful pages. Titles are destination proper nouns.
 */
export interface PaymentLanding {
  slug: string;
  title: string;
  region: string;
  intro: string;
}

export const paymentLandings: PaymentLanding[] = [
  {
    slug: 'business-payments-europe',
    title: 'Business Payments to Europe',
    region: 'Europe',
    intro:
      'Coordination for EUR and multi-currency business payments into European markets, with SEPA and SWIFT workflows depending on the corridor.',
  },
  {
    slug: 'business-payments-turkiye',
    title: 'Business Payments to Türkiye',
    region: 'Türkiye',
    intro:
      'Support for trade and settlement payments involving Türkiye, a key hub across our corridors.',
  },
  {
    slug: 'payments-china',
    title: 'Payments to China',
    region: 'Asia',
    intro:
      'Coordination for import payments and trade settlement involving China, subject to compliance review.',
  },
  {
    slug: 'payments-uae',
    title: 'Payments to UAE',
    region: 'Middle East',
    intro:
      'Business payment coordination involving the UAE, a major regional settlement centre.',
  },
];

export const paymentLandingBySlug = (slug: string) =>
  paymentLandings.find((p) => p.slug === slug);
