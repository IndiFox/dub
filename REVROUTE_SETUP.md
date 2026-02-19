# RevRoute — домены и сервисы

**Домены:** приложение `app.revroute.ru`, короткие ссылки `link.revroute.ru`. Уже подставлены в `.env` и в коде.

---

## Открытые вкладки

Должны были открыться в браузере:

1. **Tinybird** — https://www.tinybird.co/ (аналитика кликов)  
2. **Upstash** — https://console.upstash.com/ (Redis + QStash)  
3. **PlanetScale** — https://app.planetscale.com/ (MySQL) или [Railway MySQL](https://railway.app/template/mysql)  
4. **GitHub OAuth** — https://github.com/settings/applications/new (вход в Dub)  
5. **Cloudflare** — https://dash.cloudflare.com/ (R2 для картинок/аватаров)  
6. **Vercel** — https://vercel.com/login (деплой)

Войдите в каждый сервис (логин/пароль только вы). Дальше можно заполнять формы и копировать ключи по чеклисту ниже.

---

## Что делать после входа

### Tinybird
- Создайте Workspace (если ещё нет).
- **Tokens** → скопируйте **Admin token** (тип Admin) → в `.env`: `TINYBIRD_API_KEY=...`
- В терминале: `cd packages/tinybird`, затем `$env:TB_TOKEN = "сюда_вставьте_токен_из_env"`, затем `tb deploy`.
- Из вывода `tb deploy` возьмите базовый URL (например `https://api.eu-central-1.tinybird.co`) → в `.env`: `TINYBIRD_API_URL=...`
- Если ошибка "invalid user authentication" — проверьте в Tinybird, что токен именно **Admin** и не отозван; при необходимости создайте новый.

### Upstash
- **Create database** (Redis), тип Global при желании.
- На странице базы: **REST API** → скопируйте `UPSTASH_REDIS_REST_URL` и `UPSTASH_REDIS_REST_TOKEN` в `.env`.
- Вкладка **QStash** → **Request Builder** → скопируйте `QSTASH_TOKEN`, `QSTASH_CURRENT_SIGNING_KEY`, `QSTASH_NEXT_SIGNING_KEY` в `.env`.

### PlanetScale (или Railway)
- Создайте базу, выберите **Prisma**, создайте пароль.
- Скопируйте **connection string** → в `.env`: `DATABASE_URL="mysql://..."`
- В проекте: `cd apps/web && pnpm run prisma:generate && pnpm run prisma:push`

### GitHub OAuth
- **Application name**: например `Dub RevRoute`.
- **Homepage URL**: `https://app.revroute.ru`
- **Callback URL**:  
  `https://app.revroute.ru/api/auth/callback/github`  
  и добавьте: `http://localhost:8888/api/auth/callback/github`
- После создания скопируйте **Client ID** и **Client Secret** → в `.env`: `GITHUB_CLIENT_ID=...`, `GITHUB_CLIENT_SECRET=...`

### Cloudflare R2
- Включите R2, создайте bucket (например `dubassets`).
- В настройках bucket скопируйте **S3 API** endpoint.
- **Manage R2 API Tokens** → Create → Object Read & Write для этого bucket → скопируйте **Access Key ID** и **Secret Access Key**.
- Настройте публичный доступ (домен или R2.dev) → в `.env`: `STORAGE_ENDPOINT=...`, `STORAGE_ACCESS_KEY_ID=...`, `STORAGE_SECRET_ACCESS_KEY=...`, `STORAGE_BASE_URL=...`

### Vercel
- Подключите репозиторий GitHub с Dub, **Root Directory** = `apps/web`, **Framework** = Next.js.
- Вставьте все переменные из `apps/web/.env`. Обязательно: `NEXTAUTH_URL=https://app.revroute.ru`. Без `PROJECT_ID_VERCEL` на первый деплой.
- После деплоя добавьте **Domains**: `app.revroute.ru`, `link.revroute.ru`. Добавьте `PROJECT_ID_VERCEL` и сделайте редеплой.

---

**Проверка app.revroute.ru и link.revroute.ru (в т.ч. через Cloudflare):** [docs/REVROUTE_CLOUDFLARE.md](docs/REVROUTE_CLOUDFLARE.md).

Полный чеклист: [SELF_HOSTING_CHECKLIST.md](SELF_HOSTING_CHECKLIST.md).
