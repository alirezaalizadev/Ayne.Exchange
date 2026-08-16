'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Eye, EyeOff, Trash2, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { SelectNative } from '@/components/ui/select-native';
import { StatusBadge } from '@/components/admin/widgets';
import { TransactionCard } from '@/components/transactions/transaction-card';
import { services } from '@/lib/config/services';
import { countries, flagEmoji } from '@/lib/config/countries';
import { currencies } from '@/lib/config/currencies';
import { parseLocalizedNumber, formatMoney } from '@/lib/format';
import {
  createTransaction,
  toggleTransactionPublish,
  toggleTransactionFeatured,
  deleteTransaction,
} from '@/lib/admin/content-actions';
import type { PublicTransaction } from '@/lib/transactions/service';
import { cn } from '@/lib/utils';

export interface TxItem {
  id: string;
  publicRef: string | null;
  originCountry: string;
  originCity: string | null;
  destinationCountry: string;
  destinationCity: string | null;
  currency: string;
  displayAmount: string;
  amountMode: string;
  serviceKey: string;
  paymentMethod: string | null;
  status: string;
  occurredOn: string;
  isPublished: boolean;
  isFeatured: boolean;
  isDemo: boolean;
}

const STATUSES = ['COMPLETED', 'PROCESSING', 'PENDING', 'CANCELLED'] as const;
const AMOUNT_MODES = ['EXACT', 'ROUNDED', 'RANGE', 'HIDDEN'] as const;

const emptyForm = {
  originCountry: 'TR',
  originCity: '',
  destinationCountry: 'DE',
  destinationCity: '',
  currency: 'EUR',
  displayAmount: '',
  amountDisplayMode: 'EXACT' as (typeof AMOUNT_MODES)[number],
  amountRangeMin: '',
  amountRangeMax: '',
  serviceKey: 'swift',
  paymentMethod: '',
  status: 'COMPLETED' as (typeof STATUSES)[number],
  occurredOn: new Date().toISOString().slice(0, 10),
  isFeatured: false,
  isPublished: true,
};

