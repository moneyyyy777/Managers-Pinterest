// scripts/creative-fabrica/helpers/quick-showcase.js
import fs from "fs/promises";
import path from "path";
import { getBrowser } from "../browser-session.js";
import { parseProductPage } from "../parse-product-page.js";
import { normalizeProductUrl } from "./normalize-product-url.js";

const PROJECT_ROOT = process.cwd();
const CONTENT_DIR = path.join(PROJECT_ROOT, "content");
const CATEGORIES_FILE = path.join(PROJECT_ROOT, "src", "data", "categories.json");

const getSlugFromUrl = (url) => {
    const parts = url.split("/").filter(Boolean);
    return parts[parts.length - 1];
};

/**
 * Получить статус черновиков в подборке
 */
export async function getDraftsStatus(category, collection) {
    const colDir = path.join(CONTENT_DIR, category, collection);
    const allProdPath = path.join(colDir, "all_products.json");

    try {
        const raw = await fs.readFile(allProdPath, "utf8");
        const products = JSON.parse(raw);
        const drafts = products.filter(p => Boolean(p.isDraft));
        const published = products.filter(p => !p.isDraft);

        return {
            total: products.length,
            draftsCount: drafts.length,
            publishedCount: published.length,
            draftSlugs: drafts.map(d => d.slug),
            isDraftMode: drafts.length > 0
        };
    } catch {
        return {
            total: 0,
            draftsCount: 0,
            publishedCount: 0,
            draftSlugs: [],
            isDraftMode: false
        };
    }
}

/**
 * Создать быструю витрину (черновики с фото и ссылками) без перехода на каждый товар
 */
