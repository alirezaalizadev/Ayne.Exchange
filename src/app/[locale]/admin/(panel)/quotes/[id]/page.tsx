import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { prisma } from '@/lib/db';
import { getCsrfToken } from '@/lib/auth/csrf';
import { flagEmoji, countryByCode } from '@/lib/config/countries';
import { formatMoney } from '@/lib/format';
import { StatusBadge } from '@/components/admin/widgets';
import { StatusChanger, NoteForm } from '@/components/admin/quote-detail-actions';

export const metadata = { title: 'Enquiry' };

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex justify-between gap-4 border-b border-border/60 py-2.5 last:border-0">
      <dt className="text-sm text-muted-foreground">{label}</dt>
      <dd className="text-end text-sm font-medium">{value || '—'}</dd>
    </div>
  );
}

export default async function QuoteDetailPage({ params }: { params: { id: string } }) {
  const quote = await prisma.quoteRequest.findUnique({
    where: { id: params.id },
    include: { quoteNotes: { orderBy: { createdAt: 'desc' }, include: { author: true } } },
  });
  if (!quote || quote.deletedAt) notFound();

  const csrf = getCsrfToken() ?? '';
  const country = (c?: string | null) => (c ? `${flagEmoji(c)} ${countryByCode(c)?.name ?? c}` : '—');

  return (
    <div className="mx-auto max-w-4xl">
      <Link href="/admin/quotes" className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Back to enquiries
      </Link>

      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-mono text-xl font-semibold">{quote.reference}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Received {new Date(quote.createdAt).toLocaleString('en-GB')}
          </p>
        </div>
        <StatusBadge status={quote.status} />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <section className="surface-card p-6">
            <h2 className="mb-3 font-semibold">Payment details</h2>
            <dl>
              <Row label="Service" value={<span className="capitalize">{quote.serviceKey}</span>} />
              <Row
                label="Send amount"
                value={quote.sendAmount && quote.sendCurrency ? formatMoney(Number(quote.sendAmount), quote.sendCurrency, 'en') : '—'}
              />
              <Row label="Receive currency" value={quote.receiveCurrency} />
              <Row label="Origin" value={country(quote.originCountry)} />
              <Row label="Destination" value={country(quote.destinationCountry)} />
              <Row label="Client type" value={<span className="capitalize">{quote.clientType.toLowerCase()}</span>} />
              <Row label="Timing" value={quote.timing} />
              <Row label="Purpose" value={quote.purpose} />
              <Row label="Notes from client" value={quote.notes} />
            </dl>
          </section>

          <section className="surface-card p-6">
            <h2 className="mb-1 font-semibold">Contact</h2>
            <p className="text-xs text-muted-foreground">Reach out via the client&apos;s preferred channel.</p>
            <dl className="mt-3">
              <Row label="Preferred method" value={quote.contactMethod} />
              <Row label="Contact" value={<span className="font-mono">{quote.contactValue}</span>} />
              <Row label="Language" value={quote.locale?.toUpperCase()} />
            </dl>
          </section>

          <section className="surface-card p-6">
            <h2 className="mb-4 font-semibold">Internal notes</h2>
            <NoteForm quoteId={quote.id} csrf={csrf} />
            <div className="mt-5 space-y-3">
              {quote.quoteNotes.length === 0 ? (
                <p className="text-sm text-muted-foreground">No notes yet.</p>
              ) : (
                quote.quoteNotes.map((n) => (
                  <div key={n.id} className="rounded-lg border border-border bg-surface-raised p-3">
                    <p className="text-sm">{n.body}</p>
                    <p className="mt-1.5 text-xs text-muted-foreground">
                      {n.author?.name ?? 'Admin'} · {new Date(n.createdAt).toLocaleString('en-GB')}
                    </p>
                  </div>
                ))
              )}
            </div>
          </section>
        </div>

        <div className="space-y-6">
          <section className="surface-card p-6">
            <h2 className="mb-4 font-semibold">Manage</h2>
            <StatusChanger id={quote.id} current={quote.status} csrf={csrf} />
          </section>
        </div>
      </div>
    </div>
  );
}
