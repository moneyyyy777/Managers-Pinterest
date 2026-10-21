// scripts/artify_sites_publishing/orchestrator.js
import fs from 'fs/promises';
import fsSync from 'fs';
import path from 'path';
import readline from 'readline';
import { CONFIG } from './config.js';
import { buildAndDeployCloudflareHtml } from './modules/1_html_builder.js';
import { getOrCreateAnalytics } from './modules/2_analytics.js';
import { buildGoogleSite } from './modules/3_google_sites.js';
import { loadDatabase, updateDatabase } from './modules/4_database.js';
import { processAllFolders } from './modules/5_file_manager.js';

const PROJECT_ROOT = process.cwd();
const TASKS_FILE = path.join(PROJECT_ROOT, 'scripts/artify_sites_publishing/tasks.txt');
const DONE_TASKS_FILE = path.join(PROJECT_ROOT, 'scripts/artify_sites_publishing/done_tasks.txt');

const askQuestion = (query) => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    return new Promise(resolve => rl.question(query, ans => { rl.close(); resolve(ans); }));
};

function resolveAbsolutePath(inputPath) {
    let clean = inputPath.trim().replace(/\\/g, '/');
    if (!clean) return null;
    if (fsSync.existsSync(clean)) return path.normalize(clean);
    const fromPinterest = path.resolve(CONFIG.PATHS.PINTEREST_ROOT, clean);
    if (fsSync.existsSync(fromPinterest)) return fromPinterest;
    const fromProject = path.resolve(CONFIG.PATHS.PROJECT_ROOT, clean);
    if (fsSync.existsSync(fromProject)) return fromProject;
    const userHome = process.env.HOME || process.env.USERPROFILE || '';
    if (userHome) {
        const fromDesktop = path.resolve(userHome, 'Desktop/Pinterest', clean);
        if (fsSync.existsSync(fromDesktop)) return fromDesktop;
    }
    return null;
}

async function readLinkSiteFile(folderPath) {
    const possibleNames = ['linksite.txt', 'Linksite.txt', 'Link_Site.txt', 'link_site.txt'];
    let currentDir = folderPath;
    
    while (currentDir) {
        for (const name of possibleNames) {
            try { return (await fs.readFile(path.join(currentDir, name), 'utf8')).split('\n')[0].trim(); } catch {}
        }
        for (const name of possibleNames) {
            try { return (await fs.readFile(path.join(currentDir, 'For Main', name), 'utf8')).split('\n')[0].trim(); } catch {}
        }
        
        if (path.basename(currentDir).toLowerCase() === 'keywords') break;
        const parentDir = path.dirname(currentDir);
        if (parentDir === currentDir) break;
        currentDir = parentDir;
    }
    return null;
}

function findLogoFile(startPath) {
    const validExtensions = ['.png', '.jpg', '.jpeg', '.webp'];
    let currentDir = startPath;
    while (currentDir) {
        for (const ext of validExtensions) {
            const logoPath = path.join(currentDir, `logo${ext}`);
            if (fsSync.existsSync(logoPath)) return logoPath;
        }
        if (path.basename(currentDir).toLowerCase() === 'keywords') break;
        const parentDir = path.dirname(currentDir);
        if (parentDir === currentDir) break;
        currentDir = parentDir;
    }
    return null;
}

function getRelativeTaskPath(absolutePath) {
    const normalized = absolutePath.replace(/\\/g, '/');
    const parts = normalized.split('/');
    const idx = parts.findIndex(p => p.toLowerCase() === 'artify studio');
    if (idx !== -1 && idx < parts.length - 1) {
        return parts.slice(idx + 1).join('/');
    }
    return parts[parts.length - 1]; // fallback
}

function determineHierarchicalName(relativeTaskPath) {
    const parts = relativeTaskPath.split('/');
    const wordSet = new Set();
    for (const part of parts) {
        const words = part.split(/[\s_-]+/);
        for (const w of words) {
            if (w) wordSet.add(w.toLowerCase());
        }
    }
    return Array.from(wordSet).map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
}

