/**
 * Indicative USD-based reference rates for the client-side calculator preview.
 * These are ILLUSTRATIVE fallbacks only — the live rates layer (see
 * src/lib/rates/provider.ts) supersedes them when configured. Never presented
 * as live or final pricing.
 *
 * Value = units of currency per 1 USD.
 */
import { convertWithRates } from '@/lib/format';

export const usdRates: Record<string, number> = {
  USD: 1,
  EUR: 0.921,
  GBP: 0.787,
  TRY: 32.61,
  AED: 3.673,
  CNY: 7.184,
  RUB: 90.72,
  IRR: 42000, // official-style indicative reference; market rates differ materially
};

/**
 * Convert `amount` from one currency to another via the USD cross-rate.
 * Uses decimal-safe arithmetic (big.js) internally; rounding is applied only
 * at display time by the formatters.
 */
export function convert(amount: number, from: string, to: string): number | null {
  const rf = usdRates[from.toUpperCase()];
  const rt = usdRates[to.toUpperCase()];
  if (!rf || !rt) return null;
  return convertWithRates(amount, rf, rt);
}

/** Unit rate: 1 `from` = X `to`. */
export function unitRate(from: string, to: string): number | null {
  return convert(1, from, to);
}
