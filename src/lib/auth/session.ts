import 'server-only';
import { cookies, headers } from 'next/headers';
import { cache } from 'react';
import type { Admin } from '@prisma/client';
import { prisma } from '@/lib/db';
import { sha256, randomToken, hashIp, clientIpFromHeaders } from '@/lib/security/hash';
import { SESSION_COOKIE, CSRF_COOKIE, SESSION_TTL_SECONDS } from './constants';

const secureCookies = process.env.ENABLE_HTTPS === 'true' || process.env.NODE_ENV === 'production';

/**
 * Creates a DB-backed session and sets the session + CSRF cookies.
 * Only a SHA-256 of the token is stored server-side; the raw token lives only
 * in the HttpOnly cookie.
 */
export async function createSession(adminId: string): Promise<void> {
  const token = randomToken(32);
  const tokenHash = sha256(token);
  const csrf = randomToken(24);
  const expiresAt = new Date(Date.now() + SESSION_TTL_SECONDS * 1000);

  const hdrs = headers();
  await prisma.adminSession.create({
    data: {
      adminId,
      tokenHash,
      expiresAt,
      ipAddress: hashIp(clientIpFromHeaders(hdrs)),
      userAgent: hdrs.get('user-agent')?.slice(0, 400) ?? null,
    },
  });

  const jar = cookies();
  jar.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: secureCookies,
    sameSite: 'lax',
    path: '/',
    maxAge: SESSION_TTL_SECONDS,
  });
  // CSRF cookie is readable by JS (double-submit pattern) so forms can echo it.
  jar.set(CSRF_COOKIE, csrf, {
    httpOnly: false,
    secure: secureCookies,
    sameSite: 'lax',
    path: '/',
    maxAge: SESSION_TTL_SECONDS,
  });
}

/**
 * Resolves the current admin from the session cookie, or null.
 * Cached per-request so multiple calls (layout + page) hit the DB once.
 */
export const getCurrentAdmin = cache(async (): Promise<Admin | null> => {
  const token = cookies().get(SESSION_COOKIE)?.value;
  if (!token) return null;

  const session = await prisma.adminSession.findUnique({
    where: { tokenHash: sha256(token) },
    include: { admin: true },
  });

  if (!session || session.revokedAt || session.expiresAt < new Date()) return null;
  if (!session.admin || !session.admin.isActive) return null;
  // Invalidate sessions issued before a password change / forced logout.
  if (session.createdAt < session.admin.sessionsValidFrom) return null;

  // Best-effort last-seen touch (not awaited critically).
  prisma.adminSession
    .update({ where: { id: session.id }, data: { lastSeenAt: new Date() } })
    .catch(() => {});

  return session.admin;
});

export async function destroyCurrentSession(): Promise<void> {
  const jar = cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (token) {
    await prisma.adminSession
      .updateMany({ where: { tokenHash: sha256(token) }, data: { revokedAt: new Date() } })
      .catch(() => {});
  }
  jar.delete(SESSION_COOKIE);
  jar.delete(CSRF_COOKIE);
}
