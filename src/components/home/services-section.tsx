import { useTranslations } from 'next-intl';
import { Section, SectionHeading } from '@/components/ui/section';
import { Reveal } from '@/components/ui/reveal';
import { services } from '@/lib/config/services';
import { ServiceCard } from '@/components/services/service-card';

export function ServicesSection() {
  const t = useTranslations('services');

  return (
    <Section id="services" surface="elevated">
      <SectionHeading eyebrow={t('eyebrow')} title={t('title')} subtitle={t('subtitle')} />

      <div className="mt-12 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 lg:gap-5">
        {services.map((service, i) => (
          <Reveal key={service.key} delay={(i % 4) * 0.05}>
            <ServiceCard service={service} className="h-full" />
          </Reveal>
        ))}
      </div>
    </Section>
  );
}
