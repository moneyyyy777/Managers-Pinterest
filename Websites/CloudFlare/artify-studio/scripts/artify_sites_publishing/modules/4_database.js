// scripts/artify_sites_publishing/modules/4_database.js
import fs from 'fs/promises';
import { CONFIG } from '../config.js';

export async function loadDatabase() {
    try {
        const data = await fs.readFile(CONFIG.PATHS.DB_JSON, 'utf8');
        return JSON.parse(data);
    } catch {
        return {};
    }
}

/**
 * УМНЫЙ АНАЛИЗАТОР: Находит первый свободный аккаунт Cloudflare (< 150 сайтов)
 */
export function getActiveAccountInfo(db) {
    const counts = {};
    for (const acc of CONFIG.CLOUDFLARE_ACCOUNTS) {
        counts[acc.email] = 0;
    }

    for (const data of Object.values(db)) {
        const acc = data.accountEmail || CONFIG.CLOUDFLARE_ACCOUNTS[0].email;
        counts[acc] = (counts[acc] || 0) + 1;
    }

    for (const acc of CONFIG.CLOUDFLARE_ACCOUNTS) {
        const currentCount = counts[acc.email] || 0;
        if (currentCount < acc.maxSites) {
            return {
                email: acc.email,
                currentCount: currentCount,
                maxSites: acc.maxSites,
                remaining: acc.maxSites - currentCount
            };
        }
    }

    const last = CONFIG.CLOUDFLARE_ACCOUNTS[CONFIG.CLOUDFLARE_ACCOUNTS.length - 1];
    return {
        email: last.email,
        currentCount: counts[last.email] || 0,
        maxSites: last.maxSites,
        remaining: 0
    };
}

export async function updateDatabase(thematic, newData) {
    const db = await loadDatabase();
    
    // Если аккаунт еще не был привязан к этой подборке, берем текущий свободный
    if (!db[thematic]?.accountEmail && !newData.accountEmail) {
        const activeAcc = getActiveAccountInfo(db);
        newData.accountEmail = activeAcc.email;
    }

    db[thematic] = { ...(db[thematic] || {}), ...newData };
    
    await fs.writeFile(CONFIG.PATHS.DB_JSON, JSON.stringify(db, null, 2), 'utf8');
    await generateTxtReport(db);
}

/**
 * Генерирует идеальный текстовый файл с разбивкой по аккаунтам
 */
async function generateTxtReport(db) {
    let txtOutput = `${CONFIG.MAIN_ACCOUNT_EMAIL} - ${CONFIG.BRAND_NAME} -  ${CONFIG.MAIN_DOMAIN}\n\n`;

    // Группируем записи: Аккаунт -> Раздел -> Записи
    const byAccount = {};
    for (const [thematic, data] of Object.entries(db)) {
        const accEmail = data.accountEmail || CONFIG.CLOUDFLARE_ACCOUNTS[0].email;
        if (!byAccount[accEmail]) byAccount[accEmail] = {};

        const section = data.section || "other";
        if (!byAccount[accEmail][section]) byAccount[accEmail][section] = [];

        const gCode = data.gCode || "NO_CODE";
        const cfUrl = data.cfUrl || "NO_CF_URL";
        const mainUrl = data.mainUrl || "NO_MAIN_URL";
        const publicUrl = data.gSitePublic || "";
        const editUrl = data.gSiteEdit || "";

        let line = `${thematic} (${gCode}) - ${cfUrl} - ${mainUrl}`;
        if (publicUrl) line += ` - ${publicUrl}`;
        if (editUrl) line += ` - ${editUrl}`;

        byAccount[accEmail][section].push(line);
    }

    // Выводим структурированный отчет
    for (const acc of CONFIG.CLOUDFLARE_ACCOUNTS) {
        const accData = byAccount[acc.email];
        // Если на аккаунте пока нет сайтов и это не первый аккаунт — пропускаем
        if (!accData && acc.email !== CONFIG.CLOUDFLARE_ACCOUNTS[0].email) continue;

        txtOutput += `${acc.email} ${acc.maxSites} HTMLs Cloudflare Pages:\n\n`;

        if (accData) {
            for (const [section, lines] of Object.entries(accData)) {
                const sectionTitle = section.charAt(0).toUpperCase() + section.slice(1);
                txtOutput += `${sectionTitle}\n`;
                txtOutput += lines.join('\n') + '\n\n';
            }
        }
    }

    await fs.writeFile(CONFIG.PATHS.DB_TXT, txtOutput.trim() + '\n', 'utf8');
}