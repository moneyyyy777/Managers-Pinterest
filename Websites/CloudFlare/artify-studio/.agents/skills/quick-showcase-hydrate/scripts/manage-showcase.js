// .agents/skills/quick-showcase-hydrate/scripts/manage-showcase.js
import path from "path";
import { fileURLToPath } from "url";
import { getDraftsStatus, hydrateApprovedDrafts, createQuickDrafts } from "../../../../scripts/creative-fabrica/helpers/quick-showcase.js";
import { scrapeCategoryLinks } from "../../../../scripts/creative-fabrica/helpers/scrape-category-links.js";
import fs from "fs/promises";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, "../../../../");
const CONTENT_DIR = path.join(PROJECT_ROOT, "content");

async function main() {
    const action = process.argv[2];
    const category = process.argv[3];
    const collection = process.argv[4];
    const limit = process.argv[5] ? parseInt(process.argv[5], 10) : null;

    if (!action || !category || !collection) {
        console.log(JSON.stringify({
            error: "Использование: node manage-showcase.js <status|quick|hydrate> <category> <collection> [limit]"
        }, null, 2));
        process.exit(1);
    }

    if (action === "status") {
        const status = await getDraftsStatus(category, collection);
        console.log(JSON.stringify({
            category,
            collection,
            ...status
        }, null, 2));
        return;
    }

    if (action === "quick") {
        const forLinksPath = path.join(CONTENT_DIR, category, collection, "for_links.txt");
        let sourceUrls = [];
        try {
            const raw = await fs.readFile(forLinksPath, "utf8");
            sourceUrls = raw.split("\n").map(l => l.trim()).filter(l => l.startsWith("http"));
        } catch {}

        if (sourceUrls.length === 0) {
            console.log(JSON.stringify({
                error: `Файл ${category}/${collection}/for_links.txt пуст или не найден.`
            }, null, 2));
            process.exit(1);
        }

        console.log(`[QuickShowcase] Сбор карточек из ${sourceUrls.length} источников...`);
        const mixedLinks = await scrapeCategoryLinks(sourceUrls);

        if (mixedLinks.length === 0) {
            console.log(JSON.stringify({ error: "Не удалось собрать карточки с сайта" }, null, 2));
            process.exit(1);
        }

        const res = await createQuickDrafts({ category, collection, mixedLinks, maxLimit: limit });
        console.log(JSON.stringify({
            success: true,
            action: "quick",
            category,
            collection,
            ...res
        }, null, 2));
        return;
    }

    if (action === "hydrate") {
        const res = await hydrateApprovedDrafts({ category, collection, maxItems: limit });
        console.log(JSON.stringify({
            action: "hydrate",
            category,
            collection,
            ...res
        }, null, 2));
        return;
    }

    console.log(JSON.stringify({ error: `Неизвестное действие: ${action}` }, null, 2));
}

main().catch(err => {
    console.error(JSON.stringify({ error: err.message }, null, 2));
    process.exit(1);
});
