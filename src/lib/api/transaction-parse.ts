import 'server-only';
import { badRequest } from './errors';
import { TX_STATUSES, TX_AMOUNT_MODES, type TransactionInput } from '@/lib/transactions/mutate';

/** Parse an admin transaction JSON body (accepts decimal strings or numbers). */
export function parseTransactionBody(body: Record<string, unknown>, partial: boolean): Partial<TransactionInput> {
  const out: Record<string, unknown> = {};
  const str = (k: string, max = 64) => {
    if (!partial || body[k] !== undefined) out[k] = body[k] ? String(body[k]).slice(0, max) : null;
  };
  if (!partial || body.originCountry !== undefined) out.originCountry = String(body.originCountry ?? '').toUpperCase();
  if (!partial || body.destinationCountry !== undefined) out.destinationCountry = String(body.destinationCountry ?? '').toUpperCase();
  str('originCity');
  str('destinationCity');
  if (!partial || body.currency !== undefined) out.currency = String(body.currency ?? '').toUpperCase().slice(0, 8);
  if (!partial || body.displayAmount !== undefined) {
    const n = typeof body.displayAmount === 'string' ? Number(body.displayAmount.replace(/,/g, '')) : (body.displayAmount as number);
    if (typeof n !== 'number' || !isFinite(n)) throw badRequest('displayAmount must be a decimal.');
    out.displayAmount = n;
  }
  if (!partial || body.amountDisplayMode !== undefined) {
    const m = String(body.amountDisplayMode ?? 'EXACT');
    if (!TX_AMOUNT_MODES.includes(m as (typeof TX_AMOUNT_MODES)[number])) throw badRequest('Invalid amount mode.');
    out.amountDisplayMode = m;
  }
  for (const k of ['amountRangeMin', 'amountRangeMax'] as const) {
    if (!partial || body[k] !== undefined) {
      if (body[k] == null || body[k] === '') {
        out[k] = null;
      } else {
        const n = typeof body[k] === 'string' ? Number(String(body[k]).replace(/,/g, '')) : (body[k] as number);
        if (typeof n !== 'number' || !isFinite(n)) throw badRequest(`${k} must be a decimal.`);
        out[k] = n;
      }
    }
  }
  if (!partial || body.serviceKey !== undefined) out.serviceKey = String(body.serviceKey ?? '').slice(0, 32);
  str('paymentMethod');
  if (!partial || body.status !== undefined) {
    const s = String(body.status ?? 'COMPLETED');
    if (!TX_STATUSES.includes(s as (typeof TX_STATUSES)[number])) throw badRequest('Invalid status.');
    out.status = s;
  }
  if (!partial || body.occurredOn !== undefined) out.occurredOn = String(body.occurredOn ?? '');
  str('note', 1000);
  if (!partial || body.isPublished !== undefined) out.isPublished = body.isPublished === true;
  if (!partial || body.isFeatured !== undefined) out.isFeatured = body.isFeatured === true;
  if (!partial || body.order !== undefined) out.order = Math.trunc(Number(body.order) || 0);
  return out as Partial<TransactionInput>;
}
