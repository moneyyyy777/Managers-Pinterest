// scripts/artify_sites_publishing/modules/migrate_to_json.js
import fs from 'fs/promises';
import { CONFIG } from '../config.js';

async function migrateTxtToJson() {
    console.log("========================================");
    console.log("🔄 ЗАПУСК МИГРАЦИИ: TXT -> JSON (МУЛЬТИ-АККАУНТ)");
    console.log("========================================\n");

    try {
        const txtData = await fs.readFile(CONFIG.PATHS.DB_TXT, 'utf8');
        const lines = txtData.split('\n').map(l => l.trim());

        const db = {};
        let currentAccountEmail = CONFIG.CLOUDFLARE_ACCOUNTS[0].email;
        let currentSection = "Other";
        let parsedCount = 0;

        const lineRegex = /^(.*?)\s+\((G-[A-Z0-9]+)\)\s+-\s+(https?:\/\/[^\s]+)\s+-\s+(https?:\/\/[^\s]+)(?:\s+-\s+(https?:\/\/[^\s]+))?(?:\s+-\s+(https?:\/\/[^\s]+))?/;

        for (const line of lines) {
            if (!line) continue;

            // Заголовок главного аккаунта Artify
            if (line.includes('ARTIFY STUDIO')) continue;

            // Заголовок аккаунта прокладок (например: kalifornia.lover7@gmail.com 150 HTMLs...)
            if (line.includes('@gmail.com') && line.includes('HTMLs')) {
                currentAccountEmail = line.split(' ')[0].trim();
                console.log(`\n📧 Читаю блок аккаунта: ${currentAccountEmail}`);
                continue;
            }

            // Заголовок раздела (Fonts, Procreate)
            if (!line.includes('http') && !line.includes('(')) {
                currentSection = line;
                continue;
            }

            const match = line.match(lineRegex);
            if (match) {
                const thematic = match[1].trim();
                
                db[thematic] = {
                    accountEmail: currentAccountEmail, // Привязываем к правильному email
                    section: currentSection.toLowerCase(),
                    gCode: match[2],
                    cfUrl: match[3],
                    mainUrl: match[4],
                    gSitePublic: match[5] || "",
                    gSiteEdit: match[6] || ""
                };
                parsedCount++;
                console.log(`✅ Распознано: [${currentAccountEmail}] [${currentSection}] ${thematic}`);
            }
        }

        await fs.writeFile(CONFIG.PATHS.DB_JSON, JSON.stringify(db, null, 2), 'utf8');

        console.log("\n========================================");
        console.log(`🎉 МИГРАЦИЯ УСПЕШНА! Перенесено записей: ${parsedCount}`);
        console.log(`📁 Файл сохранен: ${CONFIG.PATHS.DB_JSON}`);
        console.log("========================================\n");

    } catch (e) {
        console.error("❌ Ошибка при миграции:", e.message);
    }
}

migrateTxtToJson();