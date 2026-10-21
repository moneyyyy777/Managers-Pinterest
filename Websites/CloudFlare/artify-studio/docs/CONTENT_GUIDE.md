# 📖 Инструкция по управлению контентом Artify Studio

Настоящее руководство описывает процесс создания, редактирования, удаления и изменения порядка **Категорий (Разделов)**, **Подборок** и **Товаров** на платформе Artify Studio.

Вся система спроектирована так, что контент-менеджеру **не нужно править код компонентов**. Все изменения происходят через простые файлы конфигураций (`.json`) и списки ссылок (`.txt`).

---

## 🏛️ Иерархия контента сайта

Сайт имеет строгую 3-уровневую структуру:

```text
1. Главный Раздел (Категория)    →  https://artifystudio.com/fonts
   └── 2. Подборка (Collection)  →  https://artifystudio.com/fonts/bubble-fonts
       └── 3. Товар (Product)    →  Карточка с партнерской кнопкой на Creative Fabrica
```

---

## 1. Управление Главными Разделами (Категориями)

Все главные разделы сайта (`Fonts`, `Procreate Brushes`, `SVG Cut Files` и т.д.) управляются из единого файла:
👉 **`src/data/categories.json`**

### Пример содержимого файла:
```json
[
  {
    "id": "fonts",
    "title": "Fonts",
    "subtitle": "Best Fonts For Designers",
    "description": "Handpicked collections of bubble, luxury, vintage, retro and handwritten fonts for modern creators.",
    "image": "https://cdn.creativefabrica.com/2025/06/09/Big-Bubble-Fonts-123765552-1.png",
    "href": "/fonts",
    "count": "50+ Collections"
  },
  {
    "id": "procreate",
    "title": "Procreate Brushes",
    "subtitle": "Best Procreate Brushes & Stamps",
    "description": "Professional brushes, color palettes, stamps, and textures for digital artists and illustrators.",
    "image": "https://cdn.creativefabrica.com/2023/10/09/Daily-Bubble-Fonts-81168130-1.jpg",
    "href": "/procreate",
    "count": "30+ Collections"
  }
]
```

### ➕ Как добавить новый раздел (например, Canva или 3D):
1. Открой `src/data/categories.json` и добавь новый объект в массив:
   ```json
   {
     "id": "canva",
     "title": "Canva Templates",
     "subtitle": "Best Canva Templates For Creators",
     "description": "Instagram templates, presentation kits and social media banners.",
     "image": "https://ссылка-на-картинку-обложки.png",
     "href": "/canva",
     "count": "10+ Collections"
   }
   ```
2. Создай папку `content/canva/` для хранения подборок этого раздела.
3. **Результат:** Новый раздел автоматически появится на Главной странице, в шапке сайта (Header) и в подвале (Footer).

### ✏️ Как изменить описание, заголовок или обложку раздела:
Просто отредактируй текст в полях `"title"`, `"subtitle"`, `"description"` или `"image"` нужного блока в `src/data/categories.json`.

### 🔀 Как изменить порядок отображения разделов:
Переставь объекты внутри массива `categories.json` местами. Раздел, который идет первым в файле, будет первым на Главной странице и в Меню.

### 🗑️ Как удалить раздел:
Удали объект нужного раздела из `src/data/categories.json` и заархивируй/удали соответствующую папку из `content/`.

---

## 2. Управление Подборками (Collections)

Каждая подборка является **100% автономной**. Информация о ней хранится в её собственной папке:
👉 **`content/[категория]/[название-подборки]/`**

### Структура папки подборки:
```text
content/
└── fonts/
    └── bubble-fonts/                  <-- Папка подборки (slug)
        ├── info.json                  <-- Мета-данные (Название, описание, обложка)
        ├── links.txt                  <-- Файл ввода ссылок с Creative Fabrica
        ├── collection.json             <-- Авто-сгенерированный порядок слагов
        └── products/                  <-- Скачанные JSON-файлы товаров
            ├── smart-bubble.json
            └── disney-bubble.json
```

