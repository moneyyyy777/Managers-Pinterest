// extension/content/content.js

(function () {
    console.log("[Artify Clipper] Content script loaded on Creative Fabrica");

    // Local configuration & state
    let config = {
        apiUrl: "http://localhost:3333",
        selectedCategory: "",
        selectedCollection: "",
        mode: "full",
        position: "top"
    };

    let collectionStatus = {
        slugs: new Set(),
        deletedSlugs: new Set(),
        draftSlugs: new Set(),
        count: 0
    };

    let selectedProducts = new Map(); // key: url, value: productData
    let manuallyUncheckedUrls = new Set(); // remember items explicitly unchecked by user in this session
    let collectionsBasket = {}; // key: "category/collection" -> array of product objects
    let selectionHistory = []; // array of snapshots of selectedProducts
    let historyIndex = -1;
    let isFloatingMinimized = false;
    let observer = null;
    let scanTimeout = null;

    function transliterate(str) {
        const ru = {
            'а': 'a', 'б': 'b', 'в': 'v', 'г': 'g', 'д': 'd', 'е': 'e', 'ё': 'yo', 'ж': 'zh',
            'з': 'z', 'и': 'i', 'й': 'y', 'к': 'k', 'л': 'l', 'м': 'm', 'н': 'n', 'о': 'o',
            'п': 'p', 'р': 'r', 'с': 's', 'т': 't', 'у': 'u', 'ф': 'f', 'х': 'h', 'ц': 'ts',
            'ч': 'ch', 'ш': 'sh', 'щ': 'sch', 'ъ': '', 'ы': 'y', 'ь': '', 'э': 'e', 'ю': 'yu', 'я': 'ya'
        };
        return str.split('').map(char => {
            const lower = char.toLowerCase();
            return ru[lower] !== undefined ? ru[lower] : char;
        }).join('');
    }

    function generateCollectionSlug(title, category = "") {
        if (!title) return "";
        let clean = transliterate(title.trim().toLowerCase());
        clean = clean.replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
        if (!clean) return "";

        const tokens = clean.split("-").filter(Boolean);
        const catWords = new Set();
        
        if (category) {
            const catNorm = category.toLowerCase().trim();
            catWords.add(catNorm);
            if (catNorm.endsWith("s")) catWords.add(catNorm.slice(0, -1));
            if (catNorm.endsWith("es")) catWords.add(catNorm.slice(0, -2));
            if (catNorm.includes("clipart")) { catWords.add("clipart"); catWords.add("cliparts"); }
            if (catNorm.includes("font")) { catWords.add("font"); catWords.add("fonts"); }
            if (catNorm.includes("sticker")) { catWords.add("sticker"); catWords.add("stickers"); }
            if (catNorm.includes("brush")) { catWords.add("brush"); catWords.add("brushes"); }
            if (catNorm.includes("planner")) { catWords.add("planner"); catWords.add("planners"); }
            if (catNorm.includes("page")) { catWords.add("page"); catWords.add("pages"); }
            if (catNorm.includes("pattern")) { catWords.add("pattern"); catWords.add("patterns"); }
        }

        const filtered = tokens.filter(t => !catWords.has(t));
        if (filtered.length > 0) {
            return filtered.join("-");
        }
        return tokens.join("-");
    }

    function isCloudflareChallengePage() {
        const title = (document.title || "").toLowerCase();
        if (title.includes("один момент") || title.includes("just a moment") || title.includes("security check")) {
            return true;
        }
        const h1 = document.querySelector("h1");
        if (h1 && (h1.innerText.includes("www.creativefabrica.com") || h1.innerText.includes("Creative Fabrica"))) {
            const bodyText = document.body ? document.body.innerText : "";
            if (bodyText.includes("Выполнение проверки безопасности") || 
                bodyText.includes("Checking your browser") || 
                bodyText.includes("Подтвердите, что вы человек") || 
                bodyText.includes("Verify you are human")) {
                return true;
            }
        }
        if (document.querySelector('#cf-chl-widget-container, iframe[src*="cloudflare"], iframe[src*="turnstile"]')) {
            return true;
        }
        return false;
    }

    function dismissAllAccessModal() {
        try {
            const dialog = document.querySelector('#payments-dialog, [role="dialog"]');
            if (dialog) {
                const text = dialog.innerText || "";
                if (text.includes("Try All Access") || text.includes("All Access") || text.includes("Unlock all")) {
                    const closeBtn = dialog.querySelector('button img[src*="x-close"]')?.closest('button') 
                        || dialog.querySelector('button[aria-label*="close" i], button[aria-label*="закрыть" i]')
                        || dialog.querySelector('button.absolute, button.close');
                    if (closeBtn) {
                        closeBtn.click();
                    }
                }
            }
        } catch (e) {}
    }

    function getBasketKey() {
        if (!config.selectedCategory || !config.selectedCollection) return null;
        return `${config.selectedCategory}/${config.selectedCollection}`;
    }

    function pushSelectionHistory() {
        if (historyIndex < selectionHistory.length - 1) {
            selectionHistory = selectionHistory.slice(0, historyIndex + 1);
        }
        selectionHistory.push(Array.from(selectedProducts.values()).map(p => ({ ...p })));
        if (selectionHistory.length > 25) selectionHistory.shift();
        historyIndex = selectionHistory.length - 1;
        updateUndoRedoUI();
    }

    function updateUndoRedoUI() {
        const undoBtn = document.getElementById("artifyUndoFloatBtn");
        const redoBtn = document.getElementById("artifyRedoFloatBtn");
        if (undoBtn) undoBtn.disabled = historyIndex <= 0;
        if (redoBtn) redoBtn.disabled = historyIndex >= selectionHistory.length - 1;
    }

    function undoSelection() {
        if (historyIndex > 0) {
            historyIndex--;
            restoreFromHistory(selectionHistory[historyIndex]);
            showToast("↩️ Действие отменено");
        }
    }

    function redoSelection() {
        if (historyIndex < selectionHistory.length - 1) {
            historyIndex++;
            restoreFromHistory(selectionHistory[historyIndex]);
            showToast("↪️ Действие возвращено");
        }
    }

    function restoreFromHistory(snapshot) {
        selectedProducts.clear();
        const urls = new Set();
        (snapshot || []).forEach(p => {
            if (p && p.url) {
                selectedProducts.set(p.url, p);
                urls.add(p.url);
            }
        });

        document.querySelectorAll(".artify-card-overlay").forEach(overlay => {
            const u = overlay.dataset.url;
            const cb = overlay.querySelector(".artify-card-checkbox");
            if (cb && u) {
                cb.checked = urls.has(u);
            }
        });

        syncSelectedToStorage();
    }

    function syncSelectedToStorage() {
        const list = Array.from(selectedProducts.values());
        const key = getBasketKey();
        if (key) {
            collectionsBasket[key] = list;
        }
        chrome.storage.local.set({
            selectedProducts: list,
            collectionsBasket
        });
        updateFloatingBarUI();
        renderSelectedFloatList();
        updateUndoRedoUI();
    }

    async function switchCollection(newCat, newCol) {
        // 1. Сохраняем текущую корзину для предыдущей подборки
        const oldKey = getBasketKey();
        if (oldKey) {
            collectionsBasket[oldKey] = Array.from(selectedProducts.values());
        }

        config.selectedCategory = newCat;
        config.selectedCollection = newCol;

        // 2. Загружаем изолированную корзину для новой подборки!
        const newKey = getBasketKey();
        selectedProducts.clear();
        manuallyUncheckedUrls.clear();

        if (newKey && Array.isArray(collectionsBasket[newKey])) {
            collectionsBasket[newKey].forEach(item => {
                if (item && item.url) selectedProducts.set(item.url, item);
            });
        }

        // 3. Синхронизируем галочки на странице
        const activeUrls = new Set(selectedProducts.keys());
        document.querySelectorAll(".artify-card-overlay").forEach(overlay => {
            const u = overlay.dataset.url;
            const cb = overlay.querySelector(".artify-card-checkbox");
            if (cb && u) {
                cb.checked = activeUrls.has(u);
            }
        });

        selectionHistory = [ Array.from(selectedProducts.values()) ];
        historyIndex = 0;

        await saveFloatConfig();
        await updateCollectionStatus();
        updateFloatingBarUI();
        renderSelectedFloatList();
        updateUndoRedoUI();
    }

    function selectAllVisibleCards() {
        const overlays = document.querySelectorAll('.artify-card-overlay');
        let newlyAdded = 0;

        overlays.forEach(overlay => {
            const slug = overlay.dataset.slug;
            const url = overlay.dataset.url;
            const card = overlay.parentElement;
            if (!slug || !url || !card) return;

            // Пропускаем те, что уже есть в подборке на сайте
            if (collectionStatus.slugs.has(slug)) return;
            // Пропускаем те, что в корзине
            if (collectionStatus.deletedSlugs.has(slug)) return;
            // ВАЖНО: Пропускаем товары, с которых менеджер вручную снял галочку!
            if (manuallyUncheckedUrls.has(url)) return;

            const cb = overlay.querySelector('.artify-card-checkbox');
            if (cb && !cb.checked) {
                cb.checked = true;
                const productData = extractDataFromCard(card, url, slug);
                selectedProducts.set(url, productData);
                newlyAdded++;
            }
        });

        syncSelectedToStorage();
        pushSelectionHistory();
        showToast(`☑️ Отмечено товаров: ${selectedProducts.size}`);
        return selectedProducts.size;
    }

    function clearAllSelectedCards() {
        selectedProducts.clear();
        manuallyUncheckedUrls.clear();
        document.querySelectorAll('.artify-card-checkbox').forEach(cb => cb.checked = false);
        syncSelectedToStorage();
        pushSelectionHistory();
        showToast("Все галочки сняты");
    }

    // Toast helper
    function showToast(message, isError = false, duration = 3000) {
        let toast = document.querySelector(".artify-toast");
        if (toast) toast.remove();

        toast = document.createElement("div");
        toast.className = `artify-toast artify-clipper-root ${isError ? "artify-toast-error" : ""}`;
        toast.innerHTML = `<span>${isError ? "⚠️" : "✨"}</span> <span>${message}</span>`;
        document.body.appendChild(toast);

        setTimeout(() => {
            if (toast && toast.parentNode) {
                toast.style.transition = "opacity 0.3s, transform 0.3s";
                toast.style.opacity = "0";
                toast.style.transform = "translate(-50%, 15px)";
                setTimeout(() => toast.remove(), 300);
            }
        }, duration);
    }

    // Slug helper
    function getSlugFromUrl(url) {
        if (!url) return "";
        try {
            const clean = url.split("?")[0].split("#")[0].replace(/\/+$/, "");
            const parts = clean.split("/product/");
            if (parts.length > 1) {
                return parts[1].split("/")[0].toLowerCase().trim();
            }
            const segs = clean.split("/").filter(Boolean);
            return segs[segs.length - 1].toLowerCase().trim();
        } catch {
            return "";
        }
    }

    // Clean HD Image URL from Creative Fabrica CDN
    function getHdImageUrl(src) {
        if (!src) return "";
        if (src.includes("cdn.creativefabrica.com")) {
            return src
                .replace(/-\d+x\d+(?=\.(jpg|jpeg|png|webp))/gi, "")
                .replace(/-1-1(?=\.(jpg|jpeg|png|webp))/gi, "-1");
        }
        return src;
    }

    // 1. Load config from chrome.storage
    async function loadConfig() {
        try {
            const stored = await chrome.storage.local.get([
                "apiUrl",
                "selectedCategory",
                "selectedCollection",
                "mode",
                "position",
                "selectedProducts",
                "collectionsBasket"
            ]);
            if (stored.apiUrl) config.apiUrl = stored.apiUrl;
            if (stored.selectedCategory) config.selectedCategory = stored.selectedCategory;
            if (stored.selectedCollection) config.selectedCollection = stored.selectedCollection;
            config.mode = "full";
            if (stored.position) config.position = stored.position;

            if (stored.collectionsBasket && typeof stored.collectionsBasket === "object") {
                collectionsBasket = stored.collectionsBasket;
            }

            const key = getBasketKey();
            selectedProducts.clear();
            if (key && Array.isArray(collectionsBasket[key])) {
                collectionsBasket[key].forEach(item => {
                    if (item && item.url) selectedProducts.set(item.url, item);
                });
            } else if (Array.isArray(stored.selectedProducts)) {
                stored.selectedProducts.forEach(item => {
                    if (item && item.url) selectedProducts.set(item.url, item);
                });
            }

            selectionHistory = [ Array.from(selectedProducts.values()) ];
            historyIndex = 0;

            updateFloatingBarUI();
            updateCollectionStatus().catch(() => {});
        } catch (e) {
            console.error("[Artify Clipper] Error loading config:", e);
        }
    }

    // 2. Fetch existing & deleted products for current collection
    async function updateCollectionStatus() {
        if (!config.selectedCategory || !config.selectedCollection) {
            collectionStatus.slugs.clear();
            collectionStatus.deletedSlugs.clear();
            collectionStatus.draftSlugs.clear();
            collectionStatus.count = 0;
            updateFloatingBarUI();
            updateAllCardBadges();
            return;
        }

        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 3500);
            const res = await fetch(
                `${config.apiUrl}/api/extension/status?category=${config.selectedCategory}&collection=${config.selectedCollection}`,
                { signal: controller.signal }
            );
            clearTimeout(timeoutId);
            if (res.ok) {
                const data = await res.json();
                collectionStatus.slugs = new Set(data.slugs || []);
                collectionStatus.deletedSlugs = new Set(data.deletedSlugs || []);
                collectionStatus.draftSlugs = new Set(data.draftSlugs || []);
                collectionStatus.count = data.count || 0;

                // Sync badge in background
                chrome.runtime.sendMessage({
                    type: "UPDATE_BADGE",
                    count: collectionStatus.count
                }).catch(() => {});

                updateFloatingBarUI();
                updateAllCardBadges();
            }
        } catch (e) {
            console.warn("[Artify Clipper] Server status fetch failed (is admin running?):", e.message);
        }
    }

    // 3. Scan & Inject Overlays on Product Cards
    function scanAndInjectCards() {
        // Find product links or cards on catalog/search pages
        // Selectors covering modern Creative Fabrica layouts
        const productLinks = document.querySelectorAll('a[href*="/product/"]');
        
        productLinks.forEach(link => {
            const href = link.href;
            if (!href || !href.includes("/product/")) return;

            // Find best card container
            let card = link.closest('article, [data-testid="product-card"], .product-card, .c-product-card, div[class*="ProductCard"], div[class*="product-card"]');
            
            // Fallback: if no standard card wrapper found, walk up 2-4 parents looking for a block with an img
            if (!card) {
                let parent = link.parentElement;
                let depth = 0;
                while (parent && depth < 4) {
                    if (parent.querySelector("img") && parent.offsetWidth > 140) {
                        card = parent;
                        break;
                    }
                    parent = parent.parentElement;
                    depth++;
                }
            }

            if (!card) return;

            // Avoid injecting multiple times
            if (card.dataset.artifyInjected === "true") return;
            card.dataset.artifyInjected = "true";

            // Make card position relative so absolute overlay stays inside
            const pos = window.getComputedStyle(card).position;
            if (pos === "static" || !pos) {
                card.style.position = "relative";
            }

            const slug = getSlugFromUrl(href);
            if (!slug) return;

            injectOverlayIntoCard(card, href, slug);
        });
    }

    function injectOverlayIntoCard(card, productUrl, slug) {
        const overlay = document.createElement("div");
        overlay.className = "artify-card-overlay artify-clipper-root";
        overlay.dataset.slug = slug;
        overlay.dataset.url = productUrl;

        // Checkbox container
        const cbWrap = document.createElement("label");
        cbWrap.className = "artify-checkbox-wrap";
        cbWrap.title = "Выбрать для пакетного добавления";
        cbWrap.onclick = (e) => e.stopPropagation();

        const cb = document.createElement("input");
        cb.type = "checkbox";
        cb.className = "artify-card-checkbox";
        cb.checked = selectedProducts.has(productUrl);
        cb.addEventListener("change", (e) => {
            e.stopPropagation();
            if (cb.checked) {
                const productData = extractDataFromCard(card, productUrl, slug);
                selectedProducts.set(productUrl, productData);
                manuallyUncheckedUrls.delete(productUrl);
            } else {
                selectedProducts.delete(productUrl);
                manuallyUncheckedUrls.add(productUrl);
            }
            syncSelectedToStorage();
            pushSelectionHistory();
        });
        cbWrap.appendChild(cb);

        // Action button
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "artify-card-btn";
        btn.dataset.slug = slug;
        
        applyCardButtonState(btn, slug);

        btn.addEventListener("click", async (e) => {
            e.preventDefault();
            e.stopPropagation();

            if (btn.classList.contains("artify-loading") || btn.disabled) return;

            if (!config.selectedCategory || !config.selectedCollection) {
                showToast("Сначала откройте расширение и выберите категорию!", true);
                return;
            }

            // Extract card data
            let productData = extractDataFromCard(card, productUrl, slug);
            
            btn.disabled = true;
            btn.classList.add("artify-loading");
            btn.innerHTML = `<span>⏳</span><span>Галерея...</span>`;

            try {
                // Всегда парсим полную информацию (галерея, описание, теги)
                productData = await fetchFullProductData(productUrl, productData);
                btn.innerHTML = `<span>⏳</span><span>Сохранение...</span>`;

                const res = await fetch(`${config.apiUrl}/api/extension/add-product`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        category: config.selectedCategory,
                        collection: config.selectedCollection,
                        product: productData,
                        mode: "full",
                        position: config.position
                    })
                });

                const data = await res.json();

                if (res.ok && data.success) {
                    collectionStatus.slugs.add(slug);
                    collectionStatus.deletedSlugs.delete(slug);
                    if (data.isDraft) collectionStatus.draftSlugs.add(slug);
                    collectionStatus.count = data.totalCount || (collectionStatus.count + 1);

                    applyCardButtonState(btn, slug);
                    showToast(`✅ Товар "${data.title || slug}" добавлен в подборку!`);
                    updateFloatingBarUI();
                } else {
                    applyCardButtonState(btn, slug);
                    showToast(data.error || "Ошибка сохранения", true);
                }
            } catch (err) {
                applyCardButtonState(btn, slug);
                showToast("Сервер недоступен (" + config.apiUrl + ")", true);
            } finally {
                btn.disabled = false;
                btn.classList.remove("artify-loading");
            }
        });

        const leftWrap = document.createElement("div");
        leftWrap.style.cssText = "display: flex !important; align-items: center !important; gap: 6px !important;";
        leftWrap.appendChild(cbWrap);

        // Бейдж популярности карточки (❤️ лайки и ⭐ отзывы)
        const meta = extractCardMeta(card);
        if (meta.favorites || meta.rating) {
            const metaBadge = document.createElement("div");
            metaBadge.className = "artify-card-meta-badge artify-clipper-root";
            let pillsHtml = "";
            if (meta.favorites) {
                pillsHtml += `<span class="artify-meta-pill artify-likes" title="Избранное: ${meta.favorites}">❤️ ${formatNumberShort(meta.favorites)}</span>`;
            }
            if (meta.rating) {
                const countStr = meta.reviewsCount ? ` (${meta.reviewsCount})` : "";
                pillsHtml += `<span class="artify-meta-pill artify-rating" title="Рейтинг: ${meta.rating}${countStr}">⭐ ${meta.rating}${countStr}</span>`;
            }
            metaBadge.innerHTML = pillsHtml;
            leftWrap.appendChild(metaBadge);
        }

        overlay.appendChild(leftWrap);
        overlay.appendChild(btn);

        // Append overlay to card
        card.appendChild(overlay);
    }

    function formatNumberShort(num) {
        if (!num || isNaN(num)) return "0";
        if (num >= 1000) {
            return (num / 1000).toFixed(1).replace(/\.0$/, "") + "k";
        }
        return String(num);
    }

    function extractCardMeta(card) {
        let favorites = null;
        let rating = null;
        let reviewsCount = 0;

        // 1. Favorites / Likes (Если отображаются на карточке)
        const favEl = card.querySelector(
            '#favorite-count, [data-testid*="favorite"], [data-testid*="like"], [class*="favorite"], [class*="likes"], [class*="Heart"], button[aria-label*="favorite" i], button[aria-label*="like" i]'
        );
        if (favEl) {
            const text = favEl.innerText || favEl.getAttribute("aria-label") || "";
            const m = text.match(/([\d\.,]+)\s*([kKмМ])?/);
            if (m) {
                let num = parseFloat(m[1].replace(",", "."));
                if (m[2] && (m[2].toLowerCase() === "k" || m[2].toLowerCase() === "к")) {
                    num = Math.round(num * 1000);
                }
                if (!isNaN(num) && num > 0) favorites = num;
            }
        }

        // 2. Rating & Reviews
        // На Creative Fabrica в поиске рейтинг часто выводится как SVG звезда + "1 | Free today...", или "★ 5.0 (3)"
        const ratingEl = card.querySelector(
            '[data-testid*="rating"], [class*="rating" i], [class*="star" i], [aria-label*="rating" i], [aria-label*="stars" i]'
        );
        let foundRatingText = ratingEl ? (ratingEl.innerText || ratingEl.getAttribute("aria-label") || "") : "";

        // Также ищем внутри родителя SVG звезды
        if (!foundRatingText) {
            const starSvg = card.querySelector('svg[class*="star" i], svg path[d*="12 2l3.09 6.26"], svg path[d*="M12 "]')?.closest('svg');
            if (starSvg && starSvg.parentElement) {
                foundRatingText = starSvg.parentElement.innerText;
            }
        }

        // Fallback поиск по тексту всей карточки на совпадение "★ 1" или "⭐ 5" или "1 | Free today"
        if (!foundRatingText) {
            const cardText = card.innerText || "";
            const starMatch = cardText.match(/[★⭐]\s*(\d+(\.\d+)?)/) || cardText.match(/\b([1-5](?:\.\d+)?)\s*\|\s*Free/i);
            if (starMatch) {
                foundRatingText = starMatch[0];
            }
        }

        if (foundRatingText) {
            const m = foundRatingText.match(/(\d+(\.\d+)?)\s*\|/) || 
                      foundRatingText.match(/[★⭐]\s*(\d+(\.\d+)?)/) || 
                      foundRatingText.match(/\b([1-5](?:\.\d+)?)\b/);
            if (m) {
                const r = parseFloat(m[1]);
                if (r >= 1 && r <= 5) rating = r;
            }
            const rm = foundRatingText.match(/\((\d+)\)/) || foundRatingText.match(/(\d+)\s*(reviews|отзыв)/i);
            if (rm) {
                reviewsCount = parseInt(rm[1], 10);
            } else if (rating) {
                reviewsCount = 1;
            }
        }

        return { favorites, rating, reviewsCount };
    }

    function applyCardButtonState(btn, slug) {
        btn.className = "artify-card-btn";
        if (collectionStatus.slugs.has(slug)) {
            btn.classList.add("artify-exists");
            btn.innerHTML = `<span>✅</span> <span>В коллекции</span>`;
            btn.title = "Товар уже находится в этой подборке";
        } else if (collectionStatus.deletedSlugs.has(slug)) {
            btn.classList.add("artify-trashed");
            btn.innerHTML = `<span>🗑</span> <span>В корзине</span>`;
            btn.title = "Товар был удален в корзину (нажмите, чтобы вернуть)";
        } else {
            btn.innerHTML = `<span>➕</span> <span>В коллекцию</span>`;
            btn.title = `Добавить в "${config.selectedCollection || 'подборку'}"`;
        }
    }

    function updateAllCardBadges() {
        document.querySelectorAll(".artify-card-btn").forEach(btn => {
            const slug = btn.dataset.slug;
            if (slug) applyCardButtonState(btn, slug);
        });

        // Also check if on single product page
        updateProductPageBox();
    }

    // Extract product details directly from card DOM
    function extractDataFromCard(card, productUrl, slug) {
        // Image
        const imgEl = card.querySelector("img");
        let rawImg = "";
        if (imgEl) {
            rawImg = imgEl.currentSrc || imgEl.src || imgEl.dataset.src || imgEl.getAttribute("srcset")?.split(" ")[0] || "";
        }
        const cleanImage = getHdImageUrl(rawImg);

        // Title
        let title = "";
        if (imgEl && imgEl.alt && imgEl.alt.trim().length > 3) {
            title = imgEl.alt.trim();
        } else {
            const titleEl = card.querySelector('a[data-testid="product-card-title"], h2, h3, h4, [class*="title"], [class*="Title"]');
            if (titleEl) title = titleEl.innerText.trim();
        }
        if (!title) {
            title = slug.split("-").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
        }

        // Author
        let author = "";
        const authorEl = card.querySelector('a[href*="/designer/"], a[href*="/store/"], [class*="designer"], [class*="author"]');
        if (authorEl) {
            author = authorEl.innerText.trim();
        }

        // Rating & Favorites from metadata
        const meta = extractCardMeta(card);

        return {
            slug,
            url: productUrl,
            title,
            author,
            image: cleanImage,
            gallery: cleanImage ? [cleanImage] : [],
            rating: meta.rating,
            reviewsCount: meta.reviewsCount || (meta.rating ? 1 : 0),
            favorites: meta.favorites,
            designerTags: [],
            description: ""
        };
    }

    let categoriesDataCache = [];
    let isPopoverOpen = false;

    async function saveFloatConfig() {
        await chrome.storage.local.set({
            selectedCategory: config.selectedCategory,
            selectedCollection: config.selectedCollection,
            mode: config.mode,
            position: config.position
        });
        updateFloatingBarUI();
    }

    async function loadCategoriesForFloatingPopover() {
        try {
            const res = await fetch(`${config.apiUrl}/api/categories`);
            if (res.ok) {
                categoriesDataCache = await res.json();
                populateFloatCategories();
            }
        } catch (e) {
            console.warn("Failed to load categories in float popover:", e);
        }
    }

    function populateFloatCategories() {
        const catSelect = document.getElementById("artifyFloatCategorySelect");
        if (!catSelect) return;

        catSelect.innerHTML = '<option value="">-- Выберите категорию --</option>';
        categoriesDataCache.forEach(cat => {
            const catId = cat.id || cat.category;
            const opt = document.createElement("option");
            opt.value = catId;
            opt.innerText = `${cat.title || catId} (${cat.collections ? cat.collections.length : 0})`;
            if (catId === config.selectedCategory) {
                opt.selected = true;
            }
            catSelect.appendChild(opt);
        });

        populateFloatCollections();
    }

    function populateFloatCollections() {
        const colSelect = document.getElementById("artifyFloatCollectionSelect");
        if (!colSelect) return;

        const cat = categoriesDataCache.find(c => (c.id || c.category) === config.selectedCategory);
        if (!cat || !Array.isArray(cat.collections) || cat.collections.length === 0) {
            colSelect.innerHTML = '<option value="">Нет подборок в категории</option>';
            colSelect.disabled = true;
            return;
        }

        colSelect.disabled = false;
        colSelect.innerHTML = '<option value="">-- Выберите подборку --</option>';

        cat.collections.forEach(col => {
            const colVal = col.slug || col.name || col.collection;
            const opt = document.createElement("option");
            opt.value = colVal;
            const countStr = col.count !== undefined ? ` (${col.count})` : '';
            opt.innerText = `${col.title || colVal}${countStr}`;
            if (colVal === config.selectedCollection) {
                opt.selected = true;
            }
            colSelect.appendChild(opt);
        });
    }

    async function toggleFloatingPopover(forceState) {
        const popover = document.getElementById("artifyFloatingPopover");
        if (!popover) return;

        isPopoverOpen = typeof forceState === "boolean" ? forceState : (popover.style.display === "none");
        popover.style.display = isPopoverOpen ? "block" : "none";

        if (isPopoverOpen) {
            toggleSelectedListPopover(false);
            await loadCategoriesForFloatingPopover();
        }
    }

    let isSelectedListOpen = false;

    function toggleSelectedListPopover(forceState) {
        const popover = document.getElementById("artifySelectedListPopover");
        if (!popover) return;

        isSelectedListOpen = typeof forceState === "boolean" ? forceState : (popover.style.display === "none");
        popover.style.display = isSelectedListOpen ? "block" : "none";

        if (isSelectedListOpen) {
            toggleFloatingPopover(false);
            renderSelectedFloatList();
            updateUndoRedoUI();
        }
    }

    function injectSelectedListPopover() {
        if (document.getElementById("artifySelectedListPopover")) return;

        const popover = document.createElement("div");
        popover.id = "artifySelectedListPopover";
        popover.className = "artify-floating-popover artify-clipper-root";
        popover.style.display = "none";
        popover.style.width = "320px";
        popover.style.maxHeight = "460px";

        popover.innerHTML = `
            <div class="artify-popover-header">
                <span class="artify-popover-title">
                    <span>👁️</span> <span>Выбрано:</span> <strong id="artifySelectedFloatHeaderCount" style="color: #34d399;">0</strong>
                </span>
                <button type="button" class="artify-popover-close" id="artifySelectedListClose" title="Закрыть">✕</button>
            </div>
            <div class="artify-selected-toolbar">
                <div class="artify-selected-history-btns">
                    <button type="button" class="artify-mini-btn" id="artifyUndoFloatBtn" title="Отменить последнее действие" disabled>↩️ Назад</button>
                    <button type="button" class="artify-mini-btn" id="artifyRedoFloatBtn" title="Вернуть отмененное действие" disabled>↪️ Вперед</button>
                </div>
                <button type="button" class="artify-mini-btn danger" id="artifyClearFloatBtn" title="Снять все галочки">🗑️ Сбросить всё</button>
            </div>
            <div id="artifySelectedFloatItemsContainer" class="artify-selected-items-list">
                <!-- Cards rendered dynamically -->
            </div>
            <div style="margin-top: 10px; padding-top: 8px; border-top: 1px solid #27272a;">
                <button type="button" class="artify-create-btn" id="artifySelectedFloatScrapeBtn" style="font-size: 12px; padding: 8px 12px;">
                    ⚡ Спарсить выбранные (<span id="artifySelectedFloatScrapeCount">0</span>)
                </button>
            </div>
        `;

        document.body.appendChild(popover);

        popover.querySelector("#artifySelectedListClose").addEventListener("click", () => toggleSelectedListPopover(false));
        popover.querySelector("#artifyUndoFloatBtn").addEventListener("click", () => undoSelection());
        popover.querySelector("#artifyRedoFloatBtn").addEventListener("click", () => redoSelection());
        popover.querySelector("#artifyClearFloatBtn").addEventListener("click", () => clearAllSelectedCards());
        popover.querySelector("#artifySelectedFloatScrapeBtn").addEventListener("click", () => {
            const batchBtn = document.getElementById("artifyBatchAddBtn");
            if (batchBtn && !batchBtn.disabled) {
                batchBtn.click();
            } else if (selectedProducts.size === 0) {
                showToast("Сначала отметьте галочками товары!", true);
            }
        });
    }

    function renderSelectedFloatList() {
        const container = document.getElementById("artifySelectedFloatItemsContainer");
        const headerCount = document.getElementById("artifySelectedFloatHeaderCount");
        const scrapeCount = document.getElementById("artifySelectedFloatScrapeCount");
        const viewSelectedCount = document.getElementById("artifyViewSelectedCount");

        const count = selectedProducts.size;
        if (headerCount) headerCount.innerText = count;
        if (scrapeCount) scrapeCount.innerText = count;
        if (viewSelectedCount) viewSelectedCount.innerText = count;

        const scrapeBtn = document.getElementById("artifySelectedFloatScrapeBtn");
        if (scrapeBtn) scrapeBtn.disabled = count === 0;

        if (!container) return;
        container.innerHTML = "";

        if (count === 0) {
            container.innerHTML = `
                <div class="artify-selected-empty">
                    Нет выбранных товаров.<br>Отмечайте галочки на карточках на странице!
                </div>
            `;
            return;
        }

        const items = Array.from(selectedProducts.values());
        items.forEach((item, idx) => {
            const card = document.createElement("div");
            card.className = "artify-selected-item-card";

            const thumbSrc = item.image || "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='32' height='32'><rect fill='%2327272a' width='32' height='32'/></svg>";

            card.innerHTML = `
                <span class="artify-selected-item-badge">#${idx + 1}</span>
                <img class="artify-selected-item-thumb" src="${thumbSrc}" alt="thumb" loading="lazy" />
                <div class="artify-selected-item-info">
                    <span class="artify-selected-item-title" title="${item.title || item.slug || ''}">${item.title || item.slug || 'Товар'}</span>
                    <span class="artify-selected-item-author">${item.author || item.slug || ''}</span>
                </div>
                <button type="button" class="artify-selected-item-remove" title="Убрать из выбранных">✕</button>
            `;

            const removeBtn = card.querySelector(".artify-selected-item-remove");
            removeBtn.addEventListener("click", () => {
                selectedProducts.delete(item.url);
                manuallyUncheckedUrls.add(item.url);

                document.querySelectorAll(".artify-card-overlay").forEach(overlay => {
                    if (overlay.dataset.url === item.url) {
                        const cb = overlay.querySelector(".artify-card-checkbox");
                        if (cb) cb.checked = false;
                    }
                });

                syncSelectedToStorage();
                pushSelectionHistory();
                showToast(`Убран: ${item.slug || 'товар'}`);
            });

            container.appendChild(card);
        });
    }

    function injectFloatingPopover() {
        if (document.getElementById("artifyFloatingPopover")) return;

        const popover = document.createElement("div");
        popover.id = "artifyFloatingPopover";
        popover.className = "artify-floating-popover artify-clipper-root";
        popover.style.display = "none";

        popover.innerHTML = `
            <div class="artify-popover-header">
                <span class="artify-popover-title">🎨 Подборка Artify Studio</span>
                <button type="button" class="artify-popover-close" id="artifyPopoverClose" title="Закрыть">✕</button>
            </div>
            <div class="artify-popover-body">
                <label class="artify-popover-label">Категория:</label>
                <select id="artifyFloatCategorySelect" class="artify-popover-select">
                    <option value="">Загрузка категорий...</option>
                </select>

                <label class="artify-popover-label">Подборка:</label>
                <select id="artifyFloatCollectionSelect" class="artify-popover-select">
                    <option value="">Сначала выберите категорию</option>
                </select>

                <button type="button" id="artifyFloatToggleCreateCol" class="artify-link-btn" style="margin-top: 2px;">➕ Создать новую подборку</button>

                <div id="artifyFloatCreateColBox" class="artify-create-col-box" style="display: none;">
                    <input type="text" id="artifyFloatNewTitleInput" class="artify-create-input" placeholder="Название: например, Cute Kawaii Cliparts">
                    <div class="artify-slug-preview-row">
                        <span class="artify-slug-prefix" id="artifyFloatSlugPrefix">slug: /.../</span>
                        <input type="text" id="artifyFloatNewSlugInput" class="artify-create-input slug" placeholder="cute-kawaii">
                    </div>
                    <button type="button" id="artifyFloatSubmitCreateCol" class="artify-create-btn">✨ Создать и выбрать</button>
                </div>

                <div id="artifyFloatUniversalSection" style="margin-top: 8px;">
                    <button type="button" id="artifyFloatUniversalHydrateBtn" class="artify-create-btn" style="background: linear-gradient(135deg, #6366f1, #8b5cf6); font-size: 11px; padding: 7px 10px; width: 100%; box-shadow: 0 4px 12px rgba(99, 102, 241, 0.35);">
                        🔄 Проверка товаров...
                    </button>
                </div>

                <div class="artify-popover-toggles" style="margin-top: 8px;">
                    <div class="artify-popover-toggle-group">
                        <span class="artify-popover-label">Позиция добавления:</span>
                        <div class="artify-popover-btns">
                            <button type="button" id="artifyFloatPosTop" class="artify-pbtn-sm ${config.position === 'top' ? 'active' : ''}">⬆️ В начало</button>
                            <button type="button" id="artifyFloatPosBottom" class="artify-pbtn-sm ${config.position === 'bottom' ? 'active' : ''}">⬇️ В конец</button>
                        </div>
                    </div>
                </div>

                <div class="artify-popover-footer">
                    <button type="button" class="artify-popover-admin-btn" id="artifyFloatOpenAdmin">
                        <span>🔗 Открыть витрину в админке</span>
                    </button>
                </div>
            </div>
        `;

        document.body.appendChild(popover);

        const closeBtn = popover.querySelector("#artifyPopoverClose");
        const catSelect = popover.querySelector("#artifyFloatCategorySelect");
        const colSelect = popover.querySelector("#artifyFloatCollectionSelect");
        const toggleCreateBtn = popover.querySelector("#artifyFloatToggleCreateCol");
        const createColBox = popover.querySelector("#artifyFloatCreateColBox");
        const newTitleInput = popover.querySelector("#artifyFloatNewTitleInput");
        const newSlugInput = popover.querySelector("#artifyFloatNewSlugInput");
        const slugPrefixSpan = popover.querySelector("#artifyFloatSlugPrefix");
        const submitCreateBtn = popover.querySelector("#artifyFloatSubmitCreateCol");
        const universalHydrateBtn = popover.querySelector("#artifyFloatUniversalHydrateBtn");

        const posTop = popover.querySelector("#artifyFloatPosTop");
        const posBottom = popover.querySelector("#artifyFloatPosBottom");
        const openAdmin = popover.querySelector("#artifyFloatOpenAdmin");

        universalHydrateBtn.addEventListener("click", () => {
            if (isHydrating) return;
            const cat = config.selectedCategory || "";
            const col = config.selectedCollection || "";

            isHydrating = true;
            universalHydrateBtn.disabled = true;
            universalHydrateBtn.innerText = "⏳ Запуск в фоне...";

            chrome.runtime.sendMessage({
                action: "START_BATCH_HYDRATION",
                category: cat,
                collection: col,
                apiUrl: config.apiUrl
            }, (res) => {
                if (res && res.started) {
                    showToast(`⚡ Допарсинг запущен в фоне (${res.state?.total || ''} товаров)...`);
                    if (res.state && res.state.total) {
                        universalHydrateBtn.innerText = `⏳ [1/${res.state.total}] Запуск...`;
                    }
                } else if (res && res.alreadyRunning) {
                    showToast("⏳ Допарсинг уже выполняется в фоне!");
                    if (res.state) {
                        universalHydrateBtn.innerText = `⏳ [${res.state.current}/${res.state.total}] ${(res.state.slug || "").slice(0, 16)}...`;
                    }
                } else {
                    isHydrating = false;
                    updateUniversalHydrateBtnUI();
                }
            });
        });

        const updateFloatSlugPrefix = () => {
            const cat = config.selectedCategory || "category";
            if (slugPrefixSpan) slugPrefixSpan.innerText = `slug: /${cat}/`;
        };

        toggleCreateBtn.addEventListener("click", () => {
            const isHidden = createColBox.style.display === "none";
            createColBox.style.display = isHidden ? "flex" : "none";
            if (isHidden) {
                updateFloatSlugPrefix();
                newTitleInput.focus();
            }
        });

        newTitleInput.addEventListener("input", () => {
            if (!newSlugInput.dataset.manualEdit) {
                newSlugInput.value = generateCollectionSlug(newTitleInput.value, config.selectedCategory);
            }
        });

        newSlugInput.addEventListener("input", () => {
            newSlugInput.dataset.manualEdit = "true";
        });

        submitCreateBtn.addEventListener("click", async () => {
            if (!config.selectedCategory) {
                showToast("Пожалуйста, сначала выберите категорию выше!", true);
                return;
            }

            const title = newTitleInput.value.trim();
            let slug = newSlugInput.value.trim();
            if (!slug && title) {
                slug = generateCollectionSlug(title, config.selectedCategory);
            }

            if (!title || !slug) {
                showToast("Введите название новой подборки", true);
                return;
            }

            submitCreateBtn.disabled = true;
            submitCreateBtn.innerText = "Создание...";

            try {
                const res = await fetch(`${config.apiUrl}/api/collection/create`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        category: config.selectedCategory,
                        title,
                        slug
                    })
                });

                const data = await res.json();
                submitCreateBtn.disabled = false;
                submitCreateBtn.innerText = "✨ Создать и выбрать";

                if (res.ok && data.success) {
                    showToast(`🎉 Подборка "${title}" создана!`);
                    createColBox.style.display = "none";
                    newTitleInput.value = "";
                    newSlugInput.value = "";
                    delete newSlugInput.dataset.manualEdit;

                    await loadCategoriesForFloatingPopover();
                    await switchCollection(config.selectedCategory, slug);
                } else {
                    showToast(data.error || "Ошибка создания подборки", true);
                }
            } catch (err) {
                submitCreateBtn.disabled = false;
                submitCreateBtn.innerText = "✨ Создать и выбрать";
                showToast("Сервер админки недоступен: " + err.message, true);
            }
        });

        closeBtn.addEventListener("click", () => toggleFloatingPopover(false));

        catSelect.addEventListener("change", async () => {
            config.selectedCategory = catSelect.value;
            config.selectedCollection = "";
            populateFloatCollections();
            updateFloatSlugPrefix();
            await switchCollection(catSelect.value, "");
            await updateUniversalHydrateBtnUI();
        });

        colSelect.addEventListener("change", async () => {
            const newCol = colSelect.value;
            await switchCollection(config.selectedCategory, newCol);
            if (newCol) showToast(`Выбрана: ${newCol}`);
            await updateUniversalHydrateBtnUI();
        });

        posTop.addEventListener("click", async () => {
            config.position = "top";
            posTop.classList.add("active");
            posBottom.classList.remove("active");
            await saveFloatConfig();
        });

        posBottom.addEventListener("click", async () => {
            config.position = "bottom";
            posBottom.classList.add("active");
            posTop.classList.remove("active");
            await saveFloatConfig();
        });

        openAdmin.addEventListener("click", () => {
            window.open(config.apiUrl || "http://localhost:3333", "_blank");
        });
    }

    // 4. Floating Action Widget (bottom-right on CF)
    function injectFloatingBar() {
        if (document.getElementById("artifyFloatingBar")) return;

        const bar = document.createElement("div");
        bar.id = "artifyFloatingBar";
        bar.className = "artify-floating-bar artify-clipper-root";

        bar.innerHTML = `
            <div class="artify-floating-icon" id="artifyToggleMinimize" title="Свернуть / Развернуть панель Artify">🎨</div>
            <div class="artify-floating-content" id="artifyFloatingContent">
                <div class="artify-floating-target" id="artifyFloatingTarget" title="Нажмите, чтобы сменить подборку прямо здесь" style="cursor: pointer;">
                    <span class="artify-floating-label">Подборка ▾</span>
                    <span class="artify-floating-col" id="artifyFloatingColName">Загрузка...</span>
                </div>
                <button type="button" class="artify-floating-action-btn" id="artifySelectAllFloatBtn" title="Отметить галочками все видимые карточки (пропуская уже добавленные и снятые вами)">
                    ☑️ Всё
                </button>
                <button type="button" class="artify-floating-action-btn" id="artifyViewSelectedBtn" title="Просмотреть выбранные товары, отменить/вернуть или сбросить">
                    👁️ <span id="artifyViewSelectedCount">0</span>
                </button>
                <button type="button" class="artify-floating-btn" id="artifyBatchAddBtn" disabled>
                    <span>⚡</span> <span id="artifyBatchText">Спарсить (0)</span>
                </button>
                <button type="button" class="artify-floating-minimize" id="artifyCloseBarBtn" title="Свернуть">✕</button>
            </div>
        `;

        document.body.appendChild(bar);

        // Minimize / Expand logic
        const toggleBtn = bar.querySelector("#artifyToggleMinimize");
        const closeBtn = bar.querySelector("#artifyCloseBarBtn");
        const selectAllBtn = bar.querySelector("#artifySelectAllFloatBtn");
        const viewSelectedBtn = bar.querySelector("#artifyViewSelectedBtn");
        const batchBtn = bar.querySelector("#artifyBatchAddBtn");
        const targetBtn = bar.querySelector("#artifyFloatingTarget");

        const toggleMinimize = () => {
            isFloatingMinimized = !isFloatingMinimized;
            if (isFloatingMinimized) {
                bar.classList.add("minimized");
                toggleFloatingPopover(false);
                toggleSelectedListPopover(false);
            } else {
                bar.classList.remove("minimized");
            }
        };

        toggleBtn.addEventListener("click", toggleMinimize);
        closeBtn.addEventListener("click", toggleMinimize);
        targetBtn.addEventListener("click", () => {
            toggleSelectedListPopover(false);
            toggleFloatingPopover();
        });
        selectAllBtn.addEventListener("click", () => selectAllVisibleCards());
        if (viewSelectedBtn) {
            viewSelectedBtn.addEventListener("click", () => toggleSelectedListPopover());
        }

        // Batch add click handler
        batchBtn.addEventListener("click", async () => {
            if (selectedProducts.size === 0) return;
            if (!config.selectedCategory || !config.selectedCollection) {
                showToast("Выберите категорию и подборку в меню расширения!", true);
                return;
            }

            const products = Array.from(selectedProducts.values());

            batchBtn.disabled = true;
            batchBtn.innerHTML = `<span>⏳</span> <span>Сохранение ${products.length}...</span>`;

            try {
                let productsToSend = products;
                if (config.mode === "full") {
                    const fullProducts = [];
                    for (let i = 0; i < products.length; i++) {
                        const item = products[i];
                        const label = item.slug ? item.slug.slice(0, 16) : `товар #${i+1}`;
                        batchBtn.innerHTML = `<span>⏳</span> <span>[${i + 1}/${products.length}] ${label}...</span>`;
                        showToast(`[${i + 1}/${products.length}] Загрузка галереи: ${item.slug || ''}`);
                        const enriched = await fetchFullProductData(item.url, item);
                        fullProducts.push(enriched);
                    }
                    productsToSend = fullProducts;
                    batchBtn.innerHTML = `<span>⏳</span> <span>Сохранение...</span>`;
                }

                const res = await fetch(`${config.apiUrl}/api/extension/add-batch`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        category: config.selectedCategory,
                        collection: config.selectedCollection,
                        products: productsToSend,
                        mode: config.mode,
                        position: config.position
                    })
                });

                const data = await res.json();
                if (res.ok && data.success) {
                    showToast(`🎉 Добавлено ${data.addedCount} товаров в подборку!`);
                    selectedProducts.clear();
                    syncSelectedToStorage();
                    pushSelectionHistory();
                    
                    // Uncheck all checkboxes
                    document.querySelectorAll(".artify-card-checkbox").forEach(cb => cb.checked = false);
                    
                    // Refresh collection status
                    await updateCollectionStatus();
                } else {
                    showToast(data.error || "Ошибка пакетного добавления", true);
                }
            } catch (err) {
                showToast("Сервер админки недоступен: " + err.message, true);
            } finally {
                updateFloatingBarUI();
                renderSelectedFloatList();
            }
        });

        updateFloatingBarUI();
    }

    function updateFloatingBarUI() {
        const colNameEl = document.getElementById("artifyFloatingColName");
        const batchBtn = document.getElementById("artifyBatchAddBtn");
        const batchText = document.getElementById("artifyBatchText");
        const viewSelectedCount = document.getElementById("artifyViewSelectedCount");

        if (colNameEl) {
            if (config.selectedCategory && config.selectedCollection) {
                colNameEl.innerText = `${config.selectedCollection} (${collectionStatus.count})`;
                colNameEl.title = `Категория: ${config.selectedCategory} / Подборка: ${config.selectedCollection}`;
            } else {
                colNameEl.innerText = "Выберите подборку";
                colNameEl.title = "Откройте расширение в правом верхнем углу браузера";
            }
        }

        const count = selectedProducts.size;
        if (viewSelectedCount) {
            viewSelectedCount.innerText = count;
        }

        if (batchBtn && batchText) {
            batchText.innerText = count > 0 ? `Спарсить (${count})` : "Спарсить (0)";
            batchBtn.disabled = count === 0 || !config.selectedCategory || !config.selectedCollection;
        }

        updateUniversalHydrateBtnUI();
    }

    let isHydrating = false;

    async function updateUniversalHydrateBtnUI() {
        const btn = document.getElementById("artifyFloatUniversalHydrateBtn");
        if (!btn) return;

        chrome.runtime.sendMessage({ action: "GET_HYDRATION_STATUS" }, (res) => {
            if (res && res.state && res.state.isRunning) {
                isHydrating = true;
                btn.disabled = true;
                btn.innerText = `⏳ [${res.state.current}/${res.state.total}] ${(res.state.slug || "").slice(0, 16)}...`;
            }
        });
        if (isHydrating) return;

        const cat = config.selectedCategory || "";
        const col = config.selectedCollection || "";

        try {
            const params = new URLSearchParams();
            if (cat) params.set("category", cat);
            if (col) params.set("collection", col);

            const res = await fetch(`${config.apiUrl}/api/extension/incomplete-products?${params.toString()}`);
            if (!res.ok) throw new Error("HTTP " + res.status);
            const data = await res.json();

            const count = data.totalIncomplete || 0;
            const scope = data.scope;

            if (scope === "all") {
                if (count > 0) {
                    btn.disabled = false;
                    btn.style.opacity = "1";
                    btn.style.cursor = "pointer";
                    btn.innerText = `🔄 Допарсить всё на сайте (${count})`;
                    btn.title = `Найдено ${count} товаров с неполной инфой на всём сайте. Нажмите для допарсинга.`;
                } else {
                    btn.disabled = true;
                    btn.style.opacity = "0.6";
                    btn.style.cursor = "default";
                    btn.innerText = `✅ Все товары на сайте заполнены (0)`;
                    btn.title = `На сайте нет товаров с неполной информацией`;
                }
            } else if (scope === "category") {
                const catObj = categoriesDataCache.find(c => (c.id || c.category) === cat);
                const catTitle = catObj?.title || cat;
                if (count > 0) {
                    btn.disabled = false;
                    btn.style.opacity = "1";
                    btn.style.cursor = "pointer";
                    btn.innerText = `🔄 Допарсить категорию "${catTitle}" (${count})`;
                    btn.title = `В категории "${catTitle}" не заполнено ${count} товаров. Нажмите для допарсинга.`;
                } else {
                    btn.disabled = true;
                    btn.style.opacity = "0.6";
                    btn.style.cursor = "default";
                    btn.innerText = `✅ В категории все товары заполнены (0)`;
                    btn.title = `В категории "${catTitle}" все товары уже с полной информацией`;
                }
            } else {
                const catObj = categoriesDataCache.find(c => (c.id || c.category) === cat);
                const colObj = (catObj?.collections || []).find(c => (c.slug || c.name || c.collection) === col);
                const colTitle = colObj?.title || col;
                if (count > 0) {
                    btn.disabled = false;
                    btn.style.opacity = "1";
                    btn.style.cursor = "pointer";
                    btn.innerText = `🔄 Допарсить подборку "${colTitle}" (${count})`;
                    btn.title = `В подборке "${colTitle}" не заполнено ${count} товаров. Нажмите для допарсинга.`;
                } else {
                    btn.disabled = true;
                    btn.style.opacity = "0.6";
                    btn.style.cursor = "default";
                    btn.innerText = `✅ В подборке все товары заполнены (0)`;
                    btn.title = `В подборке "${colTitle}" все товары уже с полной информацией`;
                }
            }
        } catch (e) {
            btn.disabled = true;
            btn.style.opacity = "0.6";
            btn.innerText = `🔄 Допарсить товары`;
            btn.title = `Проверьте адрес админки: ${config.apiUrl}`;
        }
    }

    // 5. Single Product Page Injector (`/product/*`)
    function checkAndInjectProductPage() {
        if (!window.location.pathname.includes("/product/")) return;

        // Auto-dismiss modal if present
        dismissAllAccessModal();

        // Check if page is currently a Cloudflare challenge
        if (isCloudflareChallengePage()) {
            let cfNotice = document.getElementById("artifyCloudflareNotice");
            if (!cfNotice) {
                cfNotice = document.createElement("div");
                cfNotice.id = "artifyCloudflareNotice";
                cfNotice.className = "artify-product-box artify-clipper-root";
                cfNotice.style.border = "1px solid #f59e0b";
                cfNotice.style.background = "rgba(24, 24, 27, 0.95)";
                cfNotice.style.padding = "14px";
                cfNotice.style.marginTop = "10px";
                cfNotice.innerHTML = `
                    <div style="font-weight: 700; color: #f59e0b; font-size: 13px; margin-bottom: 6px;">⚠️ Cloudflare: Проверка безопасности</div>
                    <div style="font-size: 12px; color: #d4d4d8; line-height: 1.4;">Подтвердите капчу на странице. После прохождения проверки страница автоматически активирует добавление товара в Artify.</div>
                `;
                const h1 = document.querySelector("h1");
                if (h1 && h1.parentElement) {
                    h1.parentElement.appendChild(cfNotice);
                } else {
                    document.body.prepend(cfNotice);
                }
            }
            return;
        } else {
            const oldNotice = document.getElementById("artifyCloudflareNotice");
            if (oldNotice) oldNotice.remove();
        }

        // Extract current product slug
        const currentUrl = window.location.href;
        const slug = getSlugFromUrl(currentUrl);
        if (!slug) return;

        // Check if box already injected
        if (document.getElementById("artifyProductBox")) {
            updateProductPageBox();
            return;
        }

        // Best insertion target: near purchase buttons or under the h1 title
        const h1 = document.querySelector("h1");
        const buyContainer = document.querySelector('[class*="buy"], [class*="purchase"], [class*="sidebar"], [class*="price"], aside');
        const targetContainer = buyContainer || (h1 ? h1.parentElement : null);

        if (!targetContainer) return;

        const box = document.createElement("div");
        box.id = "artifyProductBox";
        box.className = "artify-product-box artify-clipper-root";

        box.innerHTML = `
            <div class="artify-product-box-header">
                <div class="artify-product-box-title">
                    <span>🎨 Artify Studio Clipper</span>
                </div>
                <div id="artifyProductStatusText" style="font-size: 11px; font-weight: 700; color: #a3a3a3;"></div>
            </div>
            <div style="font-size: 11px; color: #d4d4d8;">
                Подборка: <b style="color: #c4b5fd;" id="artifyProductColTarget">${config.selectedCollection || 'Не выбрана'}</b>
            </div>
            <div class="artify-product-box-actions">
                <button type="button" class="artify-pbtn artify-pbtn-full" id="artifyPBtnFull" style="width: 100%;">
                    <span>⚡</span> <span id="artifyPBtnText">Добавить товар в подборку (Полный сбор)</span>
                </button>
            </div>
        `;

        if (buyContainer && buyContainer.firstChild) {
            buyContainer.insertBefore(box, buyContainer.firstChild);
        } else if (targetContainer) {
            targetContainer.appendChild(box);
        }

        // Attach action handler
        const fullBtn = box.querySelector("#artifyPBtnFull");
        fullBtn.addEventListener("click", () => handleSingleProductScrape("full"));

        updateProductPageBox();
    }

    function updateProductPageBox() {
        const slug = getSlugFromUrl(window.location.href);
        const statusEl = document.getElementById("artifyProductStatusText");
        const colTargetEl = document.getElementById("artifyProductColTarget");
        const pbtnText = document.getElementById("artifyPBtnText");

        if (colTargetEl) {
            colTargetEl.innerText = config.selectedCollection || "Не выбрана";
        }

        if (statusEl && slug) {
            if (collectionStatus.slugs.has(slug)) {
                statusEl.innerHTML = `<span style="color: #10b981;">✅ В коллекции</span>`;
                if (pbtnText) pbtnText.innerText = "🔄 Пересобрать и обновить товар";
            } else if (collectionStatus.deletedSlugs.has(slug)) {
                statusEl.innerHTML = `<span style="color: #ef4444;">🗑 В корзине</span>`;
                if (pbtnText) pbtnText.innerText = "⚡ Восстановить и спарсить товар";
            } else {
                statusEl.innerHTML = `<span style="color: #8b5cf6;">➕ Готов к добавлению</span>`;
                if (pbtnText) pbtnText.innerText = "⚡ Добавить товар в подборку (Полный сбор)";
            }
        }
    }

    async function handleSingleProductScrape(mode = "full") {
        if (isCloudflareChallengePage()) {
            showToast("⚠️ Сначала подтвердите капчу Cloudflare на странице!", true);
            return;
        }
        dismissAllAccessModal();

        if (!config.selectedCategory || !config.selectedCollection) {
            showToast("Сначала откройте расширение и выберите подборку!", true);
            return;
        }

        const fullBtn = document.getElementById("artifyPBtnFull");

        if (fullBtn) {
            fullBtn.disabled = true;
            fullBtn.innerHTML = `<span>⏳</span> <span>Парсинг...</span>`;
        }

        try {
            const product = extractCurrentProductPageData(true);
            const res = await fetch(`${config.apiUrl}/api/extension/add-product`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    category: config.selectedCategory,
                    collection: config.selectedCollection,
                    product,
                    mode: "full",
                    position: config.position
                })
            });

            const data = await res.json();
            if (res.ok && data.success) {
                collectionStatus.slugs.add(product.slug);
                collectionStatus.deletedSlugs.delete(product.slug);
                collectionStatus.count = data.totalCount || (collectionStatus.count + 1);

                showToast(`🎉 "${data.title}" успешно сохранён в Artify!`);
                updateProductPageBox();
                updateFloatingBarUI();
            } else {
                showToast(data.error || "Ошибка при сохранении", true);
            }
        } catch (err) {
            showToast("Ошибка соединения: " + err.message, true);
        } finally {
            if (fullBtn) {
                fullBtn.disabled = false;
                fullBtn.innerHTML = `<span>⚡</span> <span>Добавить товар в подборку (Полный сбор)</span>`;
            }
        }
    }

    // Parse product page HTML string into a structured product object
    function parseProductPageHtml(html, url, fallbackData = {}) {
        const doc = new DOMParser().parseFromString(html, "text/html");
        const slug = fallbackData.slug || getSlugFromUrl(url);

        // Remove popups, modals, radices, and artify extension overlays from cloned doc so they don't corrupt title or content
        doc.querySelectorAll('#payments-dialog, [role="dialog"], [data-radix-focus-guard], #artifyProductBox, #artifyFloatingBar, #artifyFloatingPopover, .artify-clipper-root').forEach(el => el.remove());

        // 1. Title
        const h1 = doc.querySelector("h1");
        const ogTitle = doc.querySelector('meta[property="og:title"]')?.content || "";
        let title = h1 ? h1.innerText.trim() : (fallbackData.title || "");
        if (!title && ogTitle) {
            const m = ogTitle.match(/^(.*?)\s+Graphic\s+by/i) || ogTitle.match(/^(.*?)\s+by/i);
            title = m ? m[1].trim() : ogTitle.split("·")[0].trim();
        }
        if (!title && slug) {
            title = slug.split("-").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
        }

        // 2. Author
        let author = fallbackData.author || "";
        const authorEl = doc.querySelector('a[href*="/designer/"], a[href*="/store/"]');
        if (authorEl && authorEl.innerText.trim()) {
            author = authorEl.innerText.trim();
        } else if (ogTitle) {
            const match = ogTitle.match(/by\s+(.*?)\s+·/i);
            if (match && match[1]) author = match[1].trim();
        }

        // 3. Ratings & Reviews
        let rating = fallbackData.rating ?? null;
        let reviewsCount = fallbackData.reviewsCount ?? 0;
        const starsEl = doc.querySelector('[data-testid*="rating"], .rating-score, [class*="Rating"]');
        if (starsEl) {
            const m = starsEl.innerText.match(/(\d+(\.\d+)?)/);
            if (m) rating = parseFloat(m[1]);
        }
        const reviewEl = doc.querySelector('a[href*="#reviews"], [data-testid*="review"]');
        if (reviewEl) {
            const rm = reviewEl.innerText.match(/(\d+)/);
            if (rm) reviewsCount = parseInt(rm[1], 10);
        }

        // 4. Favorites (strictly isolate #favorite-count from related items)
        let favorites = fallbackData.favorites ?? null;
        const favEl = doc.querySelector('#favorite-count') || doc.querySelector('[data-testid*="favorite-count"]');
        if (favEl) {
            const fText = favEl.innerText.replace(/[^\d]/g, "");
            if (fText) favorites = parseInt(fText, 10);
        }

        // 5. Main Image & Gallery
        let mainImage = "";
        const ogImage = doc.querySelector('meta[property="og:image"]')?.content;
        if (ogImage) mainImage = getHdImageUrl(ogImage);
        if (!mainImage && fallbackData.image) mainImage = getHdImageUrl(fallbackData.image);

        // Signature for gallery matching (first 3 words of slug)
        const slugWords = slug.split("-").filter(Boolean);
        const signature = slugWords.slice(0, 3).join("-").toLowerCase();

        // Product ID if found in image or url
        let productId = "";
        const idMatch = (mainImage || url).match(/(\d{6,10})/);
        if (idMatch) productId = idMatch[1];

        const gallerySet = new Set();
        if (mainImage) gallerySet.add(mainImage);

        // Find all img tags in DOM (including .fotorama and .hero-wrapper for fonts)
        const galleryImgs = doc.querySelectorAll(
            '.fotorama img, .fotorama__img, .hero-wrapper img, .product-slider img, .product-gallery img, .swiper-wrapper img, [data-testid="product-gallery"] img, [class*="gallery"] img, main img'
        );
        galleryImgs.forEach(img => {
            const src = img.getAttribute("data-src") || img.getAttribute("src") || img.currentSrc || img.src;
            if (src && src.includes("cdn.creativefabrica.com") && !src.includes("data:image") && !src.includes("avatar")) {
                const lowerSrc = src.toLowerCase();
                const inSlider = Boolean(img.closest('.fotorama, .hero-wrapper, .product-slider, .product-gallery, .swiper-wrapper, [data-testid="product-gallery"]'));
                const hasSignature = signature && lowerSrc.includes(signature);
                const hasProductId = productId && src.includes(productId);
                if (inSlider || hasSignature || hasProductId) {
                    if (!/waterfall|glyphs|numbers|punctuation|_text_|avatar|logo|get-all-access|preview|\/assets\/|_200x200/i.test(src)) {
                        const hd = getHdImageUrl(src);
                        if (hd) {
                            if (!mainImage) mainImage = hd;
                            gallerySet.add(hd);
                        }
                    }
                }
            }
        });

        // Scan raw HTML for cdn.creativefabrica.com images
        try {
            const cdnMatches = html.matchAll(/https:\/\/cdn\.creativefabrica\.com\/[^\s"'<>\\]+/gi);
            for (const m of cdnMatches) {
                const rawUrl = m[0];
                const lowerRaw = rawUrl.toLowerCase();
                const hasSig = signature && lowerRaw.includes(signature);
                const hasId = productId && rawUrl.includes(productId);
                if ((hasSig || hasId) && !/waterfall|glyphs|numbers|punctuation|_text_|avatar|logo|get-all-access|preview|\/assets\/|_200x200/i.test(rawUrl)) {
                    if (/\.(jpg|jpeg|png|webp)/i.test(rawUrl)) {
                        const hd = getHdImageUrl(rawUrl);
                        if (hd) {
                            if (!mainImage) mainImage = hd;
                            gallerySet.add(hd);
                        }
                    }
                }
            }
        } catch {}

        // Fallback gallery
        if (gallerySet.size === 0 && fallbackData.gallery && Array.isArray(fallbackData.gallery)) {
            fallbackData.gallery.forEach(g => gallerySet.add(getHdImageUrl(g)));
        }

        // 6. Tags
        const tags = [];
        const tagLinks = [];
        const tagElements = doc.querySelectorAll('.c-tags a, a[href*="/tag/"], a[href*="/search?keyword="]');
        tagElements.forEach(t => {
            const txt = t.innerText.trim();
            if (txt && !tags.includes(txt)) {
                tags.push(txt);
                tagLinks.push({ text: txt, href: t.href });
            }
        });

        // 7. Full Description (including single-product-description for fonts)
        let description = "";
        let fullDescription = "";
        const descEl = doc.querySelector(
            '#single-product-description, .single-product-description, .product-description, [data-testid="product-description"], #product-description, [class*="ProductDescription"], .specimen-text'
        );
        if (descEl && descEl.innerText.trim().length > 10) {
            description = descEl.innerText.trim();
            fullDescription = descEl.innerHTML.trim();
        } else {
            const metaDesc = doc.querySelector('meta[name="description"]')?.content;
            if (metaDesc) {
                description = metaDesc.trim();
                fullDescription = `<p>${description}</p>`;
            }
        }

        const isFull = fallbackData.isFull !== false;

        return {
            slug,
            url,
            title: title || fallbackData.title || slug,
            author: author || fallbackData.author || "",
            image: mainImage || fallbackData.image || "",
            gallery: Array.from(gallerySet),
            rating: rating ?? fallbackData.rating ?? null,
            reviewsCount: reviewsCount || fallbackData.reviewsCount || (rating ? 1 : 0),
            favorites: favorites ?? fallbackData.favorites ?? null,
            designerTags: tags.length > 0 ? tags : (fallbackData.designerTags || []),
            designerTagLinks: tagLinks.length > 0 ? tagLinks : (fallbackData.designerTagLinks || []),
            description: isFull ? (description || fallbackData.description || "") : (description.slice(0, 300) || fallbackData.description || ""),
            fullDescription: isFull ? (fullDescription || description || fallbackData.fullDescription || "") : "",
            isDraft: false
        };
    }

    // Fetch full product page HTML via Background Tab Scraper (100% bypasses Cloudflare)
    async function fetchFullProductData(url, fallbackData = {}) {
        // If we are already on this product page, extract live DOM immediately
        if (getSlugFromUrl(window.location.href) === getSlugFromUrl(url)) {
            return extractCurrentProductPageData(true);
        }

        return new Promise((resolve) => {
            chrome.runtime.sendMessage({
                action: "SCRAPE_FULL_PRODUCT_VIA_TAB",
                url,
                fallbackData
            }, (res) => {
                if (!chrome.runtime.lastError && res && res.success && res.data) {
                    resolve(res.data);
                } else {
                    console.warn("fetchFullProductData tab fallback for", url, res?.error || chrome.runtime.lastError?.message);
                    resolve({
                        ...fallbackData,
                        url,
                        slug: fallbackData.slug || getSlugFromUrl(url),
                        image: getHdImageUrl(fallbackData.image || ""),
                        gallery: Array.isArray(fallbackData.gallery) && fallbackData.gallery.length > 0 
                            ? fallbackData.gallery.map(getHdImageUrl) 
                            : [getHdImageUrl(fallbackData.image || "")].filter(Boolean),
                        isDraft: false,
                        deepParsed: false
                    });
                }
            });
        });
    }

    // Deep extraction on single product page
    function extractCurrentProductPageData(isFull = false) {
        return parseProductPageHtml(document.documentElement.outerHTML, window.location.href, { isFull });
    }

    // 6. Listen for Runtime Messages from Popup or Background
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
        // Фоновое извлечение DOM при открытии вкладки скриптом background.js
        if (request.action === "DO_FULL_DOM_EXTRACTION") {
            dismissAllAccessModal();
            if (isCloudflareChallengePage()) {
                sendResponse({ success: false, isCloudflare: true, error: "Cloudflare challenge active" });
                return true;
            }
            window.scrollBy(0, 600);
            setTimeout(() => {
                try {
                    dismissAllAccessModal();
                    if (isCloudflareChallengePage()) {
                        sendResponse({ success: false, isCloudflare: true, error: "Cloudflare challenge active" });
                        return;
                    }
                    const html = document.documentElement.outerHTML;
                    const data = parseProductPageHtml(html, window.location.href, { isFull: true, ...(request.fallbackData || {}) });
                    sendResponse({ success: true, data });
                } catch (e) {
                    sendResponse({ success: false, error: e.message });
                }
            }, 350);
            return true;
        }

        // Прогресс пакетной гидратации из background worker
        if (request.type === "HYDRATE_PROGRESS") {
            const btn = document.querySelector("#artifyFloatUniversalHydrateBtn");
            if (btn) {
                btn.disabled = true;
                btn.innerText = `⏳ [${request.current}/${request.total}] ${(request.slug || "").slice(0, 16)}...`;
            }
            showToast(`[${request.current}/${request.total}] Допарсинг: ${request.slug || ''}`);
            return true;
        }

        // Завершение пакетной гидратации из background worker
        if (request.type === "HYDRATE_COMPLETE") {
            showToast(`🎉 Готово! Допарсено: ${request.successCount || 0} товаров!`, 3500);
            isHydrating = false;
            updateUniversalHydrateBtnUI();
            updateFloatingBarUI();
            updateCollectionStatus();
            return true;
        }
        if (request.action === "GET_PAGE_INFO") {
            const url = window.location.href;
            const isProductPage = url.includes("/product/") && !url.endsWith("/product/");
            const slug = getSlugFromUrl(url);
            const title = document.querySelector("h1")?.innerText?.trim() || "";
            sendResponse({
                success: true,
                isProductPage,
                url,
                slug,
                title,
                selectedProducts: Array.from(selectedProducts.values())
            });
            return true;
        }

        if (request.action === "SELECT_ALL_VISIBLE") {
            const count = selectAllVisibleCards();
            sendResponse({
                success: true,
                count,
                selectedProducts: Array.from(selectedProducts.values())
            });
            return true;
        }

        if (request.action === "DESELECT_PRODUCT") {
            const targetUrl = request.url;
            selectedProducts.delete(targetUrl);
            manuallyUncheckedUrls.add(targetUrl);
            document.querySelectorAll(".artify-card-overlay").forEach(overlay => {
                if (overlay.dataset.url === targetUrl) {
                    const cb = overlay.querySelector(".artify-card-checkbox");
                    if (cb) cb.checked = false;
                }
            });
            syncSelectedToStorage();
            pushSelectionHistory();
            sendResponse({ success: true, count: selectedProducts.size });
            return true;
        }

        if (request.action === "CLEAR_ALL_SELECTED") {
            clearAllSelectedCards();
            sendResponse({ success: true });
            return true;
        }

        if (request.action === "SYNC_SELECTED_PRODUCTS") {
            selectedProducts.clear();
            const urls = new Set();
            (request.selectedProducts || []).forEach(p => {
                if (p && p.url) {
                    selectedProducts.set(p.url, p);
                    urls.add(p.url);
                }
            });
            document.querySelectorAll(".artify-card-overlay").forEach(overlay => {
                const u = overlay.dataset.url;
                const cb = overlay.querySelector(".artify-card-checkbox");
                if (cb && u) {
                    cb.checked = urls.has(u);
                }
            });
            const key = getBasketKey();
            if (key) {
                collectionsBasket[key] = Array.from(selectedProducts.values());
            }
            selectionHistory = [ Array.from(selectedProducts.values()) ];
            historyIndex = 0;
            updateFloatingBarUI();
            renderSelectedFloatList();
            updateUndoRedoUI();
            sendResponse({ success: true });
            return true;
        }

        if (request.action === "STATE_UPDATED") {
            if (request.apiUrl) config.apiUrl = request.apiUrl;
            const newCat = request.selectedCategory !== undefined ? request.selectedCategory : config.selectedCategory;
            const newCol = request.selectedCollection !== undefined ? request.selectedCollection : config.selectedCollection;
            if (request.mode) config.mode = request.mode;
            if (request.position) config.position = request.position;

            if (newCat !== config.selectedCategory || newCol !== config.selectedCollection) {
                switchCollection(newCat, newCol);
            } else {
                updateCollectionStatus();
                updateFloatingBarUI();
                renderSelectedFloatList();
            }
            sendResponse({ success: true });
            return true;
        }

        if (request.action === "SCRAPE_CURRENT_PAGE") {
            try {
                const product = extractCurrentProductPageData(request.mode === "full");
                fetch(`${request.apiUrl || config.apiUrl}/api/extension/add-product`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        category: request.category,
                        collection: request.collection,
                        product,
                        mode: request.mode,
                        position: request.position
                    })
                })
                .then(r => r.json())
                .then(data => {
                    if (data.success) {
                        collectionStatus.slugs.add(product.slug);
                        collectionStatus.deletedSlugs.delete(product.slug);
                        if (data.isDraft) collectionStatus.draftSlugs.add(product.slug);
                        updateProductPageBox();
                        updateFloatingBarUI();
                    }
                    sendResponse(data);
                })
                .catch(err => sendResponse({ success: false, error: err.message }));
            } catch (e) {
                sendResponse({ success: false, error: e.message });
            }
            return true;
        }

        if (request.action === "ADD_VISIBLE_CARDS") {
            const cards = document.querySelectorAll('.artify-card-overlay');
            const products = [];

            cards.forEach(overlay => {
                const slug = overlay.dataset.slug;
                const url = overlay.dataset.url;
                const card = overlay.parentElement;
                if (slug && url && card) {
                    products.push(extractDataFromCard(card, url, slug));
                }
            });

            if (products.length === 0) {
                sendResponse({ success: false, error: "На экране не найдено карточек товаров" });
                return true;
            }

            fetch(`${request.apiUrl || config.apiUrl}/api/extension/add-batch`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    category: request.category,
                    collection: request.collection,
                    products,
                    mode: request.mode,
                    position: request.position
                })
            })
            .then(r => r.json())
            .then(data => {
                if (data.success) {
                    updateCollectionStatus();
                }
                sendResponse(data);
            })
            .catch(err => sendResponse({ success: false, error: err.message }));

            return true;
        }
    });

    function ensureUIInjected() {
        if (!document.body) return;
        if (!document.getElementById("artifyFloatingBar")) {
            injectFloatingBar();
        }
        if (!document.getElementById("artifyFloatingPopover")) {
            injectFloatingPopover();
        }
        if (!document.getElementById("artifySelectedListPopover")) {
            injectSelectedListPopover();
        }
    }

    // 7. Observer for Dynamic Infinite Scroll & UI Persistence
    function setupObserver() {
        if (observer) observer.disconnect();

        observer = new MutationObserver(() => {
            ensureUIInjected();
            if (scanTimeout) clearTimeout(scanTimeout);
            scanTimeout = setTimeout(() => {
                scanAndInjectCards();
                checkAndInjectProductPage();
            }, 250);
        });

        const target = document.body || document.documentElement;
        if (target) {
            observer.observe(target, {
                childList: true,
                subtree: true
            });
        }
    }

    // 8. Initialization
    function init() {
        ensureUIInjected();

        loadConfig().then(() => {
            updateFloatingBarUI();
            renderSelectedFloatList();
        });

        scanAndInjectCards();
        checkAndInjectProductPage();
        setupObserver();

        // Watchdog: ensures floating bar is never removed by site re-renders or hydration
        setInterval(() => {
            ensureUIInjected();
        }, 1500);
    }

    // Start when DOM is ready
    if (document.body) {
        init();
    } else {
        document.addEventListener("DOMContentLoaded", init);
    }
})();
