'use client';

import * as React from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { SelectNative } from '@/components/ui/select-native';
import { TransactionCard } from './transaction-card';
import { countryByCode, flagEmoji } from '@/lib/config/countries';
import { serviceByKey, type ServiceKey } from '@/lib/config/services';
import { formatTransactionAmount } from '@/lib/transactions/display';
import type { PublicTransaction } from '@/lib/transactions/service';
import { cn } from '@/lib/utils';

const PAGE = 12;

export function TransactionsList({ txs }: { txs: PublicTransaction[] }) {
  const t = useTranslations('transactions');
  const ts = useTranslations('services');
  const locale = useLocale();

  const [service, setService] = React.useState('all');
  const [status, setStatus] = React.useState('all');
  const [q, setQ] = React.useState('');
  const [count, setCount] = React.useState(PAGE);
  const [selected, setSelected] = React.useState<PublicTransaction | null>(null);

  const services = Array.from(new Set(txs.map((x) => x.serviceKey)));
  const statuses = Array.from(new Set(txs.map((x) => x.status)));

  const filtered = txs.filter((x) => {
    if (service !== 'all' && x.serviceKey !== service) return false;
    if (status !== 'all' && x.status !== status) return false;
    if (q && !x.publicRef.toLowerCase().includes(q.toLowerCase())) return false;
    return true;
  });
  const visible = filtered.slice(0, count);

  React.useEffect(() => setCount(PAGE), [service, status, q]);

  // Close modal on Escape.
  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setSelected(null);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  return (
    <div>
      {/* Filter bar */}
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <SelectNative value={service} onChange={(e) => setService(e.target.value)} className="h-10 w-auto min-w-40">
          <option value="all">{t('filterAll')} — {t('filterService')}</option>
          {services.map((s) => {
            const svc = serviceByKey(s as ServiceKey);
            return <option key={s} value={s}>{svc ? ts(`${svc.key}.name`) : s}</option>;
          })}
        </SelectNative>
        <SelectNative value={status} onChange={(e) => setStatus(e.target.value)} className="h-10 w-auto min-w-36">
          <option value="all">{t('filterAll')} — {t('filterStatus')}</option>
          {statuses.map((s) => <option key={s} value={s}>{t(`status${s}`)}</option>)}
        </SelectNative>
        <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder={t('search')} className="h-10 w-56" />
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-surface/50 p-12 text-center text-sm text-muted-foreground">
          {t('empty')}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {visible.map((tx) => (
              <TransactionCard key={tx.id} tx={tx} onClick={() => setSelected(tx)} />
            ))}
          </div>
          {count < filtered.length && (
            <div className="mt-8 text-center">
              <Button variant="secondary" size="lg" onClick={() => setCount((c) => c + PAGE)}>
                {t('loadMore')}
              </Button>
            </div>
          )}
        </>
      )}

      {/* Detail modal (public-safe) */}
      {selected && (
        <div
          className="fixed inset-0 z-modal flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          onClick={() => setSelected(null)}
        >
          <div
            className="surface-card w-full max-w-md p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-h3 font-semibold">{t('detailTitle')}</h2>
              <button aria-label="Close" onClick={() => setSelected(null)} className="text-muted-foreground hover:text-foreground">
                <X className="h-5 w-5" />
              </button>
            </div>
            <DetailRow label={t('reference')} value={<span className="font-mono">{selected.publicRef}</span>} />
            <DetailRow
              label={t('route')}
              value={
                <span dir="ltr">
                  {flagEmoji(selected.originCountry)} {countryByCode(selected.originCountry)?.name ?? selected.originCountry}
                  {' → '}
                  {flagEmoji(selected.destinationCountry)} {countryByCode(selected.destinationCountry)?.name ?? selected.destinationCountry}
                </span>
              }
            />
            <DetailRow label={t('amount')} value={<span dir="ltr">{formatTransactionAmount(selected, locale) ?? '—'}</span>} />
            <DetailRow
              label={t('service')}
              value={serviceByKey(selected.serviceKey as ServiceKey) ? ts(`${selected.serviceKey}.name`) : selected.serviceKey}
            />
            <DetailRow
              label={t('date')}
              value={new Intl.DateTimeFormat(locale === 'fa' ? 'fa-IR' : locale === 'ru' ? 'ru-RU' : 'en-GB', { dateStyle: 'medium' }).format(new Date(selected.occurredOn))}
            />
            <DetailRow label={t('status')} value={t(`status${selected.status}`)} />
          </div>
        </div>
      )}
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className={cn('flex items-center justify-between gap-4 border-b border-border/60 py-2.5 last:border-0')}>
      <dt className="text-sm text-muted-foreground">{label}</dt>
      <dd className="text-end text-sm font-medium">{value}</dd>
    </div>
  );
}
