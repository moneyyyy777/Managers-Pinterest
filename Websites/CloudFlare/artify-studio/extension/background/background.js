// extension/background/background.js

let hydrationState = {
    isRunning: false,
    current: 0,
    total: 0,
    slug: "",
    title: "",
    category: "",
    collection: "",
    successCount: 0,
    errorCount: 0
};
let hydrationStopRequested = false;

chrome.runtime.onInstalled.addListener(() => {
    console.log("[Artify Clipper] Расширение установлено/обновлено успешно!");
    chrome.storage.local.get(["apiUrl", "mode", "position"], (res) => {
        if (!res.apiUrl) chrome.storage.local.set({ apiUrl: "http://localhost:3333" });
        // Всегда форсируем полный режим парсинга
        chrome.storage.local.set({ mode: "full" });
        if (!res.position) chrome.storage.local.set({ position: "top" });
    });
});

function getSlugFromUrl(url) {
    if (!url) return "";
    try {
        const u = new URL(url);
        const parts = u.pathname.split("/").filter(Boolean);
        const pIndex = parts.indexOf("product");
        if (pIndex !== -1 && parts[pIndex + 1]) {
            return parts[pIndex + 1].toLowerCase();
        }
        return parts[parts.length - 1]?.toLowerCase() || "";
    } catch {
        const m = url.match(/\/product\/([^\/?#]+)/i);
        return m ? m[1].toLowerCase() : "";
    }
}

// Отправка сообщения во вкладку с повторными попытками
function sendTabMessageWithRetry(tabId, message, maxRetries = 12, interval = 300) {
    return new Promise((resolve, reject) => {
        let attempts = 0;
        function trySend() {
            attempts++;
            chrome.tabs.sendMessage(tabId, message, (response) => {
                const err = chrome.runtime.lastError;
                if (!err && response) {
                    resolve(response);
                } else if (attempts < maxRetries) {
                    setTimeout(trySend, interval);
                } else {
                    reject(new Error(err ? err.message : "No response from tab"));
                }
            });
        }
        trySend();
    });
}

// Фоновый скрейпинг карточки через реальную вкладку браузера (обход Cloudflare 100%)
async function scrapeProductPageViaTab(url, fallbackData = {}) {
    return new Promise((resolve) => {
        let tabId = null;
        let timeoutId = null;
        let resolved = false;

        const cleanup = () => {
            if (timeoutId) clearTimeout(timeoutId);
            if (tabId) {
                chrome.tabs.remove(tabId, () => {
                    if (chrome.runtime.lastError) { /* ignore */ }
                });
            }
        };

        const finish = (result) => {
            if (resolved) return;
            resolved = true;
            cleanup();
            resolve(result);
        };

        // Защитный таймаут 30 сек
        timeoutId = setTimeout(() => {
            console.warn("[Background Scraper] Timeout scraping:", url);
            finish({
                ...fallbackData,
                url,
                slug: fallbackData.slug || getSlugFromUrl(url),
                image: fallbackData.image || "",
                gallery: Array.isArray(fallbackData.gallery) && fallbackData.gallery.length > 0 
                    ? fallbackData.gallery 
                    : [fallbackData.image].filter(Boolean),
                isDraft: false,
                deepParsed: false
            });
        }, 30000);

        chrome.tabs.create({ url, active: false }, (tab) => {
            if (chrome.runtime.lastError || !tab) {
                console.warn("[Background Scraper] Failed to create tab:", chrome.runtime.lastError);
                finish({ ...fallbackData, url });
                return;
            }
            tabId = tab.id;

            const onUpdatedListener = (updatedTabId, changeInfo) => {
                if (updatedTabId === tabId && changeInfo.status === "complete") {
                    // Даем странице 500мс на инициализацию скриптов
                    setTimeout(async () => {
                        try {
                            const res = await sendTabMessageWithRetry(tabId, {
                                action: "DO_FULL_DOM_EXTRACTION",
                                fallbackData
                            }, 12, 350);

                            if (res && res.isCloudflare) {
                                console.warn("[Background Scraper] Cloudflare check detected on:", url);
                                // Активируем вкладку, чтобы пользователь мог подтвердить капчу
                                chrome.tabs.update(tabId, { active: true });
                                return;
                            }

                            chrome.tabs.onUpdated.removeListener(onUpdatedListener);
                            if (res && res.success && res.data) {
                                finish(res.data);
                            } else {
                                finish({ ...fallbackData, url });
                            }
                        } catch (err) {
                            console.warn("[Background Scraper] Tab extraction error:", err.message);
                            chrome.tabs.onUpdated.removeListener(onUpdatedListener);
                            finish({ ...fallbackData, url });
                        }
                    }, 500);
                }
            };

            chrome.tabs.onUpdated.addListener(onUpdatedListener);
        });
    });
}

// Запуск фоновой пакетной гидратации неполных товаров
async function runBatchHydration({ category = "", collection = "", apiUrl = "http://localhost:3333" }) {
    if (hydrationState.isRunning) {
        return { started: false, alreadyRunning: true, state: hydrationState };
    }

    hydrationState = {
        isRunning: true,
        current: 0,
        total: 0,
        slug: "",
        title: "",
        category,
        collection,
        successCount: 0,
        errorCount: 0
    };
    hydrationStopRequested = false;

    // Фоновое выполнение
    (async () => {
        try {
            const params = new URLSearchParams();
            if (category) params.set("category", category);
            if (collection) params.set("collection", collection);

            const res = await fetch(`${apiUrl}/api/extension/incomplete-products?${params.toString()}`);
            if (!res.ok) throw new Error("HTTP " + res.status);
            const data = await res.json();
            const items = data.items || [];

            hydrationState.total = items.length;

            if (items.length === 0) {
                chrome.runtime.sendMessage({
                    type: "HYDRATE_COMPLETE",
                    successCount: 0,
                    total: 0,
                    message: "Все товары уже полностью заполнены!"
                }).catch(() => {});
                hydrationState.isRunning = false;
                return;
            }

            for (let i = 0; i < items.length; i++) {
                if (hydrationStopRequested) {
                    console.log("[Background Hydrator] Остановлено по запросу пользователя.");
                    break;
                }

                const item = items[i];
                hydrationState.current = i + 1;
                hydrationState.slug = item.slug || "";
                hydrationState.title = item.title || item.slug || "";

                // Оповещаем все страницы и попап о прогрессе
                chrome.runtime.sendMessage({
                    type: "HYDRATE_PROGRESS",
                    ...hydrationState
                }).catch(() => {});

                // Обновляем бейдж на иконке расширения
                chrome.action.setBadgeText({ text: `${i + 1}/${items.length}` });
                chrome.action.setBadgeBackgroundColor({ color: "#ec4899" }); // Розовый

                try {
                    const enriched = await scrapeProductPageViaTab(item.url, item);
                    enriched.isDraft = false;
                    enriched.deepParsed = true;

                    await fetch(`${apiUrl}/api/extension/add-batch`, {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                            category: item.category,
                            collection: item.collection,
                            products: [{ ...enriched, preservePosition: true }],
                            mode: "full",
                            position: "preserve"
                        })
                    });

                    hydrationState.successCount++;
                } catch (itemErr) {
                    console.error("[Background Hydrator] Ошибка для товара:", item.slug, itemErr);
                    hydrationState.errorCount++;
                }

                // Небольшая пауза между вкладками
                await new Promise(r => setTimeout(r, 300));
            }

            // Завершено
            chrome.action.setBadgeText({ text: "✓" });
            chrome.action.setBadgeBackgroundColor({ color: "#10b981" });
            setTimeout(() => chrome.action.setBadgeText({ text: "" }), 5000);

            chrome.runtime.sendMessage({
                type: "HYDRATE_COMPLETE",
                ...hydrationState
            }).catch(() => {});

        } catch (err) {
            console.error("[Background Hydrator] Фатальная ошибка:", err);
            chrome.runtime.sendMessage({
                type: "HYDRATE_ERROR",
                error: err.message
            }).catch(() => {});
        } finally {
            hydrationState.isRunning = false;
        }
    })();

    return { started: true, state: hydrationState };
}

// Слушаем сообщения от контентного скрипта или попапа
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === "UPDATE_BADGE") {
        if (message.count !== undefined) {
            chrome.action.setBadgeText({ text: message.count > 0 ? String(message.count) : "" });
            chrome.action.setBadgeBackgroundColor({ color: "#8b5cf6" }); // Фиолетовый
        }
        sendResponse({ success: true });
        return true;
    }

    if (message.type === "OPEN_ADMIN") {
        const url = message.url || "http://localhost:3333";
        chrome.tabs.create({ url });
        sendResponse({ success: true });
        return true;
    }

    // Скрейпинг одного товара через фоновую вкладку
    if (message.type === "SCRAPE_FULL_PRODUCT_VIA_TAB" || message.action === "SCRAPE_FULL_PRODUCT_VIA_TAB") {
        const url = message.url;
        const fallbackData = message.fallbackData || {};
        scrapeProductPageViaTab(url, fallbackData).then((data) => {
            sendResponse({ success: true, data });
        }).catch((err) => {
            sendResponse({ success: false, error: err.message, data: fallbackData });
        });
        return true; // асинхронный ответ
    }

    // Запуск фоновой пакетной гидратации
    if (message.type === "START_BATCH_HYDRATION" || message.action === "START_BATCH_HYDRATION") {
        runBatchHydration({
            category: message.category || "",
            collection: message.collection || "",
            apiUrl: message.apiUrl || "http://localhost:3333"
        }).then((res) => {
            sendResponse(res);
        });
        return true;
    }

    // Остановка пакетной гидратации
    if (message.type === "STOP_BATCH_HYDRATION" || message.action === "STOP_BATCH_HYDRATION") {
        hydrationStopRequested = true;
        sendResponse({ success: true });
        return true;
    }

    // Проверка текущего статуса гидратации
    if (message.type === "GET_HYDRATION_STATUS" || message.action === "GET_HYDRATION_STATUS") {
        sendResponse({ success: true, state: hydrationState });
        return true;
    }
});
