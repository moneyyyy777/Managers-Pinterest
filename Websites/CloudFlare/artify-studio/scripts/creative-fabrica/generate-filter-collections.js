import fs from "fs/promises";
import path from "path";
import readline from "readline";

const PROJECT_ROOT = process.cwd();
const CONTENT_DIR = path.join(PROJECT_ROOT, "content");

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
const lineQueue = [];
let pendingResolve = null;

rl.on("line", (line) => {
    if (pendingResolve) {
        const resolve = pendingResolve;
        pendingResolve = null;
        resolve(line);
    } else {
        lineQueue.push(line);
    }
});

rl.on("close", () => {
    if (pendingResolve) {
        const resolve = pendingResolve;
        pendingResolve = null;
        resolve("");
    }
});

const askQuestion = (query) => {
    process.stdout.write(query);
    if (lineQueue.length > 0) {
        return Promise.resolve(lineQueue.shift());
    }
    if (rl.closed) {
        return Promise.resolve("");
    }
    return new Promise(resolve => {
        pendingResolve = resolve;
    });
};

// Простой стемминг для нормализации слов (множественное число и т.д.)
const stem = (word) => word
    .toLowerCase()
    .replace(/ies$/i, 'y')
    .replace(/(ses|ches|shes|xes|zes)$/i, (m) => m.slice(0, -2))
    .replace(/([^s])s$/i, '$1');

// Проверка совпадения товара с правилами фильтра
function matchProductToFilter(product, filter) {
    if (!product || !filter || !Array.isArray(filter.keywords)) return false;

    const titleLower = (product.title || "").toLowerCase();
    const tagsLower = Array.isArray(product.semanticTags) ? product.semanticTags.join(" ").toLowerCase() : "";
    const rawTagsLower = Array.isArray(product.tags) ? product.tags.join(" ").toLowerCase() : "";
    const breadcrumbsLower = Array.isArray(product.breadcrumbs) ? product.breadcrumbs.join(" ").toLowerCase() : "";

    const searchString = `${titleLower} ${tagsLower} ${rawTagsLower} ${breadcrumbsLower}`;
    const searchWords = searchString.split(/[\s,.-]+/).filter(w => w.length > 0);
    const searchStemmed = searchWords.map(w => stem(w));

    return filter.keywords.some(kw => {
        const kwLower = kw.toLowerCase().trim();
        if (!kwLower) return false;

        // Если ключевая фраза из нескольких слов — проверяем вхождение целиком
        if (kwLower.includes(' ')) {
            return searchString.includes(kwLower);
        }

        // Если из одного слова — проверяем точное совпадение слова или основы (стемминга)
        const kwStem = stem(kwLower);
        return searchWords.includes(kwLower) || searchStemmed.includes(kwStem);
    });
}

