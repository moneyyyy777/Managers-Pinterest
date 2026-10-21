# Artify Studio — финальная карта ниш после аудита

**Версия:** 14 сентября 2026  
**Задача:** привести старые 20 ниш к правильной архитектуре `[SECTION] → [COLLECTION]` и добавить 10 новых коллекций.

---

## 1. Главное правило архитектуры

Коллекция должна объединять **одного и того же типа покупателя/создателя + один понятный интерес/сценарий + набор вариантов вкуса внутри этого сценария**.

### Формула

`PRODUCT TYPE + BUYER INTEREST / USE CASE + AESTHETIC`

### Хорошо

- `cliparts/baby-shower`
- `fonts/bubble-fonts`
- `mockups/streetwear`
- `svg/western-cowgirl`
- `laser-cut/bookmarks`

### Плохо

- `mockups/apparel` — слишком разные покупатели и бизнес-задачи.
- `seamless-patterns` — ткань, упаковка, POD и digital paper имеют разные use case.
- `wedding-svg-fonts` — SVG и fonts являются разными типами продукта.
- `christmas-bundles` — bundle описывает формат продукта, а не единый интерес/вкус.

---

# 2. Финальная архитектура: старые ниши → новые правильные

## Сезонный блок

### OLD #1 — Christmas Bundles

**Статус:** ❌ разделить.

Старая ниша смешивает разные типы продуктов и разные намерения покупателя.

### Новая структура

```text
/svg/christmas
/fonts/christmas
/cliparts/christmas
/sublimation/christmas
/procreate-brushes/christmas
```

Внутри каждой коллекции уже можно делать эстетические варианты:

- retro Christmas
- coquette Christmas
- vintage Christmas
- funny Christmas
- traditional Christmas
- rustic Christmas
- cute Christmas

**Важно:** `bundle` не должен быть главным уровнем коллекции. Bundle — формат товара внутри коллекции.

---

### OLD #2 — Christmas Tumbler Wraps

**Статус:** ✅ оставить как отдельную продуктовую коллекцию.

```text
/tumbler-wraps/christmas
```

**Единый покупатель:** создатели дизайнов для tumbler.

Варианты вкуса:

- retro
- coquette
- funny
- western
- vintage
- cute
- gothic

---

### OLD #3 — Retro Christmas Cliparts

**Статус:** ✅ оставить.

```text
/cliparts/retro-christmas
```

Это уже корректная связка:

**clipart + Christmas + retro aesthetic.**

---

### OLD #4 — Cricut Holiday Fonts

**Статус:** ✅ оставить, немного уточнить.

```text
/fonts/christmas-cricut
```

или

```text
/fonts/holiday-cricut
```

Варианты:

- elegant script
- retro
- playful
- hand-lettered
- bold
- cute

---

### OLD #5 — Ugly Sweater SVGs

**Статус:** ✅ оставить.

```text
/svg/ugly-sweater
```

Единый use case: праздничные SVG для sweater/apparel.

Варианты:

- funny
- retro
- cute
- ugly Christmas
- family
- sarcastic

---

### OLD #6 — 3D / Layered Paper SVGs

**Статус:** ⚠️ разделить по реальному продукту/use case.

### Новая структура

```text
/svg/layered-paper
/svg/shadow-box
/svg/3d-paper
```

Если коллекции ещё маленькие, на первом этапе можно начать с:

```text
/svg/layered-paper
```

а затем разделить по мере появления достаточного количества товаров.

---

### OLD #7 — Thanksgiving / Fall Cozy SVGs

**Статус:** ❌ обязательно разделить.

Thanksgiving и Fall — разные поисковые намерения.

### Новая структура

```text
/svg/fall
/svg/thanksgiving
```

Для `fall`:

- cozy
- pumpkin
- rustic
- cottagecore
- autumn farmhouse
- dark autumn

Для `thanksgiving`:

- family
- turkey
- funny
- harvest
- gratitude
- farmhouse

