'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { SelectNative } from '@/components/ui/select-native';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { updateQuoteStatus, addQuoteNote } from '@/lib/admin/quote-actions';

const STATUSES = ['NEW', 'REVIEWING', 'CONTACTED', 'QUOTED', 'COMPLETED', 'REJECTED', 'ARCHIVED'];

export function StatusChanger({ id, current, csrf }: { id: string; current: string; csrf: string }) {
  const router = useRouter();
  const [status, setStatus] = React.useState(current);
  const [pending, setPending] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  async function save(next: string) {
    setPending(true);
    setError(null);
    const res = await updateQuoteStatus({ id, status: next, csrf });
    setPending(false);
    if (!res.ok) {
      setError(res.error ?? 'Failed to update.');
      setStatus(current);
    } else {
      router.refresh();
    }
  }

  return (
    <div>
      <Label>Status</Label>
      <SelectNative
        value={status}
        disabled={pending}
        onChange={(e) => {
          setStatus(e.target.value);
          save(e.target.value);
        }}
      >
        {STATUSES.map((s) => (
          <option key={s} value={s}>
            {s.charAt(0) + s.slice(1).toLowerCase()}
          </option>
        ))}
      </SelectNative>
      {error && <p className="mt-1.5 text-xs text-destructive">{error}</p>}
    </div>
  );
}

export function NoteForm({ quoteId, csrf }: { quoteId: string; csrf: string }) {
  const router = useRouter();
  const [body, setBody] = React.useState('');
  const [pending, setPending] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!body.trim()) return;
    setPending(true);
    setError(null);
    const res = await addQuoteNote({ quoteId, body, csrf });
    setPending(false);
    if (!res.ok) {
      setError(res.error ?? 'Failed to add note.');
    } else {
      setBody('');
      router.refresh();
    }
  }

  return (
    <form onSubmit={submit} className="space-y-3">
      <Textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder="Add an internal note…"
        maxLength={2000}
      />
      {error && <p className="text-xs text-destructive">{error}</p>}
      <Button type="submit" variant="secondary" size="sm" loading={pending} disabled={!body.trim()}>
        Add note
      </Button>
    </form>
  );
}
