# 🚀 Руководство: Как запустить Оркестратор (artify_sites_publishing)

Это пошаговая инструкция по запуску автоматизированного конвейера, который создает PBN-сетку (Cloudflare + Google Sites), настраивает аналитику и готовит папки для публикации в Pinterest.

## Шаг 1: Подготовка (Логотип и Структура)
Убедись, что в папке, которую ты собираешься автоматизировать (например, `Keywords/Artify Studio/Christmas/Bundles/Bundles Christmas`), есть:
1. **Файл логотипа:** `logo.png` (или `.jpg`). Без него скрипт остановится и попросит его добавить, так как он нужен для создания Favicon на сайте Google Sites.
2. **Номерные папки:** Убедись, что внутри лежат твои папки интентов (1, 2, 3...) с Excel-файлами, если ты хочешь, чтобы скрипт автоматически перенес их в `ALL FOLDERS` (Модуль 5).

## Шаг 2: Добавление задач в `tasks.txt`
1. Открой файл `tasks.txt` в директории оркестратора.
2. Вставь пути к нужным папкам (относительно корня `Managers Pinterest`). Каждая папка — строго с новой строки.

**Пример правильного заполнения `tasks.txt`:**
```text
Keywords/Artify Studio/Christmas/Bundles/Bundles Christmas
Keywords/Artify Studio/Christmas/Bundles/Bundles Christmas Planners
Keywords/Artify Studio/Christmas/Bundles/Bundles Christmas Sublimation
```

## Шаг 3: Открытие терминала
Оркестратор нужно запускать строго из его собственной директории. Открой терминал и введи:
```bash
node scripts/artify_sites_publishing/orchestrator.js
```

## Шаг 4: Запуск Оркестратора
Выполни команду:
```bash
node orchestrator.js
```

## Шаг 5: Процесс работы (Что происходит под капотом)
После запуска тебе не нужно ничего нажимать, скрипт всё сделает сам:
1. **Cloudflare:** Сгенерирует HTML (скопирует его в `_HTMLs for Publish/Artify-Studio`) и задеплоит страницу.
2. **Google Sites:** Откроет Chrome через Playwright, клонирует шаблон, встроит iframe с Cloudflare, растянет его и подключит Google Analytics (GA4).
3. **File Manager:** Запишет сгенерированные ссылки (`Link_Site.txt`) в твои номерные папки и перенесет их в `ALL FOLDERS` с правильным неймингом (с WL суффиксами и датами).
4. **Очистка:** Выполненные задачи скрипт сам перенесет из `tasks.txt` в `done_tasks.txt`.
