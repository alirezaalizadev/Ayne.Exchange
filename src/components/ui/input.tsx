import * as React from 'react';
import { cn } from '@/lib/utils';

export const Input = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement> & { invalid?: boolean }
>(({ className, invalid, ...props }, ref) => (
  <input
    ref={ref}
    aria-invalid={invalid || undefined}
    className={cn(
      'h-12 w-full rounded-xl border bg-surface px-3 text-sm transition-colors',
      'placeholder:text-muted-foreground/60',
      'focus:outline-none focus-visible:ring-2 focus-visible:ring-ring',
      invalid ? 'border-destructive focus:border-destructive' : 'border-input focus:border-primary',
      'disabled:cursor-not-allowed disabled:opacity-50',
      className,
    )}
    {...props}
  />
));
Input.displayName = 'Input';
