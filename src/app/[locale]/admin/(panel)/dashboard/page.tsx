import Link from 'next/link';
import { Inbox, Clock, CheckCircle2, ArrowLeftRight, ArrowRight } from 'lucide-react';
import { prisma } from '@/lib/db';
import { flagEmoji } from '@/lib/config/countries';
import { PageHeader, StatCard, StatusBadge } from '@/components/admin/widgets';

export const metadata = { title: 'Dashboard' };

export default async function AdminDashboard() {
  const weekAgo = new Date(Date.now() - 7 * 86400_000);

  const [total, newCount, weekCount, quotedOrCompleted, publishedTx, recent, whatsappClicks] =
    await Promise.all([
      prisma.quoteRequest.count({ where: { deletedAt: null } }),
      prisma.quoteRequest.count({ where: { deletedAt: null, status: 'NEW' } }),
      prisma.quoteRequest.count({ where: { deletedAt: null, createdAt: { gte: weekAgo } } }),
      prisma.quoteRequest.count({ where: { deletedAt: null, status: { in: ['QUOTED', 'COMPLETED'] } } }),
      prisma.transaction.count({ where: { deletedAt: null, isPublished: true } }),
      prisma.quoteRequest.findMany({
        where: { deletedAt: null },
        orderBy: { createdAt: 'desc' },
        take: 8,
      }),
      prisma.analyticsEvent.count({ where: { type: 'whatsapp_click' } }),
    ]);

  const conversion = total > 0 ? Math.round((quotedOrCompleted / total) * 100) : 0;

  return (
    <>
      <PageHeader title="Dashboard" description="Overview of enquiries and activity." />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Total enquiries" value={total} icon={<Inbox className="h-5 w-5" />} />
        <StatCard label="New" value={newCount} hint="Awaiting review" icon={<Clock className="h-5 w-5" />} />
        <StatCard label="Last 7 days" value={weekCount} icon={<ArrowLeftRight className="h-5 w-5" />} />
        <StatCard
          label="Quote conversion"
          value={`${conversion}%`}
          hint="Quoted or completed"
          icon={<CheckCircle2 className="h-5 w-5" />}
        />
      </div>

      <div className="mt-4 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Published transactions" value={publishedTx} />
        <StatCard label="WhatsApp clicks" value={whatsappClicks} />
      </div>

      <div className="mt-8 surface-card overflow-hidden p-0">
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <h2 className="font-semibold">Latest enquiries</h2>
          <Link href="/admin/quotes" className="inline-flex items-center gap-1 text-sm text-primary hover:underline">
            View all <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        {recent.length === 0 ? (
          <p className="px-5 py-10 text-center text-sm text-muted-foreground">No enquiries yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-start text-xs uppercase tracking-wide text-muted-foreground">
                  <th className="px-5 py-3 text-start font-medium">Reference</th>
                  <th className="px-5 py-3 text-start font-medium">Service</th>
                  <th className="px-5 py-3 text-start font-medium">Route</th>
                  <th className="px-5 py-3 text-start font-medium">Status</th>
                  <th className="px-5 py-3 text-start font-medium">Date</th>
                </tr>
              </thead>
              <tbody>
                {recent.map((q) => {
                  return (
                    <tr key={q.id} className="border-b border-border/60 last:border-0 hover:bg-muted/40">
                      <td className="px-5 py-3">
                        <Link href={`/admin/quotes/${q.id}`} className="font-mono text-xs font-medium text-primary hover:underline">
                          {q.reference}
                        </Link>
                      </td>
                      <td className="px-5 py-3 capitalize text-muted-foreground">{q.serviceKey}</td>
                      <td className="px-5 py-3 text-muted-foreground">
                        {q.originCountry ? `${flagEmoji(q.originCountry)} ${q.originCountry}` : '—'}
                        {' → '}
                        {q.destinationCountry ? `${flagEmoji(q.destinationCountry)} ${q.destinationCountry}` : '—'}
                      </td>
                      <td className="px-5 py-3"><StatusBadge status={q.status} /></td>
                      <td className="px-5 py-3 text-muted-foreground">
                        {new Date(q.createdAt).toLocaleDateString('en-GB')}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}
