import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';

/**
 * Integration tests for /api/v1 — route handlers invoked directly against the
 * local dev MySQL. Mutating routes call revalidateTag/Path, which need the
 * Next.js runtime; stub them (cache invalidation is a runtime concern).
 */
vi.mock('next/cache', () => ({
  revalidateTag: () => {},
  revalidatePath: () => {},
  unstable_cache: (fn: (...args: unknown[]) => unknown) => fn,
}));

import { prisma } from '@/lib/db';
import { hashPassword } from '@/lib/auth/password';

import { GET as getRates } from '../rates/route';
import { GET as getFeatured } from '../rates/featured/route';
import { POST as postConvert } from '../convert/route';
import { GET as getTransactions } from '../transactions/route';
import { GET as getTransaction } from '../transactions/[publicRef]/route';
import { GET as getServices } from '../services/route';
import { GET as getService } from '../services/[slug]/route';
import { GET as getSettings } from '../content/settings/route';
import { POST as postQuote } from '../quotes/route';
import { POST as postEvent } from '../analytics/events/route';
import { POST as postLogin } from '../admin/auth/login/route';
import { POST as postRefresh } from '../admin/auth/refresh/route';
import { POST as postLogout } from '../admin/auth/logout/route';
import { GET as getOverview } from '../admin/overview/route';
import { POST as postAdminRate, GET as getAdminRates } from '../admin/rates/route';
import { PATCH as patchAdminRate, DELETE as deleteAdminRate } from '../admin/rates/[id]/route';
import { GET as getRateHistory } from '../admin/rates/[id]/history/route';
import { PATCH as patchBulk } from '../admin/rates/bulk/route';
import { POST as postAdminTx } from '../admin/transactions/route';
import { PATCH as patchAdminTx, DELETE as deleteAdminTx } from '../admin/transactions/[id]/route';

const runId = Date.now().toString(36);
const testIp = `10.99.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`;
const BASE = 'http://localhost:3000/api/v1';

const ADMIN_EMAIL = `api-test-${runId}@example.com`;
const ADMIN_PASSWORD = 'Str0ngTestPassw0rd!';

function req(path: string, init?: RequestInit & { json?: unknown }): Request {
  const headers = new Headers(init?.headers);
  headers.set('x-forwarded-for', testIp);
  if (init?.json !== undefined) headers.set('content-type', 'application/json');
  return new Request(`${BASE}${path}`, {
    ...init,
    headers,
    body: init?.json !== undefined ? JSON.stringify(init.json) : init?.body,
  });
}

async function body(res: Response) {
  return (await res.json()) as { data?: any; meta?: any; error?: any };
}

let adminId: string;
let accessToken: string;
let refreshToken: string;
const cleanupRateIds: string[] = [];
const cleanupTxIds: string[] = [];

function authed(path: string, init?: RequestInit & { json?: unknown }): Request {
  const r = req(path, init);
  r.headers.set('authorization', `Bearer ${accessToken}`);
  return r;
}

beforeAll(async () => {
  const admin = await prisma.admin.create({
    data: {
      email: ADMIN_EMAIL,
      name: 'API Test Admin',
      passwordHash: await hashPassword(ADMIN_PASSWORD),
      role: 'ADMIN',
    },
  });
  adminId = admin.id;
});

afterAll(async () => {
  await prisma.exchangeRate.deleteMany({ where: { id: { in: cleanupRateIds } } });
  await prisma.transaction.deleteMany({ where: { id: { in: cleanupTxIds } } });
  await prisma.quoteRequest.deleteMany({ where: { contactValue: { contains: `apitest-${runId}` } } });
  await prisma.admin.delete({ where: { id: adminId } }).catch(() => {});
  await prisma.$disconnect();
});

