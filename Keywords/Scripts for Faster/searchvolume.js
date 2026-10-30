import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import { createRequire } from "module";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Robust resolution for playwright-core across macOS and Windows environments
function resolveChromium() {
    const localRequire = createRequire(import.meta.url);
    try {
        const pw = localRequire("playwright-core");
        if (pw && pw.chromium) return pw.chromium;
    } catch (e) {}

    const candidateDirs = [
        path.resolve(__dirname, "../Artify Studio"),
        path.resolve(__dirname, ".."),
        path.resolve(__dirname, "../.."),
        path.resolve(__dirname, "../../Keywords/Artify Studio"),
        path.resolve(__dirname, "../../manager_gui"),
        path.resolve(__dirname, "../../Websites/CloudFlare/artify-studio"),
        path.resolve(process.cwd()),
        path.resolve(process.cwd(), "Keywords/Artify Studio")
    ];

    for (const dir of candidateDirs) {
        try {
            const probePath = path.join(dir, "package.json");
            const req = createRequire(probePath);
            const pw = req("playwright-core") || req("playwright");
            if (pw && pw.chromium) return pw.chromium;
        } catch (e) {}
    }

    throw new Error(
        "❌ Cannot find package 'playwright-core' or 'playwright'. Please ensure dependencies are installed in 'Keywords/Artify Studio' or project root."
    );
}

const chromium = resolveChromium();

const INPUT_FILENAME = "Pininspector + Seeds.txt";
const CHUNK_SIZE = 600;

const VPN_EXTENSION_ID = "pdmchlannmelcagdkakcefmbmpogcgfo";
let currentVpnCountry = null; // Поочередно: Германия <-> Нидерланды
let totalRequestsCounter = 0; // Общий счетчик запросов
let useSystemVpn = false; // Режим системного VPN (без Qu VPN)

// 🛡️ Глобальные переменные для безопасного сохранения данных при экстренной остановке
let activeOutputCsvPath = null;
let activeResultsMap = null;
let isShuttingDown = false;

async function handleGracefulShutdown(signalName) {
    if (isShuttingDown) return;
    isShuttingDown = true;
    console.log(`\n🛑 [ОСТАНОВКА] Получен сигнал ${signalName}: завершение процесса по запросу пользователя.`);
    if (activeOutputCsvPath && activeResultsMap && activeResultsMap.size > 0) {
        console.log(`💾 Сохраняем накопленный прогресс (${activeResultsMap.size} строк)...`);
        try {
            await saveProgress(activeOutputCsvPath, activeResultsMap);
            console.log(`✅ Прогресс успешно сохранен в: ${path.basename(activeOutputCsvPath)}`);
        } catch (e) {
            console.error(`⚠️ Ошибка сохранения: ${e.message}`);
        }
    }
    console.log(`👋 Сбор остановлен.`);
    process.exit(0);
}

process.once('SIGTERM', () => handleGracefulShutdown('SIGTERM'));
process.once('SIGINT', () => handleGracefulShutdown('SIGINT'));

// 🛡️ Постоянная фоновая страница (worker tab), чтобы не создавать/закрывать вкладки и не дергать окно Chrome
let workerPage = null;

async function getOrCreateWorkerPage(context) {
    if (workerPage && !workerPage.isClosed()) {
        return workerPage;
    }
    const pages = context.pages();
    const existingSv = pages.find(p => p.url().includes('searchvolume.io'));
    if (existingSv) {
        workerPage = existingSv;
        return workerPage;
    }
    const existingBlank = pages.find(p => p.url() === 'about:blank');
    if (existingBlank) {
        workerPage = existingBlank;
        return workerPage;
    }
    workerPage = await context.newPage();
    return workerPage;
}

async function getBrowser() {
    try {
        return await chromium.connectOverCDP("http://127.0.0.1:9222");
    } catch (e) {
        console.error("❌ Ошибка: Браузер не запущен. Запусти ./start-browser.sh");
        process.exit(1);
    }
}

// 🔍 Рекурсивный поиск всех файлов 'Pininspector + Seeds.txt' на любой глубине
async function findTargetFiles(dir) {
    let results = [];
    try {
        const entries = await fs.readdir(dir, { withFileTypes: true });
        for (const entry of entries) {
            const fullPath = path.join(dir, entry.name);
            if (entry.isDirectory()) {
                if (!entry.name.startsWith('.') && entry.name !== 'node_modules') {
                    const subResults = await findTargetFiles(fullPath);
                    results = results.concat(subResults);
                }
            } else if (entry.name === INPUT_FILENAME) {
                results.push(fullPath);
            }
        }
    } catch (e) {}
    return results;
}

