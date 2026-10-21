# 🎄 Christmas Bundles — Final Report

В этом отчете зафиксирована логика создания структуры папок и кластеризации тегов (Промпты 3.2 и 5.5) для всех 7 подниш ниши **Christmas Bundles**.

---

## 1. Christmas Journaling
**Логика:** Разделение по типам ведения дневников и материалам.
1. **Bullet Journal** — Оформление разворотов, обложки, календари, трекеры и дудлы.
2. **Junk Journal** — Эстетика Junk Journaling, кармашки, тэги, винтаж, гранж и распечатки (ephemera).
3. **Scrapbook** — Идеи и готовые макеты (layouts) для скрапбукинга, собирание воспоминаний.
4. **Stickers** — Цифровые и печатные наклейки (для GoodNotes, iPad-планеров).
5. **Die Cuts and Papercrafts** — Вырубки, бумажный крафт, карточки, поделки.

---

## 2. Bundles Christmas (Общая)
**Логика:** Глобальное разделение по широким форматам дизайна.
1. **Clipart Graphics** — Векторы, иллюстрации, PNG бандлы для дизайн-проектов.
2. **Packaging Design** — Идеи, шаблоны и мокапы для упаковки новогодних подарков, подарочная бумага.
3. **Crafting Kits** — Наборы и схемы для шитья, вышивки и квилтинга (физический крафт).
4. **Backgrounds Assets** — Фоны (в т.ч. iPhone), текстуры и 3D-ассеты для оформления постов и обоев.
5. **Sets Collections** — Готовые сеты, бесшовные паттерны и коллекции для масштабных проектов.

---

## 3. Christmas SVG
**Логика:** Разделение по типу плоттерной резки и финальному продукту.
1. **Cricut And Vinyl** — Проекты для плоттеров (Cricut/Silhouette), создание принтов на одежде и наклеек.
2. **SVG And Clipart** — Поиск цифровых исходников, векторов, иллюстраций (дизайнерский запрос).
3. **DIY And Crafts** — Идеи для поделок своими руками, подарки ручной работы, детские крафты.
4. **Ornaments And Decor** — Рождественский декор, 3D-украшения, новогодние игрушки для дома/двора.
5. **Tags And Cards** — Дизайн открыток, подарочные бирки, приглашения.

---

## 4. Christmas Clipart
**Логика:** Классификация по визуальным объектам (персонажи, природа, предметы).
1. **Characters** — Снеговики, Санта, Эльфы, Олени, Щелкунчики, Пингвины.
2. **Vintage** — Винтажный и ретро-стиль, старая школа.
3. **Objects** — Предметы: венки, леденцы, гирлянды, игрушки, свитера, кружки, новогодний декор.
4. **Nature** — Зимняя природа: деревья, снег, цветы, омела, дома, пейзажи.
5. **Craft** — Материалы для крафта: открытки, паттерны, рамки, шаблоны, принты.

---

## 5. Christmas Fonts
**Логика:** Разделение по визуальному стилю типографики.
1. **Cursive and Calligraphy** — Рукописные, каллиграфические и курсивные шрифты (для открыток, писем).
2. **Cute and Fun** — Забавные, милые шрифты (candy cane, ugly sweater, doodle) для детских проектов.
3. **Vintage and Retro** — Ретро-эстетика, винтажные и готические шрифты (60s, 80s, викторианский стиль).
4. **Typography and Design** — Стильные запросы для профессионального дизайна (bold, 3d, modern), логотипы.

---

## 6. Christmas Sublimation
**Логика:** Разделение по типу принта (одежда, кружки) и специфическим трендам.
1. **Ugly Sweater** — Дизайны для "уродливых рождественских свитеров" (узоры, текстуры).
2. **T-Shirt Designs** — Принты для футболок, худи и пижам.
3. **Retro Coquette PNG** — Трендовые стили (розовое Рождество, эстетика кокетки с бантиками, ретро-Санта).
4. **Sublimation Crafts** — Шаблоны для сублимации на кружках, тумблерах, орнаментах.
5. **Family Teacher Shirts** — Семейные и профессиональные принты (для пар, учителей, первое Рождество).

---

## 7. Christmas Planners
**Логика:** Разделение по формату планера (цифра/печать) и цели планирования.
1. **Digital Planners** — Цифровые планеры для iPad и Goodnotes.
2. **Printable Planners** — Распечатываемые материалы, списки подарков, шаблоны бюджетов.
3. **Stickers and Washi** — Визуальный декор: наклейки и скотч для планеров.
4. **Winter Planners** — Зимняя уютная эстетика и общие сезонные планы.
5. **Holiday Events** — Организация праздников, вечеринок и путешествий.

---

## 8. Генерация Excel-контента (Промпт 6) — Bundles Christmas SVG
### 1 Bundles Christmas SVG Filter by OpenAI
- **Тип стратегии:** Общий (Filter by OpenAI / Все рождественские темы SVG: плоттерная резка, Cricut, Silhouette, винил, деревянные вывески, орнаменты, открытки, бирки, праздничный крафт).
- **Доска:** `Christmas Svg Bundle` (Boards_Tags.txt: 4238 тегов).
- **Стоп-слова из соседних подниш:**
  - *Fonts:* `font`, `fonts`, `typography`, `lettering`, `calligraphy`, `typeface`, `cursive`, `script font`
  - *Planners:* `planner`, `planners`, `planning`, `goodnotes`, `tracker`, `budget`, `agenda`, `calendar`
  - *Journaling:* `journal`, `journaling`, `junk journal`, `bujo`, `bullet journal`, `scrapbook`, `scrapbooking`, `ephemera`
  - *Sublimation:* `sublimation`, `sublimate`, `tumbler wrap`, `mug wrap`
  - *Clipart:* `clipart`, `cliparts`, `watercolor`, `png bundle`
  - *Маркетплейсы-конкуренты:* `Etsy`, `Creative Fabrica`, `Design Bundles`, `Font Bundles`, `Creative Market`
- **Правило визуального стиля:** Поскольку это общий файл с 4238 разнородными тегами, формулировки подобраны максимально универсальными для праздничного плоттерного и лазерного крафта ("Christmas SVG cut files", "holiday vector designs", "versatile cutting files", "precision cut files"). Никаких искусственных ограничений по стилю (акварель, бохо) не навязывалось, что гарантирует 100% соответствие любой скрапленной картинке.
- **Сгенерировано:** Ровно 100 уникальных строк (Title, Description, CTA) нейросетью без использования скриптов. В CTA содержится акцент на слово "FREE", тип продукта капитализирован (SVG, Cut Files, SVG Bundle), названия стороннего софта исключены.
- **Файл результата:** `Keywords/Artify Studio/Christmas/Bundles/Bundles Christmas SVG/1 Bundles Christmas SVG Filter by OpenAI/Generated_Excel_Content.md`.

### 2 Bundles Christmas SVG Intent SVG And Clipart
- **Интент:** SVG & Clipart (рождественские векторные макеты, клипарты, цифровые иллюстрации и графические элементы для крафта и резки).
- **Стоп-слова из соседних подниш:**
  - *Fonts:* `font`, `fonts`, `typography`, `lettering`, `calligraphy`
  - *Planners:* `planner`, `planners`, `planning`, `goodnotes`, `tracker`
  - *Journaling:* `journal`, `journaling`, `junk journal`, `scrapbook`
  - *Sublimation:* `sublimation`, `tumbler`, `mug wrap`
  - *Стили (визуальное правило):* исключены узкие стили (`watercolor`, `boho`) во избежание сужения охвата для скрапленных пинов.
- **Сгенерированный контент:** Сгенерировано ровно 100 уникальных строк (Title, Description, CTA) нейросетью без использования скриптов.
- **Файл результата:** `Keywords/Artify Studio/Christmas/Bundles/Bundles Christmas SVG/2 Bundles Christmas SVG Intent SVG And Clipart/Generated_Excel_Content.md`

### Bundles Christmas SVG / 4 Bundles Christmas SVG Intent Ornaments And Decor
- **Тип стратегии:** Интент (Ornaments & Decor / Рождественские украшения, деревни, праздничный декор).
- **Доска:** `Diy Christmas Village` (Boards_Tags.txt: 739 тегов).
- **Стоп-слова:** Исключены ключевые слова соседних подниш: `font`, `fonts`, `typeface`, `calligraphy`, `cursive`, `lettering` (Fonts), `planner`, `goodnotes`, `tracker`, `budget` (Planners), `sublimation`, `sublimate`, `tumbler wrap`, `mug wrap` (Sublimation), `journal`, `junk journal`, `scrapbook`, `ephemera` (Journaling), `clipart`, `watercolor` (Clipart / Visual Style Rule).
- **Правило визуального стиля:** Теги разнородны по технике (акрил, лазер, 3D бумага, винил, дерево), поэтому стиль зафиксирован нейтральным ("vector cut files", "holiday SVG", "precision cut designs"), без навязывания "watercolor" или узких стилей.
- **Сгенерировано:** Ровно 100 уникальных строк (Title, Description, CTA) силами нейросети без использования скриптов.
- **Файл результата:** `Keywords/Artify Studio/Christmas/Bundles/Bundles Christmas SVG/4 Bundles Christmas SVG Intent Ornaments And Decor/Generated_Excel_Content.md`.

