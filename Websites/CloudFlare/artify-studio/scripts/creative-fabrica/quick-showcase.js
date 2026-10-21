// scripts/creative-fabrica/quick-showcase.js
import fs from "fs/promises";
import path from "path";
import readline from "readline";
import { scrapeCategoryLinks } from "./helpers/scrape-category-links.js";
import { createQuickDrafts, getDraftsStatus } from "./helpers/quick-showcase.js";

const PROJECT_ROOT = process.cwd();
const CONTENT_DIR = path.join(PROJECT_ROOT, "content");

const askQuestion = (query) => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    return new Promise(resolve => rl.question(query, ans => { rl.close(); resolve(ans); }));
};

async function main() {
    console.log(`\n======================================================`);
    console.log(`⚡ БЫСТРЫЙ СБОР ВИТРИНЫ (ЧЕРНОВИКИ ДЛЯ МОДЕРАЦИИ)`);
    console.log(`   - Мгновенно собирает картинки и ссылки со страниц выдачи.`);
    console.log(`   - Создаёт товары-черновики сразу в all_products.json.`);
    console.log(`   - Менеджер может СРАЗУ открыть админку и почистить витрину!`);
    console.log(`======================================================\n`);

    const args = process.argv.slice(2);
    let targetCategory = args[0];
    let targetCollection = args[1];

    if (!targetCategory || !targetCollection) {
        // Сканируем папки с непустым for_links.txt
        const entries = await fs.readdir(CONTENT_DIR, { withFileTypes: true });
        const categories = entries.filter(d => d.isDirectory() && d.name !== "products").map(d => d.name);

        const availableTargets = [];
        for (const cat of categories) {
            const catDir = path.join(CONTENT_DIR, cat);
            const cols = (await fs.readdir(catDir, { withFileTypes: true })).filter(d => d.isDirectory()).map(d => d.name);
            for (const col of cols) {
                const forLinksPath = path.join(catDir, col, "for_links.txt");
                try {
                    const content = await fs.readFile(forLinksPath, "utf8");
                    const urls = content.split("\n").map(l => l.trim()).filter(l => l.startsWith("http"));
                    if (urls.length > 0) {
                        availableTargets.push({ category: cat, collection: col, urls });
                    }
                } catch {}
            }
        }

        if (availableTargets.length === 0) {
            console.log(`ℹ️ Не найдено подборок с заполненным for_links.txt.`);
            console.log(`Введите категорию и подборку вручную.`);
            targetCategory = await askQuestion("Категория (например, christmas): ");
            targetCollection = await askQuestion("Подборка (например, cliparts): ");
        } else {
            console.log(`Найдено подборок с задачами в for_links.txt:`);
            availableTargets.forEach((t, i) => {
                console.log(`  [${i + 1}] ${t.category} / ${t.collection} (${t.urls.length} источников)`);
            });

            const sel = await askQuestion(`\nВыберите номер подборки (1-${availableTargets.length}): `);
            const idx = parseInt(sel.trim(), 10) - 1;
            const chosen = availableTargets[idx] || availableTargets[0];
            targetCategory = chosen.category;
            targetCollection = chosen.collection;
        }
    }

    if (!targetCategory || !targetCollection) {
        console.log(`❌ Категория или подборка не указаны.`);
        process.exit(1);
    }

    const colDir = path.join(CONTENT_DIR, targetCategory, targetCollection);
    const forLinksPath = path.join(colDir, "for_links.txt");

    let sourceUrls = [];
    try {
        const raw = await fs.readFile(forLinksPath, "utf8");
        sourceUrls = raw.split("\n").map(l => l.trim()).filter(l => l.startsWith("http"));
    } catch {}

    if (sourceUrls.length === 0) {
        console.log(`\nВ ${targetCategory}/${targetCollection}/for_links.txt нет ссылок.`);
        const customUrl = await askQuestion(`Введите URL поиска/категории Creative Fabrica: `);
        if (customUrl.trim().startsWith("http")) {
            sourceUrls = [customUrl.trim()];
        } else {
            console.log(`❌ Ссылка не введена. Завершение работы.`);
            process.exit(1);
        }
    }

    console.log(`\n🚀 Запуск быстрого сбора для: ${targetCategory} / ${targetCollection}`);
    console.log(`Источников: ${sourceUrls.length} шт.`);

    const mixedLinks = await scrapeCategoryLinks(sourceUrls);

    if (mixedLinks.length === 0) {
        console.log(`❌ Не удалось собрать ни одной карточки.`);
        process.exit(1);
    }

    console.log(`\n📦 Собрано карточек: ${mixedLinks.length} шт.`);
    console.log(`💾 Создаём черновики витрины с превью...`);

    const result = await createQuickDrafts({
        category: targetCategory,
        collection: targetCollection,
        mixedLinks
    });

    console.log(`\n======================================================`);
    console.log(`🎉 ВИТРИНА ГОТОВА К МОДЕРАЦИИ!`);
    console.log(`   - Добавлено новых черновиков: ${result.addedCount}`);
    console.log(`   - Всего товаров в подборке: ${result.totalProducts}`);
    console.log(`   - Из них черновиков: ${result.draftsCount}`);
    console.log(`======================================================`);
    console.log(`\n👉 СЛЕДУЮЩИЕ ШАГИ ДЛЯ МЕНЕДЖЕРА:`);
    console.log(`1. Откройте админку: http://localhost:3333`);
    console.log(`2. Выберите ${targetCategory} / ${targetCollection}`);
    console.log(`3. Удалите ненужные товары в корзину (клик по иконке корзины)`);
    console.log(`4. После чистки запустите допарсинг оставшихся:`);
    console.log(`   npm run drafts:hydrate ${targetCategory} ${targetCollection}\n`);
}

main().catch(err => {
    console.error("Ошибка:", err);
    process.exit(1);
});
