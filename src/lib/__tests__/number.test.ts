import { describe, it, expect } from 'vitest';
import {
  parseLocalizedNumber,
  formatRate,
  formatMoney,
  formatNumber,
  getRatePrecision,
  getCurrencyPrecision,
  convertWithRates,
} from '@/lib/format';
import { convert, unitRate, usdRates } from '@/lib/rates/indicative';

describe('parseLocalizedNumber — English (en)', () => {
  it('parses grouped + decimal', () => {
    expect(parseLocalizedNumber('1,234.56', 'en')).toBe(1234.56);
    expect(parseLocalizedNumber('1234.56', 'en')).toBe(1234.56);
    expect(parseLocalizedNumber('10,000', 'en')).toBe(10000);
    expect(parseLocalizedNumber('1,000,000.50', 'en')).toBe(1000000.5);
    expect(parseLocalizedNumber('10000.50', 'en')).toBe(10000.5);
    // In en, "10.000" is ten (dot is the decimal separator).
    expect(parseLocalizedNumber('10.000', 'en')).toBe(10);
  });
});

describe('parseLocalizedNumber — Russian (ru)', () => {
  it('parses space grouping + comma decimal', () => {
    expect(parseLocalizedNumber('1 234,56', 'ru')).toBe(1234.56);
    expect(parseLocalizedNumber('1234,56', 'ru')).toBe(1234.56);
    // In ru, "10.000" is ten-thousand (dot is grouping).
    expect(parseLocalizedNumber('10.000', 'ru')).toBe(10000);
    expect(parseLocalizedNumber('1 234,56', 'ru')).toBe(1234.56); // NBSP
  });
});

describe('parseLocalizedNumber — European / mixed separators', () => {
  it('uses the last separator as the decimal', () => {
    expect(parseLocalizedNumber('1.234,56', 'ru')).toBe(1234.56);
    expect(parseLocalizedNumber('10.000,50', 'de')).toBe(10000.5);
    expect(parseLocalizedNumber('1.234,56', 'en')).toBe(1234.56);
  });
});

describe('parseLocalizedNumber — pasted currency', () => {
  it('strips symbols and whitespace safely', () => {
    expect(parseLocalizedNumber('$10,000', 'en')).toBe(10000);
    expect(parseLocalizedNumber('€12.500,50', 'de')).toBe(12500.5);
    expect(parseLocalizedNumber('10 000 EUR', 'ru')).toBe(10000);
    expect(parseLocalizedNumber('₺50.000', 'tr')).toBe(50000);
    expect(parseLocalizedNumber('₽1 000,00', 'ru')).toBe(1000);
  });
});

describe('parseLocalizedNumber — Persian / Arabic digits', () => {
  it('normalizes digits and separators', () => {
    expect(parseLocalizedNumber('۱۰۰۰۰', 'fa')).toBe(10000);
    expect(parseLocalizedNumber('۴۱٫۲۵', 'fa')).toBe(41.25); // Arabic decimal ٫
    expect(parseLocalizedNumber('۱۰٬۰۰۰', 'fa')).toBe(10000); // Arabic thousands ٬
    expect(parseLocalizedNumber('٤١٫٢٥', 'fa')).toBe(41.25); // Arabic-Indic digits
  });
});

describe('parseLocalizedNumber — invalid inputs rejected', () => {
  it('returns null for malformed values', () => {
    for (const bad of ['12..5', '1,2,3', 'abc', '', '   ', 'NaN', 'Infinity', '1.2.3.4', '4,25,1']) {
      expect(parseLocalizedNumber(bad, 'en')).toBeNull();
    }
  });
  it('handles numeric passthrough', () => {
    expect(parseLocalizedNumber(41.25)).toBe(41.25);
    expect(parseLocalizedNumber(NaN)).toBeNull();
    expect(parseLocalizedNumber(Infinity)).toBeNull();
  });
});

describe('round-trip: parse(format(x)) preserves value in every locale', () => {
  const values = [1234.56, 10000, 1000000.5, 41.25, 0.9210];
  for (const locale of ['en', 'ru', 'fa', 'tr']) {
    for (const v of values) {
      it(`${locale}: ${v}`, () => {
        const formatted = formatNumber(v, locale, { maximumFractionDigits: 4 });
        expect(parseLocalizedNumber(formatted, locale)).toBeCloseTo(v, 4);
      });
    }
  }
});

describe('conversion is identical regardless of display locale', () => {
  it('same numeric result across languages', () => {
    const amount = 10000;
    const r = convert(amount, 'USD', 'TRY');
    expect(r).not.toBeNull();
    // Formatting differs per locale but the number does not.
    const en = formatNumber(r!, 'en');
    const ru = formatNumber(r!, 'ru');
    const fa = formatNumber(r!, 'fa');
    expect(parseLocalizedNumber(en, 'en')).toBeCloseTo(r!, 2);
    expect(parseLocalizedNumber(ru, 'ru')).toBeCloseTo(r!, 2);
    expect(parseLocalizedNumber(fa, 'fa')).toBeCloseTo(r!, 2);
  });

  it('cross-rate via USD is numeric and decimal-safe', () => {
    // EUR/TRY should equal (USD/TRY) / (USD/EUR)
    const eurTry = unitRate('EUR', 'TRY')!;
    const expected = usdRates.TRY / usdRates.EUR;
    expect(eurTry).toBeCloseTo(expected, 8);
  });

  it('convertWithRates avoids float artifacts', () => {
    // 0.1 + 0.2 style artifacts must not appear
    expect(convertWithRates(3, 1, 0.1)).toBe(0.3);
  });
});

describe('precision config', () => {
  it('rate precision by pair', () => {
    expect(getRatePrecision('USD', 'TRY')).toBe(4);
    expect(getRatePrecision('USD', 'IRR')).toBe(0);
    expect(getRatePrecision('BTC', 'USD')).toBe(6);
  });
  it('currency amount precision', () => {
    expect(getCurrencyPrecision('USD')).toBe(2);
    expect(getCurrencyPrecision('IRR')).toBe(0);
    expect(getCurrencyPrecision('BTC')).toBe(8);
  });
});

describe('formatting output (stable en-US)', () => {
  it('formats money and rates', () => {
    expect(formatMoney(10000, 'USD', 'en')).toBe('10,000.00 USD');
    expect(formatRate(41.25, 'USD', 'TRY', 'en')).toBe('41.2500');
    expect(formatRate(42000, 'USD', 'IRR', 'en')).toBe('42,000');
  });
});
