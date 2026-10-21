// scripts/artify_sites_publishing/modules/1_html_builder.js
import fs from 'fs/promises';
import path from 'path';
import { execSync } from 'child_process';
import { CONFIG } from '../config.js';

const PROJECT_ROOT = process.cwd();
const TEMPLATE_PATH = path.join(PROJECT_ROOT, 'scripts/artify_sites_publishing/templates/captcha_template.html');

function parseRealCloudflareUrl(wranglerOutput, fallbackProjectName) {
    const match = wranglerOutput.match(/https:\/\/([a-zA-Z0-9.-]+)\.pages\.dev/i);
    if (match) {
        let fullHost = match[1];
        if (/^[a-f0-9]{8}\./i.test(fullHost)) {
            fullHost = fullHost.replace(/^[a-f0-9]{8}\./i, '');
        }
        return `https://${fullHost}.pages.dev`;
    }
    return `https://${fallbackProjectName}.pages.dev`;
}

export async function buildAndDeployCloudflareHtml(sectionName, thematicName, targetUrl, logoPath) {
    console.log(`\n☁️  [Модуль 1: Cloudflare] Начинаю работу для: ${thematicName}`);

    const SUFFIXES = [
        "artifystudio",    // 1-я попытка (базовая)
        "artifystudioo",   // 2-я попытка
        "artifystudio333", // 3-я попытка
        "artifystudio777", // 4-я попытка
        "artifystudio1",   // 5-я попытка
        "artifystudio7"    // 6-я попытка (последняя)
    ];

    try {
        const folderPath = path.join(CONFIG.PATHS.CF_HTMLS_DIR, sectionName, thematicName, 'Redirect cpatcha');
        const outputPath = path.join(folderPath, 'index.html');

        // Путь для дублирования HTML-файла в папку для паблишинга
        const publishFolderPath = path.join(CONFIG.PATHS.PINTEREST_ROOT, '_HTMLs for Publish', 'Artify-Studio', sectionName, thematicName, 'Redirect cpatcha');
        const publishOutputPath = path.join(publishFolderPath, 'index.html');

        await fs.mkdir(folderPath, { recursive: true });
        await fs.mkdir(publishFolderPath, { recursive: true }); // Создаем новую папку

        let template = await fs.readFile(TEMPLATE_PATH, 'utf8');
        let finalHtml = template.replace('{{REDIRECT_URL}}', targetUrl);

        // Конвертируем логотип в Base64 для Фавиконки
        if (logoPath) {
            try {
                const logoBuffer = await fs.readFile(logoPath);
                const ext = path.extname(logoPath).toLowerCase();
                const mimeType = ext === '.jpg' || ext === '.jpeg' ? 'image/jpeg' : 'image/png';
                const base64Data = `data:${mimeType};base64,${logoBuffer.toString('base64')}`;
                finalHtml = finalHtml.replace('{{FAVICON_BASE64}}', base64Data);
                console.log(`🖼️ Логотип успешно встроен в HTML как Base64 Фавиконка`);
            } catch (err) {
                console.warn(`⚠️ Не удалось прочитать логотип для фавиконки: ${err.message}`);
                finalHtml = finalHtml.replace('<link rel="icon" href="{{FAVICON_BASE64}}">', '');
            }
        } else {
            finalHtml = finalHtml.replace('<link rel="icon" href="{{FAVICON_BASE64}}">', '');
        }

        // Сохраняем в обе папки
        await fs.writeFile(outputPath, finalHtml, 'utf8');
        await fs.writeFile(publishOutputPath, finalHtml, 'utf8');
        
        console.log(`✅ HTML сгенерирован: ${outputPath}`);
        console.log(`✅ HTML скопирован для паблишинга: ${publishOutputPath}`);

        const cleanName = thematicName.toLowerCase().replace(/\s+/g, '');

        let deployed = false;
        let suffixIndex = 0;
        let deployedUrl = "";

        while (!deployed && suffixIndex < SUFFIXES.length) {
            const currentProjectName = `${cleanName}-${SUFFIXES[suffixIndex]}`;

            try {
                // 1. Создаем проект в Cloudflare (если он еще не создан)
                try {
                    execSync(`npx wrangler pages project create ${currentProjectName} --production-branch main`, {
                        stdio: 'pipe',
                        encoding: 'utf8'
                    });
                    console.log(`✨ Проект '${currentProjectName}' успешно создан в Cloudflare.`);
                } catch (createErr) {
                    const createLog = (createErr.stderr || createErr.stdout || createErr.message || "").toLowerCase();
                    
                    // Если проект уже существует в НАШЕМ аккаунте — это отлично, идем деплоить!
                    if (createLog.includes('already exists') && !createLog.includes('another user')) {
                        // Это наш проект, всё ок
                    } else if (createLog.includes('taken') || createLog.includes('conflict') || createLog.includes('409') || createLog.includes('403') || createLog.includes('another account')) {
                        // Реально занято другим человеком!
                        console.log(`⚠️ Имя '${currentProjectName}' занято чужим пользователем!`);
                        suffixIndex++;
                        continue;
                    }
                }

                // 2. Деплоим файлы в созданный проект
                console.log(`🚀 Выгружаю на Cloudflare Pages (${currentProjectName})...`);
                const stdout = execSync(`npx wrangler pages deploy . --project-name ${currentProjectName} --commit-dirty=true`, { 
                    cwd: folderPath,
                    encoding: 'utf8',
                    stdio: 'pipe'
                });

                console.log(stdout);

                deployedUrl = parseRealCloudflareUrl(stdout, currentProjectName);
                console.log(`🎉 Деплой подтвержден! Реальный адрес: ${deployedUrl}`);
                deployed = true;

            } catch (error) {
                const errorLog = (error.stderr || error.stdout || error.message || "").toLowerCase();
                
                // Проверяем ошибку 500 (сеть)
                if (errorLog.includes('500') || errorLog.includes('network') || errorLog.includes('timeout')) {
                    console.log(`❌ Ошибка сети Cloudflare (500). Повтор через 4 секунды...`);
                    await new Promise(r => setTimeout(r, 4000));
                } else if (errorLog.includes('already exists') || errorLog.includes('taken') || errorLog.includes('409')) {
                    console.log(`⚠️ Имя '${currentProjectName}' занято!`);
                    suffixIndex++;
                } else {
                    console.log(`⚠️ Предупреждение деплоя: ${error.message}`);
                    suffixIndex++;
                }
            }
        }

        if (!deployed) {
            console.error(`\n🚨 КРИТИЧЕСКАЯ ОШИБКА: ВСЕ ${SUFFIXES.length} ВАРИАНТОВ ИМЕН ЗАНЯТЫ!`);
            throw new Error(`Cloudflare отклонил все варианты суффиксов для ${cleanName}.`);
        }

        return deployedUrl;

    } catch (error) {
        console.error(`❌ Ошибка в модуле Cloudflare:`, error.message);
        throw error;
    }
}