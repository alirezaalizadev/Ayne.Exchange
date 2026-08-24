# Ayne Exchange — Mobile API (`/api/v1`)

JSON API consumed by the iOS app. The web platform stays the single source of
truth: the API reuses the same Prisma models, the same cross-rate engine
(`src/lib/rates/cross.ts`), the same quote schema (`src/lib/quote/schema.ts`),
the same admin accounts/password hashing, and the same audit + security
logging. Full schema: [`openapi.yaml`](openapi.yaml).

## Conventions

- **Success**: `{ "data": …, "meta"?: … }` — **Errors**: `{ "error": { "code", "message", "details"? } }`.
  Error codes: `BAD_REQUEST` 400, `UNAUTHORIZED` 401, `NOT_FOUND` 404,
  `VALIDATION_ERROR` 422 (field messages in `details`), `RATE_LIMITED` 429
  (with `Retry-After`), `INTERNAL` 500. Never stack traces.
- **All money/rate numerics are decimal strings** (`"32.61"`), never floats.
  Decode as `Decimal` in Swift. Admin write endpoints accept strings or numbers.
- **IDs** are opaque cuids; public references are `AYN-…` (transactions) and
  `AYNE-Q-…` (quotes). Nothing sequential is exposed.
- **Caching**: `GET /rates`, `/rates/featured`, `/transactions*`, `/services*`,
  `/insights*`, `/content/settings` send `ETag` (+ `Last-Modified` on rates) and
  short `Cache-Control`. Send `If-None-Match` and handle `304`. An admin rate
  change produces a new `updatedAt` → new ETag immediately.
- **CORS** is open (`API_CORS_ORIGIN`, default `*`) — safe because auth is via
  the `Authorization` header, never cookies.

## Public endpoints

| Endpoint | Notes |
| --- | --- |
| `GET /api/v1/rates` | All published pairs + buy/sell/display, mode, provider, currency metadata (name, symbol, decimals, `isCrypto`, `flag` country key). |
| `GET /api/v1/rates/featured` | Featured pairs (home ticker). |
| `POST /api/v1/convert` | `{from, to, amount}` → decimal-string result via the SAME engine as the web calculator (inverse + cross rates). 120 req / 5 min / IP. |
| `GET /api/v1/transactions` | Published only. Filters: `service, currency, origin, destination, dateFrom, dateTo, ref, featured` + `page/pageSize`. **Amounts masked server-side**: `EXACT` exact, `ROUNDED` privacy-rounded, `RANGE` min/max only, `HIDDEN` nothing. |
| `GET /api/v1/transactions/:publicRef` | One published transaction. |
| `GET /api/v1/services[?locale=]`, `GET /api/v1/services/:slug` | Catalog + localized copy from the same translation files as the web. |
| `GET /api/v1/insights`, `GET /api/v1/insights/:slug` | Published articles; detail includes `body`. |
| `GET /api/v1/content/settings` | Contact channels (admin-editable), trust stats, currencies, languages, feature flags. No secrets. |
| `POST /api/v1/quotes` | Same zod validation, honeypot and 5/hour/IP limit as the web form. Returns `{reference}`. 422 carries per-field `details`. |
| `POST /api/v1/analytics/events` | Allowlist only: `screen_view, quote_start, quote_submit, whatsapp_click, telegram_click, calculator_use, language_select`. |

## Admin endpoints (Bearer token)

Token model: `POST /admin/auth/login` (email + password, same throttling and
lockout as the web login) → short-lived JWT access token (~15 min, configurable
via `API_ACCESS_TTL_SECONDS`) + rotating refresh token (30 days,
`API_REFRESH_TTL_DAYS`). Refresh tokens are stored **hashed** with device
label/expiry/revocation in `api_refresh_tokens`. `POST /admin/auth/refresh`
rotates the token; replaying an already-rotated token revokes the whole family
and logs `api_refresh_reuse`. `POST /admin/auth/logout` revokes. Password
change (`sessionsValidFrom`) invalidates all outstanding tokens. Accounts with
`totpEnabled` are refused (`TOTP_REQUIRED`) until a TOTP flow exists.

| Endpoint | Notes |
| --- | --- |
| `GET /admin/overview` | Same metrics as the web dashboard + latest quotes. |
| `GET/POST /admin/rates`, `GET/PATCH/DELETE /admin/rates/:id` | Shares `src/lib/rates/mutate.ts` with the web admin actions — history recorded, audit logged, caches invalidated. DELETE = archive. |
| `PATCH /admin/rates/bulk` | `{items:[{id, manualRate?, buyRate?, sellRate?}]}` in one DB transaction. |
| `GET /admin/rates/:id/history` | Change history, newest first. |
| `GET /admin/quotes`, `GET/PATCH /admin/quotes/:id` | PATCH takes `{status?, addNote?}`; audited. Meta includes per-status counts. |
| `GET/POST /admin/transactions`, `GET/PATCH/DELETE /admin/transactions/:id` | Shares `src/lib/transactions/mutate.ts` with the web admin. `isPublished`/`isFeatured` in PATCH route through publish/feature actions so the audit log matches the web. |
| `POST/DELETE /admin/devices` | APNs token registration; 404 unless `MOBILE_PUSH_ENABLED=true`. |

Every mutating admin call writes to the existing `audit_logs` table.

## Environment

```
API_JWT_SECRET          JWT signing secret (falls back to SESSION_SECRET)
API_ACCESS_TTL_SECONDS  access token lifetime (default 900)
API_REFRESH_TTL_DAYS    refresh token lifetime (default 30)
API_CORS_ORIGIN         CORS origin header (default *)
MOBILE_PUSH_ENABLED     enables /admin/devices (default false)
```

## Tests & verification

`npx vitest run src/app/api/v1/__tests__/api-v1.test.ts` — 28 integration tests
covering public endpoints, auth (login, refresh rotation, replay detection,
logout), the admin→public round trips (rate change reflected in `GET /rates`
with a new ETag; publish/unpublish reflected in `GET /transactions`), amount
masking, honeypot, and the analytics allowlist. Requires `DATABASE_URL` to
point at a dev database (never production).

Rate limiting uses the existing DB-backed fixed-window limiter on all POST
endpoints. For GET traffic, add limits at the reverse proxy (Nginx) in
production.