### Bundles Christmas SVG / 5 Bundles Christmas SVG Intent Tags And Cards
- **Тип стратегии:** Интент (Tags & Cards / Подарочные бирки, рождественские открытки, поп-ап открытки, ярлыки, рассадочные карточки).
- **Доска:** `Diy Christmas Cards Ideas` (Boards_Tags.txt: 645 тегов).
- **Стоп-слова:** Исключены ключевые слова соседних подниш: `font`, `fonts`, `typeface`, `calligraphy`, `cursive`, `lettering`, `typography` (Fonts), `planner`, `planners`, `goodnotes`, `tracker`, `budget`, `calendar`, `planning` (Planners), `sublimation`, `sublimate`, `tumbler wrap`, `mug wrap`, `ugly sweater` (Sublimation), `journal`, `journaling`, `junk journal`, `scrapbook`, `scrapbooking`, `bullet journal`, `ephemera`, `washi` (Journaling), `clipart`, `cliparts` (Clipart), а также узкие стили `watercolor`, `boho` (Visual Style Rule).
- **Правило визуального стиля:** Фиксация на нейтральных терминах плоттерной и лазерной резки/бумажного крафта ("SVG cut files", "card cut templates", "gift tag vector designs", "papercraft cut files") без навязывания узких художественных стилей (акварель, бохо).
- **Сгенерировано:** Ровно 100 уникальных строк (Title, Description, CTA) силами нейросети без использования кода и скриптов. В ~75% CTA содержится акцент на слово "FREE".
- **Файл результата:** `Keywords/Artify Studio/Christmas/Bundles/Bundles Christmas SVG/5 Bundles Christmas SVG Intent Tags And Cards/Generated_Excel_Content.md`.

---

## 9. Генерация Excel-контента (Промпт 6) — Bundles Christmas Clipart
### 1 Bundles Christmas Clipart Intent Characters
- **Тип стратегии:** Интент (Characters / Рождественские персонажи: снеговики, Санта, олени, щелкунчики, пряничные фигурки, эльфы, ангелы, пингвины).
- **Доска:** `Christmas Clipart Snowman` (Boards_Tags.txt: 457 тегов).
- **Стоп-слова из соседних подниш:**
  - *Fonts:* `font`, `fonts`, `typography`, `lettering`, `calligraphy`, `typeface`, `cursive`
  - *Planners:* `planner`, `planners`, `planning`, `goodnotes`, `tracker`, `budget`
  - *Journaling:* `journal`, `journaling`, `junk journal`, `scrapbook`, `scrapbooking`, `ephemera`
  - *SVG:* `svg`, `cricut`, `silhouette`, `cut file`, `cut files`
  - *Sublimation:* `sublimation`, `sublimate`, `tumbler`, `mug wrap`
- **Правило визуального стиля:** Теги содержат разнообразные стили (outline, cute, vintage, pastel, kawaii, png). Чтобы гарантировать 100% совпадение с любым скрапленным пином, зафиксирована универсальная и нейтральная формулировка цифрового клипарта и PNG-графики высокого разрешения ("digital clipart", "high-resolution PNG graphics", "festive illustrations", "holiday character designs") без навязывания единого стиля ("watercolor" или "vector only").
- **Сгенерировано:** Ровно 100 уникальных строк (Title, Description, CTA) силами нейросети без использования кода и скриптов. 100% CTA содержат акцент на слово "FREE" и корректную капитализацию типа товара (Clipart, Graphics, PNG Bundle).
- **Файл результата:** `Keywords/Artify Studio/Christmas/Bundles/Bundles Christmas Clipart/1 Bundles Christmas Clipart Intent Characters/Generated_Excel_Content.md`.

### 2 Bundles Christmas Clipart Intent Vintage
- **Тип стратегии:** Интент (Vintage / Ретро-клипарты, старинные рождественские иллюстрации, принты, классическая праздничная графика).
- **Доска:** `Christmas Clipart Retro` (Boards_Tags.txt: 105 тегов).
- **Стоп-слова:** Исключены ключевые слова соседних подниш: `font`, `fonts`, `typeface`, `calligraphy`, `cursive`, `lettering`, `typography` (Fonts), `planner`, `planners`, `goodnotes`, `tracker`, `budget`, `planning` (Planners), `sublimation`, `sublimate`, `tumbler wrap`, `mug wrap` (Sublimation), `journal`, `junk journal`, `scrapbook`, `ephemera`, `bujo` (Journaling), `svg`, `cricut`, `silhouette`, `cut file` (SVG), а также сторонние бренды (`Etsy`, `Creative Fabrica`, `Disney`).
- **Правило визуального стиля:** Так как подавляющее большинство тегов содержат маркеры "vintage", "retro", "classic", контент сфокусирован на аутентичной винтажной и ретро-эстетике (старинные рождественские открытки, викторианские мотивы, ностальгическая праздничная графика). При этом исключено навязывание узкого стиля "watercolor" (встречается лишь в 1 теге из 105) во избежание сужения охвата для скрапленных картинок.
- **Сгенерировано:** Ровно 100 уникальных строк (Title, Description, CTA) силами нейросети без использования кода и скриптов. В ~75% CTA содержится акцент на слово "FREE".
- **Файл результата:** `Keywords/Artify Studio/Christmas/Bundles/Bundles Christmas Clipart/2 Bundles Christmas Clipart Intent Vintage/Generated_Excel_Content.md`.

### 3 Bundles Christmas Clipart Intent Objects
- **Тип стратегии:** Интент (Objects / Рождественские объекты, свитера, декор, венки, чулки, кружки какао, леденцы, гирлянды, колокольчики, снежные шары, праздничные знаки).
- **Доска:** `Ugly Christmas Sweater Clipart` (Boards_Tags.txt: 486 тегов).
- **Стоп-слова из соседних подниш:**
  - *Fonts:* `font`, `fonts`, `typography`, `lettering`, `calligraphy`, `typeface`, `script`, `cursive`
  - *Planners:* `planner`, `planners`, `planning`, `goodnotes`, `tracker`, `budget`, `agenda`
  - *Journaling:* `journal`, `journaling`, `junk journal`, `bujo`, `scrapbook`, `scrapbooking`, `ephemera`, `diary`
  - *SVG:* `svg`, `cricut`, `silhouette`, `cut file`, `cut files`
  - *Sublimation:* `sublimation`, `sublimate`, `tumbler`, `mug wrap`, `heat transfer`, `dtf`
- **Правило визуального стиля:** Теги охватывают все возможные праздничные предметы и элементы декора (вязаные свитера, чулки с подарками, кружки с маршмеллоу, хвойные венки, стеклянные шары, банты, огоньки, леденцы). Чтобы контент подходил к 100% скрапленных картинок, зафиксирована универсальная формулировка праздничного клипарта и PNG-графики высокого разрешения ("festive clipart", "holiday objects", "high-resolution PNG graphics", "decorative elements") без навязывания единого стиля ("watercolor" или "vector only").
- **Сгенерировано:** Ровно 100 уникальных строк (Title, Description, CTA) силами нейросети без использования кода и скриптов. В 72% CTA содержится акцент на слово "FREE", тип продукта капитализирован (Clipart, PNG, Bundle), названия стороннего софта (Canva, Cricut, Adobe) отсутствуют. Все 100 Title, 100 Description и 100 CTA на 100% уникальны.
- **Файл результата:** `Keywords/Artify Studio/Christmas/Bundles/Bundles Christmas Clipart/3 Bundles Christmas Clipart Intent Objects/Generated_Excel_Content.md`.

### 5 Bundles Christmas Clipart Intent Craft
- **Тип стратегии:** Интент (Craft / Материалы для крафта: распечатки, открытки, бесшовные паттерны, подарочные бирки, праздничные рамки, бордюры, постеры, знаки, ярлыки и бумажный декор).
- **Доска:** `Christmas Clipart Free Printable` (Boards_Tags.txt: 1560 тегов).
- **Стоп-слова из соседних подниш:**
  - *Fonts:* `font`, `fonts`, `typography`, `lettering`, `calligraphy`, `typeface`, `cursive`
  - *Planners:* `planner`, `planners`, `planning`, `goodnotes`, `tracker`, `budget`, `calendar`
  - *Journaling:* `journal`, `journaling`, `junk journal`, `scrapbook`, `scrapbooking`, `ephemera`, `bujo`
  - *SVG:* `svg`, `cricut`, `silhouette`, `cut file`, `cut files`, `laser cut`
  - *Sublimation:* `sublimation`, `sublimate`, `tumbler`, `tumbler wrap`, `mug wrap`, `ugly sweater`
  - *Маркетплейсы-конкуренты:* `Etsy`, `Creative Fabrica`, `Design Bundles`, `Font Bundles`, `Creative Market`
