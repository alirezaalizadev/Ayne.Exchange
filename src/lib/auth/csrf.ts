import 'server-only';
import { cookies } from 'next/headers';
import { CSRF_COOKIE } from './constants';

/** Returns the current CSRF token (double-submit cookie), or null. */
export function getCsrfToken(): string | null {
  return cookies().get(CSRF_COOKIE)?.value ?? null;
}

/** Constant-time-ish comparison of a submitted token against the cookie. */
export function verifyCsrf(submitted: string | null | undefined): boolean {
  const cookie = getCsrfToken();
  if (!cookie || !submitted) return false;
  if (cookie.length !== submitted.length) return false;
  let mismatch = 0;
  for (let i = 0; i < cookie.length; i++) mismatch |= cookie.charCodeAt(i) ^ submitted.charCodeAt(i);
  return mismatch === 0;
}
