# Tinybird по официальной инструкции Dub

Сверка с [dub.co/docs/self-hosting](https://dub.co/docs/self-hosting), Step 2: Set up Tinybird Clickhouse database.

---

## Что требует инструкция Dub (дословно)

| # | Шаг в документации | Нужно по инструкции |
|---|----------------------|----------------------|
| 1 | Create Tinybird Workspace | Аккаунт Tinybird, создать Workspace |
| 2 | Copy admin Auth Token | Вставить в `.env`: `TINYBIRD_API_KEY=...` |
| 3 | Install Tinybird CLI and authenticate | `pip install tinybird-cli` (Python ≥ 3.8), `tb login`, вставить токен |
| 4 | Publish datasource and endpoints | В `packages/tinybird` выполнить `tb deploy` |
| 5 | Set up Tinybird API base URL | Из вывода `tb deploy` взять базовый URL тестового endpoint (например `https://api.us-east.tinybird.co`) и задать в `.env`: `TINYBIRD_API_URL=...` |

В инструкции предполагается **Classic** workspace и команда **`tb deploy`** (CLI `tinybird-cli`).

---

## Что у нас сделано

| # | Статус | Фактически |
|---|--------|------------|
| 1 | ✅ | Workspace в Tinybird есть (Forward) |
| 2 | ✅ | `TINYBIRD_API_KEY` в `apps/web/.env` задан |
| 3 | ⚠️ Отличие | У вас **Forward** workspace: нет `tb login`, используется переменная `TB_TOKEN`. Установлен Forward CLI (`pip install tinybird`) и выполнен деплой через него |
| 4 | ✅ | Датасорсы и пайпы задеплоены через **Forward**: `tb --cloud deployment create --wait --allow-destructive-operations` и `tb --cloud deployment promote` |
| 5 | ✅ | В `.env` задано: `TINYBIRD_API_URL=https://api.europe-west2.gcp.tinybird.co` (регион вашего воркспейса) |

Итого: по смыслу шаги 1, 2, 4 и 5 выполнены; шаг 3 отличается только способом аутентификации и типом CLI (Forward вместо Classic).

---

## Чего не хватает относительно инструкции

1. **Буквально по доку**  
   - Инструкция предполагает **Classic** и `tb login` + `tb deploy`.  
   - У вас **Forward**, поэтому мы использовали Forward CLI и `tb --cloud deployment create` / `promote`.  
   - Для вашего воркспейса этого достаточно: датасорсы и пайпы уже в облаке.

2. **Исправлено в коде**  
   - В `app/api/og/analytics/route.tsx` был захардкожен `https://api.us-east.tinybird.co`.  
   - Заменён на `process.env.TINYBIRD_API_URL`, чтобы self-host работал с вашим регионом (europe-west2).

3. **Опционально (скрипты)**  
   - В `apps/web/scripts/tinybird/` в нескольких скриптах для delete до сих пор используется `https://api.us-east.tinybird.co`.  
   - Для обычного запуска приложения это не обязательно; при желании можно заменить на `process.env.TINYBIRD_API_URL` для единообразия.

---

## Что нужно сделать вам (ничего критичного)

- **Ничего обязательного.**  
  Для self-host по документации Dub у вас уже есть:
  - Workspace,
  - токен в `TINYBIRD_API_KEY`,
  - задеплоенные датасорсы и пайпы (через Forward),
  - правильный `TINYBIRD_API_URL` в `.env`,
  - исправленный вызов Tinybird в OG analytics.

Дальнейшие шаги по инструкции — это уже **Step 3 (Upstash)**, **Step 4 (PlanetScale)** и т.д.

---

## Краткая шпаргалка по Tinybird (Forward)

Деплой в ваш Forward workspace (из корня репо):

```powershell
cd d:\Cursor_Projects\Dub\packages\tinybird
$lines = Get-Content "d:\Cursor_Projects\Dub\apps\web\.env"
$env:TB_TOKEN = ($lines | Where-Object { $_ -match '^TINYBIRD_API_KEY=' } -replace '^TINYBIRD_API_KEY=','')
$env:TB_HOST = "https://api.europe-west2.gcp.tinybird.co"
tb --cloud deployment create --wait
tb --cloud deployment promote
```

Подробнее: `packages/tinybird/TINYBIRD_FORWARD.md`.
