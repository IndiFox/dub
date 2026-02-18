# Шаг 9: Деплой на Vercel

Коммит с изменениями для self-host уже сделан. Дальше — по пунктам.

---

## 1. Репозиторий на GitHub

Текущий `origin` указывает на `dubinc/dub`. Для своего деплоя нужен **ваш** репозиторий:

- Создайте новый репозиторий на GitHub (например `revroute-dub` или `dub-self-host`).
- Подключите его и запушьте код:

```powershell
cd d:\Cursor_Projects\Dub
git remote add myorigin https://github.com/<ваш-username>/<ваш-репо>.git
git push -u myorigin main
```

Если хотите заменить текущий `origin` на свой репо:

```powershell
git remote set-url origin https://github.com/<ваш-username>/<ваш-репо>.git
git push -u origin main
```

---

## 2. Перед первым деплоем в Vercel

Обязательно задайте **NEXTAUTH_SECRET** (в Vercel и при желании в локальном `.env`):

- Сгенерировать: https://generate-secret.vercel.app/32  
- В Vercel: **Settings → Environment Variables** → добавить `NEXTAUTH_SECRET` = сгенерированное значение.

В Vercel для продакшена также задайте:

- **NEXTAUTH_URL** = `https://app.revroute.ru`  
  (в локальном `.env` можно оставить `http://localhost:8888` для разработки.)

---

## 3. Создание проекта в Vercel

1. Откройте https://vercel.com и войдите.
2. **Add New… → Project**.
3. **Import** репозитория с вашим форком/репо Dub.
4. Настройки:
   - **Framework Preset:** Next.js  
   - **Root Directory:** обязательно `apps/web` (если указать корень `.`, Next.js не будет найден).
   - В `apps/web/vercel.json` заданы `installCommand` (установка из корня репо) и `buildCommand` для pnpm-монорепо.
   - **Проверьте** в **Settings → Build & Development**, что **Root Directory** = `apps/web` (не `.`), иначе Next.js не будет найден.
5. **Environment Variables:** добавьте переменные из `apps/web/.env`:
   - Можно вставить список имён и значений вручную или по одной.
   - **Не добавляйте** `PROJECT_ID_VERCEL` до первого деплоя.
   - Обязательно задайте для Production (и при необходимости Preview):
     - `NEXTAUTH_URL` = `https://app.revroute.ru`
     - `NEXTAUTH_SECRET` = (значение с generate-secret.vercel.app/32)
6. Нажмите **Deploy**.

---

## 4. После первого деплоя

1. Зайдите в **Project → Settings**.
2. Скопируйте **Project ID** (в блоке General).
3. В **Settings → Environment Variables** добавьте:
   - `PROJECT_ID_VERCEL` = скопированный Project ID.
   - При необходимости добавьте **TEAM_ID_VERCEL** и **AUTH_BEARER_TOKEN** (для Domains API), если они у вас есть.
4. **Settings → Domains:** добавьте домены:
   - `app.revroute.ru`
   - `link.revroute.ru`
5. В **Deployments** сделайте **Redeploy** последнего деплоя.

---

## 5. DNS для доменов

Чтобы открыть приложение по своим доменам:

- Для `app.revroute.ru`: в панели DNS провайдера добавьте запись (A или CNAME), как подскажет Vercel после добавления домена.
- Для `link.revroute.ru`: аналогично по инструкции Vercel (часто CNAME на `cname.vercel-dns.com` или указанный Vercel хост).

После сохранения DNS через несколько минут должен открываться логин Dub по адресу https://app.revroute.ru.

---

## 6. Таймаут 45 минут и OOM (Out of Memory)

У Vercel лимит **45 минут** на билд и **8 GB RAM** в контейнере. Если сборка падает с **SIGKILL** или в отчёте есть "Out of Memory":

- В `apps/web/vercel.json` задано **NODE_OPTIONS=--max-old-space-size=5120** — Node использует до ~5 GB, остальное остаётся для воркеров Next.js и системы (Turbopack отключён — с ним был OOM).
- В **Settings → General** (Pro/Enterprise) включите **Enhanced Builds** (16 GB RAM, 8 CPU) — самый надёжный вариант для тяжёлой сборки.
- Запасной вариант — **prebuilt** (сборка не на Vercel):
  1. Локально: `cd d:\Cursor_Projects\Dub` → `pnpm build --filter=web` (дождаться окончания).
  2. Деплой: `vercel --prod --yes --prebuilt` (из корня репо, с токеном при необходимости). Vercel использует уже собранный `.next`.

---

## Краткий чеклист

| Действие | Сделано |
|----------|--------|
| Коммит изменений | ✅ |
| Репо на GitHub (свой) + push | ⬜ |
| NEXTAUTH_SECRET сгенерирован | ⬜ |
| Vercel: New Project, Import, Root = `apps/web` | ⬜ |
| Vercel: добавлены переменные из .env, NEXTAUTH_URL=https://app.revroute.ru | ⬜ |
| Первый Deploy | ⬜ |
| Добавлен PROJECT_ID_VERCEL, домены app/link.revroute.ru | ⬜ |
| Redeploy | ⬜ |
| DNS для app.revroute.ru и link.revroute.ru | ⬜ |
