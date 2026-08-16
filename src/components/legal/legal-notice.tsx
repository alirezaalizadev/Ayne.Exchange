import { useTranslations } from 'next-intl';
import { AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';

export function LegalNotice() {
  const t = useTranslations('legal');
  return (
    <div className="mb-8 flex items-start gap-3 rounded-xl border border-warning/30 bg-warning/10 p-4">
      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-warning" />
      <p className="text-xs leading-relaxed text-muted-foreground">{t('draftNotice')}</p>
    </div>
  );
}

/** Prose wrapper for legal copy — consistent heading/paragraph rhythm. */
export function LegalBody({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={cn(
        'space-y-4 text-sm leading-relaxed text-muted-foreground',
        '[&_h2]:mt-8 [&_h2]:text-h3 [&_h2]:font-semibold [&_h2]:text-foreground',
        '[&_p]:leading-relaxed',
        className,
      )}
    >
      {children}
    </div>
  );
}