- **Правило визуального стиля:** Теги охватывают все возможные форматы печатного и цифрового крафта (printable, craft, card, pattern, frame, border, wrap, tag, papercraft). Чтобы текст подходил к 100% скрапленных картинок, использованы универсальные формулировки праздничного клипарта и распечаток без навязывания узкого художественного стиля (например, «watercolor only» или «vector only»).
- **Сгенерировано:** Ровно 100 уникальных строк (Title, Description, CTA) силами нейросети без использования кода и скриптов. Во всех CTA содержится слово "FREE", корректная капитализация типа продукта (Clipart, Printables, Patterns, Papercraft, Bundle) и отсутствие названий софта.
- **Файл результата:** `Keywords/Artify Studio/Christmas/Bundles/Bundles Christmas Clipart/5 Bundles Christmas Clipart Intent Craft/Generated_Excel_Content.md`.

### 1 Bundles Christmas Clipart Filter by OpenAI
- **Тип стратегии:** Общий (Filter by OpenAI / Все темы рождественского клипарта: персонажи, винтаж, предметы и декор, зимняя природа, материалы для крафта и распечатки).
- **Доска:** `Christmas Clipart Bundle` (Boards_Tags.txt: 2055 тегов).
- **Стоп-слова из соседних подниш:**
  - *Fonts:* `font`, `fonts`, `typography`, `lettering`, `calligraphy`, `typeface`, `script`, `cursive`
  - *Planners:* `planner`, `planners`, `planning`, `goodnotes`, `tracker`, `budget`, `agenda`, `calendar`
  - *Journaling:* `journal`, `journaling`, `junk journal`, `bujo`, `scrapbook`, `scrapbooking`, `ephemera`
  - *SVG:* `svg`, `cricut`, `silhouette`, `cut file`, `cut files`, `laser cut`
  - *Sublimation:* `sublimation`, `sublimate`, `tumbler`, `tumbler wrap`, `mug wrap`
  - *Маркетплейсы-конкуренты:* `Etsy`, `Creative Fabrica`, `Design Bundles`, `Font Bundles`, `Creative Market`
- **Правило визуального стиля:** Поскольку это общий файл подниши, объединяющий более 2000 разнообразных тегов, тексты сформулированы на абстрактно-универсальном уровне («золотая середина»). Исключено навязывание узких стилей («watercolor only», «vector only») или привязка к одиночным объектам. Формулировки («Christmas clipart bundle», «festive digital graphics», «holiday illustrations», «high-resolution PNG elements», «seasonal clipart collection») идеально ложатся на 100% скрапленных картинок любого праздничного сюжета.
- **Сгенерировано:** Ровно 100 уникальных строк (Title, Description, CTA) силами нейросети без использования кода и скриптов. В ~75% CTA содержится акцент на слово "FREE", тип продукта капитализирован (Clipart, Graphics, PNG Bundle), сторонний софт не упоминается. Все 100 Title, 100 Description и 100 CTA полностью уникальны.
- **Файл результата:** `Keywords/Artify Studio/Christmas/Bundles/Bundles Christmas Clipart/1 Bundles Christmas Clipart Filter by OpenAI/Generated_Excel_Content.md`.

---

## 10. Генерация Excel-контента (Промпт 6) — Bundles Christmas Fonts
### 2 Bundles Christmas Fonts Intent Cursive and Calligraphy
- **Тип стратегии:** Интент (Cursive and Calligraphy / Рукописные, каллиграфические и курсивные праздничные шрифты для открыток, приглашений и праздничной полиграфии).
- **Доска:** `Christmas Fonts Cursive`
- **Стоп-слова из соседних подниш:**
  - *Clipart:* `clipart`, `cliparts`
  - *SVG:* `svg`, `cricut`, `silhouette`, `cut file`, `cut files`
  - *Sublimation:* `sublimation`, `tumbler`, `mug wrap`
  - *Planners:* `planner`, `planners`, `goodnotes`, `tracker`
  - *Journaling:* `journal`, `junk journal`, `scrapbook`
- **Правило визуального стиля:** Фокус на праздничной рукописной каллиграфии, скриптах и курсивных шрифтах. Без упоминания watercolor или стороннего ПО.
- **Сгенерировано:** Ровно 100 уникальных строк (Title, Description, CTA) силами нейросети без скриптов.
- **Файл результата:** `Keywords/Artify Studio/Christmas/Bundles/Bundles Christmas Fonts/2 Bundles Christmas Fonts Intent Cursive and Calligraphy/Generated_Excel_Content.md`.

### 3 Bundles Christmas Fonts Intent Cute and Fun
- **Тип стратегии:** Интент (Cute and Fun / Милые, забавные, детские рождественские шрифты: леденцы / candy cane, bubble fonts, doodle fonts, ugly sweater fonts).
- **Доска:** `Candy Cane Fonts` (Boards_Tags.txt: 22 тега).
- **Стоп-слова из соседних подниш:**
  - *Clipart:* `clipart`, `cliparts`
  - *SVG:* `svg`, `cricut`, `silhouette`, `cut file`, `cut files`, `laser cut`
  - *Sublimation:* `sublimation`, `sublimate`, `tumbler`, `mug wrap`
  - *Planners:* `planner`, `planners`, `planning`, `goodnotes`, `tracker`, `budget`, `agenda`
  - *Journaling:* `journal`, `journaling`, `junk journal`, `scrapbook`, `scrapbooking`, `ephemera`, `bujo`, `bullet journal`, `washi`
  - *Маркетплейсы-конкуренты & Софт:* `Etsy`, `Creative Fabrica`, `Design Bundles`, `Font Bundles`, `Creative Market`, `Canva`, `Adobe`
- **Правило визуального стиля:** Милые, сладкие (candy cane/peppermint), надувные (bubble/balloon), дудл-рисовальные (doodle/sketch) и свитерные (ugly sweater knit) шрифты. Без навязывания акварели (watercolor) или узкого софта, чтобы 100% подходить к любой картинке из поисковой выдачи по тегам доски.
- **Сгенерировано:** Ровно 100 уникальных строк (Title, Description, CTA) силами нейросети без кода и скриптов. Во всех CTA содержится слово "FREE", тип продукта капитализирован (Fonts, Font Bundle, Typeface), описания начинаются с тематических эмодзи без артикля "A". Все 100 строк на 100% уникальны.
- **Файл результата:** `Keywords/Artify Studio/Christmas/Bundles/Bundles Christmas Fonts/3 Bundles Christmas Fonts Intent Cute and Fun/Generated_Excel_Content.md`.

### 5 Bundles Christmas Fonts Intent Typography and Design
- **Тип стратегии:** Интент (Typography and Design / Праздничная типографика, текстовый дизайн, постерные макеты, 3D и современные акцидентные рождественские шрифты).
- **Доска:** `Christmas Typography` (Boards_Tags.txt: 20 тегов).
- **Стоп-слова из соседних подниш:**
  - *Clipart:* `clipart`, `cliparts`
  - *SVG:* `svg`, `cricut`, `silhouette`, `cut file`, `cut files`, `vinyl`
  - *Sublimation:* `sublimation`, `sublimate`, `tumbler`, `mug wrap`, `ugly sweater`, `dtf`, `heat transfer`
  - *Planners:* `planner`, `planners`, `planning`, `goodnotes`, `tracker`, `budget`, `agenda`, `calendar`
  - *Journaling:* `journal`, `journaling`, `junk journal`, `scrapbook`, `scrapbooking`, `ephemera`, `bujo`, `bullet journal`, `washi`
  - *Маркетплейсы-конкуренты & Софт:* `Etsy`, `Creative Fabrica`, `Design Bundles`, `Font Bundles`, `Creative Market`, `Canva`, `Adobe`, `Procreate`
- **Правило визуального стиля:** Фокус на праздничной типографике, постерах, текстовых композициях, 3D и современных шрифтах. Без упоминания узких стилей («watercolor only» или «boho») или стороннего ПО, чтобы текст безупречно подходил к 100% скрапленных пинов по тегам доски.
- **Сгенерировано:** Ровно 100 уникальных строк (Title, Description, CTA) силами нейросети без использования кода и скриптов. В CTA содержится акцент на слово "FREE", тип продукта капитализирован (Fonts, Typography, Typefaces, Text Designs, Font Bundle), описания начинаются с тематических эмодзи без артикля "A". Все 100 строк на 100% уникальны.
- **Файл результата:** `Keywords/Artify Studio/Christmas/Bundles/Bundles Christmas Fonts/5 Bundles Christmas Fonts Intent Typography and Design/Generated_Excel_Content.md`.

### 1 Bundles Christmas Fonts Filter by OpenAI
- **Тип стратегии:** Общий (Filter by OpenAI / Все темы праздничной типографики: каллиграфия, скрипты, леденцовые и милые шрифты, винтаж, дисплейные гарнитуры, рукописные и современные зимние шрифты).
- **Доска:** `Christmas Font Bundle` (Boards_Tags.txt: 1479 тегов).
- **Стоп-слова из соседних подниш:**
  - *Clipart:* `clipart`, `cliparts`, `illustration`, `watercolor`, `character`
  - *SVG:* `svg`, `cricut`, `silhouette`, `cut file`, `cut files`, `laser cut`
  - *Sublimation:* `sublimation`, `sublimate`, `tumbler`, `tumbler wrap`, `mug wrap`
  - *Planners:* `planner`, `planners`, `planning`, `goodnotes`, `tracker`, `budget`, `calendar`, `agenda`
  - *Journaling:* `journal`, `journaling`, `junk journal`, `scrapbook`, `scrapbooking`, `ephemera`, `bujo`, `bullet journal`, `washi`
  - *Маркетплейсы-конкуренты & Софт:* `Etsy`, `Creative Fabrica`, `Design Bundles`, `Font Bundles`, `Creative Market`, `Canva`, `Adobe`
