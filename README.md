\# Ayne Exchange

Premium international payments & exchange platform — presentation, lead
generation and enquiry site with a secure admin panel.

> **Positioning note:** Ayne Exchange is **not** a bank or a licensed financial
> institution. The product presents services and collects enquiries; actual
> transactions are handled off-platform following compliance procedures. The
> codebase deliberately avoids fabricated licenses, partners, customers or
> regulatory claims — keep it that way.

---

## Tech stack

| Layer | Choice | Notes |
|------|--------|-------|
| Framework | **Next.js 14** (App Router, TS) | SSR for SEO, one language front→back |
| Styling | **Tailwind CSS** + CSS-variable design tokens | Dark-first, light supported |
| i18n | **next-intl** | English, Persian (RTL), Russian |
| Components | Radix primitives, custom-styled | Not a component-library demo |
| Animation | **Framer Motion** + CSS/SMIL | Respects `prefers-reduced-motion` |
| Charts | **Recharts** (admin) | |
| ORM / DB | **Prisma** + **MySQL/MariaDB** | Portable, no Redis/Docker required |
| Auth | Custom DB-backed sessions, bcrypt, CSRF | Admin only |

Runs on an ordinary Node.js host (Hetzner VPS recommended) or Node-capable
cPanel. No Docker/Kubernetes/Redis required for core operation.

---

## Project structure

```
messages/                 en.json · fa.json · ru.json  (translation dictionaries)
prisma/schema.prisma      full relational schema
src/
  app/
    [locale]/
      layout.tsx          <html lang/dir>, theme + intl providers
      (site)/             public site (navbar/footer/whatsapp shell)
        page.tsx          homepage
      admin/              admin panel (auth-gated, server-side)
    robots.ts sitemap.ts
  components/
    ui/                   Button, Card, Badge, Section, Dropdown, Select…
    layout/               Navbar, Footer, ThemeToggle, LanguageSelector, WhatsApp
    home/                 Hero, PaymentNetwork, Stats, Services, HowItWorks…
    brand/                Logo (SVG mark)
    seo/                  JSON-LD
  i18n/                   routing, request, navigation
  lib/
    config/               site, services, currencies, countries, nav, stats
    rates/                indicative fallbacks + provider abstraction
    auth/                 session/constants (admin)
    db.ts utils.ts format.ts fonts.ts
middleware.ts             next-intl locale routing
```

---

## Local development

Requires **Node.js ≥ 18.18** and a MySQL/MariaDB database.

```bash
# 1. Install
npm install

# 2. Configure environment
cp .env.example .env
#   → set DATABASE_URL, SESSION_SECRET (openssl rand -base64 48), contact channels

# 3. Create the schema + seed demo data
npm run db:migrate      # creates tables (dev)
npm run db:seed         # seeds services, demo transactions, settings

# 4. Create your first admin
npm run admin:create    # interactive: email + password

# 5. Run
npm run dev             # http://localhost:3000  (admin: /admin)
```

### Useful scripts

| Script | Purpose |
|--------|---------|
| `npm run dev` | Dev server |
| `npm run build` | `prisma generate` + production build |
| `npm start` | Start built app |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run db:migrate` | Create/apply dev migration |
| `npm run db:deploy` | Apply migrations in production |
| `npm run db:studio` | Prisma Studio (DB GUI) |
| `npm run db:seed` | Seed demo/reference data |
| `npm run admin:create` | Create an admin account |

---

## Environment variables

See [`.env.example`](.env.example) for the full annotated list. Essentials:

- `DATABASE_URL` — MySQL connection string
- `SESSION_SECRET` — ≥ 32 random chars (`openssl rand -base64 48`)
- `NEXT_PUBLIC_SITE_URL` — canonical origin (no trailing slash)
- `NEXT_PUBLIC_WHATSAPP_NUMBER`, `NEXT_PUBLIC_TELEGRAM_USERNAME`, `CONTACT_EMAIL`
- Rate providers (optional) — the rate layer is provider-agnostic and works with
  manual rates alone. Configure `RATES_PROVIDER` + keys to enable auto rates.

Never commit `.env`. Secrets are read only server-side (only `NEXT_PUBLIC_*` reach
the browser, by design).

---

## Deployment — Hetzner VPS (recommended)

A small Hetzner Cloud VPS (CX22 or similar, Ubuntu 22.04+) is plenty.

```bash
# --- One-time server setup ---
# Node 20 LTS
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs mariadb-server nginx
sudo mysql_secure_installation

