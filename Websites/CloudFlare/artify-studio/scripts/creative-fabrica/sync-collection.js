// scripts/creative-fabrica/sync-collection.js
import fs from "fs/promises";
import path from "path";
import readline from "readline";

import { getBrowser } from "./browser-session.js";
import { parseProductPage } from "./parse-product-page.js";
import { normalizeProductUrl } from "./helpers/normalize-product-url.js";
import { scrapeCategoryLinks } from "./helpers/scrape-category-links.js";
import { createQuickDrafts } from "./helpers/quick-showcase.js";

const PROJECT_ROOT = process.cwd(); 
const CONTENT_DIR = path.join(PROJECT_ROOT, "content");

const askQuestion = (query) => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    return new Promise(resolve => rl.question(query, ans => { rl.close(); resolve(ans); }));
};

const getSlugFromUrl = (url) => {
    const parts = url.split("/").filter(Boolean);
    return parts[parts.length - 1]; 
};

// Генерация случайной проверочной капчи (буквы + цифры)
function generateCaptchaCode() {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let code = "";
    for (let i = 0; i < 5; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return `RESET_${code}`;
}

async function verifyCaptcha(actionName = "полный сброс") {
    console.log(`\n⚠️ ВНИМАНИЕ! Вы выбрали: ${actionName}.`);
    console.log(`Все ручные перемещения товаров будут сброшены!\n`);

    const captcha = generateCaptchaCode();
    for (let attempt = 1; attempt <= 3; attempt++) {
        console.log(`🔒 Для подтверждения введите проверочный код: \x1b[33m${captcha}\x1b[0m (Попытка ${attempt}/3)`);
        const input = await askQuestion(`Код: `);
        if (input.trim() === captcha) {
            console.log(`✅ Капча подтверждена. Действие разрешено.\n`);
            return true;
        } else {
            console.log(`❌ Неверный проверочный код!\n`);
        }
    }
    console.log(`🛑 Вы трижды ошиблись при вводе капчи. Действие отменено в целях безопасности данных!`);
    return false;
}

// 🔥 НОВАЯ ФУНКЦИЯ: Проверка и обновление order.json
async function syncOrderJsons() {
    console.log(`\n==================================================`);
    console.log(`🔹 РАЗДЕЛ 1: СИНХРОНИЗАЦИЯ ПАПОК (order.json)`);
    console.log(`   - Находит новые созданные папки с подборками.`);
    console.log(`   - Добавляет их в списки категорий для показа на сайте.`);
    console.log(`==================================================`);
    const ans = await askQuestion(`Выполнить проверку и обновление order.json? (y/N): `);
    if (!['y', 'yes', '1', 'да'].includes(ans.trim().toLowerCase())) {
        return; // Если юзер отказался — просто идем дальше
    }

    // Получаем список категорий (cliparts, fonts и т.д.)
    let entries;
    try {
        entries = await fs.readdir(CONTENT_DIR, { withFileTypes: true });
    } catch {
        return; 
    }
    const categories = entries.filter(d => d.isDirectory() && d.name !== "products").map(d => d.name);

    for (const category of categories) {
        const categoryDir = path.join(CONTENT_DIR, category);
        const orderFilePath = path.join(categoryDir, "order.json");

        // Получаем список реальных папок-подборок в текущей категории
        const catEntries = await fs.readdir(categoryDir, { withFileTypes: true });
        const actualCollections = catEntries.filter(d => d.isDirectory()).map(d => d.name);

        let currentOrder = [];
        let fileExists = false;

        try {
            // Пытаемся прочитать существующий order.json
            const data = await fs.readFile(orderFilePath, "utf8");
            currentOrder = JSON.parse(data).order || [];
            fileExists = true;
        } catch {
            // Файла нет или он сломан
        }

        // Ищем те подборки, которых ЕЩЕ НЕТ в массиве currentOrder
        const missingCollections = actualCollections.filter(col => !currentOrder.includes(col));

        // Если файла не было ИЛИ есть недостающие подборки — обновляем
        if (missingCollections.length > 0 || !fileExists) {
            currentOrder.push(...missingCollections); // Добавляем новые строго в конец
            
            await fs.writeFile(orderFilePath, JSON.stringify({ order: currentOrder }, null, 2), "utf8");
            console.log(`✅ [${category}] order.json обновлен (добавлено новых подборок: ${missingCollections.length})`);
        } else {
            console.log(`⚡ [${category}] order.json уже актуален (все ${currentOrder.length} подборки на месте).`);
        }
    }
    
    // Обновляем src/data/categories.json
    try {
        const categoriesDataPath = path.join(process.cwd(), "src", "data", "categories.json");
        const catData = await fs.readFile(categoriesDataPath, "utf8");
        const catArray = JSON.parse(catData);
        let updatedCatJson = false;

        for (const catObj of catArray) {
            const catId = catObj.id;
            const categoryDir = path.join(CONTENT_DIR, catId);
            try {
                const orderFilePath = path.join(categoryDir, "order.json");
                const orderData = await fs.readFile(orderFilePath, "utf8");
                const orderObj = JSON.parse(orderData);
                const countNum = orderObj.order ? orderObj.order.length : 0;
                
                let countStr = "";
                if (countNum <= 4) {
                    countStr = `${countNum} Collection${countNum === 1 ? '' : 's'}`;
                } else if (countNum >= 5 && countNum < 10) {
                    countStr = `5+ Collections`;
                } else {
                    const roundedDown = Math.floor(countNum / 10) * 10;
                    countStr = `${roundedDown}+ Collections`;
                }

                if (catObj.count !== countStr) {
                    catObj.count = countStr;
                    updatedCatJson = true;
                }
            } catch (e) {
                // Ignore missing folders
            }
        }
        
        if (updatedCatJson) {
            await fs.writeFile(categoriesDataPath, JSON.stringify(catArray, null, 2), "utf8");
            console.log(`\n🎉 Обновлены счетчики в src/data/categories.json!`);
        }
    } catch (e) {
        console.error("Ошибка при обновлении categories.json", e);
    }
    
    console.log(`--------------------------------------------------`);
}

// 🔥 НОВАЯ ФУНКЦИЯ: Поиск маленьких подборок (< 20 товаров)

async function processForLinks() {
    console.log(`\n==================================================`);
    console.log(`🔹 РАЗДЕЛ 2.5: АВТО-СБОР ССЫЛОК ИЗ for_links.txt`);
    console.log(`   - Находит папки, где есть for_links.txt`);
    console.log(`   - Парсит поисковую выдачу или категории Creative Fabrica`);
    console.log(`   - Перемешивает товары (Round-Robin) и пишет в links.txt`);
    console.log(`==================================================`);
    
    const ans = await askQuestion(`Собрать ссылки из for_links.txt? (y/N): `);
    if (!['y', 'yes', '1', 'да'].includes(ans.trim().toLowerCase())) {
        return;
    }

    let entries;
    try {
        entries = await fs.readdir(CONTENT_DIR, { withFileTypes: true });
    } catch {
        return;
    }

    const categories = entries.filter(d => d.isDirectory() && d.name !== "products").map(d => d.name);
    const availableTargets = [];

    // Ищем папки с непустым for_links.txt
    for (const category of categories) {
        const categoryDir = path.join(CONTENT_DIR, category);
        const catEntries = await fs.readdir(categoryDir, { withFileTypes: true });
        const collections = catEntries.filter(d => d.isDirectory()).map(d => d.name);

        for (const collection of collections) {
            const forLinksPath = path.join(categoryDir, collection, "for_links.txt");
            try {
                const stats = await fs.stat(forLinksPath);
                if (stats.size > 5) { // не пустой
                    const content = await fs.readFile(forLinksPath, 'utf8');
                    const urls = content.split('\n').map(l => l.trim()).filter(l => l.startsWith('http'));
                    if (urls.length > 0) {
                        availableTargets.push({ category, collection, path: forLinksPath, urls });
                    }
                }
            } catch (e) {
                // нет файла
            }
        }
    }

    if (availableTargets.length === 0) {
        console.log(`\nℹ️ Ни в одной подборке не найден заполненный файл for_links.txt. Пропускаем...`);
        return;
    }

    console.log(`\nНайдены файлы for_links.txt в следующих подборках:`);
    availableTargets.forEach((t, idx) => {
        console.log(`[${idx + 1}] ${t.category} / ${t.collection} (${t.urls.length} ссылок)`);
    });

    console.log(`\nЧто парсить?`);
    console.log(`- Введите номера через запятую (например: 1,3)`);
    console.log(`- Нажмите Enter, чтобы спарсить ВСЕ найденные`);
    
    const selAns = await askQuestion(`Ваш выбор: `);
    let selectedTargets = availableTargets;
    
    if (selAns.trim()) {
        const indexes = selAns.split(',').map(s => parseInt(s.trim()) - 1).filter(n => n >= 0 && n < availableTargets.length);
        if (indexes.length > 0) {
            selectedTargets = indexes.map(i => availableTargets[i]);
        }
    }

    for (const target of selectedTargets) {
        console.log(`\n🚀 ЗАПУСК СБОРА: ${target.category} / ${target.collection}`);
        const mixedLinks = await scrapeCategoryLinks(target.urls);
        
        if (mixedLinks.length === 0) {
            console.log(`❌ Не удалось собрать ни одной ссылки.`);
            continue;
        }

        console.log(`\n🎉 Успешно собрано ${mixedLinks.length} уникальных ссылок (смешанных)!`);
        
        // 💾 Сохраняем карту источников для последующей фильтрации и пометок в админке
        if (mixedLinks.sourcesMap && Object.keys(mixedLinks.sourcesMap).length > 0) {
            const sourcesMapFile = path.join(CONTENT_DIR, target.category, target.collection, "sources_map.json");
            let existingMap = {};
            try {
                const sRaw = await fs.readFile(sourcesMapFile, 'utf8');
                existingMap = JSON.parse(sRaw);
            } catch {}
            const mergedMap = { ...existingMap, ...mixedLinks.sourcesMap };
            await fs.writeFile(sourcesMapFile, JSON.stringify(mergedMap, null, 2), 'utf8');
            console.log(`   📌 Сохранена карта источников для ${Object.keys(mergedMap).length} товаров (sources_map.json).`);
        }
        
        const linksTxtPath = path.join(CONTENT_DIR, target.category, target.collection, "links.txt");
        const deleteLinksPath = path.join(CONTENT_DIR, target.category, target.collection, "delete_links.txt");
        let existingLinks = [];
        try {
            const extText = await fs.readFile(linksTxtPath, 'utf8');
            existingLinks = extText.split('\n').map(l => l.trim()).filter(Boolean);
        } catch(e) {}

        // Загружаем удаленные ссылки и слаги из delete_links.txt
        const deletedSlugs = new Set();
        try {
            const delText = await fs.readFile(deleteLinksPath, 'utf8');
            const delLines = delText.split('\n').map(l => l.trim()).filter(Boolean);
            for (const dl of delLines) {
                if (dl.startsWith('http')) {
                    const clean = normalizeProductUrl(dl);
                    const s = getSlugFromUrl(clean);
                    if (s) deletedSlugs.add(s);
                }
            }
        } catch(e) {}
        
        // 🔥 ДИНАМИЧЕСКИЙ ЛИМИТ:
        // Если указаны кастомные числа через запятую (например: URL, 400), берем их сумму.
        // Если лимиты не указаны (стандартный режим), берем 300.
        let customTotal = 0;
        for (const rawLine of target.urls) {
            const commaIndex = rawLine.indexOf(',');
            if (commaIndex !== -1) {
                const lim = parseInt(rawLine.substring(commaIndex + 1).trim(), 10);
                if (!isNaN(lim) && lim > 0) customTotal += lim;
            }
        }
        const maxLimitToAdd = customTotal > 0 ? customTotal : 300;

        const existingSlugs = new Set(existingLinks.map(l => getSlugFromUrl(normalizeProductUrl(l))).filter(Boolean));

        // Добавляем только те, которых еще нет И которые не были удалены в delete_links.txt
        let added = 0;
        let skippedDeleted = 0;
        for (const ml of mixedLinks) {
            const clean = normalizeProductUrl(ml);
            const slug = getSlugFromUrl(clean);
            if (!slug) continue;

            if (deletedSlugs.has(slug)) {
                skippedDeleted++;
                continue;
            }

            if (!existingSlugs.has(slug)) {
                existingLinks.push(ml);
                existingSlugs.add(slug);
                added++;
                if (added >= maxLimitToAdd) break;
            }
        }
        
        await fs.writeFile(linksTxtPath, existingLinks.join('\n') + '\n', 'utf8');
        let statusMsg = `✅ Записано ${added} новых ссылок в links.txt (лимит: ${maxLimitToAdd})`;
        if (skippedDeleted > 0) {
            statusMsg += ` [пропущено ${skippedDeleted} ранее удаленных товаров]`;
        }
        console.log(`${statusMsg}!`);

        // ⚡ Быстрый сбор витрины: создаём черновики сразу
        if (mixedLinks.itemsMap && Object.keys(mixedLinks.itemsMap).length > 0) {
            console.log(`\n⚡ Найдено ${Object.keys(mixedLinks.itemsMap).length} карточек с фото и заголовками со страниц выдачи.`);
            const draftAns = await askQuestion(`Создать витрину-черновики СРАЗУ (для мгновенной модерации менеджером в админке)? (Y/n): `);
            if (!draftAns.trim() || ['y', 'yes', '1', 'да'].includes(draftAns.trim().toLowerCase())) {
                const draftRes = await createQuickDrafts({
                    category: target.category,
                    collection: target.collection,
                    mixedLinks,
                    maxLimit: maxLimitToAdd
                });
                console.log(`🎉 Витрина с черновиками создана! Новых карточек: ${draftRes.addedCount}, всего: ${draftRes.totalProducts} (из них черновиков: ${draftRes.draftsCount}).`);
                console.log(`👉 Менеджер может СРАЗУ открыть http://localhost:3333, удалить лишнее, а потом допарсить!`);
            }
        }
    }
}


async function checkSmallCollections() {
    console.log(`\n==================================================`);
    console.log(`🔹 РАЗДЕЛ 2: АУДИТ ПОДБОРОК (Мало товаров)`);
    console.log(`   - Сканирует все подборки на сайте.`);
    console.log(`   - Показывает те, где меньше 20 товаров.`);
    console.log(`==================================================`);
    const ans = await askQuestion(`Провести аудит подборок? (y/N): `);
    if (!['y', 'yes', '1', 'да'].includes(ans.trim().toLowerCase())) {
        return;
    }

    let entries;
    try {
        entries = await fs.readdir(CONTENT_DIR, { withFileTypes: true });
    } catch {
        return;
    }

    const categories = entries.filter(d => d.isDirectory() && d.name !== "products").map(d => d.name);
    const smallCollections = [];

    for (const category of categories) {
        const categoryDir = path.join(CONTENT_DIR, category);
        const catEntries = await fs.readdir(categoryDir, { withFileTypes: true });
        const collections = catEntries.filter(d => d.isDirectory()).map(d => d.name);

        for (const collection of collections) {
            const infoPath = path.join(categoryDir, collection, "info.json");
            try {
                const infoData = await fs.readFile(infoPath, "utf8");
                const info = JSON.parse(infoData);
                if (info.count !== undefined && info.count < 20) {
                    smallCollections.push({
                        category,
                        collection,
                        title: info.title || collection,
                        count: info.count
                    });
                }
            } catch {
                // Файл info.json не существует или сломан, значит товаров 0
                smallCollections.push({
                    category,
                    collection,
                    title: collection,
                    count: 0
                });
            }
        }
    }

    if (smallCollections.length > 0) {
        console.log(`\n⚠️ Внимание! Найдено ${smallCollections.length} подборок, где меньше 20 товаров:`);
        smallCollections.forEach(item => {
            console.log(`   🔸 [${item.category}] ${item.title} — всего ${item.count} товаров`);
        });
        console.log(`Рекомендуется добавить ссылки в links.txt для этих подборок.`);
    } else {
        console.log(`\n✅ Всё отлично! Во всех подборках 20 и более товаров.`);
    }
}

// 1. УМНЫЙ ВЫБОР ЦЕЛЕЙ (Массовый или Одиночный)
async function selectTargets() {
    console.log(`\n==================================================`);
    console.log(`🔹 РАЗДЕЛ 3: ПАРСИНГ ТОВАРОВ ИЗ links.txt`);
    console.log(`   - Выбор категории и подборки для обработки.`);
    console.log(`   - Сбор данных с Creative Fabrica.`);
    console.log(`   - Создание .json файлов для товаров.`);
    console.log(`==================================================`);
    let entries;
    try {
        entries = await fs.readdir(CONTENT_DIR, { withFileTypes: true });
    } catch {
        console.error(`❌ Папка ${CONTENT_DIR} не найдена!`);
        process.exit(1);
    }

    const categories = entries.filter(d => d.isDirectory() && d.name !== "products").map(d => d.name);

    console.log(`\n📁 Доступные категории:`);
    categories.forEach((cat, index) => console.log(`  [${index + 1}] ${cat}`));

    const catAns = await askQuestion(`\nВыберите категорию (1-${categories.length}) или нажмите ENTER для ВСЕХ: `);

    if (!catAns.trim()) {
        const allTargets = [];
        for (const cat of categories) {
            const catDir = path.join(CONTENT_DIR, cat);
            const cols = (await fs.readdir(catDir, { withFileTypes: true })).filter(d => d.isDirectory()).map(d => d.name);
            for (const col of cols) allTargets.push({ category: cat, collection: col });
        }
        return allTargets;
    }

    const catIndex = parseInt(catAns.trim()) - 1;
    const category = categories[catIndex] || categories[0];
    const categoryDir = path.join(CONTENT_DIR, category);
    
    const collections = (await fs.readdir(categoryDir, { withFileTypes: true })).filter(d => d.isDirectory()).map(d => d.name);

    console.log(`\n🗂️  Доступные подборки в '${category}':`);
    collections.forEach((col, index) => console.log(`  [${index + 1}] ${col}`));

    const colAns = await askQuestion(`\nВыберите подборку (1-${collections.length}) или нажмите ENTER для ВСЕХ в этой категории: `);

    if (!colAns.trim()) {
        return collections.map(col => ({ category, collection: col }));
    }

    const colIndex = parseInt(colAns.trim()) - 1;
    const collection = collections[colIndex] || collections[0];

    return [{ category, collection }];
}

// 2. ОБРАБОТКА ОДНОЙ ПОДБОРКИ
async function processCollection(target, page, globalSettings) {
    const { category, collection } = target;
    const COLLECTION_DIR = path.join(CONTENT_DIR, category, collection);
    const PRODUCTS_DIR = path.join(COLLECTION_DIR, "products");
    const LINKS_FILE = path.join(COLLECTION_DIR, "links.txt");
    const COLLECTION_FILE = path.join(COLLECTION_DIR, "collection.json");
    const ALL_PRODUCTS_FILE = path.join(COLLECTION_DIR, "all_products.json");
    const INFO_FILE = path.join(COLLECTION_DIR, "info.json");

    await fs.mkdir(PRODUCTS_DIR, { recursive: true });

    console.log(`\n==================================================`);
    console.log(`🚀 Синхронизация: ${category} / ${collection}`);
    console.log(`==================================================`);

    let rawLinksText = "";
    try {
        rawLinksText = await fs.readFile(LINKS_FILE, "utf8");
    } catch {
        console.log(`⚠️ Файл links.txt не найден, пропускаем подборку...`);
        return; 
    }

    // 🔥 ПРЕДОЧИСТКА: вытаскиваем только чистые ссылки (даже из грязного CSS или Markdown)
    const rawLines = rawLinksText.split("\n");
    const extractedLinks = [];
    
    for (let line of rawLines) {
        line = line.trim();
        if (!line) continue;
        
        // 1. Проверяем Markdown-ссылку: [Текст](URL)
        const mdMatch = line.match(/\[.*?\]\((https?:\/\/[^\s\)]+)\)/);
        if (mdMatch) {
            extractedLinks.push(mdMatch[1]);
            continue;
        }
        
        // 2. Проверяем голую ссылку: https://...
        const urlMatch = line.match(/(https?:\/\/[^\s\)]+)/);
        if (urlMatch) {
            extractedLinks.push(urlMatch[1]);
        }
    }

    const rawLinks = [...new Set(extractedLinks)];

    if (rawLinks.length === 0) {
        console.log(`ℹ️ В links.txt нет ссылок. Пропускаем...`);
        return;
    }
    
    let currentCollectionSlugs = [];
    try {
        const data = await fs.readFile(COLLECTION_FILE, "utf8");
        currentCollectionSlugs = JSON.parse(data).items || [];
    } catch {}

    const DELETE_LINKS_FILE = path.join(COLLECTION_DIR, "delete_links.txt");
    const deletedSlugs = new Set();
    try {
        const delText = await fs.readFile(DELETE_LINKS_FILE, "utf8");
        const delLines = delText.split("\n").map(l => l.trim()).filter(Boolean);
        for (const dl of delLines) {
            if (dl.startsWith("http")) {
                const clean = normalizeProductUrl(dl);
                const s = getSlugFromUrl(clean);
                if (s) deletedSlugs.add(s);
            }
        }
    } catch {}

    const slugToItem = new Map();
    const uniqueSlugs = new Set();
    const cleanRawLinks = [];

    for (const rawUrl of rawLinks) {
        const cleanUrl = normalizeProductUrl(rawUrl);
        if (!cleanUrl) continue;
        const slug = getSlugFromUrl(cleanUrl);

        if (!slug || uniqueSlugs.has(slug)) continue;

        // Исключаем товары, которые были отсеяны в delete_links.txt
        if (deletedSlugs.has(slug)) continue;

        uniqueSlugs.add(slug);
        cleanRawLinks.push(rawUrl);

        const item = { url: cleanUrl, slug };
        slugToItem.set(slug, item);
    }

    if (cleanRawLinks.join('\n') + '\n' !== rawLinksText) {
        console.log(`🧹 Автоматически очищен links.txt (удалён мусор/форматирование/дубликаты/удаленные).`);
        await fs.writeFile(LINKS_FILE, cleanRawLinks.join('\n') + '\n', 'utf8');
    }

    // 🛡️ SMART MERGE: сохраняем существующий ручной порядок товаров!
    // 1) Оставляем те товары из currentCollectionSlugs, которые все еще есть в links.txt и не удалены
    const preservedSlugs = currentCollectionSlugs.filter(slug => slugToItem.has(slug));
    const preservedSet = new Set(preservedSlugs);

    // 2) Новые товары, появившиеся в links.txt (например, собранные из for_links.txt), добавляем В КОНЕЦ
    const brandNewSlugs = [];
    for (const slug of slugToItem.keys()) {
        if (!preservedSet.has(slug)) {
            brandNewSlugs.push(slug);
        }
    }

    let isResettingToCfOrder = globalSettings.resetOrder;

    if (globalSettings.isSingle && currentCollectionSlugs.length > 0 && brandNewSlugs.length > 0) {
        console.log(`\n📦 Найдено ${brandNewSlugs.length} новых товаров из links.txt.`);
        console.log(`🛡️ По умолчанию: ручной порядок (${preservedSlugs.length} шт.) сохраняется сверху, а новые товары добавляются вниз.`);
        console.log(`  [1] Умное слияние (сохранить ручной порядок, новые вниз) — [По умолчанию]`);
        console.log(`  [2] Полный сброс к порядку Creative Fabrica (ТРЕБУЕТСЯ КАПЧА)`);
        const modeAns = await askQuestion(`Ваш выбор [1/2]: `);
        if (modeAns.trim() === '2') {
            const passed = await verifyCaptcha("полный сброс порядка подборки к выдаче Creative Fabrica");
            if (passed) {
                isResettingToCfOrder = true;
            }
        }
    }

    let newOrderSlugs = [];
    if (isResettingToCfOrder) {
        newOrderSlugs = Array.from(slugToItem.keys());
        console.log(`🔄 Порядок сброшен к выдаче Creative Fabrica.`);
    } else {
        newOrderSlugs = [...preservedSlugs, ...brandNewSlugs];
        if (brandNewSlugs.length > 0) {
            console.log(`✨ Умное слияние: ${preservedSlugs.length} товаров на своих местах, ${brandNewSlugs.length} новых добавлено в конец.`);
        }
    }

    const allItems = newOrderSlugs.map(slug => slugToItem.get(slug));
    let productsToParse = [];
    let draftItems = [];
    for (const item of allItems) {
        const prodPath = path.join(PRODUCTS_DIR, `${item.slug}.json`);
        try {
            const raw = await fs.readFile(prodPath, 'utf8');
            const pObj = JSON.parse(raw);
            if (pObj.isDraft) {
                draftItems.push(item);
            }
        } catch {
            productsToParse.push(item);
        }
    }

    if (draftItems.length > 0) {
        console.log(`\n⚡ В подборке обнаружено ${draftItems.length} товаров со статусом [Черновик] (после модерации менеджера).`);
        const hydAns = await askQuestion(`Допарсить эти ${draftItems.length} одобренных товаров до чистовых карточек? (Y/n): `);
        if (!hydAns.trim() || ['y', 'yes', '1', 'да'].includes(hydAns.trim().toLowerCase())) {
            productsToParse = [...productsToParse, ...draftItems];
        }
    }

    let shouldReparseAll = globalSettings.reparse;
    let deleteAction = globalSettings.deleteAction;

    if (globalSettings.isSingle) {
        if (productsToParse.length === 0 && allItems.length > 0) {
            const ans = await askQuestion(`✅ Все ${allItems.length} товаров уже есть. 🔄 Перепарсить их заново с нуля? (y/N): `);
            if (['y', 'yes', '1', 'да'].includes(ans.trim().toLowerCase())) {
                const passed = await verifyCaptcha("полный перепарсинг всех карточек товаров");
                if (passed) shouldReparseAll = true;
            }
        } else if (productsToParse.length > 0 && allItems.length > productsToParse.length) {
            const existingCount = allItems.length - productsToParse.length;
            console.log(`ℹ️ Скачано ${existingCount} из ${allItems.length}. Осталось: ${productsToParse.length} шт.`);
            const ans = await askQuestion(`Что сделать? [1] Докачать недостающие (по умолч.) / [2] Перепарсить ВСЕ ${allItems.length} заново: `);
            if (ans.trim() === '2') {
                const passed = await verifyCaptcha("полный перепарсинг всех карточек товаров");
                if (passed) shouldReparseAll = true;
            }
        }

        const removedSlugs = currentCollectionSlugs.filter(slug => !newOrderSlugs.includes(slug));
        if (removedSlugs.length > 0) {
            console.log(`\n⚠️ Из links.txt пропало ${removedSlugs.length} товар(ов).`);
            const ans = await askQuestion(`Что сделать? [1] Оставить JSON на диске (по умолч.) / [2] Полностью удалить их: `);
            deleteAction = ans.trim() === '2' ? '2' : '1';
        }
    }

    if (shouldReparseAll) {
        productsToParse = [...allItems];
    }

    const removedSlugs = currentCollectionSlugs.filter(slug => !newOrderSlugs.includes(slug));
    if (removedSlugs.length > 0 && deleteAction === '2') {
        for (const removedSlug of removedSlugs) {
            try {
                await fs.unlink(path.join(PRODUCTS_DIR, `${removedSlug}.json`));
                console.log(`🗑️  Удален файл: products/${removedSlug}.json`);
            } catch {}
        }
    }

    let collectionSourcesMap = {};
    try {
        const sRaw = await fs.readFile(path.join(COLLECTION_DIR, "sources_map.json"), "utf8");
        collectionSourcesMap = JSON.parse(sRaw);
    } catch {}

    if (productsToParse.length > 0) {
        console.log(`\n🕵️ Начинаю парсинг (${productsToParse.length} шт.)...`);

        for (const { url, slug } of productsToParse) {
            console.log(`\n⏳ Парсинг: ${slug}`);
            let isParsed = false;
            let attempts = 0;
            const maxAttempts = 3;

            while (!isParsed && attempts < maxAttempts) {
                attempts++;
                try {
                    if (attempts > 1) {
                        console.log(`   🔄 Повторная попытка ${attempts}/${maxAttempts}...`);
                        await new Promise(res => setTimeout(res, 3000));
                    }

                    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 30000 });
                    await page.waitForTimeout(1500); 

                    const productData = await parseProductPage(page, slug);

                    if (!productData.title || productData.title.includes('www.creativefabrica.com')) {
                        throw new Error("Неполные данные со страницы");
                    }
                    
                    // 📌 Привязываем запрос сбора и комментарий менеджера (если спарсено по for_links.txt)
                    if (collectionSourcesMap[slug]) {
                        if (collectionSourcesMap[slug].sourceQuery) productData.sourceQuery = collectionSourcesMap[slug].sourceQuery;
                        if (collectionSourcesMap[slug].sourceComment) productData.sourceComment = collectionSourcesMap[slug].sourceComment;
                        if (collectionSourcesMap[slug].sourceUrl) productData.sourceUrl = collectionSourcesMap[slug].sourceUrl;
                    }

                    productData.isDraft = false;
                    const savePath = path.join(PRODUCTS_DIR, `${slug}.json`);
                    await fs.writeFile(savePath, JSON.stringify(productData, null, 2));
                    
                    const favStr = productData.favoritesRaw ? ` | ❤️ ${productData.favoritesRaw}` : "";
                    const tagsStr = productData.designerTags?.length ? ` | 🏷️ ${productData.designerTags.length} тегов` : "";
                    if (productData.rating !== null && productData.rating < 4.5) {
                        console.log(`⚠️ Сохранен: ${slug}.json [Рейтинг ${productData.rating} ⭐ — БУДЕТ СКРЫТ как некачественный${favStr}${tagsStr}]`);
                    } else if (productData.rating !== null) {
                        console.log(`✅ Сохранен: ${slug}.json [Рейтинг ${productData.rating} ⭐ (${productData.reviewsCount} отзывов)${favStr}${tagsStr}]`);
                    } else {
                        console.log(`✅ Сохранен: ${slug}.json [Без отзывов${favStr}${tagsStr}]`);
                    }
                    
                    isParsed = true;
                } catch (e) {
                    if (attempts >= maxAttempts) {
                        console.log(`❌ Ошибка парсинга ${slug}: ${e.message}`);
                    }
                }
            }
        }
    } else {
        console.log(`\n✅ Изменений в файлах товаров нет.`);
    }

    await fs.writeFile(
        COLLECTION_FILE,
        JSON.stringify({ items: newOrderSlugs }, null, 2)
    );

    // 🔥 СБОРКА ОБЩЕГО ФАЙЛА ALL_PRODUCTS.JSON
    const allProductsArray = [];
    const lowRatingItems = [];
    for (const slug of newOrderSlugs) {
        try {
            const content = await fs.readFile(path.join(PRODUCTS_DIR, `${slug}.json`), "utf8");
            const prod = JSON.parse(content);
            
            // 📌 Обогащаем данными источника сбора и примечанием менеджера
            if (collectionSourcesMap[slug]) {
                if (!prod.sourceQuery && collectionSourcesMap[slug].sourceQuery) prod.sourceQuery = collectionSourcesMap[slug].sourceQuery;
                if (!prod.sourceComment && collectionSourcesMap[slug].sourceComment) prod.sourceComment = collectionSourcesMap[slug].sourceComment;
                if (!prod.sourceUrl && collectionSourcesMap[slug].sourceUrl) prod.sourceUrl = collectionSourcesMap[slug].sourceUrl;
            }

            // 🛡️ ФИЛЬТР КАЧЕСТВА: Если есть оценка и она ниже 4.5 — отсекаем товар!
            if (prod.rating !== null && prod.rating !== undefined && prod.rating < 4.5) {
                const prodUrl = prod.canonical || `https://www.creativefabrica.com/product/${slug}/`;
                lowRatingItems.push({ slug, url: prodUrl, rating: prod.rating });
                continue;
            }
            allProductsArray.push(prod);
        } catch {}
    }

    if (lowRatingItems.length > 0) {
        console.log(`🛡️ Отсеяно ${lowRatingItems.length} товар(ов) с рейтингом ниже 4.5 звезд.`);
        
        // 📝 Записываем отсеянные товары в delete_links.txt с секцией "--- ниже 4,5 звезд ---"
        const DELETE_LINKS_FILE = path.join(COLLECTION_DIR, "delete_links.txt");
        const sectionHeader = "--- ниже 4,5 звезд ---";
        let existingDeleteText = "";
        try {
            existingDeleteText = await fs.readFile(DELETE_LINKS_FILE, "utf8");
        } catch {}

        let updatedDeleteText = "";
        const newUrls = lowRatingItems.map(item => item.url);

        if (existingDeleteText.includes(sectionHeader) || existingDeleteText.includes("--- ниже 4,5 звзед ---")) {
            const headerToMatch = existingDeleteText.includes(sectionHeader) ? sectionHeader : "--- ниже 4,5 звзед ---";
            const parts = existingDeleteText.split(headerToMatch);
            const before = parts[0];
            const afterAll = parts[1] || "";
            
            const nextSectionMatch = afterAll.match(/\n(--- [^\n]+ ---)/);
            let currentSectionBody = afterAll;
            let restOfFile = "";
            if (nextSectionMatch && nextSectionMatch.index !== undefined) {
                currentSectionBody = afterAll.substring(0, nextSectionMatch.index);
                restOfFile = afterAll.substring(nextSectionMatch.index);
            }
            
            const linksInSection = currentSectionBody.split("\n").map(l => l.trim()).filter(Boolean);
            for (const url of newUrls) {
                if (!linksInSection.includes(url)) {
                    linksInSection.push(url);
                }
            }
            
            updatedDeleteText = before.trim() 
                ? `${before.trim()}\n\n${headerToMatch}\n${linksInSection.join("\n")}\n${restOfFile.trim()}`
                : `${headerToMatch}\n${linksInSection.join("\n")}\n${restOfFile.trim()}`;
        } else {
            const newSection = `${sectionHeader}\n${newUrls.join("\n")}`;
            updatedDeleteText = existingDeleteText.trim() 
                ? `${existingDeleteText.trim()}\n\n${newSection}`
                : newSection;
        }

        await fs.writeFile(DELETE_LINKS_FILE, updatedDeleteText.trim() + "\n", "utf8");
        console.log(`📝 Отсеянные ссылки сохранены в delete_links.txt под заголовком "${sectionHeader}".`);

        // 🧹 Очищаем links.txt от отсеянных плохих товаров
        const lowSlugs = new Set(lowRatingItems.map(i => i.slug));
        const cleanedLinks = cleanRawLinks.filter(rawUrl => {
            const slug = getSlugFromUrl(normalizeProductUrl(rawUrl));
            return !lowSlugs.has(slug);
        });
        if (cleanedLinks.length !== cleanRawLinks.length) {
            await fs.writeFile(LINKS_FILE, cleanedLinks.join('\n') + '\n', 'utf8');
            console.log(`🧹 links.txt очищен от отсеянных ссылок с низким рейтингом.`);
        }
    }

    await fs.writeFile(ALL_PRODUCTS_FILE, JSON.stringify(allProductsArray, null, 2), "utf8");
    console.log(`📦 Сформирован общий файл подборки: all_products.json (${allProductsArray.length} товаров).`);

    // 📄 ОБРАБОТКА И АКТУАЛИЗАЦИЯ INFO.JSON
    let infoData = {
        title: "",
        description: "",
        image: "",
        count: 0
    };

    try {
        const existingInfoRaw = await fs.readFile(INFO_FILE, "utf8");
        const existingInfo = JSON.parse(existingInfoRaw);
        infoData = {
            ...infoData,
            ...existingInfo
        };
    } catch {
        // Файла info.json ещё не существует
    }

    // Актуализируем число РЕАЛЬНО отображаемых товаров
    infoData.count = allProductsArray.length;

    // Если ссылки на изображение нет, подставляем из первого товара
    if (!infoData.image && newOrderSlugs.length > 0) {
        const firstSlug = newOrderSlugs[0];
        try {
            const firstProductRaw = await fs.readFile(path.join(PRODUCTS_DIR, `${firstSlug}.json`), "utf8");
            const firstProduct = JSON.parse(firstProductRaw);

            const firstImage = firstProduct.images?.[0] || firstProduct.image || firstProduct.cover || "";
            if (firstImage) {
                infoData.image = firstImage;
            }
        } catch {}
    }

    await fs.writeFile(INFO_FILE, JSON.stringify(infoData, null, 2), "utf8");
    console.log(`📝 Обновлен info.json (count: ${infoData.count}${infoData.image ? `, image: да` : ''})`);
}