- **Правило визуального стиля:** Поскольку это общий файл подниши (1479 разнообразных тегов), контент сбалансирован на универсальном уровне («золотая середина»). Охвачены все ключевые направления праздничной типографики (шрифты для открыток, баннеров, сезонных подарков, леттеринг, праздничные надписи), без навязывания единого узкого стиля (например, watercolor) и без привязки к одиночным элементам. Любая случайно скрапленная картинка со шрифтом или праздничной надписью идеально сочетается с текстами.
- **Сгенерировано:** Ровно 100 уникальных строк (Title, Description, CTA) силами нейросети без использования кода и скриптов. В 70%+ CTA содержится акцент на слово "FREE", названия типов товаров капитализированы (Fonts, Font Bundle, Typefaces), описания начинаются с праздничных эмодзи без артикля "A" и без преждевременных CTA. Все 100 строк на 100% уникальны.
- **Файл результата:** `Keywords/Artify Studio/Christmas/Bundles/Bundles Christmas Fonts/1 Bundles Christmas Fonts Filter by OpenAI/Generated_Excel_Content.md`.

---

## 11. Генерация Excel-контента (Промпт 6) — Bundles Christmas Journaling
### 1 Bundles Christmas Journaling Filter by OpenAI
- **Тип стратегии:** Общий (Filter by OpenAI / Все форматы рождественского и зимнего ведения дневников: Bullet Journal, Junk Journal, скрапбукинг, праздничные стикеры, вырубки и бумажный крафт, трекеры и теги).
- **Доска:** `Christmas Journaling Bundle` (Boards_Tags.txt: 782 тега).
- **Стоп-слова из соседних подниш:**
  - *Fonts:* `font`, `fonts`, `typography`, `lettering`, `calligraphy`, `typeface`
  - *SVG:* `svg`, `cricut`, `silhouette`, `cut file`, `cut files`, `laser cut`
  - *Sublimation:* `sublimation`, `sublimate`, `tumbler`, `tumbler wrap`, `mug wrap`, `ugly sweater`
  - *Clipart (standalone):* `clipart`, `cliparts`
  - *General standalone planners:* `budget planner`, `fitness planner`, `wedding planner`, `business planner`
  - *Маркетплейсы-конкуренты & Софт:* `Etsy`, `Creative Fabrica`, `Design Bundles`, `Font Bundles`, `Creative Market`, `Canva`, `Adobe`, `Goodnotes`
- **Правило визуального стиля:** Поскольку это общий файл подниши (782 тега, охватывающих развороты bullet journal, винтажные слои junk journal, макеты скрапбукинга, наборы наклеек и бумажный декор), тексты выдержаны на универсально-сбалансированном уровне («золотая середина»). Исключены узкие ограничения (например, «watercolor only» или «grunge only»), чтобы контент безупречно подходил к любой скрапленной картинке из выдачи.
- **Сгенерировано:** Ровно 100 уникальных строк (Title, Description, CTA) силами нейросети без использования кода и скриптов. В ~78% CTA содержится акцент на слово "FREE", типы продуктов капитализированы (Journaling Bundle, Junk Journal Kit, Scrapbook Bundle, Journal Pages, Ephemera Pack, Sticker Pack, Papercraft Collection, Memory Book Bundle), в описаниях каждое предложение начинается с тематического эмодзи без артикля "A" и без призывов к действию. Все 100 строк в блоках Title, Description и CTA на 100% уникальны.
- **Файл результата:** `Keywords/Artify Studio/Christmas/Bundles/Bundles Christmas Journaling/1 Bundles Christmas Journaling Filter by OpenAI/Generated_Excel_Content.md`.

### 2 Bundles Christmas Journaling Intent Bullet Journal
- **Тип стратегии:** Интент (2 Bundles Christmas Journaling Intent Bullet Journal — целевой сегмент Bullet Journal / Bujo для Рождества, Декабря, Января, Зимы и новогодних целей: развороты, обложки, трекеры привычек и настроения, дудлы, разделители, рамки, чек-листы и распечатки).
- **Доска:** `January Bullet Journal` (Boards_Tags.txt: 420 тегов).
- **Стоп-слова из соседних подниш:**
  - *Fonts:* `font`, `fonts`, `typography`, `lettering`, `calligraphy`, `typeface`
  - *SVG:* `svg`, `cricut`, `silhouette`, `cut file`, `cut files`, `laser cut`
  - *Sublimation:* `sublimation`, `sublimate`, `tumbler`, `tumbler wrap`, `mug wrap`, `ugly sweater`, `heat press`, `dtf`
  - *Clipart (standalone):* `clipart`, `cliparts`
  - *General standalone planners:* `budget planner`, `fitness planner`, `wedding planner`, `business planner` (сохранена узкая направленность на Bullet Journal / Bujo, исключены бизнес- и финансовые планеры)
  - *Маркетплейсы-конкуренты & Софт:* `Etsy`, `Creative Fabrica`, `Design Bundles`, `Font Bundles`, `Creative Market`, `Canva`, `Adobe`, `Goodnotes`
- **Правило визуального стиля:** Сбалансированный стиль Bullet Journal / Bujo (точечная сетка, декоративные рукотворные дудлы, сезонные шапки и баннеры, трекеры настроения и привычек, рождественские адвент-отсчеты, новогодние цели и уютные зимние списки). Исключена жесткая привязка к узким стилям («watercolor only», «pink only», «disney only»), что обеспечивает 100% визуальный матч для любого скрапленного пина из поисковой выдачи по рождественским, декабрьским, январским и зимним bujo-тегам.
- **Сгенерировано:** Ровно 100 уникальных строк (Title, Description, CTA) нейросетью без использования кода и скриптов. В ~76% CTA сделан выразительный акцент на слово "FREE", типы продуктов капитализированы (Bullet Journal Bundle, Bujo Spreads, Bullet Journal Kit, Journal Printables, Habit Tracker Pack, Bujo Templates, Bujo Layouts, Bujo Stickers), в описаниях каждое предложение начинается с тематического эмодзи без артикля "A" и без CTA. Все 100 строк в блоках Title, Description и CTA на 100% уникальны.
- **Файл результата:** `Keywords/Artify Studio/Christmas/Bundles/Bundles Christmas Journaling/2 Bundles Christmas Journaling Intent Bullet Journal/Generated_Excel_Content.md`.

### 3 Bundles Christmas Journaling Intent Junk Journal
- **Тип стратегии:** Интент (Junk Journal / Винтажные, состаренные, викторианские и гранжевые рождественские джанк-джорналы, наборы эфемеров, кармашки, тэги, фолио, конверты, December Daily и зимние развороты).
- **Доска:** `Christmas Junk Journals` (Boards_Tags.txt: 124 тега).
- **Стоп-слова из соседних подниш:**
  - *Fonts:* `font`, `fonts`, `typography`, `calligraphy`, `cursive`, `lettering`, `typeface`
  - *SVG:* `svg`, `cricut`, `silhouette`, `cut file`, `cut files`, `laser cut`, `vinyl`
  - *Sublimation:* `sublimation`, `sublimate`, `tumbler`, `tumbler wrap`, `mug wrap`, `ugly sweater`
  - *Clipart (standalone):* `clipart`, `cliparts`, `clip art`
  - *Planners (standalone):* `planner`, `planners`, `planning`, `goodnotes`, `digital planner`, `notion`, `budget planner`, `fitness planner`
  - *Шум/не сезон:* `summer`, `beach`
  - *Маркетплейсы-конкуренты & Софт:* `Etsy`, `Creative Fabrica`, `Creative Market`, `Design Bundles`, `Font Bundles`, `Canva`, `Adobe`
- **Правило визуального стиля:** Тексты строго сфокусированы на специфике эстетики Junk Journaling: состаренный пергамент, чайное тонирование, винтажные рождественские открытки, кармашки, фолио, конверты, тэги, билетики, музыкальные ноты и декабрьские памятные хроники. При этом сохранен баланс разнообразия (викторианский, рустик, шебби, гранж, зимнее солнцестояние, ботаника), чтобы любой сгенерированный заголовок, описание и CTA подходили к любому случайному пину из выдачи по тегам доски.
- **Сгенерировано:** Ровно 100 уникальных строк (Title, Description, CTA) нейросетью без использования кода и скриптов. В 80% CTA содержится акцент на слово "FREE", типы продуктов капитализированы (Junk Journal Kit, Ephemera Pack, Printable Folio, Junk Journal Pages, Paper Pack, Collage Sheets, Journal Cards, Papercraft Elements, Memory Book Kit, Junk Journal Covers), в описаниях каждое предложение начинается с тематического эмодзи без артикля "A" и без призывов к действию. Все 100 строк в блоках Title, Description и CTA на 100% уникальны.
- **Файл результата:** `Keywords/Artify Studio/Christmas/Bundles/Bundles Christmas Journaling/3 Bundles Christmas Journaling Intent Junk Journal/Generated_Excel_Content.md`.

