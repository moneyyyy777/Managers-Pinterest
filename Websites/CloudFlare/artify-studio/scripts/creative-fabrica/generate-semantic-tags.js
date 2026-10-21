// scripts/creative-fabrica/generate-semantic-tags.js
// ============================================================
// 🧠 ГЕНЕРАТОР СЕМАНТИЧЕСКИХ ТЕГОВ + УМНЫХ ФИЛЬТРОВ (Gemini AI)
// ============================================================
// Два режима:
// 1. Семантические теги — обогащает каждый товар тегами для поиска
// 2. Умные фильтры — ИИ анализирует всю подборку и генерирует
//    идеальные фильтры для Pinterest-аудитории дизайнеров
//
// Запуск: node scripts/creative-fabrica/generate-semantic-tags.js
// ============================================================

import fs from "fs/promises";
import path from "path";
import readline from "readline";

// ⚠️ GEMINI API KEY
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || "";

const PROJECT_ROOT = process.cwd();
const CONTENT_DIR = path.join(PROJECT_ROOT, "content");

// Настройки
const MODEL = "gemini-3.5-flash";
const BATCH_SIZE = 10;
const DELAY_MS = 15000; // 15 секунд для бесплатного ключа (5 RPM)
const MAX_RETRIES = 10;  // Количество повторов при ошибке 429/503/fetch failed

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
const askQuestion = (query) => {
    return new Promise(resolve => rl.question(query, ans => { resolve(ans); }));
};

// ============================================================
// 1. Сканирование всех подборок
// ============================================================
async function getAllCollections() {
    const collections = [];
    const categories = (await fs.readdir(CONTENT_DIR, { withFileTypes: true }))
        .filter(d => d.isDirectory() && d.name !== "products");

    for (const cat of categories) {
        const catDir = path.join(CONTENT_DIR, cat.name);
        const cols = (await fs.readdir(catDir, { withFileTypes: true }))
            .filter(d => d.isDirectory());

        for (const col of cols) {
            const allProductsFile = path.join(catDir, col.name, "all_products.json");
            try {
                await fs.access(allProductsFile);
                const data = JSON.parse(await fs.readFile(allProductsFile, "utf8"));
                collections.push({
                    category: cat.name,
                    collection: col.name,
                    path: allProductsFile,
                    productCount: data.length,
                    withSemantic: data.filter(p => p.semanticTags && p.semanticTags.length > 0).length,
                });
            } catch {}
        }
    }
    return collections;
}

