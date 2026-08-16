import 'server-only';
import { prisma } from '@/lib/db';

/**
 * DB-backed fixed-window rate limiter. Portable (no Redis). Suitable for the
 * modest volumes of a lead-gen site. For very high traffic, swap the store.
 *
 * @returns { allowed, remaining, retryAfterSeconds }
 */
export async function rateLimit(
  key: string,
  { limit, windowSeconds }: { limit: number; windowSeconds: number },
): Promise<{ allowed: boolean; remaining: number; retryAfterSeconds: number }> {
  const now = Date.now();
  const windowStart = new Date(Math.floor(now / (windowSeconds * 1000)) * windowSeconds * 1000);

  try {
    const record = await prisma.rateLimit.upsert({
      where: { bucketKey_windowStart: { bucketKey: key, windowStart } },
      create: { bucketKey: key, windowStart, count: 1 },
      update: { count: { increment: 1 } },
    });

    const allowed = record.count <= limit;
    const retryAfterSeconds = allowed
      ? 0
      : Math.ceil((windowStart.getTime() + windowSeconds * 1000 - now) / 1000);

    return { allowed, remaining: Math.max(0, limit - record.count), retryAfterSeconds };
  } catch {
    // Fail-open on limiter errors so a DB hiccup never blocks legitimate users,
    // but never fail-open on auth — callers there should treat errors as denials.
    return { allowed: true, remaining: limit, retryAfterSeconds: 0 };
  }
}

/** Occasionally prune old windows (call from cron or opportunistically). */
export async function pruneRateLimits(olderThanSeconds = 86400) {
  const cutoff = new Date(Date.now() - olderThanSeconds * 1000);
  await prisma.rateLimit.deleteMany({ where: { windowStart: { lt: cutoff } } });
}
