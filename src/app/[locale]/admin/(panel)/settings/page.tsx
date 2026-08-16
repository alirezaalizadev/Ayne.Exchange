import { prisma } from '@/lib/db';
import { getCsrfToken } from '@/lib/auth/csrf';
import { PageHeader } from '@/components/admin/widgets';
import { SettingsForm } from '@/components/admin/settings-form';

export const metadata = { title: 'Settings' };

const KEYS = ['brand.name', 'contact.whatsapp', 'contact.telegram', 'contact.email', 'stats.years', 'stats.volume'];

export default async function AdminSettingsPage() {
  const rows = await prisma.siteSetting.findMany({ where: { key: { in: KEYS } } });
  const values = Object.fromEntries(rows.map((r) => [r.key, r.value]));

  return (
    <>
      <PageHeader title="Settings" description="Brand, contact channels and homepage figures." />
      <SettingsForm values={values} csrf={getCsrfToken() ?? ''} />
    </>
  );
}
