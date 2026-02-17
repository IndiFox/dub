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
   - **Root Directory:** `apps/web` (обязательно).
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
