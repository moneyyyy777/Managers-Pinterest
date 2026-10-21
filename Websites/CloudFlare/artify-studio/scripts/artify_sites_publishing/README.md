# 🚀 Artify Publishing System & Orchestrator

## 📖 Обзор Архитектуры

**Artify Publishing System** — это модульный отказоустойчивый комбайн (State Machine) для автоматизации многоуровневой PBN-сети (Private Blog Network), предназначенный для генерации и безопасного перенаправления Pinterest-трафика на партнерскую платформу **Creative Fabrica**.

### 🔗 Трафиковая цепочка (Traffic Pipeline):
```
[Pinterest Пин с тегами]
       ↓ (Ссылка на редактирование в Link_Site.txt)
[Google Site Прокладка (Траст)]
       ↓ (Встроенный Iframe 1800px)
[Cloudflare Pages HTML с Капчей (Защита)]
       ↓ (Клик по "I'm not a robot")
[Главный сайт Artify Studio] (https://artify-studio.pages.dev/...)
       ↓ (Клик по кнопке "Free for Download")
[Creative Fabrica] (Партнерская ссылка ?campaign=artifystudio-[cat]-[col])
```

---

## 🗂️ Структура файлов и папок (`artify_sites_publishing`)

```text
scripts/artify_sites_publishing/
├── orchestrator.js              # 🧠 Главный мозг: диспетчер очередей и глубокий аудит
├── config.js                    # ⚙️ Глобальная конфигурация (пути, домены, пулы аккаунтов)
├── tasks.txt                    # 📋 Очередь входящих задач (пути к папкам тегов)
├── done_tasks.txt               # ✅ Архив 100% завершенных задач
│
├── templates/
│   └── captcha_template.html    # 📄 Шаблон HTML-страницы с reCAPTCHA и редиректом
│
└── modules/
    ├── 1_html_builder.js        # ☁️ Модуль 1: Сборка index.html и деплой на Cloudflare Pages
    ├── 2_analytics.js           # 📊 Модуль 2: Google Analytics 4 API + синхронизация правил
    ├── 3_google_sites.js        # 🤖 Модуль 3: Playwright-робот Google Sites (через CDP 9222)
    ├── 3_1_resizeEmbedBlock.js  # 📐 Движок пошагового растягивания (Burst Resize) до 1800px
    ├── 4_database.js            # 💾 Модуль 4: Балансировщик мульти-аккаунтов (JSON ↔ TXT)
    ├── 5_file_manager.js        # 📁 Модуль 5: Перенос папок в ALL FOLDERS и переименование
    └── migrate_to_json.js       # 🔄 Утилита: Одноразовая миграция старой базы из TXT в JSON
```

---

## 🔄 Пошаговый жизненный цикл задачи (5 Этапов)

Оркестратор читает пути из `tasks.txt` (например, `Managers Pinterest/Keywords/Artify Studio/Cliparts/Watercolor`) и выполняет следующие шаги:

```text
[Путь из tasks.txt] 
  → 1. Проверка linksite.txt & Авто-детектор имени ("Watercolor Cliparts")
  → 2. Предварительная проверка наличия logo.png (с подтверждением)
  → 3. Идемпотентный аудит (пропуск уже выполненных этапов)
  → 4. [ЭТАП 1] Сборка HTML + Wrangler Pages Deploy
  → 5. [ЭТАП 2] Запрос/Поиск GA4 G-кода + запись в analytics_g_rules.json
  → 6. [ЭТАП 3] Клонирование шаблона G-Site → Вставка Embed → Burst Resize → 
                 Переименование страницы → Загрузка Favicon → Расшаривание на 10 Gmail → 
                 Публикация (слаг <= 30 симв.) → Вставка G-кода → Очистка холста
  → 7. [ЭТАП 4] Запись связки в cloudflare_accounts.json и Cloudflare accounts.txt
  → 8. [ЭТАП 5] Проверка наличия папок 1, 2, 3... → Упаковка в ALL FOLDERS
  → 9. Перенос задачи из tasks.txt в done_tasks.txt
```

---

## 🧩 Подробное описание каждого модуля