---

### OLD #8 — Winter Procreate Brushes

**Статус:** ✅ оставить.

```text
/procreate-brushes/winter
```

Варианты вкуса/эффекта:

- snow
- ice
- frost
- fur
- winter texture
- Christmas lettering
- magical winter

---

### OLD #9 — New Year 2027 Digital Planners / Stickers

**Статус:** ⚠️ разделить продуктовые намерения.

`2027` — временной атрибут, а planner и stickers — разные продукты.

### Новая структура

```text
/digital-planners/new-year
/digital-planners/2027
/digital-stickers/new-year
/digital-stickers/2027
```

Если нужен более компактный MVP:

```text
/digital-planners/2027
/digital-stickers/2027
```

---

### OLD #10 — Sarcastic / Funny Christmas SVGs

**Статус:** ✅ оставить.

```text
/svg/funny-christmas
```

Это хороший пример единого интереса:

**Christmas + humor + SVG.**

Варианты:

- sarcastic
- anti-Christmas
- dad jokes
- office humor
- family humor
- cute funny

---

# Evergreen-блок

## OLD #11 — Wedding SVG & Fonts

**Статус:** ❌ обязательно разделить.

SVG и fonts — разные product intents.

### Новая структура

```text
/svg/wedding
/fonts/wedding
/cliparts/wedding
```

Дальше можно создавать более узкие эстетические коллекции:

```text
/svg/wedding/boho
/svg/wedding/gothic
/svg/wedding/vintage
/svg/wedding/minimal
/fonts/wedding/elegant
/fonts/wedding/romantic
```

Но на уровне основного каталога сначала достаточно разделения по product type.

---

## OLD #12 — Watercolor Floral Cliparts

**Статус:** ⚠️ улучшить.

Проблема не критическая, но `watercolor` — техника/стиль, а `floral` — subject.

Лучше строить коллекции вокруг более конкретного вкуса/мира:

```text
/cliparts/wildflower
/cliparts/botanical
/cliparts/cottagecore-floral
/cliparts/tropical-floral
/cliparts/wedding-floral
```

`watercolor` использовать как style/tag, а не обязательно как главный URL.

---

## OLD #13 — Cricut Monogram SVGs

**Статус:** ✅ оставить.

```text
/svg/cricut-monograms
```

Единый покупатель/use case: Cricut creators, которым нужны monograms.

Варианты:

- elegant
- floral
- vintage
- western
- minimalist
- feminine
- Christmas

---

## OLD #14 — Tattoo & Stipple Procreate Brushes

**Статус:** ✅ оставить.

```text
/procreate-brushes/tattoo-stipple
```

Здесь совпадают и продукт, и пользователь, и художественная задача.

Варианты:

- stipple
- dotwork
- engraving
- blackwork
- sketch
- vintage tattoo

---

## OLD #15 — Baby Shower Cliparts & SVGs

**Статус:** ❌ разделить по продукту.

### Новая структура

```text
/cliparts/baby-shower
/svg/baby-shower
/fonts/baby-shower
```

Единый интерес сохраняется: baby shower.

Внутри:

- cute
- watercolor
- boho
- woodland
- safari
- teddy bear
- floral
- neutral
- pink
- blue

---

## OLD #16 — Apparel Mockups Bundle

**Статус:** ❌ ОДНА ИЗ ГЛАВНЫХ ОШИБОК. Разделить по покупателю.

Общий `apparel` объединяет слишком разные бизнесы.

### Новая структура

```text
/mockups/streetwear
/mockups/fitness-apparel
/mockups/baby-apparel
/mockups/bridal-apparel
/mockups/activewear
/mockups/luxury-fashion
```

### Почему это правильно

`streetwear brand owner` ищет совершенно другой визуальный mockup, чем:

- fitness apparel seller
- baby clothing seller
- bridal brand
- luxury fashion brand.

Здесь нельзя объединять всё одним `apparel`.

---

## OLD #17 — Seamless Patterns

