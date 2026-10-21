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
import { chromium } from "playwright";

// ⚠️ GEMINI API KEY
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || "";

const PROJECT_ROOT = process.cwd();
const CONTENT_DIR = path.join(PROJECT_ROOT, "content");

// Настройки
const MODEL = "gemini-3.5-flash";
const BATCH_SIZE = 40;
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
let aiBrowser = null;
let aiContext = null;

async function callGemini(prompt, jsonFilePath = null) {
    if (!aiBrowser) {
        aiBrowser = await chromium.connectOverCDP('http://localhost:9222');
        aiContext = aiBrowser.contexts()[0];
    }
    
    let page = aiContext.pages().find(p => p.url().includes("aistudio"));
    if (!page) {
        page = await aiContext.newPage();
    }
    
    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
        try {
            // Автоматически закрываем любые всплывающие диалоги (например, "Leave site?")
            page.removeAllListeners("dialog");
            page.on("dialog", async (dialog) => {
                try { await dialog.accept(); } catch(e) {}
            });

            await page.goto("https://aistudio.google.com/app/prompts/new_chat", { waitUntil: "domcontentloaded", timeout: 35000 });
            
            // Если передан JSON файл — прикрепляем его как в ai_auto_content_filler_UI.py
            if (jsonFilePath) {
                try {
                    const fileInput = page.locator('input[type="file"]').first();
                    await fileInput.setInputFiles(jsonFilePath);
                    await page.waitForTimeout(2500);
                } catch(fileErr) {
                    console.log(`    ⚠️ Ошибка прикрепления файла: ${fileErr.message}`);
                }
            }

            // Ждем появления поля ввода (textarea)
            const textArea = page.locator("textarea").last();
            await textArea.waitFor({ state: "visible", timeout: 25000 });
            await page.waitForTimeout(1000);
            
            // Заполняем промпт (с отказоустойчивым fallback через DOM)
            try {
                await textArea.fill(prompt, { timeout: 8000 });
            } catch(fillErr) {
                await textArea.click({ force: true }).catch(() => {});
                await page.evaluate((text) => {
                    const el = Array.from(document.querySelectorAll("textarea")).pop();
                    if (el) {
                        el.value = text;
                        el.dispatchEvent(new Event("input", { bubbles: true }));
                        el.dispatchEvent(new Event("change", { bubbles: true }));
                    }
                }, prompt);
            }
            await page.waitForTimeout(500);
            
            // Turn off grounding if visible
            try {
                const groundingSw = page.locator('button[role="switch"][aria-label*="Grounding with Google Search"]');
                if (await groundingSw.isVisible({timeout: 500}) && await groundingSw.getAttribute("aria-checked") === "true") {
                    await groundingSw.click();
                    await page.waitForTimeout(300);
                }
            } catch(e) {}
            
            // Try to click run button
            try {
                const clicked = await page.evaluate(() => {
                    const btn = document.querySelector('button[mattooltipclass="run-button-tooltip"]') 
                             || document.querySelector('button.ctrl-enter-submits');
                    if (btn) { btn.click(); return true; }
                    return false;
                });
                if (!clicked) {
                    await page.locator('button[mattooltipclass="run-button-tooltip"]').first().click({force: true});
                }
            } catch(e) {
                await textArea.focus();
                await page.keyboard.press("Meta+Enter");
            }
            
            let prevLen = 0;
            let stableTicks = 0;
            
            for (let i = 0; i < 90; i++) { // Up to 3 minutes
                await page.waitForTimeout(2000);
                const pageText = await page.evaluate(() => document.body.innerText);
                if (pageText.includes("An internal error has occurred") || pageText.includes("Failed to generate content")) {
                    throw new Error("AI Studio выдал внутреннюю ошибку.");
                }
                
                // Ищем уникальный маркер начала
                const startIndex = pageText.lastIndexOf("===START===");
                
                if (startIndex !== -1) {
                    const textAfterStart = pageText.substring(startIndex + 11);
                    // Ищем последнюю закрывающую скобку
                    const lastBrace = Math.max(textAfterStart.lastIndexOf("]"), textAfterStart.lastIndexOf("}"));
                    
                    if (lastBrace !== -1) {
                        const extracted = textAfterStart.substring(0, lastBrace + 1).trim();
                        const currLen = extracted.length;
                        
                        if (currLen > 30 && currLen === prevLen) {
                            stableTicks++;
                            if (stableTicks >= 3) {
                                return extracted;
                            }
                        } else {
                            stableTicks = 0;
                            prevLen = currLen;
                        }
                    }
                }
            }
            throw new Error("Таймаут ожидания ответа AI.");
            
        } catch (e) {
            console.log(`    ⏳ Ошибка Playwright: ${e.message}, повтор через 5с (попытка ${attempt}/${MAX_RETRIES})...`);
            await new Promise(r => setTimeout(r, 5000));
            if (attempt === MAX_RETRIES) throw e;
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
▸ ПРАВИЛО ФОРМЫ СЛОВА: Для ключевых объектов ОБЯЗАТЕЛЬНО добавляй тег И в единственном, И во множественном числе.
  Примеры: "flower" И "flowers", "tree" И "trees", "ornament" И "ornaments", "brush" И "brushes", "pattern" И "patterns"
  Это критически важно для работы нашего поисковика!
▸ КОРОТКИЕ ФИЛЬТР-ТЕГИ: Обязательно добавляй 3-5 коротких (1 слово) тегов, которые совпадают с типичными поисковыми фильтрами: стиль (vintage, boho, kawaii), тема (christmas, wedding, baby), техника (watercolor, pencil, stamp)
▸ НЕ включай бессмысленные слова: "graphic", "digital", "download", "png", "high quality", "creative fabrica"

Товары:
${productList}

ОБЯЗАТЕЛЬНОЕ ТРЕБОВАНИЕ К ФОРМАТУ:
Перед началом JSON напиши маркер, состоящий из трех знаков равно, слова START и трех знаков равно. 
В конце напиши маркер из трех знаков равно, слова END и трех знаков равно.
Между этими маркерами должен быть только чистый JSON-массив, где каждый объект имеет поля "index" (число, соответствующее номеру товара из списка) и "tags" (массив строк).
Пример:
[
  { "index": 0, "tags": ["tag1", "tag2"] },
  { "index": 1, "tags": ["tag3", "tag4"] }
]`;

    const raw = await callGemini(prompt);

    if (!raw) {
        console.error(`  ⚠️ Пустой ответ от Gemini (возможно, сработал фильтр безопасности)`);
        return [];
    }

    try {
        const cleaned = raw.replace(/\`\`\`json\s*/g, "").replace(/```\s*/g, "").trim();
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

    const prompt = `Ты — эксперт по UX, мерчандайзингу и конверсии для крупного маркетплейса дизайн-ассетов и всех материалов для дизайна и творчества.
Наша аудитория приходит с Pinterest. Это ОЧЕНЬ РАЗНАЯ аудитория всех возрастов и интересов: профессиональные дизайнеры, веб дизайнеры, иллюстраторы, любители, крафтеры, мастера Etsy, преподаватели, мамы в декрете, владельцы малого бизнеса и многие другие.

Я прикрепил к этому сообщению JSON-файл со ВСЕМИ ${data.length} товарами из подборки "${collection}" (категория "${category}").
Твоя задача — внимательно изучить ВСЕ товары в прикрепленном файле, "нырнуть" вглубь этой тематики/ниши, проанализировать суть товаров и создать ИДЕАЛЬНЫЕ фильтры, чтобы ЛЮБОЙ человек (с любой потребностью) легко нашел своё.

ПРАВИЛА СОЗДАНИЯ ФИЛЬТРОВ:

1. ГЛУБИНА И РАЗНООБРАЗИЕ: Создай от 4 до 12 фильтров. Учитывай разные сценарии использования. Если это графика, то для кого она? Для свадеб? Для детских праздников? Для брендинга? Для скрапбукинга?
2. ЛОГИКА ГРУППИРОВКИ И ЗАПРЕТ НА "&": 
   - СТРОГО ЗАПРЕЩЕНО использовать знак "&" или слово "and" в названии фильтра (например "Wedding & Bridal" или "Watercolor & Gouache" - это ПЛОХО).
   - Если хочется объединить два понятия (A & B), действуй так:
     А) Если одно понятие шире и полностью поглощает второе (как Wedding поглощает Bridal), оставь только ОДНО более широкое слово: "Wedding".
     Б) Если это два независимых понятия (как Ghibli и Fantasy, или Watercolor и Gouache), создай ДВА РАЗДЕЛЬНЫХ ФИЛЬТРА: один "Ghibli", другой "Fantasy".
   - МИНИМАЛЬНОЕ КОЛИЧЕСТВО ТОВАРОВ ДЛЯ ФИЛЬТРА:
     А) Для ШИРОКОГО фильтра (например, "Wedding", "Animals", "Floral") — создавай его, если в товарах есть минимум 5 совпадений.
     Б) Для УЗКОЙ НИШИ (например, "Ghibli", "Pixel Art", "Gothic") — создавай отдельный фильтр, даже если есть всего 3 товара.
   - Фильтры должны закрывать реальные "боли" и запросы аудитории Pinterest.
   - Хорошие: "Watercolor", "Vintage", "Nursery", "Wedding", "Dark Academia", "Ghibli"
   - Плохие: "Cute" (слишком размыто), "PNG" (формат, не стиль)
3. ПОЛНОТА АССОРТИМЕНТА И ПУСТЫЕ ФИЛЬТРЫ: 
   Если ты видишь, что в рамках этой ниши (${collection}) очень популярен и отлично продается какой-то стиль/тема (например, в графике это "Boho", в 3D - "Flexi Toys"), но у нас таких товаров МАЛО или НЕТ ВООБЩЕ — **ВСЁ РАВНО СОЗДАЙ ЭТОТ ФИЛЬТР!**
   - Пусть фильтр будет на сайте, чтобы охватить спрос.
   - Обязательно добавь в поле "recommendation" подробный совет о том, что именно нам нужно добавить/создать, так как это хит продаж.
4. КАЖДЫЙ ФИЛЬТР должен содержать массив keywords — все слова и синонимы, по которым товар попадает в этот фильтр.
   КРИТИЧЕСКИ ВАЖНО: каждое keyword добавляй И в единственном, И во множественном числе!
   (Например, "Florals" → ["floral", "florals", "flower", "flowers", "bouquet", "bouquets", "botanical", "botanicals", "rose", "roses"])
   Это обеспечивает 100% попадание товаров в фильтр!
5. ЯЗЫК: Значение поля "label" (название фильтра) должно быть СТРОГО НА АНГЛИЙСКОМ ЯЗЫКЕ! Значение "recommendation" — на русском.
6. ДЛИНА label: Название фильтра должно быть КОРОТКИМ — максимум 1-2 слова. Это нужно для мобильных устройств.
   Хорошо: "Watercolor", "Wedding", "Flexi Toys"
   Плохо: "Watercolor Botanical Illustrations" (слишком длинно!)

ОБЯЗАТЕЛЬНОЕ ТРЕБОВАНИЕ К ФОРМАТУ:
Перед началом JSON напиши маркер, состоящий из трех знаков равно, слова START и трех знаков равно. 
В конце напиши маркер из трех знаков равно, слова END и трех знаков равно.
Между этими маркерами должен быть только чистый JSON-объект с полем "filters" (массив) и полем "recommendations" (массив).
Каждый фильтр: { "id": "kebab-case-id", "label": "Short English Name", "keywords": ["word1", "words1", ...], "recommendation": "..." }
Каждая рекомендация: { "filter": "label фильтра", "text": "подробный совет на русском" }`;

    console.log(`  🎯 [${category}/${collection}] — генерирую умные фильтры через ИИ (прикрепляю JSON с ${data.length} товарами)...`);

    const raw = await callGemini(prompt, filePath);
    const result = { filters: [], recommendations: [] };

    if (!raw) {
        console.error(`  ⚠️ Пустой ответ от Gemini (фильтры)`);
        return result;
    }

    try {
        const cleaned = raw.replace(/\`\`\`json\s*/g, "").replace(/```\s*/g, "").trim();
        const parsed = JSON.parse(cleaned);

        if (!parsed.filters || !Array.isArray(parsed.filters)) {
            console.error(`  ⚠️ Неверный формат ответа`);
            return result;
        }

        const filtersPath = path.join(path.dirname(filePath), "filters.json");
        const filtersForSite = parsed.filters.map(f => ({
            id: f.id,
            label: f.label || f.name,
            keywords: f.keywords
        }));
        await fs.writeFile(filtersPath, JSON.stringify(filtersForSite, null, 2), "utf8");

        console.log(`  ✅ Создано ${parsed.filters.length} фильтров:`);
        for (const f of parsed.filters) {
            const countStr = f.estimatedCount !== undefined ? ` (~${f.estimatedCount} товаров)` : "";
            const displayLabel = f.label || f.name;
            console.log(`     • ${displayLabel}${countStr}`);
            if (f.recommendation) {
                console.log(`       💡 ${f.recommendation}`);
                result.recommendations.push({ label: displayLabel, text: f.recommendation });
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

    const MIN_PRODUCTS = 50;

    switch (choice.trim()) {
        case "1":
            targetCollections = collections.filter(c => c.withSemantic < c.productCount && c.productCount >= MIN_PRODUCTS);
            doTags = true; tagMode = "new";
            if (targetCollections.length === 0) {
                console.log(`\n✅ Все товары уже обогащены (или подборки слишком маленькие < ${MIN_PRODUCTS} товаров)!`);
                process.exit(0);
            }
            break;
        case "2":
            targetCollections = collections.filter(c => c.productCount >= MIN_PRODUCTS);
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
            targetCollections = collections.filter(c => c.productCount >= MIN_PRODUCTS);
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
            targetCollections = collections.filter(c => c.productCount >= MIN_PRODUCTS);
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
            
            let existingContent = "";
            try {
                existingContent = await fs.readFile(mdPath, "utf8");
            } catch(e) {}
            
            if (existingContent) {
                // Убираем заголовок из mdContent, если он уже есть в файле, и просто дописываем
                const newRecs = mdContent.replace(/^# .*\n\n.*\n\n/, ""); 
                await fs.writeFile(mdPath, existingContent + "\n" + newRecs, "utf8");
            } else {
                await fs.writeFile(mdPath, mdContent, "utf8");
            }
            console.log(`\n📄 Рекомендации добавлены в файл: content/AI_RECOMMENDATIONS.md`);
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
