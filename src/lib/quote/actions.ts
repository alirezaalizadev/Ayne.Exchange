'use server';

import { headers } from 'next/headers';
import { prisma } from '@/lib/db';
import { hashIp, clientIpFromHeaders } from '@/lib/security/hash';
import { rateLimit } from '@/lib/security/rate-limit';
import { quoteSchema, validateContactValue } from './schema';
import { generateQuoteReference } from './reference';
import type { QuoteActionResult } from './types';

/**
 * Public entry point for quote submissions. Server-authoritative: validates,
 * rate-limits, screens the honeypot, persists, and returns an opaque reference.
 * Never trusts client-side validation.
 */
export async function submitQuote(raw: unknown): Promise<QuoteActionResult> {
  const hdrs = headers();
  const ip = clientIpFromHeaders(hdrs);
  const ipHash = hashIp(ip);

  // Rate limit: 5 submissions / hour / IP.
  const limited = await rateLimit(`quote:${ipHash ?? 'unknown'}`, {
    limit: 5,
    windowSeconds: 3600,
  });
  if (!limited.allowed) {
    return {
      ok: false,
      error: `Too many requests. Please try again in ${Math.ceil(
        limited.retryAfterSeconds / 60,
      )} minute(s).`,
    };
  }

  // Validate.
  const parsed = quoteSchema.safeParse(raw);
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path[0];
      if (typeof key === 'string' && !fieldErrors[key]) fieldErrors[key] = issue.message;
    }
    return { ok: false, error: 'Please check the highlighted fields.', fieldErrors };
  }

  const data = parsed.data;

  // Honeypot: silently accept-but-drop bot submissions (don't reveal the trap).
  if (data.company_website && data.company_website.length > 0) {
    return { ok: true, reference: 'AYNE-Q-0000-00000' };
  }

  // Contact format check.
  if (!validateContactValue(data.contactMethod, data.contactValue)) {
    return {
      ok: false,
      error: 'Please provide valid contact information.',
      fieldErrors: { contactValue: 'This does not look valid for the selected method.' },
    };
  }

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
      },
    });

    // Non-identifying analytics only (no contact details, no notes).
    await prisma.analyticsEvent
      .create({
        data: {
          type: 'quote_completed',
          meta: JSON.stringify({ service: data.serviceKey, clientType: data.clientType }),
        },
      })
      .catch(() => {});

    return { ok: true, reference };
  } catch {
    return { ok: false, error: 'Something went wrong. Please try again shortly.' };
  }
}
