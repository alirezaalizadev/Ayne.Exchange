import * as React from 'react';
import { cn } from '@/lib/utils';

/**
 * Section surfaces — a small, reusable set of background treatments so the
 * homepage reads as distinct compositions (not one long block) while staying
 * within the Ayne palette. Separation comes from tone/texture/glow, never
 * random colours.
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
  const surfaceClass = {
    base: '',
    elevated: 'bg-surface/50 border-y border-border/60',
    grid: 'relative overflow-hidden',
    glow: 'relative overflow-hidden',
    panel: 'relative',
  }[surface];

  const inner =
    surface === 'panel' ? (
      // Inset premium panel: rounded bordered container with its own glow.
      <div className="relative overflow-hidden rounded-3xl border border-border bg-surface/60 px-5 py-12 shadow-sm sm:px-10 sm:py-16">
        <div aria-hidden className="pointer-events-none absolute inset-0">
          <div className="absolute inset-x-0 top-0 h-72 bg-radial-glow opacity-60" />
        </div>
        <div className={cn('relative', containerClassName)}>{children}</div>
      </div>
    ) : (
      children
    );

  return (
    <section
      id={id}
      className={cn('py-20 sm:py-28 lg:py-32', surfaceClass, className)}
      {...props}
    >
      {surface === 'grid' && (
        <div aria-hidden className="pointer-events-none absolute inset-0 -z-0">
          <div className="absolute inset-0 grid-texture opacity-[0.35]" />
        </div>
      )}
      {surface === 'glow' && (
        <div aria-hidden className="pointer-events-none absolute inset-0 -z-0">
          <div className="absolute inset-x-0 top-0 h-[460px] bg-radial-glow opacity-70" />
        </div>
      )}
      <div className={cn('container relative', surface === 'panel' && 'max-w-6xl', containerClassName)}>
        {inner}
      </div>
    </section>
  );
}

/** Section heading with a consistent vertical rhythm (eyebrow → title → lead). */
export function SectionHeading({
  eyebrow,
  title,
  subtitle,
  align = 'center',
  className,
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  align?: 'center' | 'start';
  className?: string;
}) {
  return (
    <div
      className={cn(
        'max-w-2xl',
        align === 'center' ? 'mx-auto text-center' : 'text-start',
        className,
      )}
    >
      {eyebrow && <p className="eyebrow mb-4">{eyebrow}</p>}
      <h2 className="text-h1 font-bold text-balance leading-[1.1]">{title}</h2>
      {subtitle && (
        <p className="mx-auto mt-5 max-w-[42rem] text-base leading-relaxed text-muted-foreground sm:text-lg text-balance">
          {subtitle}
        </p>
      )}
    </div>
  );
}
