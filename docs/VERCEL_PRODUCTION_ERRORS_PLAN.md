# План исправлений ошибок продакшена Vercel (настройки)

На основе логов продакшена (`vercel logs --environment production --level error`).

**Официальная документация:** [Self-hosting Dub](https://dub.co/docs/self-hosting) — в ней указано, что вместо PlanetScale можно использовать [MySQL на Railway](https://railway.app/template/mysql) ($5/мес) как более дешёвый вариант.

---

## 1. Что видно из логов

| Хост | Маршрут | Статус | Источник | Сообщение |
|------|---------|--------|----------|-----------|
| **app.revroute.ru** | GET /login | 307 | ε (Edge) | `[AppMiddleware] DB/fetch error (e.g. PlanetScale) TypeEr…` |
| **link.revroute.ru** | HEAD / | 500 | ε (Edge) | `info - HEAD /` |

Обе ошибки идут из **Edge** (middleware), не из Node.js serverless.

---

## 2. Причина ошибок

### 2.1 AppMiddleware (app.revroute.ru) — TypeError при работе с БД

- В **Edge middleware** используется `prismaEdge` из `@dub/prisma/edge`, который построен на **`@planetscale/database`**.
- Документация [Self-hosting](https://dub.co/docs/self-hosting) разрешает использовать **Railway вместо PlanetScale** для MySQL — это корректно для **основного приложения** (API, страницы, Node.js runtime): там используется обычный Prisma с `DATABASE_URL` (формат `mysql://...`), Railway подходит.
- **Edge middleware** — отдельный runtime (Vercel Edge). Там используется только **PlanetScale serverless driver** (`@planetscale/database`), рассчитанный на HTTP-API PlanetScale, а не на произвольный MySQL. При `DATABASE_URL=mysql://...railway...` без PlanetScale-URL в Edge этот драйвер может выдавать **TypeError** (неверный протокол/инициализация).
- Дополнительно: если в продакшене задан `PLANETSCALE_DATABASE_URL` с `localhost` (как в .env для локальной разработки), логика выбора URL отдаёт в Edge невалидное для продакшена значение.

Итог: для **Node.js** части Railway допустим (как в документации); ошибка возникает из-за того, что **Edge** в этом проекте ждёт подключение через PlanetScale-драйвер, а в настройках либо только Railway (`mysql://`), либо localhost.

### 2.2 link.revroute.ru (500 на HEAD /)

- Запрос обрабатывается **LinkMiddleware** (корень домена ссылок).
- 500 может быть из-за: таймаута Edge, отсутствия/неверных env для БД, Redis (Upstash), Tinybird или других внешних сервисов в цепочке обработки ссылки.

Фокус плана — **проверка настроек** (env, лимиты, доступ к БД/кэшу/аналитике).

---

## 3. План исправлений (только настройки)

### Railway vs PlanetScale (по документации)

В [Self-hosting Dub](https://dub.co/docs/self-hosting) сказано: *«PlanetScale убрал бесплатный тир, более дешёвая альтернатива — MySQL на Railway ($5/мес)»*. То есть **Railway можно использовать** как основную БД для приложения: для API, страниц и всего, что работает в Node.js runtime, достаточно задать **DATABASE_URL** в формате `mysql://...` от Railway.

Ограничение касается только **Vercel Edge middleware** (редиректы, проверка сессии, онбординг и т.д.): в коде Dub там используется `@dub/prisma/edge` на базе драйвера **@planetscale/database**, который рассчитан на PlanetScale (их HTTP API). Если в Production задан только Railway (`DATABASE_URL`) и нет рабочего **PLANETSCALE_DATABASE_URL**, Edge при обращении к БД падает с TypeError — отсюда ошибки в логах. Итог: Railway для основного приложения по документации ок; для устранения ошибок Edge нужен либо PlanetScale в настройках (хотя бы для **PLANETSCALE_DATABASE_URL**), либо доработка кода.

### 3.1 База данных для Edge (устраняет основную массу ошибок AppMiddleware)

В [документации по self-hosting](https://dub.co/docs/self-hosting) указано: можно использовать **PlanetScale** или **Railway** (MySQL) для базы. Railway подходит для основной части приложения (Node.js, Prisma, `DATABASE_URL`). Но **Edge middleware** в коде Dub использует только PlanetScale-драйвер; для него нужен именно PlanetScale-подключение (или эквивалент).

**Что сделать в Vercel → Project → Settings → Environment Variables (Production):**

1. **Не использовать для продакшена `PLANETSCALE_DATABASE_URL` с localhost.**  
   В Production не должно быть:
   - `PLANETSCALE_DATABASE_URL=http://...localhost...`
   - Любого значения с `localhost` или `127.0.0.1` для этой переменной.

2. **Вариант A — одна БД: PlanetScale (как в основном flow документации)**  
   - Создать БД в [PlanetScale](https://planetscale.com/), в разделе Connect выбрать Prisma и скопировать **connection string**.
   - В Vercel (Production):
     - **DATABASE_URL** = эта строка (для Node/Prisma и для остального кода).
     - **PLANETSCALE_DATABASE_URL** = тот же URL (Edge будет использовать его через PlanetScale-драйвер).
   - Один провайдер, Edge и Node работают.

3. **Вариант B — основная БД на Railway (как в документации)**  
   - Оставить **DATABASE_URL** = `mysql://...` от Railway (основное приложение и API работают так, как описано в [self-hosting](https://dub.co/docs/self-hosting)).
   - Чтобы **Edge middleware** перестал падать, нужен отдельный доступ к БД через PlanetScale-драйвер. Варианты только настройками:
     - Завести **отдельную БД в PlanetScale** только для Edge и в Vercel задать **PLANETSCALE_DATABASE_URL** = connection string от PlanetScale (тогда два источника данных — не идеально, но без правок кода).
     - Либо перейти на один PlanetScale (Вариант A).
   - Если оставить только Railway и не задавать рабочий **PLANETSCALE_DATABASE_URL**, ошибки Edge (TypeError в AppMiddleware) чисто настройками не убрать — в коде Edge используется именно PlanetScale-драйвер.

4. **Проверка:**  
   После изменений и деплоя:
   ```bash
   vercel logs --environment production --level error --limit 20
   ```
   Ошибки `[AppMiddleware] DB/fetch error (e.g. PlanetScale)` должны исчезнуть или резко снизиться.

---

### 3.2 Остальные переменные окружения (Production)

Проверить в Vercel (Production), что заданы и не пустые:

| Переменная | Назначение | Если не задана |
|------------|------------|----------------|
| **NEXTAUTH_SECRET** | Сессия и JWT в middleware (getUserViaToken) | Ошибки/непредсказуемое поведение при проверке сессии |
| **NEXTAUTH_URL** | URL приложения для NextAuth | Для продакшена: `https://app.revroute.ru` (или основной домен) |
| **DATABASE_URL** | Основная БД (Node/Prisma, не Edge) | Ошибки при работе API и страниц |
| **CRON_SECRET** | Подпись запросов от Vercel Cron; также защищает внутренний API `/api/internal/link` (резолв ссылок в Edge при Railway) | Cron — 401; без него переход по коротким ссылкам в Edge может не работать при cache miss |
| **EDGE_CONFIG** | Edge Config (опционально) | Часть фич админки/бан-листов может не работать; для текущих ошибок не критично |
| **AXIOM_TOKEN** + **AXIOM_DATASET** | Логи в Axiom | Логи только в Vercel; для разбора ошибок полезно включить |

Для **link.revroute.ru** дополнительно проверить:

- **UPSTASH_REDIS_REST_URL** / **UPSTASH_REDIS_REST_TOKEN** — кэш ссылок.
- **TINYBIRD_API_KEY** / **TINYBIRD_API_URL** — аналитика кликов (если запросы доходят до recordClick).

Имеет смысл один раз выгрузить из Vercel список env (без значений) и сверить с `.env.example`.

---

### 3.3 Лимиты и регион Edge

- **Таймаут Edge:** по умолчанию лимит выполнения middleware небольшой. Если 500 на **link.revroute.ru** появляются под нагрузкой или на «холодных» запросах, в Vercel посмотреть:
  - Dashboard → Project → Settings → Functions / Edge.
  - Нет ли жёсткого урезания таймаута для Edge; при необходимости увеличить в рамках плана (если доступно).
- **Регион:** убедиться, что БД (PlanetScale/Railway) и Redis (Upstash) доступны из региона, в котором Vercel запускает Edge (часто `iad1` и др.). Блокировка по IP или ограничения региона могут давать таймауты и 500.

---

### 3.4 Домен link.revroute.ru

- В Vercel в **Domains** для проекта проверить, что **link.revroute.ru** привязан к тому же проекту и окружению (Production).
- Убедиться, что для этого домена в middleware нет отдельной логики, подставляющей другой host или отключающей кэш/БД так, что запрос идёт по «неправильному» пути и падает с 500.

---

## 4. Краткий чеклист

- [ ] В Vercel Production **нет** `PLANETSCALE_DATABASE_URL` с localhost.
- [ ] Для Edge задан рабочий **PLANETSCALE_DATABASE_URL** (connection string от PlanetScale) в Production — иначе при использовании только Railway (как в [документации](https://dub.co/docs/self-hosting)) Edge middleware будет падать с TypeError.
- [ ] **NEXTAUTH_SECRET** и **NEXTAUTH_URL** заданы для Production.
- [ ] **DATABASE_URL** корректен: PlanetScale или Railway (оба допустимы по документации для основной части приложения).
- [ ] **CRON_SECRET** задан, если используются cron-задачи.
- [ ] Для отладки при необходимости добавлены **AXIOM_TOKEN** и **AXIOM_DATASET**.
- [ ] Для link-домена проверены **Upstash Redis** и **Tinybird** env.
- [ ] Домен **link.revroute.ru** привязан к проекту в Vercel, регион и лимиты Edge проверены.

После изменений — повторный просмотр логов:

```bash
vercel logs --environment production --level error --since 1h
vercel logs --environment production --status-code 500 --since 1h
```

---

## 5. Итог

- **Основная причина** ошибок в логах — использование в Edge middleware БД через `@planetscale/database` при неподходящих или локальных URL в env. Исправление: корректно задать **PLANETSCALE_DATABASE_URL** (и при необходимости **DATABASE_URL**) для Production в Vercel, без localhost.
- **Вторая проблема** — 500 на **link.revroute.ru**: снизить вероятность помогут проверка env (Redis, Tinybird, БД), домена и лимитов Edge; при необходимости — включить Axiom для детального разбора следующих ошибок.

Все шаги выше — только настройки (env, домены, лимиты); изменения кода не требуются для устранения описанной причины AppMiddleware-ошибок.
