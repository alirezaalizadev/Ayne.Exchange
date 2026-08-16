/**
 * Currencies surfaced across the calculator, ticker and quote form.
 * `decimals` is the display precision for AMOUNTS of that currency (rate
 * precision is handled separately in lib/format.ts). IRR shows no decimals;
 * fiat shows 2; crypto is handled by the precision helper.
 */
export interface CurrencyDef {
  code: string;
  name: string;
  symbol: string;
  flag: string; // ISO country for flag rendering
  decimals: number;
}

export const currencies: CurrencyDef[] = [
  { code: 'USD', name: 'US Dollar', symbol: '$', flag: 'US', decimals: 2 },
  { code: 'EUR', name: 'Euro', symbol: '€', flag: 'EU', decimals: 2 },
  { code: 'GBP', name: 'British Pound', symbol: '£', flag: 'GB', decimals: 2 },
  { code: 'TRY', name: 'Turkish Lira', symbol: '₺', flag: 'TR', decimals: 2 },
  { code: 'AED', name: 'UAE Dirham', symbol: 'د.إ', flag: 'AE', decimals: 2 },
  { code: 'CNY', name: 'Chinese Yuan', symbol: '¥', flag: 'CN', decimals: 2 },
  { code: 'RUB', name: 'Russian Ruble', symbol: '₽', flag: 'RU', decimals: 2 },
  { code: 'IRR', name: 'Iranian Rial', symbol: '﷼', flag: 'IR', decimals: 0 },
];

export const currencyByCode = (code: string) =>
  currencies.find((c) => c.code === code.toUpperCase());

/** Amount precision for crypto assets used on the OTC page. */
export const cryptoDecimals: Record<string, number> = {
  BTC: 8,
  ETH: 6,
  USDT: 2,
  USDC: 2,
};

/* --------------------------------------------------------------------------
 * Central currency metadata — THE single source for code → name/symbol/kind/
 * decimals across rates page, ticker, calculator, transactions and admin.
 * A code not listed here still works everywhere via the fallback badge in
 * <CurrencyIcon /> (admin can add any pair; icons appear when metadata exists).
 * -------------------------------------------------------------------------- */
export interface CurrencyMeta {
  code: string;
  name: string;
  symbol: string;
  decimals: number;
  kind: 'fiat' | 'crypto';
}

const cryptoMeta: CurrencyMeta[] = [
  { code: 'USDT', name: 'Tether USD', symbol: '₮', decimals: 2, kind: 'crypto' },
  { code: 'USDC', name: 'USD Coin', symbol: '$', decimals: 2, kind: 'crypto' },
  { code: 'BTC', name: 'Bitcoin', symbol: '₿', decimals: 8, kind: 'crypto' },
  { code: 'ETH', name: 'Ethereum', symbol: 'Ξ', decimals: 6, kind: 'crypto' },
];

export function currencyMeta(code: string): CurrencyMeta | null {
  const c = code?.toUpperCase() ?? '';
  const fiat = currencies.find((x) => x.code === c);
  if (fiat) return { code: fiat.code, name: fiat.name, symbol: fiat.symbol, decimals: fiat.decimals, kind: 'fiat' };
  if (c === 'TOMAN') return { code: 'TOMAN', name: 'Iranian Toman', symbol: '', decimals: 0, kind: 'fiat' };
  return cryptoMeta.find((x) => x.code === c) ?? null;
}
