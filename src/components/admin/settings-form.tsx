'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { updateSettings } from '@/lib/admin/settings-actions';

const FIELDS: { key: string; label: string; hint?: string; placeholder?: string }[] = [
  { key: 'brand.name', label: 'Brand name' },
  { key: 'contact.whatsapp', label: 'WhatsApp number', hint: 'International format, e.g. +90 5xx…. Updates the site live.', placeholder: '+900000000000' },
  { key: 'contact.telegram', label: 'Telegram username', placeholder: 'ayneexchange' },
  { key: 'contact.email', label: 'Contact email', placeholder: 'contact@ayne.exchange' },
  { key: 'stats.years', label: 'Years of experience (stat)', placeholder: '7' },
  { key: 'stats.volume', label: 'Transaction experience (stat)', placeholder: '1B+' },
];

export function SettingsForm({ values, csrf }: { values: Record<string, string>; csrf: string }) {
  const router = useRouter();
  const [state, setState] = React.useState<Record<string, string>>(values);
  const [pending, setPending] = React.useState(false);
  const [saved, setSaved] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    setError(null);
    const res = await updateSettings({ values: state, csrf });
    setPending(false);
    if (!res.ok) setError(res.error ?? 'Failed to save.');
    else {
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
      router.refresh();
    }
  }

  return (
    <form onSubmit={submit} className="surface-card max-w-2xl space-y-5 p-6">
      {FIELDS.map((f) => (
        <div key={f.key}>
          <Label htmlFor={f.key}>{f.label}</Label>
          <Input
            id={f.key}
            value={state[f.key] ?? ''}
            placeholder={f.placeholder}
            onChange={(e) => setState((s) => ({ ...s, [f.key]: e.target.value }))}
          />
          {f.hint && <p className="mt-1 text-xs text-muted-foreground">{f.hint}</p>}
        </div>
      ))}
      <div className="flex items-center gap-3 pt-2">
        <Button type="submit" variant="cta" loading={pending}>
          {saved ? (
            <>
              <Check className="h-4 w-4" /> Saved
            </>
          ) : (
            'Save settings'
          )}
        </Button>
        {error && <span className="text-sm text-destructive">{error}</span>}
      </div>
    </form>
  );
}
