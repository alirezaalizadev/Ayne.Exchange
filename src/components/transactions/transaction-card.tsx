'use client';

import { useLocale, useTranslations } from 'next-intl';
import { ArrowRight } from 'lucide-react';
import { LogoMark } from '@/components/brand/logo';
import { ServiceIcon } from '@/components/services/service-icon';
import { countryByCode, flagEmoji } from '@/lib/config/countries';
import { serviceByKey, type ServiceKey } from '@/lib/config/services';
import { formatTransactionAmount } from '@/lib/transactions/display';
import type { PublicTransaction } from '@/lib/transactions/service';
import { cn } from '@/lib/utils';

const STATUS_STYLES: Record<string, string> = {
  COMPLETED: 'border-success/30 bg-success/10 text-success',
  PROCESSING: 'border-warning/30 bg-warning/10 text-warning',
  PENDING: 'border-primary/30 bg-primary/10 text-primary',
  CANCELLED: 'border-destructive/30 bg-destructive/10 text-destructive',
};

function Flag({ code }: { code: string }) {
  const emoji = flagEmoji(code);
  return (
    <span className="inline-flex h-8 w-8 items-center justify-center overflow-hidden rounded-full border border-border bg-surface-raised text-lg leading-none">
      {emoji || code}
    </span>
  );
}

export function TransactionCard({
  tx,
  onClick,
}: {
  tx: PublicTransaction;
  onClick?: () => void;
}) {
  const t = useTranslations('transactions');
  const ts = useTranslations('services');
  const locale = useLocale();

  const svc = serviceByKey(tx.serviceKey as ServiceKey);
  const serviceLabel = svc ? ts(`${svc.key}.name`) : t('businessPayment');
  const amount = formatTransactionAmount(tx, locale);
  const dateFmt = new Intl.DateTimeFormat(locale === 'fa' ? 'fa-IR' : locale === 'ru' ? 'ru-RU' : 'en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(tx.occurredOn));

  const originName = countryByCode(tx.originCountry)?.name ?? tx.originCountry;
  const destName = countryByCode(tx.destinationCountry)?.name ?? tx.destinationCountry;

  const Wrapper: React.ElementType = onClick ? 'button' : 'div';

  return (
    <Wrapper
      onClick={onClick}
      className={cn(
        'surface-card group flex w-full flex-col p-5 text-start transition-all duration-base ease-premium',
        onClick && 'cursor-pointer hover:-translate-y-1 hover:border-primary/30 hover:shadow-lg',
      )}
    >
      {/* Top row: brand + service icon + status */}
      <div className="flex items-center justify-between">
        <span className="inline-flex items-center gap-2">
          <LogoMark gradient idSuffix={`tx-${tx.id}`} className="h-6 w-6" />
          <ServiceIcon name={svc?.icon ?? 'banknote'} accent={svc?.accent ?? 'primary'} className="h-8 w-8" />
        </span>
        <span
          className={cn(
            'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium',
            STATUS_STYLES[tx.status] ?? 'border-border bg-muted/50 text-muted-foreground',
          )}
        >
          {tx.status === 'COMPLETED' && (
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-current" />
          )}
          {t(`status${tx.status}`)}
        </span>
      </div>

      {/* Route — the most prominent element */}
      <div className="mt-5 flex items-center gap-3">
        <div className="flex min-w-0 flex-1 items-center gap-2.5">
          <Flag code={tx.originCountry} />
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold leading-tight">{originName}</p>
            {tx.originCity && <p className="truncate text-xs text-muted-foreground">{tx.originCity}</p>}
          </div>
        </div>
        <ArrowRight className="h-4 w-4 shrink-0 text-primary rtl:rotate-180" />
        <div className="flex min-w-0 flex-1 items-center justify-end gap-2.5 text-end">
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold leading-tight">{destName}</p>
            {tx.destinationCity && <p className="truncate text-xs text-muted-foreground">{tx.destinationCity}</p>}
          </div>
          <Flag code={tx.destinationCountry} />
        </div>
      </div>

      {/* Amount + service */}
      <div className="mt-5">
        {amount ? (
          <p className="font-display text-2xl font-semibold tabular-nums" dir="ltr">{amount}</p>
        ) : (
          <p className="font-display text-lg font-semibold text-muted-foreground">{serviceLabel}</p>
        )}
        {amount && <p className="mt-0.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">{serviceLabel}</p>}
      </div>

      {/* Footer: date + reference */}
      <div className="mt-4 flex items-center justify-between border-t border-border/60 pt-3 text-xs text-muted-foreground">
        <span>{dateFmt}</span>
        <span className="font-mono">{t('reference')}: {tx.publicRef}</span>
      </div>
    </Wrapper>
  );
}
