#!/usr/bin/env node

/**
 * Скрипт скоринга и ранжирования товаров подборки Artify Studio.
 * Использование:
 *   node score.js <category> <collection> [--apply] [--limit=20] [--json]
 */

import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, '../../../../');
const CONTENT_DIR = path.join(PROJECT_ROOT, 'content');

const args = process.argv.slice(2);
const category = args.find(a => !a.startsWith('--'));
const collection = args.filter(a => !a.startsWith('--'))[1];
const shouldApply = args.includes('--apply');
const isJson = args.includes('--json');
const limitArg = args.find(a => a.startsWith('--limit='));
const limit = limitArg ? parseInt(limitArg.split('=')[1], 10) : 20;

if (!category || !collection) {
    console.error('Ошибка: укажите категорию и подборку.');
    console.error('Пример: node score.js christmas seamless [--apply] [--limit=20]');
    process.exit(1);
}

function calculateScore(prod) {
    let score = 0;
    const details = {};

    // 1. Оценка рейтинга (до 40 баллов)
    const rating = typeof prod.rating === 'number' ? prod.rating : null;
    if (rating !== null) {
        if (rating >= 4.9) { score += 40; details.rating = '+40 (★ 4.9-5.0)'; }
        else if (rating >= 4.8) { score += 35; details.rating = '+35 (★ 4.8)'; }
        else if (rating >= 4.5) { score += 25; details.rating = '+25 (★ 4.5-4.7)'; }
        else if (rating >= 4.0) { score += 10; details.rating = '+10 (★ 4.0-4.4)'; }
        else { score -= 30; details.rating = '-30 (Низкий ★ <4.0)'; }
    } else {
        score += 15; // Нейтрально для новых товаров без оценок
        details.rating = '+15 (Новый / без оценок)';
    }

    // 2. Оценка избранного / популярности (до 35 баллов)
    let fav = 0;
    if (typeof prod.favorites === 'number') fav = prod.favorites;
    else if (prod.favoritesRaw) {
        const parsed = parseInt(String(prod.favoritesRaw).replace(/[^0-9]/g, ''), 10);
        if (!isNaN(parsed)) fav = parsed;
    }
    if (fav >= 500) { score += 35; details.fav = `+35 (🔥 ${fav}X favorites)`; }
    else if (fav >= 200) { score += 25; details.fav = `+25 (${fav}X favorites)`; }
    else if (fav >= 50) { score += 15; details.fav = `+15 (${fav}X favorites)`; }
    else if (fav >= 10) { score += 8; details.fav = `+8 (${fav}X favorites)`; }
    else if (fav > 0) { score += 3; details.fav = `+3 (${fav}X favorites)`; }
    else { details.fav = '0 (нет в избранном)'; }

    // 3. Оценка отзывов (до 15 баллов)
    const reviews = typeof prod.reviewsCount === 'number' ? prod.reviewsCount : 0;
    if (reviews >= 10) { score += 15; details.reviews = `+15 (${reviews} отзывов)`; }
    else if (reviews >= 3) { score += 10; details.reviews = `+10 (${reviews} отзывов)`; }
    else if (reviews >= 1) { score += 5; details.reviews = `+5 (${reviews} отзыв)`; }
    else { details.reviews = '0 (нет отзывов)'; }

    // 4. Проверка картинки и черновиков
    if (prod.image && prod.image.startsWith('http')) {
        score += 10;
        details.image = '+10 (качественное превью)';
    } else {
        score -= 40;
        details.image = '-40 (нет превью!)';
    }

    if (prod.isDraft) {
        score -= 25;
        details.draft = '-25 (черновик)';
    }

    return {
        score: Math.max(0, Math.min(100, score)),
        details,
        fav,
        reviews,
        rating
    };
}

async function main() {
    const colDir = path.join(CONTENT_DIR, category, collection);
    const allProdPath = path.join(colDir, 'all_products.json');
    const colFilePath = path.join(colDir, 'collection.json');
    const linksPath = path.join(colDir, 'links.txt');

    let allProducts = [];
    try {
        allProducts = JSON.parse(await fs.readFile(allProdPath, 'utf8'));
    } catch (e) {
        console.error(`Ошибка чтения ${allProdPath}:`, e.message);
        process.exit(1);
    }

    if (allProducts.length === 0) {
        console.log(`В подборке ${category}/${collection} нет товаров.`);
        return;
    }

    // Рассчитываем скоринг для каждого товара
    const scored = allProducts.map(prod => {
        const sc = calculateScore(prod);
        return {
            slug: prod.slug,
            title: prod.title || prod.slug,
            canonical: prod.canonical || `https://www.creativefabrica.com/product/${prod.slug}/`,
            ...sc
        };
    });

    // Сортируем: высокий скоринг первее
    scored.sort((a, b) => b.score - a.score || b.fav - a.fav || b.reviews - a.reviews);

    if (isJson) {
        console.log(JSON.stringify(scored.slice(0, limit), null, 2));
        return;
    }

    console.log(`\n========================================================================`);
    console.log(`🏆 РЕЙТИНГ И СКОРИНГ ТОВАРОВ: ${category.toUpperCase()} / ${collection.toUpperCase()}`);
    console.log(`Всего товаров в подборке: ${allProducts.length}`);
    console.log(`========================================================================\n`);

    const topItems = scored.slice(0, limit);
    topItems.forEach((item, idx) => {
        const star = item.rating !== null ? `★ ${item.rating}` : '☆ нет';
        const rank = `#${idx + 1}`.padEnd(4);
        const scoreStr = `${item.score} б.`.padStart(6);
        const favStr = `${item.fav} fav`.padStart(9);
        const titleShort = item.title.length > 36 ? item.title.slice(0, 33) + '...' : item.title.padEnd(36);
        console.log(`${rank} [${scoreStr}] ${star} | ${favStr} | ${titleShort} | (${item.slug})`);
    });

    // Анализ аутсайдеров (с низким баллом)
    const lowItems = scored.filter(s => s.score < 30);
    if (lowItems.length > 0) {
        console.log(`\n⚠️ Товары-аутсайдеры (скоринг < 30): ${lowItems.length} шт.`);
        lowItems.slice(0, 5).forEach(l => {
            console.log(`   - ${l.slug}: ${l.score} б. (★ ${l.rating || 0}, ${l.fav} fav) — кандидат на удаление/перенос`);
        });
    }

    if (shouldApply) {
        console.log(`\n💾 Применение нового порядка скоринга к витрине...`);
        const newSlugs = scored.map(s => s.slug);
        const newLinks = scored.map(s => s.canonical);

        // Бэкап
        try {
            await fs.copyFile(colFilePath, `${colFilePath}.bak`);
        } catch {}

        await fs.writeFile(colFilePath, JSON.stringify({ items: newSlugs }, null, 2), 'utf8');
        await fs.writeFile(linksPath, newLinks.join('\n') + '\n', 'utf8');

        console.log(`✅ Порядок витрины успешно обновлён в collection.json и links.txt!`);
        console.log(`   Бэкап сохранён в: collection.json.bak`);
    } else {
        console.log(`\n💡 Чтобы автоматически применить этот порядок к витрине сайта:`);
        console.log(`   добавьте флаг --apply:`);
        console.log(`   node .agents/skills/product-scoring/scripts/score.js ${category} ${collection} --apply\n`);
    }
}

main().catch(err => {
    console.error('Ошибка выполнения скрипта скоринга:', err);
    process.exit(1);
});