async function generateFiltersForCollection(category, collection, force = false) {
    const COLLECTION_DIR = path.join(CONTENT_DIR, category, collection);
    const FILTERS_FILE = path.join(COLLECTION_DIR, "filters.json");
    const ALL_PRODUCTS_FILE = path.join(COLLECTION_DIR, "all_products.json");
    
    if (!force) {
        try {
            await fs.access(FILTERS_FILE);
            return false; // Уже существует, пропускаем
        } catch {}
    }
    
    try {
        const allProdsData = await fs.readFile(ALL_PRODUCTS_FILE, 'utf8');
        const allProductsArray = JSON.parse(allProdsData);
        
        const dynamicStopWords = [...category.split('-'), ...collection.split('-')].map(w => w.toLowerCase());
        
        // Огромный стоп-лист: убираем ВСЁ кроме реально осмысленных стилей/тем/объектов
        const stopWords = new Set([
            // --- Служебные слова английского языка ---
            'this','that','these','those','they','them','their','there','then','than','with','from','into','have','been','were','will','would','could','should','shall','might','must','being','about','above','below','between','through','during','before','after','against','without','within','along','among','around','under','over','also','just','only','very','much','many','more','most','some','such','same','other','each','every','both','either','neither','while','until','since','because','although','though','even','still','already','really','actually','certainly','probably','simply','basically','essentially','especially','particularly','generally','usually','often','always','never','sometimes','perhaps','maybe','however','therefore','otherwise','instead','rather','quite','pretty','rather','enough','almost','nearly','hardly','barely','merely',
            // --- Глаголы и действия ---
            'make','made','makes','making','work','works','working','worked','used','using','uses','come','comes','coming','came','give','gives','given','take','takes','taken','keep','keeps','keeping','find','finds','finding','know','knows','known','think','want','need','needs','help','show','shows','shown','look','looks','looking','create','creates','creating','created','designed','design','designs','provides','include','includes','included','including','features','featured','featuring','offer','offers','offering','available','receive','received','save','saved','check','added','adding','bring','brings','capture','captures','ensure','ensures','enjoy','allows','allow','apply','import','export',
            // --- Прилагательные общие (не стилевые) ---
            'great','good','best','better','perfect','amazing','wonderful','beautiful','unique','special','ideal','excellent','fantastic','awesome','stunning','gorgeous','lovely','nice','fine','cool','different','various','specific','certain','simple','easy','hard','small','smaller','large','larger','full','complete','entire','whole','real','true','right','new','old','first','last','next','high','wide','long','open','ready','sure','able','free','compatible',
            // --- Существительные общие/технические ---
            'file','files','item','items','product','products','thing','things','part','parts','piece','pieces','page','pages','time','times','year','years','list','way','ways','kind','kinds','version','download','downloads','digital','graphic','graphics','image','images','photo','photos','picture','pictures','video','videos','format','formats','resolution','resolutions','quality','size','sizes','color','colors','style','styles','project','projects','collection','collections','bundle','bundles','pack','packs','option','options','feature','shop','price','purchase',
            // --- Про Creative Fabrica / описания товаров ---
            'clipart','cliparts','font','fonts','brush','brushes','stamp','stamps','brushset','brushsets','pencil','procreate','ipad','apple','tablet','click','here','window','windows','linux','commercial','licence','license','included','updated','print','printing','demand','paper','craft','crafts','cricut','silhouette','sublimation','scrapbooking','sticker','stickers','planner','greeting','cards','card','branding','tumblers','mugs','shirts','tote','bags','gifts','decor','decoration','decorations','wall','invitations','invitation','stationery','packaging','covers',
            // --- Прочий мусор из описаний ---
            'note','please','physical','shipped','hand','painted','approx','inches','receive','pixel','pixels','dpi','vector','illustration','illustrations','elements','element','isolated','transparent','transparency','background','backgrounds','overlay','overlays','premium','svg','png','jpg','jpeg','pdf','eps','layer','layers','editable','customizable','instant','access','personal','artify','studio',
            ...dynamicStopWords
        ]);
        
        const wordCounts = {};
        allProductsArray.forEach(p => {
            // Берём слова ТОЛЬКО из title и description (не fullDescription — там слишком много мусора)
            const text = `${p.title || ''} ${p.description || ''}`.toLowerCase();
            const words = text.match(/\b[a-z]{4,}\b/g) || [];
            
            // Очень безопасный стемминг (только для очевидных слов)
            const stemmedWords = words.map(w => {
                if (w === 'florals') return 'floral';
                if (w === 'flowers') return 'flower';
                if (w === 'patterns') return 'pattern';
                if (w === 'designs') return 'design';
                if (w === 'products') return 'product';
                if (w === 'brushes') return 'brush';
                if (w === 'stamps') return 'stamp';
                if (w === 'colors') return 'color';
                if (w === 'backgrounds') return 'background';
                return w;
            });
            
            const uniqueWords = [...new Set(stemmedWords)];
            
            uniqueWords.forEach(w => {
                if (!stopWords.has(w)) {
                    wordCounts[w] = (wordCounts[w] || 0) + 1;
                }
            });
        });

        const topWords = Object.entries(wordCounts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 6)
            .map(([word]) => word);

        if (topWords.length > 0) {
            const generatedFilters = topWords.map(word => {
                const label = word.charAt(0).toUpperCase() + word.slice(1);
                return { id: word, label: label, keywords: [word] };
            });
            
            await fs.writeFile(FILTERS_FILE, JSON.stringify(generatedFilters, null, 2), "utf8");
            console.log(`🧠 [${category}/${collection}] Сгенерированы фильтры: ${topWords.join(', ')}`);
            return true;
        } else {
            // Если не набралось фильтров, создаем пустой массив, чтобы не пытаться пересоздать каждый раз
            await fs.writeFile(FILTERS_FILE, JSON.stringify([], null, 2), "utf8");
            return true;
        }
    } catch (e) {
        return false;
    }
}

