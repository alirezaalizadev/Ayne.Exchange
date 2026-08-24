import { prisma } from '@/lib/db';
import { handleApi, handleOptions, apiJson, readJson } from '@/lib/api/respond';
import { badRequest, rateLimited } from '@/lib/api/errors';
import { requestContext } from '@/lib/api/auth';
import { rateLimit } from '@/lib/security/rate-limit';
import { isLocale } from '@/lib/api/translations';

export const dynamic = 'force-dynamic';

/** Allowlisted event names — anything else is rejected. No sensitive payloads. */
const ALLOWED_EVENTS = new Set([
  'screen_view',
  'quote_start',
  'quote_submit',
  'whatsapp_click',
  'telegram_click',
  'calculator_use',
  'language_select',
]);

/** Keys permitted inside meta; values are coerced to short strings. */
const ALLOWED_META_KEYS = new Set(['screen', 'service', 'from', 'to', 'language', 'source']);

/** POST /api/v1/analytics/events — { type, path?, locale?, meta? } */
export const POST = handleApi(async (request: Request) => {
  const { ipHash } = requestContext(request);
  const limited = await rateLimit(`analytics:${ipHash ?? 'unknown'}`, { limit: 240, windowSeconds: 300 });
  if (!limited.allowed) throw rateLimited(limited.retryAfterSeconds);

  const body = (await readJson(request)) as Record<string, unknown>;
  const type = typeof body.type === 'string' ? body.type : '';
  if (!ALLOWED_EVENTS.has(type)) throw badRequest('Unknown event type.');

  let meta: string | null = null;
  if (body.meta && typeof body.meta === 'object' && !Array.isArray(body.meta)) {
    const clean: Record<string, string> = {};
    for (const [k, v] of Object.entries(body.meta as Record<string, unknown>)) {
      if (!ALLOWED_META_KEYS.has(k)) continue;
      if (typeof v === 'string' || typeof v === 'number' || typeof v === 'boolean') {
        clean[k] = String(v).slice(0, 64);
      }
    }
    if (Object.keys(clean).length) meta = JSON.stringify(clean).slice(0, 500);
  }

  await prisma.analyticsEvent
    .create({
      data: {
        type,
        path: typeof body.path === 'string' ? body.path.slice(0, 255) : null,
        locale: isLocale(typeof body.locale === 'string' ? body.locale : null) ? (body.locale as string) : null,
        meta,
        visitorHash: ipHash,
      },
    })
    .catch(() => {});

  return apiJson({ accepted: true }, { status: 202 });
});

export const OPTIONS = handleOptions;
