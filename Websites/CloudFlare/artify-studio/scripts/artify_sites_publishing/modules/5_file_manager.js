import fs from 'fs/promises';
import fsSync from 'fs';
import path from 'path';
import { CONFIG } from '../config.js';

function getTodayDateStr() {
    const now = new Date();
    const dd = String(now.getDate()).padStart(2, '0');
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const yy = String(now.getFullYear()).slice(-2);
    return `${dd}${mm}${yy}`;
}

function cleanFolderName(folderName) {
    return folderName.replace(/\s+\S.*\s+\d{6}$/, '').trim();
}

async function findTargetDirectories(startDir) {
    const results = [];
    async function walk(currentDir) {
        let entries;
        try { entries = await fs.readdir(currentDir, { withFileTypes: true }); } 
        catch { return; }
        const subdirs = entries.filter(d => d.isDirectory() && !d.name.startsWith('.'));
        const numberedDirs = subdirs
            .filter(d => /^\d+/.test(d.name))
            .map(d => d.name)
            .sort((a, b) => parseInt(a.match(/^\d+/)[0]) - parseInt(b.match(/^\d+/)[0]));
        if (numberedDirs.length > 0) {
            results.push({ containerPath: currentDir, numberedDirs: numberedDirs });
        } else {
            for (const subdir of subdirs) {
                await walk(path.join(currentDir, subdir.name));
            }
        }
    }
    await walk(startDir);
    return results;
}

export async function processAllFolders(sourceNichePath, htmlPublishPath, thematicName, askQuestionFn, relativeTaskPath, keepHierarchy) {
    console.log(`\n📁 [Модуль 5: File Manager] Сканирую папки для ALL FOLDERS...`);

    let brand = "Cloudflare";
    let suffix = "WL";

    try {
        if (fsSync.existsSync(CONFIG.PATHS.ANALYTICS_RULES)) {
            const rulesData = JSON.parse(await fs.readFile(CONFIG.PATHS.ANALYTICS_RULES, 'utf8'));
            
            // 1. Поиск по точному пути
            const pathRules = rulesData.path_rules || {};
            if (relativeTaskPath && pathRules[relativeTaskPath]) {
                const exactRule = pathRules[relativeTaskPath];
                brand = exactRule.brand || brand;
                suffix = exactRule.suffix || suffix;
                console.log(`   ✅ [Аналитика] Найдено правило по точному пути в path_rules!`);
            } else {
                // 2. Старый поиск по словам
                const rule = rulesData.rules?.find(r => r.thematic && r.thematic.toLowerCase() === thematicName.toLowerCase());
                if (rule) {
                    brand = rule.brand || brand;
                    suffix = rule.suffix || suffix;
                }
            }
        }
    } catch (e) {
        console.log(`⚠️ Ошибка чтения analytics_g_rules.json: ${e.message}`);
    }

    const todayDate = getTodayDateStr();
    const platformBlock = `${brand} ${suffix} ${todayDate}`.trim();

    const allFoldersRoot = path.join(CONFIG.PATHS.PINTEREST_ROOT, 'Keywords/Artify Studio/ALL FOLDERS');
    let targetNicheInAllFolders;

    if (keepHierarchy === 'y' && relativeTaskPath) {
        // Сохраняем полную иерархию (например: Christmas/Bundles/Fonts)
        targetNicheInAllFolders = path.join(allFoldersRoot, relativeTaskPath);
    } else {
        // Старая плоская логика (последние 2 папки)
        const pathParts = sourceNichePath.split(path.sep).filter(Boolean);
        const nicheName = pathParts[pathParts.length - 1]; 
        const sectionName = pathParts[pathParts.length - 2] || ""; 
        targetNicheInAllFolders = path.join(allFoldersRoot, sectionName, nicheName);
    }

    if (fsSync.existsSync(targetNicheInAllFolders)) {
        console.log(`\n⚠️  Внимание! Папка в ALL FOLDERS уже существует:`);
        console.log(`   👉 ${targetNicheInAllFolders}`);
        
        let overwrite = 'y';
        if (askQuestionFn) {
            const ans = await askQuestionFn(`   Пересоздать её с нуля? (Y/n - по умолч. Y): `);
            if (ans.trim().toLowerCase() === 'n' || ans.trim().toLowerCase() === 'no' || ans.trim() === 'нет') {
                overwrite = 'n';
            }
        }

        if (overwrite === 'y') {
            console.log(`🗑️  Удаляю старую папку в ALL FOLDERS для чистой перезаписи...`);
            await fs.rm(targetNicheInAllFolders, { recursive: true, force: true });
            await fs.mkdir(targetNicheInAllFolders, { recursive: true });
        } else {
            console.log(`⏩ Пропускаю перезапись ALL FOLDERS.`);
            return;
        }
    } else {
        await fs.mkdir(targetNicheInAllFolders, { recursive: true });
    }

    const targetGroups = await findTargetDirectories(sourceNichePath);
    if (targetGroups.length === 0) {
        console.log(`ℹ️ Папки, начинающиеся с цифр (1..., 2...), не найдены ни на одном уровне!`);
        return;
    }

    console.log(`🎯 Найдено групп с тегами: ${targetGroups.length} шт.`);

    for (const group of targetGroups) {
        const { containerPath, numberedDirs } = group;
        const relativeGroupPath = path.relative(sourceNichePath, containerPath);
        const targetGroupInAllFolders = path.join(targetNicheInAllFolders, relativeGroupPath);

        await fs.mkdir(targetGroupInAllFolders, { recursive: true });

        console.log(`\n==================================================`);
        console.log(`📂 Группа: "${relativeGroupPath || "Корень ниши"}" (Папок: ${numberedDirs.length})`);
        console.log(`==================================================`);

        for (const folderName of numberedDirs) {
            const cleanName = cleanFolderName(folderName);
            const newFolderName = `${cleanName} ${platformBlock}`;
            const sourceFolder = path.join(containerPath, folderName);
            const destFolder = path.join(targetGroupInAllFolders, newFolderName);

            console.log(`\n  ⚙️  Обработка: "${cleanName}" -> "${newFolderName}"`);
            await fs.cp(sourceFolder, destFolder, { recursive: true });
            console.log(`     🚀 Скопировано в ALL FOLDERS`);

            if (htmlPublishPath) {
                const forMainDir = path.join(destFolder, 'For Main');
                await fs.mkdir(forMainDir, { recursive: true });
                const linkFile = path.join(forMainDir, 'Link_Site.txt');
                await fs.writeFile(linkFile, htmlPublishPath, 'utf8');
                console.log(`     ✅ Путь к HTML-файлу записан в For Main/Link_Site.txt`);
            }

            const filesInside = await fs.readdir(destFolder);
            for (const file of filesInside) {
                if (file.endsWith('.xlsx')) {
                    const oldFilePath = path.join(destFolder, file);
                    const newFilePath = path.join(destFolder, `${newFolderName}.xlsx`);
                    if (oldFilePath !== newFilePath) {
                        await fs.rename(oldFilePath, newFilePath);
                        console.log(`     ✅ Excel переименован -> ${newFolderName}.xlsx`);
                    }
                    break;
                }
            }
        }
    }
    console.log(`\n✨ Модуль 5 успешно завершил упаковку всех групп в ALL FOLDERS!`);
}
