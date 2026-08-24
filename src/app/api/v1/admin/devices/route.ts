import { prisma } from '@/lib/db';
import { handleApi, handleOptions, apiJson, readJson } from '@/lib/api/respond';
import { badRequest, notFound } from '@/lib/api/errors';
import { requireApiAdmin } from '@/lib/api/auth';
import { logAudit } from '@/lib/audit';

export const dynamic = 'force-dynamic';

const HEX_TOKEN = /^[0-9a-f]{16,255}$/i;

/**
 * POST /api/v1/admin/devices — register an APNs device token for new-quote
 * pushes. Feature-flagged: returns 404 unless MOBILE_PUSH_ENABLED=true.
 */
export const POST = handleApi(async (request: Request) => {
  if (process.env.MOBILE_PUSH_ENABLED !== 'true') throw notFound('Push notifications are not enabled.');
  const admin = await requireApiAdmin(request);
  const body = (await readJson(request)) as Record<string, unknown>;

  const token = typeof body.token === 'string' ? body.token.trim() : '';
  if (!HEX_TOKEN.test(token)) throw badRequest('Invalid device token.');

  await prisma.deviceToken.upsert({
    where: { token },
    update: { adminId: admin.id, isActive: true },
    create: { token, adminId: admin.id, platform: 'ios' },
  });
  await logAudit({ adminId: admin.id, action: 'device.register', entityType: 'DeviceToken' });

  return apiJson({ registered: true });
});

/** DELETE /api/v1/admin/devices — deactivate a device token. */
export const DELETE = handleApi(async (request: Request) => {
  if (process.env.MOBILE_PUSH_ENABLED !== 'true') throw notFound('Push notifications are not enabled.');
  const admin = await requireApiAdmin(request);
  const body = (await readJson(request)) as Record<string, unknown>;
  const token = typeof body.token === 'string' ? body.token.trim() : '';
  if (!token) throw badRequest('token is required.');

  await prisma.deviceToken.updateMany({ where: { token, adminId: admin.id }, data: { isActive: false } });
  return apiJson({ unregistered: true });
});

export const OPTIONS = handleOptions;
