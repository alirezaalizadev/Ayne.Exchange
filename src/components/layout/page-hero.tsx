import { Link } from '@/i18n/navigation';
import { ChevronRight } from 'lucide-react';

/**
 * Shared subpage hero: quiet breadcrumb, small accent eyebrow, then a huge
 * tight headline. Bright and typographic — no decorative backgrounds.
 */
export function PageHero({
  eyebrow,
  title,
  subtitle,
  breadcrumb,
  children,
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  breadcrumb?: { label: string; href?: string }[];
  children?: React.ReactNode;
}) {
  return (
    <section className="border-b border-border/70">
      <div className="container py-14 sm:py-20 lg:py-24">
        {breadcrumb && breadcrumb.length > 0 && (
          <nav aria-label="Breadcrumb" className="mb-6">
            <ol className="flex flex-wrap items-center gap-1.5 text-xs font-medium text-muted-foreground">
              {breadcrumb.map((c, i) => (
                <li key={i} className="flex items-center gap-1.5">
                  {c.href ? (
                    <Link href={c.href} className="transition-colors hover:text-foreground">
                      {c.label}
                    </Link>
                  ) : (
                    <span className="text-foreground">{c.label}</span>
                  )}
                  {i < breadcrumb.length - 1 && (
                    <ChevronRight className="h-3 w-3 rtl:rotate-180" />
                  )}
                </li>
              ))}
            </ol>
          </nav>
        )}
        {eyebrow && <p className="eyebrow mb-3">{eyebrow}</p>}
        <h1 className="max-w-[22ch] text-display text-balance">{title}</h1>
        {subtitle && (
          <p className="mt-5 max-w-[38rem] text-lg leading-relaxed text-muted-foreground">
            {subtitle}
          </p>
        )}
        {children && <div className="mt-8">{children}</div>}
      </div>
    </section>
  );
}
