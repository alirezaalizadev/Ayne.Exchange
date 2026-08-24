import { handleApi, handleOptions, apiJson, readJson } from '@/lib/api/respond';
import { badRequest, rateLimited } from '@/lib/api/errors';
import { rotateRefreshToken, requestContext } from '@/lib/api/auth';
import { rateLimit } from '@/lib/security/rate-limit';

export const dynamic = 'force-dynamic';

/**
 * POST /api/v1/admin/auth/refresh — { refreshToken }. Rotates the refresh
 * token (old one is revoked; replaying a rotated token revokes the family).
 */
export const POST = handleApi(async (request: Request) => {
  const { ipHash, userAgent } = requestContext(request);
  const limited = await rateLimit(`refresh:${ipHash ?? 'unknown'}`, { limit: 60, windowSeconds: 900 });
  if (!limited.allowed) throw rateLimited(limited.retryAfterSeconds);

  const body = (await readJson(request)) as Record<string, unknown>;
  const refreshToken = typeof body.refreshToken === 'string' ? body.refreshToken : '';
  if (!refreshToken) throw badRequest('refreshToken is required.');

  const { admin, pair } = await rotateRefreshToken(refreshToken, { ipHash, userAgent });

  return apiJson({
    ...pair,
    admin: { id: admin.id, email: admin.email, name: admin.name, role: admin.role },
  });
});

export const OPTIONS = handleOptions;
