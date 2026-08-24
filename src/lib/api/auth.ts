import 'server-only';
import { SignJWT, jwtVerify } from 'jose';
import type { Admin } from '@prisma/client';
import { prisma } from '@/lib/db';
import { sha256, randomToken, hashIp, clientIpFromHeaders } from '@/lib/security/hash';
import { logSecurity } from '@/lib/audit';
import { unauthorized, ApiError } from './errors';

/**
 * Token auth for the mobile API. Reuses the existing admin accounts, bcrypt
 * hashing, lockout counters and audit/security logging. Two-token model:
 *  - short-lived JWT access token (Authorization: Bearer …)
 *  - rotating refresh token, stored only as SHA-256 in `api_refresh_tokens`.
 * Replayed (already-rotated) refresh tokens revoke the whole token family.
 */

const ACCESS_TTL_SECONDS = Number(process.env.API_ACCESS_TTL_SECONDS ?? 900); // 15 min
const REFRESH_TTL_DAYS = Number(process.env.API_REFRESH_TTL_DAYS ?? 30);

function jwtSecret(): Uint8Array {
  const secret = process.env.API_JWT_SECRET ?? process.env.SESSION_SECRET ?? 'insecure-dev-secret-change-me';
  return new TextEncoder().encode(secret);
}

export interface TokenPair {
  accessToken: string;
  accessTokenExpiresAt: string;
  refreshToken: string;
  refreshTokenExpiresAt: string;
}

export async function signAccessToken(admin: Admin): Promise<{ token: string; expiresAt: Date }> {
  const expiresAt = new Date(Date.now() + ACCESS_TTL_SECONDS * 1000);
  const token = await new SignJWT({
    role: admin.role,
    // Sessions issued before sessionsValidFrom are invalid (password change / global revoke).
    sv: Math.floor(admin.sessionsValidFrom.getTime() / 1000),
  })
    .setProtectedHeader({ alg: 'HS256', typ: 'JWT' })
    .setSubject(admin.id)
    .setIssuedAt()
    .setIssuer('ayne-api')
    .setAudience('ayne-mobile')
    .setExpirationTime(expiresAt)
    .sign(jwtSecret());
  return { token, expiresAt };
}

export async function issueTokenPair(
  admin: Admin,
  ctx: { deviceLabel?: string | null; ipHash?: string | null; userAgent?: string | null },
): Promise<TokenPair> {
  const access = await signAccessToken(admin);
  const refreshRaw = randomToken(48);
  const refreshExpiresAt = new Date(Date.now() + REFRESH_TTL_DAYS * 86400_000);

  await prisma.apiRefreshToken.create({
    data: {
      adminId: admin.id,
      tokenHash: sha256(refreshRaw),
      deviceLabel: ctx.deviceLabel?.slice(0, 120) ?? null,
      ipHash: ctx.ipHash ?? null,
      userAgent: ctx.userAgent?.slice(0, 400) ?? null,
      expiresAt: refreshExpiresAt,
    },
  });

  return {
    accessToken: access.token,
    accessTokenExpiresAt: access.expiresAt.toISOString(),
    refreshToken: refreshRaw,
    refreshTokenExpiresAt: refreshExpiresAt.toISOString(),
  };
}

/**
 * Rotate a refresh token: revoke the presented one, issue a replacement.
 * A presented token that was already rotated/revoked is treated as stolen —
 * every token for that admin is revoked and a security event is recorded.
 */
export async function rotateRefreshToken(
  refreshRaw: string,
  ctx: { ipHash?: string | null; userAgent?: string | null },
): Promise<{ admin: Admin; pair: TokenPair }> {
  const row = await prisma.apiRefreshToken.findUnique({
    where: { tokenHash: sha256(refreshRaw) },
    include: { admin: true },
  });
  if (!row) throw unauthorized('Invalid refresh token.');

  if (row.revokedAt) {
    // Reuse of a rotated token → assume compromise, kill the family.
    await prisma.apiRefreshToken.updateMany({
      where: { adminId: row.adminId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
    await logSecurity({
      type: 'api_refresh_reuse',
      email: row.admin.email,
      ipHash: ctx.ipHash,
      userAgent: ctx.userAgent,
      metadata: { tokenId: row.id },
    });
    throw unauthorized('Session revoked. Please sign in again.');
  }
  if (row.expiresAt < new Date()) throw unauthorized('Session expired. Please sign in again.');

  const admin = row.admin;
  if (!admin.isActive) throw unauthorized('Account is disabled.');
  if (row.createdAt < admin.sessionsValidFrom) throw unauthorized('Session expired. Please sign in again.');

  const pair = await issueTokenPair(admin, {
    deviceLabel: row.deviceLabel,
    ipHash: ctx.ipHash,
    userAgent: ctx.userAgent,
  });
  const replacement = await prisma.apiRefreshToken.findUnique({ where: { tokenHash: sha256(pair.refreshToken) } });
  await prisma.apiRefreshToken.update({
    where: { id: row.id },
    data: { revokedAt: new Date(), replacedById: replacement?.id ?? null, lastUsedAt: new Date() },
  });

  return { admin, pair };
}

export async function revokeRefreshToken(refreshRaw: string): Promise<void> {
  await prisma.apiRefreshToken
    .updateMany({ where: { tokenHash: sha256(refreshRaw), revokedAt: null }, data: { revokedAt: new Date() } })
    .catch(() => {});
}

/** Authenticate a request via Bearer access token. Throws 401 on any failure. */
export async function requireApiAdmin(request: Request): Promise<Admin> {
  const header = request.headers.get('authorization') ?? '';
  const token = header.startsWith('Bearer ') ? header.slice(7).trim() : null;
  if (!token) throw unauthorized();

  let payload: { sub?: string; sv?: number };
  try {
    const verified = await jwtVerify(token, jwtSecret(), { issuer: 'ayne-api', audience: 'ayne-mobile' });
    payload = verified.payload as { sub?: string; sv?: number };
  } catch {
    throw unauthorized('Invalid or expired token.');
  }
  if (!payload.sub) throw unauthorized('Invalid or expired token.');

  const admin = await prisma.admin.findUnique({ where: { id: payload.sub } });
  if (!admin || !admin.isActive) throw unauthorized('Account is disabled.');
  // Tokens minted before a global invalidation (password change) are rejected.
  const sv = Math.floor(admin.sessionsValidFrom.getTime() / 1000);
  if (payload.sv == null || payload.sv < sv) throw unauthorized('Session expired. Please sign in again.');

  return admin;
}

export function requestContext(request: Request) {
  const headers = new Headers(request.headers);
  const ipHash = hashIp(clientIpFromHeaders(headers));
  const userAgent = headers.get('user-agent');
  return { ipHash, userAgent };
}

export { ApiError };
