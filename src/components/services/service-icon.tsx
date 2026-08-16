import {
  ArrowLeftRight,
  Euro,
  Building2,
  Coins,
  Ship,
  Banknote,
  Bitcoin,
  Route,
  type LucideIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const iconMap: Record<string, LucideIcon> = {
  'arrow-left-right': ArrowLeftRight,
  euro: Euro,
  'building-2': Building2,
  coins: Coins,
  ship: Ship,
  banknote: Banknote,
  bitcoin: Bitcoin,
  route: Route,
};

export function ServiceIcon({
  name,
  className,
  accent = 'primary',
}: {
  name: string;
  className?: string;
  accent?: 'primary' | 'accent';
}) {
  const Icon = iconMap[name] ?? Banknote;
  return (
    <span
      className={cn(
        'inline-flex items-center justify-center rounded-xl border',
        accent === 'primary'
          ? 'border-primary/20 bg-primary/10 text-primary'
          : 'border-accent/20 bg-accent/10 text-accent',
        className,
      )}
    >
      <Icon className="h-5 w-5" strokeWidth={1.75} aria-hidden />
    </span>
  );
}
