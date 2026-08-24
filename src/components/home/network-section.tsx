import { getTranslations } from 'next-intl/server';
import { SectionHeading } from '@/components/ui/section';
import { GlobalNetworkMap } from './global-network-map';

/** Global network — light, calm, the map speaks for itself. */
export async function NetworkSection({ locale: _locale }: { locale: string }) {
  const t = await getTranslations('network');

  return (
    <section className="py-16 sm:py-24 lg:py-28">
      <div className="container">
        <SectionHeading eyebrow={t('eyebrow')} title={t('title')} subtitle={t('subtitle')} />
      </div>

      <div className="mx-auto mt-10 w-full max-w-[1440px] px-3 sm:mt-14 sm:px-6">
        <GlobalNetworkMap className="h-[300px] sm:h-[480px] lg:h-[600px] xl:h-[660px]" />
      </div>
    </section>
  );
}
