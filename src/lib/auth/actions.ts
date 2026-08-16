'use server';

import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import { prisma } from '@/lib/db';
import { hashIp, clientIpFromHeaders } from '@/lib/security/hash';
import { rateLimit } from '@/lib/security/rate-limit';
import { logSecurity, logAudit } from '@/lib/audit';
import { verifyPassword } from './password';
import { createSession, destroyCurrentSession, getCurrentAdmin } from './session';
import { MAX_FAILED_LOGINS, LOCKOUT_MINUTES } from './constants';

export interface LoginResult {
  ok: boolean;
  error?: string;
}

export async function loginAction(input: { email: string; password: string }): Promise<LoginResult> {
  const email = (input.email ?? '').trim().toLowerCase();
  const password = input.password ?? '';
  const hdrs = headers();
  const ipHash = hashIp(clientIpFromHeaders(hdrs));
  const userAgent = hdrs.get('user-agent');

  if (!email || !password) return { ok: false, error: 'Enter your email and password.' };

  // Throttle by IP and by email to blunt brute force / credential stuffing.
  const ipLimit = await rateLimit(`login-ip:${ipHash ?? 'unknown'}`, { limit: 10, windowSeconds: 900 });
  const emailLimit = await rateLimit(`login-email:${email}`, { limit: 8, windowSeconds: 900 });
  if (!ipLimit.allowed || !emailLimit.allowed) {
    await logSecurity({ type: 'login_rate_limited', email, ipHash, userAgent });
    return { ok: false, error: 'Too many attempts. Please try again later.' };
  }

  const admin = await prisma.admin.findUnique({ where: { email } });
  const genericError = 'Invalid email or password.';

  // Account lockout window.
  if (admin?.lockedUntil && admin.lockedUntil > new Date()) {
    await logSecurity({ type: 'login_locked', email, ipHash, userAgent });
    return { ok: false, error: 'Account temporarily locked. Try again later.' };
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
    await logSecurity({ type: 'login_failed', email, ipHash, userAgent });
    return { ok: false, error: genericError };
  }

  // Success: reset counters, rotate session.
  await prisma.admin.update({
    where: { id: admin.id },
    data: { failedLogins: 0, lockedUntil: null, lastLoginAt: new Date() },
  });
  await createSession(admin.id);
  await logSecurity({ type: 'login_success', email, ipHash, userAgent });
  await logAudit({ adminId: admin.id, action: 'auth.login' });

  redirect('/admin/dashboard');
}

export async function logoutAction(): Promise<void> {
  const admin = await getCurrentAdmin();
  if (admin) await logAudit({ adminId: admin.id, action: 'auth.logout' });
  await destroyCurrentSession();
  redirect('/admin/login');
}
