import { prisma } from '@/lib/db';
import { handleApi, handleOptions, apiJson, readJson } from '@/lib/api/respond';
import { unauthorized, rateLimited, badRequest, ApiError } from '@/lib/api/errors';
import { issueTokenPair, requestContext } from '@/lib/api/auth';
import { rateLimit } from '@/lib/security/rate-limit';
import { verifyPassword } from '@/lib/auth/password';
import { logSecurity, logAudit } from '@/lib/audit';
import { MAX_FAILED_LOGINS, LOCKOUT_MINUTES } from '@/lib/auth/constants';

export const dynamic = 'force-dynamic';

/**
 * POST /api/v1/admin/auth/login — { email, password, totp?, deviceLabel? }.
 * Same accounts, same bcrypt verification, same throttling, lockout and
 * security/audit logging as the web admin login. Returns a short-lived access
 * token and a rotating refresh token.
 */
export const POST = handleApi(async (request: Request) => {
  const { ipHash, userAgent } = requestContext(request);
  const body = (await readJson(request)) as Record<string, unknown>;

  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
  const password = typeof body.password === 'string' ? body.password : '';
  const deviceLabel = typeof body.deviceLabel === 'string' ? body.deviceLabel : null;
  if (!email || !password) throw badRequest('Enter your email and password.');

  // Throttle by IP and by email to blunt brute force / credential stuffing.
  const ipLimit = await rateLimit(`login-ip:${ipHash ?? 'unknown'}`, { limit: 10, windowSeconds: 900 });
  const emailLimit = await rateLimit(`login-email:${email}`, { limit: 8, windowSeconds: 900 });
  if (!ipLimit.allowed || !emailLimit.allowed) {
    await logSecurity({ type: 'login_rate_limited', email, ipHash, userAgent });
    throw rateLimited(Math.max(ipLimit.retryAfterSeconds, emailLimit.retryAfterSeconds));
  }

  const admin = await prisma.admin.findUnique({ where: { email } });

  // Account lockout window.
  if (admin?.lockedUntil && admin.lockedUntil > new Date()) {
    await logSecurity({ type: 'login_locked', email, ipHash, userAgent });
    throw unauthorized('Account temporarily locked. Try again later.');
  }

  const valid = admin && admin.isActive ? await verifyPassword(password, admin.passwordHash) : false;

  if (!admin || !valid) {
    if (admin) {
      const failed = admin.failedLogins + 1;
      const lock = failed >= MAX_FAILED_LOGINS;
      await prisma.admin.update({
        where: { id: admin.id },
        data: {
          failedLogins: lock ? 0 : failed,
          lockedUntil: lock ? new Date(Date.now() + LOCKOUT_MINUTES * 60_000) : admin.lockedUntil,
        },
      });
      if (lock) await logSecurity({ type: 'login_lockout', email, ipHash, userAgent });
    }
    await logSecurity({ type: 'login_failed', email, ipHash, userAgent, metadata: { channel: 'mobile' } });
    throw unauthorized('Invalid email or password.');
  }

  // TOTP is schema-only today (no enrollment flow exists anywhere). If an
  // account somehow has it enabled, refuse token issuance rather than skip 2FA.
  if (admin.totpEnabled) {
    throw new ApiError('TOTP_REQUIRED', 'Two-factor authentication is not yet supported in the app. Sign in on the web.');
  }

  await prisma.admin.update({
    where: { id: admin.id },
    data: { failedLogins: 0, lockedUntil: null, lastLoginAt: new Date() },
  });

  const pair = await issueTokenPair(admin, { deviceLabel, ipHash, userAgent });

  await logSecurity({ type: 'login_success', email, ipHash, userAgent, metadata: { channel: 'mobile' } });
  await logAudit({ adminId: admin.id, action: 'auth.login', metadata: { channel: 'mobile' } });

  return apiJson({
    ...pair,
    admin: { id: admin.id, email: admin.email, name: admin.name, role: admin.role },
  });
});

export const OPTIONS = handleOptions;