describe('admin auth', () => {
  it('rejects a wrong password with 401 and no tokens', async () => {
    const res = await postLogin(req('/admin/auth/login', { method: 'POST', json: { email: ADMIN_EMAIL, password: 'wrong-password-1A' } }));
    expect(res.status).toBe(401);
    const b = await body(res);
    expect(b.error.code).toBe('UNAUTHORIZED');
    expect(JSON.stringify(b)).not.toContain('accessToken');
  });

  it('issues access + refresh tokens on valid credentials', async () => {
    const res = await postLogin(req('/admin/auth/login', {
      method: 'POST',
      json: { email: ADMIN_EMAIL, password: ADMIN_PASSWORD, deviceLabel: 'vitest' },
    }));
    expect(res.status).toBe(200);
    const b = await body(res);
    expect(b.data.accessToken).toBeTruthy();
    expect(b.data.refreshToken).toBeTruthy();
    expect(b.data.admin.email).toBe(ADMIN_EMAIL);
    accessToken = b.data.accessToken;
    refreshToken = b.data.refreshToken;
    const stored = await prisma.apiRefreshToken.findFirst({ where: { adminId } });
    expect(stored?.tokenHash).not.toBe(refreshToken); // stored hashed
  });

  it('guards admin endpoints (401 without / with garbage token)', async () => {
    expect((await getOverview(req('/admin/overview'))).status).toBe(401);
    const r = req('/admin/overview');
    r.headers.set('authorization', 'Bearer not-a-jwt');
    expect((await getOverview(r)).status).toBe(401);
  });

  it('serves overview metrics with a valid token', async () => {
    const res = await getOverview(authed('/admin/overview'));
    expect(res.status).toBe(200);
    const b = await body(res);
    expect(typeof b.data.totalEnquiries).toBe('number');
    expect(Array.isArray(b.data.latestQuotes)).toBe(true);
  });

  it('rotates refresh tokens and detects replay of the old token', async () => {
    const res = await postRefresh(req('/admin/auth/refresh', { method: 'POST', json: { refreshToken } }));
    expect(res.status).toBe(200);
    const b = await body(res);
    const newRefresh = b.data.refreshToken;
    expect(newRefresh).not.toBe(refreshToken);
    accessToken = b.data.accessToken;

    // Replaying the rotated token must fail and revoke the family.
    const replay = await postRefresh(req('/admin/auth/refresh', { method: 'POST', json: { refreshToken } }));
    expect(replay.status).toBe(401);
    const active = await prisma.apiRefreshToken.count({ where: { adminId, revokedAt: null } });
    expect(active).toBe(0);

    // Sign in again for the remaining tests.
    const relogin = await postLogin(req('/admin/auth/login', { method: 'POST', json: { email: ADMIN_EMAIL, password: ADMIN_PASSWORD } }));
    const rb = await body(relogin);
    accessToken = rb.data.accessToken;
    refreshToken = rb.data.refreshToken;
  });
});

describe('admin rates → public rates round trip', () => {
  let rateId: string;

  it('creates a rate via the admin API', async () => {
    const res = await postAdminRate(authed('/admin/rates', {
      method: 'POST',
      json: {
        base: 'ZZA', quote: 'ZZB', sourceLabel: `t-${runId}`, mode: 'MANUAL',
        manualRate: '2', buyRate: '1.98', sellRate: '2.02',
        displayDecimals: 4, isPublished: true, isFeatured: true, order: 999,
      },
    }));
    expect(res.status).toBe(201);
    const b = await body(res);
    rateId = b.data.id;
    cleanupRateIds.push(rateId);
    expect(b.data.displayRate).toBe('2');
    expect(b.data.buy).toBe('1.98');
  });

  it('GET /rates reflects the new rate with decimal strings + currency metadata', async () => {
    const res = await getRates(req('/rates'));
    expect(res.status).toBe(200);
    expect(res.headers.get('etag')).toBeTruthy();
    const b = await body(res);
    const rate = b.data.find((r: any) => r.id === rateId);
    expect(rate).toBeTruthy();
    expect(rate.displayRate).toBe('2');
    expect(typeof rate.displayRate).toBe('string');
    expect(rate.baseCurrency.code).toBe('ZZA');
    expect(rate.featured).toBe(true);
  });

  it('returns 304 when If-None-Match matches', async () => {
    const first = await getRates(req('/rates'));
    const etag = first.headers.get('etag')!;
    const second = await getRates(req('/rates', { headers: { 'if-none-match': etag } }));
    expect(second.status).toBe(304);
  });

  it('PATCH updates the rate and GET /rates reflects the change (new ETag)', async () => {
    const before = await getRates(req('/rates'));
    const beforeTag = before.headers.get('etag')!;

    const res = await patchAdminRate(authed(`/admin/rates/${rateId}`, { method: 'PATCH', json: { manualRate: 2.5 } }), { params: { id: rateId } });
    expect(res.status).toBe(200);
    expect((await body(res)).data.displayRate).toBe('2.5');

    const after = await getRates(req('/rates'));
    const b = await body(after);
    expect(b.data.find((r: any) => r.id === rateId).displayRate).toBe('2.5');
    expect(after.headers.get('etag')).not.toBe(beforeTag);
  });

  it('records history and lists it', async () => {
    const res = await getRateHistory(authed(`/admin/rates/${rateId}/history`), { params: { id: rateId } });
    expect(res.status).toBe(200);
    const b = await body(res);
    expect(b.data.length).toBeGreaterThanOrEqual(2); // create + patch
    expect(b.data[0].value).toBe('2.5');
  });

  it('bulk-updates buy/sell', async () => {
    const res = await patchBulk(authed('/admin/rates/bulk', { method: 'PATCH', json: { items: [{ id: rateId, buyRate: '2.4', sellRate: '2.6' }] } }));
    expect(res.status).toBe(200);
    const list = await body(await getAdminRates(authed('/admin/rates')));
    const row = list.data.find((r: any) => r.id === rateId);
    expect(row.buy).toBe('2.4');
    expect(row.sell).toBe('2.6');
  });

  it('converts through the pair (decimal strings, cross rate ready)', async () => {
    const res = await postConvert(req('/convert', { method: 'POST', json: { from: 'ZZA', to: 'ZZB', amount: '10' } }));
    expect(res.status).toBe(200);
    const b = await body(res);
    expect(b.data.result).toBe('25'); // 10 × 2.5
    expect(b.data.rate).toBe('2.5');
    expect(typeof b.data.result).toBe('string');
  });

  it('rejects an unavailable pair', async () => {
    const res = await postConvert(req('/convert', { method: 'POST', json: { from: 'ZZA', to: 'XXQ', amount: '1' } }));
    expect(res.status).toBe(400);
  });

  it('featured endpoint contains the rate; archive removes it everywhere', async () => {
    const feat = await body(await getFeatured(req('/rates/featured')));
    expect(feat.data.some((r: any) => r.id === rateId)).toBe(true);

    const res = await deleteAdminRate(authed(`/admin/rates/${rateId}`, { method: 'DELETE' }), { params: { id: rateId } });
    expect(res.status).toBe(200);
    const pub = await body(await getRates(req('/rates')));
    expect(pub.data.some((r: any) => r.id === rateId)).toBe(false);
  });
});

