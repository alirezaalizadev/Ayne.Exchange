import 'server-only';
import { createHash } from 'crypto';
import { NextResponse } from 'next/server';
import { ApiError } from './errors';

/**
 * Response helpers for /api/v1: stable envelope, CORS for mobile clients,
 * ETag/Last-Modified handling and safe structured errors.
 *
 * Envelope:  success → { data, meta? }   failure → { error: { code, message, details? } }
 */

const CORS_ORIGIN = process.env.API_CORS_ORIGIN ?? '*';

export function corsHeaders(extra?: HeadersInit): Headers {
  const h = new Headers(extra);
  h.set('Access-Control-Allow-Origin', CORS_ORIGIN);
  h.set('Access-Control-Allow-Methods', 'GET, POST, PATCH, DELETE, OPTIONS');
  h.set('Access-Control-Allow-Headers', 'Authorization, Content-Type, If-None-Match');
  h.set('Access-Control-Max-Age', '86400');
  h.set('X-Content-Type-Options', 'nosniff');
  return h;
}

/** Shared OPTIONS handler for all /api/v1 routes. */
export function handleOptions(): NextResponse {
  return new NextResponse(null, { status: 204, headers: corsHeaders() });
}

export function apiJson(
  data: unknown,
  init?: { status?: number; meta?: Record<string, unknown>; headers?: HeadersInit },
): NextResponse {
  const body = init?.meta ? { data, meta: init.meta } : { data };
  return NextResponse.json(body, { status: init?.status ?? 200, headers: corsHeaders(init?.headers) });
}

export function apiErrorResponse(err: ApiError): NextResponse {
  const headers = corsHeaders();
  if (err.retryAfterSeconds) headers.set('Retry-After', String(err.retryAfterSeconds));
  return NextResponse.json(
    {
      error: {
        code: err.code,
        message: err.message,
        ...(err.details ? { details: err.details } : {}),
      },
    },
    { status: err.status, headers },
  );
}

/**
 * Wrap a route handler: catches ApiError → structured JSON, anything else →
 * opaque 500 (no stack traces, no internals).
 */
export function handleApi<A extends unknown[]>(
  fn: (...args: A) => Promise<NextResponse>,
): (...args: A) => Promise<NextResponse> {
  return async (...args: A) => {
    try {
      return await fn(...args);
    } catch (err) {
      if (err instanceof ApiError) return apiErrorResponse(err);
      console.error('[api/v1] unhandled error:', err instanceof Error ? err.message : err);
      return apiErrorResponse(new ApiError('INTERNAL', 'Something went wrong. Please try again shortly.'));
    }
  };
}

/**
 * Conditional-GET response: strong ETag over the serialized payload plus
 * Last-Modified. Returns 304 with empty body when If-None-Match matches.
 * Admin rate changes produce new `updatedAt`s → new payload → new ETag, so
 * invalidation is automatic and correct.
 */
export function apiJsonCached(
  request: Request,
  data: unknown,
  opts?: { lastModified?: Date | string | null; maxAge?: number; meta?: Record<string, unknown> },
): NextResponse {
  const body = JSON.stringify(opts?.meta ? { data, meta: opts.meta } : { data });
  const etag = `"${createHash('sha256').update(body).digest('base64url').slice(0, 27)}"`;

  const headers = corsHeaders({ 'Content-Type': 'application/json' });
  headers.set('ETag', etag);
  headers.set('Cache-Control', `public, max-age=${opts?.maxAge ?? 30}, must-revalidate`);
  if (opts?.lastModified) {
    headers.set('Last-Modified', new Date(opts.lastModified).toUTCString());
  }

  const inm = request.headers.get('if-none-match');
  if (inm && inm.split(',').map((s) => s.trim()).includes(etag)) {
    return new NextResponse(null, { status: 304, headers });
  }
  return new NextResponse(body, { status: 200, headers });
}

/** Parse a JSON body defensively (bad JSON → 400, never a crash). */
export async function readJson(request: Request): Promise<unknown> {
  try {
    return await request.json();
  } catch {
    throw new ApiError('BAD_REQUEST', 'Request body must be valid JSON.');
  }
}

/** Pagination params: ?page=1&pageSize=20 (bounded). */
export function pagination(url: URL, defaults = { pageSize: 20, maxPageSize: 50 }) {
  const page = Math.max(1, Number(url.searchParams.get('page')) || 1);
  const pageSize = Math.min(
    defaults.maxPageSize,
    Math.max(1, Number(url.searchParams.get('pageSize')) || defaults.pageSize),
  );
  return { page, pageSize, skip: (page - 1) * pageSize, take: pageSize };
}
