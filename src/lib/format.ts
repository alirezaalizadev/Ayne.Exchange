import Big from 'big.js';
import { currencyByCode, cryptoDecimals } from '@/lib/config/currencies';

/**
 * CENTRAL number module for Ayne Exchange.
 *
 * Golden rule: the LANGUAGE only affects PRESENTATION. The underlying numeric
 * value is always a plain JS number (or a Big for intermediate math) and is
 * NEVER derived by blindly swapping "." and ",". All display goes through
 * Intl.NumberFormat; all user/admin input goes through parseLocalizedNumber.
 */

export type SupportedLocale = 'en' | 'fa' | 'ru' | 'tr';

/** Map an app locale to a BCP-47 tag for Intl. */
export function localeTag(locale: string): string {
  switch (locale) {
    case 'fa':
      return 'fa-IR';
    case 'ru':
      return 'ru-RU';
    case 'tr':
      return 'tr-TR';
    default:
      return 'en-US';
  }
}

/* ------------------------------------------------------------------ *
 * PRECISION
 * ------------------------------------------------------------------ */

/** Display decimals for an AMOUNT of a given currency. */
export function getCurrencyPrecision(code: string): number {
  const c = code?.toUpperCase() ?? '';
  const fiat = currencyByCode(c);
  if (fiat) return fiat.decimals;
  if (c in cryptoDecimals) return cryptoDecimals[c];
  return 2;
}

/** Display decimals for a RATE base/quote (rates need more precision than amounts). */
export function getRatePrecision(base: string, quote: string): number {
  const b = base?.toUpperCase() ?? '';
  const q = quote?.toUpperCase() ?? '';
  if (q === 'IRR' || b === 'IRR') return 0; // e.g. 42000 — decimals are noise
  if (b in cryptoDecimals || q in cryptoDecimals) return 6;
  return 4; // e.g. 1 USD = 41.2500 TRY
}

/* ------------------------------------------------------------------ *
 * FORMATTING (display only)
 * ------------------------------------------------------------------ */

export function formatNumber(value: number, locale = 'en', opts: Intl.NumberFormatOptions = {}): string {
  if (!isFinite(value)) return '—';
  return new Intl.NumberFormat(localeTag(locale), { maximumFractionDigits: 2, ...opts }).format(value);
}

/** Money amount, e.g. "10,000.00 USD" (code style — clearest for B2B rate cards). */
export function formatMoney(
  value: number,
  currency: string,
  locale = 'en',
  opts: { style?: 'code' | 'symbol'; compact?: boolean } = {},
): string {
  if (!isFinite(value)) return '—';
  const decimals = getCurrencyPrecision(currency);
  const tag = localeTag(locale);

  if (opts.style === 'symbol') {
    try {
      return new Intl.NumberFormat(tag, {
        style: 'currency',
        currency,
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
        notation: opts.compact ? 'compact' : 'standard',
      }).format(value);
    } catch {
      /* fall through to code style for unknown currencies */
    }
  }

  const num = new Intl.NumberFormat(tag, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
    notation: opts.compact ? 'compact' : 'standard',
  }).format(value);
  return `${num} ${currency.toUpperCase()}`;
}

/** Compact money, e.g. "€50K" / "1.2M USD". */
export function formatCompactMoney(value: number, currency: string, locale = 'en'): string {
  return formatMoney(value, currency, locale, { compact: true });
}