describe('admin transactions → public transactions round trip', () => {
  let txId: string;
  let publicRef: string;

  it('creates an unpublished transaction', async () => {
    const res = await postAdminTx(authed('/admin/transactions', {
      method: 'POST',
      json: {
        originCountry: 'TR', originCity: 'Istanbul', destinationCountry: 'DE', destinationCity: 'Berlin',
        currency: 'EUR', displayAmount: '48200', amountDisplayMode: 'ROUNDED',
        serviceKey: 'sepa', status: 'COMPLETED', occurredOn: new Date().toISOString(),
        isPublished: false, isFeatured: false,
      },
    }));
    expect(res.status).toBe(201);
    const b = await body(res);
    txId = b.data.id;
    publicRef = b.data.publicRef;
    cleanupTxIds.push(txId);
    expect(publicRef).toMatch(/^AYN-/);
  });

  it('unpublished transactions are invisible publicly', async () => {
    const res = await getTransaction(req(`/transactions/${publicRef}`), { params: { publicRef } });
    expect(res.status).toBe(404);
  });

  it('publish makes it visible, with the amount privacy-rounded server-side', async () => {
    const res = await patchAdminTx(authed(`/admin/transactions/${txId}`, { method: 'PATCH', json: { isPublished: true } }), { params: { id: txId } });
    expect(res.status).toBe(200);

    const pub = await getTransaction(req(`/transactions/${publicRef}`), { params: { publicRef } });
    expect(pub.status).toBe(200);
    const b = await body(pub);
    expect(b.data.amount).toBe('48000'); // 48200 rounded to nearest 1000
    expect(b.data.amountMode).toBe('ROUNDED');
    expect(JSON.stringify(b.data)).not.toContain('48200'); // exact amount never leaks
  });

  it('HIDDEN mode returns no amounts at all', async () => {
    await patchAdminTx(authed(`/admin/transactions/${txId}`, { method: 'PATCH', json: { amountDisplayMode: 'HIDDEN' } }), { params: { id: txId } });
    const pub = await body(await getTransaction(req(`/transactions/${publicRef}`), { params: { publicRef } }));
    expect(pub.data.amount).toBeNull();
    expect(pub.data.rangeMin).toBeNull();
    expect(JSON.stringify(pub.data)).not.toContain('48200');
  });

  it('list endpoint filters and paginates', async () => {
    const res = await getTransactions(req(`/transactions?service=sepa&origin=TR&pageSize=5`));
    expect(res.status).toBe(200);
    const b = await body(res);
    expect(b.meta.pageSize).toBe(5);
    expect(b.data.every((t: any) => t.serviceKey === 'sepa' && t.originCountry === 'TR')).toBe(true);
  });

  it('unpublish removes it from the public list; delete soft-deletes', async () => {
    await patchAdminTx(authed(`/admin/transactions/${txId}`, { method: 'PATCH', json: { isPublished: false } }), { params: { id: txId } });
    const pub = await getTransaction(req(`/transactions/${publicRef}`), { params: { publicRef } });
    expect(pub.status).toBe(404);

    const res = await deleteAdminTx(authed(`/admin/transactions/${txId}`, { method: 'DELETE' }), { params: { id: txId } });
    expect(res.status).toBe(200);
    const row = await prisma.transaction.findUnique({ where: { id: txId } });
    expect(row?.deletedAt).not.toBeNull();
  });
});

