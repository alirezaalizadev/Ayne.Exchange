'use server';

import { revalidatePath } from 'next/cache';
import type { QuoteStatus } from '@prisma/client';
import { prisma } from '@/lib/db';
import { requireAdmin } from '@/lib/auth/guard';
import { verifyCsrf } from '@/lib/auth/csrf';
import { logAudit } from '@/lib/audit';

export interface ActionResult {
  ok: boolean;
  error?: string;
}

const VALID_STATUSES: QuoteStatus[] = [
  'NEW',
  'REVIEWING',
  'CONTACTED',
  'QUOTED',
  'COMPLETED',
  'REJECTED',
  'ARCHIVED',
];

export async function updateQuoteStatus(input: {
  id: string;
  status: string;
  csrf: string;
}): Promise<ActionResult> {
  const admin = await requireAdmin();
  if (!verifyCsrf(input.csrf)) return { ok: false, error: 'Invalid session token. Reload and try again.' };
  if (!VALID_STATUSES.includes(input.status as QuoteStatus)) return { ok: false, error: 'Invalid status.' };

  await prisma.quoteRequest.update({
    where: { id: input.id },
    data: { status: input.status as QuoteStatus },
  });
  await logAudit({
    adminId: admin.id,
    action: 'quote.status_change',
    entityType: 'QuoteRequest',
    entityId: input.id,
    metadata: { status: input.status },
  });

  revalidatePath(`/admin/quotes/${input.id}`);
  revalidatePath('/admin/quotes');
  revalidatePath('/admin/dashboard');
  return { ok: true };
}

export async function addQuoteNote(input: { quoteId: string; body: string; csrf: string }): Promise<ActionResult> {
  const admin = await requireAdmin();
  if (!verifyCsrf(input.csrf)) return { ok: false, error: 'Invalid session token. Reload and try again.' };
  const body = input.body.trim();
  if (!body) return { ok: false, error: 'Note is empty.' };
  if (body.length > 2000) return { ok: false, error: 'Note is too long.' };

  await prisma.quoteNote.create({
    data: { quoteId: input.quoteId, authorId: admin.id, body },
  });
  await logAudit({
    adminId: admin.id,
    action: 'quote.note_add',
    entityType: 'QuoteRequest',
    entityId: input.quoteId,
  });

  revalidatePath(`/admin/quotes/${input.quoteId}`);
  return { ok: true };
}
