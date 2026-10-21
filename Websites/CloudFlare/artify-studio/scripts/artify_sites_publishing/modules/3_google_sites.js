// scripts/artify_sites_publishing/modules/3_google_sites.js
import { chromium } from 'playwright-core';
import { CONFIG } from '../config.js';
import { getOrCreateAnalytics } from './2_analytics.js';
import { resizeEmbedBlock } from './3_1_resizeEmbedBlock.js';
import fs from 'fs';
import path from 'path';

/**
 * Ищет файл логотипа в текущей папке и поднимается вверх до папки Keywords
 */
function findLogoFile(startPath) {
    const validExtensions = ['.png', '.jpg', '.jpeg', '.webp'];
    let currentDir = startPath;

    while (currentDir) {
        // Проверяем все допустимые расширения в текущей папке
        for (const ext of validExtensions) {
            const logoPath = path.join(currentDir, `logo${ext}`);
            if (fs.existsSync(logoPath)) {
                return logoPath;
            }
        }

        // Если дошли до папки Keywords - прекращаем поиск, чтобы не лезть в системные файлы
        if (path.basename(currentDir).toLowerCase() === 'keywords') {
            break;
        }

        const parentDir = path.dirname(currentDir);
        // Защита от бесконечного цикла, если дошли до корня диска ("/" или "C:\")
        if (parentDir === currentDir) {
            break;
        }
        currentDir = parentDir;
    }

    return null; // Логотип не найден
}