describe('public content endpoints', () => {
  it('serves the service catalog with localized copy', async () => {
    const res = await getServices(req('/services?locale=fa'));
    expect(res.status).toBe(200);
    const b = await body(res);
    expect(b.data.length).toBeGreaterThanOrEqual(8);
    const swift = b.data.find((s: any) => s.key === 'swift');
    expect(swift.slug).toBe('swift-payments');
    expect(swift.name).toBeTruthy();
  });

  it('serves one service by slug and 404s unknown slugs', async () => {
    const res = await getService(req('/services/sepa-payments'), { params: { slug: 'sepa-payments' } });
    expect(res.status).toBe(200);
    const missing = await getService(req('/services/nope'), { params: { slug: 'nope' } });
    expect(missing.status).toBe(404);
  });

  it('serves settings with contact, currencies, languages and no secrets', async () => {
    const res = await getSettings(req('/content/settings'));
    expect(res.status).toBe(200);
    const b = await body(res);
    expect(b.data.contact.whatsapp).toBeTruthy();
    expect(b.data.currencies.some((c: any) => c.code === 'USD')).toBe(true);
    expect(b.data.languages.map((l: any) => l.code)).toEqual(['en', 'fa', 'ru']);
    const raw = JSON.stringify(b.data);
    expect(raw).not.toMatch(/secret|password|hash/i);
  });
});

describe('quotes + analytics', () => {
  it('accepts a valid quote and returns an AYNE-Q reference', async () => {
    const res = await postQuote(req('/quotes', {
      method: 'POST',
      json: {
        serviceKey: 'swift', clientType: 'BUSINESS', contactMethod: 'EMAIL',
        contactValue: `apitest-${runId}@example.com`, consent: true,
        sendAmount: '25000', sendCurrency: 'USD', receiveCurrency: 'EUR', locale: 'en',
      },
    }));
    expect(res.status).toBe(201);
    const b = await body(res);
    expect(b.data.reference).toMatch(/^AYNE-Q-\d{4}-\d{5}$/);
  });

  it('returns field-level validation errors', async () => {
    const res = await postQuote(req('/quotes', { method: 'POST', json: { serviceKey: 'swift', clientType: 'BUSINESS', contactMethod: 'EMAIL', contactValue: 'nope', consent: true } }));
    expect(res.status).toBe(422);
    const b = await body(res);
    expect(b.error.details.contactValue).toBeTruthy();
  });

  it('silently drops honeypot submissions', async () => {
    const before = await prisma.quoteRequest.count();
    const res = await postQuote(req('/quotes', {
      method: 'POST',
      json: {
        serviceKey: 'swift', clientType: 'BUSINESS', contactMethod: 'EMAIL',
        contactValue: `apitest-${runId}-bot@example.com`, consent: true, company_website: 'spam.example',
      },
    }));
    expect(res.status).toBe(201);
    expect((await body(res)).data.reference).toBe('AYNE-Q-0000-00000');
    expect(await prisma.quoteRequest.count()).toBe(before);
  });

  it('accepts allowlisted analytics events and rejects unknown types', async () => {
    const ok = await postEvent(req('/analytics/events', { method: 'POST', json: { type: 'screen_view', locale: 'en', meta: { screen: 'rates' } } }));
    expect(ok.status).toBe(202);
    const bad = await postEvent(req('/analytics/events', { method: 'POST', json: { type: 'contact_value_dump' } }));
    expect(bad.status).toBe(400);
  });
});

describe('logout', () => {
  it('revokes the refresh token', async () => {
    const res = await postLogout(authed('/admin/auth/logout', { method: 'POST', json: { refreshToken } }));
    expect(res.status).toBe(200);
    const replay = await postRefresh(req('/admin/auth/refresh', { method: 'POST', json: { refreshToken } }));
    expect(replay.status).toBe(401);
  });
});
