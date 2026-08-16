/**
 * Seed script — reference + clearly-flagged DEMO data.
 * Idempotent (upserts). Run: `npm run db:seed`.
 *
 * IMPORTANT: demo transactions/testimonials are seeded UNPUBLISHED and flagged
 * isDemo=true. They are never presented as genuine until an admin reviews and
 * publishes real, sanitized entries.
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const services = [
  { key: 'swift-payments', name: 'SWIFT Payments', icon: 'arrow-left-right', order: 1 },
  { key: 'sepa-payments', name: 'SEPA Payments', icon: 'euro', order: 2 },
  { key: 'international-business-payments', name: 'International Business Payments', icon: 'building-2', order: 3 },
  { key: 'currency-exchange', name: 'Currency Exchange', icon: 'coins', order: 4 },
  { key: 'import-export-payments', name: 'Import / Export Payments', icon: 'ship', order: 5 },
  { key: 'international-cash-services', name: 'International Cash Services', icon: 'banknote', order: 6 },
  { key: 'crypto-cash', name: 'Crypto / Cash Exchange', icon: 'bitcoin', order: 7 },
  { key: 'payment-consulting', name: 'Payment Consulting', icon: 'route', order: 8 },
];

// Indicative reference pairs (1 base = rate quote). Roughly cross-consistent so
// the calculator's cross-rates are sensible. Admin manages these going forward.
const rates: {
  base: string;
  quote: string;
  rate: number;
  source: string;
  order: number;
  featured?: boolean;
  buy?: number;
  sell?: number;
}[] = [
  { base: 'USD', quote: 'TRY', rate: 32.61, source: 'market', order: 1, featured: true, buy: 32.45, sell: 32.78 },
  { base: 'EUR', quote: 'TRY', rate: 35.42, source: 'market', order: 2, featured: true, buy: 35.24, sell: 35.6 },
  { base: 'GBP', quote: 'TRY', rate: 41.45, source: 'market', order: 3 },
  { base: 'AED', quote: 'TRY', rate: 8.88, source: 'market', order: 4 },
  { base: 'USD', quote: 'IRR', rate: 42000, source: 'market', order: 5, featured: true },
  { base: 'EUR', quote: 'IRR', rate: 45600, source: 'market', order: 6 },
  { base: 'GBP', quote: 'IRR', rate: 53300, source: 'market', order: 7 },
  { base: 'TRY', quote: 'IRR', rate: 1288, source: 'market', order: 8 },
  { base: 'AED', quote: 'IRR', rate: 11400, source: 'market', order: 9 },
  { base: 'CNY', quote: 'IRR', rate: 5850, source: 'market', order: 10 },
  { base: 'RUB', quote: 'IRR', rate: 463, source: 'market', order: 11 },
  { base: 'EUR', quote: 'USD', rate: 1.086, source: 'market', order: 12, featured: true },
  { base: 'GBP', quote: 'USD', rate: 1.271, source: 'market', order: 13 },
  { base: 'USD', quote: 'AED', rate: 3.673, source: 'market', order: 14 },
  { base: 'USD', quote: 'CNY', rate: 7.184, source: 'market', order: 15 },
  { base: 'USD', quote: 'RUB', rate: 90.72, source: 'market', order: 16 },
];

const settings: Record<string, string> = {
  'brand.name': 'Ayne Exchange',
  'contact.whatsapp': process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? '',
  'contact.telegram': process.env.NEXT_PUBLIC_TELEGRAM_USERNAME ?? '',
  'contact.email': process.env.CONTACT_EMAIL ?? '',
  'stats.years': '7',
  'stats.volume': '1B+',
  'default.locale': 'en',
};

// DEMO activity — clearly flagged isDemo. Published so the owner can preview the
// feature; replace/unpublish with real sanitized entries before launch.
const demoTransactions = [
  { ref: 'AYN-260614-DM01', originCountry: 'TR', originCity: 'İstanbul', destinationCountry: 'DE', destinationCity: 'Frankfurt', currency: 'EUR', displayAmount: 48500, serviceKey: 'swift', paymentMethod: 'SWIFT', status: 'COMPLETED', occurredOn: new Date('2026-08-11'), featured: true },
  { ref: 'AYN-260628-DM02', originCountry: 'AE', originCity: 'Dubai', destinationCountry: 'TR', destinationCity: 'İstanbul', currency: 'USD', displayAmount: 78500, serviceKey: 'business', paymentMethod: 'International settlement', status: 'COMPLETED', occurredOn: new Date('2026-08-09'), featured: true },
  { ref: 'AYN-260705-DM03', originCountry: 'CN', originCity: 'Shanghai', destinationCountry: 'AE', destinationCity: 'Dubai', currency: 'USD', displayAmount: 156000, serviceKey: 'importExport', paymentMethod: 'Trade payment', status: 'COMPLETED', occurredOn: new Date('2026-08-06'), featured: true },
  { ref: 'AYN-260712-DM04', originCountry: 'RU', originCity: 'Moscow', destinationCountry: 'TR', destinationCity: 'İstanbul', currency: 'EUR', displayAmount: 92000, serviceKey: 'business', paymentMethod: 'International settlement', status: 'COMPLETED', occurredOn: new Date('2026-08-04') },
  { ref: 'AYN-260718-DM05', originCountry: 'DE', originCity: 'Berlin', destinationCountry: 'NL', destinationCity: 'Amsterdam', currency: 'EUR', displayAmount: 34500, serviceKey: 'sepa', paymentMethod: 'SEPA', status: 'COMPLETED', occurredOn: new Date('2026-08-02') },
  { ref: 'AYN-260722-DM06', originCountry: 'TR', originCity: 'Ankara', destinationCountry: 'CN', destinationCity: 'Shenzhen', currency: 'USD', displayAmount: 210000, serviceKey: 'importExport', paymentMethod: 'Trade payment', status: 'PROCESSING', occurredOn: new Date('2026-07-30') },
  { ref: 'AYN-260726-DM07', originCountry: 'AE', originCity: 'Abu Dhabi', destinationCountry: 'GB', destinationCity: 'London', currency: 'GBP', displayAmount: 64000, serviceKey: 'swift', paymentMethod: 'SWIFT', status: 'COMPLETED', occurredOn: new Date('2026-07-27') },
  { ref: 'AYN-260801-DM08', originCountry: 'IR', originCity: 'Tehran', destinationCountry: 'AE', destinationCity: 'Dubai', currency: 'AED', displayAmount: 88000, serviceKey: 'exchange', paymentMethod: 'Currency exchange', status: 'COMPLETED', occurredOn: new Date('2026-07-24') },
];

async function main() {
  console.log('Seeding services…');
  for (const s of services) {
    await prisma.service.upsert({
      where: { key: s.key },
      update: { name: s.name, icon: s.icon, order: s.order },
      create: { key: s.key, name: s.name, icon: s.icon, order: s.order, summary: s.name },
    });
  }

  console.log('Seeding exchange rates…');
  for (const r of rates) {
    await prisma.exchangeRate.upsert({
      where: { base_quote_sourceLabel: { base: r.base, quote: r.quote, sourceLabel: r.source } },
      // Only refresh the reference API value + featured/order on re-seed; never
      // clobber a manual rate an admin may have set.
      update: { apiRate: r.rate, isFeatured: r.featured ?? false, order: r.order, fetchedAt: new Date() },
      create: {
        base: r.base,
        quote: r.quote,
        apiRate: r.rate,
        manualRate: r.rate,
        buyRate: r.buy ?? null,
        sellRate: r.sell ?? null,
        sourceLabel: r.source,
        provider: 'seed',
        mode: 'MANUAL',
        isPublished: true,
        isFeatured: r.featured ?? false,
        order: r.order,
        fetchedAt: new Date(),
      },
    });
  }

  console.log('Seeding settings…');
  for (const [key, value] of Object.entries(settings)) {
    await prisma.siteSetting.upsert({ where: { key }, update: { value }, create: { key, value } });
  }

  // Remove earlier demo rows that predate public references (avoids duplicates).
  await prisma.transaction.deleteMany({ where: { isDemo: true, publicRef: null } });

  console.log('Seeding DEMO transactions (flagged demo — owner replaces before launch)…');
  for (const [i, tx] of demoTransactions.entries()) {
    const { ref, featured, ...rest } = tx;
    const data = {
      ...rest,
      publicRef: ref,
      amountDisplayMode: 'EXACT' as const,
      isDemo: true,
      isPublished: true,
      isFeatured: featured ?? false,
      order: i + 1,
    };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await prisma.transaction.upsert({
      where: { publicRef: ref },
      update: data as any,
      create: data as any,
    });
  }

  console.log('Done. Create an admin with: npm run admin:create');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
