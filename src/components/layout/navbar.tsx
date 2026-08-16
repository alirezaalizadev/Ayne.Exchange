'use client';

import * as React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useTranslations } from 'next-intl';
import { ArrowUpRight, ChevronDown, Menu, X } from 'lucide-react';
import { Link, usePathname } from '@/i18n/navigation';
import { mainNav } from '@/lib/config/nav';
import { services } from '@/lib/config/services';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Logo } from '@/components/brand/logo';
import { ServiceIcon } from '@/components/services/service-icon';
import { ThemeToggle } from './theme-toggle';
import { LanguageSelector } from './language-selector';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export function Navbar() {
  const t = useTranslations('nav');
  const tServices = useTranslations('services');
  const pathname = usePathname();
  const [scrolled, setScrolled] = React.useState(false);
  const [mobileOpen, setMobileOpen] = React.useState(false);

  React.useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Close mobile menu on route change.
  React.useEffect(() => setMobileOpen(false), [pathname]);

  const isActive = (href: string) =>
    href === '/' ? pathname === '/' : pathname.startsWith(href);

  return (
    <header
      className={cn(
        'sticky top-0 z-header w-full transition-all duration-base ease-premium',
        scrolled
          ? 'glass border-b border-border/70'
          : 'border-b border-transparent bg-transparent',
      )}
    >
      <nav className="container flex h-16 items-center justify-between gap-4 lg:h-[4.5rem]">
        <Link href="/" aria-label="Ayne Exchange home" className="shrink-0">
          <Logo />
        </Link>

        {/* Desktop nav */}
        <ul className="hidden items-center gap-0.5 lg:flex">
          {mainNav.map((item) =>
            item.hasMegaMenu ? (
              <li key={item.href}>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      title={t(item.labelKey)}
                      className={cn(
                        'group inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-lg px-2 py-2 text-sm font-medium transition-all duration-fast xl:px-2.5',
                        isActive(item.href)
                          ? 'bg-primary/10 text-primary'
                          : 'text-muted-foreground hover:text-foreground hover:bg-muted/50',
                      )}
                    >
                      <item.icon
                        className="h-4 w-4 shrink-0 transition-transform duration-fast group-hover:-translate-y-px"
                        strokeWidth={1.75}
                      />
                      <span className="hidden shrink-0 whitespace-nowrap xl:inline">{t(item.labelKey)}</span>
                      <ChevronDown className="h-3.5 w-3.5 shrink-0 transition-transform group-data-[state=open]:rotate-180" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="w-[min(38rem,90vw)] p-3">
                    <div className="mb-2 px-2">
                      <p className="text-sm font-semibold">{t('servicesMenuTitle')}</p>
                      <p className="text-xs text-muted-foreground">{t('servicesMenuLead')}</p>
                    </div>
                    <div className="grid grid-cols-1 gap-1 sm:grid-cols-2">
                      {services.map((s) => (
                        <Link
                          key={s.key}
                          href={`/services/${s.slug}`}
                          className="flex items-start gap-3 rounded-lg p-2.5 transition-colors hover:bg-muted/60"
                        >
                          <ServiceIcon name={s.icon} accent={s.accent} className="h-9 w-9 shrink-0" />
                          <span className="min-w-0">
                            <span className="block text-sm font-medium">{tServices(`${s.key}.name`)}</span>
                            <span className="block truncate text-xs text-muted-foreground">
                              {tServices(`${s.key}.short`)}
                            </span>
                          </span>
                        </Link>
                      ))}
                    </div>
                  </DropdownMenuContent>
                </DropdownMenu>
              </li>
            ) : (
              <li key={item.href}>
                <Link
                  href={item.href}
                  title={t(item.labelKey)}
                  className={cn(
                    'group inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-lg px-2 py-2 text-sm font-medium transition-all duration-fast xl:px-2.5',
                    isActive(item.href)
                      ? 'bg-primary/10 text-primary'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted/50',
                  )}
                >
                  <item.icon
                    className="h-4 w-4 shrink-0 transition-transform duration-fast group-hover:-translate-y-px"
                    strokeWidth={1.75}
                  />
                  <span className="hidden shrink-0 whitespace-nowrap xl:inline">{t(item.labelKey)}</span>
                </Link>
              </li>
            ),
          )}
        </ul>

        {/* Right actions */}
        <div className="flex items-center gap-1.5">
          <div className="hidden items-center gap-1.5 sm:flex">
            <LanguageSelector />
            <ThemeToggle />
          </div>
          <Button asChild variant="cta" size="md" className="hidden whitespace-nowrap md:inline-flex">
            <Link href="/request-quote">
              {t('requestQuote')}
              <ArrowUpRight className="h-4 w-4 rtl:-scale-x-100" />
            </Link>
          </Button>
          <Button
            variant="icon"
            size="icon"
            className="lg:hidden"
            aria-label={mobileOpen ? t('closeMenu') : t('openMenu')}
            aria-expanded={mobileOpen}
            onClick={() => setMobileOpen((v) => !v)}
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </nav>

      {/* Mobile drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
            className="lg:hidden overflow-hidden border-t border-border glass-strong"
          >
            <div className="container flex flex-col gap-1 py-4">
              {mainNav.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                    isActive(item.href)
                      ? 'bg-primary/10 text-primary'
                      : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground',
                  )}
                >
                  <item.icon className="h-[1.15rem] w-[1.15rem] shrink-0" strokeWidth={1.75} />
                  {t(item.labelKey)}
                </Link>
              ))}
              <div className="mt-3 flex items-center justify-between gap-2 border-t border-border pt-4">
                <div className="flex items-center gap-1.5">
                  <LanguageSelector />
                  <ThemeToggle />
                </div>
                <Button asChild variant="cta" size="md" className="flex-1">
                  <Link href="/request-quote">
              {t('requestQuote')}
              <ArrowUpRight className="h-4 w-4 rtl:-scale-x-100" />
            </Link>
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
