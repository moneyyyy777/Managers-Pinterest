#!/usr/bin/env node

/**
 * Скрипт аудита, очистки в корзину и умного предложения переноса товаров.
 * Использование:
 *   node curate.js <category> <collection> [--json]
 */

import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, '../../../../');
const CONTENT_DIR = path.join(PROJECT_ROOT, 'content');
const CATEGORIES_FILE = path.join(PROJECT_ROOT, 'src', 'data', 'categories.json');

const args = process.argv.slice(2);
const category = args.find(a => !a.startsWith('--'));
const collection = args.filter(a => !a.startsWith('--'))[1];
const isJson = args.includes('--json');

if (!category || !collection) {
    console.error('Ошибка: укажите категорию и подборку.');
    console.error('Пример: node curate.js christmas fonts');
    process.exit(1);
}

// Семантические маркеры для поиска несовпадений и подходящих подборок
const THEME_RULES = [
    { type: 'font', kw: ['font', 'fonts', 'typeface', 'typefaces', 'script', 'scripts', 'calligraphy', 'lettering', 'otf', 'ttf', 'woff', 'sans', 'serif'] },
    { type: 'seamless', kw: ['seamless', 'pattern', 'patterns', 'digital paper', 'digital papers', 'papers', 'seamless pattern', 'background paper'] },
    { type: 'clipart', kw: ['clipart', 'cliparts', 'clip art', 'png', 'watercolor', 'illustration', 'bundle png', 'elements png'] },
    { type: 'procreate', kw: ['procreate', 'brush', 'brushes', 'procreate brush', 'stamp', 'stamps', 'brush stamp', 'swatch'] },
    { type: 'coloring', kw: ['coloring', 'coloring page', 'coloring pages', 'coloring book', 'line art', 'pages for kids', 'adult coloring'] },
    { type: 'embroidery', kw: ['embroidery', 'pes', 'dst', 'applique', 'machine embroidery', 'stitch', 'cross stitch'] },
    { type: '3d-printing', kw: ['3d print', '3d printing', 'stl', '3d model', 'obj', '3d file', '3d-printing'] },
    { type: 'planner', kw: ['planner', 'planners', 'tracker', 'journal', 'digital planner', 'notion', 'goodnotes', 'calendar', 'hyperlinked'] },
    { type: 'svg', kw: ['svg', 'svgs', 'cut file', 'cricut', 'silhouette', 'laser cut', 'glowforge', 'dxf'] },
    { type: 'sticker', kw: ['sticker', 'stickers', 'printable stickers', 'goodnotes stickers', 'die cut'] }
];

function detectType(text) {
    if (!text) return null;
    const lower = text.toLowerCase().replace(/[-_]/g, ' ');
    const matches = [];
    for (const rule of THEME_RULES) {
        let score = 0;
        for (const kw of rule.kw) {
            const re = new RegExp(`\\b${kw.replace(/[-\\/\\\\^$*+?.()|[\\]{}]/g, '\\$&')}\\b`, 'i');
            if (re.test(lower)) score++;
        }
        if (score > 0) matches.push({ type: rule.type, score });
    }
    matches.sort((a, b) => b.score - a.score);
    return matches.length > 0 ? matches[0].type : null;
}

async function loadAllCollections() {
    const list = [];
    try {
        const catDirs = await fs.readdir(CONTENT_DIR, { withFileTypes: true });
        for (const catEntry of catDirs) {
            if (!catEntry.isDirectory() || catEntry.name === 'products') continue;
            const catId = catEntry.name;
            const catPath = path.join(CONTENT_DIR, catId);
            try {
                const colDirs = await fs.readdir(catPath, { withFileTypes: true });
                for (const colEntry of colDirs) {
                    if (!colEntry.isDirectory() || colEntry.name === 'products') continue;
                    const colName = colEntry.name;
                    const infoPath = path.join(catPath, colName, 'info.json');
                    let title = colName.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
                    try {
                        const info = JSON.parse(await fs.readFile(infoPath, 'utf8'));
                        if (info.title) title = info.title;
                    } catch {}
                    list.push({ category: catId, collection: colName, title });
                }
            } catch {}
        }
    } catch {}
    return list;
}

function findBestTargetCollection(allCols, detectedType, currentCat, currentCol) {
    if (!detectedType) return null;

    // Сначала ищем подходящую подборку внутри той же категории
    const sameCat = allCols.filter(c => c.category === currentCat && c.collection !== currentCol);
    const foundSame = sameCat.find(c => {
        const cType = detectType(c.collection) || detectType(c.title);
        return cType === detectedType || c.collection.includes(detectedType);
    });
    if (foundSame) {
        return {
            category: foundSame.category,
            collection: foundSame.collection,
            title: foundSame.title,
            isSameCategory: true
        };
    }

    // Ищем в других категориях
    const otherCats = allCols.filter(c => c.category !== currentCat);
    const foundOther = otherCats.find(c => {
        const cType = detectType(c.collection) || detectType(c.title);
        return cType === detectedType || c.collection.includes(detectedType);
    });
    if (foundOther) {
        return {
            category: foundOther.category,
            collection: foundOther.collection,
            title: foundOther.title,
            isSameCategory: false
        };
    }

    return null;
}

