import Big from 'big.js';
import { handleApi, handleOptions, apiJson, readJson } from '@/lib/api/respond';
import { badRequest, rateLimited } from '@/lib/api/errors';
import { requestContext } from '@/lib/api/auth';
import { rateLimit } from '@/lib/security/rate-limit';
import { getRatePairs, getRatesUpdatedAt } from '@/lib/rates/service';
import { convertAmount, getCrossRate } from '@/lib/rates/cross';
import { currencyMeta } from '@/lib/config/currencies';
import { numToDec } from '@/lib/api/serialize';

export const dynamic = 'force-dynamic';

const CODE = /^[A-Z]{2,8}$/;

/**
 * POST /api/v1/convert — { from, to, amount } (amount is a decimal string).
 * Server-side conversion through the SAME cross-rate engine the web calculator
 * uses (direct, inverse and cross rates via shortest path). Decimal strings out.
 */
export const POST = handleApi(async (request: Request) => {
  const { ipHash } = requestContext(request);
  const limited = await rateLimit(`convert:${ipHash ?? 'unknown'}`, { limit: 120, windowSeconds: 300 });
  if (!limited.allowed) throw rateLimited(limited.retryAfterSeconds);

  const body = (await readJson(request)) as { from?: unknown; to?: unknown; amount?: unknown };
  const from = typeof body.from === 'string' ? body.from.trim().toUpperCase() : '';
  const to = typeof body.to === 'string' ? body.to.trim().toUpperCase() : '';
  if (!CODE.test(from) || !CODE.test(to)) throw badRequest('from/to must be currency codes.');

  const amountRaw = typeof body.amount === 'string' || typeof body.amount === 'number' ? String(body.amount) : '';
  let amount: Big;
  try {
    amount = new Big(amountRaw.replace(/,/g, ''));
  } catch {
    throw badRequest('amount must be a decimal string.');
  }
  if (amount.lt(0) || amount.gt('1000000000000')) throw badRequest('amount out of range.');

  const pairs = await getRatePairs();
  const result = convertAmount(pairs, Number(amount), from, to);
  const unitRate = getCrossRate(pairs, from, to);
  if (result == null || unitRate == null) {
    throw badRequest('This currency pair is not available.');
  }

  const decimals = currencyMeta(to)?.decimals ?? 2;
  const asOf = await getRatesUpdatedAt();

  return apiJson({
    from,
    to,
    amount: amount.toString(),
    result: numToDec(result, Math.max(decimals, 2)),
    rate: numToDec(unitRate, 8),
    decimals,
    asOf,
  });
});

export const OPTIONS = handleOptions;
