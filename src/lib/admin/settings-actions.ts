'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/db';
import { requireAdmin } from '@/lib/auth/guard';
import { verifyCsrf } from '@/lib/auth/csrf';
import { logAudit } from '@/lib/audit';

export interface ActionResult {
  ok: boolean;
  error?: string;
}

/** Keys the settings page is allowed to write (whitelist). */
const ALLOWED_KEYS = new Set([
  'brand.name',
  'contact.whatsapp',
  'contact.telegram',
  'contact.email',
  'stats.years',
  'stats.volume',
]);

export async function updateSettings(input: {
  values: Record<string, string>;
  csrf: string;
}): Promise<ActionResult> {
  const admin = await requireAdmin();
  if (!verifyCsrf(input.csrf)) return { ok: false, error: 'Invalid session token.' };

  const entries = Object.entries(input.values).filter(([k]) => ALLOWED_KEYS.has(k));
  for (const [key, raw] of entries) {
    const value = String(raw).slice(0, 500).trim();
    await prisma.siteSetting.upsert({ where: { key }, update: { value }, create: { key, value } });
  }

  await logAudit({ adminId: admin.id, action: 'settings.update', metadata: { keys: entries.map(([k]) => k) } });
  revalidatePath('/admin/settings');
  return { ok: true };
}
