# Self-hosting Dub — checklist (phases 2–8)

After completing **Phase 1** (clone, `pnpm i`, remove `apps/web/vercel.json`, create `apps/web/.env`), use this checklist to configure external services and deploy.

Domains for this instance: **app.revroute.ru** (app), **link.revroute.ru** (short links). Set in `apps/web/.env` as `NEXT_PUBLIC_APP_DOMAIN` and `NEXT_PUBLIC_APP_SHORT_DOMAIN`.

---

## Phase 2: Tinybird (analytics)

1. Sign up at [Tinybird](https://www.tinybird.co/), create a Workspace.
2. Copy your **Admin Auth Token** → set in `.env`:
   - `TINYBIRD_API_KEY=<your admin token>`
3. Install CLI and deploy (from repo root):
   - `pip install tinybird-cli` (Python ≥ 3.8)
   - `cd packages/tinybird && tb login` (paste token) then `tb deploy`
4. From `tb deploy` output, copy the **Test endpoint** base URL (e.g. `https://api.us-east.tinybird.co`) → set in `.env`:
   - `TINYBIRD_API_URL=https://api.<region>.tinybird.co`

---

## Phase 3: Upstash (Redis + QStash)

1. Sign up at [Upstash](https://upstash.com/), create a Redis database (global + read regions recommended).
2. In the database page, **REST API** section, copy:
   - `UPSTASH_REDIS_REST_URL=...`
   - `UPSTASH_REDIS_REST_TOKEN=...`
3. Open [QStash](https://console.upstash.com/qstash), **Request Builder** section, copy:
   - `QSTASH_TOKEN=...`
   - `QSTASH_CURRENT_SIGNING_KEY=...`
   - `QSTASH_NEXT_SIGNING_KEY=...`

Add all five to `apps/web/.env`.

---

## Phase 4: PlanetScale-compatible MySQL

1. Create a database: [PlanetScale](https://planetscale.com/) (paid) or [Railway MySQL](https://railway.app/template/mysql) (~$5/mo). Choose **Prisma** in the setup wizard.
2. Create a password and copy the **connection string** → set in `.env`:
   - `DATABASE_URL="mysql://user:password@host:port/database?sslaccept=strict"`
3. For this instance the short domain column is already `linkrevrouteru` (link.revroute.ru). If you change the short domain, edit `packages/prisma/schema/domain.prisma` accordingly.
4. From repo root:
   - `cd apps/web && pnpm run prisma:generate`
   - `pnpm run prisma:push`

---

## Phase 5: GitHub OAuth (login)

1. [Create a GitHub OAuth App](https://github.com/settings/applications/new).
2. Set **Callback URL** to:
   - `https://app.revroute.ru/api/auth/callback/github`
   - `http://localhost:8888/api/auth/callback/github` (for local dev).
3. Copy **Client ID** and **Client Secret** → set in `.env`:
   - `GITHUB_CLIENT_ID=...`
   - `GITHUB_CLIENT_SECRET=...`

---

## Phase 6: Cloudflare R2 (storage for avatars, logos, images)

1. In [Cloudflare](https://dash.cloudflare.com/), enable R2, create a bucket (e.g. `dubassets`).
2. In bucket settings, copy the **S3 API** endpoint.
3. **Manage R2 API Tokens** → Create API Token, **Object Read & Write** for this bucket. Copy **Access Key ID** and **Secret Access Key**.
4. Set up a public URL for the bucket (custom domain or R2.dev subdomain; enable “Allow Access” for R2.dev).
5. Set in `.env`:
   - `STORAGE_ACCESS_KEY_ID=...`
   - `STORAGE_SECRET_ACCESS_KEY=...`
   - `STORAGE_ENDPOINT=<S3 API endpoint>`
   - `STORAGE_BASE_URL=<public URL of the bucket>`

---

## Phase 7 (optional): Resend & Unsplash

- **Resend** (for magic link login): [Resend API key](https://resend.com/api-keys), verify domain → `RESEND_API_KEY=...`
- **Unsplash** (Custom Social Cards): [Unsplash developers](https://unsplash.com/developers) → `UNSPLASH_ACCESS_KEY=...`

---

## Phase 8: Deploy to Vercel

1. Push the repo to GitHub (`git add . && git commit -m "Initial commit" && git push origin main`).
2. In [Vercel](https://vercel.com/), create a new project from the GitHub repo.
3. Set **Framework Preset** = **Next.js**, **Root Directory** = `apps/web`.
4. Add all variables from `apps/web/.env` as **Environment Variables**. Exceptions:
   - Omit `PROJECT_ID_VERCEL` for the first deploy (add after deploy).
   - Set `NEXTAUTH_URL=https://app.revroute.ru`.
5. Deploy. After the first deploy, copy the **Project ID** from Vercel project settings → add `PROJECT_ID_VERCEL=...` in Vercel env and in local `.env`.
6. In Vercel **Settings → Domains**, add `app.revroute.ru` and `link.revroute.ru`.
7. Redeploy the project.

---

## Required env vars summary

| Variable | Phase |
|----------|--------|
| `NEXT_PUBLIC_APP_DOMAIN`, `NEXT_PUBLIC_APP_SHORT_DOMAIN` | 0 / 1 |
| `TINYBIRD_API_KEY`, `TINYBIRD_API_URL` | 2 |
| `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN` | 3 |
| `QSTASH_TOKEN`, `QSTASH_CURRENT_SIGNING_KEY`, `QSTASH_NEXT_SIGNING_KEY` | 3 |
| `DATABASE_URL` | 4 |
| `NEXTAUTH_SECRET`, `NEXTAUTH_URL` | 1 / 8 |
| `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET` | 5 |
| `STORAGE_ACCESS_KEY_ID`, `STORAGE_SECRET_ACCESS_KEY`, `STORAGE_ENDPOINT`, `STORAGE_BASE_URL` | 6 |
| `PROJECT_ID_VERCEL`, `TEAM_ID_VERCEL`, `AUTH_BEARER_TOKEN` | 8 |

Generate `NEXTAUTH_SECRET` at [generate-secret.vercel.app/32](https://generate-secret.vercel.app/32).