/** Exchange rate with pair-appropriate precision (or an explicit override). */
export function formatRate(
  value: number,
  base = '',
  quote = '',
  locale = 'en',
  decimalsOverride?: number | null,
): string {
  if (!isFinite(value)) return '—';
  const decimals = decimalsOverride != null ? decimalsOverride : getRatePrecision(base, quote);
  return new Intl.NumberFormat(localeTag(locale), {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
}

/* ------------------------------------------------------------------ *
 * PARSING (any locale / pasted input -> exact numeric value)
 * ------------------------------------------------------------------ */

const PERSIAN_DIGITS = '۰۱۲۳۴۵۶۷۸۹';
const ARABIC_DIGITS = '٠١٢٣٤٥٦٧٨٩';

/**
 * Locales whose ASCII decimal separator is "," (so "." is grouping).
 * NOTE: `fa` is intentionally EXCLUDED — Persian's native decimal is ٫ and
 * thousands is ٬, which we normalize to "." and "," (en-style) beforehand.
 */
function isCommaDecimalLocale(locale: string): boolean {
  return /^(ru|tr|de|fr|es|it|pt|nl|pl|uk)/.test(locale ?? '');
}

/** Validates a grouped integer string like "1,234,567" (first group 1-3, rest 3). */
function isValidGrouping(intPart: string, sep: string): boolean {
  if (!intPart.includes(sep)) return /^\d+$/.test(intPart);
  const groups = intPart.split(sep);
  if (groups.length < 2) return false;
  if (!/^\d{1,3}$/.test(groups[0])) return false;
  return groups.slice(1).every((g) => /^\d{3}$/.test(g));
}

/**
 * Parse a human-entered number in ANY reasonable locale/style into an exact
 * numeric value, or return null if genuinely ambiguous/invalid.
 *
 * Handles: "1,234.56", "1.234,56", "1 234,56", "10,000", "10.000",
 * "$10,000", "€12.500,50", "10 000 EUR", "₺50.000", Persian/Arabic digits.
 * Rejects: "12..5", "1,2,3", "abc", "", "NaN", "Infinity".
 */
export function parseLocalizedNumber(input: string | number | null | undefined, locale = 'en'): number | null {
  if (input == null) return null;
  if (typeof input === 'number') return isFinite(input) ? input : null;

  let s = String(input).trim();
  if (!s) return null;

  // Normalize Persian/Arabic digits and separators to ASCII.
  s = s.replace(/[۰-۹]/g, (d) => String(PERSIAN_DIGITS.indexOf(d)));
  s = s.replace(/[٠-٩]/g, (d) => String(ARABIC_DIGITS.indexOf(d)));
  s = s.replace(/٬/g, ',').replace(/٫/g, '.'); // Arabic thousands / decimal separators

  // Capture sign, then strip whitespace (incl. NBSP/narrow/thin via \s),
  // apostrophes (Swiss grouping), and any currency symbols / letters.
  const sign = /^[-−]/.test(s) ? '-' : '';
  s = s.replace(/[\s']/g, '');
  s = s.replace(/[^\d.,]/g, '');

  if (!s || !/\d/.test(s)) return null;
  if (/[.,]{2,}/.test(s)) return null; // reject "12..5", "1,,2"

  const hasDot = s.includes('.');
  const hasComma = s.includes(',');
  let normalized: string;

  if (hasDot && hasComma) {
    // The LAST-occurring separator is the decimal; the other is grouping.
    const dotLast = s.lastIndexOf('.') > s.lastIndexOf(',');
    const dec = dotLast ? '.' : ',';
    const grp = dotLast ? ',' : '.';
    const [intPart, ...rest] = s.split(dec);
    if (rest.length !== 1) return null;
    if (!isValidGrouping(intPart, grp)) return null;
    normalized = intPart.split(grp).join('') + '.' + rest[0];
  } else if (hasComma || hasDot) {
    const sep = hasComma ? ',' : '.';
    const parts = s.split(sep);
    if (parts.length > 2) {
      // Multiple same separators => grouping only (e.g. 1.234.567 or 1,234,567).
      if (!isValidGrouping(s, sep)) return null;
      normalized = parts.join('');
    } else {
      const dec = parts[1];
      const sepIsLocaleDecimal =
        (sep === ',' && isCommaDecimalLocale(locale)) || (sep === '.' && !isCommaDecimalLocale(locale));
      // Ambiguous single separator with exactly 3 trailing digits: let locale decide.
      if (dec.length === 3 && !sepIsLocaleDecimal) {
        if (!isValidGrouping(s, sep)) return null;
        normalized = parts.join(''); // grouping
      } else {
        if (!/^\d+$/.test(parts[0]) || !/^\d+$/.test(dec)) return null;
        normalized = parts[0] + '.' + dec; // decimal
      }
    }
  } else {
    if (!/^\d+$/.test(s)) return null;
    normalized = s;
  }

  if (!/^\d+(\.\d+)?$/.test(normalized)) return null;
  const n = Number(sign + normalized);
  return isFinite(n) ? n : null;
}

/* ------------------------------------------------------------------ *
 * DECIMAL-SAFE MATH (big.js) — avoids float artifacts in conversions
 * ------------------------------------------------------------------ */

/** amount * (usdRateTo / usdRateFrom), computed with decimal precision. */
export function convertWithRates(amount: number, usdRateFrom: number, usdRateTo: number): number | null {
  if (!isFinite(amount) || !usdRateFrom || !usdRateTo) return null;
  try {
    return Number(new Big(amount).div(usdRateFrom).times(usdRateTo));
  } catch {
    return null;
  }
}
