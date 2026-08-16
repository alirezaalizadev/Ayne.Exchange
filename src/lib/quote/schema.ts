import { z } from 'zod';
import { services } from '@/lib/config/services';
import { currencies } from '@/lib/config/currencies';
import { countries } from '@/lib/config/countries';

const serviceKeys = services.map((s) => s.key) as [string, ...string[]];
const currencyCodes = currencies.map((c) => c.code) as [string, ...string[]];
const countryCodes = countries.map((c) => c.code) as [string, ...string[]];

/**
 * Server-authoritative quote schema. The client mirrors these rules for UX, but
 * this is the single source of truth — never trust client validation alone.
 */
export const quoteSchema = z.object({
  serviceKey: z.enum(serviceKeys),
  sendAmount: z
    .number({ invalid_type_error: 'Enter a valid amount' })
    .positive('Amount must be positive')
    .max(1_000_000_000, 'Amount is too large')
    .optional(),
  sendCurrency: z.enum(currencyCodes).optional(),
  receiveCurrency: z.enum(currencyCodes).optional(),
  originCountry: z.enum(countryCodes).optional(),
  destinationCountry: z.enum(countryCodes).optional(),
  purpose: z.string().trim().max(500).optional().or(z.literal('')),
  clientType: z.enum(['BUSINESS', 'INDIVIDUAL']),
  timing: z.string().trim().max(64).optional().or(z.literal('')),
  notes: z.string().trim().max(1500).optional().or(z.literal('')),
  contactMethod: z.enum(['WHATSAPP', 'TELEGRAM', 'EMAIL', 'PHONE']),
  contactValue: z
    .string()
    .trim()
    .min(3, 'Contact information is required')
    .max(255),
  consent: z.literal(true, {
    errorMap: () => ({ message: 'Please acknowledge the compliance notice' }),
  }),
  // Honeypot — must be empty. Bots tend to fill every field.
  company_website: z.string().max(0).optional().or(z.literal('')),
});

export type QuoteInput = z.infer<typeof quoteSchema>;

/** Refine contactValue format per selected method. */
export function validateContactValue(method: string, value: string): boolean {
  const v = value.trim();
  switch (method) {
    case 'EMAIL':
      return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
    case 'PHONE':
    case 'WHATSAPP':
      return /^[+]?[\d\s()-]{6,20}$/.test(v);
    case 'TELEGRAM':
      return /^@?[\w]{4,64}$/.test(v) || /^[+]?[\d\s()-]{6,20}$/.test(v);
    default:
      return v.length >= 3;
  }
}