### 4 Bundles Christmas Journaling Intent Scrapbook
- **Тип стратегии:** Интент (Intent Scrapbook / Рождественский и зимний скрапбукинг, макеты страниц 12x12 и 8x8, двухстраничные развороты, December Daily альбомы, праздничное сохранение воспоминаний, подложки для фото и декоративные рамки).
- **Доска:** `Christmas Scrapbook Layouts` (Boards_Tags.txt: 75 тегов).
- **Стоп-слова из соседних подниш:**
  - *Fonts:* `font`, `fonts`, `typography`, `lettering`, `calligraphy`, `typeface`
  - *SVG:* `svg`, `svgs`, `cricut`, `silhouette`, `cut file`, `cut files`, `laser cut`
  - *Sublimation:* `sublimation`, `sublimate`, `tumbler`, `tumbler wrap`, `mug wrap`
  - *Clipart (standalone):* `clipart`, `cliparts`
  - *General standalone planners:* `planner`, `planners`, `budget planner`, `fitness planner`
  - *Маркетплейсы-конкуренты & Софт:* `Etsy`, `Creative Fabrica`, `Design Bundles`, `Font Bundles`, `Creative Market`, `Canva`, `Adobe`
- **Правило визуального стиля:** Тексты сфокусированы на скрапбукинге (Scrapbook Layouts, Scrapbooking Pages, December Daily, Photo Album Kits, Memory Books, Photo Mats). Исключены узкие художественные стили («watercolor only», «grunge only») и названия конкретного софта/оборудования (Canva, Cricut), чтобы контент безупречно подходил к любой скрапленной картинке из выдачи по тегам доски.
- **Сгенерировано:** Ровно 100 уникальных строк (Title, Description, CTA) силами нейросети без использования кода и скриптов. В 84% CTA содержится акцент на слово "FREE", названия продуктов капитализированы (Christmas Scrapbook Kit, December Daily Layouts, Winter Scrapbook Bundle, Memory Book Kit, Photo Album Templates и т.д.), в описаниях каждое предложение начинается с тематического эмодзи без артикля "A" и без призывов к действию. Все 100 строк в блоках Title, Description и CTA на 100% уникальны.
- **Файл результата:** `Keywords/Artify Studio/Christmas/Bundles/Bundles Christmas Journaling/4 Bundles Christmas Journaling Intent Scrapbook/Generated_Excel_Content.md`.

### 5 Bundles Christmas Journaling Intent Stickers
- **Тип стратегии:** Интент (Stickers / Наборы рождественских и зимних наклеек: цифровые стикеры для заметок и планшетов, распечатываемые стикер-паки A4/Letter, стикеры для Bullet Journal, Junk Journal, скрапбукинга, функциональные трекеры, праздничные иконки, декоративные ленты washi, адвент-номера и зимний декор).
- **Доска:** `Christmas Planner Stickers` (Boards_Tags.txt: 64 тега).
- **Стоп-слова из соседних подниш:**
  - *Fonts:* `font`, `fonts`, `typography`, `calligraphy`, `typeface`, `cursive`, `lettering`
  - *SVG:* `svg`, `cricut`, `silhouette`, `cut file`, `cut files`, `laser cut`
  - *Sublimation:* `sublimation`, `sublimate`, `tumbler`, `tumbler wrap`, `mug wrap`, `ugly sweater`
  - *Clipart (standalone):* `clipart`, `cliparts`
  - *Standalone Specialized Planners:* `budget planner`, `fitness planner`, `wedding planner`
  - *Маркетплейсы-конкуренты & Софт:* `Etsy`, `Creative Fabrica`, `Creative Market`, `Design Bundles`, `Font Bundles`, `Canva`, `Adobe`
- **Правило визуального стиля:** Тематика стикеров охватывает множество стилей (уютный хюгге, пастельный/розовый, милый каваи, винтаж, эстетичный минимализм, праздничные персонажи, ботаника). Во избежание сужения охвата зафиксированы сбалансированные формулировки рождественских и зимних наклеек ("planner stickers", "digital stickers", "sticker sheets", "journal stickers", "festive stickers") без навязывания единого узкого стиля (например, "watercolor only" или "pink only"). Любой случайный пин со стикером или стикер-паком на 100% соответствует тексту.
- **Сгенерировано:** Ровно 100 уникальных строк (Title, Description, CTA) нейросетью без использования кода и скриптов. В 100% CTA содержится акцент на слово "FREE", типы продуктов капитализированы (Planner Stickers, Digital Stickers, Sticker Sheets, Journal Stickers, Sticker Pack, Scrapbook Stickers, Deco Stickers), в описаниях каждое предложение начинается с тематического эмодзи без артикля "A" и без призывов к действию. Все 100 строк в блоках Title, Description и CTA на 100% уникальны.
- **Файл результата:** `Keywords/Artify Studio/Christmas/Bundles/Bundles Christmas Journaling/5 Bundles Christmas Journaling Intent Stickers/Generated_Excel_Content.md`.

### 6 Bundles Christmas Journaling Intent Die Cuts and Papercrafts
- **Тип стратегии:** Интент (Die Cuts and Papercrafts / Рождественские бумажные вырубки, акценты для открыток, распечатываемая эфемера, 3D бумажные орнаменты, подарочные бирки и шаблоны поделок из бумаги).
- **Доска:** `Christmas Die Cuts` (Boards_Tags.txt: 25 тегов).
- **Стоп-слова из соседних подниш:**
  - *Fonts:* `font`, `fonts`, `typography`, `lettering`, `calligraphy`, `typeface`, `cursive`
  - *SVG:* `svg`, `svgs`, `cut file`, `cut files`, `cricut`, `silhouette`, `laser cut`, `glowforge`
  - *Sublimation:* `sublimation`, `sublimate`, `tumbler`, `tumbler wrap`, `mug wrap`, `heat press`, `ugly sweater`
  - *Planners:* `planner`, `planners`, `goodnotes`, `notability`, `budget planner`, `tracker`
  - *Clipart (standalone):* `clipart`, `cliparts`
  - *Маркетплейсы-конкуренты & Софт:* `Etsy`, `Creative Fabrica`, `Design Bundles`, `Font Bundles`, `Creative Market`, `Canva`, `Adobe`
- **Правило визуального стиля:** Теги сфокусированы на рождественских бумажных вырубках, карточках, шаблонах поделок и печатной эфемере. Чтобы тексты безупречно подходили к 100% скрапленных картинок (объемные бумажные украшения, кармашки с тегами, высечки для открыток, новогодние домики и елочки), зафиксированы сбалансированные формулировки бумажного крафта без навязывания узких стилей («watercolor only» или «grunge only»).
- **Сгенерировано:** Ровно 100 уникальных строк (Title, Description, CTA) силами нейросети без использования кода и скриптов. В 100% CTA содержится акцент на слово "FREE", типы продуктов капитализированы (Die Cuts, Papercrafts, Ephemera Pack, Die Cut Kit, Papercraft Bundle, Papercraft Collection), все описания начинаются с релевантных эмодзи без артикля "A" и без призывов к действию. Все 100 строк в блоках Title, Description и CTA на 100% уникальны.
- **Файл результата:** `Keywords/Artify Studio/Christmas/Bundles/Bundles Christmas Journaling/6 Bundles Christmas Journaling Intent Die Cuts and Papercrafts/Generated_Excel_Content.md`.

---

## 12. Генерация Excel-контента (Промпт 6) — Bundles Christmas Planners
### 5 Bundles Christmas Planners Intent Printable Planners
- **Тип стратегии:** Интент (Printable Planners / Рождественские печатные планеры, списки подарков, шаблоны новогоднего бюджета, меню и расписания ужинов, карточки рецептов, списки рождественских фильмов и трекеры зимних активностей).
- **Доска:** `Christmas Planner Printables` (Boards_Tags.txt: 14 тегов).
- **Стоп-слова из соседних подниш:**
  - *Fonts:* `font`, `fonts`, `typography`, `calligraphy`, `lettering`, `typeface`
  - *SVG:* `svg`, `svgs`, `cut file`, `cut files`, `cricut`, `silhouette`, `laser cut`
  - *Sublimation:* `sublimation`, `sublimate`, `tumbler`, `tumbler wrap`, `mug wrap`, `ugly sweater`
  - *Journaling:* `junk journal`, `scrapbook`, `scrapbooking`, `bullet journal`, `bujo`, `ephemera`
  - *Clipart:* `clipart`, `cliparts`, `clip art`
  - *Маркетплейсы-конкуренты & Софт:* `Etsy`, `Creative Fabrica`, `Creative Market`, `Design Bundles`, `Font Bundles`, `Canva`, `Adobe`, `Photoshop`, `Illustrator`, `Goodnotes`