export async function buildGoogleSite(thematicName, cfUrl, gCode, absolutePath, relativeTaskPath) {
    console.log(`\n🤖 [Модуль 3: Playwright] Начинаю клонирование шаблона для: ${thematicName}`);

    const browserURL = `http://127.0.0.1:${CONFIG.CHROMIUM_PORT}`;
    let browser;
    try {
        browser = await chromium.connectOverCDP(browserURL);
    } catch (e) {
        throw new Error(`Не могу подключиться к Chromium. Запусти его: /Applications/Chromium.app/Contents/MacOS/Chromium --remote-debugging-port=${CONFIG.CHROMIUM_PORT}`);
    }

    const context = browser.contexts()[0] || await browser.newContext();
    const templatePage = await context.newPage();

    try {
        // 1. ОТКРЫВАЕМ ШАБЛОН
        console.log(`🌐 Открываю шаблон Google Sites...`);
        await templatePage.goto(CONFIG.GOOGLE_SITE_TEMPLATE_URL, { waitUntil: 'domcontentloaded', timeout: 60000 });
        await templatePage.waitForTimeout(4000);

        // 2. НАЖИМАЕМ ТРОЕТОЧИЕ "ДОПОЛНИТЕЛЬНО" (Точный селектор button)
        console.log(`🔘 Открываю меню "Дополнительно"...`);
        const moreBtn = templatePage.locator('button[aria-label="Дополнительно"], button[aria-label="More"], button#at-feedback, [aria-label="Дополнительно"]').first();
        await moreBtn.waitFor({ state: 'visible', timeout: 30000 });
        await moreBtn.click();
        await templatePage.waitForTimeout(1000);

        // 3. НАЖИМАЕМ "СОЗДАТЬ КОПИЮ"
        console.log(`📋 Выбираю "Создать копию"...`);
        const copyItem = templatePage.locator('li:has-text("Создать копию"), span:has-text("Создать копию"), [role="menuitem"]:has-text("Создать копию")').first();
        await copyItem.click();
        await templatePage.waitForTimeout(2000);
        
        // 4. Поле ввода имени
        const nameInput = templatePage.locator('input[aria-label="Название файла"], input.whsOnd.zHQKBf, div[role="dialog"] input[type="text"]').first();
        await nameInput.waitFor({ state: 'visible', timeout: 10000 });
        await nameInput.fill("Draft");
        await templatePage.waitForTimeout(500);

        // 5. НАЖИМАЕМ "ОК" И ПЕРЕХВАТЫВАЕМ НОВУЮ ВКЛАДКУ
        console.log(`🚀 Нажимаю "ОК" и жду открытия новой копии сайта...`);
        
        const [newPage] = await Promise.all([
            context.waitForEvent('page', { timeout: 45000 }), // Ждем открытия новой вкладки от Google
            templatePage.locator('div[role="dialog"] div[role="button"]:has-text("ОК"), div[role="dialog"] div[role="button"]:has-text("OK"), div[role="dialog"] button:has-text("ОК")').first().click()
        ]);

        // Закрываем старую вкладку шаблона, чтобы не висела
        await templatePage.close();
        console.log(`✅ Новая копия создана! Переключился на неё.`);

        // Ждем загрузки редактора в новой вкладке
        await newPage.waitForTimeout(5000);
        await newPage.waitForSelector('div[role="button"]:has-text("Опубликовать"), div[role="button"]:has-text("Publish")', { timeout: 45000 });

        // 6. ВСТРАИВАЕМ CLOUDFLARE ССЫЛКУ (EMBED)
        console.log(`🔗 Встраиваю ссылку Cloudflare: ${cfUrl}`);

        // 6.1. Кликаем кнопку "Встроить" со Скриншота 1 (force: true пробивает слой анимации)
        const embedBtn = newPage.locator('div[aria-label="Встроить"], div[aria-label="Embed"], div.LhYFUe:has-text("Встроить")').first();
        await embedBtn.waitFor({ state: 'visible', timeout: 30000 });
        await embedBtn.click({ force: true });
        await newPage.waitForTimeout(1500);

        // 6.2. Вводим ссылку в инпут со Скриншота 2 (input.poFWNe.zHQKBf)
        const urlInput = newPage.locator('input[aria-label*="URL"], input.poFWNe.zHQKBf, div[role="dialog"] input[type="text"]').first();
        await urlInput.waitFor({ state: 'visible', timeout: 10000 });
        await urlInput.fill(cfUrl);
        
        // 6.3. Ждем 4 секунды, пока Google загрузит превью и кнопка станет активной
        console.log(`⏳ Жду загрузки превью страницы...`);
        await newPage.waitForTimeout(4000);

        // 6.4. Нажимаем кнопку "Вставить" в модальном окне
        const insertBtn = newPage.locator('div[role="dialog"] div[role="button"]:has-text("Вставить"), div[role="dialog"] div[role="button"]:has-text("Insert")').last();
        await insertBtn.waitFor({ state: 'visible', timeout: 10000 });
        await insertBtn.click({ force: true });
        await newPage.waitForTimeout(2500);

       await resizeEmbedBlock(newPage, 1800);

        // 7 ПЕРЕИМЕНОВЫВАЕМ СТРАНИЦУ ЧЕРЕЗ "СВОЙСТВА" (Прямой клик)
        console.log(`📑 Переименовываю страницу в меню...`);
        
        // 7.1. Открываем вкладку "Страницы"
        try {
            const pagesTab = newPage.locator('text="Страницы"').or(newPage.locator('text="Pages"')).or(newPage.locator('[data-tooltip="Страницы"]')).first();
            await pagesTab.click({ force: true, timeout: 3000 });
        } catch {
            const secondTab = newPage.locator('.goog-tab').nth(1);
            await secondTab.click({ force: true });
        }
        await newPage.waitForTimeout(1500);

        // 7.2. ПРЯМОЙ КЛИК ПО ТРОЕТОЧИЮ (Без ховера и поиска текста "Home")
        console.log(`🔘 Ищу троеточие активной страницы...`);
        
        // Выбираем активную строку страницы (она всегда выделена при открытии шаблона)
        const activePageRow = newPage.locator('div[aria-selected="true"]').last();
        
        // Троеточие — это всегда кнопка с действиями внутри этой строки (со скриншота)
        const moreFortitleBtn = activePageRow.locator('div[role="button"], div[aria-label*="Действия"], div[aria-label*="actions"]').last();
        
        // Кликаем силой (force: true пробивает отсутствие ховера и невидимость)
        await moreFortitleBtn.click({ force: true });
        await newPage.waitForTimeout(3000);

        // 7.3. Выбираем пункт "Открыть параметры" (Точный селектор из DevTools)
        console.log(`📋 Выбираю "Открыть параметры"...`);
        
        // Ищем строго элемент меню по роли и aria-label со скриншота
        const propertiesMenuItem = newPage.locator('[role="menuitem"][aria-label*="параметры"], [role="menuitem"][aria-label*="properties"], div.jO7h3c:has-text("Открыть параметры")').first();
        
        await propertiesMenuItem.waitFor({ state: 'visible', timeout: 5000 });
        await propertiesMenuItem.click({ force: true });
        await newPage.waitForTimeout(1000);

        // 7.4. Вводим название в модальном окне
        console.log(`⏳ Жду модального окна с инпутом...`);
        // Селекторы инпута из твоего скриншота
        const pageTitleInput = newPage.locator('input[aria-label="Название"], input[aria-label="Name"]').last();
        await pageTitleInput.waitFor({ state: 'visible', timeout: 5000 });
        await newPage.waitForTimeout(1000);
        
        console.log(`✍️  Ввожу название страницы: ${thematicName}`);
        
        await pageTitleInput.click();

        await pageTitleInput.fill(thematicName);
        await newPage.waitForTimeout(500);

        console.log(`💾 Нажимаю "Готово"...`);
        const doneBtn = newPage.locator('div[role="button"]:has-text("Готово"), div[role="button"]:has-text("Done")').last();
        await doneBtn.click({ force: true });
        await newPage.waitForTimeout(1000);

        // 8. РАСШАРИВАЕМ САЙТ НА 10 GMAIL-АККАУНТОВ
        console.log(`\n👥 Расшариваю доступ на ${CONFIG.GMAIL_ACCOUNTS.length} аккаунтов...`);
    
        // 8.1. Кликаем по кнопке "Открыть доступ" (на основной странице)
        const shareBtn = newPage.locator('button[aria-label*="доступ"], div[role="button"][aria-label*="доступ"], button[aria-label*="Share"]').first();
        await shareBtn.waitFor({ state: 'visible', timeout: 10000 });
        await shareBtn.click({ force: true });
        
        console.log(`⏳ Жду подгрузки фрейма доступа...`);
        await newPage.waitForTimeout(3000); // Обязательная пауза, пока Google грузит iframe

        // 8.2. НАХОДИМ ВЛОЖЕННЫЙ IFRAME МОДАЛКИ
        // Google часто грузит эту модалку в iframe с классом picker-dialog или просто как последний iframe на странице
        const framesCount = await newPage.locator('iframe').count();
        console.log(`🔍 [Отладка] Найдено iframe на странице: ${framesCount}`);

        // Берем последний загруженный iframe (обычно это и есть модалка)
        const shareFrame = newPage.frameLocator('iframe').last();

        // 8.3. Ищем инпут ВНУТРИ IFRAME
        console.log(`🔍 [Отладка] Ищу инпут "Добавьте пользователей" внутри iframe...`);
        
        const shareInput = shareFrame.locator('input[role="combobox"], input.zeumMd, input[aria-label*="Добавьте"]').first();
        
        await shareInput.waitFor({ state: 'attached', timeout: 10000 });
        console.log(`✅ [Отладка] Инпут успешно найден внутри iframe!`);
        
        // Активируем поле
        await shareInput.click({ force: true });
        await newPage.waitForTimeout(500);

        // 8.4. Вводим каждый email (с эмуляцией живой печати)
        for (const email of CONFIG.GMAIL_ACCOUNTS) {
            console.log(`   📧 Ввожу: ${email}`);
            // Вводим текст через iframe
            await shareInput.pressSequentially(email, { delay: 30 });
            await newPage.waitForTimeout(300);
            
            // Нажимаем Enter
            await newPage.keyboard.press('Enter'); 
            await newPage.waitForTimeout(800); 
        }

        const tapMesage = shareFrame.locator('span:has-text("Текст сообщения")').last();
        await tapMesage.click({ force: true, timeout: 5000 });

        // 8.5. Снимаем галочку "Уведомить пользователей" через клавиатуру!
        console.log(`🔍 [Отладка] Проверяю галочку уведомлений...`);

        const notifyCheckbox = shareFrame.locator('input[type="checkbox"][value="notify"]').first();
        
        console.log(`   🔔 Галочка стоит. Снимаю через Space (клавиатура)...`);
        
        // Убеждаемся, что мы сфокусированы на инпуте с email-ами (откуда начнем Tab)
        await shareInput.focus();
        await newPage.waitForTimeout(200);

        // Если галочка все еще стоит, жмем Пробел (Space) для ее снятия
        if (await notifyCheckbox.isChecked()) {
            await newPage.keyboard.press('Tab');
            await newPage.waitForTimeout(500);
            await newPage.keyboard.press('Tab');
            await newPage.waitForTimeout(500);
            await newPage.keyboard.press('Space');
            await newPage.waitForTimeout(500);
        }

        if (await notifyCheckbox.isChecked()) {
            console.log(`   ❌ Галочка так и не снялась. Идем дальше как есть.`);
        } else {
            console.log(`   🔕 Снятие галочки успешно отработано.`);
        }

        await newPage.waitForTimeout(3000); 

        // 8.6. Нажимаем кнопку подтверждения ВНУТРИ IFRAME
        console.log(`💾 Сохраняю права доступа...`);

        await newPage.keyboard.press('Tab');
        await newPage.waitForTimeout(500);
        await newPage.keyboard.press('Tab');
        await newPage.waitForTimeout(500);
        await newPage.keyboard.press('Enter');
        await newPage.waitForTimeout(500);

        // Ждем закрытия фрейма
        await newPage.waitForTimeout(3000);
        
        console.log(`✅ Доступ успешно предоставлен всем ${CONFIG.GMAIL_ACCOUNTS.length} аккаунтам!`);

        // 9. Открываем настройки
        const settingsBtn = newPage.locator('button[aria-label="Настройки"], button[aria-label="Settings"]').first();
        await settingsBtn.click();
        await newPage.waitForTimeout(1000);

        // 9.1 ЗАГРУЖАЕМ ЗНАЧОК САЙТА (FAVICON)
        console.log(`🖼️ Ищу файл логотипа...`);
        const logoPath = findLogoFile(absolutePath);
        
        if (logoPath) {
            console.log(`✅ Логотип найден: ${logoPath}`);
            console.log(`🖼️ Загружаю "Значок сайта"...`);
            
           // 1. Переходим на вкладку "Изображения для бренда"
            const brandImagesTab = newPage.locator('text="Изображения для бренда"').or(newPage.locator('text="Brand images"')).first();
            await brandImagesTab.click();
            await newPage.waitForTimeout(1000);

            // 2. Находим кнопку "Загрузить" именно в секции "Значок сайта" (вторая по счёту на странице)
            const uploadButtons = newPage.locator('button:has-text("Загрузить"), div[role="button"]:has-text("Загрузить")');
            const siteIconUploadBtn = uploadButtons.nth(1); // 0 = Логотип, 1 = Значок сайта

            await siteIconUploadBtn.scrollIntoViewIfNeeded();

            // 3. Кликаем и ОДНОВРЕМЕННО ждём системный диалог выбора файла —
            //    это ключевой момент: filechooser перехватывает нативный OS-диалог,
            //    даже если он не связан напрямую с <input type="file"> в DOM
            console.log(`🖼️ Загружаю "Значок сайта"...`);
            const [fileChooser] = await Promise.all([
                newPage.waitForEvent('filechooser', { timeout: 15000 }),
                siteIconUploadBtn.click()
            ]);

            await fileChooser.setFiles(logoPath);
            await newPage.waitForTimeout(3000); // ждём загрузки на сервера Google
            console.log(`✅ Значок сайта успешно установлен!`);
        } else {
            console.log(`⚠️ Логотип (logo.png/jpg) не найден в папке или родителях. Пропускаю значок сайта.`);
        }

        // Закрываем модальное окно настроек
        console.log(`❌ Закрываю окно настроек...`);

        // Проверяем, закрылось ли окно. Если модалка "Настройки" все еще видна — бьем по крестику!
        const settingsModal = newPage.locator('div[role="dialog"]:has-text("Настройки"), div[role="dialog"]:has-text("Settings")').first();
        if (await settingsModal.isVisible({ timeout: 1000 })) {            
            // Ищем крестик точно по атрибутам из твоего скриншота
            const closeBtn = newPage.locator('div[role="button"][data-tooltip="Закрыть"], div[role="button"][data-tooltip="Close"], div[aria-label="Закрыть"], div[aria-label="Close"]').first();
            
            await closeBtn.waitFor({ state: 'visible', timeout: 5000 });
            await closeBtn.click({ force: true });
            await newPage.waitForTimeout(1000);
        }
        console.log(`✅ Окно настроек закрыто.`);

        await newPage.waitForTimeout(5000);

        // 10. ПУБЛИКАЦИЯ САЙТА
        console.log(`🚀 Нажимаю "Опубликовать"...`);
        const publishBtn = newPage.locator('div[role="button"]:has-text("Опубликовать"), div[role="button"]:has-text("Publish")').first();
        await publishBtn.click();
        
        const webAddressInput = newPage.locator('div[role="dialog"]')
            .locator('div:has(> label:has-text("Веб-адрес")), div:has(> label:has-text("Web address")), div:has(label:has-text("Веб-адрес"))')
            .locator('input')
            .first();
        
        await webAddressInput.waitFor({ state: 'visible', timeout: 10000 });

        // Базовый слаг (очищенный от мусора)
        const rawBaseSlug = thematicName.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
        
        // ✂️ УМНАЯ ФУНКЦИЯ ОБРЕЗКИ ДО 30 СИМВОЛОВ
        // Генерирует слаг вида: [обрезанная база]-to-artify[-цифра]
        const generateSafeSlug = (suffix = "") => {
            const staticPart = `-to-artify${suffix}`; // Например "-to-artify" или "-to-artify-7"
            const maxBaseLength = 30 - staticPart.length;

            let safeBase = rawBaseSlug;
            if (safeBase.length > maxBaseLength) {
                // Обрезаем базу так, чтобы влез статический кусок
                safeBase = safeBase.substring(0, maxBaseLength);
                // Убираем висячий дефис на конце обрезка (чтобы не было двойных тире)
                safeBase = safeBase.replace(/-$/, '');
            }

            return `${safeBase}${staticPart}`;
        };

        // Локаторы ошибки (название занято ИЛИ превышен лимит символов)
        const errorMsg = newPage.locator('text="Сайт с таким названием уже существует"').or(newPage.locator('.uNeeU.RxsGPe')).or(newPage.locator('text="Можно использовать не более 30 символов"'));
        const confirmPublishBtn = newPage.locator('div[role="dialog"]').locator('div[role="button"]:has-text("Опубликовать"), div[role="button"]:has-text("Publish")').last();

        const tryEnterSlug = async (slugToTest) => {
            console.log(`✍️  Пробую слаг адреса: ${slugToTest} (${slugToTest.length} симв.)`);
            await webAddressInput.click({ force: true });
            await newPage.keyboard.press('Meta+A'); 
            await newPage.keyboard.press('Control+A'); 
            await webAddressInput.fill(slugToTest);
            await newPage.waitForTimeout(2000); // Ждем валидации Гуглом
        };

        // 1-я попытка: базовый слаг
        let finalSlug = generateSafeSlug();
        await tryEnterSlug(finalSlug);
        let isTaken = await errorMsg.isVisible().catch(() => false);

        // 2-й этап: если занято — пробуем однозначные цифры 1..9
        if (isTaken) {
            console.log(`⚠️ Базовый адрес занят. Перебираю однозначные цифры (1-9)...`);
            for (let digit = 1; digit <= 9; digit++) {
                finalSlug = generateSafeSlug(`-${digit}`);
                await tryEnterSlug(finalSlug);

                isTaken = await errorMsg.isVisible().catch(() => false);
                if (!isTaken) {
                    console.log(`✅ Свободный адрес найден: ${finalSlug}`);
                    break;
                }
            }
        }

        // 3-й этап: если все 1..9 заняты — пробуем двухзначные числа (10..99)
        if (isTaken) {
            console.log(`⚠️ Однозначные цифры заняты. Пробую двухзначные числа (10-99)...`);
            for (let attempt = 0; attempt < 10; attempt++) {
                const twoDigits = Math.floor(Math.random() * 90) + 10; // 10..99
                finalSlug = generateSafeSlug(`-${twoDigits}`);
                await tryEnterSlug(finalSlug);

                isTaken = await errorMsg.isVisible().catch(() => false);
                if (!isTaken) {
                    console.log(`✅ Свободный адрес найден: ${finalSlug}`);
                    break;
                }
            }
        }

        if (isTaken) {
            throw new Error(`Не удалось найти свободный веб-адрес (менее 30 символов) для ${thematicName}`);
        }

        // Подтверждаем публикацию
        console.log(`🚀 Подтверждаю публикацию: ${finalSlug}...`);
        await confirmPublishBtn.click({ force: true });
        
        // Ждем сохранения
        await newPage.waitForTimeout(5000);

        // 11. ЗАБИРАЕМ ССЫЛКИ
        const editUrl = newPage.url();
        const publicUrl = `https://sites.google.com/view/${finalSlug}`;

        console.log(`🎉 Google Site успешно опубликован!`);
        console.log(`👉 Публичная ссылка: ${publicUrl}`);
        console.log(`👉 Ссылка на редакцию: ${editUrl}`);

        // 11.1. ВВОДИМ ВРЕМЕННОЕ НАЗВАНИЕ В ЛЕВОМ ВЕРХНЕМ УГЛУ
        const siteNameafterPublishbeforCode = `Draft ${thematicName} before Code`;
        console.log(`✍️  Ввожу временное имя документа в левом углу: "${siteNameafterPublishbeforCode}"...`);
        
        // Точный селектор инпута в левом верхнем углу из твоего скриншота (div.qqH9nc input)
        // const docNameInputTopLeft = newPage.locator('div.qqH9nc input, div[aria-label*="Название файла"] input, input.VfPpkd-fmcmS-wGMbrd').first();
        const docNameInputTopLeft = newPage.locator('div[aria-label*="Название файла"] input').first();
        
        await docNameInputTopLeft.waitFor({ state: 'attached', timeout: 10000 });
        
        // Кликаем в инпут в левом верхнем углу, очищаем и пишем новое имя
        await docNameInputTopLeft.click({ force: true });
        await newPage.keyboard.press('Meta+A'); 
        await newPage.keyboard.press('Control+A'); 
        await newPage.keyboard.press('Backspace');

        await docNameInputTopLeft.fill(siteNameafterPublishbeforCode);
        await newPage.keyboard.press('Enter'); // Нажимаем Enter для сохранения имени на Google Диске
        await newPage.waitForTimeout(1000);
        
        console.log(`✅ Имя документа на Диске изменено на: "${siteNameafterPublishbeforCode}"`);

        await newPage.waitForTimeout(5000);

        // 12. СОЗДАЕМ И ВСТАВЛЯЕМ АНАЛИТИКУ (G-CODE)
        let finalGCode = gCode;
        if (!finalGCode || finalGCode.includes('TEST')) {
            // Создаем реальный GA4 ресурс прямо под этот publicUrl!
            finalGCode = await getOrCreateAnalytics(thematicName, publicUrl, relativeTaskPath);
        }

        if (finalGCode) {
            console.log(`📊 Вставляю G-код (${finalGCode}) в настройки сайта...`);
            
            // Кнопка "Настройки" (шестеренка вверху)
            const settingsBtn = newPage.locator('button[aria-label="Настройки"], button[aria-label="Settings"], div[role="button"][aria-label="Настройки"]').first();
            await settingsBtn.click({ force: true });
            await newPage.waitForTimeout(1500);

            // Вкладка "Аналитика"
            const analyticsTab = newPage.locator('text="Аналитика"').or(newPage.locator('text="Analytics"')).first();
            await analyticsTab.click({ force: true });
            await newPage.waitForTimeout(500);

            // Инпут для ввода кода аналитики
            const gaInput = newPage.locator('input[aria-label*="Идентификатор отслеживания"], input[aria-label*="Tracking ID"], div[role="dialog"] input[type="text"]').first();
            await gaInput.waitFor({ state: 'visible', timeout: 5000 });
            await gaInput.click({ force: true });
            await gaInput.fill(finalGCode);
            await newPage.waitForTimeout(500);

            // Закрываем окно настроек (через крестик или Escape)
            console.log(`❌ Закрываю окно настроек...`);
            const closeSettingsBtn = newPage.locator('div[role="button"][data-tooltip="Закрыть"], div[role="button"][data-tooltip="Close"], div[aria-label="Закрыть"]').first();
            if (await closeSettingsBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
                await closeSettingsBtn.click({ force: true });
            } else {
                await newPage.keyboard.press('Escape');
            }
            await newPage.waitForTimeout(1500);
            console.log(`✅ Аналитика успешно подключена!`);
        } 
// 13. УСТАНАВЛИВАЕМ ФИНАЛЬНОЕ ИМЯ ДОКУМЕНТА НА GOOGLE ДИСКЕ
        const finalDocName = `${thematicName} to Artify`;
        console.log(`✍️  Устанавливаю финальное имя документа: "${finalDocName}"...`);
        
        await docNameInputTopLeft.click({ force: true });
        await newPage.keyboard.press('Meta+A'); 
        await newPage.keyboard.press('Control+A'); 
        await newPage.keyboard.press('Backspace');

        await docNameInputTopLeft.fill(finalDocName);
        await newPage.keyboard.press('Enter');
        await newPage.waitForTimeout(2000);
        console.log(`🎉 Финальное имя "${finalDocName}" сохранено на Google Диске!`);

        // 14. 🔄 ПЕРЕЗАГРУЖАЕМ СТРАНИЦУ И ОЧИЩАЕМ НАЗВАНИЕ НА ХОЛСТЕ (В НОЛЬ)
        console.log(`🔄 Перезагружаю страницу редактора...`);
        await newPage.reload({ waitUntil: 'domcontentloaded' });
        await newPage.waitForTimeout(3000);

        console.log(`⏳ Жду загрузки интерфейса после релоада...`);
        await newPage.waitForSelector('div[role="button"]:has-text("Опубликовать"), div[role="button"]:has-text("Publish")', { timeout: 30000 });

        // 🎯 Находим инпут названия сайта НА ХОЛСТЕ
        console.log(`🧹 Очищаю название сайта на холсте (делаю полностью пустым)...`);
        const canvasSiteNameInput = newPage.locator('input[aria-label="Название сайта"], input[aria-label="Site name"], input.TlfmSc.YSH9J').first();
        
        if (await canvasSiteNameInput.isVisible({ timeout: 6000 }).catch(() => false)) {
            // 1. Тройной клик (clickCount: 3) гарантированно выделяет ВСЮ СТРОКУ целиком
            await canvasSiteNameInput.click({ clickCount: 3, force: true });
            await newPage.waitForTimeout(300);

            // 2. Жмем Backspace для удаления выделенного
            await newPage.keyboard.press('Backspace');
            await newPage.waitForTimeout(200);

            // 3. Напрямую сбрасываем значение через метод Playwright fill('')
            await canvasSiteNameInput.fill('');
            await newPage.waitForTimeout(200);

            // 4. Контрольная серия Backspace (на случай если Google держит скрытые символы)
            for (let b = 0; b < 30; b++) {
                await newPage.keyboard.press('Backspace');
            }

            await newPage.keyboard.press('Enter'); // Фиксируем пустоту на холсте
            await newPage.waitForTimeout(2000);
            console.log(`✅ Название на холсте гарантированно стерто в ноль!`);
        } else {
            console.log(`ℹ️ Поле названия на холсте не найдено или уже пустое.`);
        }

        // Ждем сохранения на Диске и закрываем вкладку
        await newPage.waitForTimeout(5000);
        await newPage.close();

        return {
            public: publicUrl,
            edit: editUrl,
            gCode: finalGCode
        };

    } catch (e) {
        console.error(`❌ Ошибка Playwright при копировании:`, e.message);
        throw e;
    }
}