// ============================================================
// 2. Вызов Gemini API с автоматическим ретраем
// ============================================================
async function callGemini(prompt) {
    if (GEMINI_API_KEY === "YOUR_API_KEY_HERE") {
        throw new Error(
            "❌ API ключ не указан! Вставьте ваш Gemini API Key в переменную GEMINI_API_KEY\n" +
            "   Получить бесплатный ключ: https://aistudio.google.com/apikey"
        );
    }

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${GEMINI_API_KEY}`;

    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
        try {
            const response = await fetch(url, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: prompt }] }],
                    generationConfig: {
                        temperature: 0.1,
                        maxOutputTokens: 8192,
                    }
                }),
                signal: AbortSignal.timeout(60000) // 🔥 ТАЙМАУТ 60 СЕКУНД
            });

            if (response.status === 429 || response.status === 503) {
                const retryAfter = response.status === 429 ? 20000 : 10000;
                console.log(`    ⏳ Лимит API, жду ${retryAfter / 1000}с (попытка ${attempt}/${MAX_RETRIES})...`);
                await new Promise(r => setTimeout(r, retryAfter));
                continue;
            }

            if (!response.ok) {
                const err = await response.text();
                throw new Error(`Gemini API error ${response.status}: ${err}`);
            }

            const result = await response.json();
            return result.candidates?.[0]?.content?.parts?.[0]?.text || "";
        } catch (e) {
            if (attempt === MAX_RETRIES) throw e;
            if (e.message.includes("API ключ")) throw e;
            console.log(`    ⏳ Ошибка сети, повтор через 10с (попытка ${attempt}/${MAX_RETRIES})...`);
            await new Promise(r => setTimeout(r, 10000));
        }
    }
}

// ============================================================
// 3. ПРОМПТ для семантических тегов (Pinterest-аудитория)
// ============================================================
async function generateSemanticTagsBatch(products, categoryName, collectionName) {
    const productList = products.map((p, i) => {
        const desc = (p.description || "").replace(/Click here and download.*?✓/i, "").trim();
        return `[${i}] "${p.title}"${desc ? ` — ${desc.slice(0, 200)}` : ""}`;
    }).join("\n");

    const prompt = `Ты — эксперт по тегированию цифровых дизайн-ассетов для маркетплейса.
Наш сайт — это витрина для аудитории Pinterest: дизайнеры, крафтеры, мамы-блогеры, мастера Etsy, создатели принтов на футболки/кружки/стикеры.

Категория: ${categoryName}
Подборка: ${collectionName}

Для КАЖДОГО товара ниже сгенерируй ВСЕ максимально подходящие теги (от 10 до 30 штук). Не ограничивай себя — чем больше точных тегов, тем лучше работает поиск.

ОБЯЗАТЕЛЬНЫЕ КАТЕГОРИИ ТЕГОВ:

1. БУКВАЛЬНО: Что это за продукт (clipart, watercolor, brush, font, pattern, bundle)
2. ОБЪЕКТЫ И ПЕРСОНАЖИ: Все изображённые предметы, животные, персонажи (deer, snowman, roses, gnome, unicorn)
3. ТЕМЫ И АССОЦИАЦИИ: Более широкие понятия, которые пользователь мог бы искать (forest, woodland, nature, nursery, fairytale)
4. СТИЛЬ И ТЕХНИКА: Художественный стиль (vintage, boho, kawaii, minimalist, retro, hand drawn, watercolor, pastel)
5. ЦВЕТА И ПАЛИТРА: Основные цвета и цветовые схемы (pink, blue, pastel, earth tones, neon, gold, blush, neutral)
6. ПРИМЕНЕНИЕ: Для чего покупатель это будет использовать (t-shirt print, mug design, sticker, wedding invitation, baby shower, card, sublimation, cricut)
7. АУДИТОРИЯ: Для кого предназначен дизайн (kids, women, men, baby, toddler, teen, couple)
8. СЕЗОН И НАСТРОЕНИЕ: Сезонные или эмоциональные ассоциации (cozy, festive, romantic, playful, elegant, whimsical)

КРИТИЧЕСКИ ВАЖНЫЕ ПРАВИЛА:

▸ ПРАВИЛО ПРОТИВОПОЛОЖНОСТЕЙ: Если товар явно предназначен для конкретного пола/возраста — ОБЯЗАТЕЛЬНО добавь уточняющий тег.
  Примеры: "baby boy" → добавь теги "boy", "for boys", "blue", "masculine"
           "baby girl" → добавь теги "girl", "for girls", "pink", "feminine"
  Это НЕ значит, что нужно добавлять "girl" к товару для мальчиков. Это значит: точно указывай, для кого этот конкретный товар.

▸ ПРАВИЛО СИНОНИМОВ: Для каждого ключевого объекта добавь 2-3 синонима и связанных понятия.
  Пример: "deer" → также добавь "reindeer", "woodland", "forest animal", "nature"
  Пример: "gnome" → также добавь "dwarf", "garden gnome", "fantasy", "fairy tale"

▸ ПРАВИЛО PINTEREST: Думай как пользователь Pinterest, который ищет идеи. Они вводят:
  - Общие запросы: "cute animals", "christmas ideas", "baby shower"
  - Стилевые: "boho nursery", "vintage christmas", "pastel aesthetic"
  - По применению: "printable wall art", "planner stickers", "sublimation design"

▸ Теги ТОЛЬКО на английском, lowercase, одно слово или фраза из 2-3 слов
▸ НЕ включай бессмысленные слова: "graphic", "digital", "download", "png", "high quality", "creative fabrica"

Товары:
${productList}

Ответь СТРОГО валидным JSON массивом без markdown-обёрток, без бэктиков:
[
  {"index": 0, "tags": ["tag1", "tag2", "tag3", "..."]},
  {"index": 1, "tags": ["tag1", "tag2", "tag3", "..."]}
]`;

    const raw = await callGemini(prompt);

    if (!raw) {
        console.error(`  ⚠️ Пустой ответ от Gemini (возможно, сработал фильтр безопасности)`);
        return [];
    }

    try {
        const cleaned = raw.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim();
        const parsed = JSON.parse(cleaned);
        return parsed;
    } catch (e) {
        console.error(`  ⚠️ Не удалось распарсить ответ Gemini:`, String(raw).slice(0, 200));
        return [];
    }
}

// ============================================================
// 4. ПРОМПТ для генерации умных ФИЛЬТРОВ через ИИ
// ============================================================
async function generateSmartFilters(collectionInfo) {
    const { category, collection, path: filePath } = collectionInfo;
    const data = JSON.parse(await fs.readFile(filePath, "utf8"));

    const titles = data.map(p => p.title).join("\n");
    const allTags = data.flatMap(p => p.semanticTags || []);
    const uniqueTags = [...new Set(allTags)].join(", ");

    const prompt = `Ты — эксперт по UX и конверсии для маркетплейса дизайн-ассетов.
Наша аудитория — пользователи Pinterest: дизайнеры, крафтеры, мастера Etsy, создатели принтов (sublimation, Cricut, футболки, кружки, стикеры).

Я даю тебе список товаров из подборки "${collection}" в категории "${category}".
Твоя задача — создать ИДЕАЛЬНЫЕ фильтры для этой подборки, которые максимизируют конверсию (клик → покупка).

НАЗВАНИЯ ТОВАРОВ:
${titles}

${uniqueTags ? `СЕМАНТИЧЕСКИЕ ТЕГИ (собраны ИИ ранее):\n${uniqueTags}` : ""}

ПРАВИЛА СОЗДАНИЯ ФИЛЬТРОВ:

1. КОЛИЧЕСТВО: от 4 до 12 фильтров. Не бойся делать много, если подборка разнообразная.

2. ЛОГИКА ГРУППИРОВКИ И ЗАПРЕТ НА "&": 
   - СТРОГО ЗАПРЕЩЕНО использовать знак "&" или слово "and" в названии фильтра (например "Wedding & Bridal" или "Watercolor & Gouache" - это ПЛОХО).
   - Если хочется объединить два понятия (A & B), действуй так:
     А) Если одно понятие шире и полностью поглощает второе (как Wedding поглощает Bridal), оставь только ОДНО более широкое слово: "Wedding".
     Б) Если это два независимых понятия (как Ghibli и Fantasy, или Watercolor и Gouache), создай ДВА РАЗДЕЛЬНЫХ ФИЛЬТРА: один "Ghibli", другой "Fantasy".
   - МИНИМАЛЬНОЕ КОЛИЧЕСТВО ТОВАРОВ ДЛЯ ФИЛЬТРА:
     А) Для ШИРОКОГО фильтра (например, "Wedding", "Animals", "Floral") — создавай его, если в товарах есть минимум 5 совпадений.
     Б) Для УЗКОЙ НИШИ (например, "Ghibli", "Pixel Art", "Gothic") — создавай отдельный фильтр, даже если есть всего 3 товара.
   - Фильтры должны отвечать на вопрос покупателя: "Для какого ПРОЕКТА мне это нужно?"
   - Хорошие фильтры: "Watercolor", "Vintage", "For Boys", "For Girls", "Animals", "Wedding", "Ghibli"
   - Плохие фильтры: "Cute" (слишком размыто), "PNG" (формат, не стиль)

