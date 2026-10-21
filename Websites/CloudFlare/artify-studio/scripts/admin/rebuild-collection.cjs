const fs = require("fs");
const path = require("path");

const CONTENT_DIR = path.join(__dirname, "../../content");

const normalizeProductUrl = (rawUrl) => {
    try {
        const u = new URL(rawUrl.trim());
        let pathname = u.pathname;
        if (!pathname.endsWith("/")) pathname += "/";
        return `${u.origin}${pathname}`;
    } catch {
        return rawUrl.trim();
    }
};

const getSlugFromUrl = (url) => {
    const parts = url.split("/").filter(Boolean);
    return parts[parts.length - 1];
};

async function rebuildCollection(category, collection) {
    const colDir = path.join(CONTENT_DIR, category, collection);
    if (!fs.existsSync(colDir)) {
        console.error(`❌ Папка не найдена: ${colDir}`);
        return;
    }

    const prodDir = path.join(colDir, "products");
    const allProdPath = path.join(colDir, "all_products.json");
    const collectionFilePath = path.join(colDir, "collection.json");
    const linksFilePath = path.join(colDir, "links.txt");
    const infoFilePath = path.join(colDir, "info.json");

    if (!fs.existsSync(prodDir)) {
        console.error(`❌ Папка products не найдена: ${prodDir}`);
        return;
    }

    console.log(`\n==================================================`);
    console.log(`🔧 Восстановление подборки: ${category} / ${collection}`);
    console.log(`==================================================`);

    // 1. Читаем все существующие файлы товаров с диска
    const diskFiles = fs.readdirSync(prodDir).filter(f => f.endsWith(".json"));
    console.log(`📁 Найдено файлов товаров в products/: ${diskFiles.length}`);

    // 2. Читаем существующий all_products.json (если есть)
    let existingAll = [];
    try {
        if (fs.existsSync(allProdPath)) {
            existingAll = JSON.parse(fs.readFileSync(allProdPath, "utf8"));
        }
    } catch (e) {
        console.warn(`⚠️ Ошибка чтения all_products.json (${e.message}), пересобираем с диска...`);
    }

    // 3. Читаем существующий collection.json (если есть)
    let existingSlugs = [];
    try {
        if (fs.existsSync(collectionFilePath)) {
            const cData = JSON.parse(fs.readFileSync(collectionFilePath, "utf8"));
            existingSlugs = Array.isArray(cData.items) ? cData.items : [];
        }
    } catch (e) {
        console.warn(`⚠️ Ошибка чтения collection.json (${e.message}), пересобираем с диска...`);
    }

    // 3.1 Читаем trash.json (товары в корзине НЕ должны воскрешаться)
    const trashPath = path.join(colDir, "trash.json");
    let trashSlugs = new Set();
    try {
        if (fs.existsSync(trashPath)) {
            const tData = JSON.parse(fs.readFileSync(trashPath, "utf8"));
            const items = Array.isArray(tData) ? tData : (tData.items || []);
            trashSlugs = new Set(items.map(i => i.slug));
            if (trashSlugs.size > 0) {
                console.log(`🗑️ Пропускаем товаров в корзине: ${trashSlugs.size}`);
            }
        }
    } catch {}

    // Карты для объединения
    const productsMap = new Map();

    // Загружаем то, что уже было в all_products.json
    for (const p of existingAll) {
        if (p && p.slug && !trashSlugs.has(p.slug)) {
            productsMap.set(p.slug, p);
        }
    }

    // Добавляем все файлы с диска (они в приоритете)
    let diskAdded = 0;
    for (const file of diskFiles) {
        const slug = file.replace(/\.json$/i, "");
        if (trashSlugs.has(slug)) continue;
        const filePath = path.join(prodDir, file);
        try {
            const pData = JSON.parse(fs.readFileSync(filePath, "utf8"));
            if (pData && pData.slug) {
                if (!productsMap.has(pData.slug)) {
                    diskAdded++;
                }
                productsMap.set(pData.slug, pData);
            }
        } catch (e) {
            console.error(`⚠️ Ошибка чтения файла ${file}: ${e.message}`);
        }
    }

    console.log(`📦 Всего уникальных товаров объединено: ${productsMap.size} (из них новых с диска: ${diskAdded})`);

    // Формируем финальный порядок слагов:
    // Сначала сохраняем порядок из existingSlugs, затем добавляем все остальные
    const finalSlugs = [];
    const seenSlugs = new Set();

    for (const s of existingSlugs) {
        if (productsMap.has(s) && !seenSlugs.has(s)) {
            finalSlugs.push(s);
            seenSlugs.add(s);
        }
    }

    for (const s of productsMap.keys()) {
        if (!seenSlugs.has(s)) {
            finalSlugs.push(s);
            seenSlugs.add(s);
        }
    }

    // Формируем allProductsArray строго по порядку finalSlugs
    const finalAllProducts = finalSlugs.map(s => productsMap.get(s)).filter(Boolean);

    // Формируем links.txt
    let existingLinks = [];
    try {
        if (fs.existsSync(linksFilePath)) {
            existingLinks = fs.readFileSync(linksFilePath, "utf8").split("\n").map(l => l.trim()).filter(Boolean);
        }
    } catch {}

    const linkSet = new Set(existingLinks.map(l => getSlugFromUrl(normalizeProductUrl(l))).filter(Boolean));
    const finalLinks = [...existingLinks];

    for (const p of finalAllProducts) {
        if (!linkSet.has(p.slug)) {
            const url = p.canonical || p.url || `https://www.creativefabrica.com/product/${p.slug}/`;
            finalLinks.push(url);
            linkSet.add(p.slug);
        }
    }

    // Атомарная запись
    fs.writeFileSync(allProdPath, JSON.stringify(finalAllProducts, null, 2), "utf8");
    fs.writeFileSync(collectionFilePath, JSON.stringify({ items: finalSlugs }, null, 2), "utf8");
    fs.writeFileSync(linksFilePath, finalLinks.join("\n") + "\n", "utf8");

    // Обновляем info.json
    try {
        let info = { title: collection, count: finalAllProducts.length, image: "" };
        if (fs.existsSync(infoFilePath)) {
            info = JSON.parse(fs.readFileSync(infoFilePath, "utf8"));
        }
        info.count = finalAllProducts.length;
        if (!info.image && finalAllProducts.length > 0 && finalAllProducts[0].image) {
            info.image = finalAllProducts[0].image;
        }
        fs.writeFileSync(infoFilePath, JSON.stringify(info, null, 2), "utf8");
    } catch {}

    console.log(`✅ Подборка ${category} / ${collection} успешно восстановлена!`);
    console.log(`📊 Итоговый счетчик: ${finalAllProducts.length} товаров.`);
    console.log(`📄 Обновлены: all_products.json, collection.json, links.txt, info.json\n`);
}

// Запуск из командной строки
const [,, catArg, colArg] = process.argv;

if (catArg && colArg) {
    rebuildCollection(catArg, colArg);
} else {
    console.log(`Использование: node scripts/admin/rebuild-collection.cjs <category> <collection>`);
    console.log(`Пример: node scripts/admin/rebuild-collection.cjs cliparts baby`);
}