### 1. `orchestrator.js` (Главный диспетчер)
* **Идемпотентность (Idempotency):** Проверяет состояние в базе данных. Если задача прервалась на середине, скрипт продолжит ровно с недостающего шага, не переделывая уже созданные сайты.
* **Детектор порядка слов (`determineTrueThematicName`):** Анализирует подпапки в исходнике и точно определяет порядок слов для интеграции с внешними Python-скриптами (`Watercolor Cliparts` vs `Fonts Luxury`).
* **Предварительная проверка логотипа:** Сканирует директории снизу вверх до папки `Keywords`. Если логотипа нет — останавливается и запрашивает подтверждение менеджера.
* **Умный пропуск переноса:** Если в папке еще нет номерных подпапок с тегами (`1...`, `2...`), Оркестратор создает все сайты и ссылки, сохраняет их в базу и мягко пропускает упаковку в `ALL FOLDERS`.

### 2. `config.js` (Конфигурация)
* **100% Кроссплатформенность:** Автоматически вычисляет пути относительно `PROJECT_ROOT` без привязки к жестким путям `/Users/...` или `C:\...`.
* **Пул аккаунтов Cloudflare:** Ведет массив аккаунтов с лимитом по 150 сайтов на каждый (`kalifornia.lover7@...`, `lover8@...` и т.д.).
* **Пул аккаунтов Google:** Хранит список из 10 Gmail-аккаунтов для автоматического расшаривания прав доступа к Google Sites.

### 3. `1_html_builder.js` (Cloudflare Pages Deployer)
* Создает структуру `!Creative Fabrica HTMLs/[Раздел]/[Тематика]/Redirect cpatcha/index.html`.
* Заменяет метку `{{REDIRECT_URL}}` на целевую ссылку подборки.
* **Управление коллизиями имен:** Автоматически перебирает бренд-суффиксы (`artifystudio`, `artifystudioo`, `artifystudio333`, `artifystudio777`, `artifystudio1`, `artifystudio7`).
* **Фильтрация ошибок:** Запускает Wrangler напрямую внутри целевой папки (`cwd: folderPath`), устраняя сбои 500 из-за спецсимволов `!` и пробелов.
* **Парсер реального URL:** Извлекает боевой URL из консольного вывода Wrangler, отрезая временные хэши сборки (`49231bc9.`).

### 4. `2_analytics.js` (Google Analytics 4 API)
* **Двухуровневый поиск G-кода:**
  1. Сначала ищет существующий код в файле `analytics_g_rules.json`. Если код есть — берет его и **не тратит квоту Google API**.
  2. Если кода нет — обращается к Google Analytics Admin API через ключ `google-key.json`.
* Создает ресурс по строгому шаблону: `Artify to [Thematic] | Google Site - Artify Studios (WL)`.
* Создает Web Data Stream под реальный URL сайта.
* Автоматически вносит новую строчку в `analytics_g_rules.json`.

### 5. `3_google_sites.js` & `3_1_resizeEmbedBlock.js` (Playwright Автоматизация)
* **Подключение к живому браузеру:** Подключается через CDP (`http://127.0.0.1:9222`), используя авторизованный профиль пользователя (обход антибот-защиты Google).
* **Клонирование шаблона:** Открывает `GOOGLE_SITE_TEMPLATE_URL` → меню «Дополнительно» → «Создать копию» → перехватывает открытие новой вкладки.
* **Встраивание (Embed):** Кликает «Встроить» (`aria-label="Встроить"` с `force: true`) → вводит URL Cloudflare → подтверждает вставку.
* **Движок Burst Resize (`3_1_resizeEmbedBlock.js`):** Преодолевает лимит Google Sites на рост за один жест. Тянет нижнюю ручку серией коротких burst-циклов (по 200px) с перезахватом координат до достижения высоты **~1800-1950px**.
* **Переименование страницы:** Открывает меню активной страницы через троеточие (`aria-selected="true"`) → «Открыть параметры» → вводит имя тематики.
* **Расшаривание прав:** Вводит 10 email-адресов через `pressSequentially` с эмуляцией клавиши `Enter` (чипы) → снимает галочку «Уведомить пользователей» через `Tab + Space` → подтверждает доступ.
* **Установка Favicon:** Ищет `logo.png/jpg` снизу вверх до `Keywords` → нажимает вторую кнопку «Загрузить» через перехват нативного диалога `waitForEvent('filechooser')`.
* **Публикация со слагом $\le 30$ символов:**
  * Генерирует слаг вида `[база]-to-artify`.
  * Если длина превышает 30 символов — автоматически подрезает базовую часть, сохраняя постфикс.
  * Если слаг занят — автоматически перебирает цифры `1..9` и `10..99`.
