import * as React from 'react';
import { cn } from '@/lib/utils';

export function PageHeader({ title, description, action }: { title: string; description?: string; action?: React.ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="text-h2 font-semibold">{title}</h1>
        {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
      </div>
      {action}
    </div>
  );
}

export function StatCard({
  label,
  value,
  hint,
  icon,
}: {
  label: string;
  value: React.ReactNode;
  hint?: string;
  icon?: React.ReactNode;
}) {
  return (
    <div className="surface-card p-5">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{label}</p>
        {icon && <span className="text-muted-foreground">{icon}</span>}
      </div>
      <p className="mt-2 font-display text-3xl font-semibold tabular-nums">{value}</p>
      {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

const STATUS_STYLES: Record<string, string> = {
  NEW: 'border-primary/30 bg-primary/10 text-primary',
  REVIEWING: 'border-warning/30 bg-warning/10 text-warning',
  CONTACTED: 'border-accent/30 bg-accent/10 text-accent',
  QUOTED: 'border-accent/30 bg-accent/10 text-accent',
  COMPLETED: 'border-success/30 bg-success/10 text-success',
  REJECTED: 'border-destructive/30 bg-destructive/10 text-destructive',
  ARCHIVED: 'border-border bg-muted/50 text-muted-foreground',
  IN_PROGRESS: 'border-warning/30 bg-warning/10 text-warning',
};

export function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium',
        STATUS_STYLES[status] ?? 'border-border bg-muted/50 text-muted-foreground',
      )}
    >
      {status.charAt(0) + status.slice(1).toLowerCase().replace('_', ' ')}
    </span>
  );
}
