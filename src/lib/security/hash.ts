import 'server-only';
import { createHash, createHmac, randomBytes } from 'crypto';

const SECRET = process.env.SESSION_SECRET ?? 'insecure-dev-secret-change-me';

/** One-way, salted hash of an IP for abuse control (not reversible to an IP). */
export function hashIp(ip: string | null | undefined): string | null {
  if (!ip) return null;
  return createHmac('sha256', SECRET).update(ip).digest('hex');
}

/** SHA-256 of an opaque token (e.g. session token stored only in the cookie). */
export function sha256(value: string): string {
  return createHash('sha256').update(value).digest('hex');
}

/** Cryptographically-random URL-safe token. */
export function randomToken(bytes = 32): string {
  return randomBytes(bytes).toString('base64url');
}

/** Best-effort client IP from proxy headers (Nginx sets X-Forwarded-For). */
export function clientIpFromHeaders(headers: Headers): string | null {
  const xff = headers.get('x-forwarded-for');
  if (xff) return xff.split(',')[0]!.trim();
  return headers.get('x-real-ip');
}
