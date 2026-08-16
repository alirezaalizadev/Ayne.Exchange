import { useTranslations } from 'next-intl';
import { ArrowRight } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import { cn } from '@/lib/utils';
import { ServiceIcon } from './service-icon';
import type { ServiceDef } from '@/lib/config/services';

export function ServiceCard({ service, className }: { service: ServiceDef; className?: string }) {
  const t = useTranslations('services');

  return (
    <Link
      href={`/services/${service.slug}`}
      className={cn(
        'group surface-card flex flex-col p-6 shadow-sm transition-all duration-base ease-premium',
        'hover:-translate-y-1 hover:border-primary/30 hover:shadow-lg',
        className,
      )}
    >
      <ServiceIcon name={service.icon} accent={service.accent} className="h-12 w-12" />
      <h3 className="mt-5 text-h3 font-semibold">{t(`${service.key}.name`)}</h3>
      <p className="mt-2 flex-1 text-sm leading-relaxed text-muted-foreground">
        {t(`${service.key}.short`)}
      </p>
      <span className="mt-5 inline-flex items-center gap-1.5 text-sm font-medium text-primary">
        {t('learnMore')}
        <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1 rtl:rotate-180 rtl:group-hover:-translate-x-1" />
      </span>
    </Link>
  );
}
