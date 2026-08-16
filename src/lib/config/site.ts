/**
 * Central site configuration. Values that must never be hardcoded across the
 * codebase (contact channels, brand name, URLs) live here, sourced from env.
 * Admin-editable overrides are layered on top at runtime via SiteSetting.
 */
export const siteConfig = {
  name: 'Ayne Exchange',
  shortName: 'Ayne',
  domain: process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000',
  tagline: 'Global Payments. Private Solutions.',
  description:
    'International business payment coordination, currency exchange and cross-border settlement support for complex trade.',
  contact: {
    whatsapp: process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? '',
    telegram: process.env.NEXT_PUBLIC_TELEGRAM_USERNAME ?? '',
    email: process.env.CONTACT_EMAIL ?? '',
  },
} as const;

export function whatsappLink(number: string, message?: string): string {
  const digits = number.replace(/[^\d]/g, '');
  const q = message ? `?text=${encodeURIComponent(message)}` : '';
  return `https://wa.me/${digits}${q}`;
}

export function telegramLink(username: string): string {
  return `https://t.me/${username.replace(/^@/, '')}`;
}
