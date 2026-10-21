// extension/popup/popup.js

document.addEventListener("DOMContentLoaded", async () => {
    // DOM Elements - Status & Selectors
    const statusBadge = document.getElementById("statusBadge");
    const statusText = document.getElementById("statusText");
    const categorySelect = document.getElementById("categorySelect");
    const collectionSelect = document.getElementById("collectionSelect");
    const colStatsBar = document.getElementById("colStatsBar");
    const totalCountSpan = document.getElementById("totalCountSpan");
    const universalHydrateBtn = document.getElementById("universalHydrateBtn");

    // Position Toggles
    const posTopBtn = document.getElementById("posTopBtn");
    const posBottomBtn = document.getElementById("posBottomBtn");

    // Selected Checkboxes Preview Section
    const selectedPreviewSection = document.getElementById("selectedPreviewSection");
    const selectedCountSpan = document.getElementById("selectedCountSpan");
    const clearSelectionBtn = document.getElementById("clearSelectionBtn");
    const selectedItemsContainer = document.getElementById("selectedItemsContainer");
    const scrapeSelectedBtn = document.getElementById("scrapeSelectedBtn");
    const btnSelectedCountSpan = document.getElementById("btnSelectedCountSpan");

    // Action Buttons
    const scrapeCurrentPageBtn = document.getElementById("scrapeCurrentPageBtn");
    const selectAllCardsBtn = document.getElementById("selectAllCardsBtn");
    const deselectAllCardsBtn = document.getElementById("deselectAllCardsBtn");
    const undoLastBatchBtn = document.getElementById("undoLastBatchBtn");
    const undoCountSpan = document.getElementById("undoCountSpan");
    const openAdminBtn = document.getElementById("openAdminBtn");

    // Collection Creator Elements
    const toggleCreateColBtn = document.getElementById("toggleCreateColBtn");
    const createColBox = document.getElementById("createColBox");
    const newColTitleInput = document.getElementById("newColTitleInput");
    const newColSlugInput = document.getElementById("newColSlugInput");
    const slugPrefixSpan = document.getElementById("slugPrefixSpan");
    const submitCreateColBtn = document.getElementById("submitCreateColBtn");

    // Undo / Redo Selection Elements
    const undoSelectionBtn = document.getElementById("undoSelectionBtn");
    const redoSelectionBtn = document.getElementById("redoSelectionBtn");

    // Server Settings & Toast
    const apiUrlInput = document.getElementById("apiUrlInput");
    const saveApiUrlBtn = document.getElementById("saveApiUrlBtn");
    const popupToast = document.getElementById("popupToast");

    // Сервисы & Git Push Элементы
    const refreshServicesBtn = document.getElementById("refreshServicesBtn");
    const dotAdmin = document.getElementById("dot-admin");
    const openAdminBtnRow = document.getElementById("open-admin-btn");
    const startAdminBtn = document.getElementById("start-admin-btn");

    const dotSite = document.getElementById("dot-site");
    const openSiteBtn = document.getElementById("open-site-btn");
    const startSiteBtn = document.getElementById("start-site-btn");

    const dotManager = document.getElementById("dot-manager");
    const openManagerBtn = document.getElementById("open-manager-btn");
    const startManagerBtn = document.getElementById("start-manager-btn");

    const startAllServicesBtn = document.getElementById("startAllServicesBtn");
    const startAllBtnText = document.getElementById("startAllBtnText");

    const gitPushAllBtn = document.getElementById("gitPushAllBtn");
    const gitPushBtnText = document.getElementById("gitPushBtnText");
    const pushLogBox = document.getElementById("pushLogBox");
    const pushLogTitle = document.getElementById("pushLogTitle");
    const pushLogContent = document.getElementById("pushLogContent");
    const closePushLogBtn = document.getElementById("closePushLogBtn");

    let servicesState = {
        admin: false,
        site: false,
        manager: false
    };

    let categoriesData = [];
    let collectionsBasket = {}; // key: "category/collection" -> array of products
    let selectionHistory = [];
    let historyIndex = -1;

    let state = {
        apiUrl: "http://localhost:3333",
        selectedCategory: "",
        selectedCollection: "",
        mode: "full",
        position: "top",
        lastAddedSlugs: [],
        selectedProducts: []
    };

    function showToast(text, duration = 2500) {
        popupToast.innerText = text;
        popupToast.classList.remove("hidden");
        setTimeout(() => popupToast.classList.add("hidden"), duration);
    }

    function updateUndoUI() {
        if (state.lastAddedSlugs && state.lastAddedSlugs.length > 0) {
            undoCountSpan.innerText = state.lastAddedSlugs.length;
            undoLastBatchBtn.classList.remove("hidden");
        } else {
            undoLastBatchBtn.classList.add("hidden");
        }
    }

    function getBasketKey() {
        if (!state.selectedCategory || !state.selectedCollection) return null;
        return `${state.selectedCategory}/${state.selectedCollection}`;
    }

    function pushSelectionHistory() {
        if (historyIndex < selectionHistory.length - 1) {
            selectionHistory = selectionHistory.slice(0, historyIndex + 1);
        }
        selectionHistory.push([...state.selectedProducts]);
        if (selectionHistory.length > 25) selectionHistory.shift();
        historyIndex = selectionHistory.length - 1;
        updateUndoRedoUI();
    }

    function updateUndoRedoUI() {
        if (undoSelectionBtn) undoSelectionBtn.disabled = historyIndex <= 0;
        if (redoSelectionBtn) redoSelectionBtn.disabled = historyIndex >= selectionHistory.length - 1;
    }

    async function syncBasketToStorage() {
        const key = getBasketKey();
        if (key) {
            collectionsBasket[key] = [...state.selectedProducts];
        }
        await chrome.storage.local.set({
            collectionsBasket,
            selectedProducts: state.selectedProducts
        });
    }

    async function switchCollection(newCat, newCol) {
        // 1. Сохраняем текущую корзину для предыдущей подборки
        const oldKey = getBasketKey();
        if (oldKey) {
            collectionsBasket[oldKey] = [...state.selectedProducts];
        }

        state.selectedCategory = newCat;
        state.selectedCollection = newCol;

        // 2. Загружаем изолированную корзину для новой подборки!
        const newKey = getBasketKey();
        if (newKey && Array.isArray(collectionsBasket[newKey])) {
            state.selectedProducts = [...collectionsBasket[newKey]];
        } else {
            state.selectedProducts = [];
        }

        selectionHistory = [ [...state.selectedProducts] ];
        historyIndex = 0;

        await chrome.storage.local.set({
            selectedCategory: newCat,
            selectedCollection: newCol,
            selectedProducts: state.selectedProducts,
            collectionsBasket
        });

        renderSelectedProducts();
        updateUndoRedoUI();

        if (newCat && newCol) {
            await fetchCollectionStats();
        } else {
            colStatsBar.classList.add("hidden");
        }

        notifyContentScript();
    }

    // 1. Загрузка сохранённого состояния из chrome.storage
    const stored = await chrome.storage.local.get([
        "apiUrl",
        "selectedCategory",
        "selectedCollection",
        "cachedCategoriesData",
        "mode",
        "position",
        "lastAddedSlugs",
        "selectedProducts",
        "collectionsBasket"
    ]);

    if (stored.apiUrl) state.apiUrl = stored.apiUrl;
    if (stored.selectedCategory) state.selectedCategory = stored.selectedCategory;
    if (stored.selectedCollection) state.selectedCollection = stored.selectedCollection;
    state.mode = "full";
    if (stored.position) state.position = stored.position;
    if (Array.isArray(stored.lastAddedSlugs)) state.lastAddedSlugs = stored.lastAddedSlugs;
    if (stored.collectionsBasket && typeof stored.collectionsBasket === "object") {
        collectionsBasket = stored.collectionsBasket;
    }

    // МГНОВЕННАЯ ИНИЦИАЛИЗАЦИЯ ИЗ КЭША (без задержек сети!)
    if (Array.isArray(stored.cachedCategoriesData) && stored.cachedCategoriesData.length > 0) {
        categoriesData = stored.cachedCategoriesData;
        populateCategories();
    }

    const initialKey = getBasketKey();
    if (initialKey && Array.isArray(collectionsBasket[initialKey])) {
        state.selectedProducts = [...collectionsBasket[initialKey]];
    } else if (Array.isArray(stored.selectedProducts)) {
        state.selectedProducts = stored.selectedProducts;
    }

    selectionHistory = [ [...state.selectedProducts] ];
    historyIndex = 0;

    apiUrlInput.value = state.apiUrl;
    updatePositionUI();
    updateUndoUI();
    renderSelectedProducts();
    updateUndoRedoUI();

    // 2. Инициализация и проверка статусов сервисов
    await checkAllServicesStatus();

    // 3. Проверка соединения с админкой и обновление категорий
    await checkServerAndLoadCategories();

    // Периодический опрос статусов каждые 5 сек для мгновенной реакции на запуск/остановку
    setInterval(() => {
        checkAllServicesStatus();
    }, 5000);

    // 4. Проверка текущей вкладки (находимся ли мы на Creative Fabrica)
    await checkActiveTab();

    // Слушатели управления сервисами
    if (openAdminBtnRow) {
        openAdminBtnRow.addEventListener("click", () => {
            chrome.tabs.create({ url: state.apiUrl || "http://localhost:3333" });
        });
    }
    if (openSiteBtn) {
        openSiteBtn.addEventListener("click", () => {
            chrome.tabs.create({ url: "http://localhost:4321" });
        });
    }
    if (openManagerBtn) {
        openManagerBtn.addEventListener("click", () => {
            chrome.tabs.create({ url: "http://localhost:3001" });
        });
    }

    if (startAdminBtn) startAdminBtn.addEventListener("click", () => launchService("admin", startAdminBtn));
    if (startSiteBtn) startSiteBtn.addEventListener("click", () => launchService("site", startSiteBtn));
    if (startManagerBtn) startManagerBtn.addEventListener("click", () => launchService("manager", startManagerBtn));

    if (startAllServicesBtn) {
        startAllServicesBtn.addEventListener("click", async () => {
            const allOnline = servicesState.admin && servicesState.site && servicesState.manager;
            if (allOnline) {
                showToast("Все 3 сервиса уже активны!");
                await checkAllServicesStatus();
                return;
            }
            startAllServicesBtn.disabled = true;
            if (startAllBtnText) startAllBtnText.innerText = "⏳ Запуск всех сервисов...";
            await launchService("all");
            startAllServicesBtn.disabled = false;
        });
    }

    if (refreshServicesBtn) {
        refreshServicesBtn.addEventListener("click", checkAllServicesStatus);
    }

    // Слушатель Git Push All
    if (gitPushAllBtn) {
        gitPushAllBtn.addEventListener("click", handleGitPushAll);
    }

    if (closePushLogBtn && pushLogBox) {
        closePushLogBtn.addEventListener("click", () => {
            pushLogBox.classList.add("hidden");
        });
    }

    // Event Listeners - Selectors
    categorySelect.addEventListener("change", async () => {
        const newCat = categorySelect.value;
        populateCollections();
        updateSlugPrefix();
        await switchCollection(newCat, "");
        await updateUniversalHydrateBtnUI();
    });

    collectionSelect.addEventListener("change", async () => {
        const newCol = collectionSelect.value;
        await switchCollection(state.selectedCategory, newCol);
        if (newCol) showToast(`Выбрана: ${newCol}`);
        await updateUniversalHydrateBtnUI();
    });

    posTopBtn.addEventListener("click", () => {
        state.position = "top";
        updatePositionUI();
        saveState();
    });

    posBottomBtn.addEventListener("click", () => {
        state.position = "bottom";
        updatePositionUI();
        saveState();
    });

    saveApiUrlBtn.addEventListener("click", async () => {
        const val = apiUrlInput.value.trim().replace(/\/+$/, "");
        if (val) {
            state.apiUrl = val;
            await chrome.storage.local.set({ apiUrl: val });
            showToast("Адрес сохранён!");
            await checkServerAndLoadCategories();
        }
    });

    openAdminBtn.addEventListener("click", () => {
        const adminUrl = state.apiUrl || "http://localhost:3333";
        chrome.tabs.create({ url: adminUrl });
    });

    // 4. Отрисовка списка выбранных галочками товаров
    function renderSelectedProducts() {
        const items = state.selectedProducts || [];
        if (deselectAllCardsBtn) {
            deselectAllCardsBtn.disabled = items.length === 0;
        }

        if (items.length === 0) {
            selectedPreviewSection.classList.add("hidden");
            return;
        }

        selectedPreviewSection.classList.remove("hidden");
        selectedCountSpan.innerText = items.length;
        btnSelectedCountSpan.innerText = items.length;
        selectedItemsContainer.innerHTML = "";

        items.forEach((item, index) => {
            const card = document.createElement("div");
            card.className = "selected-item-card";

            // Нумерация порядка: #1, #2...
            const orderNum = index + 1;
            const imgUrl = item.image || "";

            card.innerHTML = `
                <div class="selected-item-badge" title="Порядок добавления: ${orderNum}-й">#${orderNum}</div>
                ${imgUrl ? `<img src="${imgUrl}" class="selected-item-thumb" alt="${item.title || ''}" />` : '<div class="selected-item-thumb" style="display:flex;align-items:center;justify-content:center;color:#71717a;font-size:10px;">IMG</div>'}
                <div class="selected-item-info">
                    <div class="selected-item-title" title="${item.title || item.slug}">${item.title || item.slug}</div>
                    <div class="selected-item-author">${item.author || (item.slug ? item.slug.slice(0, 20) : '')}</div>
                </div>
                <button type="button" class="selected-item-remove" title="Убрать из выбора" data-url="${item.url}">✕</button>
            `;

            const removeBtn = card.querySelector(".selected-item-remove");
            removeBtn.addEventListener("click", async (e) => {
                e.stopPropagation();
                await removeItemFromSelection(item.url);
            });

            selectedItemsContainer.appendChild(card);
        });
    }

    async function removeItemFromSelection(url) {
        state.selectedProducts = state.selectedProducts.filter(p => p.url !== url);
        await syncBasketToStorage();
        pushSelectionHistory();
        renderSelectedProducts();

        // Уведомляем активную вкладку чтобы снять галочку на странице
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        if (tab && tab.id) {
            chrome.tabs.sendMessage(tab.id, {
                action: "DESELECT_PRODUCT",
                url: url
            }).catch(() => {});
        }
    }

    clearSelectionBtn.addEventListener("click", async () => {
        state.selectedProducts = [];
        await syncBasketToStorage();
        pushSelectionHistory();
        renderSelectedProducts();

        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        if (tab && tab.id) {
            chrome.tabs.sendMessage(tab.id, {
                action: "CLEAR_ALL_SELECTED"
            }).catch(() => {});
        }
        showToast("Выбор сброшен");
    });

    undoSelectionBtn.addEventListener("click", async () => {
        if (historyIndex > 0) {
            historyIndex--;
            state.selectedProducts = [...selectionHistory[historyIndex]];
            await syncBasketToStorage();
            renderSelectedProducts();
            updateUndoRedoUI();
            notifyActiveTabSelectionSync();
            showToast("↩️ Действие отменено");
        }
    });

    redoSelectionBtn.addEventListener("click", async () => {
        if (historyIndex < selectionHistory.length - 1) {
            historyIndex++;
            state.selectedProducts = [...selectionHistory[historyIndex]];
            await syncBasketToStorage();
            renderSelectedProducts();
            updateUndoRedoUI();
            notifyActiveTabSelectionSync();
            showToast("↪️ Действие возвращено");
        }
    });

    async function notifyActiveTabSelectionSync() {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        if (tab && tab.id) {
            chrome.tabs.sendMessage(tab.id, {
                action: "SYNC_SELECTED_PRODUCTS",
                selectedProducts: state.selectedProducts
            }).catch(() => {});
        }
    }

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

    function updateSlugPrefix() {
        const cat = state.selectedCategory || "category";
        if (slugPrefixSpan) slugPrefixSpan.innerText = `slug: /${cat}/`;
    }

    toggleCreateColBtn.addEventListener("click", () => {
        const isHidden = createColBox.classList.contains("hidden");
        if (isHidden) {
            createColBox.classList.remove("hidden");
            updateSlugPrefix();
            newColTitleInput.focus();
        } else {
            createColBox.classList.add("hidden");
        }
    });

    newColTitleInput.addEventListener("input", () => {
        if (!newColSlugInput.dataset.manualEdit) {
            newColSlugInput.value = generateCollectionSlug(newColTitleInput.value, state.selectedCategory);
        }
    });

    newColSlugInput.addEventListener("input", () => {
        newColSlugInput.dataset.manualEdit = "true";
    });

    submitCreateColBtn.addEventListener("click", async () => {
        if (!state.selectedCategory) {
            alert("Пожалуйста, сначала выберите категорию выше!");
            return;
        }

        const title = newColTitleInput.value.trim();
        let slug = newColSlugInput.value.trim();
        if (!slug && title) {
            slug = generateCollectionSlug(title, state.selectedCategory);
        }

        if (!title || !slug) {
            alert("Пожалуйста, введите название подборки");
            return;
        }

        submitCreateColBtn.disabled = true;
        submitCreateColBtn.innerText = "Создание...";

        try {
            const res = await fetch(`${state.apiUrl}/api/collection/create`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    category: state.selectedCategory,
                    slug: slug,
                    title: title
                })
            });

            const data = await res.json();
            submitCreateColBtn.disabled = false;
            submitCreateColBtn.innerText = "✨ Создать и выбрать";

            if (res.ok && data.success) {
                showToast(`🎉 Подборка "${title}" создана!`);
                createColBox.classList.add("hidden");
                newColTitleInput.value = "";
                newColSlugInput.value = "";
                delete newColSlugInput.dataset.manualEdit;

                await checkServerAndLoadCategories();
                await switchCollection(state.selectedCategory, slug);
            } else {
                alert(data.error || "Не удалось создать подборку");
            }
        } catch (e) {
            submitCreateColBtn.disabled = false;
            submitCreateColBtn.innerText = "✨ Создать и выбрать";
            alert("Ошибка сервера: " + e.message);
        }
    });

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

    function getHdImageUrl(src) {
        if (!src) return "";
        if (src.includes("cdn.creativefabrica.com")) {
            return src
                .replace(/-\d+x\d+(?=\.(jpg|jpeg|png|webp))/gi, "")
                .replace(/-1-1(?=\.(jpg|jpeg|png|webp))/gi, "-1");
        }
        return src;
    }

    function parseProductPageHtml(html, url, fallbackData = {}) {
        const doc = new DOMParser().parseFromString(html, "text/html");
        const slug = fallbackData.slug || getSlugFromUrl(url);

        // Remove popups, modals, radices, and artify extension overlays from cloned doc so they don't corrupt title or content
        doc.querySelectorAll('#payments-dialog, [role="dialog"], [data-radix-focus-guard], #artifyProductBox, #artifyFloatingBar, #artifyFloatingPopover, .artify-clipper-root').forEach(el => el.remove());

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

        let author = fallbackData.author || "";
        const authorEl = doc.querySelector('a[href*="/designer/"], a[href*="/store/"]');
        if (authorEl && authorEl.innerText.trim()) {
            author = authorEl.innerText.trim();
        } else if (ogTitle) {
            const match = ogTitle.match(/by\s+(.*?)\s+·/i);
            if (match && match[1]) author = match[1].trim();
        }

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

        let favorites = fallbackData.favorites ?? null;
        const favEl = doc.querySelector('#favorite-count') || doc.querySelector('[data-testid*="favorite-count"]');
        if (favEl) {
            const fText = favEl.innerText.replace(/[^\d]/g, "");
            if (fText) favorites = parseInt(fText, 10);
        }

        let mainImage = "";
        const ogImage = doc.querySelector('meta[property="og:image"]')?.content;
        if (ogImage) mainImage = getHdImageUrl(ogImage);
        if (!mainImage && fallbackData.image) mainImage = getHdImageUrl(fallbackData.image);

        const slugWords = slug.split("-").filter(Boolean);
        const signature = slugWords.slice(0, 3).join("-").toLowerCase();

        let productId = "";
        const idMatch = (mainImage || url).match(/(\d{6,10})/);
        if (idMatch) productId = idMatch[1];

        const gallerySet = new Set();
        if (mainImage) gallerySet.add(mainImage);

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

        if (gallerySet.size === 0 && fallbackData.gallery && Array.isArray(fallbackData.gallery)) {
            fallbackData.gallery.forEach(g => gallerySet.add(getHdImageUrl(g)));
        }

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

    async function fetchFullProductData(url, fallbackData = {}) {
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

    // Кнопка: Спарсить выбранные галочками
    scrapeSelectedBtn.addEventListener("click", async () => {
        if (!state.selectedCategory || !state.selectedCollection) {
            alert("Пожалуйста, сначала выберите категорию и подборку выше!");
            return;
        }

        if (!state.selectedProducts || state.selectedProducts.length === 0) {
            alert("Не выбрано ни одного товара галочками!");
            return;
        }

        const count = state.selectedProducts.length;
        scrapeSelectedBtn.disabled = true;
        scrapeSelectedBtn.innerText = `⏳ Сохранение ${count} товаров...`;

        try {
            let productsToSend = state.selectedProducts;

            if (state.mode === "full") {
                const fullProducts = [];
                for (let i = 0; i < state.selectedProducts.length; i++) {
                    const item = state.selectedProducts[i];
                    const label = item.slug ? item.slug.slice(0, 16) : `товар #${i+1}`;
                    scrapeSelectedBtn.innerHTML = `<span>⏳ [${i + 1}/${count}] ${label}...</span>`;
                    showToast(`[${i + 1}/${count}] Загрузка галереи: ${item.slug || ''}`);
                    const enriched = await fetchFullProductData(item.url, item);
                    fullProducts.push(enriched);
                }
                productsToSend = fullProducts;
                scrapeSelectedBtn.innerHTML = `<span>⏳ Сохранение ${count} в админку...</span>`;
            }

            const res = await fetch(`${state.apiUrl}/api/extension/add-batch`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    category: state.selectedCategory,
                    collection: state.selectedCollection,
                    products: productsToSend,
                    mode: state.mode,
                    position: state.position
                })
            });

            const data = await res.json();
            scrapeSelectedBtn.disabled = false;
            scrapeSelectedBtn.innerHTML = `<span>⚡ Спарсить выбранные (<span id="btnSelectedCountSpan">${count}</span> шт.)</span>`;

            if (res.ok && data.success) {
                showToast(`🎉 Спарсено ${data.addedCount} выбранных товаров!`);

                if (Array.isArray(data.addedSlugs) && data.addedSlugs.length > 0) {
                    state.lastAddedSlugs = data.addedSlugs;
                    await chrome.storage.local.set({ lastAddedSlugs: data.addedSlugs });
                    updateUndoUI();
                }

                // Сбрасываем выбранное для текущей подборки
                state.selectedProducts = [];
                const key = getBasketKey();
                if (key) collectionsBasket[key] = [];
                await chrome.storage.local.set({
                    selectedProducts: [],
                    collectionsBasket
                });
                selectionHistory = [ [] ];
                historyIndex = 0;
                renderSelectedProducts();
                updateUndoRedoUI();

                const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
                if (tab && tab.id) {
                    chrome.tabs.sendMessage(tab.id, { action: "CLEAR_ALL_SELECTED" }).catch(() => {});
                }

                await fetchCollectionStats();
                notifyContentScript();
            } else {
                showToast(data.error || "Ошибка сохранения товаров", 3500);
            }
        } catch (e) {
            scrapeSelectedBtn.disabled = false;
            scrapeSelectedBtn.innerHTML = `<span>⚡ Спарсить выбранные (<span id="btnSelectedCountSpan">${count}</span> шт.)</span>`;
            showToast("Сервер админки недоступен: " + e.message, 3500);
        }
    });

    // Кнопка: Спарсить текущий товар со страницы
    scrapeCurrentPageBtn.addEventListener("click", async () => {
        if (!state.selectedCategory || !state.selectedCollection) {
            alert("Пожалуйста, сначала выберите категорию и подборку выше!");
            return;
        }

        scrapeCurrentPageBtn.disabled = true;
        scrapeCurrentPageBtn.innerText = "⏳ Парсинг товара...";

        try {
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            if (!tab || !tab.id) return;

            chrome.tabs.sendMessage(tab.id, {
                action: "SCRAPE_CURRENT_PAGE",
                category: state.selectedCategory,
                collection: state.selectedCollection,
                mode: state.mode,
                position: state.position,
                apiUrl: state.apiUrl
            }, async (response) => {
                scrapeCurrentPageBtn.disabled = false;
                scrapeCurrentPageBtn.innerText = "🎯 Спарсить этот товар сейчас";

                if (response && response.success) {
                    showToast(`✅ "${response.title}" добавлен в подборку!`);
                    if (response.slug) {
                        state.lastAddedSlugs = [response.slug];
                        await chrome.storage.local.set({ lastAddedSlugs: [response.slug] });
                        updateUndoUI();
                    }
                    await fetchCollectionStats();
                } else {
                    showToast(response?.error || "Ошибка парсинга товара", 3500);
                }
            });
        } catch (e) {
            scrapeCurrentPageBtn.disabled = false;
            scrapeCurrentPageBtn.innerText = "🎯 Спарсить этот товар сейчас";
            showToast("Ошибка: " + e.message, 3500);
        }
    });

    // Кнопка: Отметить всё на экране (проставляем галочки, пропуская уже добавленные и снятые вручную)
    selectAllCardsBtn.addEventListener("click", async () => {
        selectAllCardsBtn.disabled = true;
        selectAllCardsBtn.innerText = "⏳ Отметка...";

        try {
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            if (!tab || !tab.id) return;

            chrome.tabs.sendMessage(tab.id, {
                action: "SELECT_ALL_VISIBLE"
            }, async (response) => {
                selectAllCardsBtn.disabled = false;
                selectAllCardsBtn.innerHTML = `<span>☑️ Отметить всё на экране</span>`;

                if (response && response.success) {
                    showToast(`☑️ Отмечено товаров: ${response.count}`);
                    if (Array.isArray(response.selectedProducts)) {
                        state.selectedProducts = response.selectedProducts;
                        await syncBasketToStorage();
                        pushSelectionHistory();
                        renderSelectedProducts();
                    }
                } else {
                    showToast(response?.error || "Не удалось отметить карточки", 3500);
                }
            });
        } catch (e) {
            selectAllCardsBtn.disabled = false;
            selectAllCardsBtn.innerHTML = `<span>☑️ Отметить всё на экране</span>`;
            showToast("Ошибка: " + e.message, 3500);
        }
    });

    // Кнопка: Снять все галочки
    deselectAllCardsBtn.addEventListener("click", async () => {
        state.selectedProducts = [];
        await syncBasketToStorage();
        pushSelectionHistory();
        renderSelectedProducts();

        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        if (tab && tab.id) {
            chrome.tabs.sendMessage(tab.id, {
                action: "CLEAR_ALL_SELECTED"
            }).catch(() => {});
        }
        showToast("Все галочки сняты");
    });

    // Кнопка: Отмена последнего добавления
    undoLastBatchBtn.addEventListener("click", async () => {
        if (!state.lastAddedSlugs || state.lastAddedSlugs.length === 0) return;
        if (!confirm(`Отменить добавление последних ${state.lastAddedSlugs.length} товаров из "${state.selectedCollection}"?`)) return;

        undoLastBatchBtn.disabled = true;
        undoLastBatchBtn.innerText = "⏳ Отмена...";

        try {
            const res = await fetch(`${state.apiUrl}/api/extension/undo-last`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    category: state.selectedCategory,
                    collection: state.selectedCollection,
                    slugs: state.lastAddedSlugs
                })
            });

            const data = await res.json();
            undoLastBatchBtn.disabled = false;

            if (res.ok && data.success) {
                showToast(`↩️ Удалено ${data.removedCount} случайно добавленных товаров!`);
                state.lastAddedSlugs = [];
                await chrome.storage.local.set({ lastAddedSlugs: [] });
                updateUndoUI();
                await fetchCollectionStats();
                notifyContentScript();
            } else {
                showToast(data.error || "Ошибка отмены", 3500);
            }
        } catch (e) {
            undoLastBatchBtn.disabled = false;
            showToast("Ошибка сервера: " + e.message, 3500);
        }
    });

    // Хелперы UI
    function updatePositionUI() {
        if (state.position === "top") {
            posTopBtn.classList.add("active");
            posBottomBtn.classList.remove("active");
        } else {
            posBottomBtn.classList.add("active");
            posTopBtn.classList.remove("active");
        }
    }

    async function saveState() {
        await chrome.storage.local.set({
            apiUrl: state.apiUrl,
            selectedCategory: state.selectedCategory,
            selectedCollection: state.selectedCollection,
            mode: state.mode,
            position: state.position
        });
        notifyContentScript();
    }

    function notifyContentScript() {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            if (tabs[0] && tabs[0].id) {
                chrome.tabs.sendMessage(tabs[0].id, {
                    action: "STATE_UPDATED",
                    ...state
                }).catch(() => {});
            }
        });
    }

    async function smartPingAdmin(baseUrl, timeoutMs = 2000) {
        const cleanUrl = baseUrl.replace(/\/+$/, "");

        // 1. Быстрый пинг текущего URL (/api/health)
        try {
            const controller = new AbortController();
            const timer = setTimeout(() => controller.abort(), timeoutMs);
            const res = await fetch(`${cleanUrl}/api/health`, { signal: controller.signal });
            clearTimeout(timer);
            if (res.ok) return { ok: true, activeUrl: cleanUrl };
        } catch {}

        // 2. Умный автоматический фоллбек: localhost <-> 127.0.0.1
        let altUrl = null;
        if (cleanUrl.includes("localhost")) {
            altUrl = cleanUrl.replace("localhost", "127.0.0.1");
        } else if (cleanUrl.includes("127.0.0.1")) {
            altUrl = cleanUrl.replace("127.0.0.1", "localhost");
        }

        if (altUrl) {
            try {
                const controller = new AbortController();
                const timer = setTimeout(() => controller.abort(), timeoutMs);
                const res = await fetch(`${altUrl}/api/health`, { signal: controller.signal });
                clearTimeout(timer);
                if (res.ok) return { ok: true, activeUrl: altUrl };
            } catch {}
        }

        // 3. Резервный пинг корня
        try {
            const controller = new AbortController();
            const timer = setTimeout(() => controller.abort(), 1200);
            const res = await fetch(cleanUrl, { signal: controller.signal });
            clearTimeout(timer);
            if (res.ok || res.status < 500) return { ok: true, activeUrl: cleanUrl };
        } catch {}

        return { ok: false, activeUrl: cleanUrl };
    }

    async function checkServerAndLoadCategories() {
        statusBadge.className = "status-badge status-checking";
        statusText.innerText = "Проверка...";

        const ping = await smartPingAdmin(state.apiUrl);
        if (ping.ok) {
            if (ping.activeUrl !== state.apiUrl) {
                state.apiUrl = ping.activeUrl;
                apiUrlInput.value = ping.activeUrl;
                await chrome.storage.local.set({ apiUrl: ping.activeUrl });
            }
            statusBadge.className = "status-badge status-connected";
            statusText.innerText = "Подключено";
        }

        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 7000);
            const res = await fetch(`${state.apiUrl}/api/categories`, { signal: controller.signal });
            clearTimeout(timeoutId);

            if (!res.ok) throw new Error("HTTP " + res.status);
            categoriesData = await res.json();
            await chrome.storage.local.set({ cachedCategoriesData: categoriesData });

            statusBadge.className = "status-badge status-connected";
            statusText.innerText = "Подключено";

            populateCategories();
            if (state.selectedCategory && state.selectedCollection) {
                await fetchCollectionStats();
            }
        } catch (e) {
            if (!ping.ok) {
                statusBadge.className = "status-badge status-disconnected";
                statusText.innerText = "Офлайн";
            }
            // ВАЖНО: Если данные уже есть (из кэша или прошлого запроса), НЕ очищаем и НЕ отключаем интерфейс!
            if (!categoriesData || categoriesData.length === 0) {
                categorySelect.innerHTML = `<option value="">Админка офлайн (${state.apiUrl})</option>`;
                collectionSelect.innerHTML = `<option value="">Нажмите "Запустить" вверху</option>`;
                categorySelect.disabled = true;
                collectionSelect.disabled = true;
            }
        }
    }

    async function checkServicePing(url, timeoutMs = 700) {
        try {
            const controller = new AbortController();
            const timer = setTimeout(() => controller.abort(), timeoutMs);
            await fetch(url, { signal: controller.signal, mode: "no-cors" });
            clearTimeout(timer);
            return true;
        } catch {
            return false;
        }
    }

    async function checkAllServicesStatus() {
        if (refreshServicesBtn) refreshServicesBtn.classList.add("rotating");

        // 1. Опрашиваем админку (3333) или студию (3001) через API
        let statusData = null;
        try {
            const controller = new AbortController();
            const timer = setTimeout(() => controller.abort(), 1200);
            const res = await fetch(`${state.apiUrl}/api/services/status`, { signal: controller.signal });
            clearTimeout(timer);
            if (res.ok) statusData = await res.json();
        } catch {}

        if (!statusData) {
            try {
                const controller = new AbortController();
                const timer = setTimeout(() => controller.abort(), 1200);
                const res = await fetch("http://localhost:3001/api/services/status", { signal: controller.signal });
                clearTimeout(timer);
                if (res.ok) statusData = await res.json();
            } catch {}
        }

        if (statusData) {
            servicesState.admin = !!statusData.admin?.running;
            servicesState.site = !!statusData.site?.running;
            servicesState.manager = !!statusData.manager?.running;
        } else {
            // Прямой пинг каждого сервиса
            const [adminPing, sitePing, managerPing] = await Promise.all([
                checkServicePing(`${state.apiUrl}/api/health`),
                checkServicePing("http://localhost:4321/"),
                checkServicePing("http://localhost:3001/")
            ]);
            servicesState.admin = adminPing;
            servicesState.site = sitePing;
            servicesState.manager = managerPing;
        }

        updateServicesUI();
        if (refreshServicesBtn) {
            setTimeout(() => refreshServicesBtn.classList.remove("rotating"), 350);
        }
    }

    function updateServicesUI() {
        // 1. Админка (:3333)
        if (dotAdmin && openAdminBtnRow && startAdminBtn) {
            if (servicesState.admin) {
                dotAdmin.className = "service-status-dot online";
                dotAdmin.title = "Онлайн (:3333)";
                openAdminBtnRow.classList.remove("hidden");
                startAdminBtn.classList.add("hidden");
            } else {
                dotAdmin.className = "service-status-dot offline";
                dotAdmin.title = "Офлайн (:3333)";
                openAdminBtnRow.classList.add("hidden");
                startAdminBtn.classList.remove("hidden");
                startAdminBtn.disabled = false;
                startAdminBtn.innerText = "Запустить";
            }
        }

        // 2. Локальный сайт (:4321)
        if (dotSite && openSiteBtn && startSiteBtn) {
            if (servicesState.site) {
                dotSite.className = "service-status-dot online";
                dotSite.title = "Онлайн (:4321)";
                openSiteBtn.classList.remove("hidden");
                startSiteBtn.classList.add("hidden");
            } else {
                dotSite.className = "service-status-dot offline";
                dotSite.title = "Офлайн (:4321)";
                openSiteBtn.classList.add("hidden");
                startSiteBtn.classList.remove("hidden");
                startSiteBtn.disabled = false;
                startSiteBtn.innerText = "Запустить";
            }
        }

        // 3. Менеджер тегов & Студия (:3001)
        if (dotManager && openManagerBtn && startManagerBtn) {
            if (servicesState.manager) {
                dotManager.className = "service-status-dot online";
                dotManager.title = "Онлайн (:3001)";
                openManagerBtn.classList.remove("hidden");
                startManagerBtn.classList.add("hidden");
            } else {
                dotManager.className = "service-status-dot offline";
                dotManager.title = "Офлайн (:3001)";
                openManagerBtn.classList.add("hidden");
                startManagerBtn.classList.remove("hidden");
                startManagerBtn.disabled = false;
                startManagerBtn.innerText = "Запустить";
            }
        }

        // Мастер-кнопка "Включить все сервисы"
        if (startAllServicesBtn && startAllBtnText) {
            const allOnline = servicesState.admin && servicesState.site && servicesState.manager;
            if (allOnline) {
                startAllBtnText.innerText = "✅ Все 3 сервиса работают";
                startAllServicesBtn.style.background = "linear-gradient(135deg, #10b981 0%, #059669 100%)";
            } else {
                startAllBtnText.innerText = "⚡ Включить все сервисы";
                startAllServicesBtn.style.background = "";
            }
        }
    }

    async function launchService(serviceName, btnEl = null) {
        if (btnEl) {
            btnEl.disabled = true;
            btnEl.innerText = "Запуск...";
        }

        let launched = false;
        const endpoints = [
            `${state.apiUrl}/api/services/start`,
            "http://127.0.0.1:3333/api/services/start",
            "http://localhost:3001/api/services/start"
        ];

        for (const ep of endpoints) {
            try {
                const controller = new AbortController();
                const timer = setTimeout(() => controller.abort(), 2000);
                const res = await fetch(ep, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ service: serviceName }),
                    signal: controller.signal
                });
                clearTimeout(timer);
                if (res.ok) {
                    launched = true;
                    break;
                }
            } catch {}
        }

        if (!launched) {
            showToast("Сервер выключен. Запустите ./start_all_mac.sh или START_ALL.bat", 4000);
            if (btnEl) {
                btnEl.disabled = false;
                btnEl.innerText = "Запустить";
            }
            return;
        }

        showToast(`Запуск: ${serviceName}... Ожидание готовности`);
        // Опрашиваем статусы до 7 секунд
        for (let i = 0; i < 7; i++) {
            await new Promise(r => setTimeout(r, 1000));
            await checkAllServicesStatus();
            if (serviceName === "all" && servicesState.admin && servicesState.site && servicesState.manager) break;
            if (serviceName === "site" && servicesState.site) break;
            if (serviceName === "manager" && servicesState.manager) break;
            if (serviceName === "admin" && servicesState.admin) break;
        }
        await checkServerAndLoadCategories();
    }

    async function handleGitPushAll() {
        if (!gitPushAllBtn) return;
        gitPushAllBtn.disabled = true;
        if (gitPushBtnText) gitPushBtnText.innerText = "⏳ Синхронизация (Artify + Studio)...";

        if (pushLogBox) pushLogBox.classList.remove("hidden");
        if (pushLogTitle) pushLogTitle.innerText = "🚀 Синхронизация с GitHub...";
        if (pushLogContent) pushLogContent.innerText = "Запуск sync_push.py...\nПодтягиваем изменения и отправляем в artify-studio и Managers-Pinterest...";

        let pushRes = null;
        const pushEndpoints = [
            `${state.apiUrl}/api/git/push-all`,
            "http://127.0.0.1:3333/api/git/push-all",
            "http://localhost:3001/api/git/push"
        ];

        for (const ep of pushEndpoints) {
            try {
                const controller = new AbortController();
                const timer = setTimeout(() => controller.abort(), 120000);
                const res = await fetch(ep, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ message: "" }),
                    signal: controller.signal
                });
                clearTimeout(timer);
                if (res.ok) {
                    pushRes = await res.json();
                    break;
                }
            } catch {}
        }

        if (pushRes && pushRes.success) {
            if (pushLogTitle) pushLogTitle.innerText = "✅ Успешно синхронизировано на GitHub!";
            if (pushLogContent) pushLogContent.innerText = pushRes.output || "ВСЁ ГОТОВО! Оба репозитория успешно обновлены на GitHub!";
            if (gitPushBtnText) gitPushBtnText.innerText = "✅ Запушено на GitHub!";
            showToast("🎉 Оба репозитория успешно синхронизированы на GitHub!", 4000);
            setTimeout(() => {
                if (gitPushBtnText) gitPushBtnText.innerText = "Запушить всё на GitHub (2 репозитория)";
                gitPushAllBtn.disabled = false;
            }, 5000);
        } else {
            if (pushLogTitle) pushLogTitle.innerText = "⚠️ Внимание / Ошибка при отправке:";
            if (pushLogContent) pushLogContent.innerText = pushRes ? (pushRes.output || pushRes.error) : "Не удалось связаться с сервером для выполнения пуша. Убедитесь, что админка запущена.";
            if (gitPushBtnText) gitPushBtnText.innerText = "⚠️ Ошибка пуша (см. лог)";
            gitPushAllBtn.disabled = false;
        }
    }

    function populateCategories() {
        categorySelect.disabled = false;
        categorySelect.innerHTML = '<option value="">-- Выберите категорию --</option>';

        categoriesData.forEach(cat => {
            const catId = cat.id || cat.category;
            const opt = document.createElement("option");
            opt.value = catId;
            opt.innerText = `${cat.title || catId} (${cat.collections ? cat.collections.length : 0})`;
            if (catId === state.selectedCategory) {
                opt.selected = true;
            }
            categorySelect.appendChild(opt);
        });

        if (state.selectedCategory) {
            populateCollections();
        }
    }

    function populateCollections() {
        const cat = categoriesData.find(c => (c.id || c.category) === state.selectedCategory);
        if (!cat || !Array.isArray(cat.collections) || cat.collections.length === 0) {
            collectionSelect.innerHTML = '<option value="">Нет подборок в категории</option>';
            collectionSelect.disabled = true;
            colStatsBar.classList.add("hidden");
            return;
        }

        collectionSelect.disabled = false;
        collectionSelect.innerHTML = '<option value="">-- Выберите подборку --</option>';

        cat.collections.forEach(col => {
            const colVal = col.slug || col.name || col.collection;
            const opt = document.createElement("option");
            opt.value = colVal;
            const countStr = col.count !== undefined ? ` (${col.count})` : '';
            opt.innerText = `${col.title || colVal}${countStr}`;
            if (colVal === state.selectedCollection) {
                opt.selected = true;
            }
            collectionSelect.appendChild(opt);
        });

        if (state.selectedCollection) {
            fetchCollectionStats();
        }
    }

    async function fetchCollectionStats() {
        await updateUniversalHydrateBtnUI();

        if (!state.selectedCategory || !state.selectedCollection) {
            colStatsBar.classList.add("hidden");
            return;
        }

        try {
            const res = await fetch(`${state.apiUrl}/api/extension/status?category=${state.selectedCategory}&collection=${state.selectedCollection}`);
            if (res.ok) {
                const data = await res.json();
                const total = data.count || 0;
                totalCountSpan.innerText = total;
                colStatsBar.classList.remove("hidden");
            }
        } catch {}
    }

    let isHydrating = false;

    async function updateUniversalHydrateBtnUI() {
        if (!universalHydrateBtn) return;

        chrome.runtime.sendMessage({ action: "GET_HYDRATION_STATUS" }, (res) => {
            if (res && res.state && res.state.isRunning) {
                isHydrating = true;
                universalHydrateBtn.disabled = true;
                universalHydrateBtn.innerHTML = `<span>⏳ [${res.state.current}/${res.state.total}] ${(res.state.slug || "").slice(0, 16)}...</span>`;
            }
        });
        if (isHydrating) return;

        const cat = state.selectedCategory || "";
        const col = state.selectedCollection || "";

        try {
            const params = new URLSearchParams();
            if (cat) params.set("category", cat);
            if (col) params.set("collection", col);

            const res = await fetch(`${state.apiUrl}/api/extension/incomplete-products?${params.toString()}`);
            if (!res.ok) throw new Error("HTTP " + res.status);
            const data = await res.json();

            const count = data.totalIncomplete || 0;
            const scope = data.scope; // "all", "category", "collection"

            if (scope === "all") {
                if (count > 0) {
                    universalHydrateBtn.disabled = false;
                    universalHydrateBtn.style.opacity = "1";
                    universalHydrateBtn.style.cursor = "pointer";
                    universalHydrateBtn.innerHTML = `<span>🔄 Допарсить всё на сайте (${count} товаров)</span>`;
                    universalHydrateBtn.title = `Найдено ${count} товаров с неполной информацией на всём сайте. Нажмите для допарсинга.`;
                } else {
                    universalHydrateBtn.disabled = true;
                    universalHydrateBtn.style.opacity = "0.6";
                    universalHydrateBtn.style.cursor = "default";
                    universalHydrateBtn.innerHTML = `<span>✅ Все товары на сайте заполнены (0)</span>`;
                    universalHydrateBtn.title = `На сайте нет товаров с неполной информацией`;
                }
            } else if (scope === "category") {
                const catObj = categoriesData.find(c => (c.id || c.category) === cat);
                const catTitle = catObj?.title || cat;
                if (count > 0) {
                    universalHydrateBtn.disabled = false;
                    universalHydrateBtn.style.opacity = "1";
                    universalHydrateBtn.style.cursor = "pointer";
                    universalHydrateBtn.innerHTML = `<span>🔄 Допарсить категорию "${catTitle}" (${count} товаров)</span>`;
                    universalHydrateBtn.title = `В категории "${catTitle}" не заполнено ${count} товаров. Нажмите для допарсинга.`;
                } else {
                    universalHydrateBtn.disabled = true;
                    universalHydrateBtn.style.opacity = "0.6";
                    universalHydrateBtn.style.cursor = "default";
                    universalHydrateBtn.innerHTML = `<span>✅ В категории все товары заполнены (0)</span>`;
                    universalHydrateBtn.title = `В категории "${catTitle}" все товары уже с полной информацией`;
                }
            } else {
                const catObj = categoriesData.find(c => (c.id || c.category) === cat);
                const colObj = (catObj?.collections || []).find(c => (c.slug || c.name || c.collection) === col);
                const colTitle = colObj?.title || col;
                if (count > 0) {
                    universalHydrateBtn.disabled = false;
                    universalHydrateBtn.style.opacity = "1";
                    universalHydrateBtn.style.cursor = "pointer";
                    universalHydrateBtn.innerHTML = `<span>🔄 Допарсить подборку "${colTitle}" (${count} товаров)</span>`;
                    universalHydrateBtn.title = `В подборке "${colTitle}" не заполнено ${count} товаров. Нажмите для допарсинга.`;
                } else {
                    universalHydrateBtn.disabled = true;
                    universalHydrateBtn.style.opacity = "0.6";
                    universalHydrateBtn.style.cursor = "default";
                    universalHydrateBtn.innerHTML = `<span>✅ В подборке все товары заполнены (0)</span>`;
                    universalHydrateBtn.title = `В подборке "${colTitle}" все товары уже с полной информацией`;
                }
            }
        } catch (e) {
            universalHydrateBtn.disabled = true;
            universalHydrateBtn.style.opacity = "0.6";
            universalHydrateBtn.innerHTML = `<span>🔄 Допарсить товары</span>`;
            universalHydrateBtn.title = `Проверьте адрес админки: ${state.apiUrl}`;
        }
    }

    universalHydrateBtn.addEventListener("click", () => {
        if (isHydrating) return;
        const cat = state.selectedCategory || "";
        const col = state.selectedCollection || "";

        isHydrating = true;
        universalHydrateBtn.disabled = true;
        universalHydrateBtn.innerHTML = `<span>⏳ Запуск в фоне...</span>`;

        chrome.runtime.sendMessage({
            action: "START_BATCH_HYDRATION",
            category: cat,
            collection: col,
            apiUrl: state.apiUrl
        }, (res) => {
            if (res && res.started) {
                showToast(`⚡ Допарсинг запущен в фоне (${res.state?.total || ''} товаров)...`);
                if (res.state && res.state.total) {
                    universalHydrateBtn.innerHTML = `<span>⏳ [1/${res.state.total}] Запуск...</span>`;
                }
            } else if (res && res.alreadyRunning) {
                showToast("⏳ Допарсинг уже выполняется в фоне!");
                if (res.state) {
                    universalHydrateBtn.innerHTML = `<span>⏳ [${res.state.current}/${res.state.total}] ${(res.state.slug || "").slice(0, 16)}...</span>`;
                }
            } else {
                isHydrating = false;
                updateUniversalHydrateBtnUI();
            }
        });
    });

    chrome.runtime.onMessage.addListener((msg) => {
        if (msg.type === "HYDRATE_PROGRESS") {
            if (universalHydrateBtn) {
                universalHydrateBtn.disabled = true;
                universalHydrateBtn.innerHTML = `<span>⏳ [${msg.current}/${msg.total}] ${(msg.slug || "").slice(0, 16)}...</span>`;
            }
        }
        if (msg.type === "HYDRATE_COMPLETE") {
            showToast(`🎉 Готово! Допарсено: ${msg.successCount || 0} товаров!`, 3500);
            isHydrating = false;
            updateUniversalHydrateBtnUI();
            fetchCollectionStats();
            notifyContentScript();
        }
    });

    async function checkActiveTab() {
        try {
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            if (!tab || !tab.id) return;

            const url = tab.url || "";
            const isCF = url.includes("creativefabrica.com");
            const urlLooksProduct = isCF && url.includes("/product/") && !url.endsWith("/product/");

            // Пытаемся получить живую информацию со скрипта страницы
            chrome.tabs.sendMessage(tab.id, { action: "GET_PAGE_INFO" }, (pageInfo) => {
                const isProductPage = Boolean(pageInfo?.isProductPage || urlLooksProduct);

                if (Array.isArray(pageInfo?.selectedProducts) && pageInfo.selectedProducts.length > 0) {
                    state.selectedProducts = pageInfo.selectedProducts;
                    chrome.storage.local.set({ selectedProducts: state.selectedProducts });
                    renderSelectedProducts();
                }

                if (isProductPage) {
                    scrapeCurrentPageBtn.disabled = false;
                    scrapeCurrentPageBtn.classList.add("pulse");
                    const titleText = pageInfo?.title || "Этот товар";
                    const shortTitle = titleText.length > 24 ? titleText.slice(0, 24) + "..." : titleText;
                    scrapeCurrentPageBtn.innerHTML = `<span>🎯 Спарсить: "${shortTitle}"</span>`;
                    scrapeCurrentPageBtn.title = "Нажмите, чтобы добавить данный товар в выбранную подборку";
                } else {
                    scrapeCurrentPageBtn.disabled = true;
                    scrapeCurrentPageBtn.classList.remove("pulse");
                    scrapeCurrentPageBtn.innerHTML = `<span>🎯 Спарсить этот товар сейчас (только на странице товара)</span>`;
                    scrapeCurrentPageBtn.title = "Перейдите на страницу отдельного товара (/product/...), чтобы спарсить его целиком";
                }

                if (isCF && !isProductPage) {
                    selectAllCardsBtn.disabled = false;
                } else {
                    selectAllCardsBtn.disabled = true;
                }
                deselectAllCardsBtn.disabled = (state.selectedProducts || []).length === 0;
            });
        } catch (e) {
            console.warn("checkActiveTab error:", e);
        }
    }
});
