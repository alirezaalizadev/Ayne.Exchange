import 'server-only';
import { badRequest } from './errors';
import { RATE_MODES, type RateInput } from '@/lib/rates/mutate';

function num(v: unknown): number | null {
  if (v == null || v === '') return null;
  const n = typeof v === 'string' ? Number(v) : (v as number);
  return typeof n === 'number' && isFinite(n) ? n : null;
}

/** Parse an admin rate JSON body (accepts decimal strings or numbers). */
export function parseRateBody(body: Record<string, unknown>, partial: boolean): Partial<RateInput> {
  const out: Partial<RateInput> = {};
  if (!partial || body.base !== undefined) out.base = String(body.base ?? '').toUpperCase();
  if (!partial || body.quote !== undefined) out.quote = String(body.quote ?? '').toUpperCase();
  if (!partial || body.sourceLabel !== undefined) out.sourceLabel = String(body.sourceLabel ?? 'market').slice(0, 32);
  if (!partial || body.mode !== undefined) {
    const mode = String(body.mode ?? 'MANUAL');
    if (!RATE_MODES.includes(mode as (typeof RATE_MODES)[number])) throw badRequest('Invalid mode.');
    out.mode = mode as RateInput['mode'];
  }
  for (const k of ['manualRate', 'apiRate', 'buyRate', 'sellRate', 'spreadPct'] as const) {
    if (!partial || body[k] !== undefined) out[k] = num(body[k]);
  }
  if (!partial || body.displayLabel !== undefined)
    out.displayLabel = body.displayLabel ? String(body.displayLabel).slice(0, 48) : null;
  if (!partial || body.displayDecimals !== undefined) {
    const d = num(body.displayDecimals);
    out.displayDecimals = d == null ? null : Math.max(0, Math.min(8, Math.trunc(d)));
  }
  if (!partial || body.note !== undefined) out.note = body.note ? String(body.note).slice(0, 1000) : null;
  if (!partial || body.isPublished !== undefined) out.isPublished = body.isPublished !== false;
  if (!partial || body.isFeatured !== undefined) out.isFeatured = body.isFeatured === true;
  if (!partial || body.order !== undefined) out.order = Math.trunc(num(body.order) ?? 0);
  return out;
}
