import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { siteConfig } from '@/lib/config/site';

// Live public contact config (admin-editable), with env fallback. Kept tiny and
// non-sensitive; consumed client-side so contact channels update without a rebuild.
export const dynamic = 'force-dynamic';

export async function GET() {
  const rows = await prisma.siteSetting
    .findMany({ where: { key: { in: ['contact.whatsapp', 'contact.telegram', 'contact.email'] } } })
    .catch(() => [] as { key: string; value: string }[]);
  const m = Object.fromEntries(rows.map((r) => [r.key, r.value]));

  return NextResponse.json(
    {
      whatsapp: m['contact.whatsapp'] || siteConfig.contact.whatsapp || '',
      telegram: m['contact.telegram'] || siteConfig.contact.telegram || '',
      email: m['contact.email'] || siteConfig.contact.email || '',
    },
    { headers: { 'Cache-Control': 'public, max-age=60' } },
  );
}
