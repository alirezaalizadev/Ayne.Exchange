/**
 * Countries surfaced in the quote form and transaction displays. Focused on the
 * corridors Ayne Exchange actually works with; extend as needed. `name` is the
 * English label — localized names can be layered later via i18n if required.
 */
export interface CountryDef {
  code: string; // ISO 3166-1 alpha-2
  name: string;
}

export const countries: CountryDef[] = [
  { code: 'IR', name: 'Iran' },
  { code: 'RU', name: 'Russia' },
  { code: 'TR', name: 'Türkiye' },
  { code: 'AE', name: 'United Arab Emirates' },
  { code: 'CN', name: 'China' },
  { code: 'DE', name: 'Germany' },
  { code: 'GB', name: 'United Kingdom' },
  { code: 'FR', name: 'France' },
  { code: 'NL', name: 'Netherlands' },
  { code: 'IT', name: 'Italy' },
  { code: 'ES', name: 'Spain' },
  { code: 'KZ', name: 'Kazakhstan' },
  { code: 'UZ', name: 'Uzbekistan' },
  { code: 'AZ', name: 'Azerbaijan' },
  { code: 'GE', name: 'Georgia' },
  { code: 'AM', name: 'Armenia' },
  { code: 'IQ', name: 'Iraq' },
  { code: 'SA', name: 'Saudi Arabia' },
  { code: 'QA', name: 'Qatar' },
  { code: 'KW', name: 'Kuwait' },
  { code: 'OM', name: 'Oman' },
  { code: 'HK', name: 'Hong Kong' },
  { code: 'SG', name: 'Singapore' },
  { code: 'IN', name: 'India' },
  { code: 'US', name: 'United States' },
  { code: 'OT', name: 'Other' },
];

export const countryByCode = (code: string) =>
  countries.find((c) => c.code === code);

/** Regional-indicator emoji flag from an ISO alpha-2 code (EU/OT excluded). */
export function flagEmoji(code: string): string {
  if (!/^[A-Z]{2}$/.test(code) || code === 'OT' || code === 'EU') return '';
  const A = 0x1f1e6;
  return String.fromCodePoint(
    A + code.charCodeAt(0) - 65,
    A + code.charCodeAt(1) - 65,
  );
}