# Create DB + user
sudo mysql -e "CREATE DATABASE ayne_exchange CHARACTER SET utf8mb4;"
sudo mysql -e "CREATE USER 'ayne'@'localhost' IDENTIFIED BY 'STRONG_PASSWORD';"
sudo mysql -e "GRANT ALL ON ayne_exchange.* TO 'ayne'@'localhost'; FLUSH PRIVILEGES;"

# --- Deploy the app ---
git clone <your-repo> /var/www/ayne && cd /var/www/ayne
cp .env.example .env      # fill in real values (DATABASE_URL, SESSION_SECRET, …)
npm ci
npm run build
npm run db:deploy
npm run admin:create

# --- Run with PM2 ---
sudo npm i -g pm2
pm2 start "npm start" --name ayne
pm2 save && pm2 startup
```

Then put **Nginx** in front as a reverse proxy on port 80/443 and terminate TLS
with **Certbot** (Let's Encrypt):

```nginx
server {
  server_name ayne.example.com;
  location / {
    proxy_pass http://127.0.0.1:3000;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host $host;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_cache_bypass $http_upgrade;
  }
}
```

```bash
sudo certbot --nginx -d ayne.example.com   # enables HTTPS + HSTS
```

Set `NODE_ENV=production` — this enables HSTS and strict CSP (see
`next.config.mjs`).

### Cron — exchange-rate refresh

If you enable an auto rate provider, refresh rates periodically by calling the
protected endpoint (implemented in the rates phase):

```cron
*/30 * * * * curl -fsS -H "x-cron-secret: $CRON_SECRET" https://ayne.example.com/api/cron/rates >/dev/null
```

### Node-capable cPanel (alternative)

If you deploy on cPanel with the *Setup Node.js App* feature: set the
application root, startup file (`npm start` via a `server.js` or the Passenger
entry), install dependencies from the cPanel UI, add the same env vars, and
point the app's database at the cPanel MySQL instance. Shared cPanel without
persistent Node is **not** recommended for this stack.

---

## Security

- Strict security headers + CSP (`next.config.mjs`)
- Admin: bcrypt password hashing, DB-backed sessions (HttpOnly/Secure/SameSite),
  login throttling + lockout, CSRF tokens, session invalidation on password
  change, audit + security event logging
- All public forms: server-side Zod validation, input normalization,
  rate limiting (DB-backed, no Redis), honeypot/bot protection
- Parameterized queries via Prisma (no raw SQL string building)
- No sequential IDs exposed; enquiry references are opaque (`AYNE-Q-2026-…`)
- Transactions/case studies never store account numbers, IBANs, SWIFT messages
  or customer/beneficiary names

Run a review before go-live: `npm run typecheck` and the security checklist in
`/admin/security`.

---

## Backups

- **Database:** `mysqldump -u ayne -p ayne_exchange > backup-$(date +%F).sql`
  (schedule daily via cron; store off-server, encrypted).
- **Env/config:** back up `.env` securely and separately (contains secrets).
- **Restore:** `mysql -u ayne -p ayne_exchange < backup.sql`, then
  `npm run build && pm2 restart ayne`.
- Never expose backups in a web-accessible directory.

---

## Content management

Services, transactions, rates, testimonials, case studies, blog posts, landing
pages and site settings are all editable from `/admin` — no code changes needed
for normal content updates. Demo/seed content is clearly flagged and never
published as genuine by default.

---

## Build status / roadmap

This repository is being built in phases. Delivered and in-progress work is
tracked with the maintainers; see the project notes for the current phase.
