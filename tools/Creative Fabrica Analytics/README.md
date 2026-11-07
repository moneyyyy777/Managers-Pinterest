# 📊 Creative Fabrica Analytics & Automation

Кроссплатформенный (macOS & Windows) инструмент для сбора статистики и аналитики с Creative Fabrica с постоянным профилем авторизации (Persistent Profile) и автоматической синхронизацией через Git.

---

## 🚀 Быстрый старт

### 1. Установка зависимостей
Перейдите в директорию утилиты и установите пакеты:

```bash
cd "tools/Creative Fabrica Analytics"
npm install
npx playwright install chromium
```

---

### 2. Шаг 1: Авторизация (`--auth`)
Запустите интерактивный режим входа:

**На macOS:**
```bash
npm run auth
# или:
./scripts/auth.sh
```

**На Windows:**
```cmd
npm run auth
:: или дважды кликните:
scripts\auth.bat
```

> **Что произойдет:**
> - Откроется видимое окно браузера (`headless: false`) на странице входа Creative Fabrica.
> - Войдите в свой аккаунт руками (введите логин/пароль, пройдите 2FA или капчу).
> - Скрипт автоматически зафиксирует вход (или вы можете нажать `[ENTER]` в терминале).
> - Сессия сохранится навсегда в локальной папке `.browser_profile` (папка изолирована и находится в `.gitignore`).

---

### 3. Шаг 2: Сбор статистики (`--stats`)
После авторизации собирать данные можно одной командой:

```bash
# В видимом окне (по умолчанию):
npm run stats

# В фоновом режиме (когда захотите отключить окно):
npm run stats:headless

# Сбор статистики + автоматический git commit & push в GitHub:
npm run sync
```

---

### 4. Автоматическая синхронизация между ПК (Windows) и Mac
1. **На машине, где собирается статистика (например, Windows по расписанию):**
   - Запускается `scripts\sync.bat` (или cron/планировщик задач Windows Task Scheduler).
   - Скрипт собирает данные в `data/reports/` и делает `git commit` + `git push`.
2. **На macOS (где вы хотите видеть данные):**
   - Просто запускаете `git pull` (или `./pull.sh` в корне проекта).
   - Все свежие отчеты `stats-YYYY-MM-DD.json`, `latest.json` и `history.csv` обновляются локально.

---

### 📁 Структура сохраненных данных
- `data/reports/latest.json` — актуальный снимок последних метрик.
- `data/reports/stats-YYYY-MM-DD.json` — посуточный архив.
- `data/reports/history.csv` — сводная таблица для удобного открытия в Excel / Numbers.
- `data/screenshots/` — контрольные скриншоты страницы дашборда для аудита.
