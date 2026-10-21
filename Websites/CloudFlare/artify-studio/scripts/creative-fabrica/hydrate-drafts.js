// scripts/creative-fabrica/hydrate-drafts.js
import fs from "fs/promises";
import path from "path";
import readline from "readline";
import { hydrateApprovedDrafts, getDraftsStatus } from "./helpers/quick-showcase.js";

const PROJECT_ROOT = process.cwd();
const CONTENT_DIR = path.join(PROJECT_ROOT, "content");

const askQuestion = (query) => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    return new Promise(resolve => rl.question(query, ans => { rl.close(); resolve(ans); }));
};

async function main() {
    console.log(`\n======================================================`);
    console.log(`🎯 ДОПАРСИНГ ОДОБРЕННЫХ ТОВАРОВ (ИЗ ЧЕРНОВИКОВ В ЧИСТОВЫЕ)`);
    console.log(`   - Находит товары со статусом ⚡ Черновик, оставшиеся после модерации.`);
    console.log(`   - Скачивает full HD галерею, полное описание, отзывы и теги.`);
    console.log(`   - Превращает их в полноценные готовые карточки!`);
    console.log(`======================================================\n`);

    const args = process.argv.slice(2);
    let targetCategory = args[0];
    let targetCollection = args[1];
    let maxLimit = args[2] ? parseInt(args[2], 10) : null;

    if (!targetCategory || !targetCollection) {
        // Сканируем все подборки на наличие черновиков
        const entries = await fs.readdir(CONTENT_DIR, { withFileTypes: true });
        const categories = entries.filter(d => d.isDirectory() && d.name !== "products").map(d => d.name);

        const collectionsWithDrafts = [];
        for (const cat of categories) {
            const catDir = path.join(CONTENT_DIR, cat);
            const cols = (await fs.readdir(catDir, { withFileTypes: true })).filter(d => d.isDirectory()).map(d => d.name);
            for (const col of cols) {
                const status = await getDraftsStatus(cat, col);
                if (status.draftsCount > 0) {
                    collectionsWithDrafts.push({
                        category: cat,
                        collection: col,
                        ...status
                    });
                }
            }
        }

        if (collectionsWithDrafts.length === 0) {
            console.log(`✅ Черновиков не найдено! Все товары во всех подборках уже чистовые.`);
            process.exit(0);
        }

        console.log(`Подборки, ожидающие допарсинга (после модерации менеджера):`);
        collectionsWithDrafts.forEach((c, idx) => {
            console.log(`  [${idx + 1}] ${c.category} / ${c.collection} — ⚡ ${c.draftsCount} черновиков (всего ${c.total} товаров)`);
        });

        const ans = await askQuestion(`\nВыберите подборку (1-${collectionsWithDrafts.length}): `);
        const idx = parseInt(ans.trim(), 10) - 1;
        const chosen = collectionsWithDrafts[idx] || collectionsWithDrafts[0];
        targetCategory = chosen.category;
        targetCollection = chosen.collection;
    }

    const status = await getDraftsStatus(targetCategory, targetCollection);
    console.log(`\nПодборка: ${targetCategory} / ${targetCollection}`);
    console.log(`Всего товаров: ${status.total}`);
    console.log(`⚡ Черновиков к допарсингу: ${status.draftsCount}`);
    console.log(`✅ Чистовых товаров: ${status.publishedCount}`);

    if (status.draftsCount === 0) {
        console.log(`\nВ этой подборке нет черновиков, все товары уже чистовые!`);
        process.exit(0);
    }

    const confirm = await askQuestion(`\nЗапустить допарсинг ${status.draftsCount} черновиков? (Y/n): `);
    if (confirm.trim() && !['y', 'yes', '1', 'да'].includes(confirm.trim().toLowerCase())) {
        console.log(`Отменено пользователем.`);
        process.exit(0);
    }

    const res = await hydrateApprovedDrafts({
        category: targetCategory,
        collection: targetCollection,
        maxItems: maxLimit,
        onProgress: ({ index, total, slug, title }) => {
            // progress logged inside
        }
    });

    console.log(`\n======================================================`);
    console.log(`🎉 РЕЗУЛЬТАТ ДОПАРСИНГА:`);
    console.log(`   - Успешно допарсено: ${res.hydratedCount} из ${res.total}`);
    console.log(`   - Оставшихся черновиков: ${res.remainingDrafts}`);
    console.log(`======================================================\n`);
}

main().catch(err => {
    console.error("Ошибка:", err);
    process.exit(1);
});
