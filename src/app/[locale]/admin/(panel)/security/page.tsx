import { prisma } from '@/lib/db';
import { PageHeader } from '@/components/admin/widgets';

export const metadata = { title: 'Security' };

export default async function AdminSecurityPage() {
  const [audit, events] = await Promise.all([
    prisma.auditLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: 40,
      include: { admin: true },
    }),
    prisma.securityEvent.findMany({ orderBy: { createdAt: 'desc' }, take: 40 }),
  ]);

  return (
    <>
      <PageHeader title="Security" description="Audit trail and security events." />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <section className="surface-card overflow-hidden p-0">
          <h2 className="border-b border-border px-5 py-3 font-semibold">Admin activity</h2>
          <div className="max-h-[560px] overflow-y-auto">
            {audit.length === 0 ? (
              <p className="px-5 py-8 text-center text-sm text-muted-foreground">No activity yet.</p>
            ) : (
              <ul className="divide-y divide-border/60">
                {audit.map((a) => (
                  <li key={a.id} className="px-5 py-3 text-sm">
                    <div className="flex items-center justify-between gap-3">
                      <span className="font-medium">{a.action}</span>
                      <span className="text-xs text-muted-foreground">{new Date(a.createdAt).toLocaleString('en-GB')}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {a.admin?.name ?? 'system'}
                      {a.entityType ? ` · ${a.entityType}` : ''}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>

        <section className="surface-card overflow-hidden p-0">
          <h2 className="border-b border-border px-5 py-3 font-semibold">Security events</h2>
          <div className="max-h-[560px] overflow-y-auto">
            {events.length === 0 ? (
              <p className="px-5 py-8 text-center text-sm text-muted-foreground">No events recorded.</p>
            ) : (
              <ul className="divide-y divide-border/60">
                {events.map((e) => (
                  <li key={e.id} className="px-5 py-3 text-sm">
                    <div className="flex items-center justify-between gap-3">
                      <span className="font-medium">{e.type}</span>
                      <span className="text-xs text-muted-foreground">{new Date(e.createdAt).toLocaleString('en-GB')}</span>
                    </div>
                    {e.email && <p className="text-xs text-muted-foreground">{e.email}</p>}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>
      </div>
    </>
  );
}