async function main() {
    const colDir = path.join(CONTENT_DIR, category, collection);
    const allProdPath = path.join(colDir, 'all_products.json');

    const allCols = await loadAllCollections();

    let allProducts = [];
    try {
        allProducts = JSON.parse(await fs.readFile(allProdPath, 'utf8'));
    } catch (e) {
        console.error(`Ошибка чтения ${allProdPath}:`, e.message);
        process.exit(1);
    }

    const currentColType = detectType(collection) || collection;

    const toTrash = [];
    const toRelocate = [];
    const approved = [];

    allProducts.forEach(prod => {
        const title = prod.title || prod.slug;
        const rating = typeof prod.rating === 'number' ? prod.rating : null;
        let fav = 0;
        if (typeof prod.favorites === 'number') fav = prod.favorites;
        else if (prod.favoritesRaw) fav = parseInt(String(prod.favoritesRaw).replace(/[^0-9]/g, ''), 10) || 0;
        const reviews = typeof prod.reviewsCount === 'number' ? prod.reviewsCount : 0;
        const tags = Array.isArray(prod.designerTags) ? prod.designerTags.join(' ') : '';
        const fullText = `${title} ${tags}`;

        const isHighQuality = (rating !== null && rating >= 4.7) || fav >= 25 || reviews >= 2;
        const isBad = (rating !== null && rating < 4.0 && reviews > 0) || !prod.image || prod.isDraft;

        // 1. Проверка на явный брак / мусор
        if (isBad) {
            let reason = 'Низкое качество';
            if (!prod.image) reason = 'Отсутствует изображение товара';
            else if (rating !== null && rating < 4.0) reason = `Низкий рейтинг покупателей (★ ${rating})`;
            else if (prod.isDraft) reason = 'Черновик / неполное описание';

            toTrash.push({
                slug: prod.slug,
                title,
                rating,
                fav,
                reason,
                action: 'trash'
            });
            return;
        }

        // 2. Семантическая проверка соответствия подборке
        const itemType = detectType(fullText);
        const isMismatched = itemType && itemType !== currentColType;

        if (isMismatched) {
            if (isHighQuality) {
                // Товар классный, но не наша семантика -> ПЕРЕНОС
                const targetCol = findBestTargetCollection(allCols, itemType, category, collection);
                toRelocate.push({
                    slug: prod.slug,
                    title,
                    rating,
                    fav,
                    reviews,
                    detectedType: itemType,
                    target: targetCol ? {
                        category: targetCol.category,
                        collection: targetCol.collection,
                        title: targetCol.title
                    } : null,
                    suggestedNewName: targetCol ? null : `${category}/${itemType}s`,
                    action: 'relocate'
                });
            } else {
                // И не подходит, и показателей нет -> В корзину с вежливой причиной
                toTrash.push({
                    slug: prod.slug,
                    title,
                    rating,
                    fav,
                    reason: `Не соответствует тематике подборки (определено как: ${itemType})`,
                    action: 'trash'
                });
            }
            return;
        }

        // 3. Товар подходит
        approved.push(prod);
    });

    if (isJson) {
        console.log(JSON.stringify({ toTrash, toRelocate, approvedCount: approved.length }, null, 2));
        return;
    }

    console.log(`\n========================================================================`);
    console.log(`🧹 АУДИТ И МОДЕРАЦИЯ ПОДБОРКИ: ${category.toUpperCase()} / ${collection.toUpperCase()}`);
    console.log(`Всего проверено товаров: ${allProducts.length}`);
    console.log(`========================================================================\n`);

    console.log(`✅ Одобрено (остаются на витрине): ${approved.length} товаров`);

    if (toRelocate.length > 0) {
        console.log(`\n↪️  КАНДИДАТЫ НА ПЕРЕНОС (${toRelocate.length} шт.) — качественные товары не той семантики:`);
        toRelocate.forEach((r, idx) => {
            const stats = `★ ${r.rating || 5} | ${r.fav} fav`;
            console.log(`\n  [${idx + 1}] ${r.title} (${r.slug}) [${stats}]`);
            if (r.target) {
                console.log(`      🎯 Рекомендация: Перенести в существующую подборку: ${r.target.category} / ${r.target.title} (${r.target.collection})`);
            } else {
                console.log(`      ✨ Рекомендация: Создать новую подборку «${r.suggestedNewName}» и переместить туда`);
            }
        });
    }

    if (toTrash.length > 0) {
        console.log(`\n🗑️  КАНДИДАТЫ В КОРЗИНУ (${toTrash.length} шт.):`);
        toTrash.slice(0, 15).forEach((t, idx) => {
            console.log(`  [${idx + 1}] ${t.title} (${t.slug})`);
            console.log(`      Причина: ${t.reason}`);
        });
        if (toTrash.length > 15) {
            console.log(`  ... и ещё ${toTrash.length - 15} товаров.`);
        }
    }

    console.log(`\n========================================================================`);
    console.log(`💡 Как менеджеру применить решения:`);
    console.log(`1. Через браузерную админку (http://localhost:3333):`);
    console.log(`   - Нажмите кнопку переноса [↪️] на карточке нужного товара.`);
    console.log(`   - Или выберите чекбоксами товары и нажмите «Удалить в корзину» внизу.`);
    console.log(`2. Через чат с ассистентом:`);
    console.log(`   - Напишите: «Перенеси товар <slug> в подборку <коллекция>»`);
    console.log(`   - Или: «Отправь кандидата <slug> в корзину с причиной <причина>»`);
    console.log(`========================================================================\n`);
}

main().catch(err => {
    console.error('Ошибка выполнения скрипта модерации:', err);
    process.exit(1);
});