- **Правило визуального стиля:** Тематика сфокусирована исключительно на печатных страницах (планеры, вкладыши в папки, чек-листы, трекеры бюджета, карточки праздничных рецептов, расписания). Стиль зафиксирован универсальным («printable planner pages», «holiday organizer templates», «festive planning sheets») без навязывания узких декоративных стилей («watercolor only», «pink only»), обеспечивая 100% совпадение с любым скрапленным пином.
- **Сгенерировано:** Ровно 100 уникальных строк (Title, Description, CTA) силами нейросети без использования кода и скриптов. В CTA выдержан акцент на слово "FREE", названия типов товаров капитализированы (Planner, Printables, Templates, Checklist, Organizer, Kit, Bundle, Tracker, Sheets, Cards), описания начинаются с подходящих эмодзи без артикля "A" и без призывов к действию. Все строки на 100% уникальны.
- **Файл результата:** `Keywords/Artify Studio/Christmas/Bundles/Bundles Christmas Planners/5 Bundles Christmas Planners Intent Printable Planners/Generated_Excel_Content.md`.

### 1 Bundles Christmas Planners Filter by OpenAI
- **Тип стратегии:** Общий (Filter by OpenAI / Все темы рождественского и праздничного планирования: цифровые планеры, печатные шаблоны и вкладыши в папки, списки подарков и трекеры бюджета, праздничные меню и расписания выпечки, организация вечеринок и мероприятий, планы путешествий, зимние списки дел и чек-листы, стикеры и функциональные маркеры для планеров).
- **Доска:** `Christmas Planner Bundle` (Boards_Tags.txt: 595 тегов).
- **Стоп-слова из соседних подниш:**
  - *Fonts:* `font`, `fonts`, `typography`, `calligraphy`, `typeface`, `lettering`, `cursive`
  - *SVG:* `svg`, `svgs`, `cut file`, `cut files`, `cricut`, `silhouette`, `laser cut`, `vinyl`
  - *Sublimation:* `sublimation`, `sublimate`, `tumbler`, `tumbler wrap`, `mug wrap`, `ugly sweater`
  - *Journaling:* `journal`, `journaling`, `junk journal`, `scrapbook`, `scrapbooking`, `ephemera`, `bujo`, `bullet journal`
  - *Clipart:* `clipart`, `cliparts`
  - *Маркетплейсы-конкуренты & Софт:* `Etsy`, `Creative Fabrica`, `Creative Market`, `Design Bundles`, `Font Bundles`, `Canva`, `GoodNotes`, `Notion`, `Adobe`, `Excel`, `Google Sheets`
- **Правило визуального стиля:** Поскольку это общий файл подниши, объединяющий 595 разнообразных тегов, тексты сформулированы на универсально-сбалансированном уровне («золотая середина»). Охвачены все ключевые направления праздничного планирования (цифровые планеры, печатные органайзеры, трекеры подарков и бюджета, расписания ужинов и меню, чек-листы мероприятий, стикеры для планеров), без навязывания единого узкого стиля (например, «watercolor only» или «vintage only») и без привязки к одиночным изображениям. Любая случайно скрапленная картинка планера или праздничного чек-листа идеально сочетается с заголовками, описаниями и CTA.
- **Сгенерировано:** Ровно 100 уникальных строк (Title, Description, CTA) силами нейросети без использования кода и скриптов. В 76% CTA содержится акцент на слово "FREE", типы продуктов капитализированы (Planner, Planners, Holiday Planner, Planner Bundle, Digital Planner, Printable Planner, Planner Stickers, Budget Planner, Meal Planner, Travel Planner, Event Planner, Daily Planner, Gift Tracker, Wellness Planner, Recipe Planner), описания начинаются с праздничных тематических эмодзи без артикля "A" и без призывов к действию. Все 100 строк в каждом блоке полностью уникальны.
- **Файл результата:** `Keywords/Artify Studio/Christmas/Bundles/Bundles Christmas Planners/1 Bundles Christmas Planners Filter by OpenAI/Generated_Excel_Content.md`.

### 3 Bundles Christmas Planners Intent Digital Planners
- **Тип стратегии:** Интент (Digital Planners / Рождественские цифровые планеры, iPad и планшетные планеры, шаблоны для GoodNotes, декабрьские развороты, цифровые стикеры, списки подарков, меню, обложки и интерактивные праздничные календари).
- **Доска:** `Christmas Digital Planner` (Boards_Tags.txt: 14 тегов).
- **Стоп-слова из соседних подниш:**
  - *Fonts:* `font`, `fonts`, `typography`, `calligraphy`, `lettering`, `typeface`, `cursive font`, `script font`
  - *SVG:* `svg`, `svgs`, `cut file`, `cut files`, `cricut`, `silhouette`, `laser cut`, `glowforge`
  - *Sublimation:* `sublimation`, `sublimate`, `tumbler`, `tumbler wrap`, `mug wrap`, `ugly sweater`, `heat press`
  - *Journaling:* `bullet journal`, `bujo`, `junk journal`, `junk journaling`, `scrapbook`, `scrapbooking`, `ephemera`
  - *Clipart:* `clipart`, `cliparts`, `clip art`
  - *Непрофильные ниши планеров:* `wedding planner`, `fitness planner`, `business planner`, `homeschool planner`, `pregnancy planner`
  - *Маркетплейсы-конкуренты & Софт в CTA:* `Etsy`, `Creative Fabrica`, `Creative Market`, `Design Bundles`, `Font Bundles`, `Canva`, `Adobe`
- **Правило визуального стиля:** Тематика охватывает интерактивные планшетные планеры, цифровые наклейки, декабрьские календари и обложки. Стиль зафиксирован нейтрально-профессиональным («digital planner templates», «tablet planner spreads», «holiday digital stickers», «interactive planning pages») без привязки к узким художественным техникам («watercolor only», «pink only», «disney only»), что обеспечивает 100% визуальный матч для любого скрапленного пина из поисковой выдачи по рождественским цифровым планерам.
- **Сгенерировано:** Ровно 100 уникальных строк (Title, Description, CTA) нейросетью без использования кода и скриптов. В CTA строго соблюден акцент на слово "FREE" (в ~85% строк), названия продуктов капитализированы (Digital Planner, Planner Bundle, Digital Stickers, Holiday Planner, Planner Templates), описания начинаются с подходящих эмодзи без артикля "A" и без призывов к действию (CTA вынесен строго в отдельную колонку). Все 100 строк на 100% уникальны.
- **Файл результата:** `Keywords/Artify Studio/Christmas/Bundles/Bundles Christmas Planners/3 Bundles Christmas Planners Intent Digital Planners/Generated_Excel_Content.md`.

### 2 Bundles Christmas Planners Intent Core Planners
- **Тип стратегии:** Интент (Core Planners / Цифровые и печатные праздничные планеры, шаблоны для планеров, ежедневные и еженедельные расписания, декабрьские и годовые календари, планеры на 1 неделю и 6 недель, дашборды, разделители, обложки и комплексные системы праздничной организации).
- **Доска:** `1 Week Holiday Planner` (Boards_Tags.txt: 531 тег).
- **Стоп-слова из соседних подниш:**
  - *Fonts:* `font`, `fonts`, `typography`, `calligraphy`, `typeface`, `lettering`, `cursive`, `script`
  - *SVG:* `svg`, `svgs`, `cut file`, `cut files`, `cricut`, `silhouette`, `laser cut`, `glowforge`, `vinyl`
  - *Sublimation:* `sublimation`, `sublimate`, `tumbler`, `tumbler wrap`, `mug wrap`, `heat press`, `ugly sweater`
  - *Journaling:* `junk journal`, `scrapbook`, `scrapbooking`, `ephemera`, `papercraft`, `die cut`
  - *Clipart:* `clipart`, `cliparts`, `clip art`
  - *Маркетплейсы-конкуренты & Софт:* `Etsy`, `Creative Fabrica`, `Creative Market`, `Design Bundles`, `Font Bundles`, `Canva`, `Adobe`, `Photoshop`, `Illustrator`, `GoodNotes`, `Notion`, `Excel`, `Google Sheets`
- **Правило визуального стиля:** Универсальная эстетика праздничного и зимнего планирования (структурированные почасовые блоки, еженедельные развороты, ежемесячные календари, чек-листы дел, обложки планеров, интерактивные и печатные шаблоны) без привязки к узким декоративным техникам («watercolor only», «pink only», «boho only»), обеспечивающая 100% совпадение с любым скрапленным пином из поисковой выдачи по holiday planner, christmas planner, daily schedule, weekly planner.
- **Сгенерировано:** Ровно 100 уникальных строк (Title, Description, CTA) силами нейросети без использования кода и скриптов. В 100% CTA выдержан акцент на слово "FREE", типы продуктов капитализированы (Christmas Planner, Digital Planner, Holiday Planner, Planner Bundle, Daily Planner, Weekly Planner, Printable Planner, Planner Inserts, Holiday Organizer, Calendar Planner, Countdown Planner, Productivity Planner, Life Planner), все описания начинаются с разнообразных тематических эмодзи без артикля "A" и без призывов к действию. Все 100 строк в блоках Title, Description и CTA на 100% уникальны. Контент записан в `Generated_Excel_Content.md` и перенесен в Excel-файл `.xlsx`.
- **Файл результата:** `Keywords/Artify Studio/Christmas/Bundles/Bundles Christmas Planners/2 Bundles Christmas Planners Intent Core Planners/Generated_Excel_Content.md`.

