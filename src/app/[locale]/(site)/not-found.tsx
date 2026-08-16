import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { Button } from '@/components/ui/button';

export default function NotFound() {
  const t = useTranslations('notFound');
  return (
    <div className="container flex min-h-[60vh] flex-col items-center justify-center py-24 text-center">
      <p className="font-display text-7xl font-semibold text-gradient">404</p>
      <h1 className="mt-4 text-h2 font-semibold">{t('title')}</h1>
      <p className="mt-3 max-w-md text-muted-foreground">{t('body')}</p>
      <Button asChild variant="cta" size="lg" className="mt-8">
        <Link href="/">{t('cta')}</Link>
      </Button>
    </div>
  );
}
