# app.revroute.ru и link.revroute.ru — проверка и Cloudflare

## Как Dub различает домены

- **app.revroute.ru** — дашборд (логин, воркспейсы, настройки). Обрабатывается **AppMiddleware**.
- **link.revroute.ru** — домен коротких ссылок (редиректы, клики). Обрабатывается **LinkMiddleware**.

В коде это задаётся переменными:

| Переменная | Значение | Назначение |
|------------|----------|------------|
| `NEXT_PUBLIC_APP_DOMAIN` | `revroute.ru` | Базовый домен: тогда `app.revroute.ru` и `preview.revroute.ru` считаются «приложением». |
| `NEXT_PUBLIC_APP_SHORT_DOMAIN` | `link.revroute.ru` | Домен коротких ссылок (редиректы вида `link.revroute.ru/xyz`). |

Из этого выводятся:

- `APP_HOSTNAMES` = `app.revroute.ru`, `preview.revroute.ru` → идут в приложение.
- `APP_DOMAIN` = `https://app.revroute.ru` (в проде).
- `SHORT_DOMAIN` = `link.revroute.ru` → редиректы и клики.

Проверьте в **Vercel → Settings → Environment Variables** (Production и Preview):

- `NEXT_PUBLIC_APP_DOMAIN` = `revroute.ru`
- `NEXT_PUBLIC_APP_SHORT_DOMAIN` = `link.revroute.ru`
- `NEXTAUTH_URL` = `https://app.revroute.ru`

Без этого приложение не будет корректно считать запросы к app/link и маршрутизировать их.

---

## Vercel — домены

В **Vercel → Project → Settings → Domains** должны быть добавлены:

1. **app.revroute.ru** (Production).
2. **link.revroute.ru** (Production).

После добавления Vercel покажет, какую DNS-запись использовать (обычно CNAME на `cname.vercel-dns.com` или A на IP Vercel).

---

## Cloudflare — DNS

Домен revroute.ru должен быть в Cloudflare (зоной управляет Cloudflare).

### Записи в Cloudflare DNS

| Тип | Имя | Целевой хост / значение | Прокси |
|-----|-----|-------------------------|--------|
| CNAME | `app` | `cname.vercel-dns.com` (или то, что указал Vercel для app.revroute.ru) | По желанию (см. ниже) |
| CNAME | `link` | `cname.vercel-dns.com` (или то, что указал Vercel для link.revroute.ru) | По желанию |

Имена записей: именно `app` и `link`, чтобы получились `app.revroute.ru` и `link.revroute.ru`. Если Vercel после добавления домена показывает другой целевой хост — используйте его.

### Прокси Cloudflare (оранжевое облако)

- **Прокси выключен (только DNS, серое облако)**  
  Запросы идут напрямую в Vercel. Часто проще и достаточно для Dub.

- **Прокси включён (оранжевое облако)**  
  Трафик идёт через Cloudflare. Нужно:
  - **SSL/TLS** → режим **Full (strict)** (чтобы Cloudflare к Vercel ходил по HTTPS и доверял сертификату Vercel).
  - Заголовок `Host` (app.revroute.ru / link.revroute.ru) Cloudflare передаёт по умолчанию — менять ничего не нужно.

Для Dub оба варианта (только DNS или прокси с Full strict) допустимы.

---

## Что проверить по шагам

1. **Переменные в Vercel**  
   `NEXT_PUBLIC_APP_DOMAIN=revroute.ru`, `NEXT_PUBLIC_APP_SHORT_DOMAIN=link.revroute.ru`, `NEXTAUTH_URL=https://app.revroute.ru`.

2. **Домены в Vercel**  
   В Domains есть `app.revroute.ru` и `link.revroute.ru`, статус — Valid/Active (после корректного DNS).

3. **Cloudflare DNS**  
   Есть CNAME `app` → целевой хост Vercel и CNAME `link` → целевой хост Vercel. После сохранения подождать 2–5 минут (иногда дольше).

4. **Проверка в браузере**  
   - Открыть **https://app.revroute.ru** — должна открыться страница входа/дашборд Dub.  
   - Открыть **https://link.revroute.ru** (или любую короткую ссылку на этом домене) — редирект или 404 от приложения, но не ошибка «сайт недоступен» от DNS/прокси.

5. **База доменов в Dub**  
   В приложении (дашборд) домен **link.revroute.ru** должен быть добавлен как домен для коротких ссылок и привязан к вашему воркспейсу. В БД в таблице `Domain` должна быть запись с `slug = "link.revroute.ru"`. Для self-host в схеме есть `DefaultDomains.linkrevrouteru` (домен без точек) — при смене короткого домена при необходимости правят `packages/prisma/schema/domain.prisma` и миграции/сиды. Иначе редиректы по link.revroute.ru не найдут домен.

---

## Если что-то не работает

- **app.revroute.ru открывает не то / 500**  
  Проверить `NEXT_PUBLIC_APP_DOMAIN` и `NEXTAUTH_URL` в Vercel и сделать Redeploy.

- **link.revroute.ru не открывается / DNS error**  
  Проверить CNAME в Cloudflare и целевой хост в Vercel (Domains → домен → подсказка по DNS).

- **Редиректы по link.revroute.ru не работают**  
  Убедиться, что домен link.revroute.ru добавлен в настройках доменов в дашборде Dub и что в БД (или seed) есть запись для этого домена (как в SELF_HOSTING_CHECKLIST / domain.prisma).
