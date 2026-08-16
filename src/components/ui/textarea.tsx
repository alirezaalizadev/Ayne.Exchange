import * as React from 'react';
import { cn } from '@/lib/utils';

export const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement> & { invalid?: boolean }
>(({ className, invalid, ...props }, ref) => (
  <textarea
    ref={ref}
    aria-invalid={invalid || undefined}
    className={cn(
      'min-h-24 w-full rounded-lg border bg-surface px-3 py-2.5 text-sm transition-colors',
      'placeholder:text-muted-foreground/60 resize-y',
      'focus:outline-none focus-visible:ring-2 focus-visible:ring-ring',
      invalid ? 'border-destructive' : 'border-input focus:border-primary',
      'disabled:cursor-not-allowed disabled:opacity-50',
      className,
    )}
    {...props}
  />
));
Textarea.displayName = 'Textarea';
