'use client';

import * as React from 'react';
import { useSearchParams } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import { useTranslations } from 'next-intl';
import { ArrowLeft, ArrowRight, Check, Copy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label, FieldError } from '@/components/ui/label';
import { SelectNative } from '@/components/ui/select-native';
import { services } from '@/lib/config/services';
import { currencies } from '@/lib/config/currencies';
import { countries, flagEmoji } from '@/lib/config/countries';
import { submitQuote } from '@/lib/quote/actions';
import type { QuoteActionResult } from '@/lib/quote/types';
import { cn } from '@/lib/utils';

type FormState = {
  serviceKey: string;
  sendAmount: string;
  sendCurrency: string;
  receiveCurrency: string;
  originCountry: string;
  destinationCountry: string;
  purpose: string;
  clientType: 'BUSINESS' | 'INDIVIDUAL';
  timing: string;
  notes: string;
  contactMethod: 'WHATSAPP' | 'TELEGRAM' | 'EMAIL' | 'PHONE';
  contactValue: string;
  consent: boolean;
  company_website: string; // honeypot
};

const STEP_KEYS = ['stepDetails', 'stepRoute', 'stepContact', 'stepReview'] as const;

export function QuoteForm() {
  const t = useTranslations('quote');
  const tServices = useTranslations('services');
  const params = useSearchParams();

  const [step, setStep] = React.useState(0);
  const [direction, setDirection] = React.useState(1);
  const [pending, setPending] = React.useState(false);
  const [result, setResult] = React.useState<QuoteActionResult | null>(null);
  const [errors, setErrors] = React.useState<Record<string, string>>({});

  const [form, setForm] = React.useState<FormState>({
    serviceKey: params.get('service') && services.some((s) => s.key === params.get('service'))
      ? params.get('service')!
      : 'swift',
    sendAmount: params.get('amount') ?? '',
    sendCurrency: params.get('from') ?? 'USD',
    receiveCurrency: params.get('to') ?? 'EUR',
    originCountry: '',
    destinationCountry: '',
    purpose: '',
    clientType: 'BUSINESS',
    timing: '',
    notes: '',
    contactMethod: 'WHATSAPP',
    contactValue: '',
    consent: false,
    company_website: '',
  });

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  function validateStep(current: number): boolean {
    const e: Record<string, string> = {};
    if (current === 0) {
      if (!form.serviceKey) e.serviceKey = t('serviceType');
      if (form.sendAmount && Number(form.sendAmount) <= 0) e.sendAmount = t('sendAmount');
    }
    if (current === 2) {
      if (form.contactValue.trim().length < 3) e.contactValue = t('contactInfo');
      if (!form.consent) e.consent = t('consent');
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function next() {
    if (!validateStep(step)) return;
    setDirection(1);
    setStep((s) => Math.min(s + 1, STEP_KEYS.length - 1));
  }
  function back() {
    setDirection(-1);
    setStep((s) => Math.max(s - 1, 0));
  }

  async function onSubmit() {
    if (!validateStep(2)) {
      setStep(2);
      return;
    }
    setPending(true);
    setResult(null);
    const payload = {
      serviceKey: form.serviceKey,
      sendAmount: form.sendAmount ? Number(form.sendAmount) : undefined,
      sendCurrency: form.sendCurrency || undefined,
      receiveCurrency: form.receiveCurrency || undefined,
      originCountry: form.originCountry || undefined,
      destinationCountry: form.destinationCountry || undefined,
      purpose: form.purpose || undefined,
      clientType: form.clientType,
      timing: form.timing || undefined,
      notes: form.notes || undefined,
      contactMethod: form.contactMethod,
      contactValue: form.contactValue,
      consent: form.consent as true,
      company_website: form.company_website,
    };
    const res = await submitQuote(payload);
    setPending(false);
    if (res.ok) {
      setResult(res);
    } else {
      setResult(res);
      if (res.fieldErrors) setErrors(res.fieldErrors);
    }
  }

  if (result?.ok) {
    return <QuoteSuccess reference={result.reference!} />;
  }

  return (
    <div className="surface-card p-6 sm:p-8">
      <Stepper step={step} />

      {result && !result.ok && result.error && (
        <div className="mt-6 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {result.error}
        </div>
      )}

      <div className="relative mt-6 overflow-hidden">
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={step}
            custom={direction}
            initial={{ opacity: 0, x: direction * 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: direction * -40 }}
            transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
          >
            {step === 0 && (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field label={t('serviceType')} error={errors.serviceKey} className="sm:col-span-2">
                  <SelectNative value={form.serviceKey} onChange={(e) => set('serviceKey', e.target.value)}>
                    {services.map((s) => (
                      <option key={s.key} value={s.key}>
                        {tServices(`${s.key}.name`)}
                      </option>
                    ))}
                  </SelectNative>
                </Field>
                <Field label={t('sendAmount')} error={errors.sendAmount}>
                  <Input
                    inputMode="decimal"
                    placeholder="10,000"
                    value={form.sendAmount}
                    onChange={(e) => set('sendAmount', e.target.value.replace(/[^\d.]/g, ''))}
                    invalid={!!errors.sendAmount}
                  />
                </Field>
                <Field label={t('clientType')}>
                  <div className="grid grid-cols-2 gap-2">
                    {(['BUSINESS', 'INDIVIDUAL'] as const).map((ct) => (
                      <button
                        key={ct}
                        type="button"
                        onClick={() => set('clientType', ct)}
                        className={cn(
                          'h-11 rounded-lg border text-sm font-medium transition-colors',
                          form.clientType === ct
                            ? 'border-primary bg-primary/10 text-primary'
                            : 'border-input text-muted-foreground hover:border-primary/40',
                        )}
                      >
                        {t(ct === 'BUSINESS' ? 'business' : 'individual')}
                      </button>
                    ))}
                  </div>
                </Field>
                <Field label={t('sendCurrency')}>
                  <SelectNative value={form.sendCurrency} onChange={(e) => set('sendCurrency', e.target.value)}>
                    {currencies.map((c) => (
                      <option key={c.code} value={c.code}>{c.code} — {c.name}</option>
                    ))}
                  </SelectNative>
                </Field>
                <Field label={t('receiveCurrency')}>
                  <SelectNative value={form.receiveCurrency} onChange={(e) => set('receiveCurrency', e.target.value)}>
                    {currencies.map((c) => (
                      <option key={c.code} value={c.code}>{c.code} — {c.name}</option>
                    ))}
                  </SelectNative>
                </Field>
              </div>
            )}

            {step === 1 && (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field label={t('originCountry')}>
                  <SelectNative value={form.originCountry} onChange={(e) => set('originCountry', e.target.value)}>
                    <option value="">—</option>
                    {countries.map((c) => (
                      <option key={c.code} value={c.code}>{flagEmoji(c.code)} {c.name}</option>
                    ))}
                  </SelectNative>
                </Field>
                <Field label={t('destinationCountry')}>
                  <SelectNative value={form.destinationCountry} onChange={(e) => set('destinationCountry', e.target.value)}>
                    <option value="">—</option>
                    {countries.map((c) => (
                      <option key={c.code} value={c.code}>{flagEmoji(c.code)} {c.name}</option>
                    ))}
                  </SelectNative>
                </Field>
                <Field label={t('purpose')} className="sm:col-span-2">
                  <Input
                    placeholder="e.g. Import payment for goods"
                    value={form.purpose}
                    onChange={(e) => set('purpose', e.target.value)}
                    maxLength={500}
                  />
                </Field>
                <Field label={t('timing')} className="sm:col-span-2">
                  <SelectNative value={form.timing} onChange={(e) => set('timing', e.target.value)}>
                    <option value="">—</option>
                    <option value="ASAP">As soon as possible</option>
                    <option value="THIS_WEEK">This week</option>
                    <option value="THIS_MONTH">This month</option>
                    <option value="FLEXIBLE">Flexible / planning ahead</option>
                  </SelectNative>
                </Field>
              </div>
            )}

            {step === 2 && (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field label={t('contactMethod')}>
                  <SelectNative
                    value={form.contactMethod}
                    onChange={(e) => set('contactMethod', e.target.value as FormState['contactMethod'])}
                  >
                    <option value="WHATSAPP">WhatsApp</option>
                    <option value="TELEGRAM">Telegram</option>
                    <option value="EMAIL">Email</option>
                    <option value="PHONE">Phone</option>
                  </SelectNative>
                </Field>
                <Field label={t('contactInfo')} error={errors.contactValue}>
                  <Input
                    placeholder={form.contactMethod === 'EMAIL' ? 'you@company.com' : '+90 5xx xxx xx xx'}
                    value={form.contactValue}
                    onChange={(e) => set('contactValue', e.target.value)}
                    invalid={!!errors.contactValue}
                  />
                </Field>
                <Field label={t('notes')} className="sm:col-span-2">
                  <Textarea
                    placeholder="Anything else we should know?"
                    value={form.notes}
                    onChange={(e) => set('notes', e.target.value)}
                    maxLength={1500}
                  />
                </Field>
                <div className="sm:col-span-2">
                  <label className="flex cursor-pointer items-start gap-3">
                    <input
                      type="checkbox"
                      checked={form.consent}
                      onChange={(e) => set('consent', e.target.checked)}
                      className="mt-0.5 h-4 w-4 shrink-0 accent-[hsl(var(--primary))]"
                    />
                    <span className="text-sm text-muted-foreground">{t('consent')}</span>
                  </label>
                  <FieldError>{errors.consent}</FieldError>
                </div>
              </div>
            )}

            {step === 3 && <ReviewStep form={form} />}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Honeypot — visually hidden, off-screen, not a display:none (some bots skip those) */}
      <div aria-hidden className="absolute -left-[9999px] top-0 h-0 w-0 overflow-hidden">
        <label>
          Company website
          <input
            tabIndex={-1}
            autoComplete="off"
            value={form.company_website}
            onChange={(e) => set('company_website', e.target.value)}
          />
        </label>
      </div>

      {/* Nav */}
      <div className="mt-8 flex items-center justify-between gap-3">
        <Button variant="ghost" onClick={back} disabled={step === 0 || pending} className={step === 0 ? 'invisible' : ''}>
          <ArrowLeft className="h-4 w-4 rtl:rotate-180" />
          {t('back')}
        </Button>
        {step < STEP_KEYS.length - 1 ? (
          <Button variant="cta" onClick={next} disabled={pending}>
            {t('next')}
            <ArrowRight className="h-4 w-4 rtl:rotate-180" />
          </Button>
        ) : (
          <Button variant="cta" onClick={onSubmit} loading={pending} disabled={pending}>
            {t('submit')}
          </Button>
        )}
      </div>
    </div>
  );
}

function Stepper({ step }: { step: number }) {
  const t = useTranslations('quote');
  return (
    <ol className="flex items-center gap-2">
      {STEP_KEYS.map((key, i) => {
        const active = i === step;
        const done = i < step;
        return (
          <li key={key} className="flex flex-1 items-center gap-2">
            <span
              className={cn(
                'flex h-8 w-8 shrink-0 items-center justify-center rounded-full border text-xs font-semibold transition-colors',
                done && 'border-primary bg-primary text-primary-foreground',
                active && 'border-primary text-primary',
                !active && !done && 'border-border text-muted-foreground',
              )}
            >
              {done ? <Check className="h-4 w-4" /> : i + 1}
            </span>
            <span className={cn('hidden text-xs font-medium sm:block', active ? 'text-foreground' : 'text-muted-foreground')}>
              {t(key)}
            </span>
            {i < STEP_KEYS.length - 1 && <span className="h-px flex-1 bg-border" />}
          </li>
        );
      })}
    </ol>
  );
}

function ReviewStep({ form }: { form: FormState }) {
  const t = useTranslations('quote');
  const tServices = useTranslations('services');
  const rows: [string, string][] = [
    [t('serviceType'), tServices(`${form.serviceKey}.name`)],
    [t('sendAmount'), form.sendAmount ? `${form.sendAmount} ${form.sendCurrency}` : '—'],
    [t('receiveCurrency'), form.receiveCurrency],
    [t('originCountry'), form.originCountry || '—'],
    [t('destinationCountry'), form.destinationCountry || '—'],
    [t('clientType'), t(form.clientType === 'BUSINESS' ? 'business' : 'individual')],
    [t('contactMethod'), form.contactMethod],
    [t('contactInfo'), form.contactValue || '—'],
  ];
  return (
    <dl className="divide-y divide-border rounded-xl border border-border">
      {rows.map(([k, v]) => (
        <div key={k} className="flex items-center justify-between gap-4 px-4 py-3">
          <dt className="text-sm text-muted-foreground">{k}</dt>
          <dd className="text-sm font-medium text-end">{v}</dd>
        </div>
      ))}
    </dl>
  );
}

function QuoteSuccess({ reference }: { reference: string }) {
  const t = useTranslations('quote');
  const [copied, setCopied] = React.useState(false);
  return (
    <div className="surface-card p-8 text-center">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-success/15 text-success">
        <Check className="h-7 w-7" />
      </div>
      <h2 className="mt-5 text-h2 font-semibold">{t('successTitle')}</h2>
      <p className="mx-auto mt-3 max-w-md text-sm text-muted-foreground">{t('successBody')}</p>
      <div className="mx-auto mt-6 flex max-w-xs items-center justify-between gap-3 rounded-lg border border-border bg-surface-raised px-4 py-3">
        <div className="text-start">
          <p className="text-[0.65rem] uppercase tracking-wide text-muted-foreground">{t('reference')}</p>
          <p className="font-mono text-sm font-semibold">{reference}</p>
        </div>
        <button
          type="button"
          onClick={() => {
            navigator.clipboard?.writeText(reference);
            setCopied(true);
            setTimeout(() => setCopied(false), 1500);
          }}
          className="inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:text-foreground"
          aria-label="Copy reference"
        >
          {copied ? <Check className="h-4 w-4 text-success" /> : <Copy className="h-4 w-4" />}
        </button>
      </div>
    </div>
  );
}

function Field({
  label,
  error,
  className,
  children,
}: {
  label: string;
  error?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={className}>
      <Label>{label}</Label>
      {children}
      <FieldError>{error}</FieldError>
    </div>
  );
}
