import { prisma } from '@/lib/db';
import { handleApi, handleOptions, apiJson } from '@/lib/api/respond';
import { requireApiAdmin } from '@/lib/api/auth';
import { serializeAdminQuote } from '@/lib/api/serialize';

export const dynamic = 'force-dynamic';

/**
 * GET /api/v1/admin/overview — the same dashboard metrics the web admin shows:
 * enquiry totals, conversion, published transactions, WhatsApp clicks, latest
 * enquiries.
 */
export const GET = handleApi(async (request: Request) => {
  await requireApiAdmin(request);
  const weekAgo = new Date(Date.now() - 7 * 86400_000);

  const [total, newCount, weekCount, quotedOrCompleted, publishedTx, recent, whatsappClicks, ratesCount] =
    await Promise.all([
      prisma.quoteRequest.count({ where: { deletedAt: null } }),
      prisma.quoteRequest.count({ where: { deletedAt: null, status: 'NEW' } }),
      prisma.quoteRequest.count({ where: { deletedAt: null, createdAt: { gte: weekAgo } } }),
      prisma.quoteRequest.count({ where: { deletedAt: null, status: { in: ['QUOTED', 'COMPLETED'] } } }),
      prisma.transaction.count({ where: { deletedAt: null, isPublished: true } }),
      prisma.quoteRequest.findMany({ where: { deletedAt: null }, orderBy: { createdAt: 'desc' }, take: 8 }),
      prisma.analyticsEvent.count({ where: { type: 'whatsapp_click' } }),
      prisma.exchangeRate.count({ where: { deletedAt: null, isPublished: true } }),
    ]);

  const conversion = total > 0 ? Math.round((quotedOrCompleted / total) * 100) : 0;

  return apiJson({
    totalEnquiries: total,
    newEnquiries: newCount,
    enquiriesLast7Days: weekCount,
    conversionPct: conversion,
    publishedTransactions: publishedTx,
    publishedRates: ratesCount,
    whatsappClicks,
    latestQuotes: recent.map(serializeAdminQuote),
  });
});

export const OPTIONS = handleOptions;
