'use client';

import * as React from 'react';
import { useTranslations } from 'next-intl';
import { siteConfig, whatsappLink } from '@/lib/config/site';
import { cn } from '@/lib/utils';

/** Custom WhatsApp glyph (no external icon lib for the brand channel). */
function WhatsAppGlyph({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
      <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2 22l5.25-1.38a9.9 9.9 0 0 0 4.79 1.22h.01c5.46 0 9.91-4.45 9.91-9.91C21.96 6.45 17.5 2 12.04 2Zm5.8 14.02c-.24.68-1.4 1.3-1.94 1.35-.5.05-1.13.24-3.7-.77-3.11-1.23-5.09-4.4-5.24-4.6-.15-.2-1.25-1.66-1.25-3.17 0-1.5.79-2.24 1.07-2.55.28-.31.61-.38.81-.38.2 0 .4 0 .58.01.19.01.44-.07.68.52.24.6.83 2.06.9 2.2.07.15.12.32.02.52-.1.2-.15.32-.3.5-.15.17-.31.39-.44.52-.15.15-.3.31-.13.6.17.3.76 1.25 1.63 2.02 1.12 1 2.06 1.31 2.36 1.46.3.15.47.13.64-.08.17-.2.74-.86.94-1.16.2-.3.4-.25.67-.15.27.1 1.71.81 2.01.96.3.15.5.22.57.34.07.13.07.72-.17 1.4Z" />
    </svg>
  );
}

export function WhatsAppButton() {
  const t = useTranslations('common');
  // Start from build-time env, then refine with the live admin-editable value.
  const [number, setNumber] = React.useState(siteConfig.contact.whatsapp);

  React.useEffect(() => {
    fetch('/api/site-config')
      .then((r) => r.json())
      .then((d) => {
        if (d?.whatsapp) setNumber(d.whatsapp);
      })
      .catch(() => {});
  }, []);

  const [pulse, setPulse] = React.useState(false);
  React.useEffect(() => {
    // Occasional subtle pulse to draw the eye without being annoying.
    const id = setInterval(() => {
      setPulse(true);
      setTimeout(() => setPulse(false), 2400);
    }, 16000);
    return () => clearInterval(id);
  }, []);

  if (!number) return null;

  return (
    <a
      href={whatsappLink(number, 'Hello Ayne Exchange, I would like to request a quote.')}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={t('chatWithUs')}
      className={cn(
        'group fixed bottom-5 z-header inline-flex items-center gap-0 rounded-full',
        'bg-[#1FA855] text-white shadow-lg ring-1 ring-black/10',
        'transition-all duration-base ease-premium hover:shadow-xl hover:-translate-y-0.5',
        'end-5 h-14 ps-4 pe-4 sm:pe-4',
      )}
    >
      <span className="relative flex h-7 w-7 items-center justify-center">
        {pulse && (
          <span className="absolute inset-0 animate-ping rounded-full bg-white/40" />
        )}
        <WhatsAppGlyph className="h-7 w-7" />
      </span>
      <span
        className={cn(
          'grid grid-cols-[0fr] transition-all duration-slow ease-premium',
          'group-hover:grid-cols-[1fr] group-hover:ms-2',
        )}
      >
        <span className="overflow-hidden whitespace-nowrap text-sm font-semibold">
          {t('chatWithUs')}
        </span>
      </span>
    </a>
  );
}