### 11 Bundles Christmas Planners Intent Holiday Events
- **Тип стратегии:** Интент (Holiday Events / Праздничные маршруты и графики поездок, планирование рождественских вечеринок, организация праздничных банкетов и ужинов, таймлайны семейных зимних мероприятий, корпоративные и годовые планеры праздников, чек-листы праздничных активностей и подарков).
- **Доска:** `Holiday Itinerary Planner` (Boards_Tags.txt: 14 тегов).
- **Стоп-слова из соседних подниш:**
  - *Fonts:* `font`, `fonts`, `typography`, `calligraphy`, `typeface`, `lettering`, `cursive`
  - *SVG:* `svg`, `svgs`, `cut file`, `cut files`, `cricut`, `silhouette`, `laser cut`
  - *Sublimation:* `sublimation`, `sublimate`, `tumbler`, `tumbler wrap`, `mug wrap`, `ugly sweater`
  - *Journaling:* `junk journal`, `scrapbook`, `scrapbooking`, `ephemera`, `papercraft`, `die cut`
  - *Clipart:* `clipart`, `cliparts`, `clip art`
  - *Маркетплейсы-конкуренты & Софт:* `Etsy`, `Creative Fabrica`, `Creative Market`, `Design Bundles`, `Font Bundles`, `Canva`, `Adobe`
- **Правило визуального стиля:** Универсальная эстетика планирования праздничных событий и маршрутов путешествий (таймлайны вечеринок, списки гостей, расписания ужинов, чек-листы зимних поездок, графики мероприятий) без сужения до узких декоративных стилей («watercolor only», «pink only», «boho only»), гарантируя 100% совпадение с любым скрапленным пином из поисковой выдачи по holiday itinerary, christmas party planner, event planner.
- **Сгенерировано:** Ровно 100 уникальных строк (Title, Description, CTA) силами нейросети без использования кода и скриптов. В 100% CTA выдержан акцент на слово "FREE", названия типов товаров капитализированы (Holiday Itinerary Planner, Christmas Party Planner, Holiday Event Planner, Dinner Planner, Travel Planner, Event Planner, Party Host Planner, Activity Planner, Yearly Holiday Planner, Work Holiday Planner, Celebration Planner, Planner Bundle), описания начинаются с подходящих эмодзи без артикля "A" и без призывов к действию. Все 100 строк в каждом блоке полностью уникальны.
- **Файл результата:** `Keywords/Artify Studio/Christmas/Bundles/Bundles Christmas Planners/11 Bundles Christmas Planners Intent Holiday Events/Generated_Excel_Content.md`.

### 7 Bundles Christmas Planners Intent Stickers and Washi
- **Тип стратегии:** Интент (Stickers and Washi / Рождественские печатные и цифровые наклейки для планеров, наборы скотча washi, декоративные ленты и разделители, праздничные наклейки-ярлыки, винтажные рождественские стикеры, карточки рецептов и адвент-маркеры).
- **Доска:** `Christmas Printable Stickers` (Boards_Tags.txt: 13 тегов).
- **Стоп-слова из соседних подниш:**
  - *Fonts:* `font`, `fonts`, `typography`, `calligraphy`, `typeface`, `lettering`, `cursive`
  - *SVG:* `svg`, `svgs`, `cut file`, `cut files`, `cricut`, `silhouette`, `laser cut`, `glowforge`, `vinyl`
  - *Sublimation:* `sublimation`, `sublimate`, `tumbler`, `tumbler wrap`, `mug wrap`, `ugly sweater`, `heat press`, `dtf`
  - *Journaling:* `junk journal`, `scrapbook`, `scrapbooking`, `ephemera`, `papercraft`, `die cut`
  - *Clipart:* `clipart`, `cliparts`, `clip art`
  - *Маркетплейсы-конкуренты & Софт:* `Etsy`, `Creative Fabrica`, `Creative Market`, `Design Bundles`, `Font Bundles`, `Canva`, `Adobe`, `Photoshop`, `Illustrator`
- **Правило визуального стиля:** Универсальная эстетика рождественских наклеек, декоративных лент washi, ярлыков и карточек рецептов (функциональные иконки, праздничные разделители страниц, декоративные бордюры, праздничные печати, карточки рождественской выпечки) без сужения до единичных узких стилей («watercolor only», «pink only», «boho only»), обеспечивая 100% совпадение с любым скрапленным пином из поисковой выдачи по christmas printable stickers, holiday planner stickers, washi tape.
- **Сгенерировано:** Ровно 100 уникальных строк (Title, Description, CTA) силами нейросети без использования кода и скриптов. В ~95% CTA присутствует акцент на слово "FREE", типы продуктов капитализированы (Planner Stickers, Washi Tape, Printable Stickers, Digital Washi Tape, Sticker Kit, Recipe Cards, Label Stickers, Christmas Stickers, Sticker Sheets, Vintage Stickers, Holiday Stickers, Digital Stickers), описания начинаются с подходящих эмодзи без артикля "A" и без призывов к действию. Все 100 строк в блоках Title, Description и CTA на 100% уникальны.
- **Файл результата:** `Keywords/Artify Studio/Christmas/Bundles/Bundles Christmas Planners/7 Bundles Christmas Planners Intent Stickers and Washi/Generated_Excel_Content.md`.

### 6 Bundles Christmas Planners Intent Gifts and Budget
- **Тип стратегии:** Интент (Gifts and Budget / Рождественские и праздничные планеры бюджета, трекеры списков подарков, чек-листы праздничных покупок, шаблоны учета расходов, тайные санты, планировщики упаковки подарков и списки желаний).
- **Доска:** `Christmas Budget Planner` (Boards_Tags.txt: 58 тегов).
- **Стоп-слова из соседних подниш:**
  - *Fonts:* `font`, `fonts`, `typography`, `calligraphy`, `typeface`, `lettering`, `cursive`
  - *SVG:* `svg`, `svgs`, `cut file`, `cut files`, `cricut`, `silhouette`, `laser cut`, `glowforge`, `vinyl`
  - *Sublimation:* `sublimation`, `sublimate`, `tumbler`, `tumbler wrap`, `mug wrap`, `heat press`, `ugly sweater`
  - *Journaling:* `junk journal`, `scrapbook`, `scrapbooking`, `ephemera`, `papercraft`, `die cut`
  - *Clipart:* `clipart`, `cliparts`, `clip art`
  - *Маркетплейсы-конкуренты & Софт:* `Etsy`, `Creative Fabrica`, `Creative Market`, `Design Bundles`, `Font Bundles`, `Canva`, `Adobe`, `Photoshop`, `Illustrator`
- **Правило визуального стиля:** Универсальная функциональная и праздничная эстетика планирования рождественских подарков, списков покупок и финансового бюджета (таблицы учета расходов, разбивка затрат по категориям, профили получателей подарков, чек-листы упаковки и тайные санты) без сужения до единичных узких декоративных стилей («watercolor only», «pink only», «boho only»), обеспечивая 100% совпадение с любым скрапленным пином из поисковой выдачи по christmas budget planner, holiday gift tracker, xmas gift list template.
- **Сгенерировано:** Ровно 100 уникальных строк (Title, Description, CTA) силами нейросети без использования кода и скриптов. В 100% CTA выдержан акцент на слово "FREE", названия типов продуктов капитализированы (Christmas Budget Planner, Gift Tracker, Holiday Shopping List, Christmas Expense Tracker, Present Planner, Secret Santa Planner, Christmas Gift List, Financial Organizer, Present Tracker, Christmas Wishlist, December Budget Planner, Holiday Spending Log, Gift Buying Guide, Store Shopping Checklist, Budget Organizer), описания начинаются с праздничных эмодзи без артикля "A" и без призывов к действию. Все 100 строк в блоках Title, Description и CTA на 100% уникальны.
- **Файл результата:** `Keywords/Artify Studio/Christmas/Bundles/Bundles Christmas Planners/6 Bundles Christmas Planners Intent Gifts and Budget/Generated_Excel_Content.md`.

### 10 Bundles Christmas Planners Intent Activities and Events
- **Тип стратегии:** Интент (Activities and Events / Рождественские планеры активностей, зимние чек-листы и списки желаний bucket lists, адвент-календари и ежедневные обратные отсчеты, списки рождественских фильмов и трекеры киномарафонов, расписания вечеринок и мероприятий, маршруты зимних отпусков и семейных традиций).
- **Доска:** `Christmas Activity Planner` (Boards_Tags.txt: 24 тега).
- **Стоп-слова из соседних подниш:**
  - *Fonts:* `font`, `fonts`, `typography`, `calligraphy`, `typeface`, `lettering`, `cursive`
  - *SVG:* `svg`, `svgs`, `cut file`, `cut files`, `cricut`, `silhouette`, `laser cut`, `vinyl`
  - *Sublimation:* `sublimation`, `sublimate`, `tumbler`, `tumbler wrap`, `mug wrap`, `ugly sweater`
  - *Journaling:* `junk journal`, `scrapbook`, `scrapbooking`, `ephemera`, `papercraft`, `die cut`, `bujo`, `bullet journal`
  - *Clipart:* `clipart`, `cliparts`, `clip art`
  - *Маркетплейсы-конкуренты & Софт:* `Etsy`, `Creative Fabrica`, `Creative Market`, `Design Bundles`, `Font Bundles`, `Canva`, `Adobe`, `Photoshop`, `Illustrator`, `Goodnotes`, `Notion`
