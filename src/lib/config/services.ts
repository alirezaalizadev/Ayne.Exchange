/**
 * Canonical service catalog. `key` matches the i18n dictionary (services.<key>)
 * and the DB Service.key. Used by nav, home grid, footer and service pages.
 * `icon` is a Lucide icon name resolved in the ServiceIcon component.
 */
export type ServiceKey =
  | 'swift'
  | 'sepa'
  | 'business'
  | 'exchange'
  | 'importExport'
  | 'cash'
  | 'crypto'
  | 'consulting';

export interface ServiceDef {
  key: ServiceKey;
  slug: string;
  icon: string;
  accent: 'primary' | 'accent';
}

export const services: ServiceDef[] = [
  { key: 'swift', slug: 'swift-payments', icon: 'arrow-left-right', accent: 'primary' },
  { key: 'sepa', slug: 'sepa-payments', icon: 'euro', accent: 'accent' },
  { key: 'business', slug: 'international-business-payments', icon: 'building-2', accent: 'primary' },
  { key: 'exchange', slug: 'currency-exchange', icon: 'coins', accent: 'accent' },
  { key: 'importExport', slug: 'import-export-payments', icon: 'ship', accent: 'primary' },
  { key: 'cash', slug: 'international-cash-services', icon: 'banknote', accent: 'accent' },
  { key: 'crypto', slug: 'crypto-cash', icon: 'bitcoin', accent: 'primary' },
  { key: 'consulting', slug: 'payment-consulting', icon: 'route', accent: 'accent' },
];

export const serviceBySlug = (slug: string) =>
  services.find((s) => s.slug === slug);

export const serviceByKey = (key: ServiceKey) =>
  services.find((s) => s.key === key);
