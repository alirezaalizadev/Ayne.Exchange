import type { QuoteStatus } from '@prisma/client';
import { prisma } from '@/lib/db';
import { handleApi, handleOptions, apiJson, readJson } from '@/lib/api/respond';
import { badRequest, notFound } from '@/lib/api/errors';
import { requireApiAdmin } from '@/lib/api/auth';
import { serializeAdminQuote } from '@/lib/api/serialize';
import { logAudit } from '@/lib/audit';

export const dynamic = 'force-dynamic';

type Ctx = { params: { id: string } };

const STATUSES: QuoteStatus[] = ['NEW', 'REVIEWING', 'CONTACTED', 'QUOTED', 'COMPLETED', 'REJECTED', 'ARCHIVED'];

async function loadQuote(id: string) {
  const q = await prisma.quoteRequest.findFirst({
    where: { id, deletedAt: null },
    include: {
      quoteNotes: {
        orderBy: { createdAt: 'desc' },
        include: { author: { select: { name: true, email: true } } },
      },
    },
  });
  if (!q) throw notFound('Quote not found.');
  const { quoteNotes, ...rest } = q;
  return {
    ...serializeAdminQuote(rest),
    notes_list: quoteNotes.map((n) => ({
      id: n.id,
      body: n.body,
      author: n.author?.name ?? n.author?.email ?? null,
      createdAt: n.createdAt.toISOString(),
    })),
  };
}

/** GET /api/v1/admin/quotes/:id — full quote with notes. */
export const GET = handleApi(async (request: Request, { params }: Ctx) => {
  await requireApiAdmin(request);
  return apiJson(await loadQuote(params.id));
});

/**
 * PATCH /api/v1/admin/quotes/:id — { status?, addNote? }.
 * Mirrors the web admin actions (same statuses, same audit trail).
 */
export const PATCH = handleApi(async (request: Request, { params }: Ctx) => {
  const admin = await requireApiAdmin(request);
  const body = (await readJson(request)) as Record<string, unknown>;

  const exists = await prisma.quoteRequest.findFirst({ where: { id: params.id, deletedAt: null }, select: { id: true } });
  if (!exists) throw notFound('Quote not found.');

  if (body.status !== undefined) {
    const status = String(body.status);
    if (!STATUSES.includes(status as QuoteStatus)) throw badRequest('Invalid status.');
    await prisma.quoteRequest.update({ where: { id: params.id }, data: { status: status as QuoteStatus } });
    await logAudit({
      adminId: admin.id,
      action: 'quote.status_change',
      entityType: 'QuoteRequest',
      entityId: params.id,
      metadata: { status },
    });
  }

  if (body.addNote !== undefined) {
    const note = String(body.addNote).trim();
    if (!note) throw badRequest('Note is empty.');
    if (note.length > 2000) throw badRequest('Note is too long.');
    await prisma.quoteNote.create({ data: { quoteId: params.id, authorId: admin.id, body: note } });
    await logAudit({ adminId: admin.id, action: 'quote.note_add', entityType: 'QuoteRequest', entityId: params.id });
  }

  return apiJson(await loadQuote(params.id));
});

export const OPTIONS = handleOptions;