export async function createQuickDrafts({ category, collection, mixedLinks, maxLimit = null }) {
    const colDir = path.join(CONTENT_DIR, category, collection);
    const prodDir = path.join(colDir, "products");
    const linksTxtPath = path.join(colDir, "links.txt");
    const deleteLinksPath = path.join(colDir, "delete_links.txt");
    const allProdPath = path.join(colDir, "all_products.json");
    const colJsonPath = path.join(colDir, "collection.json");
    const infoPath = path.join(colDir, "info.json");

    await fs.mkdir(prodDir, { recursive: true });

    // 1. Загружаем удалённые слаги (delete_links.txt)
    const deletedSlugs = new Set();
    try {
        const delText = await fs.readFile(deleteLinksPath, "utf8");
        const delLines = delText.split("\n").map(l => l.trim()).filter(Boolean);
        for (const dl of delLines) {
            if (dl.startsWith("http")) {
                const s = getSlugFromUrl(normalizeProductUrl(dl));
                if (s) deletedSlugs.add(s);
            }
        }
    } catch {}

    // 2. Загружаем существующие файлы подборки
    let existingLinks = [];
    try {
        const extText = await fs.readFile(linksTxtPath, "utf8");
        existingLinks = extText.split("\n").map(l => l.trim()).filter(Boolean);
    } catch {}

    let existingOrder = [];
    try {
        const cRaw = await fs.readFile(colJsonPath, "utf8");
        existingOrder = JSON.parse(cRaw).items || [];
    } catch {}

    let allProducts = [];
    try {
        const aRaw = await fs.readFile(allProdPath, "utf8");
        allProducts = JSON.parse(aRaw);
    } catch {}

    const existingSlugs = new Set(existingOrder);
    const itemsMap = mixedLinks.itemsMap || {};
    const sourcesMap = mixedLinks.sourcesMap || {};

    let addedCount = 0;
    let skippedDeleted = 0;
    const limit = maxLimit || mixedLinks.length || 500;

    for (const url of mixedLinks) {
        const cleanUrl = normalizeProductUrl(url);
        const slug = getSlugFromUrl(cleanUrl);
        if (!slug) continue;

        if (deletedSlugs.has(slug)) {
            skippedDeleted++;
            continue;
        }

        const cardData = itemsMap[slug] || {};
        const sourceData = sourcesMap[slug] || {};

        const fallbackTitle = slug
            .split("-")
            .map(w => w.charAt(0).toUpperCase() + w.slice(1))
            .join(" ");

        const title = cardData.title || fallbackTitle;
        const image = cardData.image || "";
        const author = cardData.author || "";

        const productObj = {
            slug,
            title,
            author,
            canonical: cleanUrl,
            url: cleanUrl,
            description: "",
            image: image,
            gallery: image ? [image] : [],
            rating: cardData.rating ?? null,
            reviewsCount: cardData.rating ? 1 : 0,
            favorites: cardData.favorites ?? null,
            favoritesRaw: cardData.favoritesRaw ?? null,
            designerTags: [],
            isDraft: true,
            sourceQuery: sourceData.sourceQuery || cardData.sourceQuery || "",
            sourceComment: sourceData.sourceComment || cardData.sourceComment || "",
            sourceUrl: sourceData.sourceUrl || cardData.sourceUrl || "",
            scrapedAt: new Date().toISOString()
        };

        const prodFilePath = path.join(prodDir, `${slug}.json`);

        // Если файла товара ещё нет — сохраняем черновик
        let fileExists = false;
        try {
            await fs.access(prodFilePath);
            fileExists = true;
        } catch {
            await fs.writeFile(prodFilePath, JSON.stringify(productObj, null, 2), "utf8");
        }

        // Добавляем в списки если ещё не добавлен
        if (!existingSlugs.has(slug)) {
            existingSlugs.add(slug);
            existingOrder.push(slug);
            existingLinks.push(cleanUrl);
            allProducts.push(productObj);
            addedCount++;
        } else {
            // Если товар уже был в списке как черновик без картинки — обновим в allProducts
            const idx = allProducts.findIndex(p => p.slug === slug);
            if (idx !== -1 && !allProducts[idx].image && image) {
                allProducts[idx].image = image;
                if (!allProducts[idx].gallery || allProducts[idx].gallery.length === 0) {
                    allProducts[idx].gallery = [image];
                }
            }
        }

        if (addedCount >= limit) break;
    }

    // Сохраняем обновлённые файлы подборки
    await fs.writeFile(linksTxtPath, existingLinks.join("\n") + "\n", "utf8");
    await fs.writeFile(colJsonPath, JSON.stringify({ items: existingOrder }, null, 2), "utf8");
    await fs.writeFile(allProdPath, JSON.stringify(allProducts, null, 2), "utf8");

    // Обновляем info.json
    let infoData = { title: collection, description: "", image: "", count: allProducts.length };
    try {
        const iRaw = await fs.readFile(infoPath, "utf8");
        infoData = { ...infoData, ...JSON.parse(iRaw) };
    } catch {}

    infoData.count = allProducts.length;
    if (!infoData.image && allProducts.length > 0 && allProducts[0].image) {
        infoData.image = allProducts[0].image;
    }
    await fs.writeFile(infoPath, JSON.stringify(infoData, null, 2), "utf8");

    // Обновляем order.json категории
    const catOrderPath = path.join(CONTENT_DIR, category, "order.json");
    try {
        let catOrder = [];
        try {
            catOrder = JSON.parse(await fs.readFile(catOrderPath, "utf8")).order || [];
        } catch {}
        if (!catOrder.includes(collection)) {
            catOrder.push(collection);
            await fs.writeFile(catOrderPath, JSON.stringify({ order: catOrder }, null, 2), "utf8");
        }
    } catch {}

    return {
        addedCount,
        skippedDeleted,
        totalProducts: allProducts.length,
        draftsCount: allProducts.filter(p => p.isDraft).length
    };
}

/**
 * Допарсить одобренные менеджером черновики (скачать HD галерею, полное описание, отзывы)
 */