**Статус:** ❌ разделить по применению.

Старая ниша смешивает:

- fabric designers
- packaging designers
- POD sellers
- scrapbook/digital paper creators.

### Новая структура

```text
/patterns/fabric
/patterns/packaging
/patterns/scrapbooking
/patterns/pod
```

После этого внутри каждой можно использовать эстетики:

- boho
- floral
- retro
- cottagecore
- western
- maximalist
- Afrohemian
- circus/FunHaus

---

## OLD #18 — Christian / Faith SVGs

**Статус:** ✅ базовую коллекцию оставить.

```text
/svg/christian
```

Если объём товаров позволяет — расширить:

```text
/svg/bible-verses
/svg/church
/svg/christian-wedding
```

Но не нужно дробить слишком рано: здесь аудитория всё ещё достаточно единая.

---

## OLD #19 — KDP Interiors

**Статус:** ⚠️ разделить по типу конечного продукта.

`KDP` — это платформа/бизнес-модель, а не единый product intent.

### Новая структура

```text
/kdp/journals
/kdp/planners
/kdp/notebooks
/kdp/logbooks
```

Внутри:

- minimalist
- cute
- floral
- dark academia
- cottagecore
- business
- fitness
- wellness

---

## OLD #20 — Bubble & Y2K Fonts

**Статус:** ❌ обязательно разделить.

Это особенно важный случай: Y2K — не один визуальный мир.

### Уже доказанная сегментация

```text
/fonts/y2k-cyber
/fonts/y2k-kawaii
/fonts/y2k-grunge
/fonts/y2k-pixel
```

### Почему

#### Y2K Cyber
Аудитория:

- gamers
- streamers
- techno
- futuristic designers

Вкус:

- cyber
- chrome
- futuristic
- digital
- techno

#### Y2K Kawaii
Аудитория:

- cute/kawaii creators
- Bratz/Barbie-inspired audience
- feminine pop aesthetics

Вкус:

- bubble
- cute
- pink
- glossy
- kawaii

#### Y2K Grunge
Аудитория:

- alternative
- emo
- skater
- rock

Вкус:

- grunge
- distressed
- gothic
- emo
- punk

#### Y2K Pixel
Аудитория:

- retro internet
- pixel creators
- vaporwave audience

Вкус:

- pixel
- Windows 98
- vaporwave
- old web
- arcade

---

# 3. 10 НОВЫХ коллекций Artify Studio

Это новые коллекции, которых не было в исходных 20.

---

## NEW #1 — Western Cowgirl SVG

```text
/svg/western-cowgirl
```

### Один покупатель

Cricut/POD creators, которые делают western/cowgirl merchandise.

### Варианты вкуса

- vintage western
- pink cowgirl
- western gothic
- boho western
- rodeo
- rustic ranch
- cowboy
- desert western

### Почему стоит запускать

Western уже присутствует среди популярных поисковых направлений Creative Fabrica, а сама коллекция имеет очень понятный Pinterest-визуал.

**Приоритет: 🔥🔥🔥🔥🔥**

---

## NEW #2 — Cottagecore Garden Cliparts

```text
/cliparts/cottagecore-garden
```

### Один покупатель

Creators, работающие с cottagecore/garden aesthetic.

### Варианты

- romantic cottagecore
- vintage botanical
- whimsical garden
- dark cottagecore
- soft watercolor
- herb garden
- wildflower garden

**Приоритет: 🔥🔥🔥🔥🔥**

---

## NEW #3 — Laser-Cut Bookmarks

```text
/laser-cut/bookmarks
```

### Один покупатель

Creators, которые делают физические laser-cut bookmarks.

### Варианты

- floral
- gothic
- book lover
- botanical
- fantasy
- animal
- layered
- personalized

### Почему интересно

Здесь очень конкретный product/use case, поэтому коллекция потенциально сильнее широкой категории `laser cut`.

**Приоритет: 🔥🔥🔥🔥**

---

