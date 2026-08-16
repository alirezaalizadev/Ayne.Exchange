import 'server-only';
import { prisma } from '@/lib/db';

/** Records an admin action to the audit log. Never throws to the caller. */
export async function logAudit(params: {
  adminId?: string | null;
  action: string;
  entityType?: string;
  entityId?: string;
  metadata?: Record<string, unknown>;
}): Promise<void> {
  await prisma.auditLog
    .create({
      data: {
        adminId: params.adminId ?? null,
        action: params.action,
        entityType: params.entityType ?? null,
        entityId: params.entityId ?? null,
        metadata: params.metadata ? JSON.stringify(params.metadata) : null,
      },
    })
    .catch(() => {});
}

/** Records a security event (login attempts, lockouts, CSRF failures, …). */
export async function logSecurity(params: {
  type: string;
  email?: string | null;
  ipHash?: string | null;
  userAgent?: string | null;
  metadata?: Record<string, unknown>;
}): Promise<void> {
  await prisma.securityEvent
    .create({
      data: {
        type: params.type,
        email: params.email ?? null,
        ipHash: params.ipHash ?? null,
        userAgent: params.userAgent?.slice(0, 400) ?? null,
        meta: params.metadata ? JSON.stringify(params.metadata) : null,
      },
    })
    .catch(() => {});
}