### ➕ Как добавить новую подборку (например, `luxury-fonts`):
1. Перейди в папку соответствующей категории (например, `content/fonts/`).
2. Создай новую папку с понятным слагом, например: `luxury-fonts`.
3. Внутри создай файл **`info.json`** с мета-данными:
   ```json
   {
     "title": "Luxury Fonts",
     "description": "Premium elegant serif and script fonts for branding, logos and wedding invitations.",
     "image": "https://cdn.creativefabrica.com/2025/01/09/Vintage-Charm-Fonts-113510035-1.png",
     "count": "75+ items"
   }
   ```
4. Внутри создай файл **`links.txt`** и вставь туда ссылки на товары (каждая с новой строки).
5. Запусти синхронизацию (см. Раздел 3).
6. **Результат:** Подборка автоматически появится в каталоге `/fonts` и создаст собственную страницу `/fonts/luxury-fonts`!

### 🔀 Как изменить порядок подборок внутри раздела:
Чтобы сделать определенную подборку первой в списке (например, вывести `luxury-fonts` на 1 место), создай файл:
👉 **`content/fonts/order.json`**

```json
{
  "order": [
    "luxury-fonts",
    "bubble-fonts"
  ]
}
```
*Подборки отобразятся на странице каталога строго в указанной последовательности.*

---

## 3. Управление Товарами внутри Подборки

Управление товарами происходит **исключительно через файл `links.txt`**:
👉 **`content/[категория]/[подборка]/links.txt`**

### Пример файла `links.txt`:
```text
https://www.creativefabrica.com/product/smart-bubble/
https://www.creativefabrica.com/product/disney-bubble/
https://www.creativefabrica.com/product/daily-bubble/
```

### 🔄 Команда синхронизации и парсинга:
После любых изменений в `links.txt` выполни в терминале:

```bash
node scripts/creative-fabrica/sync-collection.js
```

1. Скрипт попросит выбрать **Категорию** (цифрой).
2. Скрипт попросит выбрать **Подборку** (цифрой).
3. Парсер автоматически:
   * Скачает новые товары в качестве HD.
   * Очистит технический мусор и таблицы символов.
   * Извлечет авторов, оригинальные описания и даты.
   * Сформирует партнерские ссылки вида `.../ref/8122976/?campaign=artifystudio-[category]-[collection]`.

### 🔀 Как поменять порядок товаров в подборке:
1. Открой `links.txt`.
2. Поменяй строки ссылок местами.
3. Запусти `node scripts/creative-fabrica/sync-collection.js`.
4. **Результат:** Парсер определит смену порядка и за **0.01 секунды** обновит порядок на сайте без повторного скачивания товаров.

### 🗑️ Как удалить товар из подборки:
1. Удали строку ссылки из `links.txt`.
2. Запусти `node scripts/creative-fabrica/sync-collection.js`.
3. Скрипт задаст один вопрос:
   > *Из links.txt пропали товары. Что сделать со ВСЕМИ пропавшими товарами?*
   > *[1] Убрать только из подборки (сохранить JSON)*
   > *[2] Полностью удалить их JSON-файлы*
4. Нажми `1` (по умолчанию) или `2`.

---

## ⚡ Экспресс-Чеклист Рабочего Процесса Контент-Менеджера

| Задача | Что открыть / изменить? | Что запустить? |
| :--- | :--- | :--- |
| **Добавить новый Раздел** | Добавить объект в `src/data/categories.json` + создать папку в `content/` | — |
| **Создать подборку** | Создать папку `content/[cat]/[sub]/` + добавить `info.json` + `links.txt` | `node scripts/creative-fabrica/sync-collection.js` |
| **Поменять порядок подборок** | Отредактировать массив в `content/[cat]/order.json` | — |
| **Добавить товары** | Вставить новые ссылки в `content/[cat]/[sub]/links.txt` | `node scripts/creative-fabrica/sync-collection.js` |
| **Поменять порядок товаров** | Переставить строки в `links.txt` | `node scripts/creative-fabrica/sync-collection.js` |