async function parseTask(absolutePath) {
    const targetUrl = await readLinkSiteFile(absolutePath);
    if (!targetUrl) throw new Error(`В папке ${absolutePath} нет linksite.txt!`);

    const urlObj = new URL(targetUrl);
    const pathParts = urlObj.pathname.split('/').filter(Boolean);
    const sectionName = pathParts[0] || "fonts";
    const collectionSlug = pathParts[1] || "";

    const relativeTaskPath = getRelativeTaskPath(absolutePath);
    const thematicName = determineHierarchicalName(relativeTaskPath);

    return { absolutePath, sectionName, collectionSlug, thematicName, targetUrl, relativeTaskPath };
}

async function expandTasks(rawPaths) {
    const finalTasksMap = new Map();

    for (const rawPath of rawPaths) {
        const absPath = resolveAbsolutePath(rawPath);
        if (!absPath) {
            console.log(`⚠️ Путь не найден: ${rawPath}`);
            continue;
        }

        async function walk(currentDir) {
            let linksiteContent = await readLinkSiteFile(currentDir);
            if (linksiteContent) {
                finalTasksMap.set(currentDir, rawPath); 
                return; 
            }
            let items;
            try { items = await fs.readdir(currentDir, { withFileTypes: true }); } 
            catch { return; }
            for (const item of items) {
                if (item.isDirectory() && !item.name.startsWith('.')) {
                    if (item.name.toLowerCase() === 'for main' || /^\d+/.test(item.name)) continue;
                    await walk(path.join(currentDir, item.name));
                }
            }
        }
        await walk(absPath);
    }
    return Array.from(finalTasksMap.entries()).map(([absPath, originalRaw]) => ({ absPath, originalRaw }));
}

async function loadDoneTasks() {
    try {
        const content = await fs.readFile(DONE_TASKS_FILE, 'utf8');
        return new Set(content.split('\n').map(l => l.trim()).filter(Boolean));
    } catch {
        return new Set();
    }
}

async function hasNumberedFoldersWithExcel(startDir) {
    async function walk(currentDir) {
        let entries;
        try { entries = await fs.readdir(currentDir, { withFileTypes: true }); } catch { return false; }
        const subdirs = entries.filter(d => d.isDirectory() && !d.name.startsWith('.'));
        if (subdirs.some(d => /^\d+/.test(d.name))) return true;
        for (const subdir of subdirs) {
            if (await walk(path.join(currentDir, subdir.name))) return true;
        }
        return false;
    }
    return await walk(startDir);
}

