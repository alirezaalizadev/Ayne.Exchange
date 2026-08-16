import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Ayne Exchange button system.
 * Variants: primary · secondary · outline · ghost · danger · cta · icon
 */
const buttonVariants = cva(
  'relative inline-flex items-center justify-center gap-2 whitespace-nowrap font-medium ' +
    'transition-all duration-base ease-premium select-none ' +
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background ' +
    'disabled:pointer-events-none disabled:opacity-50 [&_svg]:shrink-0',
  {
    variants: {
      variant: {
        primary:
          'bg-primary text-primary-foreground shadow-sm hover:shadow-glow hover:-translate-y-0.5 active:translate-y-0',
        cta:
          'bg-gradient-to-br from-primary to-accent text-primary-foreground shadow-md ' +
          'hover:shadow-glow hover:-translate-y-0.5 active:translate-y-0',
        secondary:
          'bg-surface-raised text-foreground border border-border hover:bg-muted hover:-translate-y-0.5 active:translate-y-0',
        outline:
          'border border-border bg-transparent text-foreground hover:bg-muted/60 hover:border-primary/40',
        ghost: 'bg-transparent text-foreground hover:bg-muted/60',
        danger:
          'bg-destructive text-destructive-foreground shadow-sm hover:brightness-110 active:brightness-95',
        icon: 'bg-transparent text-muted-foreground hover:text-foreground hover:bg-muted/60',
      },
      size: {
        sm: 'h-9 rounded-md px-3 text-sm',
        md: 'h-11 rounded-lg px-5 text-sm',
        lg: 'h-12 rounded-lg px-7 text-base',
        xl: 'h-14 rounded-xl px-8 text-base font-semibold',
        icon: 'h-10 w-10 rounded-lg',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  loading?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, loading = false, children, disabled, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button';
    // With `asChild`, Radix Slot requires exactly one child element, so we must
    // NOT inject the spinner there (asChild buttons are links, never loading).
    if (asChild) {
      return (
        <Comp
          className={cn(buttonVariants({ variant, size }), 'cursor-pointer', className)}
          ref={ref}
          {...props}
        >
          {children}
        </Comp>
      );
    }
    return (
      <button
        className={cn(buttonVariants({ variant, size }), 'cursor-pointer', className)}
        ref={ref}
        disabled={disabled || loading}
        {...props}
      >
        {loading && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
        {children}
      </button>
    );
  },
);
Button.displayName = 'Button';

export { Button, buttonVariants };
