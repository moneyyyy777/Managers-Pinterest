import { getBrowser } from "../browser-session.js";

// 🔥 УМНАЯ ВЗВЕШЕННАЯ ПЕРЕТАСОВКА (Smooth Weighted Interleaving / Процентное распределение)
// Гарантирует, что редкие товары (с меньшим процентом) равномерно распределены по ВСЕЙ длине ленты,
// а не заканчиваются в начале, оставляя внизу только товары из главного источника!
function interleaveArrays(arrays) {
    const tagged = [];
    arrays.forEach((arr, arrIndex) => {
        const len = arr.length;
        if (len === 0) return;
        arr.forEach((item, itemIndex) => {
            // Нормализованная координата товара от 0.0 до 1.0 внутри своего пула
            const normalizedPos = (itemIndex + 0.5) / len;
            tagged.push({
                item,
                pos: normalizedPos,
                arrIndex
            });
        });
    });
    
    // Равномерно перемешиваем по относительной шкале прогресса
    tagged.sort((a, b) => a.pos - b.pos || a.arrIndex - b.arrIndex);
    
    return tagged.map(t => t.item);
}

// 🔥 Хелпер для закрытия любых рекламных/cookie попапов
async function closePopups(page) {
    try {
        const closeImg = await page.$('img[src*="x-close"]');
        if (closeImg) {
            console.log("   ❌ Найден попап (тип img x-close), закрываем...");
            await closeImg.click({ force: true }).catch(() => {});
            await page.waitForTimeout(1000);
        }
        
        const closeBtn = await page.$('button[aria-label="Close dialog"]');
        if (closeBtn) {
            console.log("   ❌ Найден попап (тип button Close dialog), закрываем...");
            await closeBtn.click({ force: true }).catch(() => {});
            await page.waitForTimeout(1000);
        }
    } catch (e) { }
}