## NEW #4 — Witchy / Occult Cliparts

```text
/cliparts/witchy-occult
```

### Один покупатель

Creators в witchy / mystical / occult aesthetic.

### Варианты

- witchcore
- gothic
- dark feminine
- celestial
- vintage occult
- cottage witch
- moon & stars
- mystical

### Pinterest-связка

Особенно хорошо сочетается с направлениями Pinterest Predicts вроде Mystic Outlands, Vamp Romantic и Extra Celestial.

**Приоритет: 🔥🔥🔥🔥**

---

## NEW #5 — Streetwear Mockups

```text
/mockups/streetwear
```

### Один покупатель

Streetwear/fashion brand owners.

### Варианты

- Y2K streetwear
- grunge
- hip-hop
- luxury streetwear
- vintage
- minimalist
- gothic
- oversized

### Важность

Это правильная замена широкой нише `apparel mockups`.

**Приоритет: 🔥🔥🔥🔥**

---

## NEW #6 — Teacher / Classroom SVG

```text
/svg/teacher-classroom
```

### Один покупатель

Teachers и creators, делающие classroom merchandise/decor.

### Варианты

- cute teacher
- retro school
- colorful classroom
- minimalist
- boho teacher
- funny teacher
- elementary school
- preschool

### Почему стоит тестировать

В исходных данных Creative Fabrica уже заметны Teacher / School / Back to School как поисковые направления.

**Приоритет: 🔥🔥🔥🔥**

---

## NEW #7 — Pink Coquette Christmas Cliparts

```text
/cliparts/christmas-pink-coquette
```

### Один покупатель

Feminine/cute Christmas creators.

### Варианты

- pink Christmas
- coquette
- bows
- girly
- glam
- soft pink
- cute feminine
- Barbie-style holiday

**Приоритет: 🔥🔥🔥🔥**

---

## NEW #8 — Retro Groovy Fonts

```text
/fonts/retro-groovy
```

### Один покупатель

Creators, которым нужна 60s/70s/psychedelic/groovy typography.

### Варианты

- psychedelic
- disco
- flower power
- funky
- vintage
- colorful retro
- groovy bubble
- retro poster

### Важно

Не объединять эту коллекцию с Y2K. Это отдельный визуальный мир.

**Приоритет: 🔥🔥🔥🔥**

---

## NEW #9 — Book Lover Printables

```text
/printables/book-lover
```

### Один покупатель

Bookish/readers creators и аудитория, создающая printable-продукты вокруг чтения.

### Варианты

- dark academia
- cottagecore
- cozy reading
- colorful
- minimalist
- vintage library
- romantic literature
- book club

**Приоритет: 🔥🔥🔥**

---

## NEW #10 — Handwritten Lettering Fonts

```text
/fonts/handwritten-lettering
```

### Один покупатель

Designers, которым нужна натуральная handwritten typography.

### Варианты

- elegant
- casual
- cute
- messy
- vintage
- feminine
- bold marker
- signature

**Приоритет: 🔥🔥🔥**

---

# 4. Итоговая карта: что реально делать

## A. Сезонные — запускать первыми

```text
/svg/christmas
/fonts/christmas
/cliparts/christmas
/sublimation/christmas
/procreate-brushes/christmas

/tumbler-wraps/christmas
/cliparts/retro-christmas
/fonts/christmas-cricut
/svg/ugly-sweater
/svg/layered-paper
/svg/shadow-box
/svg/fall
/svg/thanksgiving
/procreate-brushes/winter
/digital-planners/2027
/digital-stickers/2027
/svg/funny-christmas
/cliparts/christmas-pink-coquette
```

---

## B. Evergreen — основной фундамент

