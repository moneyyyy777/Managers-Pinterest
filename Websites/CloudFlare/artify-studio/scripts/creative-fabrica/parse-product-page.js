// scripts/creative-fabrica/parse-product-page.js
import { SELECTORS } from "./selectors.js";
import { text, attr, texts } from "./helpers/dom.js";

export async function parseProductPage(page, slug) {
    try {
        await page.waitForSelector(SELECTORS.title, { timeout: 5000 });
        
        // Скроллим страницу вниз, чтобы триггернуть "ленивую загрузку" галереи
        await page.evaluate(() => window.scrollBy(0, 600));
        await page.waitForTimeout(2500); 
    } catch {
        console.log(`[WARN] Заголовок не найден или страница долго грузилась для ${slug}`);
    }

    const title = await text(page, SELECTORS.title);
    const canonical = await attr(page, SELECTORS.canonical, "href");
    const image = await attr(page, SELECTORS.image, "content");
    const ogTitle = await attr(page, SELECTORS.ogTitle, "content");
    const seoDescription = await attr(page, SELECTORS.description, "content");

    // 1. ДАТА ВЫКЛАДКИ
    const bodyText = await page.textContent('body');
    const dateMatch = bodyText.match(/Listed on\s+([A-Za-z]+\s+\d{1,2},\s+\d{4})/i);
    const lastUpdated = dateMatch ? `Listed on ${dateMatch[1]}` : "";

    // 2. АВТОР
    let author = "";
    if (ogTitle) {
        const match = ogTitle.match(/by\s+(.*?)\s+·/i);
        if (match && match[1]) author = match[1].trim();
    }
    if (!author) {
        const rawAuthor = await text(page, SELECTORS.author);
        author = rawAuthor.replace(/<[^>]*>?/gm, '').trim();
    }

    // 3. ПОЛНОЕ ОПИСАНИЕ
    const fullDescription = await page.evaluate(() => {
        const descEl = document.querySelector('.product-description, [class*="description"], .specimen-text');
        if (descEl && descEl.innerText.trim().length > 20) {
            return descEl.innerText.trim();
        }
        const mainParagraphs = Array.from(document.querySelectorAll('main p, article p, div[class*="product"] p'));
        const cleanTexts = mainParagraphs
            .map(p => p.innerText.trim())
            .filter(t => t.length > 30 && !t.includes('Creative Fabrica') && !t.includes('subscription') && !t.includes('download'));
            
        return cleanTexts.join('\n\n');
    });

    // 4. ГАЛЕРЕЯ (Двойная железная защита: по ID и по 3 первым словам слага)
    
    // Формируем "подпись" из слага (берем первые 3 слова)
    // Например: "book-clipart-png-free" -> "book-clipart-png"
    const slugWords = slug.split('-').filter(Boolean);
    const signature = slugWords.slice(0, 3).join('-').toLowerCase();

    // Достаем ID товара (если он есть)
    let productId = "";
    const idMatch = image.match(/(\d{6,10})/);
    if (idMatch) productId = idMatch[1];

    const rawGallery = await page.evaluate(() => {
        const slider = document.querySelector('.product-gallery, .product-slider, .swiper-wrapper, #product-gallery, [data-testid="product-gallery"]');
        const container = slider || document.querySelector('main') || document.body;
        const imgs = Array.from(container.querySelectorAll('img'));
        return imgs.map(img => img.getAttribute('data-src') || img.getAttribute('src') || img.src).filter(Boolean);
    });

    const gallery = [];
    const seenUrls = new Set();

    for (let src of rawGallery) {
        if (!src.includes('cdn.creativefabrica.com')) continue;
        
        const lowerSrc = src.toLowerCase();

        // 🔥 ЖЕСТКАЯ ПРИВЯЗКА К ТОВАРУ:
        // Картинка ДОЛЖНА содержать либо ID товара, либо первые 3 слова из названия!
        const hasSignature = lowerSrc.includes(signature);
        const hasProductId = productId && src.includes(productId);

        if (!hasSignature && !hasProductId) {
            // Если в ссылке нет ни "book-clipart-png", ни правильного ID — это 100% чужая картинка!
            continue;
        }

        // Отсекаем мусор и служебные превью
        if (/waterfall|glyphs|numbers|punctuation|_text_|avatar|logo|get-all-access|preview|\/assets\/|_200x200/i.test(src)) continue;

        // Делаем HD качество
        let hdUrl = src
            .replace(/-\d+x\d+(?=\.(jpg|jpeg|png|webp))/gi, '')
            .replace(/-1-1(?=\.(jpg|jpeg|png|webp))/gi, '-1');

        if (!seenUrls.has(hdUrl)) {
            seenUrls.add(hdUrl);
            gallery.push(hdUrl);
        }
    }

    // 5. ХЛЕБНЫЕ КРОШКИ
    let breadcrumbs = await texts(page, SELECTORS.breadcrumbs);
    if (breadcrumbs.length > 5) breadcrumbs = breadcrumbs.slice(0, 5);

    // 6. РЕЙТИНГ И ОТЗЫВЫ (для фильтрации некачественных товаров)
    const reviewData = await page.evaluate(() => {
        const reviewEl = document.querySelector('.bar-review, [class*="bar-review"]');
        if (reviewEl) {
            const text = reviewEl.innerText || '';
            const scoreMatch = text.match(/Score of\s+([0-9.]+)/i);
            const reviewsCountMatch = text.match(/based on\s+(\d+)\s+review/i);
            return {
                rating: scoreMatch ? parseFloat(scoreMatch[1]) : null,
                reviewsCount: reviewsCountMatch ? parseInt(reviewsCountMatch[1], 10) : 0
            };
        }
        return {
            rating: null,
            reviewsCount: 0
        };
    });

    // 7. ИЗБРАННОЕ / ЛАЙКИ (Added to favorites)
    const favoriteData = await page.evaluate(() => {
        const favCountEl = document.querySelector('#favorite-count, .favorite-count-text [id*="favorite"], .favorite-count');
        const favTextEl = document.querySelector('.favorite-count-text, [class*="favorite-count"]');
        
        let raw = favCountEl ? favCountEl.innerText.trim() : '';
        if (!raw && favTextEl) {
            const m = (favTextEl.innerText || '').match(/(\d+(?:\.\d+)?[kK]?X?)\s*Added to favorites/i);
            if (m) raw = m[1];
        }
        if (!raw) {
            const bodyMatch = (document.body.innerText || '').match(/(\d+(?:\.\d+)?[kK]?X?)\s*Added to favorites/i);
            if (bodyMatch) raw = bodyMatch[1];
        }

        let count = null;
        if (raw) {
            let clean = raw.replace(/X$/i, '').trim();
            if (/k$/i.test(clean)) {
                count = Math.round(parseFloat(clean) * 1000);
            } else {
                const parsed = parseInt(clean, 10);
                count = isNaN(parsed) ? null : parsed;
            }
        }

        return {
            favoritesRaw: raw || null,
            favorites: count
        };
    });

    // 8. ТЕГИ ДИЗАЙНЕРА (Designer tags)
    const designerTagData = await page.evaluate(() => {
        const tags = [];
        const links = [];
        const seen = new Set();

        const tagHeadings = Array.from(document.querySelectorAll('h3, h4, h5, div, span'))
            .filter(el => /designer\s*tags/i.test(el.innerText || ''));
        
        let tagElements = [];
        if (tagHeadings.length > 0) {
            const box = tagHeadings[0].closest('.c-product-box--product-detail-box') 
                || tagHeadings[0].parentElement?.parentElement;
            if (box) {
                tagElements = Array.from(box.querySelectorAll('a[href*="/tag/"], .c-tags a'));
            }
        }

        if (tagElements.length === 0) {
            tagElements = Array.from(document.querySelectorAll('.c-tags a, a[href*="creativefabrica.com/tag/"]'));
        }

        for (const el of tagElements) {
            const name = (el.innerText || '').trim();
            const href = el.href || el.getAttribute('href') || '';
            if (name && !seen.has(name) && (href.includes('/tag/') || el.closest('.c-tags'))) {
                seen.add(name);
                tags.push(name);
                links.push({ name, url: href });
            }
        }

        return { tags, links };
    });

    return {
        slug,
        title,
        author,
        canonical,
        description: seoDescription,
        fullDescription, 
        image,           
        gallery,         
        breadcrumbs,
        ogTitle,
        rating: reviewData.rating,
        reviewsCount: reviewData.reviewsCount,
        favorites: favoriteData.favorites,
        favoritesRaw: favoriteData.favoritesRaw,
        designerTags: designerTagData.tags,
        designerTagLinks: designerTagData.links,
        categories: [],
        tags: designerTagData.tags,
        license: "Commercial licence included",
        lastUpdated,
        fileTypes: []
    };
}