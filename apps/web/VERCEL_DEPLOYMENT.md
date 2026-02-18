# Деплой на Vercel — чеклист

## Настройки проекта в Vercel Dashboard

1. **Root Directory:** `apps/web` (обязательно).
2. **Framework Preset:** Next.js (определяется автоматически).
3. **Environment Variables:** задайте все переменные из `.env` (в т.ч. `DATABASE_URL`) в Settings → Environment Variables для Production/Preview.

## Что исправлено в репозитории

- **Prisma generate без .env:** сборка больше не вызывает `dotenv-flow` для `prisma generate` (на Vercel нет `.env`). Используется прямой вызов `pnpm --filter=@dub/prisma generate`.
- **Память и кэш:** в `vercel.json` заданы `NODE_OPTIONS=--max-old-space-size=6144` и `ENABLE_ROOT_PATH_BUILD_CACHE=1` для ускорения сборки монорепо.

## Если сборка всё ещё падает по таймауту (45 мин)

- Включите **Turbo** (Remote Caching) в проекте Vercel.
- Рассмотрите **Vercel Pro** и более мощные build-машины.
- Локальная сборка и деплой пребилда: `pnpm build --filter=web` в корне, затем `vercel deploy --prebuilt` из `apps/web`.