async function runOrchestrator() {
    console.log("\n========================================");
    console.log("🤖 ЗАПУСК ОРКЕСТРАТОРА ARTIFY STUDIO (v2.0)");
    console.log("========================================\n");

    let tasksContent = "";
    try { tasksContent = await fs.readFile(TASKS_FILE, 'utf8'); } 
    catch { console.error(`❌ Файл tasks.txt не найден!`); process.exit(1); }

    const rawPaths = tasksContent.split('\n').map(x => x.trim()).filter(Boolean);
    if (rawPaths.length === 0) { console.log(`ℹ️ Очередь tasks.txt пуста.`); process.exit(0); }

    console.log(`🔍 Ищем подниши с linksite.txt (Авто-обход)...`);
    const expandedTasks = await expandTasks(rawPaths);
    
    if (expandedTasks.length === 0) {
        console.log(`❌ Не найдено ни одного файла linksite.txt в указанных путях!`);
        process.exit(1);
    }

    console.log(`📋 Итого найдено конкретных задач: ${expandedTasks.length}\n`);

    const doneTasksSet = await loadDoneTasks();
    const completedTasks = [];
    const failedTasks = [];

    let keepHierarchy = null;

    for (let i = 0; i < expandedTasks.length; i++) {
        const { absPath, originalRaw } = expandedTasks[i];
        console.log(`--- [Задача ${i + 1}/${expandedTasks.length}] -----------------`);
        
        try {
            const taskData = await parseTask(absPath);
            const dbKey = taskData.relativeTaskPath; 
            const thematic = taskData.thematicName; 

            await updateDatabase(dbKey, { 
                section: taskData.sectionName, 
                mainUrl: taskData.targetUrl 
            });

            const db = await loadDatabase();
            const currentState = db[dbKey] || {};

            console.log(`📂 Папка:           ${taskData.relativeTaskPath}`);
            console.log(`🔗 Ссылка linksite:  ${taskData.targetUrl}`);
            console.log(`🎯 Имя (Analytics): "${thematic}"`);

            const logoPath = findLogoFile(taskData.absolutePath);
            if (!logoPath) {
                console.log(`\n⚠️  [ВНИМАНИЕ] Файл логотипа (logo.png/jpg) НЕ найден для "${thematic}"!`);
                const ans = await askQuestion(`   Продолжить без логотипа? (Enter - Да, n - Пропустить/Исправить): `);
                const cleanAns = ans.trim().toLowerCase();
                if (cleanAns === 'n' || cleanAns === 'no' || cleanAns === 'нет') {
                    console.log(`🛑 Задача '${thematic}' пропущена.\n`);
                    failedTasks.push({ path: originalRaw, error: "Пропущено пользователем для добавления логотипа" });
                    continue; 
                }
            }

            if (!currentState.cfUrl) {
                const cfUrl = await buildAndDeployCloudflareHtml(taskData.sectionName, thematic, taskData.targetUrl, logoPath);
                await updateDatabase(dbKey, { cfUrl });
            } else {
                console.log(`⏩ [Модуль 1: Cloudflare] Пропущен: Ссылка уже есть (${currentState.cfUrl})`);
            }

            if (!currentState.gSitePublic || !currentState.gCode || currentState.gCode.includes('TEST')) {
                const freshState = (await loadDatabase())[dbKey];
                const sites = await buildGoogleSite(
                    thematic, 
                    freshState.cfUrl, 
                    freshState.gCode, 
                    taskData.absolutePath,
                    dbKey
                );
                await updateDatabase(dbKey, { 
                    gCode: sites.gCode,
                    gSitePublic: sites.public, 
                    gSiteEdit: sites.edit 
                });
            } else {
                console.log(`⏩ [Модуль 3: Google Sites] Пропущен: Сайт уже создан (${currentState.gSitePublic})`);
            }

            const hasFolders = await hasNumberedFoldersWithExcel(taskData.absolutePath);
            
            if (hasFolders) {
                console.log(`\n📁 [Оркестратор] Найдены номерные папки. Запускаю Модуль 5...`);
                
                if (keepHierarchy === null) {
                    const ans = await askQuestion(`\n👉 Сохранить полную иерархию папок в ALL FOLDERS? (Y/n - по умолч. Y): `);
                    keepHierarchy = (ans.trim().toLowerCase() === 'n' || ans.trim().toLowerCase() === 'no' || ans.trim() === 'нет') ? 'n' : 'y';
                }

                const finalState = (await loadDatabase())[dbKey];
                
                // Формируем путь в стиле Windows (бэкслеши), начиная с _HTMLs for Publish
                const htmlPublishPath = [
                    '_HTMLs for Publish',
                    'Artify-Studio',
                    taskData.sectionName,
                    thematic,
                    'Redirect cpatcha'
                ].join('\\');
                
                // Передаем dbKey (относительный путь), чтобы FileManager знал полную структуру
                await processAllFolders(taskData.absolutePath, htmlPublishPath, thematic, askQuestion, dbKey, keepHierarchy);

                completedTasks.push(originalRaw);
                await fs.appendFile(DONE_TASKS_FILE, absPath + '\n', 'utf8');
                console.log(`\n🎉 Задача '${thematic}' ПОЛНОСТЬЮ ЗАВЕРШЕНА!\n`);
            } else {
                console.log(`\nℹ️  [Оркестратор] В папке пока НЕТ номерных папок (1, 2, 3...) для переноса.`);
            }

        } catch (e) {
            console.error(`❌ Ошибка выполнения задачи: ${e.message}\n`);
            failedTasks.push({ path: originalRaw, error: e.message });
        }
    }

    // Удаляем из tasks.txt только те сырые пути, для которых ВСЕ подзадачи выполнились успешно.
    // Если хотя бы одна подзадача упала, сырой путь останется в tasks.txt для перезапуска.
    const remainingTasks = rawPaths.filter(p => !completedTasks.includes(p) || failedTasks.some(f => f.path === p));
    await fs.writeFile(TASKS_FILE, [...new Set(remainingTasks)].join('\n') + (remainingTasks.length > 0 ? '\n' : ''), 'utf8');

    console.log("========================================");
    console.log("📊 ИТОГОВЫЙ ОТЧЕТ ВЫПОЛНЕНИЯ:");
    console.log(`   ✅ Выполнено заданий: ${completedTasks.length}`);
    console.log(`   ⏳ Ошибок:            ${failedTasks.length}`);
    console.log("========================================\n");
}

runOrchestrator();