```text
/svg/wedding
/fonts/wedding
/cliparts/wedding

/cliparts/wildflower
/cliparts/botanical
/cliparts/cottagecore-floral

/svg/cricut-monograms
/procreate-brushes/tattoo-stipple

/cliparts/baby-shower
/svg/baby-shower
/fonts/baby-shower

/mockups/streetwear
/mockups/fitness-apparel
/mockups/baby-apparel
/mockups/bridal-apparel
/mockups/activewear
/mockups/luxury-fashion

/patterns/fabric
/patterns/packaging
/patterns/scrapbooking
/patterns/pod

/svg/christian
/svg/bible-verses
/svg/church

/kdp/journals
/kdp/planners
/kdp/notebooks
/kdp/logbooks
```

---

# 5. Отдельный Trend / Aesthetic слой

```text
/fonts/y2k-cyber
/fonts/y2k-kawaii
/fonts/y2k-grunge
/fonts/y2k-pixel

/fonts/retro-groovy
/svg/western-cowgirl
/cliparts/witchy-occult
/cliparts/cottagecore-garden
```

Это не нужно превращать в одну большую `trends`-категорию.

Каждая коллекция должна иметь самостоятельный Pinterest intent.

---

# 6. Финальный приоритет новых коллекций

| Rank | Collection | URL | Приоритет |
|---:|---|---|---|
| 1 | Western Cowgirl SVG | `/svg/western-cowgirl` | 🔥🔥🔥🔥🔥 |
| 2 | Cottagecore Garden Cliparts | `/cliparts/cottagecore-garden` | 🔥🔥🔥🔥🔥 |
| 3 | Laser-Cut Bookmarks | `/laser-cut/bookmarks` | 🔥🔥🔥🔥 |
| 4 | Witchy / Occult Cliparts | `/cliparts/witchy-occult` | 🔥🔥🔥🔥 |
| 5 | Streetwear Mockups | `/mockups/streetwear` | 🔥🔥🔥🔥 |
| 6 | Teacher / Classroom SVG | `/svg/teacher-classroom` | 🔥🔥🔥🔥 |
| 7 | Pink Coquette Christmas | `/cliparts/christmas-pink-coquette` | 🔥🔥🔥🔥 |
| 8 | Retro Groovy Fonts | `/fonts/retro-groovy` | 🔥🔥🔥🔥 |
| 9 | Book Lover Printables | `/printables/book-lover` | 🔥🔥🔥 |
| 10 | Handwritten Lettering Fonts | `/fonts/handwritten-lettering` | 🔥🔥🔥 |

---

# 7. Что НЕ надо делать

### ❌ Не создавать

```text
/design-bundles
/christmas-bundles
/apparel
/apparel-mockups
/seamless-patterns
/wedding-svg-fonts
/baby-shower-svg-cliparts
/y2k-fonts
```

Причина: такие URL скрывают несколько разных buyer intents внутри одной коллекции.

### ✅ Создавать

```text
/mockups/streetwear
/mockups/fitness-apparel
/mockups/baby-apparel

/patterns/fabric
/patterns/packaging
/patterns/pod

/svg/wedding
/fonts/wedding

/cliparts/baby-shower
/svg/baby-shower

/fonts/y2k-cyber
/fonts/y2k-kawaii
/fonts/y2k-grunge
/fonts/y2k-pixel
```

---

# 8. Главный принцип Artify Studio

Pinterest-пин должен отвечать на вопрос:

> **«Я именно тот человек, которому нужна именно эта коллекция?»**

Если ответ **да** — коллекция узкая и правильная.

Если после клика пользователь может оказаться среди товаров для совершенно разных профессий, бизнесов или задач — коллекцию нужно дробить.

Именно поэтому:

**`PRODUCT TYPE + INTEREST/USE CASE + AESTHETIC`**

сильнее, чем просто:

**`THEME + EVERYTHING`**.

Исходный аудит показывает, что самые важные исправления — это `Apparel Mockups`, `Seamless Patterns`, `Wedding SVG & Fonts`, `Baby Shower Cliparts & SVGs`, `Bubble & Y2K Fonts`, а также `Christmas Bundles`: их нужно превратить из широких зон в набор конкретных коллекций.
