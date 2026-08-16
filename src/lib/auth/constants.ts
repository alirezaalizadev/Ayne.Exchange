/**
 * Auth constants shared between edge middleware and server code.
 * Keep this file dependency-free so it is safe to import in the edge runtime.
 */
export const SESSION_COOKIE = 'ayne_session';
export const CSRF_COOKIE = 'ayne_csrf';
export const CSRF_HEADER = 'x-csrf-token';

export const SESSION_TTL_SECONDS = Number(
  process.env.SESSION_TTL_SECONDS ?? 60 * 60 * 8,
);

export const MAX_FAILED_LOGINS = 5;
export const LOCKOUT_MINUTES = 15;
