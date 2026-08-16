import Link from 'next/link';
import type { Prisma, QuoteStatus } from '@prisma/client';
import { prisma } from '@/lib/db';
import { flagEmoji } from '@/lib/config/countries';
import { formatMoney } from '@/lib/format';
import { PageHeader, StatusBadge } from '@/components/admin/widgets';
import { cn } from '@/lib/utils';

export const metadata = { title: 'Quote Requests' };

const STATUSES: (QuoteStatus | 'ALL')[] = [
  'ALL',
  'NEW',
  'REVIEWING',
  'CONTACTED',
  'QUOTED',
  'COMPLETED',
  'REJECTED',
  'ARCHIVED',
];

const PAGE_SIZE = 20;

export default async function AdminQuotesPage({
  searchParams,
}: {
  searchParams: { status?: string; q?: string; page?: string };
}) {
  const status = (searchParams.status ?? 'ALL').toUpperCase();
  const q = (searchParams.q ?? '').trim();
  const page = Math.max(1, Number(searchParams.page ?? '1') || 1);

  const where: Prisma.QuoteRequestWhereInput = { deletedAt: null };
  if (status !== 'ALL' && STATUSES.includes(status as QuoteStatus)) {
    where.status = status as QuoteStatus;
  }
  if (q) {
    where.OR = [
      { reference: { contains: q } },
      { contactValue: { contains: q } },
    ];
  }

  const [rows, count] = await Promise.all([
    prisma.quoteRequest.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: PAGE_SIZE,
      skip: (page - 1) * PAGE_SIZE,
    }),
    prisma.quoteRequest.count({ where }),
  ]);

  const totalPages = Math.max(1, Math.ceil(count / PAGE_SIZE));
  const qs = (patch: Record<string, string>) => {
    const p = new URLSearchParams();
    if (status !== 'ALL') p.set('status', status);
    if (q) p.set('q', q);
    Object.entries(patch).forEach(([k, v]) => (v ? p.set(k, v) : p.delete(k)));
    return `?${p.toString()}`;
  };

  return (
    <>
      <PageHeader title="Quote Requests" description={`${count} enquir${count === 1 ? 'y' : 'ies'}`} />

      {/* Filters */}
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-1.5">
          {STATUSES.map((s) => (
            <Link
              key={s}
              href={`/admin/quotes${s === 'ALL' ? '' : `?status=${s}`}`}
              className={cn(
                'rounded-full border px-3 py-1 text-xs font-medium transition-colors',
                status === s
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'border-border text-muted-foreground hover:text-foreground',
              )}
            >
              {s === 'ALL' ? 'All' : s.charAt(0) + s.slice(1).toLowerCase()}
            </Link>
          ))}
        </div>
        <form className="flex gap-2" action="/admin/quotes">
          {status !== 'ALL' && <input type="hidden" name="status" value={status} />}
          <input
            name="q"
            defaultValue={q}
            placeholder="Search reference or contact"
            className="h-9 w-56 rounded-lg border border-input bg-surface px-3 text-sm focus:border-primary focus:outline-none"
          />
        </form>
      </div>

      <div className="surface-card overflow-hidden p-0">
        {rows.length === 0 ? (
          <p className="px-5 py-12 text-center text-sm text-muted-foreground">No matching enquiries.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-xs uppercase tracking-wide text-muted-foreground">
                  <th className="px-5 py-3 text-start font-medium">Reference</th>
                  <th className="px-5 py-3 text-start font-medium">Service</th>
                  <th className="px-5 py-3 text-start font-medium">Route</th>
                  <th className="px-5 py-3 text-start font-medium">Amount</th>
                  <th className="px-5 py-3 text-start font-medium">Contact</th>
                  <th className="px-5 py-3 text-start font-medium">Status</th>
                  <th className="px-5 py-3 text-start font-medium">Date</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id} className="border-b border-border/60 last:border-0 hover:bg-muted/40">
                    <td className="px-5 py-3">
                      <Link href={`/admin/quotes/${r.id}`} className="font-mono text-xs font-medium text-primary hover:underline">
                        {r.reference}
                      </Link>
                    </td>
                    <td className="px-5 py-3 capitalize text-muted-foreground">{r.serviceKey}</td>
                    <td className="px-5 py-3 text-muted-foreground">
                      {r.originCountry ? `${flagEmoji(r.originCountry)} ${r.originCountry}` : '—'} →{' '}
                      {r.destinationCountry ? `${flagEmoji(r.destinationCountry)} ${r.destinationCountry}` : '—'}
                    </td>
                    <td className="px-5 py-3 tabular-nums text-muted-foreground" dir="ltr">
                      {r.sendAmount && r.sendCurrency ? formatMoney(Number(r.sendAmount), r.sendCurrency, 'en') : '—'}
                    </td>
                    <td className="px-5 py-3 text-muted-foreground">
                      <span className="text-xs">{r.contactMethod}</span>
                    </td>
                    <td className="px-5 py-3"><StatusBadge status={r.status} /></td>
                    <td className="px-5 py-3 text-muted-foreground">{new Date(r.createdAt).toLocaleDateString('en-GB')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-4 flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Page {page} of {totalPages}</span>
          <div className="flex gap-2">
            {page > 1 && (
              <Link href={qs({ page: String(page - 1) })} className="rounded-lg border border-border px-3 py-1.5 hover:bg-muted/60">
                Previous
              </Link>
            )}
            {page < totalPages && (
              <Link href={qs({ page: String(page + 1) })} className="rounded-lg border border-border px-3 py-1.5 hover:bg-muted/60">
                Next
              </Link>
            )}
          </div>
        </div>
      )}
    </>
  );
}