// Генерация случайной проверочной капчи (буквы + цифры)
function generateCaptchaCode() {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let code = "";
    for (let i = 0; i < 5; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return `RESET_${code}`;
}

// Обработка одной подборки
async function processCollectionFilterCollections(category, collection, mode) {
    const collectionDir = path.join(CONTENT_DIR, category, collection);
    const filtersPath = path.join(collectionDir, "filters.json");
    const allProductsPath = path.join(collectionDir, "all_products.json");
    const filterCollectionsDir = path.join(collectionDir, "filter_collections");

    // 1. Проверяем наличие filters.json и all_products.json
    let filters = [];
    let allProducts = [];

    try {
        const filtersRaw = await fs.readFile(filtersPath, "utf8");
        filters = JSON.parse(filtersRaw);
    } catch {
        console.log(`⚠️ В подборке [${category} / ${collection}] нет filters.json. Пропускаем.`);
        return;
    }

    try {
        const productsRaw = await fs.readFile(allProductsPath, "utf8");
        allProducts = JSON.parse(productsRaw);
    } catch {
        console.log(`⚠️ В подборке [${category} / ${collection}] нет all_products.json. Пропускаем.`);
        return;
    }

    if (!Array.isArray(filters) || filters.length === 0) {
        console.log(`ℹ️ filters.json пустой в [${category} / ${collection}]. Пропускаем.`);
        return;
    }

    await fs.mkdir(filterCollectionsDir, { recursive: true });

    console.log(`\n==================================================`);
    console.log(`🗂️  ПОДБОРКА: ${category} / ${collection} (${allProducts.length} товаров, ${filters.length} фильтров)`);
    console.log(`==================================================`);

    const validProductSlugs = new Set(allProducts.map(p => p.slug));

    // 2. Проходимся по каждому фильтру
    for (const filter of filters) {
        const filterId = filter.id;
        const filterFilePath = path.join(filterCollectionsDir, `${filterId}.json`);

        let existingData = {
            filterId: filterId,
            label: filter.label || filterId,
            items: [],
            excludedItems: []
        };

        let fileExists = false;
        try {
            const raw = await fs.readFile(filterFilePath, "utf8");
            existingData = { ...existingData, ...JSON.parse(raw) };
            fileExists = true;
        } catch {
            fileExists = false;
        }

        // Находим все товары, которые сейчас подходят под правила фильтра
        const matchedProducts = allProducts.filter(p => matchProductToFilter(p, filter));
        const matchedSlugs = matchedProducts.map(p => p.slug);

        if (mode === "reset" || !fileExists) {
            // Режим сброса или первый запуск: чистое заполнение
            const cleanItems = matchedSlugs;
            existingData.items = cleanItems;
            existingData.excludedItems = [];
            existingData.updatedAt = new Date().toISOString();

            await fs.writeFile(filterFilePath, JSON.stringify(existingData, null, 2), "utf8");
            console.log(`  ✨ [${filter.label || filterId}]: Сгенерировано с нуля (${cleanItems.length} товаров).`);
        } else {
            // Режим SMART MERGE (как в Git): сохраняем все ручные наработки!
            const currentItems = Array.isArray(existingData.items) ? existingData.items : [];
            const excludedSet = new Set(Array.isArray(existingData.excludedItems) ? existingData.excludedItems : []);

            // 1. Очищаем текущий список от товаров, которые были полностью удалены из каталога
            const preservedItems = currentItems.filter(slug => validProductSlugs.has(slug));

            // 2. Находим НОВЫЕ товары, которых еще нет в списке и которые человек вручную не удалял (не в excluded)
            const currentItemsSet = new Set(preservedItems);
            const newSlugsToAdd = [];

            for (const slug of matchedSlugs) {
                if (!currentItemsSet.has(slug) && !excludedSet.has(slug)) {
                    newSlugsToAdd.push(slug);
                }
            }

            // 3. Аккуратно добавляем новые товары В КОНЕЦ списка (не ломая порядок верхушки!)
            const finalItems = [...preservedItems, ...newSlugsToAdd];

            existingData.items = finalItems;
            existingData.label = filter.label || existingData.label || filterId;
            existingData.updatedAt = new Date().toISOString();

            await fs.writeFile(filterFilePath, JSON.stringify(existingData, null, 2), "utf8");

            if (newSlugsToAdd.length > 0) {
                console.log(`  🔄 [${filter.label || filterId}]: Сохранен порядок (${preservedItems.length} шт.) + добавлено ${newSlugsToAdd.length} новых товаров в конец (итого ${finalItems.length}).`);
            } else {
                console.log(`  ✅ [${filter.label || filterId}]: Порядок сохранен без изменений (${finalItems.length} шт.).`);
            }
        }
    }
}

async function main() {
    console.log(`\n==================================================`);
    console.log(`⚡️ ГЕНЕРАТОР СТАТИЧЕСКИХ КОЛЛЕКЦИЙ ФИЛЬТРОВ`);
    console.log(`   - Создает/обновляет папку filter_collections/`);
    console.log(`   - Формирует отдельный JSON под каждый фильтр`);
    console.log(`   - Умный Git-Merge: сохраняет ручной порядок товаров!`);
    console.log(`   - Защита от потери наработок`);
    console.log(`==================================================\n`);

    // 1. Выбор категории
    const entries = await fs.readdir(CONTENT_DIR, { withFileTypes: true });
    const categories = entries.filter(d => d.isDirectory() && d.name !== "products").map(d => d.name);

    console.log(`📁 Доступные категории:`);
    categories.forEach((cat, idx) => console.log(`  [${idx + 1}] ${cat}`));

    const catAns = await askQuestion(`\nВыберите категорию (1-${categories.length}) или нажмите ENTER для ВСЕХ: `);

    let selectedTargets = [];

    if (!catAns.trim()) {
        for (const cat of categories) {
            const catDir = path.join(CONTENT_DIR, cat);
            const cols = (await fs.readdir(catDir, { withFileTypes: true })).filter(d => d.isDirectory()).map(d => d.name);
            for (const col of cols) selectedTargets.push({ category: cat, collection: col });
        }
    } else {
        const catIndex = parseInt(catAns.trim(), 10) - 1;
        const category = categories[catIndex] || categories[0];
        const categoryDir = path.join(CONTENT_DIR, category);
        const collections = (await fs.readdir(categoryDir, { withFileTypes: true })).filter(d => d.isDirectory()).map(d => d.name);

        console.log(`\n🗂️  Доступные подборки в '${category}':`);
        collections.forEach((col, idx) => console.log(`  [${idx + 1}] ${col}`));

        const colAns = await askQuestion(`\nВыберите подборку (1-${collections.length}) или нажмите ENTER для ВСЕХ в этой категории: `);

        if (!colAns.trim()) {
            selectedTargets = collections.map(col => ({ category, collection: col }));
        } else {
            const colIndex = parseInt(colAns.trim(), 10) - 1;
            selectedTargets = [{ category, collection: collections[colIndex] || collections[0] }];
        }
    }

    // 2. Выбор режима: Smart Merge или Сброс с капчей
    console.log(`\n⚙️  Выберите режим обработки:`);
    console.log(`  [1] Умное слияние (Smart Merge) — [РЕКОМЕНДУЕТСЯ]`);
    console.log(`      Сохраняет весь существующий ручной порядок,`);
    console.log(`      добавляет новые товары в конец, не трогает исключенные.`);
    console.log(`  [2] Полный сброс (Hard Reset)`);
    console.log(`      Пересоздает фильтры с нуля по правилам (ТРЕБУЕТСЯ КАПЧА).\n`);

    const modeAns = await askQuestion(`Ваш выбор [1/2] (по умолч. 1): `);
    let mode = "merge";

    if (modeAns.trim() === "2") {
        console.log(`\n⚠️ ВНИМАНИЕ! Вы выбрали ПОЛНЫЙ СБРОС.`);
        console.log(`Все ручные перемещения товаров в фильтрах будут сброшены к автоматическим!\n`);

        const captcha = generateCaptchaCode();
        let passed = false;

        for (let attempt = 1; attempt <= 3; attempt++) {
            console.log(`🔒 Для подтверждения введите проверочный код: \x1b[33m${captcha}\x1b[0m (Попытка ${attempt}/3)`);
            const input = await askQuestion(`Код: `);

            if (input.trim() === captcha) {
                passed = true;
                break;
            } else {
                console.log(`❌ Неверный проверочный код!\n`);
            }
        }

        if (!passed) {
            console.log(`🛑 Вы трижды ошиблись при вводе капчи. Операция отменена в целях безопасности данных!`);
            process.exit(0);
        }

        mode = "reset";
        console.log(`✅ Капча подтверждена. Запускаю полный сброс...\n`);
    } else {
        console.log(`🛡️ Выбран режим Smart Merge (ваши наработки защищены).\n`);
    }

    // 3. Запуск генерации
    for (const target of selectedTargets) {
        await processCollectionFilterCollections(target.category, target.collection, mode);
    }

    console.log(`\n🎉 ВСЕ ФИЛЬТР-КОЛЛЕКЦИИ УСПЕШНО СФОРМИРОВАНЫ В ПАПКАХ filter_collections/!`);
    console.log(`Теперь их можно редактировать вручную или через админку.\n`);
    rl.close();
}

main().catch(err => {
    console.error("❌ Критическая ошибка:", err);
    process.exit(1);
});
