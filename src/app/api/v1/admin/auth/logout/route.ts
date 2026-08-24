import { handleApi, handleOptions, apiJson, readJson } from '@/lib/api/respond';
import { revokeRefreshToken, requireApiAdmin } from '@/lib/api/auth';
import { logAudit } from '@/lib/audit';

export const dynamic = 'force-dynamic';

/**
 * POST /api/v1/admin/auth/logout — { refreshToken }. Revokes the refresh token.
 * Best-effort: succeeds even if the access token has already expired.
 */
export const POST = handleApi(async (request: Request) => {
  const body = (await readJson(request).catch(() => ({}))) as Record<string, unknown>;
  const refreshToken = typeof body.refreshToken === 'string' ? body.refreshToken : '';
  if (refreshToken) await revokeRefreshToken(refreshToken);

  // Audit with identity when the access token is still valid; never fail logout.
  try {
    const admin = await requireApiAdmin(request);
    await logAudit({ adminId: admin.id, action: 'auth.logout', metadata: { channel: 'mobile' } });
  } catch {
    /* expired access token — logout still succeeds */
  }

  return apiJson({ loggedOut: true });
});

export const OPTIONS = handleOptions;
