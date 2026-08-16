import {
  Layers,
  TrendingUp,
  Activity,
  Route,
  Newspaper,
  Building2,
  ShieldCheck,
  MessageCircle,
  type LucideIcon,
} from 'lucide-react';

/** Primary navigation items. `labelKey` resolves against the `nav` namespace. */
export interface NavItem {
  labelKey: string;
  href: string;
  icon: LucideIcon;
  hasMegaMenu?: boolean;
}

export const mainNav: NavItem[] = [
  { labelKey: 'services', href: '/services', icon: Layers, hasMegaMenu: true },
  { labelKey: 'rates', href: '/rates', icon: TrendingUp },
  { labelKey: 'transactions', href: '/transactions', icon: Activity },
  { labelKey: 'howItWorks', href: '/how-it-works', icon: Route },
  { labelKey: 'insights', href: '/insights', icon: Newspaper },
  { labelKey: 'about', href: '/about', icon: Building2 },
  { labelKey: 'compliance', href: '/compliance', icon: ShieldCheck },
  { labelKey: 'contact', href: '/contact', icon: MessageCircle },
];