export function TransactionManager({ items, csrf }: { items: TxItem[]; csrf: string }) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [pending, setPending] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [form, setForm] = React.useState(emptyForm);

  const set = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) => setForm((f) => ({ ...f, [k]: v }));

  // Live preview object mirroring the public card.
  const previewTx: PublicTransaction = {
    id: 'preview',
    publicRef: 'AYN-PREVIEW',
    originCountry: form.originCountry,
    originCity: form.originCity || null,
    destinationCountry: form.destinationCountry,
    destinationCity: form.destinationCity || null,
    currency: form.currency,
    amount: parseLocalizedNumber(form.displayAmount, 'en') ?? 0,
    amountMode: form.amountDisplayMode,
    rangeMin: parseLocalizedNumber(form.amountRangeMin, 'en'),
    rangeMax: parseLocalizedNumber(form.amountRangeMax, 'en'),
    serviceKey: form.serviceKey,
    paymentMethod: form.paymentMethod || null,
    status: form.status,
    occurredOn: new Date(form.occurredOn || Date.now()).toISOString(),
    isFeatured: form.isFeatured,
  };

  async function add(e: React.FormEvent) {
    e.preventDefault();
    const amount = parseLocalizedNumber(form.displayAmount, 'en');
    if (amount === null || amount <= 0) {
      setError('Enter a valid amount, e.g. 48500');
      return;
    }
    setPending(true);
    setError(null);
    const res = await createTransaction({
      originCountry: form.originCountry,
      originCity: form.originCity || null,
      destinationCountry: form.destinationCountry,
      destinationCity: form.destinationCity || null,
      currency: form.currency,
      displayAmount: amount,
      amountDisplayMode: form.amountDisplayMode,
      amountRangeMin: parseLocalizedNumber(form.amountRangeMin, 'en'),
      amountRangeMax: parseLocalizedNumber(form.amountRangeMax, 'en'),
      serviceKey: form.serviceKey,
      paymentMethod: form.paymentMethod || null,
      status: form.status,
      occurredOn: form.occurredOn,
      isFeatured: form.isFeatured,
      isPublished: form.isPublished,
      csrf,
    });
    setPending(false);
    if (!res.ok) setError(res.error ?? 'Failed.');
    else {
      setOpen(false);
      setForm(emptyForm);
      router.refresh();
    }
  }

  const act = async (fn: Promise<{ ok: boolean; error?: string }>) => {
    const res = await fn;
    if (!res.ok) alert(res.error);
    else router.refresh();
  };

  return (
    <div>
      <div className="mb-4 flex justify-end">
        <Button variant="cta" size="sm" onClick={() => setOpen((v) => !v)}>
          <Plus className="h-4 w-4" /> Add transaction
        </Button>
      </div>

      {open && (
        <div className="mb-6 grid grid-cols-1 gap-6 lg:grid-cols-[1fr_320px]">
          <form onSubmit={add} className="surface-card grid grid-cols-2 gap-4 p-6">
            <div><Label>Origin country</Label>
              <SelectNative value={form.originCountry} onChange={(e) => set('originCountry', e.target.value)}>
                {countries.map((c) => <option key={c.code} value={c.code}>{flagEmoji(c.code)} {c.name}</option>)}
              </SelectNative>
            </div>
            <div><Label>Origin city (optional)</Label><Input value={form.originCity} onChange={(e) => set('originCity', e.target.value)} placeholder="İstanbul" /></div>
            <div><Label>Destination country</Label>
              <SelectNative value={form.destinationCountry} onChange={(e) => set('destinationCountry', e.target.value)}>
                {countries.map((c) => <option key={c.code} value={c.code}>{flagEmoji(c.code)} {c.name}</option>)}
              </SelectNative>
            </div>
            <div><Label>Destination city (optional)</Label><Input value={form.destinationCity} onChange={(e) => set('destinationCity', e.target.value)} placeholder="Frankfurt" /></div>
            <div><Label>Currency</Label>
              <SelectNative value={form.currency} onChange={(e) => set('currency', e.target.value)}>
                {currencies.map((c) => <option key={c.code} value={c.code}>{c.code}</option>)}
              </SelectNative>
            </div>
            <div><Label>Amount</Label><Input dir="ltr" value={form.displayAmount} onChange={(e) => set('displayAmount', e.target.value.replace(/[^\d.,]/g, ''))} placeholder="48500" /></div>
            <div><Label>Amount display</Label>
              <SelectNative value={form.amountDisplayMode} onChange={(e) => set('amountDisplayMode', e.target.value as typeof form.amountDisplayMode)}>
                {AMOUNT_MODES.map((m) => <option key={m} value={m}>{m}</option>)}
              </SelectNative>
            </div>
            <div><Label>Service</Label>
              <SelectNative value={form.serviceKey} onChange={(e) => set('serviceKey', e.target.value)}>
                {services.map((s) => <option key={s.key} value={s.key}>{s.key}</option>)}
              </SelectNative>
            </div>
            {form.amountDisplayMode === 'RANGE' && (
              <>
                <div><Label>Range min</Label><Input dir="ltr" value={form.amountRangeMin} onChange={(e) => set('amountRangeMin', e.target.value.replace(/[^\d.,]/g, ''))} placeholder="25000" /></div>
                <div><Label>Range max</Label><Input dir="ltr" value={form.amountRangeMax} onChange={(e) => set('amountRangeMax', e.target.value.replace(/[^\d.,]/g, ''))} placeholder="50000" /></div>
              </>
            )}
            <div><Label>Payment method (optional)</Label><Input value={form.paymentMethod} onChange={(e) => set('paymentMethod', e.target.value)} placeholder="SWIFT" /></div>
            <div><Label>Status</Label>
              <SelectNative value={form.status} onChange={(e) => set('status', e.target.value as typeof form.status)}>
                {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
              </SelectNative>
            </div>
            <div><Label>Date</Label><Input type="date" value={form.occurredOn} onChange={(e) => set('occurredOn', e.target.value)} /></div>
            <div className="col-span-2 flex flex-wrap items-center gap-4">
              <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.isFeatured} onChange={(e) => set('isFeatured', e.target.checked)} className="h-4 w-4 accent-[hsl(var(--primary))]" /> Feature on homepage</label>
              <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.isPublished} onChange={(e) => set('isPublished', e.target.checked)} className="h-4 w-4 accent-[hsl(var(--primary))]" /> Publish now</label>
              <Button type="submit" variant="cta" size="sm" loading={pending} className="ms-auto">Save transaction</Button>
            </div>
            {error && <p className="col-span-2 text-xs text-destructive">{error}</p>}
            <p className="col-span-2 text-xs text-muted-foreground">Never include names, account numbers, IBANs or SWIFT messages.</p>
          </form>

          {/* Live preview of the public card */}
          <div>
            <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">Live preview</p>
            <TransactionCard tx={previewTx} />
          </div>
        </div>
      )}

      <div className="surface-card overflow-hidden p-0">
        {items.length === 0 ? (
          <p className="px-5 py-12 text-center text-sm text-muted-foreground">No transactions yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-xs uppercase tracking-wide text-muted-foreground">
                  <th className="px-4 py-3 text-start font-medium">Ref</th>
                  <th className="px-4 py-3 text-start font-medium">Route</th>
                  <th className="px-4 py-3 text-start font-medium">Amount</th>
                  <th className="px-4 py-3 text-start font-medium">Service</th>
                  <th className="px-4 py-3 text-start font-medium">Status</th>
                  <th className="px-4 py-3 text-center font-medium">Feat.</th>
                  <th className="px-4 py-3 text-center font-medium">Visible</th>
                  <th className="px-4 py-3 text-end font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {items.map((t) => (
                  <tr key={t.id} className="border-b border-border/60 last:border-0 hover:bg-muted/40">
                    <td className="px-4 py-3 font-mono text-xs">{t.publicRef ?? '—'}</td>
                    <td className="px-4 py-3">
                      {flagEmoji(t.originCountry)} {t.originCountry} → {flagEmoji(t.destinationCountry)} {t.destinationCountry}
                    </td>
                    <td className="px-4 py-3 tabular-nums" dir="ltr">{formatMoney(Number(t.displayAmount), t.currency, 'en')}</td>
                    <td className="px-4 py-3 capitalize text-muted-foreground">{t.serviceKey}</td>
                    <td className="px-4 py-3"><StatusBadge status={t.status} /></td>
                    <td className="px-4 py-3 text-center">
                      <button aria-label="Feature" onClick={() => act(toggleTransactionFeatured({ id: t.id, csrf }))} className="inline-flex">
                        <Star className={cn('h-4 w-4', t.isFeatured ? 'fill-warning text-warning' : 'text-muted-foreground')} />
                      </button>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="inline-flex items-center gap-1.5 text-xs">
                        {t.isPublished ? <span className="text-success">Live</span> : <span className="text-muted-foreground">Hidden</span>}
                        {t.isDemo && <span className="rounded bg-warning/15 px-1.5 py-0.5 text-[0.6rem] font-semibold text-warning">DEMO</span>}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="icon" size="icon" aria-label="Toggle publish" onClick={() => act(toggleTransactionPublish({ id: t.id, csrf }))}>
                          {t.isPublished ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                        <Button variant="icon" size="icon" aria-label="Delete" onClick={() => confirm('Delete this transaction?') && act(deleteTransaction({ id: t.id, csrf }))}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