async function main() {
    await syncOrderJsons();
    await checkSmallCollections();
    await processForLinks();

    const doParse = await askQuestion(`\n==================================================\n🔹 РАЗДЕЛ 3: ПАРСИНГ ТОВАРОВ ИЗ links.txt\n   - Скачивание новых товаров с сайта Creative Fabrica\n==================================================\nЗапустить парсинг товаров? (y/N): `);
    
    if (['y', 'yes', '1', 'да'].includes(doParse.trim().toLowerCase())) {
        const targets = await selectTargets();

        const globalSettings = {
            isSingle: targets.length === 1,
            reparse: false,
            deleteAction: '1'
        };

        if (!globalSettings.isSingle) {
            console.log(`\n📦 Выбрано подборок для массовой синхронизации: ${targets.length}`);
            const reparseAns = await askQuestion(`🔄 Перепарсить ВСЕ товары заново? (y/N): `);
            globalSettings.reparse = ['y', 'yes', '1', 'да'].includes(reparseAns.trim().toLowerCase());

            const delAns = await askQuestion(`🗑 Что делать с исчезнувшими товарами?\n[1] Оставить JSON (по умолч.)\n[2] Удалить JSON\nВаш выбор: `);
            globalSettings.deleteAction = delAns.trim() === '2' ? '2' : '1';
        }

        console.log(`\n🚀 Запускаю браузер...`);
        const browser = await getBrowser();
        const context = browser.contexts()[0] || await browser.newContext();
        const page = await context.newPage(); 

        for (const target of targets) {
            await processCollection(target, page, globalSettings);
        }

        await page.close();
    }

    console.log(`🔹 РАЗДЕЛ 4: АВТО-ГЕНЕРАЦИЯ УМНЫХ ФИЛЬТРОВ И ТЕГОВ (ИИ)`);
    console.log(`   - Запускает продвинутый ИИ-скрипт (Gemini) для тегов и фильтров.`);
    console.log(`==================================================`);
    
    const runAi = await askQuestion(`Запустить ИИ-генератор? (y/N): `);
    if (runAi.trim().toLowerCase() === 'y') {
        console.log(`\n🚀 Запускаю скрипт ИИ...\n`);
        const { spawnSync } = await import('child_process');
        spawnSync('node', ['--dns-result-order=ipv4first', 'scripts/creative-fabrica/generate-tags-browser.js'], { stdio: 'inherit' });
    } else {
        console.log(`⏭️ Генерация умных фильтров пропущена.`);
    }

    console.log(`\n==================================================`);
    console.log(`🔹 РАЗДЕЛ 5: ОБНОВЛЕНИЕ ФИЛЬТР-КОЛЛЕКЦИЙ (filter_collections/)`);
    console.log(`   - Создает/обновляет статичные JSON файлы под каждый фильтр`);
    console.log(`   - Smart Merge: сохраняет ручной порядок и исключения товаров`);
    console.log(`   - Защита данных: полный сброс защищен проверочной капчей`);
    console.log(`==================================================`);
    
    const runFilters = await askQuestion(`Сгенерировать/обновить фильтр-коллекции? (y/N): `);
    if (['y', 'yes', '1', 'да'].includes(runFilters.trim().toLowerCase())) {
        console.log(`\n🚀 Запускаю генератор фильтр-коллекций...\n`);
        const { spawnSync } = await import('child_process');
        spawnSync('node', ['scripts/creative-fabrica/generate-filter-collections.js'], { stdio: 'inherit' });
    } else {
        console.log(`⏭️ Обновление фильтр-коллекций пропущено.`);
    }

    console.log(`\n🎉 СИНХРОНИЗАЦИЯ УСПЕШНО ЗАВЕРШЕНА!\n`);
    process.exit(0);
}

main();