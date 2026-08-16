'use client';

import * as React from 'react';
import { ChevronDown, Search, Check } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { currencies, currencyMeta } from '@/lib/config/currencies';
import { CurrencyIcon } from '@/components/ui/currency-icon';
import { cn } from '@/lib/utils';

/**
 * Premium currency picker: flag + code trigger opening a searchable, keyboard-
 * navigable dropdown (search by code or name). Falls back gracefully if the
 * available list is a subset of the configured currencies.
 */
export function CurrencySelect({
  value,
  onChange,
  available,
  align = 'end',
}: {
  value: string;
  onChange: (code: string) => void;
  available: string[];
  align?: 'start' | 'end';
}) {
  const t = useTranslations('calculator');
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState('');
  const [highlight, setHighlight] = React.useState(0);
  const rootRef = React.useRef<HTMLDivElement>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);

  // Every available code gets a row: configured fiat keeps its order, then any
  // other codes (crypto / admin-added) with metadata or a fallback name.
  const list = React.useMemo(() => {
    const ordered = currencies.filter((c) => available.includes(c.code)).map((c) => c.code);
    const extra = available.filter((code) => !ordered.includes(code));
    return [...ordered, ...extra].map((code) => {
      const m = currencyMeta(code);
      return { code, name: m?.name ?? code };
    });
  }, [available]);
  const filtered = list.filter(
    (c) =>
      !query ||
      c.code.toLowerCase().includes(query.toLowerCase()) ||
      c.name.toLowerCase().includes(query.toLowerCase()),
  );

  // Close on outside click.
  React.useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [open]);

  React.useEffect(() => {
    if (open) {
      setQuery('');
      setHighlight(0);
      setTimeout(() => inputRef.current?.focus(), 10);
    }
  }, [open]);

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlight((h) => Math.min(h + 1, filtered.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlight((h) => Math.max(h - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const pick = filtered[highlight];
      if (pick) {
        onChange(pick.code);
        setOpen(false);
      }
    } else if (e.key === 'Escape') {
      setOpen(false);
    }
  }

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className={cn(
          'flex h-11 items-center gap-2 rounded-lg border border-border bg-surface px-3 transition-all duration-fast',
          'hover:border-primary/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
          open && 'border-primary/50 ring-2 ring-ring/40',
        )}
      >
        <CurrencyIcon code={value} size={20} />
        <span className="font-semibold tabular-nums">{value}</span>
        <ChevronDown className={cn('h-4 w-4 text-muted-foreground transition-transform duration-fast', open && 'rotate-180')} />
      </button>

      {open && (
        <div
          className={cn(
            'absolute z-dropdown mt-2 w-64 overflow-hidden rounded-xl border border-border glass-strong shadow-lg',
            align === 'end' ? 'end-0' : 'start-0',
          )}
          role="listbox"
        >
          <div className="flex items-center gap-2 border-b border-border px-3 py-2.5">
            <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
            <input
              ref={inputRef}
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setHighlight(0);
              }}
              onKeyDown={onKeyDown}
              placeholder={t('searchCurrency')}
              className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground/60"
            />
          </div>
          <ul className="max-h-64 overflow-y-auto p-1.5">
            {filtered.length === 0 ? (
              <li className="px-3 py-4 text-center text-xs text-muted-foreground">—</li>
            ) : (
              filtered.map((c, i) => (
                <li key={c.code}>
                  <button
                    type="button"
                    role="option"
                    aria-selected={c.code === value}
                    onClick={() => {
                      onChange(c.code);
                      setOpen(false);
                    }}
                    onMouseEnter={() => setHighlight(i)}
                    className={cn(
                      'flex w-full items-center gap-3 rounded-lg px-3 py-2 text-start text-sm transition-colors',
                      i === highlight ? 'bg-muted/70' : 'hover:bg-muted/50',
                    )}
                  >
                    <CurrencyIcon code={c.code} size={22} />
                    <span className="flex-1">
                      <span className="block font-semibold leading-tight">{c.code}</span>
                      <span className="block text-xs text-muted-foreground">{c.name}</span>
                    </span>
                    {c.code === value && <Check className="h-4 w-4 text-primary" />}
                  </button>
                </li>
              ))
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
