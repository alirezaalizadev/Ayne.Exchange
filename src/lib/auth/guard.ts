import 'server-only';
import { redirect } from 'next/navigation';
import type { Admin } from '@prisma/client';
import { getCurrentAdmin } from './session';

/**
 * Server-side guard for admin pages/layouts. Redirects to the login page when
 * there is no valid session. NEVER rely on route-hiding alone — every admin
 * surface calls this.
 */
export async function requireAdmin(): Promise<Admin> {
  const admin = await getCurrentAdmin();
  if (!admin) redirect('/admin/login');
  return admin;
}

/** For mutations that require elevated roles. */
export function assertRole(admin: Admin, roles: Admin['role'][]): boolean {
  return roles.includes(admin.role);
}