export async function scrapeCategoryLinks(sources) {
    const browser = await getBrowser();
    
    // открываем вкладку в ТЕКУЩЕМ контексте
    const context = browser.contexts().length > 0 ? browser.contexts()[0] : browser;
    const page = await context.newPage();

    // 🎯 Парсинг ссылок, пользовательских лимитов и примечаний менеджера (поддержка "URL, 400 # Примечание" или "URL, 400" или "URL # Примечание")
    const parsedSources = sources.map(item => {
        if (typeof item === 'object' && item.url) return item;
        let line = String(item).trim();
        
        let comment = '';
        const hashIdx = line.indexOf('#');
        if (hashIdx !== -1) {
            comment = line.substring(hashIdx + 1).trim();
            line = line.substring(0, hashIdx).trim();
        }

        const commaIndex = line.indexOf(',');
        if (commaIndex !== -1) {
            const url = line.substring(0, commaIndex).trim();
            const limitStr = line.substring(commaIndex + 1).trim();
            const parsedLimit = parseInt(limitStr, 10);
            return {
                url,
                limit: isNaN(parsedLimit) ? null : parsedLimit,
                comment
            };
        }
        return { url: line, limit: null, comment };
    }).filter(s => s.url.startsWith('http'));

    const defaultLimitPerUrl = Math.max(1, Math.floor(800 / parsedSources.length));
    const allCollectedArrays = [];
    const sourcesMap = {};
    
    for (let i = 0; i < parsedSources.length; i++) {
        const { url: currentUrl, limit: customLimit, comment: sourceComment } = parsedSources[i];
        const limitForThisSource = customLimit !== null ? customLimit : defaultLimitPerUrl;
        
        console.log(`\n⏳ Парсим источник [${i + 1}/${parsedSources.length}]: ${currentUrl}`);
        if (customLimit !== null) {
            console.log(`   Лимит для этого источника (пользовательский): ${limitForThisSource} товаров.`);
        } else {
            console.log(`   Лимит для этого источника (стандартный): ${limitForThisSource} товаров.`);
        }
        if (sourceComment) {
            console.log(`   💡 Примечание менеджера: "${sourceComment}"`);
        }
        
        const isSearch = currentUrl.includes('/search');
        let collectedLinks = new Set();
        let currentPageNum = 1;
        let lastCount = 0;
        let noNewItemsCount = 0;
        
        try {
            await page.goto(currentUrl, { waitUntil: "domcontentloaded", timeout: 60000 });
            await page.waitForTimeout(3000); 
            await closePopups(page);
        } catch (e) {
            console.log(`❌ Ошибка загрузки ${currentUrl}: ${e.message}`);
            continue;
        }

        const itemsMap = {};

        while (collectedLinks.size < limitForThisSource) {
            try {
                await page.waitForSelector('[data-testid="product-card"]', { timeout: 15000 });
            } catch (e) {
                console.log(`   ⚠️ Карточки товаров не найдены на странице.`);
                break;
            }

            const cardsOnPage = await page.evaluate(() => {
                const cards = document.querySelectorAll('[data-testid="product-card"]');
                const result = [];
                cards.forEach(card => {
                    const aTag = card.querySelector('a[data-testid="product-card-title"]') || card.querySelector('a[href*="/product/"]') || card.querySelector('a');
                    if (aTag && aTag.href && aTag.href.includes('/product/')) {
                        const urlObj = new URL(aTag.href);
                        const cleanUrl = urlObj.origin + urlObj.pathname;
                        
                        // Заголовок товара
                        let title = "";
                        const titleEl = card.querySelector('[data-testid="product-card-title"]') || card.querySelector('h2, h3, h4, [class*="title"]');
                        if (titleEl && titleEl.innerText.trim()) {
                            title = titleEl.innerText.trim();
                        } else if (aTag.innerText.trim()) {
                            title = aTag.innerText.trim();
                        } else if (aTag.getAttribute('title')) {
                            title = aTag.getAttribute('title').trim();
                        }

                        // Изображение товара
                        let image = "";
                        const img = card.querySelector('img');
                        if (img) {
                            image = img.currentSrc || img.getAttribute('src') || img.getAttribute('data-src') || "";
                            if (!image && img.getAttribute('srcset')) {
                                const parts = img.getAttribute('srcset').split(',').map(s => s.trim().split(' ')[0]);
                                if (parts.length > 0) image = parts[parts.length - 1];
                            }
                            if (!title && img.getAttribute('alt')) {
                                title = img.getAttribute('alt').trim();
                            }
                        }

                        // Автор / Дизайнер
                        let author = "";
                        const authorEl = card.querySelector('a[href*="/designer/"], a[href*="/creator/"], [class*="designer"], [class*="author"]');
                        if (authorEl && authorEl.innerText.trim()) {
                            author = authorEl.innerText.trim();
                        }

                        // Рейтинг
                        let rating = null;
                        const ratingEl = card.querySelector('[data-testid*="rating"], [class*="rating"]');
                        if (ratingEl) {
                            const rText = ratingEl.innerText || ratingEl.getAttribute('aria-label') || "";
                            const m = rText.match(/(\d+(?:\.\d+)?)/);
                            if (m) rating = parseFloat(m[1]);
                        }

                        // Лайки / Favorites
                        let favorites = null;
                        let favoritesRaw = null;
                        const favEl = card.querySelector('[data-testid*="favorite"], [class*="favorite"]');
                        if (favEl) {
                            const fText = favEl.innerText.trim();
                            if (fText) {
                                favoritesRaw = fText;
                                const fn = parseInt(fText.replace(/[^\d]/g, ''), 10);
                                if (!isNaN(fn)) favorites = fn;
                            }
                        }

                        result.push({
                            url: cleanUrl,
                            title,
                            image,
                            author,
                            rating,
                            favorites,
                            favoritesRaw
                        });
                    }
                });
                return result;
            });
            
            cardsOnPage.forEach(item => {
                collectedLinks.add(item.url);
                try {
                    const parts = item.url.split('/').filter(Boolean);
                    const slug = parts[parts.length - 1];
                    if (slug && !itemsMap[slug]) {
                        // Очищаем URL картинки до HD качества
                        let cleanImage = item.image || "";
                        if (cleanImage.includes('cdn.creativefabrica.com')) {
                            cleanImage = cleanImage
                                .replace(/-\d+x\d+(?=\.(jpg|jpeg|png|webp))/gi, '')
                                .replace(/-1-1(?=\.(jpg|jpeg|png|webp))/gi, '-1');
                        }
                        
                        const fallbackTitle = slug.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
                        itemsMap[slug] = {
                            ...item,
                            slug,
                            title: item.title || fallbackTitle,
                            image: cleanImage
                        };
                    }
                } catch {}
            });
            
            console.log(`   ✅ Собрано: ${collectedLinks.size}/${limitForThisSource}`);
            
            if (collectedLinks.size >= limitForThisSource) break;

            if (collectedLinks.size === lastCount) {
                noNewItemsCount++;
                // 15 ПОПЫТОК СКРОЛЛА
                if (noNewItemsCount >= 15) {
                    console.log(`   ⚠️ Больше нет новых товаров после 15 скроллов (конец списка).`);
                    break;
                }
            } else {
                noNewItemsCount = 0; // сброс
            }
            lastCount = collectedLinks.size;

            if (isSearch) {
                console.log(`   ⬇️ Скроллим вниз (поиск) - попытка ${noNewItemsCount}/15...`);
                await page.evaluate(() => {
                    window.scrollTo(0, document.body.scrollHeight);
                    setTimeout(() => window.scrollBy(0, -500), 500); // чуть отскочить наверх для триггера lazy load
                });
                await page.waitForTimeout(3000);
                await closePopups(page);
            } else {
                currentPageNum++;
                let nextUrl = currentUrl;
                if (nextUrl.endsWith('/')) nextUrl = nextUrl.slice(0, -1);
                
                nextUrl = nextUrl.replace(/\/page\/\d+/, '');
                nextUrl = `${nextUrl}/page/${currentPageNum}/`;
                
                console.log(`   ➡️ Переход на страницу ${currentPageNum}: ${nextUrl}`);
                try {
                    const response = await page.goto(nextUrl, { waitUntil: "domcontentloaded", timeout: 30000 });
                    if (response && response.status() === 404) {
                        console.log(`   🛑 Страница 404. Больше товаров нет.`);
                        break;
                    }
                    await page.waitForTimeout(2000);
                    await closePopups(page);
                } catch (e) {
                    console.log(`   ❌ Ошибка перехода на след. страницу.`);
                    break;
                }
            }
        }
        
        const arrayFromSet = Array.from(collectedLinks).slice(0, limitForThisSource);
        allCollectedArrays.push(arrayFromSet);

        // Сохраняем привязку каждого товара к запросу и комментарию менеджера
        let sourceQuery = '';
        try {
            const u = new URL(currentUrl);
            sourceQuery = u.searchParams.get('query') || '';
            if (!sourceQuery) {
                const parts = u.pathname.split('/').filter(Boolean);
                sourceQuery = parts[parts.length - 1] || '';
            }
        } catch {
            sourceQuery = currentUrl;
        }

        arrayFromSet.forEach(link => {
            try {
                const parts = link.split('/').filter(Boolean);
                const slug = parts[parts.length - 1];
                if (slug) {
                    const srcInfo = {
                        sourceUrl: currentUrl,
                        sourceQuery,
                        sourceComment: sourceComment || '',
                        scrapedAt: new Date().toISOString()
                    };
                    sourcesMap[slug] = srcInfo;
                    if (itemsMap[slug]) {
                        itemsMap[slug].sourceUrl = currentUrl;
                        itemsMap[slug].sourceQuery = sourceQuery;
                        itemsMap[slug].sourceComment = sourceComment || '';
                        itemsMap[slug].scrapedAt = srcInfo.scrapedAt;
                    }
                }
            } catch {}
        });
    }
    
    await page.close();
    
    const mixedLinks = interleaveArrays(allCollectedArrays);
    mixedLinks.sourcesMap = sourcesMap;
    mixedLinks.itemsMap = itemsMap;
    return mixedLinks;
}