export async function hydrateApprovedDrafts({ category, collection, onProgress = null, maxItems = null }) {
    const colDir = path.join(CONTENT_DIR, category, collection);
    const prodDir = path.join(colDir, "products");
    const allProdPath = path.join(colDir, "all_products.json");
    const colJsonPath = path.join(colDir, "collection.json");
    const infoPath = path.join(colDir, "info.json");

    let allProducts = [];
    try {
        allProducts = JSON.parse(await fs.readFile(allProdPath, "utf8"));
    } catch {
        return { success: false, error: "all_products.json не найден" };
    }

    // Черновики, которые остались в подборке после модерации менеджера
    const draftsToHydrate = allProducts.filter(p => Boolean(p.isDraft));

    if (draftsToHydrate.length === 0) {
        return {
            success: true,
            hydratedCount: 0,
            message: "Все товары в подборке уже чистовые (черновиков нет)!"
        };
    }

    const itemsToProcess = maxItems ? draftsToHydrate.slice(0, maxItems) : draftsToHydrate;
    console.log(`\n🚀 Начинаем допарсинг одобренных черновиков: ${itemsToProcess.length} шт. в ${category}/${collection}...`);

    const browser = await getBrowser();
    const context = browser.contexts().length > 0 ? browser.contexts()[0] : browser;
    const page = await context.newPage();

    let hydratedCount = 0;
    const errors = [];

    try {
        for (let i = 0; i < itemsToProcess.length; i++) {
            const item = itemsToProcess[i];
            const currentIdx = i + 1;
            const total = itemsToProcess.length;

            console.log(`\n⏳ [${currentIdx}/${total}] Допарсинг: ${item.slug} (${item.title || ""})`);

            if (onProgress) {
                onProgress({ index: currentIdx, total, slug: item.slug, title: item.title });
            }

            let fullData = null;
            let attempts = 0;
            const maxAttempts = 2;

            while (!fullData && attempts < maxAttempts) {
                attempts++;
                try {
                    await page.goto(item.url || item.canonical, { waitUntil: "domcontentloaded", timeout: 35000 });
                    await page.waitForTimeout(1500);
                    fullData = await parseProductPage(page, item.slug);
                } catch (e) {
                    console.log(`   ⚠️ Попытка ${attempts} не удалась: ${e.message}`);
                    if (attempts < maxAttempts) await page.waitForTimeout(2000);
                }
            }

            if (fullData) {
                // Объединяем старые данные с полученными полными данными
                const updatedProduct = {
                    ...item,
                    ...fullData,
                    slug: item.slug,
                    canonical: fullData.canonical || item.canonical || item.url,
                    url: item.url || fullData.canonical,
                    // Гарантируем HD обложку
                    image: fullData.image || item.image,
                    gallery: fullData.gallery && fullData.gallery.length > 0 ? fullData.gallery : (item.gallery || [item.image].filter(Boolean)),
                    // Снимаем статус черновика!
                    isDraft: false,
                    hydratedAt: new Date().toISOString()
                };

                // Сохраняем индивидуальный файл товара
                const prodFilePath = path.join(prodDir, `${item.slug}.json`);
                await fs.writeFile(prodFilePath, JSON.stringify(updatedProduct, null, 2), "utf8");

                // Обновляем в общем массиве allProducts
                const globalIdx = allProducts.findIndex(p => p.slug === item.slug);
                if (globalIdx !== -1) {
                    allProducts[globalIdx] = updatedProduct;
                }

                hydratedCount++;
                console.log(`   ✅ Успешно допарсен: галерея ${updatedProduct.gallery.length} фото, описание ${updatedProduct.fullDescription ? updatedProduct.fullDescription.length : 0} симв.`);
            } else {
                console.log(`   ❌ Не удалось распарсить страницу, оставлен как черновик.`);
                errors.push({ slug: item.slug, error: "Таймаут или ошибка загрузки страницы" });
            }
        }
    } finally {
        await page.close().catch(() => {});
    }

    // Сохраняем обновлённый all_products.json
    await fs.writeFile(allProdPath, JSON.stringify(allProducts, null, 2), "utf8");

    // Обновляем обложку в info.json если необходимо
    try {
        const iRaw = await fs.readFile(infoPath, "utf8");
        const info = JSON.parse(iRaw);
        if (allProducts.length > 0 && allProducts[0].image && (!info.image || info.image.includes("-300x"))) {
            info.image = allProducts[0].image;
            await fs.writeFile(infoPath, JSON.stringify(info, null, 2), "utf8");
        }
    } catch {}

    console.log(`\n🎉 Допарсинг завершён! Чистовых карточек обновлено: ${hydratedCount}/${itemsToProcess.length}`);

    return {
        success: true,
        hydratedCount,
        total: itemsToProcess.length,
        remainingDrafts: allProducts.filter(p => p.isDraft).length,
        errors
    };
}