// 🛡️ Переключение Qu VPN с точной проверкой статусов 'on' и 'off'
async function switchQuVpn(context) {
    if (useSystemVpn) {
        console.log(`\n🛡️ [VPN] Пропуск ротации Qu VPN (активен системный VPN пользователя).`);
        return;
    }

    currentVpnCountry = (currentVpnCountry === "Германия") ? "Нидерланды" : "Германия";
    console.log(`\n🛡️ [VPN] Переключаем Qu VPN на страну: ${currentVpnCountry}...`);

    let connected = false;
    let attempts = 0;

    while (!connected && attempts < 3) {
        attempts++;
        try {
            const mainPage = context.pages()[0] || await context.newPage();
            const session = await mainPage.context().newCDPSession(mainPage);

            await session.send('Target.createTarget', {
                url: `chrome-extension://${VPN_EXTENSION_ID}/popup.html`,
                background: true
            });

            await new Promise(res => setTimeout(res, 1500));

            const vpnPage = context.pages().find(p => p.url().includes(VPN_EXTENSION_ID));
            if (!vpnPage) throw new Error("Не удалось открыть поп-ап VPN");

            await vpnPage.waitForLoadState("domcontentloaded");
            await vpnPage.waitForTimeout(1500);

            // 1. Выбираем сервер (страну)
            console.log(`   [VPN] Выбираем страну: ${currentVpnCountry}...`);
            const countryText = vpnPage.getByText(currentVpnCountry).first();
            if (await countryText.isVisible({ timeout: 5000 })) {
                await countryText.click();
                await vpnPage.waitForTimeout(1000);
            } else {
                console.log(`   ⚠️ [VPN] Текст '${currentVpnCountry}' не найден, кликаем по первому серверу...`);
                const firstServer = vpnPage.locator('.server').first();
                if (await firstServer.isVisible()) await firstServer.click();
            }

            // 2. Проверяем текущее состояние кнопки button#toggleBtn
            const toggleBtn = vpnPage.locator('button#toggleBtn');
            await toggleBtn.waitFor({ state: 'visible', timeout: 5000 });

            // Проверяем, включен ли VPN прямо сейчас (наличие класса 'on')
            const isAlreadyOn = await toggleBtn.evaluate(el => el.classList.contains('on'));

            if (isAlreadyOn) {
                console.log("   [VPN] VPN уже включен! Выключаем для перезапуска сети...");
                await toggleBtn.click();

                // Ждем пока класс сменится на 'off'
                await vpnPage.waitForFunction(() => {
                    const btn = document.querySelector('button#toggleBtn');
                    return btn && btn.classList.contains('off');
                }, { timeout: 10000 }).catch(() => {});

                await vpnPage.waitForTimeout(1500);

                console.log("   [VPN] Включаем VPN заново...");
                await toggleBtn.click();
            } else {
                console.log("   [VPN] VPN выключен. Включаем...");
                await toggleBtn.click();
            }

            // 3. Гарантированно ждем, пока кнопка станет 'on'
            console.log("   [VPN] Ждем установки соединения (статус 'on')...");
            await vpnPage.waitForFunction(() => {
                const btn = document.querySelector('button#toggleBtn');
                return btn && btn.classList.contains('on') && !btn.classList.contains('loading');
            }, { timeout: 45000 });

            console.log(`   ✅ [VPN] VPN УСПЕШНО ВКЛЮЧЕН (${currentVpnCountry})!\n`);
            connected = true;

            await vpnPage.close().catch(() => {});
            await new Promise(res => setTimeout(res, 3000));

        } catch (e) {
            console.log(`   ❌ [VPN] Ошибка на попытке ${attempts}: ${e.message}`);
            await new Promise(res => setTimeout(res, 2000));
        }
    }

    if (!connected) {
        console.warn("\n⚠️ [VPN] Предупреждение: Не удалось подключиться к расширению Qu VPN.");
        console.warn("🌐 Автоматически продолжаем в режиме системного/прямого VPN без остановки работы скрипта.\n");
        useSystemVpn = true;
    }
}

