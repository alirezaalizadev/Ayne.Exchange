import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getCurrentAdmin } from '@/lib/auth/session';
import { Logo } from '@/components/brand/logo';
import { LoginForm } from '@/components/admin/login-form';

export const metadata: Metadata = { title: 'Admin sign in', robots: { index: false, follow: false } };

// Admin is not statically prerendered.
export const dynamic = 'force-dynamic';

export default async function AdminLoginPage() {
  // Already signed in → go straight to the dashboard.
  if (await getCurrentAdmin()) redirect('/admin/dashboard');

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background px-4">
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="absolute inset-x-0 top-0 h-80 bg-radial-glow opacity-70" />
        <div className="absolute inset-0 grid-texture opacity-30" />
      </div>
      <div className="relative w-full max-w-sm">
        <div className="mb-8 flex justify-center">
          <Logo idSuffix="admin-login" />
        </div>
        <div className="surface-card p-7 shadow-lg">
          <div className="mb-6 text-center">
            <h1 className="text-h3 font-semibold">Administrator sign in</h1>
            <p className="mt-1 text-sm text-muted-foreground">Authorized access only.</p>
          </div>
          <LoginForm />
        </div>
        <p className="mt-6 text-center text-xs text-muted-foreground">
          Ayne Exchange · Secure admin area
        </p>
      </div>
    </div>
  );
}
