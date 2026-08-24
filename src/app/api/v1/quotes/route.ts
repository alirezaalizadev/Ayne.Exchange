import { prisma } from '@/lib/db';
import { handleApi, handleOptions, apiJson, readJson } from '@/lib/api/respond';
import { rateLimited, validationError, ApiError } from '@/lib/api/errors';
import { requestContext } from '@/lib/api/auth';
import { rateLimit } from '@/lib/security/rate-limit';
import { quoteSchema, validateContactValue } from '@/lib/quote/schema';
import { generateQuoteReference } from '@/lib/quote/reference';
import { isLocale } from '@/lib/api/translations';

export const dynamic = 'force-dynamic';

/**
 * POST /api/v1/quotes — the mobile quote form. Identical validation,
 * sanitization, rate limiting and honeypot handling as the web quote form
 * (same zod schema, same reference generator, same 5/hour/IP limit).
 */
export const POST = handleApi(async (request: Request) => {
  const { ipHash } = requestContext(request);

  const limited = await rateLimit(`quote:${ipHash ?? 'unknown'}`, { limit: 5, windowSeconds: 3600 });
  if (!limited.allowed) throw rateLimited(limited.retryAfterSeconds);

  const raw = (await readJson(request)) as Record<string, unknown>;
  // Accept decimal-string amounts from mobile clients (JSON floats are never required).
  if (typeof raw.sendAmount === 'string' && raw.sendAmount.trim() !== '') {
    const n = Number(raw.sendAmount.replace(/,/g, ''));
    if (isFinite(n)) raw.sendAmount = n;
  }
  if (raw.sendAmount === '' || raw.sendAmount === null) delete raw.sendAmount;

  // Honeypot BEFORE validation: silently accept-but-drop bot submissions.
  // (A filled honeypot would otherwise fail the max(0) rule and reveal the trap.)
  if (typeof raw.company_website === 'string' && raw.company_website.length > 0) {
    return apiJson({ reference: 'AYNE-Q-0000-00000' }, { status: 201 });
  }

  const parsed = quoteSchema.safeParse(raw);
  if (!parsed.success) {
    const details: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path[0];
      if (typeof key === 'string' && !details[key]) details[key] = issue.message;
    }
    throw validationError(details);
  }
  const data = parsed.data;

  if (!validateContactValue(data.contactMethod, data.contactValue)) {
    throw validationError(
      { contactValue: 'This does not look valid for the selected method.' },
      'Please provide valid contact information.',
    );
  }

  const locale = isLocale(typeof raw.locale === 'string' ? raw.locale : null) ? (raw.locale as string) : 'en';

  try {
    const reference = await generateQuoteReference();
    await prisma.quoteRequest.create({
      data: {
        reference,
        serviceKey: data.serviceKey,
        sendAmount: data.sendAmount ?? null,
        sendCurrency: data.sendCurrency ?? null,
        receiveCurrency: data.receiveCurrency ?? null,
        originCountry: data.originCountry ?? null,
        destinationCountry: data.destinationCountry ?? null,
        purpose: data.purpose || null,
        clientType: data.clientType,
        timing: data.timing || null,
        notes: data.notes || null,
        contactMethod: data.contactMethod,
        contactValue: data.contactValue,
        ipHash,
        locale,
      },
    });

    // Non-identifying analytics only (no contact details, no notes).
    await prisma.analyticsEvent
      .create({
        data: {
          type: 'quote_completed',
          meta: JSON.stringify({ service: data.serviceKey, clientType: data.clientType, channel: 'mobile' }),
        },
      })
      .catch(() => {});

    return apiJson({ reference }, { status: 201 });
  } catch {
    throw new ApiError('INTERNAL', 'Something went wrong. Please try again shortly.');
  }
});

export const OPTIONS = handleOptions;