// 🎯 Умный клик по Submit
async function clickSubmitUntilTriggered(page) {
    const submitBtn = page.locator('button:has-text("Submit")');
    await submitBtn.waitFor({ state: 'visible', timeout: 5000 });

    for (let i = 1; i <= 3; i++) {
        console.log(`   Нажимаем Submit (клик ${i} из 3)...`);
        await submitBtn.click();

        const triggered = await page.waitForFunction(() => {
            const hasRows = document.querySelectorAll('.sv__row').length > 0;
            const hasCaptcha = Array.from(document.querySelectorAll('iframe')).some(f => f.src.includes('recaptcha'));
            const isRateLimited = document.body.innerText.includes('Too many requests');
            return hasRows || hasCaptcha || isRateLimited;
        }, { timeout: 4000 }).then(() => true).catch(() => false);

        if (triggered) {
            return;
        }

        console.log(`   ⏳ Форма еще не отреагировала, пробуем нажать Submit повторно...`);
        await page.waitForTimeout(1000);
    }
}

// Загрузка сохраненных тегов
async function loadExistingResults(csvPath) {
    const map = new Map();
    try {
        const fileContent = await fs.readFile(csvPath, "utf8");
        const lines = fileContent.split("\n").map(l => l.trim()).filter(Boolean);
        for (const line of lines) {
            const parts = line.split(";");
            if (parts.length >= 2) {
                const kw = parts[0].trim();
                const cleanVol = (parts[1] || "0").trim().replace(/[,.\s']/g, '');
                const vol = parseInt(cleanVol, 10) || 0;
                if (kw) map.set(kw.toLowerCase(), { kw, vol });
            }
        }
    } catch (e) {}
    return map;
}

// Сохранение результатов (не создаем пустые файлы при 0 результатов)
async function saveProgress(csvPath, resultsMap) {
    if (!resultsMap || resultsMap.size === 0) return;
    const list = Array.from(resultsMap.values());
    list.sort((a, b) => b.vol - a.vol);
    const csvContent = list.map(item => `${item.kw};${item.vol}`).join("\n");
    await fs.writeFile(csvPath, csvContent, "utf8");
}

// Клик по Buster и надежное авто-решение reCAPTCHA v2
async function handleCaptchaWithBuster(page) {
    try {
        // 1. Ищем фрейм с чекбоксом reCAPTCHA (anchor)
        let anchorFrame = null;
        for (let i = 0; i < 15; i++) {
            anchorFrame = page.frames().find(f => f.url().includes('recaptcha/api2/anchor') || f.url().includes('recaptcha/enterprise/anchor'));
            if (anchorFrame) break;
            const hasRows = await page.evaluate(() => document.querySelectorAll('.sv__row').length > 0).catch(() => false);
            if (hasRows) return; // Результаты уже загрузились без капчи
            await page.waitForTimeout(500);
        }

        if (!anchorFrame) {
            return;
        }

        const checkbox = anchorFrame.locator('#recaptcha-anchor, .recaptcha-checkbox-border').first();
        const isChecked = await checkbox.getAttribute('aria-checked').catch(() => 'false');

        if (isChecked === 'true') {
            console.log("   ✅ Галочка «Я не робот» уже проставлена!");
            return;
        }

        console.log("   🤖 Нажимаем галочку «Я не робот»...");
        await checkbox.click({ force: true }).catch(() => {});

        // 2. Ждем реакции: либо галочка сразу станет зеленой (1-клик), либо выскочит challenge bframe
        const checkResult = await Promise.race([
            // Проверка: чекбокс сразу отметился (без картинок)
            anchorFrame.waitForFunction(() => {
                const el = document.querySelector('#recaptcha-anchor');
                return el && el.getAttribute('aria-checked') === 'true';
            }, { timeout: 4000 }).then(() => 'green').catch(() => null),

            // Проверка: открылось окно с заданиями (bframe стал видимым в основном окне)
            page.waitForFunction(() => {
                const ifr = document.querySelector('iframe[src*="bframe"]') || document.querySelector('iframe[title*="challenge"]');
                if (!ifr) return false;
                const parent = ifr.parentElement;
                const style = parent ? window.getComputedStyle(parent) : null;
                const rect = ifr.getBoundingClientRect();
                return style && style.visibility === 'visible' && rect.top > 0;
            }, { timeout: 4000 }).then(() => 'challenge').catch(() => null)
        ]);

        if (checkResult === 'green') {
            console.log("   ✅ Капча подтверждена в 1 клик (без картинок)!");
            return;
        }

        // 3. Если появилось задание с картинками — ждем полной видимости bframe
        console.log("   ⏳ Появилось окно проверки reCAPTCHA (challenge)...");
        const challengeVisible = await page.waitForFunction(() => {
            const ifr = document.querySelector('iframe[src*="bframe"]') || document.querySelector('iframe[title*="challenge"]');
            if (!ifr) return false;
            const parent = ifr.parentElement;
            const style = parent ? window.getComputedStyle(parent) : null;
            const rect = ifr.getBoundingClientRect();
            return style && style.visibility === 'visible' && rect.top > 0;
        }, { timeout: 8000 }).then(() => true).catch(() => false);

        if (!challengeVisible) {
            console.log("   ℹ️ Окно заданий не появилось или исчезло, проверяем галочку...");
            return;
        }

        // 4. Находим фрейм bframe с заданиями
        const bframe = page.frames().find(f => f.url().includes('bframe'));
        if (!bframe) {
            console.log("   ⚠️ Фрейм заданий bframe не найден.");
            return;
        }

        // Даем Buster 1-1.5 сек на инициализацию кнопки в DOM
        await page.waitForTimeout(1200);

        const helpHolder = bframe.locator('.help-button-holder, #solver-button').first();
        const hasBuster = await helpHolder.waitFor({ state: 'visible', timeout: 6000 }).then(() => true).catch(() => false);

        if (hasBuster) {
            console.log("   ⚡ Нашли кнопку Buster (.help-button-holder)! Запускаем авто-решение...");
            await helpHolder.click({ force: true }).catch(async () => {
                // Запасной клик через координаты, если клик по элементу блокируется
                const box = await page.locator('iframe[src*="bframe"]').boundingBox().catch(() => null);
                const innerRect = await bframe.evaluate(() => {
                    const el = document.querySelector('.help-button-holder');
                    return el ? el.getBoundingClientRect() : null;
                }).catch(() => null);
                if (box && innerRect) {
                    await page.mouse.click(box.x + innerRect.x + innerRect.width / 2, box.y + innerRect.y + innerRect.height / 2);
                }
            });

            console.log("   ⏳ Buster решает капчу голосом, ждем подтверждения...");

            // Ждем решения: исчезновение окна bframe или появление результатов
            const solved = await page.waitForFunction(() => {
                const ifr = document.querySelector('iframe[src*="bframe"]');
                const hasRows = document.querySelectorAll('.sv__row').length > 0;
                if (hasRows) return true;
                if (!ifr) return true;
                const parent = ifr.parentElement;
                const style = parent ? window.getComputedStyle(parent) : null;
                return !style || style.visibility !== 'visible';
            }, { timeout: 35000 }).then(() => true).catch(() => false);

            if (solved) {
                console.log("   ✅ Buster успешно решил капчу!");
            } else {
                // Проверяем, не выдал ли Google блокировку аудио
                const errorNotice = await bframe.evaluate(() => {
                    const text = document.body.innerText;
                    if (text.includes('automated queries') || text.includes('Try again later')) {
                        return 'Google заблокировал аудио-решение (лимит запросов IP)';
                    }
                    return null;
                }).catch(() => null);

                if (errorNotice) {
                    console.log(`   ⚠️ [Buster] ${errorNotice}. Попробуйте сменить IP или решить вручную.`);
                } else {
                    console.log("   ⏳ Ожидание завершения проверки...");
                }
            }
        } else {
            console.log("   ⚠️ Кнопка Buster не обнаружена в challenge. Возможно, расширение еще не подгрузилось.");
        }

    } catch (e) {
        console.log(`   ⚠️ Ошибка при обработке капчи: ${e.message}`);
    }
}

async function main() {
    console.log(`\n🚀 Запуск автоматического пакетного сбора объемов с SearchVolume.io`);

    const rawArgs = process.argv.slice(2);
    const flags = new Set(rawArgs.filter(a => a.startsWith('-')));
    const nonFlagArgs = rawArgs.filter(a => !a.startsWith('-'));

    if (flags.has('--system-vpn') || flags.has('--no-vpn') || process.env.SYSTEM_VPN === '1') {
        useSystemVpn = true;
    }

    let targetFiles = [];

    if (nonFlagArgs.length > 0) {
        for (const arg of nonFlagArgs) {
            const resolvedPath = path.resolve(arg);
            try {
                const stat = await fs.stat(resolvedPath);
                if (!stat.isDirectory()) {
                    targetFiles.push(resolvedPath);
                } else {
                    console.log(`🔍 Сканирование папки: ${resolvedPath}...`);
                    const found = await findTargetFiles(resolvedPath);
                    targetFiles = targetFiles.concat(found);
                }
            } catch {
                console.log(`⚠️ Путь не найден или недоступен: ${resolvedPath}`);
            }
        }
        targetFiles = Array.from(new Set(targetFiles));
    } else {
        const rootDir = process.cwd();
        console.log(`🔍 Сканирование папок в поисках файлов '${INPUT_FILENAME}'...`);
        targetFiles = await findTargetFiles(rootDir);
    }

    console.log(`✅ Найдено файлов с ключами: ${targetFiles.length}\n`);

    if (targetFiles.length === 0) {
        console.log(`⚠️ Файлы '${INPUT_FILENAME}' не найдены.`);
        process.exit(0);
    }

    const browser = await getBrowser();
    const context = browser.contexts()[0] || await browser.newContext();

    if (useSystemVpn) {
        console.log(`🛡️ [VPN] Включен режим СИСТЕМНОГО VPN (ротация Qu VPN отключена, трафик идет через ваш внешний VPN/сеть).\n`);
    } else {
        await switchQuVpn(context);
    }

    for (let fIndex = 0; fIndex < targetFiles.length; fIndex++) {
        const inputFilePath = targetFiles[fIndex];
        const parentFolderDir = path.dirname(inputFilePath);
        const folderName = path.basename(parentFolderDir);
        const outputCsvPath = path.join(parentFolderDir, `${folderName} (All).csv`);

        console.log(`\n==================================================`);
        console.log(`📂 [Папка ${fIndex + 1}/${targetFiles.length}]: ${folderName}`);
        console.log(`📄 Входной файл: ${inputFilePath}`);
        console.log(`📊 Выходной CSV: ${outputCsvPath}`);
        console.log(`==================================================`);

        let rawText = "";
        try {
            rawText = await fs.readFile(inputFilePath, "utf8");
        } catch {
            console.log(`❌ Ошибка чтения файла ${inputFilePath}. Пропускаем...`);
            continue;
        }

        const allTags = rawText.split("\n").map(t => t.trim()).filter(Boolean);
        console.log(`📋 Всего тегов в файле: ${allTags.length}`);

        const resultsMap = await loadExistingResults(outputCsvPath);
        if (resultsMap.size > 0) {
            console.log(`📂 Уже собрано тегов в CSV: ${resultsMap.size}`);
        }

        activeOutputCsvPath = outputCsvPath;
        activeResultsMap = resultsMap;

        const remainingTags = allTags.filter(tag => !resultsMap.has(tag.toLowerCase()));
        console.log(`🎯 Осталось проверить новых тегов: ${remainingTags.length}`);

        if (remainingTags.length === 0) {
            console.log(`✅ Папка "${folderName}" уже полностью обработана! Переходим к следующей...`);
            continue;
        }

        const chunks = [];
        for (let i = 0; i < remainingTags.length; i += CHUNK_SIZE) {
            chunks.push(remainingTags.slice(i, i + CHUNK_SIZE));
        }
        console.log(`📦 Разбито на ${chunks.length} пачек(ки) по ${CHUNK_SIZE} шт.\n`);

        for (let i = 0; i < chunks.length; i++) {
            console.log(`⏳ Обработка пачки ${i + 1} из ${chunks.length}...`);
            const chunkText = chunks[i].join("\n");

            let success = false;
            let attempts = 0;

            while (!success && attempts < 3) {
                attempts++;
                totalRequestsCounter++;

                console.log(`   🔄 Попытка ${attempts} из 3 (Всего запросов: ${totalRequestsCounter})...`);

                // Ротация VPN каждые 5 запросов (только для Qu VPN)
                if (!useSystemVpn && totalRequestsCounter > 1 && (totalRequestsCounter - 1) % 5 === 0) {
                    console.log(`\n🔄 [Авто-ротация] Выполнено ${totalRequestsCounter - 1} запросов. Профилактическое переключение VPN...`);
                    await switchQuVpn(context);
                }

                // 🛡️ Используем единую постоянную фоновую вкладку, чтобы не переключать окна и не дергать фокус пользователя
                const page = await getOrCreateWorkerPage(context);

                try {
                    // Перезагружаем или переходим на searchvolume.io внутри существующей вкладки
                    if (!page.url().includes("searchvolume.io")) {
                        await page.goto("https://searchvolume.io/", { waitUntil: "domcontentloaded", timeout: 60000 });
                    } else {
                        // Очищаем форму внутри вкладки без открытия новых окон
                        await page.goto("https://searchvolume.io/", { waitUntil: "domcontentloaded", timeout: 60000 });
                    }

                    await page.waitForSelector("textarea", { timeout: 10000 });
                    await page.fill("textarea", chunkText).catch(async () => {
                        await page.evaluate((text) => {
                            const ta = document.querySelector('textarea');
                            if (ta) {
                                ta.value = text;
                                ta.dispatchEvent(new Event('input', { bubbles: true }));
                                ta.dispatchEvent(new Event('change', { bubbles: true }));
                            }
                        }, chunkText);
                    });
                    await page.waitForTimeout(500);

                    await clickSubmitUntilTriggered(page);

                    await page.waitForTimeout(1000);
                    const isRateLimited = await page.evaluate(() => {
                        const text = document.body.innerText;
                        return text.includes("Too many requests") || text.includes("Please try again later");
                    });

                    if (isRateLimited) {
                        console.log(`   ⛔ Обнаружен лимит "Too many requests"!`);
                        if (useSystemVpn) {
                            console.log(`   ⏳ Системный VPN: ждем 40 сек перед повторной отправкой...`);
                            await new Promise(r => setTimeout(r, 40000));
                        } else {
                            await switchQuVpn(context);
                        }
                        continue;
                    }

                    await handleCaptchaWithBuster(page);

                    console.log(`   Ждем загрузки результатов (div.sv__row)...`);
                    await page.waitForSelector('.sv__row', { timeout: 45000 });
                    await page.waitForTimeout(1500);

                    const parsedData = await page.evaluate(() => {
                        const rows = Array.from(document.querySelectorAll('.sv__row'));
                        return rows.map(row => {
                            const lines = row.innerText.split('\n').map(t => t.trim()).filter(Boolean);
                            const kw = lines[0] || "";
                            // Разделители тысяч в SearchVolume.io: точка 8.100 (европейский IP/локаль), запятая 8,100, пробел 8 100
                            // Очищаем любые символы-разделители разрядов тысяч:
                            const rawVol = lines[1] || "0";
                            const cleanVol = rawVol.replace(/[,.\s']/g, '');
                            const vol = parseInt(cleanVol, 10) || 0;
                            return { kw, vol };
                        }).filter(item => item.kw && item.kw.toLowerCase() !== "keywords");
                    });

                    for (const item of parsedData) {
                        resultsMap.set(item.kw.toLowerCase(), item);
                    }

                    await saveProgress(outputCsvPath, resultsMap);
                    console.log(`   ✅ Пачка ${i + 1} готова! Извлечено ${parsedData.length} строк и СОХРАНЕНО в ${path.basename(outputCsvPath)}`);
                    success = true;

                } catch (e) {
                    console.log(`   ❌ Ошибка на попытке ${attempts}: ${e.message}`);

                    const isRateLimited = await page.evaluate(() => {
                        return document.body.innerText.includes("Too many requests");
                    }).catch(() => false);

                    if (isRateLimited) {
                        console.log(`   ⛔ Обнаружен лимит IP!`);
                        if (useSystemVpn) {
                            console.log(`   ⏳ Системный VPN: ждем 40 сек перед повторной попыткой...`);
                            await new Promise(r => setTimeout(r, 40000));
                        } else {
                            await switchQuVpn(context);
                        }
                    }
                } finally {
                    // 🛡️ НЕ закрываем workerPage! Оставляем вкладку открытой, чтобы Chrome не переключал активные окна на macOS/Windows.
                }
            }

            if (!success) {
                console.log(`   ⚠️ Пропускаем пачку ${i + 1} из-за 3 неудачных попыток.`);
            }
        }

        await saveProgress(outputCsvPath, resultsMap);
        console.log(`🎉 Папка "${folderName}" успешно завершена! Итого тегов: ${resultsMap.size}`);
    }

    console.log(`\n🎉 ВСЕ ПАПКИ УСПЕШНО ОБРАБОТАНЫ!`);
    process.exit(0);
}

main();