import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import { chromium } from "playwright-core";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const INPUT_FILENAME = "Pininspector + Seeds.txt";
const CHUNK_SIZE = 600;

const VPN_EXTENSION_ID = "pdmchlannmelcagdkakcefmbmpogcgfo";
let currentVpnCountry = null; // Поочередно: Германия <-> Нидерланды
let totalRequestsCounter = 0; // Общий счетчик запросов

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
                url: `chrome-extension://${VPN_EXTENSION_ID}/popup.html`
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
        console.error("\n⛔ КРИТИЧЕСКАЯ ОШИБКА: Не удалось включить VPN!");
        console.error("🛑 Скрипт остановлен для безопасности.\n");
        process.exit(1);
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
                const vol = parseInt(parts[1], 10) || 0;
                if (kw) map.set(kw.toLowerCase(), { kw, vol });
            }
        }
    } catch (e) {}
    return map;
}

// Сохранение результатов
async function saveProgress(csvPath, resultsMap) {
    const list = Array.from(resultsMap.values());
    list.sort((a, b) => b.vol - a.vol);
    const csvContent = list.map(item => `${item.kw};${item.vol}`).join("\n");
    await fs.writeFile(csvPath, csvContent, "utf8");
}

// Клик по Buster
async function handleCaptchaWithBuster(page) {
    try {
        await page.waitForTimeout(1000);

        for (const frame of page.frames()) {
            if (frame.url().includes('recaptcha')) {
                const checkbox = frame.locator('#recaptcha-anchor');
                if (await checkbox.isVisible()) {
                    console.log("   🤖 Нажимаем галочку «Я не робот»...");
                    await checkbox.click();
                    break;
                }
            }
        }

        await page.waitForTimeout(2500);

        const startTime = Date.now();
        let clickedBuster = false;

        while (Date.now() - startTime < 12000) {
            for (const frame of page.frames()) {
                if (!frame.url().includes('recaptcha') && !frame.url().includes('bframe')) continue;

                try {
                    const helpHolder = frame.locator('.help-button-holder');
                    if (await helpHolder.isVisible()) {
                        console.log("   ⚡ Нашли Buster (.help-button-holder)! Запускаем авто-решение...");
                        await helpHolder.click();
                        clickedBuster = true;
                        break;
                    }
                } catch (e) {}
            }

            if (clickedBuster) break;
            await page.waitForTimeout(500);
        }

        if (clickedBuster) {
            console.log("   ⏳ Buster решает капчу голосом, ждем...");
            await page.waitForTimeout(8000);
        }

    } catch (e) {}
}

async function main() {
    console.log(`\n🚀 Запуск автоматического пакетного сбора объемов с SearchVolume.io`);

    const rootDir = process.cwd();
    console.log(`🔍 Сканирование папок в поисках файлов '${INPUT_FILENAME}'...`);

    const targetFiles = await findTargetFiles(rootDir);
    console.log(`✅ Найдено папок с ключами: ${targetFiles.length}\n`);

    if (targetFiles.length === 0) {
        console.log(`⚠️ Файлы '${INPUT_FILENAME}' не найдены ни в одной папке.`);
        process.exit(0);
    }

    const browser = await getBrowser();
    const context = browser.contexts()[0] || await browser.newContext();

    // Включаем VPN при старте
    await switchQuVpn(context);

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

                // Ротация VPN каждые 5 запросов
                if (totalRequestsCounter > 1 && (totalRequestsCounter - 1) % 5 === 0) {
                    console.log(`\n🔄 [Авто-ротация] Выполнено ${totalRequestsCounter - 1} запросов. Профилактическое переключение VPN...`);
                    await switchQuVpn(context);
                }

                const page = await context.newPage();

                try {
                    await page.goto("https://searchvolume.io/", { waitUntil: "domcontentloaded", timeout: 60000 });

                    await page.waitForSelector("textarea", { timeout: 10000 });
                    await page.fill("textarea", chunkText);
                    await page.waitForTimeout(500);

                    await clickSubmitUntilTriggered(page);

                    await page.waitForTimeout(1000);
                    const isRateLimited = await page.evaluate(() => {
                        const text = document.body.innerText;
                        return text.includes("Too many requests") || text.includes("Please try again later");
                    });

                    if (isRateLimited) {
                        console.log(`   ⛔ Обнаружен лимит "Too many requests"! Переключаем VPN...`);
                        await page.close().catch(() => {});
                        await switchQuVpn(context);
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
                            const volText = (lines[1] || "0").replace(/,/g, '');
                            const vol = parseInt(volText, 10) || 0;
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
                        console.log(`   ⛔ Обнаружен лимит IP! Переключаем VPN...`);
                        await switchQuVpn(context);
                    }
                } finally {
                    await page.close().catch(() => {});
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