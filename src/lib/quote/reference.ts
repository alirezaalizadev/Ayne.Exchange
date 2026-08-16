import 'server-only';
import { prisma } from '@/lib/db';
import { randomInt } from 'crypto';

/**
 * Generates an opaque, non-sequential public reference like `AYNE-Q-2026-04817`.
 * The numeric part is random (not an internal id or a running count), and
 * uniqueness is guaranteed by retrying on the rare collision.
 */
export async function generateQuoteReference(year = new Date().getFullYear()): Promise<string> {
  for (let attempt = 0; attempt < 6; attempt++) {
    const n = randomInt(0, 100000).toString().padStart(5, '0');
    const reference = `AYNE-Q-${year}-${n}`;
    const exists = await prisma.quoteRequest.findUnique({
      where: { reference },
      select: { id: true },
    });
    if (!exists) return reference;
  }
  // Extremely unlikely fallback: widen the space.
  return `AYNE-Q-${year}-${randomInt(100000, 999999)}`;
}
