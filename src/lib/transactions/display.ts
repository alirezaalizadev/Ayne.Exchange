import { formatMoney, formatCompactMoney } from '@/lib/format';
import type { PublicTransaction } from './service';

/**
 * Renders a transaction's amount according to its privacy display mode.
 * Returns null when the amount should be hidden (card shows the service label).
 * Pure + locale-aware — usable on server and client.
 */
export function formatTransactionAmount(t: PublicTransaction, locale = 'en'): string | null {
  switch (t.amountMode) {
    case 'HIDDEN':
      return null;
    case 'RANGE': {
      const min = t.rangeMin;
      const max = t.rangeMax;
      if (min != null && max != null) {
        return `${formatCompactMoney(min, t.currency, locale)} – ${formatCompactMoney(max, t.currency, locale)}`;
      }
      return formatCompactMoney(t.amount, t.currency, locale);
    }
    case 'ROUNDED': {
      const rounded = roundNice(t.amount);
      return formatMoney(rounded, t.currency, locale);
    }
    case 'EXACT':
    default:
      return formatMoney(t.amount, t.currency, locale);
  }
}

/** Round to a "nice" figure for privacy (nearest 500 / 1k / 5k by magnitude). */
function roundNice(v: number): number {
  if (v >= 100000) return Math.round(v / 5000) * 5000;
  if (v >= 10000) return Math.round(v / 1000) * 1000;
  if (v >= 1000) return Math.round(v / 500) * 500;
  return Math.round(v / 100) * 100;
}
