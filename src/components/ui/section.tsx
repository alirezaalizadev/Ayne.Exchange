import * as React from 'react';
import { cn } from '@/lib/utils';

/**
 * Section surfaces — gentle background alternation only (white page ↔ warm
 * tinted band). The old grid/glow/panel treatments are retired; their names
 * remain accepted so existing call sites keep working during the redesign.
 */
export type SectionSurface = 'base' | 'elevated' | 'grid' | 'glow' | 'panel';

export function Section({
  surface = 'base',
  className,
  containerClassName,
  children,
  id,
  ...props
}: React.HTMLAttributes<HTMLElement> & {
  surface?: SectionSurface;
  containerClassName?: string;
}) {
  const tinted = surface === 'elevated' || surface === 'grid';

  return (
    <section
      id={id}
      className={cn('py-16 sm:py-24 lg:py-28', tinted && 'bg-surface', className)}
      {...props}
    >
      <div className={cn('container relative', containerClassName)}>{children}</div>
    </section>
  );
}

/**
 * Typography-led section heading: small accent eyebrow, then a huge, tight,
 * bold headline. Left-aligned by default.
 */
export function SectionHeading({
  eyebrow,
  title,
  subtitle,
  index: _index, // retired visual — accepted for compatibility
  align = 'start',
  className,
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  index?: string;
  align?: 'center' | 'start';
  className?: string;
}) {
  return (
    <div className={cn('max-w-3xl', align === 'center' && 'mx-auto text-center', className)}>
      {eyebrow && <p className="eyebrow mb-3">{eyebrow}</p>}
      <h2 className="text-h1 text-balance">{title}</h2>
      {subtitle && (
        <p
          className={cn(
            'mt-4 max-w-[38rem] text-base leading-relaxed text-muted-foreground sm:text-lg text-balance',
            align === 'center' && 'mx-auto',
          )}
        >
          {subtitle}
        </p>
      )}
    </div>
  );
}
