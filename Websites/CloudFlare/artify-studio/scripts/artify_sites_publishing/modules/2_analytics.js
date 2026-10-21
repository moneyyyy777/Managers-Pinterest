// scripts/artify_sites_publishing/modules/2_analytics.js
import { AnalyticsAdminServiceClient } from '@google-analytics/admin';
import { CONFIG } from '../config.js';
import fsSync from 'fs';
import fs from 'fs/promises';
import path from 'path';

/**
 * 🔍 ШАГ 1: Ищет существующий G-код в файле analytics_g_rules.json
 */
async function findExistingGCodeInRules(thematicName, relativeTaskPath) {
    try {
        const rulesPath = CONFIG.PATHS.ANALYTICS_RULES;
        if (!fsSync.existsSync(rulesPath)) return null;

        const content = await fs.readFile(rulesPath, 'utf8');
        const rulesData = JSON.parse(content);
        
        // Сначала ищем по точному пути в path_rules
        if (relativeTaskPath && rulesData.path_rules && rulesData.path_rules[relativeTaskPath]) {
            const found = rulesData.path_rules[relativeTaskPath];
            if (found && found.code && found.code.startsWith('G-') && !found.code.includes('TEST')) {
                return found.code;
            }
        }
        
        if (Array.isArray(rulesData.rules)) {
            // Ищем совпадение по имени тематики (без учета регистра и пробелов)
            const found = rulesData.rules.find(r => 
                r.thematic && r.thematic.trim().toLowerCase() === thematicName.trim().toLowerCase()
            );
            
            // Если нашли готовый валидный G-код (не TEST)
            if (found && found.code && found.code.startsWith('G-') && !found.code.includes('TEST')) {
                return found.code;
            }
        }
    } catch (e) {
        console.log(`⚠️ Ошибка чтения analytics_g_rules.json: ${e.message}`);
    }
    return null; // В правилах нет готового кода
}

/**
 * Дописывает или обновляет правило в analytics_g_rules.json
 */
async function updateAnalyticsRulesFile(thematicName, gCode, relativeTaskPath) {
    try {
        const rulesPath = CONFIG.PATHS.ANALYTICS_RULES;
        let rulesData = { default_code: "G-47566RP1X0", rules: [] };
        
        if (fsSync.existsSync(rulesPath)) {
            rulesData = JSON.parse(await fs.readFile(rulesPath, 'utf8'));
        }

        const newRule = {
            brand: "Cloudflare",
            suffix: "WL",
            thematic: thematicName,
            code: gCode
        };

        if (relativeTaskPath) {
            if (!rulesData.path_rules) rulesData.path_rules = {};
            rulesData.path_rules[relativeTaskPath] = newRule;
        } else {
            if (!rulesData.rules) rulesData.rules = [];
            const existingIndex = rulesData.rules.findIndex(r => 
                r.thematic && r.thematic.trim().toLowerCase() === thematicName.trim().toLowerCase()
            );
            if (existingIndex >= 0) {
                rulesData.rules[existingIndex] = newRule;
            } else {
                rulesData.rules.push(newRule);
            }
        }

        await fs.writeFile(rulesPath, JSON.stringify(rulesData, null, 2), 'utf8');
        console.log(`📝 Запись синхронизирована с analytics_g_rules.json (через path_rules)`);
    } catch (e) {
        console.log(`⚠️ Не удалось обновить analytics_g_rules.json: ${e.message}`);
    }
}

export async function getOrCreateAnalytics(thematicName, siteUrl, relativeTaskPath) {
    console.log(`\n📊 [Модуль 2: Analytics] Проверка и подготовка G-кода для: ${thematicName}`);

    // 1. СНАЧАЛА ПРОВЕРЯЕМ analytics_g_rules.json
    const existingCodeInRules = await findExistingGCodeInRules(thematicName, relativeTaskPath);
    if (existingCodeInRules) {
        console.log(`⏩ [Analytics] НАЙДЕН ГОТОВЫЙ КОД В analytics_g_rules.json: ${existingCodeInRules}`);
        console.log(`   ✨ Создавать новый ресурс в Google Analytics НЕ требуется!`);
        return existingCodeInRules;
    }

    // 2. ЕСЛИ В ПРАВИЛАХ НЕТ — СОЗДАЕМ НОВЫЙ РЕСУРС ЧЕРЕЗ GOOGLE API
    const propertyName = `Artify to ${thematicName} | Google Site - Artify Studios (WL)`;
    const keyPath = CONFIG.PATHS.GOOGLE_KEY;
    
    if (!fsSync.existsSync(keyPath)) {
        console.log(`⚠️ ВНИМАНИЕ: Файл google-key.json не найден!`);
        console.log(`💡 Использую тестовую заглушку G-TEST-12345...`);
        const fallbackCode = "G-TEST-12345";
        await updateAnalyticsRulesFile(thematicName, fallbackCode, relativeTaskPath);
        return fallbackCode;
    }

    const client = new AnalyticsAdminServiceClient({ keyFilename: keyPath });

    try {
        console.log(`🚀 Код не найден в правилах. Создаю НОВЫЙ ресурс в Google Analytics: "${propertyName}"...`);

        // Создаем Ресурс (Property)
        const [property] = await client.createProperty({
            property: {
                parent: `accounts/${CONFIG.GA_ACCOUNT_ID}`,
                displayName: propertyName,
                timeZone: 'America/Toronto',
                currencyCode: 'USD',
            },
        });
        console.log(`✅ Ресурс успешно создан!`);

        // Создаем Поток данных
        const [dataStream] = await client.createDataStream({
            parent: property.name,
            dataStream: {
                displayName: propertyName,
                type: 'WEB_DATA_STREAM',
                webStreamData: {
                    defaultUri: siteUrl || "https://sites.google.com",
                },
            },
        });

        const gCode = dataStream.webStreamData.measurementId;
        console.log(`🎉 Поток создан! Твой новый G-Tag: ${gCode}`);

        // Записываем новый код в analytics_g_rules.json
        await updateAnalyticsRulesFile(thematicName, gCode, relativeTaskPath);

        return gCode;

    } catch (error) {
        console.error(`❌ Ошибка API Google Analytics:`, error.message);
        throw error;
    }
}