* **Вставка G-кода:** Открывает Настройки → Аналитика → вставляет полученный `G-XXXXXXXX` → закрывает модалку.
* **Очистка холста:** Перезагружает страницу → находит `input[aria-label="Название сайта"]` на холсте → стирает весь текст через `clickCount: 3`, `.fill('')` и серию `Backspace` (делает холст кристально чистым).

### 6. `4_database.js` (Мульти-Аккаунтная База Данных)
* **State Machine:** Сохраняет состояние каждого этапа в `cloudflare_accounts.json`.
* **Балансировщик 150 сайтов:** Считает количество сайтов на каждом аккаунте Cloudflare. При достижении 150 сайтов переключает учет на следующий аккаунт из пула `CONFIG.CLOUDFLARE_ACCOUNTS`.
* **Генератор отчетов:** Автоматически формирует и обновляет человекочитаемый `Cloudflare accounts.txt`, группируя сайты по блокам аккаунтов и категориям.

### 7. `5_file_manager.js` (Менеджер папок ALL FOLDERS)
* **Рекурсивный сканер:** Находит группы тегов на любой глубине вложенности (`os.walk` аналог).
* **Проверка существующих:** Проверяет наличие папки в `ALL FOLDERS` и запрашивает подтверждение на перезапись.
* **Упаковка:** Копирует номерные папки `1...`, `2...` в `ALL FOLDERS/[Раздел]/[Ниша]/...`.
* **Брендинг:** Переименовывает папки и `.xlsx` файлы в формат: `[Название] Cloudflare WL [ДДММГГ]`.
* **Запись ссылки:** Создает `For Main/Link_Site.txt` со ссылкой на редактирование Google Site строго внутри скопированной папки в `ALL FOLDERS`.

---

## 🛠️ Настройка и Первый запуск (Runbook)

### 1. Подготовка окружения
Убедись, что установлены зависимости:
```bash
npm install playwright-core @google-analytics/admin
```

### 2. Запуск браузера Chromium на Mac
Запусти Chromium в режиме удаленной отладки:
```bash
/Applications/Chromium.app/Contents/MacOS/Chromium --remote-debugging-port=9222
```
*(Войди в свой Google-аккаунт в открывшемся окне браузера).*

### 3. Авторизация Cloudflare Wrangler
```bash
npx wrangler login
```

### 4. Добавление задачи в очередь
Открой `scripts/artify_sites_publishing/tasks.txt` и вставь путь к папке с тегами (каждая задача с новой строки):
```text
Managers Pinterest/Keywords/Artify Studio/Cliparts/Watercolor
```

### 5. Запуск Оркестратора
```bash
node scripts/artify_sites_publishing/orchestrator.js
```

---

## 📊 Формат хранения данных

### Структура `cloudflare_accounts.json` (Machine-readable):
```json
{
  "Watercolor Cliparts": {
    "accountEmail": "kalifornia.lover7@gmail.com",
    "section": "cliparts",
    "gCode": "G-WWSK51T5BB",
    "cfUrl": "https://watercolorcliparts-artifystudio.pages.dev",
    "mainUrl": "https://artify-studio.pages.dev/cliparts/watercolor/",
    "gSitePublic": "https://sites.google.com/view/watercolor-clipar-to-artify-2",
    "gSiteEdit": "https://sites.google.com/d/10YL5V4GsA.../p/1augnMPL9.../edit"
  }
}
```

### Структура `Cloudflare accounts.txt` (Human-readable):
```text
kalifornialover6@gmail.com - ARTIFY STUDIO -  https://artify-studio.pages.dev/

kalifornia.lover7@gmail.com 150 HTMLs Cloudflare Pages:

Cliparts
Watercolor Cliparts (G-WWSK51T5BB) - https://watercolorcliparts-artifystudio.pages.dev - https://artify-studio.pages.dev/cliparts/watercolor/ - https://sites.google.com/view/watercolor-clipar-to-artify-2 - https://sites.google.com/d/10YL5V4GsA.../p/1augnMPL9.../edit
```