- **Правило визуального стиля:** Универсальная эстетика планирования рождественских мероприятий и зимних активностей (расписания дня, списки семейных праздничных дел, трекеры рождественских фильмов, чек-листы зимних прогулок, адвент-отсчеты и таймлайны вечеринок) без ограничений узкими декоративными стилями («watercolor only», «retro only», «minimalist only»), что обеспечивает 100% релевантность к любому скрапленному пину по новогодним и рождественским активностям.
- **Сгенерировано:** Ровно 100 уникальных строк (Title, Description, CTA) силами нейросети без использования скриптов и кода. В 100% CTA выдержан акцент на слово "FREE", типы продуктов капитализированы (Activity Planner, Holiday Events Planner, Bucket List, Countdown Planner, Movie Tracker, Party Planner, Itinerary Planner, Traditions Tracker, Holiday Planner, Game Planner, Festival Planner, Wellness Planner, Outing Planner), описания начинаются с праздничных эмодзи без артикля "A" и без призывов к действию. Все 100 строк в таблице на 100% уникальны.
- **Файл результата:** `Keywords/Artify Studio/Christmas/Bundles/Bundles Christmas Planners/10 Bundles Christmas Planners Intent Activities and Events/Generated_Excel_Content.md`.

### 2 Bundles Christmas Sublimation Intent Ugly Sweater
- **Тип стратегии:** Интент (Ugly Sweater / Уродливые рождественские свитеры: паттерны, текстуры вязки, сублимационные принты для свитшотов и футболок, графика для тематических вечеринок, ретро и скандинавские орнаменты).
- **Доска:** `Christmas Tshirt Designs` (Boards_Tags.txt: 42 тега).
- **Стоп-слова из соседних подниш:**
  - *Fonts:* `font`, `fonts`, `typography`, `calligraphy`, `typeface`, `lettering`, `cursive`
  - *SVG:* `svg`, `svgs`, `cut file`, `cut files`, `cricut`, `silhouette`, `weeding vinyl`
  - *Planners:* `planner`, `planners`, `planning`, `goodnotes`, `tracker`, `budget planner`
  - *Journaling:* `junk journal`, `scrapbook`, `scrapbooking`, `ephemera`, `papercraft`, `die cut`
  - *Clipart:* `clipart`, `cliparts`, `clip art`
  - *Маркетплейсы-конкуренты & Софт:* `Etsy`, `Creative Fabrica`, `Creative Market`, `Design Bundles`, `Font Bundles`, `Canva`, `Adobe`, `Photoshop`, `Illustrator`
- **Правило визуального стиля:** Универсальная праздничная эстетика уродливых рождественских свитеров и сублимационных принтов для одежды (текстуры трикотажа, скандинавские жаккардовые узоры, олени, елки, Санта, яркая праздничная графика для свитшотов и вечеринок) без сужения до единичного стиля («watercolor only», «crochet only», «pink only»), что обеспечивает 100% совпадение с любым скрапленным пином по ugly sweater sublimation, holiday sweater patterns, xmas sweater t-shirt designs.
- **Сгенерировано:** Ровно 100 уникальных строк (Title, Description, CTA) силами нейросети без использования скриптов и кода. В 100% CTA присутствует акцент на слово "FREE", названия типов продуктов капитализированы (Sublimation, PNG, Designs, Bundles, Patterns, Graphics), описания начинаются с праздничных эмодзи без артикля "A" и без призывов к действию. Все 100 строк в блоках Title, Description и CTA на 100% уникальны.
- **Файл результата:** `Keywords/Artify Studio/Christmas/Bundles/Bundles Christmas Sublimation/2 Bundles Christmas Sublimation Intent Ugly Sweater/Generated_Excel_Content.md`.

### 3 Bundles Christmas Sublimation Intent T-Shirt Designs
- **Тип стратегии:** Интент (T-Shirt Designs / Праздничный графический дизайн для футболок, свитшотов, худи и пижам: сублимационные PNG, ретро и винтажные рождественские принты, праздничные слоганы, забавные и семейные дизайны для термотрансфера и DTG печати).
- **Доска:** `Christmas Tshirt Designs` (Boards_Tags.txt: 60 тегов).
- **Стоп-слова из соседних подниш:**
  - *Fonts:* `font`, `fonts`, `typography`, `calligraphy`, `typeface`, `lettering`, `cursive`, `script`
  - *SVG:* `svg`, `svgs`, `cut file`, `cut files`, `cricut`, `silhouette`, `weeding`, `vinyl`
  - *Planners:* `planner`, `planners`, `planning`, `goodnotes`, `calendar`, `schedule`
  - *Journaling:* `junk journal`, `scrapbook`, `scrapbooking`, `ephemera`, `papercraft`, `die cut`
  - *Clipart:* `clipart`, `cliparts`, `clip art`
  - *Маркетплейсы-конкуренты & Софт:* `Etsy`, `Creative Fabrica`, `Creative Market`, `Design Bundles`, `Font Bundles`, `Canva`, `Adobe`, `Photoshop`, `Illustrator`
- **Правило визуального стиля:** Универсальный праздничный графический дизайн для одежды (футболки, толстовки, худи, пижамы) высокого разрешения (300 DPI, прозрачный фон) под сублимацию и прямой перенос. Исключена привязка к узкому стилю (например, "watercolor"), формулировки подходят к любому визуалу по запросам праздничных футболок (ретро, милые иллюстрации, забавные надписи, новогодние елки, олени, Санта, семейные принты).
- **Сгенерировано:** Ровно 100 уникальных строк (Title, Description, CTA) нейросетью без использования кода и генераторов. В 70%+ CTA включен акцент на "FREE", названия типов продуктов капитализированы (Sublimation Designs, T-Shirt PNGs, Shirt Graphics, Sublimation Bundles), все описания начинаются с тематических эмодзи без артикля "A" и без CTA. Все строки в каждом блоке на 100% уникальны.
- **Файл результата:** `Keywords/Artify Studio/Christmas/Bundles/Bundles Christmas Sublimation/3 Bundles Christmas Sublimation Intent T-Shirt Designs/Generated_Excel_Content.md`.

### 1 Bundles Christmas Sublimation Filter by OpenAI
- **Тип стратегии:** Общий (Filter by OpenAI / Все темы рождественской сублимации: свитера Ugly Sweater, принты для футболок T-Shirt Designs, ретро и кокетка Retro Coquette PNG, крафты и кружки Sublimation Crafts, семейные и профессиональные принты Family Teacher Shirts).
- **Доска:** `Christmas Sublimation Bundle` (Boards_Tags.txt: 458 тегов).
- **Стоп-слова из соседних подниш:**
  - *Fonts:* `font`, `fonts`, `typography`, `calligraphy`, `typeface`, `lettering`, `cursive`, `script`
  - *SVG:* `svg`, `svgs`, `cut file`, `cut files`, `cricut`, `silhouette`, `laser cut`
  - *Planners:* `planner`, `planners`, `planning`, `goodnotes`, `tracker`, `budget`, `agenda`, `calendar`
  - *Journaling:* `journal`, `journaling`, `junk journal`, `bujo`, `scrapbook`, `scrapbooking`, `ephemera`
  - *Clipart:* `clipart`, `cliparts`, `clip art`
  - *Маркетплейсы-конкуренты & Софт:* `Etsy`, `Creative Fabrica`, `Creative Market`, `Design Bundles`, `Font Bundles`, `Canva`, `Adobe`, `Photoshop`, `Procreate`
- **Правило визуального стиля:** Универсальная праздничная сублимационная графика и дизайн одежды/товаров (300 DPI PNG, принты для футболок, свитшотов, худи, тумблеров, кружек, орнаментов, подушек, сумок) без сужения до единичных стилей («retro only», «coquette only», «watercolor only», «bleached only»), что гарантирует 100% совпадение с любым скрапленным пином из поисковой выдачи по сублимационным рождественским дизайнам.
- **Сгенерировано:** Ровно 100 уникальных строк (Title, Description, CTA) силами нейросети без использования скриптов и кода. В 100% CTA присутствует акцент на слово "FREE", названия типов продуктов капитализированы (Christmas Sublimation, Sublimation Bundle, PNG Designs, Shirt Designs, Apparel), описания начинаются с праздничных эмодзи без артикля "A" и без призывов к действию. Все 100 строк в блоках Title, Description и CTA на 100% уникальны.
- **Файл результата:** `Keywords/Artify Studio/Christmas/Bundles/Bundles Christmas Sublimation/1 Bundles Christmas Sublimation Filter by OpenAI/Generated_Excel_Content.md`.

---
*Отчет обновлен Оркестратором в процессе генерации контента для Pinterest.*