3. ПРАВИЛО ПРОТИВОПОЛОЖНОСТЕЙ: Если в подборке есть товары для конкретного пола/группы — ОБЯЗАТЕЛЬНО создай парные фильтры:
   - Есть "для мальчиков" → создай И "For Boys" И "For Girls" (даже если товаров для девочек пока мало)
   - Есть "зимние" → создай И "Winter" И "Summer" (если есть хоть намёк)

4. КАЖДЫЙ ФИЛЬТР должен содержать массив keywords — все слова и фразы, по которым товар попадает в этот фильтр.
   КРИТИЧЕСКИ ВАЖНО: каждое keyword добавляй И в единственном, И во множественном числе!
   "Florals" → keywords: ["floral", "florals", "flower", "flowers", "bouquet", "bouquets", "botanical", "botanicals"]

5. РЕКОМЕНДАЦИИ ПО ДОПОЛНЕНИЮ: Если какой-то фильтр получился с менее чем 3 товарами — всё равно создавай его, но добавь поле "recommendation" с советом, какие товары стоит добавить.

Ответь СТРОГО валидным JSON без markdown-обёрток:
{
  "filters": [
    {
      "id": "watercolor",
      "label": "Watercolor",
      "keywords": ["watercolor", "aquarelle"],
      "estimatedCount": 12,
      "recommendation": null
    },
    {
      "id": "for-boys",
      "label": "For Boys",
      "keywords": ["boy", "boys", "masculine", "blue"],
      "estimatedCount": 2,
      "recommendation": "Добавьте ещё 3-5 товаров для мальчиков: машинки, динозавры, космос, супергерои"
    }
  ]
}`;

    console.log(`  🎯 [${category}/${collection}] — генерирую умные фильтры через ИИ...`);

    const raw = await callGemini(prompt);
    const result = { filters: [], recommendations: [] };

    if (!raw) {
        console.error(`  ⚠️ Пустой ответ от Gemini (фильтры)`);
        return result;
    }

    try {
        const cleaned = raw.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim();
        const parsed = JSON.parse(cleaned);

        if (!parsed.filters || !Array.isArray(parsed.filters)) {
            console.error(`  ⚠️ Неверный формат ответа`);
            return result;
        }

        const filtersPath = path.join(path.dirname(filePath), "filters.json");
        const filtersForSite = parsed.filters.map(f => ({
            id: f.id,
            label: f.label,
            keywords: f.keywords
        }));
        await fs.writeFile(filtersPath, JSON.stringify(filtersForSite, null, 2), "utf8");

        console.log(`  ✅ Создано ${parsed.filters.length} фильтров:`);
        for (const f of parsed.filters) {
            const countStr = f.estimatedCount !== undefined ? ` (~${f.estimatedCount} товаров)` : "";
            console.log(`     • ${f.label}${countStr}`);
            if (f.recommendation) {
                console.log(`       💡 ${f.recommendation}`);
                result.recommendations.push({ label: f.label, text: f.recommendation });
            }
        }
        
        result.filters = parsed.filters;
        return result;
    } catch (e) {
        console.error(`  ⚠️ Не удалось распарсить ответ:`, raw.slice(0, 300));
        return result;
    }
}

// ============================================================
// 5. Обработка одной подборки (семантические теги)
// ============================================================
async function processCollection(collectionInfo, mode) {
    const { category, collection, path: filePath } = collectionInfo;
    const data = JSON.parse(await fs.readFile(filePath, "utf8"));

    let toProcess;
    if (mode === "all") {
        toProcess = data.map((p, i) => ({ product: p, index: i }));
    } else {
        toProcess = data
            .map((p, i) => ({ product: p, index: i }))
            .filter(({ product }) => !product.semanticTags || product.semanticTags.length === 0);
    }

    if (toProcess.length === 0) {
        console.log(`  ✅ [${category}/${collection}] — все ${data.length} товаров уже имеют семантику, пропускаем`);
        return 0;
    }

    console.log(`  🧠 [${category}/${collection}] — обрабатываем ${toProcess.length} из ${data.length} товаров...`);

    let processed = 0;

    for (let i = 0; i < toProcess.length; i += BATCH_SIZE) {
        const batch = toProcess.slice(i, i + BATCH_SIZE);
        const batchProducts = batch.map(b => b.product);

        try {
            const results = await generateSemanticTagsBatch(batchProducts, category, collection);

            for (const result of results) {
                if (result && result.tags && Array.isArray(result.tags)) {
                    const originalIndex = batch[result.index]?.index;
                    if (originalIndex !== undefined) {
                        data[originalIndex].semanticTags = result.tags;
                        processed++;
                    }
                }
            }

            const batchNum = Math.floor(i / BATCH_SIZE) + 1;
            const totalBatches = Math.ceil(toProcess.length / BATCH_SIZE);
            console.log(`    📦 Батч ${batchNum}/${totalBatches}: +${results.length} товаров обогащено`);

        } catch (e) {
            console.error(`    ❌ Ошибка батча: ${e.message}`);
            if (e.message.includes("API ключ")) throw e;
        }

        if (i + BATCH_SIZE < toProcess.length) {
            await new Promise(r => setTimeout(r, DELAY_MS));
        }
    }

    // Сохраняем
    await fs.writeFile(filePath, JSON.stringify(data, null, 2), "utf8");

    // Обновляем индивидуальные JSON
    const productsDir = path.join(path.dirname(filePath), "products");
    try {
        for (const product of data) {
            if (product.semanticTags && product.slug) {
                const productFile = path.join(productsDir, `${product.slug}.json`);
                try {
                    const productData = JSON.parse(await fs.readFile(productFile, "utf8"));
                    productData.semanticTags = product.semanticTags;
                    await fs.writeFile(productFile, JSON.stringify(productData, null, 2), "utf8");
                } catch {}
            }
        }
    } catch {}

    console.log(`  ✅ [${category}/${collection}] — обогащено ${processed} товаров семантическими тегами`);
    return processed;
}

// ============================================================
// 6. Главная функция
// ============================================================
async function main() {
    console.log(`\n╔══════════════════════════════════════════════════════╗`);
    console.log(`║  🧠 ГЕНЕРАТОР СЕМАНТИКИ + УМНЫХ ФИЛЬТРОВ (Gemini AI) ║`);
    console.log(`║  Pinterest-аудитория · Дизайнеры · Etsy-крафтеры     ║`);
    console.log(`╚══════════════════════════════════════════════════════╝\n`);

    const collections = await getAllCollections();

    if (collections.length === 0) {
        console.log("❌ Подборки не найдены в content/");
        process.exit(1);
    }

    // Таблица
    console.log(`📋 Найдено ${collections.length} подборок:\n`);
    console.log(`   №  | Категория/Подборка                    | Товаров | С тегами`);
    console.log(`   ---|---------------------------------------|---------|----------`);
    collections.forEach((c, i) => {
        const name = `${c.category}/${c.collection}`.padEnd(37);
        const count = String(c.productCount).padStart(5);
        const withSem = c.withSemantic === c.productCount
            ? `  ✅ все`
            : c.withSemantic > 0
                ? `  ${c.withSemantic}/${c.productCount}`
                : `  ❌ нет`;
        console.log(`   ${String(i + 1).padStart(2)} | ${name} | ${count}   | ${withSem}`);
    });

    const totalProducts = collections.reduce((a, c) => a + c.productCount, 0);
    const totalWithSemantic = collections.reduce((a, c) => a + c.withSemantic, 0);
    console.log(`\n   Всего: ${totalProducts} товаров, из них ${totalWithSemantic} уже обогащены.\n`);

    // Меню
    console.log(`   ═══════════════════════════════════════`);
    console.log(`   РЕЖИМЫ РАБОТЫ:`);
    console.log(`   ═══════════════════════════════════════`);
    console.log(`   [1] 🏷️  Семантические теги (новые) — для ВСЕХ`);
    console.log(`   [2] 🏷️  Семантические теги (пересобрать) — для ВСЕХ`);
    console.log(`   [3] 🏷️  Семантические теги — выбрать подборки`);
    console.log(`   [4] 🎯 Умные ФИЛЬТРЫ через ИИ — для ВСЕХ`);
    console.log(`   [5] 🎯 Умные ФИЛЬТРЫ через ИИ — выбрать подборки`);
    console.log(`   [6] 🚀 ВСЁ СРАЗУ: теги + фильтры для ВСЕХ`);
    console.log(`   [7] 🚀 ВСЁ СРАЗУ: теги + фильтры — выбрать подборки`);
    console.log(`   [0] Выход\n`);

    const choice = await askQuestion(`   Ваш выбор: `);

    let targetCollections = [];
    let doTags = false;
    let doFilters = false;
    let tagMode = "new";

    switch (choice.trim()) {
        case "1":
            targetCollections = collections.filter(c => c.withSemantic < c.productCount);
            doTags = true; tagMode = "new";
            if (targetCollections.length === 0) {
                console.log(`\n✅ Все товары уже обогащены!`);
                process.exit(0);
            }
            break;
        case "2":
            targetCollections = collections;
            doTags = true; tagMode = "all";
            break;
        case "3": {
            const indices = await askQuestion(`   Введите номера через запятую (например: 1,3,5): `);
            const nums = indices.split(",").map(n => parseInt(n.trim()) - 1).filter(n => n >= 0 && n < collections.length);
            targetCollections = nums.map(n => collections[n]);
            doTags = true;
            const subMode = await askQuestion(`   Режим: [1] Только новые  [2] Пересобрать всё: `);
            tagMode = subMode.trim() === "2" ? "all" : "new";
            break;
        }
        case "4":
            targetCollections = collections;
            doFilters = true;
            break;
        case "5": {
            const indices2 = await askQuestion(`   Введите номера через запятую (например: 1,3,5): `);
            const nums2 = indices2.split(",").map(n => parseInt(n.trim()) - 1).filter(n => n >= 0 && n < collections.length);
            targetCollections = nums2.map(n => collections[n]);
            doFilters = true;
            break;
        }
        case "6":
            targetCollections = collections;
            doTags = true; doFilters = true; tagMode = "new";
            break;
        case "7": {
            const indices3 = await askQuestion(`   Введите номера через запятую (например: 1,3,5): `);
            const nums3 = indices3.split(",").map(n => parseInt(n.trim()) - 1).filter(n => n >= 0 && n < collections.length);
            targetCollections = nums3.map(n => collections[n]);
            doTags = true; doFilters = true; 
            const subMode3 = await askQuestion(`   Режим: [1] Только новые  [2] Пересобрать всё: `);
            tagMode = subMode3.trim() === "2" ? "all" : "new";
            break;
        }
        default:
            console.log("👋 Выход.");
            process.exit(0);
    }

    if (targetCollections.length === 0) {
        console.log("❌ Не выбрано ни одной подборки.");
        process.exit(1);
    }

    // Оценка
    if (doTags) {
        const toProcessCount = tagMode === "all"
            ? targetCollections.reduce((a, c) => a + c.productCount, 0)
            : targetCollections.reduce((a, c) => a + (c.productCount - c.withSemantic), 0);
        const estimatedBatches = Math.ceil(toProcessCount / BATCH_SIZE);
        console.log(`\n📊 Семантические теги: ${toProcessCount} товаров, ~${estimatedBatches} запросов`);
    }
    if (doFilters) {
        console.log(`📊 Умные фильтры: ${targetCollections.length} подборок, ~${targetCollections.length} запросов`);
    }

    const confirm = await askQuestion(`\n   Начать? (y/N): `);
    if (!["y", "yes", "да", "1"].includes(confirm.trim().toLowerCase())) {
        console.log("👋 Отменено.");
        process.exit(0);
    }

    const startTime = Date.now();

    // --- ЭТАП 1: Семантические теги ---
    if (doTags) {
        console.log(`\n${"═".repeat(50)}`);
        console.log(`🏷️  ЭТАП 1: ГЕНЕРАЦИЯ СЕМАНТИЧЕСКИХ ТЕГОВ`);
        console.log(`${"═".repeat(50)}\n`);

        let totalProcessed = 0;
        for (const col of targetCollections) {
            try {
                const processed = await processCollection(col, tagMode);
                totalProcessed += processed;
            } catch (e) {
                console.error(`\n❌ Критическая ошибка: ${e.message}`);
                process.exit(1);
            }
        }
        console.log(`\n✅ Обогащено ${totalProcessed} товаров семантикой`);
    }

    // --- ЭТАП 2: Умные фильтры ---
    if (doFilters) {
        console.log(`\n${"═".repeat(50)}`);
        console.log(`🎯 ЭТАП 2: ГЕНЕРАЦИЯ УМНЫХ ФИЛЬТРОВ (ИИ)`);
        console.log(`${"═".repeat(50)}\n`);

        let allRecommendations = [];

        for (const col of targetCollections) {
            try {
                const res = await generateSmartFilters(col);
                if (res && res.recommendations && res.recommendations.length > 0) {
                    allRecommendations.push({
                        collection: `${col.category}/${col.collection}`,
                        recs: res.recommendations
                    });
                }
            } catch (e) {
                console.error(`  ❌ Ошибка: ${e.message}`);
            }
            // Задержка между коллекциями
            await new Promise(r => setTimeout(r, DELAY_MS));
        }

        // Сохраняем рекомендации в Markdown файл
        if (allRecommendations.length > 0) {
            const dateStr = new Date().toLocaleDateString("ru-RU");
            let mdContent = `# 💡 Рекомендации ИИ по расширению ассортимента (от ${dateStr})\n\n`;
            mdContent += `*Сгенерировано на основе анализа текущих товаров на сайте и трендов Pinterest.*\n\n`;

            for (const item of allRecommendations) {
                mdContent += `## 📁 ${item.collection}\n`;
                for (const rec of item.recs) {
                    mdContent += `- **${rec.label}**: ${rec.text}\n`;
                }
                mdContent += `\n`;
            }

            const mdPath = path.join(CONTENT_DIR, "AI_RECOMMENDATIONS.md");
            
            // Если файл существует, дописываем в начало (после заголовка) или просто перезаписываем. 
            // Для чистоты будем каждый раз создавать новый файл с датой или перезаписывать текущий.
            await fs.writeFile(mdPath, mdContent, "utf8");
            console.log(`\n📄 Все рекомендации сохранены в файл: content/AI_RECOMMENDATIONS.md`);
        }
    }

    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);

    console.log(`\n╔══════════════════════════════════════════════════╗`);
    console.log(`║  ✅ ГЕНЕРАЦИЯ ЗАВЕРШЕНА!                          ║`);
    console.log(`║  Время: ${String(elapsed + "с").padEnd(40)}║`);
    console.log(`╚══════════════════════════════════════════════════╝\n`);

    console.log(`💡 Теперь пересоберите сайт: ASTRO_TELEMETRY_DISABLED=1 npm run build`);
    process.exit(0);
}

main();
