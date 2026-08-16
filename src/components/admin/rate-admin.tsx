'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Star, Eye, EyeOff, Archive, Check, Save, History } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { SelectNative } from '@/components/ui/select-native';
import { parseLocalizedNumber, formatRate } from '@/lib/format';
import { createRate, updateRate, archiveRate, bulkUpdateRates } from '@/lib/admin/rate-actions';
import { CurrencyPairIcons } from '@/components/ui/currency-icon';
import { cn } from '@/lib/utils';

export interface RateAdminItem {
  id: string;
  base: string;
  quote: string;
  sourceLabel: string;
  displayLabel: string | null;
  apiRate: string | null;
  manualRate: string | null;
  buyRate: string | null;
  sellRate: string | null;
  spreadPct: string | null;
  displayRate: number | null;
  mode: string;
  provider: string;
  isPublished: boolean;
  isFeatured: boolean;
  order: number;
  updatedAt: string;
}

const MODES = ['MANUAL', 'AUTO', 'ADJUSTED'];
const num = (s: string) => (s.trim() ? parseLocalizedNumber(s, 'en') : null);

export function RateAdmin({ items, csrf }: { items: RateAdminItem[]; csrf: string }) {
  const router = useRouter();
  const [search, setSearch] = React.useState('');
  const [status, setStatus] = React.useState<'all' | 'published' | 'hidden'>('all');
  const [modeFilter, setModeFilter] = React.useState<'all' | 'MANUAL' | 'AUTO' | 'ADJUSTED'>('all');
  const [featuredOnly, setFeaturedOnly] = React.useState(false);
  const [bulk, setBulk] = React.useState(false);
  const [addOpen, setAddOpen] = React.useState(false);
  const [bulkEdits, setBulkEdits] = React.useState<Record<string, { buy: string; sell: string; manual: string }>>({});
  const [bulkSaving, setBulkSaving] = React.useState(false);

  const filtered = items.filter((r) => {
    if (search && !`${r.base}/${r.quote} ${r.displayLabel ?? ''}`.toLowerCase().includes(search.toLowerCase())) return false;
    if (status === 'published' && !r.isPublished) return false;
    if (status === 'hidden' && r.isPublished) return false;
    if (modeFilter !== 'all' && r.mode !== modeFilter) return false;
    if (featuredOnly && !r.isFeatured) return false;
    return true;
  });

  async function saveBulk() {
    const payload = Object.entries(bulkEdits)
      .map(([id, v]) => ({
        id,
        ...(v.manual !== undefined && v.manual !== '' ? { manualRate: num(v.manual) ?? undefined } : {}),
        ...(v.buy !== undefined && v.buy !== '' ? { buyRate: num(v.buy) ?? undefined } : {}),
        ...(v.sell !== undefined && v.sell !== '' ? { sellRate: num(v.sell) ?? undefined } : {}),
      }))
      .filter((p) => 'manualRate' in p || 'buyRate' in p || 'sellRate' in p);
    if (payload.length === 0) return;
    setBulkSaving(true);
    const res = await bulkUpdateRates({ items: payload, csrf });
    setBulkSaving(false);
    if (res.ok) {
      setBulkEdits({});
      setBulk(false);
      router.refresh();
    } else {
      alert(res.error);
    }
  }

  return (
    <div>
      {/* Toolbar */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search pair" className="h-9 w-44" />
          <SelectNative value={status} onChange={(e) => setStatus(e.target.value as typeof status)} className="h-9 w-32">
            <option value="all">All status</option>
            <option value="published">Published</option>
            <option value="hidden">Hidden</option>
          </SelectNative>
          <SelectNative value={modeFilter} onChange={(e) => setModeFilter(e.target.value as typeof modeFilter)} className="h-9 w-32">
            <option value="all">All modes</option>
            {MODES.map((m) => <option key={m} value={m}>{m}</option>)}
          </SelectNative>
          <label className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <input type="checkbox" checked={featuredOnly} onChange={(e) => setFeaturedOnly(e.target.checked)} className="h-4 w-4 accent-[hsl(var(--primary))]" />
            Featured
          </label>
        </div>
        <div className="flex items-center gap-2">
          <Button variant={bulk ? 'primary' : 'secondary'} size="sm" onClick={() => setBulk((v) => !v)}>
            {bulk ? 'Exit bulk edit' : 'Bulk edit'}
          </Button>
          <Button variant="cta" size="sm" onClick={() => setAddOpen((v) => !v)}>
            <Plus className="h-4 w-4" /> Add pair
          </Button>
        </div>
      </div>

      {addOpen && <AddPairForm csrf={csrf} onDone={() => { setAddOpen(false); router.refresh(); }} />}

      {bulk && (
        <div className="mb-3 flex items-center justify-between rounded-lg border border-primary/30 bg-primary/5 px-4 py-2 text-sm">
          <span className="text-muted-foreground">Edit buy / sell / manual across rows, then save once.</span>
          <Button variant="cta" size="sm" loading={bulkSaving} onClick={saveBulk}>
            <Save className="h-4 w-4" /> Save all changes
          </Button>
        </div>
      )}

      <div className="surface-card overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-xs uppercase tracking-wide text-muted-foreground">
                <th className="px-4 py-3 text-start font-medium">Pair</th>
                <th className="px-4 py-3 text-start font-medium">Buy</th>
                <th className="px-4 py-3 text-start font-medium">Sell</th>
                <th className="px-4 py-3 text-start font-medium">Display</th>
                <th className="px-4 py-3 text-start font-medium">Mode</th>
                <th className="px-4 py-3 text-start font-medium">Source</th>
                <th className="px-4 py-3 text-center font-medium">Feat.</th>
                <th className="px-4 py-3 text-center font-medium">Status</th>
                <th className="px-4 py-3 text-end font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={9} className="px-4 py-10 text-center text-muted-foreground">No matching pairs.</td></tr>
              ) : (
                filtered.map((r) => (
                  <RateRow
                    key={r.id}
                    rate={r}
                    csrf={csrf}
                    bulk={bulk}
                    bulkValue={bulkEdits[r.id]}
                    onBulkChange={(field, val) =>
                      setBulkEdits((s) => {
                        const cur = s[r.id] ?? { buy: r.buyRate ?? '', sell: r.sellRate ?? '', manual: r.manualRate ?? '' };
                        return { ...s, [r.id]: { ...cur, [field]: val } };
                      })
                    }
                    onChanged={() => router.refresh()}
                  />
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function RateRow({
  rate: r,
  csrf,
  bulk,
  bulkValue,
  onBulkChange,
  onChanged,
}: {
  rate: RateAdminItem;
  csrf: string;
  bulk: boolean;
  bulkValue?: { buy: string; sell: string; manual: string };
  onBulkChange: (field: 'buy' | 'sell' | 'manual', val: string) => void;
  onChanged: () => void;
}) {
  const [buy, setBuy] = React.useState(r.buyRate ?? '');
  const [sell, setSell] = React.useState(r.sellRate ?? '');
  const [manual, setManual] = React.useState(r.manualRate ?? '');
  const [mode, setMode] = React.useState(r.mode);
  const [saved, setSaved] = React.useState(false);
  const [pending, setPending] = React.useState(false);

  async function call(action: Promise<{ ok: boolean; error?: string }>, mark = false) {
    setPending(true);
    const res = await action;
    setPending(false);
    if (!res.ok) return alert(res.error);
    if (mark) { setSaved(true); setTimeout(() => setSaved(false), 1500); }
    onChanged();
  }

  const saveRow = () =>
    call(
      updateRate({
        id: r.id,
        buyRate: buy.trim() ? num(buy) : null,
        sellRate: sell.trim() ? num(sell) : null,
        manualRate: manual.trim() ? num(manual) : null,
        mode: mode as 'AUTO' | 'MANUAL' | 'ADJUSTED',
        csrf,
      }),
      true,
    );

  const cellInput = (val: string, set: (v: string) => void, bulkField: 'buy' | 'sell' | 'manual') => (
    <Input
      value={bulk ? bulkValue?.[bulkField] ?? val : val}
      onChange={(e) => {
        const v = e.target.value.replace(/[^\d.,]/g, '');
        if (bulk) onBulkChange(bulkField, v);
        else set(v);
      }}
      className="h-8 w-24"
      dir="ltr"
      inputMode="decimal"
    />
  );

  return (
    <tr className="border-b border-border/60 last:border-0 hover:bg-muted/40">
      <td className="px-4 py-2.5">
        <span className="flex items-center gap-2">
          <CurrencyPairIcons base={r.base} quote={r.quote} size={18} />
          <span className="font-mono">{r.displayLabel ?? `${r.base}/${r.quote}`}</span>
        </span>
      </td>
      <td className="px-4 py-2.5">{cellInput(buy, setBuy, 'buy')}</td>
      <td className="px-4 py-2.5">{cellInput(sell, setSell, 'sell')}</td>
      <td className="px-4 py-2.5">{bulk ? cellInput(manual, setManual, 'manual') : (
        <span className="tabular-nums text-muted-foreground" dir="ltr">
          {r.displayRate != null ? formatRate(r.displayRate, r.base, r.quote, 'en') : '—'}
        </span>
      )}</td>
      <td className="px-4 py-2.5">
        <SelectNative value={mode} onChange={(e) => setMode(e.target.value)} className="h-8 w-28" disabled={bulk}>
          {MODES.map((m) => <option key={m} value={m}>{m}</option>)}
        </SelectNative>
      </td>
      <td className="px-4 py-2.5 text-xs text-muted-foreground">{r.sourceLabel}</td>
      <td className="px-4 py-2.5 text-center">
        <button aria-label="Feature" onClick={() => call(updateRate({ id: r.id, isFeatured: !r.isFeatured, csrf }))} className="inline-flex">
          <Star className={cn('h-4 w-4', r.isFeatured ? 'fill-warning text-warning' : 'text-muted-foreground')} />
        </button>
      </td>
      <td className="px-4 py-2.5 text-center">
        <button aria-label="Toggle publish" onClick={() => call(updateRate({ id: r.id, isPublished: !r.isPublished, csrf }))} className="inline-flex">
          {r.isPublished ? <Eye className="h-4 w-4 text-success" /> : <EyeOff className="h-4 w-4 text-muted-foreground" />}
        </button>
      </td>
      <td className="px-4 py-2.5">
        <div className="flex items-center justify-end gap-1">
          {!bulk && (
            <Button variant="secondary" size="sm" loading={pending} onClick={saveRow}>
              {saved ? <Check className="h-4 w-4 text-success" /> : 'Save'}
            </Button>
          )}
          <Button
            variant="icon"
            size="icon"
            aria-label="Archive"
            onClick={() => confirm(`Archive ${r.base}/${r.quote}?`) && call(archiveRate({ id: r.id, csrf }))}
          >
            <Archive className="h-4 w-4 text-destructive" />
          </Button>
        </div>
      </td>
    </tr>
  );
}

function AddPairForm({ csrf, onDone }: { csrf: string; onDone: () => void }) {
  const [f, setF] = React.useState({
    base: '', quote: '', sourceLabel: 'market', mode: 'MANUAL',
    manualRate: '', buyRate: '', sellRate: '', displayLabel: '', order: '0', isFeatured: false, isPublished: true,
  });
  const set = <K extends keyof typeof f>(k: K, v: (typeof f)[K]) => setF((s) => ({ ...s, [k]: v }));
  const [pending, setPending] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    setError(null);
    const res = await createRate({
      base: f.base.toUpperCase(), quote: f.quote.toUpperCase(), sourceLabel: f.sourceLabel,
      mode: f.mode as 'AUTO' | 'MANUAL' | 'ADJUSTED',
      manualRate: num(f.manualRate), buyRate: num(f.buyRate), sellRate: num(f.sellRate), apiRate: num(f.manualRate),
      spreadPct: null, displayLabel: f.displayLabel || null, displayDecimals: null, note: null,
      isFeatured: f.isFeatured, isPublished: f.isPublished, order: Number(f.order) || 0, csrf,
    });
    setPending(false);
    if (!res.ok) setError(res.error ?? 'Failed.');
    else onDone();
  }

  return (
    <form onSubmit={submit} className="surface-card mb-4 grid grid-cols-2 gap-4 p-6 lg:grid-cols-4">
      <div><Label>Base</Label><Input value={f.base} onChange={(e) => set('base', e.target.value.toUpperCase())} placeholder="USD" maxLength={8} /></div>
      <div><Label>Quote</Label><Input value={f.quote} onChange={(e) => set('quote', e.target.value.toUpperCase())} placeholder="TRY" maxLength={8} /></div>
      <div><Label>Source label</Label><Input value={f.sourceLabel} onChange={(e) => set('sourceLabel', e.target.value)} placeholder="market / official / NIMA" /></div>
      <div><Label>Mode</Label><SelectNative value={f.mode} onChange={(e) => set('mode', e.target.value)}>{MODES.map((m) => <option key={m} value={m}>{m}</option>)}</SelectNative></div>
      <div><Label>Manual / display rate</Label><Input value={f.manualRate} onChange={(e) => set('manualRate', e.target.value.replace(/[^\d.,]/g, ''))} dir="ltr" placeholder="41.25" /></div>
      <div><Label>Buy</Label><Input value={f.buyRate} onChange={(e) => set('buyRate', e.target.value.replace(/[^\d.,]/g, ''))} dir="ltr" /></div>
      <div><Label>Sell</Label><Input value={f.sellRate} onChange={(e) => set('sellRate', e.target.value.replace(/[^\d.,]/g, ''))} dir="ltr" /></div>
      <div><Label>Display label (optional)</Label><Input value={f.displayLabel} onChange={(e) => set('displayLabel', e.target.value)} placeholder="USD / TOMAN" /></div>
      <div className="col-span-2 flex items-center gap-4 lg:col-span-4">
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={f.isFeatured} onChange={(e) => set('isFeatured', e.target.checked)} className="h-4 w-4 accent-[hsl(var(--primary))]" /> Feature on homepage</label>
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={f.isPublished} onChange={(e) => set('isPublished', e.target.checked)} className="h-4 w-4 accent-[hsl(var(--primary))]" /> Published</label>
        <div className="w-24"><Label>Order</Label><Input value={f.order} onChange={(e) => set('order', e.target.value.replace(/[^\d]/g, ''))} className="h-9" /></div>
        <Button type="submit" variant="cta" size="sm" loading={pending} className="ms-auto">Create pair</Button>
        {error && <span className="text-xs text-destructive">{error}</span>}
      </div>
    </form>
  );
}
