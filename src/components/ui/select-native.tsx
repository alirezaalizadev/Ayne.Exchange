import * as React from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Styled native <select>. Reliable, accessible, RTL-safe. Used where a simple
 * option list is enough (currencies, countries); Radix Select is reserved for
 * richer menus.
 */
export const SelectNative = React.forwardRef<
  HTMLSelectElement,
  React.SelectHTMLAttributes<HTMLSelectElement>
>(({ className, children, ...props }, ref) => (
  <div className="relative">
    <select
      ref={ref}
      className={cn(
        'h-12 w-full appearance-none rounded-xl border border-input bg-surface ps-3 pe-9 text-sm',
        'transition-colors focus:border-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        'disabled:cursor-not-allowed disabled:opacity-50',
        className,
      )}
      {...props}
    >
      {children}
    </select>
    <ChevronDown className="pointer-events-none absolute end-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
  </div>
));
SelectNative.displayName = 'SelectNative';
