# Tinybird Forward — работа с вашим воркспейсом

## Итог: с Forward работать можно

Ваш воркспейс **Tinybird Forward**, а не Classic. Проект Dub из коробки рассчитан на Classic (`tb deploy` из пакета `tinybird-cli`), но **тот же набор файлов (.datasource, .pipe) совместим с Forward**.

### Что уже сделано

1. Установлен **Forward CLI**: `pip install tinybird`.
2. Деплой в Forward выполнен:
   - `tb --cloud deployment create --wait --allow-destructive-operations`
   - Деплой отправлен в облако (Workspace `indifox6_workspace`, регион `europe-west2`).
3. В `apps/web/.env` указано:
   - `TINYBIRD_API_KEY` — ваш токен
   - `TINYBIRD_API_URL=https://api.europe-west2.gcp.tinybird.co`

### Разница Forward и Classic (кратко)

| | Classic | Forward |
|---|--------|--------|
| CLI | `tinybird-cli` → `tb deploy` | `tinybird` → `tb --cloud deployment create` + `tb --cloud deployment promote` |
| Деплой | Один шаг | Staging → Promote |
| Формат файлов | .datasource, .pipe | Тот же + в .pipe для HTTP нужен `TYPE endpoint` |
| Разработка | В UI или локально | Локально (Tinybird Local опционально) |

Подробнее: [Migrate from Tinybird Classic](https://www.tinybird.co/docs/forward/get-started/migrate), [Forward CLI deploy](https://www.tinybird.co/docs/forward/test-and-deploy/deployments/cli).

### Что может понадобиться для аналитики Dub

В Forward пайп становится **HTTP-эндпоинтом**, только если в конце .pipe указано `TYPE endpoint` (или `TYPE ENDPOINT`). В текущих пайпах Dub этого нет (есть только `TYPE materialized` у части пайпов). Поэтому:

- **Датасорсы и пайпы** в Forward уже созданы деплоем.
- Список **эндпоинтов** (`tb --cloud endpoint ls`) может быть пустым, пока у нужных пайпов не добавлен `TYPE endpoint`.

Если приложение Dub вызывает конкретные пайпы по HTTP (например, `v4_count`, `v4_timeseries` и т.д.), этим пайпам нужно в конец файла добавить строку:

```text
TYPE endpoint
```

После правок — снова выполнить деплой и promote:

```powershell
cd d:\Cursor_Projects\Dub\packages\tinybird
$env:TB_TOKEN = "ваш_токен"
$env:TB_HOST = "https://api.europe-west2.gcp.tinybird.co"
tb --cloud deployment create --wait
tb --cloud deployment promote
```

### Команды для следующих деплоев

```powershell
cd d:\Cursor_Projects\Dub\packages\tinybird
$lines = Get-Content "d:\Cursor_Projects\Dub\apps\web\.env"
$env:TB_TOKEN = ($lines | Where-Object { $_ -match '^TINYBIRD_API_KEY=' } -replace '^TINYBIRD_API_KEY=','')
$env:TB_HOST = "https://api.europe-west2.gcp.tinybird.co"
tb --cloud deployment create --wait
tb --cloud deployment promote
```

Или одной командой (алиас): `tb --cloud deploy` — если ваша версия CLI его поддерживает.

---

**Вывод:** с Forward работать можно, сильной разницы в формате данных и файлов нет. Основные отличия — команды деплоя и необходимость явно помечать пайпы как `TYPE endpoint` для HTTP. Текущий деплой уже создал датасорсы и пайпы в вашем воркспейсе; при необходимости добавьте `TYPE endpoint` в те пайпы, которые Dub вызывает как API.
