import http from "node:http";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { exec, spawn } from "node:child_process";
import { promisify } from "node:util";
import net from "node:net";

const execAsync = promisify(exec);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, "../..");
const WORKSPACE_ROOT = path.resolve(PROJECT_ROOT, "../../..");
const CONTENT_DIR = path.join(PROJECT_ROOT, "content");
const HTML_FILE = path.join(__dirname, "index.html");
const PORT = 3333;
const CATEGORIES_FILE = path.join(PROJECT_ROOT, "src", "data", "categories.json");

function checkPortOpen(port, host = "127.0.0.1", timeoutMs = 600) {
    return new Promise((resolve) => {
        const socket = new net.Socket();
        socket.setTimeout(timeoutMs);
        socket.on("connect", () => {
            socket.destroy();
            resolve(true);
        });
        socket.on("error", () => {
            socket.destroy();
            resolve(false);
        });
        socket.on("timeout", () => {
            socket.destroy();
            resolve(false);
        });
        socket.connect(port, host);
    });
}

async function readCategoriesJson() {
    try {
        const raw = await fs.readFile(CATEGORIES_FILE, "utf8");
        return JSON.parse(raw);
    } catch {
        return [];
    }
}

async function writeCategoriesJson(cats) {
    await fs.writeFile(CATEGORIES_FILE, JSON.stringify(cats, null, 2), "utf8");
}

const normalizeProductUrl = (rawUrl) => {
    try {
        const u = new URL(rawUrl.trim());
        let pathname = u.pathname;
        if (!pathname.endsWith("/")) pathname += "/";
        return `${u.origin}${pathname}`;
    } catch {
        return rawUrl.trim();
    }
};

const getSlugFromUrl = (url) => {
    const parts = url.split("/").filter(Boolean);
    return parts[parts.length - 1];
};

async function fetchCfPreview(productUrl) {
    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 6000);
        const resp = await fetch(productUrl, {
            headers: {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
                "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8"
            },
            signal: controller.signal
        });
        clearTimeout(timeoutId);
        if (!resp.ok) return { title: "", image: "" };
        const html = await resp.text();

        // Извлекаем og:title или <title>
        let title = "";
        const ogTitleMatch = html.match(/<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)["']/i)
            || html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:title["']/i);
        if (ogTitleMatch) {
            title = ogTitleMatch[1];
        } else {
            const titleTagMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
            if (titleTagMatch) {
                title = titleTagMatch[1].replace(/\|\s*Creative\s*Fabrica.*/i, '').trim();
            }
        }

        // Извлекаем og:image
        let image = "";
        const ogImageMatch = html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i)
            || html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i);
        if (ogImageMatch) {
            image = ogImageMatch[1];
        } else {
            const linkImageMatch = html.match(/<link[^>]+rel=["']image_src["'][^>]+href=["']([^"']+)["']/i);
            if (linkImageMatch) image = linkImageMatch[1];
        }

        // Извлекаем лайки / favorites (Added to favorites)
        let favorites = null;
        let favoritesRaw = "";
        const favMatch = html.match(/id=["']favorite-count["'][^>]*>([^<]+)<\/span>/i)
            || html.match(/class=["'][^"']*favorite-count[^"']*["'][^>]*>([^<]+)<\/span>/i)
            || html.match(/(\d+(?:\.\d+)?[kK]?X?)\s*Added to favorites/i);

        if (favMatch) {
            favoritesRaw = favMatch[1].trim();
            let numStr = favoritesRaw.replace(/X$/i, "").trim();
            if (/k$/i.test(numStr)) {
                favorites = Math.round(parseFloat(numStr) * 1000);
            } else {
                const n = parseInt(numStr, 10);
                favorites = isNaN(n) ? null : n;
            }
        }

        // Извлекаем Designer tags
        const designerTags = [];
        const designerTagLinks = [];
        const tagMatches = html.matchAll(/href=["'](https?:\/\/(?:www\.)?creativefabrica\.com\/tag\/[^"']+)["'][^>]*>\s*([^<]+?)\s*<\/a>/gi);
        const seenTags = new Set();
        for (const m of tagMatches) {
            const url = m[1].trim();
            const name = m[2].trim();
            if (name && !seenTags.has(name)) {
                seenTags.add(name);
                designerTags.push(name);
                designerTagLinks.push({ name, url });
            }
        }

        return { 
            title, 
            image, 
            favorites, 
            favoritesRaw: favoritesRaw || null, 
            designerTags, 
            designerTagLinks 
        };
    } catch (e) {
        return { 
            title: "", 
            image: "", 
            favorites: null, 
            favoritesRaw: null, 
            designerTags: [], 
            designerTagLinks: [] 
        };
    }
}

function appendToDeleteLinks(existingText, sectionHeader, urls) {
    if (!urls || urls.length === 0) return existingText;
    
    if (existingText.includes(sectionHeader)) {
        const parts = existingText.split(sectionHeader);
        const before = parts[0];
        const afterAll = parts[1] || "";
        const nextSectionMatch = afterAll.match(/\n(--- [^\n]+ ---)/);
        let currentSectionBody = afterAll;
        let restOfFile = "";
        if (nextSectionMatch && nextSectionMatch.index !== undefined) {
            currentSectionBody = afterAll.substring(0, nextSectionMatch.index);
            restOfFile = afterAll.substring(nextSectionMatch.index);
        }
        const links = currentSectionBody.split("\n").map(l => l.trim()).filter(Boolean);
        for (const u of urls) {
            if (!links.includes(u)) links.push(u);
        }
        return before.trim() 
            ? `${before.trim()}\n\n${sectionHeader}\n${links.join("\n")}\n${restOfFile.trim()}\n`
            : `${sectionHeader}\n${links.join("\n")}\n${restOfFile.trim()}\n`;
    } else {
        const newSection = `${sectionHeader}\n${urls.join("\n")}`;
        return existingText.trim()
            ? `${existingText.trim()}\n\n${newSection}\n`
            : `${newSection}\n`;
    }
}

async function getTrashData(colDir) {
    const trashPath = path.join(colDir, "trash.json");
    try {
        const raw = await fs.readFile(trashPath, "utf8");
        const data = JSON.parse(raw);
        if (Array.isArray(data)) return { items: data };
        if (data && Array.isArray(data.items)) return data;
        return { items: [] };
    } catch {
        return { items: [] };
    }
}

async function saveTrashData(colDir, data) {
    const trashPath = path.join(colDir, "trash.json");
    await fs.writeFile(trashPath, JSON.stringify(data, null, 2), "utf8");
}

const collectionQueues = new Map();

function runWithCollectionLock(colKey, fn) {
    let queue = collectionQueues.get(colKey);
    if (!queue) {
        queue = Promise.resolve();
    }
    const next = queue.then(fn, fn);
    collectionQueues.set(colKey, next.catch(() => {}));
    return next;
}

async function safeWriteJson(filePath, data) {
    const tmpPath = `${filePath}.tmp.${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    await fs.writeFile(tmpPath, JSON.stringify(data, null, 2), "utf8");
    try {
        await fs.rename(tmpPath, filePath);
    } catch {
        await fs.writeFile(filePath, JSON.stringify(data, null, 2), "utf8");
        try { await fs.unlink(tmpPath); } catch {}
    }
}

// 🔥 Автоматическое восстановление и синхронизация подборки
// Гарантирует, что ни один товар из products/ или all_products.json не будет потерян ни при каких обстоятельствах!
async function reconcileCollection(colDir) {
    const allProdPath = path.join(colDir, "all_products.json");
    const collectionFilePath = path.join(colDir, "collection.json");
    const linksFilePath = path.join(colDir, "links.txt");
    const infoFilePath = path.join(colDir, "info.json");
    const prodDir = path.join(colDir, "products");

    const trashData = await getTrashData(colDir);
    const trashSlugs = new Set((trashData.items || []).map(i => i.slug));

    let allProducts = [];
    try {
        const raw = await fs.readFile(allProdPath, "utf8");
        if (raw && raw.trim()) allProducts = JSON.parse(raw);
    } catch {}

    let collectionSlugs = [];
    try {
        const raw = await fs.readFile(collectionFilePath, "utf8");
        if (raw && raw.trim()) {
            const parsed = JSON.parse(raw);
            if (Array.isArray(parsed.items)) collectionSlugs = parsed.items;
        }
    } catch {}

    let linksLines = [];
    try {
        linksLines = (await fs.readFile(linksFilePath, "utf8")).split("\n").filter(Boolean);
    } catch {}

    let diskFiles = [];
    try {
        diskFiles = await fs.readdir(prodDir);
    } catch {}

    const jsonFiles = diskFiles.filter(f => f.endsWith(".json"));
    const allProductsMap = new Map();

    // 1. Загружаем текущие товары из allProducts (исключая корзину)
    for (const p of allProducts) {
        if (p && p.slug && !trashSlugs.has(p.slug)) allProductsMap.set(p.slug, p);
    }

    // 2. Восстанавливаем с диска все товары, которых не было в allProducts (исключая корзину)
    let changed = false;
    for (const file of jsonFiles) {
        const slug = file.replace(/\.json$/i, "");
        if (trashSlugs.has(slug)) continue;
        if (!allProductsMap.has(slug)) {
            try {
                const singleData = JSON.parse(await fs.readFile(path.join(prodDir, file), "utf8"));
                if (singleData && singleData.slug) {
                    allProductsMap.set(singleData.slug, singleData);
                    allProducts.push(singleData);
                    changed = true;
                }
            } catch {}
        }
    }

    // 3. Формируем единый и полный список collectionSlugs
    const colSet = new Set(collectionSlugs);
    for (const slug of allProductsMap.keys()) {
        if (!colSet.has(slug)) {
            collectionSlugs.push(slug);
            colSet.add(slug);
            changed = true;
        }
    }

    // 4. Очищаем из collectionSlugs только те слаги, которых нет вообще ни в products/, ни в allProducts, или которые в корзине
    collectionSlugs = collectionSlugs.filter(s => allProductsMap.has(s) && !trashSlugs.has(s));

    // Очищаем allProducts от элементов из корзины если они там были
    allProducts = allProducts.filter(p => !trashSlugs.has(p.slug));

    // 5. Проверяем links.txt
    const linksSlugs = new Set(linksLines.map(l => getSlugFromUrl(normalizeProductUrl(l))).filter(Boolean));
    for (const [slug, p] of allProductsMap.entries()) {
        if (!linksSlugs.has(slug)) {
            const url = p.canonical || p.url || `https://www.creativefabrica.com/product/${slug}/`;
            linksLines.push(url);
            changed = true;
        }
    }

    // 6. Если произошли изменения или collection.json имел меньше товаров — безопасно синхронизируем
    if (changed || collectionSlugs.length !== allProducts.length) {
        await safeWriteJson(allProdPath, allProducts);
        await safeWriteJson(collectionFilePath, { items: collectionSlugs });
        await fs.writeFile(linksFilePath, linksLines.join("\n") + "\n", "utf8");

        try {
            let infoData = { title: path.basename(colDir), count: allProducts.length, image: "" };
            try { infoData = JSON.parse(await fs.readFile(infoFilePath, "utf8")); } catch {}
            infoData.count = allProducts.length;
            if (!infoData.image && allProducts.length > 0 && allProducts[0].image) {
                infoData.image = allProducts[0].image;
            }
            await safeWriteJson(infoFilePath, infoData);
        } catch {}
    }

    return { allProducts, collectionSlugs, linksLines };
}

const parseJsonBody = (req) => {
    return new Promise((resolve, reject) => {
        let body = "";
        req.on("data", chunk => body += chunk);
        req.on("end", () => {
            try {
                resolve(body ? JSON.parse(body) : {});
            } catch (err) {
                reject(err);
            }
        });
        req.on("error", reject);
    });
};

const server = http.createServer(async (req, res) => {
    const reqUrl = new URL(req.url, `http://${req.headers.host}`);
    const pathname = reqUrl.pathname;

    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");

    if (req.method === "OPTIONS") {
        res.writeHead(204);
        res.end();
        return;
    }

    // 0.1 Мгновенный легковесный пинг (Health Check)
    if (pathname === "/api/health" && req.method === "GET") {
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({
            ok: true,
            service: "admin",
            port: PORT,
            uptime: Math.round(process.uptime()),
            timestamp: Date.now()
        }));
        return;
    }

    // 0.2 Статус всех локальных сервисов студии (Админка, Локальный сайт, Менеджер тегов / Студия)
    if (pathname === "/api/services/status" && req.method === "GET") {
        const [siteRunning, managerRunning] = await Promise.all([
            checkPortOpen(4321),
            checkPortOpen(3001)
        ]);
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({
            admin: {
                id: "admin",
                name: "Визуальная админка",
                port: 3333,
                url: "http://localhost:3333",
                running: true
            },
            site: {
                id: "site",
                name: "Локальный сайт",
                port: 4321,
                url: "http://localhost:4321",
                running: siteRunning
            },
            manager: {
                id: "manager",
                name: "Менеджер тегов & Студия",
                port: 3001,
                url: "http://localhost:3001",
                running: managerRunning
            }
        }));
        return;
    }

    // 0.3 Запуск локальных сервисов из браузерного расширения
    if (pathname === "/api/services/start" && req.method === "POST") {
        let body = {};
        try {
            body = await parseJsonBody(req);
        } catch {}

        const target = body.service || "all";
        const results = [];
        const isWin = process.platform === "win32";

        if (target === "site" || target === "all") {
            const isRunning = await checkPortOpen(4321);
            if (!isRunning) {
                const cmd = isWin ? "npx.cmd" : "npx";
                const child = spawn(cmd, ["astro", "dev", "--port", "4321", "--host"], {
                    cwd: PROJECT_ROOT,
                    detached: true,
                    stdio: "ignore",
                    shell: isWin
                });
                child.unref();
                results.push({ service: "site", started: true, port: 4321, url: "http://localhost:4321" });
            } else {
                results.push({ service: "site", alreadyRunning: true, port: 4321, url: "http://localhost:4321" });
            }
        }

        if (target === "manager" || target === "all") {
            const isRunning = await checkPortOpen(3001);
            if (!isRunning) {
                const mgrDir = path.join(WORKSPACE_ROOT, "manager_gui");
                const cmd = isWin ? "npm.cmd" : "npm";
                const child = spawn(cmd, ["run", "dev"], {
                    cwd: mgrDir,
                    detached: true,
                    stdio: "ignore",
                    shell: isWin
                });
                child.unref();
                results.push({ service: "manager", started: true, port: 3001, url: "http://localhost:3001" });
            } else {
                results.push({ service: "manager", alreadyRunning: true, port: 3001, url: "http://localhost:3001" });
            }
        }

        if (target === "admin") {
            results.push({ service: "admin", alreadyRunning: true, port: 3333, url: "http://localhost:3333" });
        }

        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ success: true, results }));
        return;
    }

    async function getPythonBin() {
        const candidates = process.platform === "win32" ? ["python", "py", "python3"] : ["python3", "python"];
        for (const bin of candidates) {
            try {
                await execAsync(`${bin} --version`);
                return bin;
            } catch {}
        }
        return process.platform === "win32" ? "python" : "python3";
    }

    // 0.4 Безопасный единый пуш на GitHub (в 2 репозитория)
    if (pathname === "/api/git/push-all" && req.method === "POST") {
        let body = {};
        try {
            body = await parseJsonBody(req);
        } catch {}

        const scriptPath = path.join(WORKSPACE_ROOT, "sync_push.py");
        const customMsg = (body.message || "").trim();
        const pyBin = await getPythonBin();
        const cmd = customMsg
            ? `${pyBin} "${scriptPath}" "${customMsg.replace(/"/g, '\\"')}"`
            : `${pyBin} "${scriptPath}"`;

        try {
            const { stdout, stderr } = await execAsync(cmd, { cwd: WORKSPACE_ROOT, timeout: 180000 });
            const output = (stdout || "").trim() || (stderr || "").trim();
            const isSuccess = output.includes("ВСЁ ГОТОВО") || (!output.includes("ВНИМАНИЕ: GitHub заблокировал") && !output.includes("Ошибка при отправке"));

            res.writeHead(200, { "Content-Type": "application/json" });
            res.end(JSON.stringify({
                success: isSuccess,
                output,
                timestamp: new Date().toISOString()
            }));
        } catch (err) {
            res.writeHead(500, { "Content-Type": "application/json" });
            res.end(JSON.stringify({
                success: false,
                error: err.message,
                output: (err.stdout || err.stderr || "").trim()
            }));
        }
        return;
    }

    // 0.5 Безопасное обновление с GitHub (Git Pull All с авто-сохранением локальных товаров)
    if (pathname === "/api/git/pull-all" && req.method === "POST") {
        const scriptPath = path.join(WORKSPACE_ROOT, "sync_pull.py");
        const pyBin = await getPythonBin();
        const cmd = `${pyBin} "${scriptPath}"`;

        try {
            const { stdout, stderr } = await execAsync(cmd, { cwd: WORKSPACE_ROOT, timeout: 120000 });
            const output = (stdout || "").trim() || (stderr || "").trim();
            const isSuccess = output.includes("ВСЁ ГОТОВО") || !output.includes("Обнаружен конфликт");

            res.writeHead(200, { "Content-Type": "application/json" });
            res.end(JSON.stringify({
                success: isSuccess,
                output,
                timestamp: new Date().toISOString()
            }));
        } catch (err) {
            res.writeHead(500, { "Content-Type": "application/json" });
            res.end(JSON.stringify({
                success: false,
                error: err.message,
                output: (err.stdout || err.stderr || "").trim()
            }));
        }
        return;
    }

    // 1. API: Список категорий, подборок и их фильтров (с метаданными, сортировкой и описаниями)
    if (pathname === "/api/categories" && req.method === "GET") {
        try {
            const categoriesMeta = await readCategoriesJson();
            const metaMap = new Map(categoriesMeta.map(c => [c.id, c]));

            // Сканируем папки content/
            let entries = [];
            try {
                entries = await fs.readdir(CONTENT_DIR, { withFileTypes: true });
            } catch {}

            const dirSet = new Set(entries.filter(e => e.isDirectory() && e.name !== "products").map(e => e.name));
            
            // Список категорий в порядке из categories.json, плюс папки, которых еще нет в json
            const orderedCatIds = [];
            for (const c of categoriesMeta) {
                orderedCatIds.push(c.id);
            }
            for (const dirName of dirSet) {
                if (!orderedCatIds.includes(dirName)) {
                    orderedCatIds.push(dirName);
                }
            }

            const categories = [];

            for (const catId of orderedCatIds) {
                const catMeta = metaMap.get(catId) || {
                    id: catId,
                    title: catId.charAt(0).toUpperCase() + catId.slice(1),
                    subtitle: `Best ${catId} Collections`,
                    description: `Curated collections of ${catId}.`,
                    image: "",
                    href: `/${catId}`
                };

                const catDir = path.join(CONTENT_DIR, catId);
                let orderList = [];
                try {
                    const rawOrder = await fs.readFile(path.join(catDir, "order.json"), "utf8");
                    orderList = JSON.parse(rawOrder).order || [];
                } catch {}

                let subEntries = [];
                try {
                    subEntries = await fs.readdir(catDir, { withFileTypes: true });
                } catch {}

                const collections = [];

                for (const sub of subEntries) {
                    if (sub.isDirectory() && sub.name !== "products") {
                        const colPath = path.join(catDir, sub.name);
                        const allProdPath = path.join(colPath, "all_products.json");
                        const filtersPath = path.join(colPath, "filters.json");
                        const infoPath = path.join(colPath, "info.json");
                        
                        let info = {
                            title: sub.name.split("-").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" "),
                            description: "",
                            image: "",
                            count: 0
                        };
                        try {
                            info = { ...info, ...JSON.parse(await fs.readFile(infoPath, "utf8")) };
                        } catch {}

                        let count = 0;
                        try {
                            const prodData = JSON.parse(await fs.readFile(allProdPath, "utf8"));
                            count = prodData.length;
                            info.count = count;
                        } catch {}

                        let trashCount = 0;
                        try {
                            const tData = await getTrashData(colPath);
                            trashCount = (tData.items || []).length;
                        } catch {}

                        let filtersList = [];
                        try {
                            const fData = JSON.parse(await fs.readFile(filtersPath, "utf8"));
                            if (Array.isArray(fData)) {
                                filtersList = fData.map(f => ({ id: f.id, label: f.label || f.id }));
                            }
                        } catch {}

                        collections.push({
                            name: sub.name,
                            slug: sub.name,
                            collection: sub.name,
                            title: info.title || sub.name,
                            description: info.description || "",
                            image: info.image || "",
                            count,
                            trashCount,
                            filters: filtersList
                        });
                    }
                }

                // Сортировка подборок по order.json
                if (orderList.length > 0) {
                    collections.sort((a, b) => {
                        const idxA = orderList.indexOf(a.name);
                        const idxB = orderList.indexOf(b.name);
                        if (idxA === -1 && idxB === -1) return a.name.localeCompare(b.name);
                        if (idxA === -1) return 1;
                        if (idxB === -1) return -1;
                        return idxA - idxB;
                    });
                }

                categories.push({
                    id: catId,
                    category: catId,
                    title: catMeta.title || catId,
                    subtitle: catMeta.subtitle || "",
                    description: catMeta.description || "",
                    image: catMeta.image || "",
                    href: catMeta.href || `/${catId}`,
                    count: `${collections.length} Collection${collections.length === 1 ? '' : 's'}`,
                    collections
                });
            }

            res.writeHead(200, { "Content-Type": "application/json" });
            res.end(JSON.stringify(categories));
        } catch (e) {
            res.writeHead(500, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ error: e.message }));
        }
        return;
    }

    // 2. API: Список товаров для выбранной подборки (с поддержкой filterId и trashCount)
    if (pathname === "/api/products" && req.method === "GET") {
        const category = reqUrl.searchParams.get("category");
        const collection = reqUrl.searchParams.get("collection");
        const filterId = reqUrl.searchParams.get("filter");

        if (!category || !collection) {
            res.writeHead(400, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ error: "Параметры category и collection обязательны" }));
            return;
        }

        try {
            const colDir = path.join(CONTENT_DIR, category, collection);
            const colKey = `${category}/${collection}`;

            // Автоматическое самовосстановление и объединение при каждом открытии
            const { allProducts } = await runWithCollectionLock(colKey, () => reconcileCollection(colDir));
            let products = allProducts;

            // Обогащаем данными о рейтинге, лайках, тегах и источнике сбора
            const prodDir = path.join(colDir, "products");
            let sourcesMap = {};
            try {
                const sRaw = await fs.readFile(path.join(colDir, "sources_map.json"), "utf8");
                sourcesMap = JSON.parse(sRaw);
            } catch {}

            for (const p of products) {
                try {
                    const singleData = JSON.parse(await fs.readFile(path.join(prodDir, `${p.slug}.json`), "utf8"));
                    if (singleData.rating !== undefined && singleData.rating !== null) {
                        p.rating = singleData.rating;
                        p.reviewsCount = singleData.reviewsCount;
                    }
                    if (singleData.favorites !== undefined && singleData.favorites !== null) {
                        p.favorites = singleData.favorites;
                        p.favoritesRaw = singleData.favoritesRaw;
                    }
                    if (Array.isArray(singleData.designerTags) && singleData.designerTags.length > 0) {
                        p.designerTags = singleData.designerTags;
                    }
                    if (singleData.sourceQuery) p.sourceQuery = singleData.sourceQuery;
                    if (singleData.sourceComment) p.sourceComment = singleData.sourceComment;
                    if (singleData.sourceUrl) p.sourceUrl = singleData.sourceUrl;
                } catch {}

                if (sourcesMap[p.slug]) {
                    if (!p.sourceQuery && sourcesMap[p.slug].sourceQuery) p.sourceQuery = sourcesMap[p.slug].sourceQuery;
                    if (!p.sourceComment && sourcesMap[p.slug].sourceComment) p.sourceComment = sourcesMap[p.slug].sourceComment;
                    if (!p.sourceUrl && sourcesMap[p.slug].sourceUrl) p.sourceUrl = sourcesMap[p.slug].sourceUrl;
                }
            }

            let trashCount = 0;

            // Если запрошен конкретный фильтр — загружаем его коллекцию
            if (filterId) {
                const filterColPath = path.join(colDir, "filter_collections", `${filterId}.json`);
                try {
                    const fRaw = await fs.readFile(filterColPath, "utf8");
                    const fData = JSON.parse(fRaw);
                    const itemsSlugs = Array.isArray(fData.items) ? fData.items : [];
                    trashCount = Array.isArray(fData.excludedItems) ? fData.excludedItems.length : 0;
                    
                    const pMap = new Map(products.map(p => [p.slug, p]));
                    const filteredProducts = [];

                    for (const s of itemsSlugs) {
                        if (pMap.has(s)) {
                            filteredProducts.push(pMap.get(s));
                        }
                    }

                    products = filteredProducts;
                } catch {
                    // Файл фильтра еще не сгенерирован
                    products = [];
                    trashCount = 0;
                }
            } else {
                const tData = await getTrashData(colDir);
                trashCount = (tData.items || []).length;
            }

            const draftsCount = products.filter(p => Boolean(p.isDraft)).length;

            res.writeHead(200, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ products, trashCount, draftsCount }));
        } catch (e) {
            res.writeHead(500, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ error: e.message }));
        }
        return;
    }

    // 2.05. API: Допарсить одобренные черновики (Deep parse) — для одной подборки или для ВСЕХ
    if (pathname === "/api/hydrate-drafts" && req.method === "POST") {
        try {
            const { category, collection, limit, all } = await parseJsonBody(req);
            const { hydrateApprovedDrafts, getDraftsStatus } = await import("../creative-fabrica/helpers/quick-showcase.js");

            // Если запрошен допарсинг всех подборок или категория/подборка не указаны
            if (all || !category || !collection) {
                const entries = await fs.readdir(CONTENT_DIR, { withFileTypes: true });
                const catDirs = entries.filter(d => d.isDirectory() && d.name !== "products").map(d => d.name);

                let totalHydrated = 0;
                let processedCollections = 0;
                const results = [];

                for (const cat of catDirs) {
                    const catPath = path.join(CONTENT_DIR, cat);
                    let cols = [];
                    try {
                        cols = (await fs.readdir(catPath, { withFileTypes: true })).filter(d => d.isDirectory()).map(d => d.name);
                    } catch {}

                    for (const col of cols) {
                        try {
                            const status = await getDraftsStatus(cat, col);
                            if (status && status.draftsCount > 0) {
                                const res = await hydrateApprovedDrafts({ category: cat, collection: col, maxItems: limit });
                                totalHydrated += (res.hydratedCount || 0);
                                processedCollections++;
                                results.push({
                                    category: cat,
                                    collection: col,
                                    hydratedCount: res.hydratedCount || 0,
                                    remainingDrafts: res.remainingDrafts || 0
                                });
                            }
                        } catch (err) {
                            console.error(`Error hydrating ${cat}/${col}:`, err);
                        }
                    }
                }

                res.writeHead(200, { "Content-Type": "application/json" });
                res.end(JSON.stringify({
                    success: true,
                    isAll: true,
                    processedCollections,
                    totalHydrated,
                    results
                }));
                return;
            }

            const result = await hydrateApprovedDrafts({ category, collection, maxItems: limit });
            res.writeHead(200, { "Content-Type": "application/json" });
            res.end(JSON.stringify(result));
        } catch (e) {
            res.writeHead(500, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ error: e.message }));
        }
        return;
    }

    // 2.06. API: Сводка по черновикам (для конкретной подборки или для всего сайта)
    if (pathname === "/api/drafts-summary" && req.method === "GET") {
        try {
            const category = reqUrl.searchParams.get("category");
            const collection = reqUrl.searchParams.get("collection");
            const { getDraftsStatus } = await import("../creative-fabrica/helpers/quick-showcase.js");

            if (category && collection) {
                const status = await getDraftsStatus(category, collection);
                res.writeHead(200, { "Content-Type": "application/json" });
                res.end(JSON.stringify({ success: true, ...status }));
                return;
            }

            const entries = await fs.readdir(CONTENT_DIR, { withFileTypes: true });
            const catDirs = entries.filter(d => d.isDirectory() && d.name !== "products").map(d => d.name);

            let totalDrafts = 0;
            const collectionsWithDrafts = [];

            for (const cat of catDirs) {
                const catPath = path.join(CONTENT_DIR, cat);
                let cols = [];
                try {
                    cols = (await fs.readdir(catPath, { withFileTypes: true })).filter(d => d.isDirectory()).map(d => d.name);
                } catch {}

                for (const col of cols) {
                    try {
                        const status = await getDraftsStatus(cat, col);
                        if (status && status.draftsCount > 0) {
                            totalDrafts += status.draftsCount;
                            collectionsWithDrafts.push({
                                category: cat,
                                collection: col,
                                draftsCount: status.draftsCount,
                                total: status.total
                            });
                        }
                    } catch {}
                }
            }

            res.writeHead(200, { "Content-Type": "application/json" });
            res.end(JSON.stringify({
                success: true,
                totalDrafts,
                collectionsCount: collectionsWithDrafts.length,
                collections: collectionsWithDrafts
            }));
        } catch (e) {
            res.writeHead(500, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ error: e.message }));
        }
        return;
    }

    // 2.5. API: Инсайты и рекомендации по расширению ассортимента под Pinterest
    if (pathname === "/api/collection-insights" && req.method === "GET") {
        const category = reqUrl.searchParams.get("category");
        const collection = reqUrl.searchParams.get("collection");

        if (!category || !collection) {
            res.writeHead(400, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ error: "Параметры category и collection обязательны" }));
            return;
        }

        try {
            const colDir = path.join(CONTENT_DIR, category, collection);
            const allProdPath = path.join(colDir, "all_products.json");
            let products = [];
            try {
                products = JSON.parse(await fs.readFile(allProdPath, "utf8"));
            } catch (err) {
                res.writeHead(404, { "Content-Type": "application/json" });
                res.end(JSON.stringify({ error: "Подборка не найдена или пуста" }));
                return;
            }

            const total = products.length;
            if (total === 0) {
                res.writeHead(200, { "Content-Type": "application/json" });
                res.end(JSON.stringify({ total: 0, message: "В подборке пока нет товаров" }));
                return;
            }

            // Обогащаем товары метаданными источника (sources_map.json)
            let sourcesMap = {};
            try {
                const sRaw = await fs.readFile(path.join(colDir, "sources_map.json"), "utf8");
                sourcesMap = JSON.parse(sRaw);
            } catch {}

            products.forEach(p => {
                if (sourcesMap[p.slug]) {
                    if (!p.sourceQuery && sourcesMap[p.slug].sourceQuery) p.sourceQuery = sourcesMap[p.slug].sourceQuery;
                    if (!p.sourceComment && sourcesMap[p.slug].sourceComment) p.sourceComment = sourcesMap[p.slug].sourceComment;
                    if (!p.sourceUrl && sourcesMap[p.slug].sourceUrl) p.sourceUrl = sourcesMap[p.slug].sourceUrl;
                }
            });

            // Анализ соответствия задачам менеджера (Manager Note Compliance)
            const complianceIssues = [];
            products.forEach(p => {
                const comment = (p.sourceComment || "").toLowerCase();
                const title = (p.title || "").toLowerCase();
                
                const requiresBundle = comment.includes("без одиноч") || comment.includes("только набор") || comment.includes("наборы") || comment.includes("bundle");
                if (requiresBundle) {
                    const isSingle = /\b(1\s*(png|clipart|flower|bouquet|element|illustration|file|preview)|single\s*(clipart|flower|png|rose)|isolated\s*(flower|element)|solitary)\b/i.test(title);
                    if (isSingle) {
                        complianceIssues.push({
                            slug: p.slug,
                            title: p.title,
                            sourceQuery: p.sourceQuery || '',
                            sourceComment: p.sourceComment || '',
                            violation: 'Потенциальный одиночный элемент (противоречит задаче менеджера: "без одиночек / только наборы")'
                        });
                    }
                }
            });

            // 1. Агрегация тегов дизайнеров (CF tags)
            const tagMap = new Map();
            let totalFavs = 0;
            let favsCount = 0;
            let totalRating = 0;
            let ratingCount = 0;

            products.forEach(p => {
                if (p.favorites) {
                    totalFavs += Number(p.favorites) || 0;
                    favsCount++;
                }
                if (p.rating) {
                    totalRating += Number(p.rating) || 0;
                    ratingCount++;
                }
                if (Array.isArray(p.designerTagLinks) && p.designerTagLinks.length > 0) {
                    p.designerTagLinks.forEach(t => {
                        if (t && t.name && t.url && t.name.toLowerCase() !== "tags") {
                            const key = t.name.trim();
                            const cur = tagMap.get(key.toLowerCase()) || { name: key, tag: key, url: t.url, cfTagUrl: t.url, count: 0 };
                            cur.count++;
                            tagMap.set(key.toLowerCase(), cur);
                        }
                    });
                } else if (Array.isArray(p.tags)) {
                    p.tags.forEach(t => {
                        if (typeof t === 'string' && t.trim() && t.toLowerCase() !== "tags") {
                            const key = t.trim();
                            const slug = key.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
                            const url = `https://www.creativefabrica.com/tag/${slug}/`;
                            const cur = tagMap.get(key.toLowerCase()) || { name: key, tag: key, url, cfTagUrl: url, count: 0 };
                            cur.count++;
                            tagMap.set(key.toLowerCase(), cur);
                        }
                    });
                }
            });

            const topTags = Array.from(tagMap.values())
                .sort((a, b) => b.count - a.count)
                .slice(0, 30);

            // 2. Тематический анализ ниши
            const isFlowers = collection.includes("flower") || (category === "cliparts" && (collection === "flowers" || collection === "autumn" || collection === "summer"));
            const isChristmas = category === "christmas" || collection.includes("christmas");

            let themes = [];
            let opportunities = [];

            if (isFlowers) {
                themes = [
                    { id: "roses", name: "Розы (Roses)", regex: /\b(rose|roses)\b/i, cfTag: "https://www.creativefabrica.com/tag/rose/" },
                    { id: "eucalyptus", name: "Эвкалипт и зелень (Eucalyptus & Greenery)", regex: /\b(eucalyptus|greenery|leaves|foliage)\b/i, cfTag: "https://www.creativefabrica.com/tag/eucalyptus/" },
                    { id: "peonies", name: "Пионы (Peonies)", regex: /\b(peony|peonies)\b/i, cfTag: "https://www.creativefabrica.com/tag/peony/" },
                    { id: "wildflower", name: "Полевые и луговые цветы (Wildflowers / Meadow)", regex: /\b(wildflower|wildflowers|meadow|chamomile|daisy|poppy)\b/i, cfTag: "https://www.creativefabrica.com/tag/wildflower/" },
                    { id: "tulips", name: "Тюльпаны (Tulips)", regex: /\b(tulip|tulips)\b/i, cfTag: "https://www.creativefabrica.com/tag/tulip/" },
                    { id: "sunflowers", name: "Подсолнухи (Sunflowers)", regex: /\b(sunflower|sunflowers)\b/i, cfTag: "https://www.creativefabrica.com/tag/sunflower/" },
                    { id: "herbs", name: "Аптекарские травы и лаванда (Herbs & Lavender)", regex: /\b(herbs|lavender|rosemary|sage|thyme|mint|apothecary)\b/i, cfTag: "https://www.creativefabrica.com/tag/herbs/" },
                    { id: "dusty_palette", name: "Пыльно-синие и шалфей (Dusty Blue / Sage / Terracotta)", regex: /\b(dusty\s*blue|sage\s*green|terracotta)\b/i, cfTag: "https://www.creativefabrica.com/tag/dusty-blue/" },
                    { id: "pressed", name: "Сухоцветы и гербарии (Pressed / Dried Flowers)", regex: /\b(pressed|dried|herbarium)\b/i, cfTag: "https://www.creativefabrica.com/tag/pressed-flowers/" },
                    { id: "birth", name: "Цветы по месяцам рождения (Birth Month Flowers)", regex: /\b(birth\s*month|birth\s*flower)\b/i, cfTag: "https://www.creativefabrica.com/tag/birth-flower/" },
                    { id: "letters", name: "Цветочные монограммы и буквы (Floral Letters & Monograms)", regex: /\b(alphabet|letters|monogram|initials)\b/i, cfTag: "https://www.creativefabrica.com/tag/monogram/" },
                    { id: "dark_moody", name: "Темная романтика и голландская ботаника (Moody Dark Florals)", regex: /\b(moody|dark\s*floral|gothic|dutch)\b/i, cfTag: "https://www.creativefabrica.com/tag/moody-floral/" }
                ];

                opportunities = [
                    {
                        title: "Цветы по месяцам рождения (Birth Month Flowers)",
                        whyPinterest: "Один из самых высокодоходных вечнозеленых трендов в Pinterest и Etsy. Пины с 'Birth month flower bouquet' собирают миллионы сохранений под персонализированные подарки, татуировки, кружки и постеры.",
                        currentCount: 0,
                        recommendedTarget: "15-20 наборов",
                        searchQuery: "birth month flower clipart set bundle watercolor",
                        cfSearchUrl: "https://www.creativefabrica.com/search/?query=birth+month+flower+clipart+set+bundle+watercolor",
                        cfTagUrl: "https://www.creativefabrica.com/tag/birth-flower/"
                    },
                    {
                        title: "Сухоцветы и прессованные полевые цветы (Pressed & Dried Flowers)",
                        whyPinterest: "Эстетика Cottagecore и винтажного гербария. Покупатели на Pinterest активно ищут тонкие реалистичные сухие цветы для оформления свадебных приглашений, открыток и крафтовой упаковки.",
                        currentCount: 0,
                        recommendedTarget: "15-25 наборов",
                        searchQuery: "pressed flowers watercolor clipart bundle",
                        cfSearchUrl: "https://www.creativefabrica.com/search/?query=pressed+flowers+watercolor+clipart+bundle",
                        cfTagUrl: "https://www.creativefabrica.com/tag/pressed-flowers/"
                    },
                    {
                        title: "Цветочный алфавит и монограммы (Floral Monograms & Letters)",
                        whyPinterest: "Стабильный коммерческий спрос для свадебных монограмм (wedding monogram invitations) и постеров в детские комнаты (nursery initial wall art). Покупатели кликают ради красивых заглавных букв в цветах.",
                        currentCount: 0,
                        recommendedTarget: "10-15 наборов",
                        searchQuery: "watercolor floral alphabet clipart bundle",
                        cfSearchUrl: "https://www.creativefabrica.com/search/?query=watercolor+floral+alphabet+clipart+bundle",
                        cfTagUrl: "https://www.creativefabrica.com/tag/monogram/"
                    },
                    {
                        title: "Пыльно-синие, шалфейные и терракотовые палитры (Dusty Blue & Terracotta)",
                        whyPinterest: "Абсолютный хит свадебных досок Pinterest (Wedding Color Palette Boards) сезонов 2024-2026. Невесты и дизайнеры полиграфии ищут именно эти сложные благородные оттенки.",
                        currentCount: 0,
                        recommendedTarget: "20-30 наборов",
                        searchQuery: "dusty blue terracotta floral watercolor clipart",
                        cfSearchUrl: "https://www.creativefabrica.com/search/?query=dusty+blue+terracotta+floral+watercolor+clipart",
                        cfTagUrl: "https://www.creativefabrica.com/tag/dusty-blue/"
                    },
                    {
                        title: "Аптекарские и кухонные травы (Botanical Herbs & Lavender)",
                        whyPinterest: "Лаванда, розмарин, мята, тимьян, шалфей. Тренд 'Apothecary & Herbalist' популярен для этикеток домашней косметики, свечей, чая и кухонных постеров.",
                        currentCount: 0,
                        recommendedTarget: "15-20 наборов",
                        searchQuery: "watercolor botanical herbs clipart pack",
                        cfSearchUrl: "https://www.creativefabrica.com/search/?query=watercolor+botanical+herbs+clipart+pack",
                        cfTagUrl: "https://www.creativefabrica.com/tag/herbs/"
                    },
                    {
                        title: "Темная винтажная романтика (Moody Dark Florals / Dutch Still Life)",
                        whyPinterest: "Эстетика Dark Academia, готические свадьбы и осенне-зимний сезон. Глубокие винные, изумрудные и черные фоны с сочными контрастными цветами.",
                        currentCount: 0,
                        recommendedTarget: "10-15 наборов",
                        searchQuery: "moody dark floral watercolor clipart bundle",
                        cfSearchUrl: "https://www.creativefabrica.com/search/?query=moody+dark+floral+watercolor+clipart+bundle",
                        cfTagUrl: "https://www.creativefabrica.com/tag/moody-floral/"
                    }
                ];
            } else if (isChristmas) {
                themes = [
                    { id: "traditional", name: "Традиционное красно-зеленое (Classic Red & Green)", regex: /\b(red|classic|traditional|santa)\b/i, cfTag: "https://www.creativefabrica.com/tag/christmas/" },
                    { id: "gingerbread", name: "Пряники и выпечка (Gingerbread & Bakery)", regex: /\b(gingerbread|cookies|candy\s*cane)\b/i, cfTag: "https://www.creativefabrica.com/tag/gingerbread/" },
                    { id: "coquette", name: "Розовое кокет / пастель (Coquette Pink Christmas)", regex: /\b(coquette|pink\s*christmas|pastel)\b/i, cfTag: "https://www.creativefabrica.com/tag/pink-christmas/" },
                    { id: "vintage", name: "Винтажное Рождество (Vintage Victorian)", regex: /\b(vintage|victorian|retro)\b/i, cfTag: "https://www.creativefabrica.com/tag/vintage-christmas/" },
                    { id: "neutral_boho", name: "Нейтральное / Сканди (Neutral Beige / Scandinavian)", regex: /\b(neutral|scandinavian|nordic|beige|boho)\b/i, cfTag: "https://www.creativefabrica.com/tag/nordic-christmas/" }
                ];
                opportunities = [
                    {
                        title: "Coquette Pink Christmas (Розовое Рождество с бантиками)",
                        whyPinterest: "Главный вирусный рождественский тренд молодежной аудитории Pinterest (милые розовые бантики, пастельные елочки и щелкунчики).",
                        currentCount: 0,
                        recommendedTarget: "20-25 наборов",
                        searchQuery: "coquette pink christmas watercolor clipart bundle",
                        cfSearchUrl: "https://www.creativefabrica.com/search/?query=coquette+pink+christmas+watercolor+clipart+bundle",
                        cfTagUrl: "https://www.creativefabrica.com/tag/pink-christmas/"
                    },
                    {
                        title: "Винтажные викторианские открытки (Vintage Victorian Christmas)",
                        whyPinterest: "Вечная классика для junk journals и рождественского скрапбукинга с огромным числом сохранений на Pinterest.",
                        currentCount: 0,
                        recommendedTarget: "15-20 наборов",
                        searchQuery: "vintage victorian christmas clipart bundle watercolor",
                        cfSearchUrl: "https://www.creativefabrica.com/search/?query=vintage+victorian+christmas+clipart+bundle+watercolor",
                        cfTagUrl: "https://www.creativefabrica.com/tag/vintage-christmas/"
                    }
                ];
            } else {
                themes = topTags.slice(0, 8).map(t => ({
                    id: t.name.toLowerCase().replace(/[^a-z0-9]/g, '_'),
                    name: t.name,
                    regex: new RegExp(`\\b${t.name.replace(/[^a-zA-Z0-9]/g, '\\$&')}\\b`, 'i'),
                    cfTag: t.url
                }));
                opportunities = [
                    {
                        title: "Расширение ассортимента под Pinterest",
                        whyPinterest: "Добавьте разнообразия в стилях отрисовки и популярных палитрах на основе тегов подборки.",
                        currentCount: 0,
                        recommendedTarget: "20-30 наборов",
                        searchQuery: `${collection.replace(/-/g, ' ')} watercolor bundle commercial use`,
                        cfSearchUrl: `https://www.creativefabrica.com/search/?query=${encodeURIComponent(collection.replace(/-/g, ' ') + ' watercolor bundle')}`,
                        cfTagUrl: `https://www.creativefabrica.com/search/?query=${encodeURIComponent(collection)}`
                    }
                ];
            }

            // Подсчет вхождений
            const themeStats = themes.map(t => {
                let count = 0;
                products.forEach(p => {
                    const text = `${p.title} ${p.description || ""} ${(p.designerTags || []).join(" ")}`;
                    if (t.regex.test(text)) count++;
                });
                const percent = Number(((count / total) * 100).toFixed(1));
                return {
                    ...t,
                    count,
                    percent
                };
            }).sort((a, b) => b.count - a.count);

            // Обновляем текущие счетчики в opportunities
            opportunities.forEach(opp => {
                const matchTheme = themeStats.find(t => t.regex.test(opp.title) || t.regex.test(opp.searchQuery));
                if (matchTheme) {
                    opp.currentCount = matchTheme.count;
                    opp.currentPercent = matchTheme.percent;
                } else {
                    let c = 0;
                    const qRegex = new RegExp(opp.title.split(' ')[0], 'i');
                    products.forEach(p => {
                        const text = `${p.title} ${p.description || ""} ${(p.designerTags || []).join(" ")}`;
                        if (qRegex.test(text)) c++;
                    });
                    opp.currentCount = c;
                    opp.currentPercent = Number(((c / total) * 100).toFixed(1));
                }
            });

            // Выявление перенасыщения (>28%)
            const overrepresented = themeStats.filter(t => t.percent >= 28).map(t => ({
                name: t.name,
                count: t.count,
                percent: t.percent,
                warning: `Тема занимает ${t.percent}% (${t.count} товаров). Рынок перенасыщен, рекомендуется приостановить добавление и переключиться на дефицитные тренды.`
            }));

            // Готовый список поисковых запросов и ссылок для копирования
            const exportQueries = opportunities.map(o => ({
                theme: o.title,
                query: o.searchQuery,
                searchUrl: o.cfSearchUrl,
                tagUrl: o.cfTagUrl
            }));

            res.writeHead(200, { "Content-Type": "application/json" });
            res.end(JSON.stringify({
                category,
                collection,
                totalProducts: total,
                avgFavorites: favsCount > 0 ? Math.round(totalFavs / favsCount) : 0,
                avgRating: ratingCount > 0 ? Number((totalRating / ratingCount).toFixed(2)) : 5.0,
                themeStats,
                overrepresented,
                opportunities,
                topTags,
                exportQueries,
                complianceIssues
            }));
        } catch (e) {
            res.writeHead(500, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ error: e.message }));
        }
        return;
    }

    // Хелперы для работы с for_links.txt и trash_links.json
    function parseForLinksContent(content) {
        if (!content || typeof content !== 'string') return [];
        const lines = content.split('\n');
        const items = [];
        lines.forEach((rawLine, index) => {
            const line = rawLine.trim();
            if (!line) return;
            if (line.startsWith('#')) {
                items.push({
                    id: 'hdr_' + index + '_' + Math.random().toString(36).substring(2, 6),
                    type: 'header',
                    comment: line.replace(/^#+\s*/, ''),
                    raw: rawLine
                });
                return;
            }

            let comment = '';
            let text = line;
            const hashIdx = line.indexOf('#');
            if (hashIdx !== -1) {
                comment = line.substring(hashIdx + 1).trim();
                text = line.substring(0, hashIdx).trim();
            }

            let url = text;
            let limit = 100;

            const commaIdx = text.indexOf(',');
            if (commaIdx !== -1) {
                url = text.substring(0, commaIdx).trim();
                const rest = text.substring(commaIdx + 1).trim();
                const secondComma = rest.indexOf(',');
                if (secondComma !== -1) {
                    const limitStr = rest.substring(0, secondComma).trim();
                    const extraComment = rest.substring(secondComma + 1).trim();
                    const parsed = parseInt(limitStr, 10);
                    if (!isNaN(parsed) && parsed > 0) limit = parsed;
                    if (!comment) comment = extraComment;
                } else {
                    const parsed = parseInt(rest, 10);
                    if (!isNaN(parsed) && parsed > 0) limit = parsed;
                }
            }

            items.push({
                id: 'link_' + index + '_' + Math.random().toString(36).substring(2, 6),
                type: 'link',
                url: url.trim(),
                limit,
                comment: comment.trim()
            });
        });
        return items;
    }

    function stringifyForLinks(items) {
        if (!Array.isArray(items)) return '';
        return items.map(item => {
            if (item.type === 'header') {
                return `# ${item.comment || ''}`.trim();
            }
            let line = item.url || '';
            if (item.limit) {
                line += `, ${item.limit}`;
            }
            if (item.comment) {
                line += ` # ${item.comment}`;
            }
            return line;
        }).filter(Boolean).join('\n') + '\n';
    }

    // 2.6. API: Получить for_links.txt и список распарсенных ссылок
    if (pathname === "/api/for-links" && req.method === "GET") {
        const category = reqUrl.searchParams.get("category");
        const collection = reqUrl.searchParams.get("collection");
        if (!category || !collection) {
            res.writeHead(400, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ error: "Параметры category и collection обязательны" }));
            return;
        }
        try {
            const filePath = path.join(CONTENT_DIR, category, collection, "for_links.txt");
            const trashPath = path.join(CONTENT_DIR, category, collection, "trash_links.json");
            let content = "";
            try {
                content = await fs.readFile(filePath, "utf8");
            } catch {}
            let trashCount = 0;
            try {
                const trashRaw = await fs.readFile(trashPath, "utf8");
                const trashData = JSON.parse(trashRaw);
                trashCount = Array.isArray(trashData.items) ? trashData.items.length : 0;
            } catch {}

            const items = parseForLinksContent(content);
            res.writeHead(200, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ content, items, trashCount }));
        } catch (e) {
            res.writeHead(500, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ error: e.message }));
        }
        return;
    }

    // 2.7. API: Сохранить for_links.txt (поддерживает как сырой content, так и структурированный массив items)
    if (pathname === "/api/save-for-links" && req.method === "POST") {
        try {
            const body = await parseJsonBody(req);
            const { category, collection, content, items } = body;
            if (!category || !collection) {
                res.writeHead(400, { "Content-Type": "application/json" });
                res.end(JSON.stringify({ error: "Некорректные параметры" }));
                return;
            }
            const filePath = path.join(CONTENT_DIR, category, collection, "for_links.txt");
            let finalContent = "";
            if (typeof content === "string") {
                finalContent = content;
            } else if (Array.isArray(items)) {
                finalContent = stringifyForLinks(items);
            } else {
                res.writeHead(400, { "Content-Type": "application/json" });
                res.end(JSON.stringify({ error: "Требуется content или items" }));
                return;
            }

            await fs.writeFile(filePath, finalContent, "utf8");
            const parsed = parseForLinksContent(finalContent);
            res.writeHead(200, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ success: true, count: parsed.length, items: parsed, content: finalContent }));
        } catch (e) {
            res.writeHead(500, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ error: e.message }));
        }
        return;
    }

    // 2.8. API: Удаление ссылки в Корзину ссылок (trash_links.json)
    if (pathname === "/api/for-links/delete" && req.method === "POST") {
        try {
            const { category, collection, id, url, reason } = await parseJsonBody(req);
            if (!category || !collection || (!id && !url)) {
                res.writeHead(400, { "Content-Type": "application/json" });
                res.end(JSON.stringify({ error: "Некорректные параметры" }));
                return;
            }
            const filePath = path.join(CONTENT_DIR, category, collection, "for_links.txt");
            const trashPath = path.join(CONTENT_DIR, category, collection, "trash_links.json");

            let content = "";
            try { content = await fs.readFile(filePath, "utf8"); } catch {}
            const items = parseForLinksContent(content);

            const itemIndex = items.findIndex(it => (id && it.id === id) || (url && it.url === url));
            if (itemIndex === -1) {
                res.writeHead(404, { "Content-Type": "application/json" });
                res.end(JSON.stringify({ error: "Ссылка не найдена в for_links.txt" }));
                return;
            }

            const [deleted] = items.splice(itemIndex, 1);
            await fs.writeFile(filePath, stringifyForLinks(items), "utf8");

            // Запись в trash_links.json
            let trashData = { items: [] };
            try {
                const trashRaw = await fs.readFile(trashPath, "utf8");
                trashData = JSON.parse(trashRaw);
                if (!Array.isArray(trashData.items)) trashData.items = [];
            } catch {}

            const trashEntry = {
                id: 'trash_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
                url: deleted.url,
                limit: deleted.limit || 100,
                comment: deleted.comment || '',
                deletedAt: new Date().toISOString(),
                reason: reason || "Удалено менеджером"
            };

            trashData.items.unshift(trashEntry);
            await fs.writeFile(trashPath, JSON.stringify(trashData, null, 2), "utf8");

            res.writeHead(200, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ success: true, deletedItem: trashEntry, remainingCount: items.length, trashCount: trashData.items.length }));
        } catch (e) {
            res.writeHead(500, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ error: e.message }));
        }
        return;
    }

    // 2.9. API: Получить корзину ссылок
    if (pathname === "/api/for-links/trash" && req.method === "GET") {
        const category = reqUrl.searchParams.get("category");
        const collection = reqUrl.searchParams.get("collection");
        if (!category || !collection) {
            res.writeHead(400, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ error: "Параметры category и collection обязательны" }));
            return;
        }
        try {
            const trashPath = path.join(CONTENT_DIR, category, collection, "trash_links.json");
            let trashData = { items: [] };
            try {
                const raw = await fs.readFile(trashPath, "utf8");
                trashData = JSON.parse(raw);
                if (!Array.isArray(trashData.items)) trashData.items = [];
            } catch {}

            res.writeHead(200, { "Content-Type": "application/json" });
            res.end(JSON.stringify(trashData));
        } catch (e) {
            res.writeHead(500, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ error: e.message }));
        }
        return;
    }

    // 2.10. API: Восстановить ссылку из корзины ссылок обратно в for_links.txt
    if (pathname === "/api/for-links/restore" && req.method === "POST") {
        try {
            const { category, collection, id, url, restoreAll } = await parseJsonBody(req);
            if (!category || !collection) {
                res.writeHead(400, { "Content-Type": "application/json" });
                res.end(JSON.stringify({ error: "Некорректные параметры" }));
                return;
            }
            const filePath = path.join(CONTENT_DIR, category, collection, "for_links.txt");
            const trashPath = path.join(CONTENT_DIR, category, collection, "trash_links.json");

            let trashData = { items: [] };
            try {
                const raw = await fs.readFile(trashPath, "utf8");
                trashData = JSON.parse(raw);
                if (!Array.isArray(trashData.items)) trashData.items = [];
            } catch {}

            let content = "";
            try { content = await fs.readFile(filePath, "utf8"); } catch {}
            const items = parseForLinksContent(content);

            let restoredCount = 0;
            if (restoreAll) {
                trashData.items.forEach(t => {
                    items.push({
                        id: 'link_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
                        type: 'link',
                        url: t.url,
                        limit: t.limit || 100,
                        comment: t.comment || ''
                    });
                });
                restoredCount = trashData.items.length;
                trashData.items = [];
            } else {
                const tIndex = trashData.items.findIndex(it => (id && it.id === id) || (url && it.url === url));
                if (tIndex === -1) {
                    res.writeHead(404, { "Content-Type": "application/json" });
                    res.end(JSON.stringify({ error: "Ссылка не найдена в корзине ссылок" }));
                    return;
                }
                const [itemToRestore] = trashData.items.splice(tIndex, 1);
                items.push({
                    id: 'link_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
                    type: 'link',
                    url: itemToRestore.url,
                    limit: itemToRestore.limit || 100,
                    comment: itemToRestore.comment || ''
                });
                restoredCount = 1;
            }

            await fs.writeFile(filePath, stringifyForLinks(items), "utf8");
            await fs.writeFile(trashPath, JSON.stringify(trashData, null, 2), "utf8");

            res.writeHead(200, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ success: true, restoredCount, items, trashCount: trashData.items.length }));
        } catch (e) {
            res.writeHead(500, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ error: e.message }));
        }
        return;
    }

    // 2.11. API: Окончательное удаление из корзины ссылок
    if (pathname === "/api/for-links/permanent-delete" && req.method === "POST") {
        try {
            const { category, collection, id, clearAll } = await parseJsonBody(req);
            if (!category || !collection) {
                res.writeHead(400, { "Content-Type": "application/json" });
                res.end(JSON.stringify({ error: "Некорректные параметры" }));
                return;
            }
            const trashPath = path.join(CONTENT_DIR, category, collection, "trash_links.json");

            let trashData = { items: [] };
            try {
                const raw = await fs.readFile(trashPath, "utf8");
                trashData = JSON.parse(raw);
                if (!Array.isArray(trashData.items)) trashData.items = [];
            } catch {}

            if (clearAll) {
                trashData.items = [];
            } else {
                trashData.items = trashData.items.filter(it => it.id !== id);
            }

            await fs.writeFile(trashPath, JSON.stringify(trashData, null, 2), "utf8");

            res.writeHead(200, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ success: true, trashCount: trashData.items.length }));
        } catch (e) {
            res.writeHead(500, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ error: e.message }));
        }
        return;
    }

    // 3. API: Сохранение порядка товаров (с поддержкой filterId)
    if (pathname === "/api/save-order" && req.method === "POST") {
        try {
            const { category, collection, filter: filterId, slugs } = await parseJsonBody(req);
            if (!category || !collection || !Array.isArray(slugs)) {
                res.writeHead(400, { "Content-Type": "application/json" });
                res.end(JSON.stringify({ error: "Некорректные данные" }));
                return;
            }

            const colDir = path.join(CONTENT_DIR, category, collection);

            // Если сохраняем порядок внутри КОНКРЕТНОГО ФИЛЬТРА:
            if (filterId) {
                const filterColDir = path.join(colDir, "filter_collections");
                await fs.mkdir(filterColDir, { recursive: true });
                const filterColPath = path.join(filterColDir, `${filterId}.json`);

                let filterData = {
                    filterId: filterId,
                    label: filterId,
                    items: slugs,
                    excludedItems: []
                };

                try {
                    const existingRaw = await fs.readFile(filterColPath, "utf8");
                    const existing = JSON.parse(existingRaw);
                    filterData = { ...existing, items: slugs };
                } catch {}

                filterData.updatedAt = new Date().toISOString();
                await fs.writeFile(filterColPath, JSON.stringify(filterData, null, 2), "utf8");

                res.writeHead(200, { "Content-Type": "application/json" });
                res.end(JSON.stringify({ success: true, count: slugs.length, isFilter: true }));
                return;
            }

            // Иначе сохраняем порядок ОСНОВНОЙ витрины
            const allProdPath = path.join(colDir, "all_products.json");
            const collectionFilePath = path.join(colDir, "collection.json");
            const linksFilePath = path.join(colDir, "links.txt");

            const existingProducts = JSON.parse(await fs.readFile(allProdPath, "utf8"));
            const prodMap = new Map(existingProducts.map(p => [p.slug, p]));

            const reorderedProducts = [];
            for (const s of slugs) {
                if (prodMap.has(s)) {
                    reorderedProducts.push(prodMap.get(s));
                }
            }

            for (const p of existingProducts) {
                if (!slugs.includes(p.slug)) {
                    reorderedProducts.push(p);
                }
            }

            await fs.writeFile(allProdPath, JSON.stringify(reorderedProducts, null, 2), "utf8");

            const newSlugsOrder = reorderedProducts.map(p => p.slug);
            await fs.writeFile(collectionFilePath, JSON.stringify({ items: newSlugsOrder }, null, 2), "utf8");

            try {
                const linksContent = await fs.readFile(linksFilePath, "utf8");
                const lines = linksContent.split("\n").map(l => l.trim()).filter(Boolean);
                
                const slugToLine = new Map();
                for (const line of lines) {
                    const clean = normalizeProductUrl(line);
                    const s = getSlugFromUrl(clean);
                    if (s) slugToLine.set(s, line);
                }

                const newLinksLines = [];
                for (const s of newSlugsOrder) {
                    if (slugToLine.has(s)) {
                        newLinksLines.push(slugToLine.get(s));
                    }
                }

                for (const line of lines) {
                    const clean = normalizeProductUrl(line);
                    const s = getSlugFromUrl(clean);
                    if (!newSlugsOrder.includes(s) && !newLinksLines.includes(line)) {
                        newLinksLines.push(line);
                    }
                }

                await fs.writeFile(linksFilePath, newLinksLines.join("\n") + "\n", "utf8");
            } catch (e) {
                console.error("Не удалось обновить links.txt", e);
            }

            res.writeHead(200, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ success: true, count: reorderedProducts.length, isFilter: false }));
        } catch (e) {
            res.writeHead(500, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ error: e.message }));
        }
        return;
    }

    // 3.1. API: Получить товары из корзины (или исключенные из фильтра)
    if (pathname === "/api/trash" && req.method === "GET") {
        const category = reqUrl.searchParams.get("category");
        const collection = reqUrl.searchParams.get("collection");
        const filterId = reqUrl.searchParams.get("filter");

        if (!category || !collection) {
            res.writeHead(400, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ error: "Параметры category и collection обязательны" }));
            return;
        }

        try {
            const colDir = path.join(CONTENT_DIR, category, collection);
            const prodDir = path.join(colDir, "products");

            let sourcesMap = {};
            try {
                const sRaw = await fs.readFile(path.join(colDir, "sources_map.json"), "utf8");
                sourcesMap = JSON.parse(sRaw);
            } catch {}

            // Если запрошен мусор для фильтра (excludedItems)
            if (filterId) {
                const filterColPath = path.join(colDir, "filter_collections", `${filterId}.json`);
                let excludedSlugs = [];
                try {
                    const fRaw = await fs.readFile(filterColPath, "utf8");
                    const fData = JSON.parse(fRaw);
                    excludedSlugs = Array.isArray(fData.excludedItems) ? fData.excludedItems : [];
                } catch {}

                const items = [];
                for (const s of excludedSlugs) {
                    let prodObj = null;
                    try {
                        prodObj = JSON.parse(await fs.readFile(path.join(prodDir, `${s}.json`), "utf8"));
                    } catch {}
                    if (!prodObj) {
                        prodObj = {
                            slug: s,
                            title: s.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
                            canonical: `https://www.creativefabrica.com/product/${s}/`
                        };
                    }
                    if (sourcesMap[s]) {
                        if (!prodObj.sourceQuery && sourcesMap[s].sourceQuery) prodObj.sourceQuery = sourcesMap[s].sourceQuery;
                        if (!prodObj.sourceComment && sourcesMap[s].sourceComment) prodObj.sourceComment = sourcesMap[s].sourceComment;
                        if (!prodObj.sourceUrl && sourcesMap[s].sourceUrl) prodObj.sourceUrl = sourcesMap[s].sourceUrl;
                    }
                    items.push({
                        slug: s,
                        deletedAt: null,
                        reason: `Исключён из фильтра "${filterId}"`,
                        isFilterExcluded: true,
                        product: prodObj
                    });
                }

                res.writeHead(200, { "Content-Type": "application/json" });
                res.end(JSON.stringify({ items, count: items.length, isFilter: true }));
                return;
            }

            // Основная корзина подборки
            const trashData = await getTrashData(colDir);
            const items = trashData.items || [];

            // Обогащаем данными о рейтинге, лайках, тегах, источнике сбора и канонической ссылке если нужно
            for (const item of items) {
                if (!item.product) {
                    item.product = { slug: item.slug, title: item.slug };
                }
                if (!item.product.canonical) {
                    item.product.canonical = `https://www.creativefabrica.com/product/${item.slug}/`;
                }
                try {
                    const singleData = JSON.parse(await fs.readFile(path.join(prodDir, `${item.slug}.json`), "utf8"));
                    if (singleData.rating !== undefined && (item.product.rating === undefined || item.product.rating === null)) item.product.rating = singleData.rating;
                    if (singleData.reviewsCount !== undefined) item.product.reviewsCount = singleData.reviewsCount;
                    if (singleData.favorites !== undefined) item.product.favorites = singleData.favorites;
                    if (singleData.favoritesRaw !== undefined) item.product.favoritesRaw = singleData.favoritesRaw;
                    if (singleData.designerTags) item.product.designerTags = singleData.designerTags;
                    if (singleData.canonical) item.product.canonical = singleData.canonical;
                    if (singleData.sourceQuery) item.product.sourceQuery = singleData.sourceQuery;
                    if (singleData.sourceComment) item.product.sourceComment = singleData.sourceComment;
                    if (singleData.sourceUrl) item.product.sourceUrl = singleData.sourceUrl;
                } catch {}

                if (sourcesMap[item.slug]) {
                    if (!item.product.sourceQuery && sourcesMap[item.slug].sourceQuery) item.product.sourceQuery = sourcesMap[item.slug].sourceQuery;
                    if (!item.product.sourceComment && sourcesMap[item.slug].sourceComment) item.product.sourceComment = sourcesMap[item.slug].sourceComment;
                    if (!item.product.sourceUrl && sourcesMap[item.slug].sourceUrl) item.product.sourceUrl = sourcesMap[item.slug].sourceUrl;
                }
            }

            res.writeHead(200, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ items, count: items.length, isFilter: false }));
        } catch (e) {
            res.writeHead(500, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ error: e.message }));
        }
        return;
    }

    // 4. API: Удаление одного товара (Soft Delete -> В корзину)
    if (pathname === "/api/delete-product" && req.method === "POST") {
        try {
            const { category, collection, filter: filterId, slug, reason } = await parseJsonBody(req);
            if (!category || !collection || !slug) {
                res.writeHead(400, { "Content-Type": "application/json" });
                res.end(JSON.stringify({ error: "Некорректные параметры" }));
                return;
            }

            const colDir = path.join(CONTENT_DIR, category, collection);

            // Если удаляем ТОЛЬКО ИЗ ФИЛЬТРА:
            if (filterId) {
                const filterColPath = path.join(colDir, "filter_collections", `${filterId}.json`);
                try {
                    const raw = await fs.readFile(filterColPath, "utf8");
                    const fData = JSON.parse(raw);
                    
                    const originalIndex = (fData.items || []).indexOf(slug);
                    fData.items = (fData.items || []).filter(s => s !== slug);
                    fData.excludedItems = fData.excludedItems || [];
                    if (!fData.excludedItems.includes(slug)) {
                        fData.excludedItems.push(slug);
                    }
                    fData.updatedAt = new Date().toISOString();

                    await fs.writeFile(filterColPath, JSON.stringify(fData, null, 2), "utf8");
                    res.writeHead(200, { "Content-Type": "application/json" });
                    res.end(JSON.stringify({ 
                        success: true, 
                        count: fData.items.length, 
                        trashCount: fData.excludedItems.length,
                        isFilter: true,
                        deletedItem: { slug, index: originalIndex }
                    }));
                    return;
                } catch (e) {
                    res.writeHead(500, { "Content-Type": "application/json" });
                    res.end(JSON.stringify({ error: "Не удалось обновить фильтр: " + e.message }));
                    return;
                }
            }

            // Иначе перемещаем В КОРЗИНУ подборки (trash.json)
            const allProdPath = path.join(colDir, "all_products.json");
            const collectionFilePath = path.join(colDir, "collection.json");
            const linksFilePath = path.join(colDir, "links.txt");
            const infoFilePath = path.join(colDir, "info.json");
            const productFilePath = path.join(colDir, "products", `${slug}.json`);

            let prodData = null;
            try {
                prodData = JSON.parse(await fs.readFile(productFilePath, "utf8"));
            } catch {}

            let products = JSON.parse(await fs.readFile(allProdPath, "utf8"));
            const originalIndex = products.findIndex(p => p.slug === slug);
            if (!prodData && originalIndex !== -1) prodData = products[originalIndex];

            // Формируем запись корзины
            const trashData = await getTrashData(colDir);
            const trashEntry = {
                slug: slug,
                deletedAt: new Date().toISOString(),
                reason: reason || "Ручное перемещение в корзину",
                originalIndex: originalIndex >= 0 ? originalIndex : 0,
                product: prodData || { slug, title: slug }
            };

            // Обновляем корзину (удаляем дубликат если был, и добавляем в начало)
            trashData.items = [trashEntry, ...(trashData.items || []).filter(i => i.slug !== slug)];
            await saveTrashData(colDir, trashData);

            // Удаляем из активных списков
            products = products.filter(p => p.slug !== slug);
            await fs.writeFile(allProdPath, JSON.stringify(products, null, 2), "utf8");

            try {
                const colData = JSON.parse(await fs.readFile(collectionFilePath, "utf8"));
                colData.items = (colData.items || []).filter(s => s !== slug);
                await fs.writeFile(collectionFilePath, JSON.stringify(colData, null, 2), "utf8");
            } catch {}

            try {
                const linksContent = await fs.readFile(linksFilePath, "utf8");
                const filteredLines = linksContent.split("\n").filter(l => {
                    const clean = normalizeProductUrl(l);
                    return getSlugFromUrl(clean) !== slug;
                });
                await fs.writeFile(linksFilePath, filteredLines.join("\n"), "utf8");
            } catch {}

            try {
                const infoData = JSON.parse(await fs.readFile(infoFilePath, "utf8"));
                infoData.count = products.length;
                await fs.writeFile(infoFilePath, JSON.stringify(infoData, null, 2), "utf8");
            } catch {}

            res.writeHead(200, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ 
                success: true, 
                count: products.length, 
                trashCount: trashData.items.length,
                isFilter: false, 
                deletedItem: trashEntry 
            }));
        } catch (e) {
            res.writeHead(500, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ error: e.message }));
        }
        return;
    }
    // 4.1. API: Множественное удаление товаров (Bulk Delete -> В корзину)
    if (pathname === "/api/bulk-delete" && req.method === "POST") {
        try {
            const { category, collection, filter: filterId, slugs, reason } = await parseJsonBody(req);
            if (!category || !collection || !Array.isArray(slugs) || slugs.length === 0) {
                res.writeHead(400, { "Content-Type": "application/json" });
                res.end(JSON.stringify({ error: "Параметры category, collection и массив slugs обязательны" }));
                return;
            }

            const colDir = path.join(CONTENT_DIR, category, collection);
            const slugsSet = new Set(slugs);

            // Если удаляем ИЗ ФИЛЬТРА:
            if (filterId) {
                const filterColPath = path.join(colDir, "filter_collections", `${filterId}.json`);
                const raw = await fs.readFile(filterColPath, "utf8");
                const fData = JSON.parse(raw);

                const originalItems = fData.items || [];
                const deletedItems = [];
                originalItems.forEach((s, idx) => {
                    if (slugsSet.has(s)) {
                        deletedItems.push({ slug: s, index: idx });
                    }
                });

                fData.items = originalItems.filter(s => !slugsSet.has(s));
                fData.excludedItems = fData.excludedItems || [];
                for (const s of slugs) {
                    if (!fData.excludedItems.includes(s)) {
                        fData.excludedItems.push(s);
                    }
                }
                fData.updatedAt = new Date().toISOString();

                await fs.writeFile(filterColPath, JSON.stringify(fData, null, 2), "utf8");
                res.writeHead(200, { "Content-Type": "application/json" });
                res.end(JSON.stringify({ 
                    success: true, 
                    count: fData.items.length, 
                    trashCount: fData.excludedItems.length,
                    isFilter: true, 
                    deletedItems 
                }));
                return;
            }

            // Иначе перемещаем В КОРЗИНУ подборки (trash.json)
            const allProdPath = path.join(colDir, "all_products.json");
            const collectionFilePath = path.join(colDir, "collection.json");
            const linksFilePath = path.join(colDir, "links.txt");
            const infoFilePath = path.join(colDir, "info.json");

            let existingAllProducts = [];
            try {
                existingAllProducts = JSON.parse(await fs.readFile(allProdPath, "utf8"));
            } catch {}

            const deletedItems = [];
            const newTrashEntries = [];

            existingAllProducts.forEach((p, idx) => {
                if (slugsSet.has(p.slug)) {
                    const entry = {
                        slug: p.slug,
                        deletedAt: new Date().toISOString(),
                        reason: reason || "Массовое перемещение в корзину",
                        originalIndex: idx,
                        product: p
                    };
                    deletedItems.push(entry);
                    newTrashEntries.push(entry);
                }
            });

            // Добавляем в trash.json
            const trashData = await getTrashData(colDir);
            const existingTrashSlugs = new Set((trashData.items || []).map(i => i.slug));
            const filteredNewEntries = newTrashEntries.filter(e => !existingTrashSlugs.has(e.slug));
            trashData.items = [...filteredNewEntries, ...(trashData.items || [])];
            await saveTrashData(colDir, trashData);

            // Обновляем all_products.json
            const remainingProducts = existingAllProducts.filter(p => !slugsSet.has(p.slug));
            await fs.writeFile(allProdPath, JSON.stringify(remainingProducts, null, 2), "utf8");

            // Обновляем collection.json
            try {
                const colData = JSON.parse(await fs.readFile(collectionFilePath, "utf8"));
                colData.items = (colData.items || []).filter(s => !slugsSet.has(s));
                await fs.writeFile(collectionFilePath, JSON.stringify(colData, null, 2), "utf8");
            } catch {}

            // Обновляем links.txt
            try {
                const linksContent = await fs.readFile(linksFilePath, "utf8");
                const filteredLines = linksContent.split("\n").filter(l => {
                    const clean = normalizeProductUrl(l);
                    return !slugsSet.has(getSlugFromUrl(clean));
                });
                await fs.writeFile(linksFilePath, filteredLines.join("\n"), "utf8");
            } catch {}

            // Обновляем info.json count
            try {
                const infoData = JSON.parse(await fs.readFile(infoFilePath, "utf8"));
                infoData.count = remainingProducts.length;
                await fs.writeFile(infoFilePath, JSON.stringify(infoData, null, 2), "utf8");
            } catch {}

            res.writeHead(200, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ 
                success: true, 
                count: remainingProducts.length, 
                trashCount: trashData.items.length,
                isFilter: false, 
                deletedItems 
            }));
        } catch (e) {
            res.writeHead(500, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ error: e.message }));
        }
        return;
    }

    // 4.2. API: Восстановление товаров (Undo для удаления)
    if (pathname === "/api/restore-products" && req.method === "POST") {
        try {
            const { category, collection, filter: filterId, items } = await parseJsonBody(req);
            if (!category || !collection || !Array.isArray(items) || items.length === 0) {
                res.writeHead(400, { "Content-Type": "application/json" });
                res.end(JSON.stringify({ error: "Некорректные параметры" }));
                return;
            }

            const colDir = path.join(CONTENT_DIR, category, collection);

            // Если восстанавливаем В ФИЛЬТР:
            if (filterId) {
                const filterColPath = path.join(colDir, "filter_collections", `${filterId}.json`);
                const raw = await fs.readFile(filterColPath, "utf8");
                const fData = JSON.parse(raw);

                const restoreSlugs = new Set(items.map(i => i.slug));
                fData.excludedItems = (fData.excludedItems || []).filter(s => !restoreSlugs.has(s));

                const sortedItems = [...items].sort((a, b) => (a.index ?? 0) - (b.index ?? 0));
                for (const it of sortedItems) {
                    if (!fData.items.includes(it.slug)) {
                        const targetIdx = Math.min(Math.max(0, it.index ?? fData.items.length), fData.items.length);
                        fData.items.splice(targetIdx, 0, it.slug);
                    }
                }
                fData.updatedAt = new Date().toISOString();

                await fs.writeFile(filterColPath, JSON.stringify(fData, null, 2), "utf8");
                res.writeHead(200, { "Content-Type": "application/json" });
                res.end(JSON.stringify({ success: true, count: fData.items.length, trashCount: fData.excludedItems.length, isFilter: true }));
                return;
            }

            // Иначе восстанавливаем В ОСНОВНУЮ ПОДБОРКУ:
            const allProdPath = path.join(colDir, "all_products.json");
            const collectionFilePath = path.join(colDir, "collection.json");
            const linksFilePath = path.join(colDir, "links.txt");
            const infoFilePath = path.join(colDir, "info.json");
            const prodDir = path.join(colDir, "products");

            let allProducts = JSON.parse(await fs.readFile(allProdPath, "utf8"));
            let collectionSlugs = [];
            try {
                collectionSlugs = JSON.parse(await fs.readFile(collectionFilePath, "utf8")).items || [];
            } catch {}

            let linksLines = [];
            try {
                linksLines = (await fs.readFile(linksFilePath, "utf8")).split("\n").filter(Boolean);
            } catch {}

            // Удаляем восстановленные элементы из trash.json
            const trashData = await getTrashData(colDir);
            const restoreSlugs = new Set(items.map(i => i.slug));
            trashData.items = (trashData.items || []).filter(i => !restoreSlugs.has(i.slug));
            await saveTrashData(colDir, trashData);

            // Восстанавливаем товары
            const sortedItems = [...items].sort((a, b) => (a.index ?? 0) - (b.index ?? 0));
            for (const it of sortedItems) {
                if (it.product) {
                    await fs.writeFile(path.join(prodDir, `${it.slug}.json`), JSON.stringify(it.product, null, 2), "utf8");
                }

                if (!allProducts.some(p => p.slug === it.slug) && it.product) {
                    const targetIdx = Math.min(Math.max(0, it.index ?? allProducts.length), allProducts.length);
                    allProducts.splice(targetIdx, 0, it.product);
                }

                if (!collectionSlugs.includes(it.slug)) {
                    const targetIdx = Math.min(Math.max(0, it.index ?? collectionSlugs.length), collectionSlugs.length);
                    collectionSlugs.splice(targetIdx, 0, it.slug);
                }

                const canonicalUrl = it.product?.canonical || it.url || `https://www.creativefabrica.com/product/${it.slug}/`;
                if (!linksLines.includes(canonicalUrl)) {
                    const targetIdx = Math.min(Math.max(0, it.index ?? linksLines.length), linksLines.length);
                    linksLines.splice(targetIdx, 0, canonicalUrl);
                }
            }

            await fs.writeFile(allProdPath, JSON.stringify(allProducts, null, 2), "utf8");
            await fs.writeFile(collectionFilePath, JSON.stringify({ items: collectionSlugs }, null, 2), "utf8");
            await fs.writeFile(linksFilePath, linksLines.join("\n") + "\n", "utf8");

            try {
                const infoData = JSON.parse(await fs.readFile(infoFilePath, "utf8"));
                infoData.count = allProducts.length;
                await fs.writeFile(infoFilePath, JSON.stringify(infoData, null, 2), "utf8");
            } catch {}

            res.writeHead(200, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ success: true, count: allProducts.length, trashCount: trashData.items.length, isFilter: false }));
        } catch (e) {
            res.writeHead(500, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ error: e.message }));
        }
        return;
    }

    // 4.3. API: Восстановление товаров из Корзины (Restore from Trash)
    if (pathname === "/api/trash/restore" && req.method === "POST") {
        try {
            const { category, collection, filter: filterId, slugs } = await parseJsonBody(req);
            if (!category || !collection || !Array.isArray(slugs) || slugs.length === 0) {
                res.writeHead(400, { "Content-Type": "application/json" });
                res.end(JSON.stringify({ error: "Параметры category, collection и массив slugs обязательны" }));
                return;
            }

            const colDir = path.join(CONTENT_DIR, category, collection);
            const slugsSet = new Set(slugs);

            // Восстановление в фильтр (из excludedItems в items)
            if (filterId) {
                const filterColPath = path.join(colDir, "filter_collections", `${filterId}.json`);
                const raw = await fs.readFile(filterColPath, "utf8");
                const fData = JSON.parse(raw);

                fData.excludedItems = (fData.excludedItems || []).filter(s => !slugsSet.has(s));
                fData.items = fData.items || [];
                for (const s of slugs) {
                    if (!fData.items.includes(s)) {
                        fData.items.push(s);
                    }
                }
                fData.updatedAt = new Date().toISOString();
                await fs.writeFile(filterColPath, JSON.stringify(fData, null, 2), "utf8");

                res.writeHead(200, { "Content-Type": "application/json" });
                res.end(JSON.stringify({ 
                    success: true, 
                    count: fData.items.length, 
                    trashCount: fData.excludedItems.length,
                    isFilter: true 
                }));
                return;
            }

            // Восстановление в основную подборку из trash.json
            const allProdPath = path.join(colDir, "all_products.json");
            const collectionFilePath = path.join(colDir, "collection.json");
            const linksFilePath = path.join(colDir, "links.txt");
            const infoFilePath = path.join(colDir, "info.json");
            const prodDir = path.join(colDir, "products");

            const trashData = await getTrashData(colDir);
            let allProducts = JSON.parse(await fs.readFile(allProdPath, "utf8"));
            let collectionSlugs = [];
            try {
                collectionSlugs = JSON.parse(await fs.readFile(collectionFilePath, "utf8")).items || [];
            } catch {}
            let linksLines = [];
            try {
                linksLines = (await fs.readFile(linksFilePath, "utf8")).split("\n").filter(Boolean);
            } catch {}

            const itemsToRestore = (trashData.items || []).filter(it => slugsSet.has(it.slug));
            trashData.items = (trashData.items || []).filter(it => !slugsSet.has(it.slug));

            // Сортируем по originalIndex для возврата на свои места
            itemsToRestore.sort((a, b) => (a.originalIndex ?? 0) - (b.originalIndex ?? 0));

            for (const it of itemsToRestore) {
                let prod = it.product;
                if (!prod) {
                    try {
                        prod = JSON.parse(await fs.readFile(path.join(prodDir, `${it.slug}.json`), "utf8"));
                    } catch {
                        prod = { slug: it.slug, title: it.slug };
                    }
                }

                // Гарантируем сохранение файла товара
                await fs.writeFile(path.join(prodDir, `${it.slug}.json`), JSON.stringify(prod, null, 2), "utf8");

                if (!allProducts.some(p => p.slug === it.slug)) {
                    const targetIdx = Math.min(Math.max(0, it.originalIndex ?? allProducts.length), allProducts.length);
                    allProducts.splice(targetIdx, 0, prod);
                }

                if (!collectionSlugs.includes(it.slug)) {
                    const targetIdx = Math.min(Math.max(0, it.originalIndex ?? collectionSlugs.length), collectionSlugs.length);
                    collectionSlugs.splice(targetIdx, 0, it.slug);
                }

                const canonicalUrl = prod.canonical || `https://www.creativefabrica.com/product/${it.slug}/`;
                if (!linksLines.includes(canonicalUrl)) {
                    const targetIdx = Math.min(Math.max(0, it.originalIndex ?? linksLines.length), linksLines.length);
                    linksLines.splice(targetIdx, 0, canonicalUrl);
                }
            }

            await saveTrashData(colDir, trashData);
            await fs.writeFile(allProdPath, JSON.stringify(allProducts, null, 2), "utf8");
            await fs.writeFile(collectionFilePath, JSON.stringify({ items: collectionSlugs }, null, 2), "utf8");
            await fs.writeFile(linksFilePath, linksLines.join("\n") + "\n", "utf8");

            try {
                const infoData = JSON.parse(await fs.readFile(infoFilePath, "utf8"));
                infoData.count = allProducts.length;
                await fs.writeFile(infoFilePath, JSON.stringify(infoData, null, 2), "utf8");
            } catch {}

            res.writeHead(200, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ 
                success: true, 
                count: allProducts.length, 
                trashCount: trashData.items.length, 
                restoredCount: itemsToRestore.length 
            }));
        } catch (e) {
            res.writeHead(500, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ error: e.message }));
        }
        return;
    }

    // 4.4. API: Восстановить ВСЕ товары из Корзины (Restore All)
    if (pathname === "/api/trash/restore-all" && req.method === "POST") {
        try {
            const { category, collection, filter: filterId } = await parseJsonBody(req);
            if (!category || !collection) {
                res.writeHead(400, { "Content-Type": "application/json" });
                res.end(JSON.stringify({ error: "Параметры category и collection обязательны" }));
                return;
            }

            const colDir = path.join(CONTENT_DIR, category, collection);

            if (filterId) {
                const filterColPath = path.join(colDir, "filter_collections", `${filterId}.json`);
                const raw = await fs.readFile(filterColPath, "utf8");
                const fData = JSON.parse(raw);
                const excluded = fData.excludedItems || [];

                fData.items = fData.items || [];
                for (const s of excluded) {
                    if (!fData.items.includes(s)) {
                        fData.items.push(s);
                    }
                }
                fData.excludedItems = [];
                fData.updatedAt = new Date().toISOString();
                await fs.writeFile(filterColPath, JSON.stringify(fData, null, 2), "utf8");

                res.writeHead(200, { "Content-Type": "application/json" });
                res.end(JSON.stringify({ success: true, count: fData.items.length, trashCount: 0, isFilter: true }));
                return;
            }

            const trashData = await getTrashData(colDir);
            const allSlugs = (trashData.items || []).map(i => i.slug);

            if (allSlugs.length === 0) {
                res.writeHead(200, { "Content-Type": "application/json" });
                res.end(JSON.stringify({ success: true, count: 0, trashCount: 0, restoredCount: 0 }));
                return;
            }

            // Восстанавливаем через restore логику
            const allProdPath = path.join(colDir, "all_products.json");
            const collectionFilePath = path.join(colDir, "collection.json");
            const linksFilePath = path.join(colDir, "links.txt");
            const infoFilePath = path.join(colDir, "info.json");
            const prodDir = path.join(colDir, "products");

            let allProducts = JSON.parse(await fs.readFile(allProdPath, "utf8"));
            let collectionSlugs = [];
            try {
                collectionSlugs = JSON.parse(await fs.readFile(collectionFilePath, "utf8")).items || [];
            } catch {}
            let linksLines = [];
            try {
                linksLines = (await fs.readFile(linksFilePath, "utf8")).split("\n").filter(Boolean);
            } catch {}

            const itemsToRestore = [...(trashData.items || [])];
            trashData.items = [];

            itemsToRestore.sort((a, b) => (a.originalIndex ?? 0) - (b.originalIndex ?? 0));

            for (const it of itemsToRestore) {
                let prod = it.product;
                if (!prod) {
                    try {
                        prod = JSON.parse(await fs.readFile(path.join(prodDir, `${it.slug}.json`), "utf8"));
                    } catch {
                        prod = { slug: it.slug, title: it.slug };
                    }
                }

                await fs.writeFile(path.join(prodDir, `${it.slug}.json`), JSON.stringify(prod, null, 2), "utf8");

                if (!allProducts.some(p => p.slug === it.slug)) {
                    const targetIdx = Math.min(Math.max(0, it.originalIndex ?? allProducts.length), allProducts.length);
                    allProducts.splice(targetIdx, 0, prod);
                }

                if (!collectionSlugs.includes(it.slug)) {
                    const targetIdx = Math.min(Math.max(0, it.originalIndex ?? collectionSlugs.length), collectionSlugs.length);
                    collectionSlugs.splice(targetIdx, 0, it.slug);
                }

                const canonicalUrl = prod.canonical || `https://www.creativefabrica.com/product/${it.slug}/`;
                if (!linksLines.includes(canonicalUrl)) {
                    const targetIdx = Math.min(Math.max(0, it.originalIndex ?? linksLines.length), linksLines.length);
                    linksLines.splice(targetIdx, 0, canonicalUrl);
                }
            }

            await saveTrashData(colDir, trashData);
            await fs.writeFile(allProdPath, JSON.stringify(allProducts, null, 2), "utf8");
            await fs.writeFile(collectionFilePath, JSON.stringify({ items: collectionSlugs }, null, 2), "utf8");
            await fs.writeFile(linksFilePath, linksLines.join("\n") + "\n", "utf8");

            try {
                const infoData = JSON.parse(await fs.readFile(infoFilePath, "utf8"));
                infoData.count = allProducts.length;
                await fs.writeFile(infoFilePath, JSON.stringify(infoData, null, 2), "utf8");
            } catch {}

            res.writeHead(200, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ 
                success: true, 
                count: allProducts.length, 
                trashCount: 0, 
                restoredCount: itemsToRestore.length 
            }));
        } catch (e) {
            res.writeHead(500, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ error: e.message }));
        }
        return;
    }

    // 4.5. API: Окончательное удаление товаров из Корзины (Permanent Delete -> delete_links.txt)
    if (pathname === "/api/trash/permanent-delete" && req.method === "POST") {
        try {
            const { category, collection, filter: filterId, slugs, entireCollection } = await parseJsonBody(req);
            if (!category || !collection || !Array.isArray(slugs) || slugs.length === 0) {
                res.writeHead(400, { "Content-Type": "application/json" });
                res.end(JSON.stringify({ error: "Параметры category, collection и slugs обязательны" }));
                return;
            }

            const colDir = path.join(CONTENT_DIR, category, collection);
            const slugsSet = new Set(slugs);

            // Если удаляем только из списка исключений фильтра (не трогая каталог):
            if (filterId && !entireCollection) {
                const filterColPath = path.join(colDir, "filter_collections", `${filterId}.json`);
                const raw = await fs.readFile(filterColPath, "utf8");
                const fData = JSON.parse(raw);
                fData.excludedItems = (fData.excludedItems || []).filter(s => !slugsSet.has(s));
                fData.updatedAt = new Date().toISOString();
                await fs.writeFile(filterColPath, JSON.stringify(fData, null, 2), "utf8");

                res.writeHead(200, { "Content-Type": "application/json" });
                res.end(JSON.stringify({ 
                    success: true, 
                    trashCount: fData.excludedItems.length, 
                    isFilter: true 
                }));
                return;
            }

            // Окончательное удаление из ВСЕЙ подборки (запись в delete_links.txt)
            const deleteLinksPath = path.join(colDir, "delete_links.txt");
            const prodDir = path.join(colDir, "products");
            const trashData = await getTrashData(colDir);

            const urlsToDelete = [];
            for (const s of slugs) {
                let canonical = null;
                const trItem = (trashData.items || []).find(i => i.slug === s);
                if (trItem?.product?.canonical) {
                    canonical = trItem.product.canonical;
                } else {
                    try {
                        const pData = JSON.parse(await fs.readFile(path.join(prodDir, `${s}.json`), "utf8"));
                        canonical = pData.canonical;
                    } catch {}
                }
                urlsToDelete.push(canonical || `https://www.creativefabrica.com/product/${s}/`);
            }

            // Записываем в delete_links.txt
            let existingDeleteText = "";
            try {
                existingDeleteText = await fs.readFile(deleteLinksPath, "utf8");
            } catch {}

            const updatedDeleteText = appendToDeleteLinks(existingDeleteText, "--- ручное удаление ---", urlsToDelete);
            await fs.writeFile(deleteLinksPath, updatedDeleteText, "utf8");

            // Удаляем из trash.json
            trashData.items = (trashData.items || []).filter(it => !slugsSet.has(it.slug));
            await saveTrashData(colDir, trashData);

            // Удаляем файлы продуктов
            for (const s of slugs) {
                try {
                    await fs.unlink(path.join(prodDir, `${s}.json`));
                } catch {}
            }

            // Чистим из всех filter_collections
            const filterDir = path.join(colDir, "filter_collections");
            try {
                const fEntries = await fs.readdir(filterDir);
                for (const fFile of fEntries) {
                    if (fFile.endsWith(".json")) {
                        const fPath = path.join(filterDir, fFile);
                        try {
                            const fRaw = await fs.readFile(fPath, "utf8");
                            const fObj = JSON.parse(fRaw);
                            let changed = false;
                            if (Array.isArray(fObj.items)) {
                                const origLen = fObj.items.length;
                                fObj.items = fObj.items.filter(s => !slugsSet.has(s));
                                if (fObj.items.length !== origLen) changed = true;
                            }
                            if (Array.isArray(fObj.excludedItems)) {
                                const origLen = fObj.excludedItems.length;
                                fObj.excludedItems = fObj.excludedItems.filter(s => !slugsSet.has(s));
                                if (fObj.excludedItems.length !== origLen) changed = true;
                            }
                            if (changed) {
                                fObj.updatedAt = new Date().toISOString();
                                await fs.writeFile(fPath, JSON.stringify(fObj, null, 2), "utf8");
                            }
                        } catch {}
                    }
                }
            } catch {}

            res.writeHead(200, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ 
                success: true, 
                deletedCount: slugs.length, 
                trashCount: trashData.items.length, 
                isFilter: false 
            }));
        } catch (e) {
            res.writeHead(500, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ error: e.message }));
        }
        return;
    }

    // 4.6. API: Очистить ВСЮ корзину (Empty Trash)
    if (pathname === "/api/trash/empty" && req.method === "POST") {
        try {
            const { category, collection, filter: filterId } = await parseJsonBody(req);
            if (!category || !collection) {
                res.writeHead(400, { "Content-Type": "application/json" });
                res.end(JSON.stringify({ error: "Параметры category и collection обязательны" }));
                return;
            }

            const colDir = path.join(CONTENT_DIR, category, collection);

            if (filterId) {
                const filterColPath = path.join(colDir, "filter_collections", `${filterId}.json`);
                const raw = await fs.readFile(filterColPath, "utf8");
                const fData = JSON.parse(raw);
                fData.excludedItems = [];
                fData.updatedAt = new Date().toISOString();
                await fs.writeFile(filterColPath, JSON.stringify(fData, null, 2), "utf8");

                res.writeHead(200, { "Content-Type": "application/json" });
                res.end(JSON.stringify({ success: true, trashCount: 0, isFilter: true }));
                return;
            }

            const trashData = await getTrashData(colDir);
            const allSlugs = (trashData.items || []).map(i => i.slug);

            if (allSlugs.length === 0) {
                res.writeHead(200, { "Content-Type": "application/json" });
                res.end(JSON.stringify({ success: true, deletedCount: 0, trashCount: 0 }));
                return;
            }

            const deleteLinksPath = path.join(colDir, "delete_links.txt");
            const prodDir = path.join(colDir, "products");

            const urlsToDelete = [];
            for (const item of (trashData.items || [])) {
                const canonical = item.product?.canonical || `https://www.creativefabrica.com/product/${item.slug}/`;
                urlsToDelete.push(canonical);
            }

            let existingDeleteText = "";
            try {
                existingDeleteText = await fs.readFile(deleteLinksPath, "utf8");
            } catch {}

            const updatedDeleteText = appendToDeleteLinks(existingDeleteText, "--- ручное удаление ---", urlsToDelete);
            await fs.writeFile(deleteLinksPath, updatedDeleteText, "utf8");

            trashData.items = [];
            await saveTrashData(colDir, trashData);

            for (const s of allSlugs) {
                try {
                    await fs.unlink(path.join(prodDir, `${s}.json`));
                } catch {}
            }

            // Чистим из всех filter_collections
            const filterDir = path.join(colDir, "filter_collections");
            const slugsSet = new Set(allSlugs);
            try {
                const fEntries = await fs.readdir(filterDir);
                for (const fFile of fEntries) {
                    if (fFile.endsWith(".json")) {
                        const fPath = path.join(filterDir, fFile);
                        try {
                            const fRaw = await fs.readFile(fPath, "utf8");
                            const fObj = JSON.parse(fRaw);
                            let changed = false;
                            if (Array.isArray(fObj.items)) {
                                const origLen = fObj.items.length;
                                fObj.items = fObj.items.filter(s => !slugsSet.has(s));
                                if (fObj.items.length !== origLen) changed = true;
                            }
                            if (Array.isArray(fObj.excludedItems)) {
                                const origLen = fObj.excludedItems.length;
                                fObj.excludedItems = fObj.excludedItems.filter(s => !slugsSet.has(s));
                                if (fObj.excludedItems.length !== origLen) changed = true;
                            }
                            if (changed) {
                                fObj.updatedAt = new Date().toISOString();
                                await fs.writeFile(fPath, JSON.stringify(fObj, null, 2), "utf8");
                            }
                        } catch {}
                    }
                }
            } catch {}

            res.writeHead(200, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ 
                success: true, 
                deletedCount: allSlugs.length, 
                trashCount: 0, 
                isFilter: false 
            }));
        } catch (e) {
            res.writeHead(500, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ error: e.message }));
        }
        return;
    }

    // 4.3. API: Предпросмотр информации о товаре по ссылке (парсинг заголовка и картинки)
    if (pathname === "/api/fetch-preview" && req.method === "POST") {
        try {
            const { url } = await parseJsonBody(req);
            if (!url) {
                res.writeHead(400, { "Content-Type": "application/json" });
                res.end(JSON.stringify({ error: "URL обязателен" }));
                return;
            }

            const cleanUrl = normalizeProductUrl(url);
            const slug = getSlugFromUrl(cleanUrl);
            const fallbackTitle = slug.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');

            const preview = await fetchCfPreview(cleanUrl);

            res.writeHead(200, { "Content-Type": "application/json" });
            res.end(JSON.stringify({
                success: true,
                slug,
                url: cleanUrl,
                title: preview.title || fallbackTitle,
                image: preview.image || "",
                favorites: preview.favorites,
                favoritesRaw: preview.favoritesRaw,
                designerTags: preview.designerTags || []
            }));
        } catch (e) {
            res.writeHead(500, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ error: e.message }));
        }
        return;
    }

    // 4.4. API: Вставка товара в произвольную позицию (+ между карточками)
    if (pathname === "/api/insert-product" && req.method === "POST") {
        try {
            const { category, collection, filter: filterId, url, imageUrl, title: customTitle, targetIndex } = await parseJsonBody(req);
            if (!category || !collection || !url) {
                res.writeHead(400, { "Content-Type": "application/json" });
                res.end(JSON.stringify({ error: "Поля category, collection и url обязательны" }));
                return;
            }

            const cleanUrl = normalizeProductUrl(url);
            const slug = getSlugFromUrl(cleanUrl);
            if (!slug) {
                res.writeHead(400, { "Content-Type": "application/json" });
                res.end(JSON.stringify({ error: "Не удалось определить slug товара" }));
                return;
            }

            const colDir = path.join(CONTENT_DIR, category, collection);
            const prodDir = path.join(colDir, "products");
            await fs.mkdir(prodDir, { recursive: true });

            const productFilePath = path.join(prodDir, `${slug}.json`);
            let productObj = null;

            // 1. Проверяем, существует ли уже файл этого товара
            try {
                const existingProdRaw = await fs.readFile(productFilePath, "utf8");
                productObj = JSON.parse(existingProdRaw);
            } catch {
                // Если нет — собираем превью с сайта
                let preview = { title: "", image: "", favorites: null, favoritesRaw: null, designerTags: [], designerTagLinks: [] };
                try {
                    preview = await fetchCfPreview(cleanUrl);
                } catch {}

                const fallbackTitle = slug.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
                productObj = {
                    title: customTitle?.trim() || preview.title || fallbackTitle,
                    description: "",
                    image: imageUrl?.trim() || preview.image || "",
                    url: cleanUrl,
                    canonical: cleanUrl,
                    slug: slug,
                    rating: null,
                    reviewsCount: 0,
                    favorites: preview.favorites ?? null,
                    favoritesRaw: preview.favoritesRaw ?? null,
                    designerTags: preview.designerTags ?? [],
                    designerTagLinks: preview.designerTagLinks ?? [],
                    tags: preview.designerTags ?? [],
                    isDraft: true
                };

                await fs.writeFile(productFilePath, JSON.stringify(productObj, null, 2), "utf8");
            }

            // Если передана картинка вручную и у товара её не было — обновляем
            if (imageUrl && (!productObj.image || imageUrl.trim() !== productObj.image)) {
                productObj.image = imageUrl.trim();
                await fs.writeFile(productFilePath, JSON.stringify(productObj, null, 2), "utf8");
            }

            const allProdPath = path.join(colDir, "all_products.json");
            const collectionFilePath = path.join(colDir, "collection.json");
            const linksFilePath = path.join(colDir, "links.txt");
            const deleteLinksPath = path.join(colDir, "delete_links.txt");
            const infoFilePath = path.join(colDir, "info.json");

            let allProducts = [];
            try {
                allProducts = JSON.parse(await fs.readFile(allProdPath, "utf8"));
            } catch {}

            let collectionSlugs = [];
            try {
                collectionSlugs = JSON.parse(await fs.readFile(collectionFilePath, "utf8")).items || [];
            } catch {}

            let linksLines = [];
            try {
                linksLines = (await fs.readFile(linksFilePath, "utf8")).split("\n").filter(Boolean);
            } catch {}

            // Удаляем старые позиции если товар уже был в подборке
            allProducts = allProducts.filter(p => p.slug !== slug);
            collectionSlugs = collectionSlugs.filter(s => s !== slug);
            linksLines = linksLines.filter(l => getSlugFromUrl(normalizeProductUrl(l)) !== slug);

            // Индекс вставки
            let insertIdx = typeof targetIndex === "number" ? targetIndex : allProducts.length;
            if (insertIdx < 0) insertIdx = 0;
            if (insertIdx > allProducts.length) insertIdx = allProducts.length;

            allProducts.splice(insertIdx, 0, productObj);
            collectionSlugs.splice(insertIdx, 0, slug);
            linksLines.splice(insertIdx, 0, cleanUrl);

            // Очищаем из delete_links.txt если человек вернул этот товар
            try {
                let delText = await fs.readFile(deleteLinksPath, "utf8");
                if (delText.includes(cleanUrl) || delText.includes(slug)) {
                    const cleanedLines = delText.split("\n").filter(l => !l.includes(cleanUrl) && !l.includes(slug));
                    await fs.writeFile(deleteLinksPath, cleanedLines.join("\n") + "\n", "utf8");
                }
            } catch {}

            // Сохраняем основные файлы каталога
            await fs.writeFile(allProdPath, JSON.stringify(allProducts, null, 2), "utf8");
            await fs.writeFile(collectionFilePath, JSON.stringify({ items: collectionSlugs }, null, 2), "utf8");
            await fs.writeFile(linksFilePath, linksLines.join("\n") + "\n", "utf8");

            // Если открыт конкретный фильтр — также вставляем в filter_collections
            if (filterId) {
                const filterColPath = path.join(colDir, "filter_collections", `${filterId}.json`);
                let fData = { filterId, label: filterId, items: [], excludedItems: [] };
                try {
                    fData = JSON.parse(await fs.readFile(filterColPath, "utf8"));
                } catch {}

                fData.items = (fData.items || []).filter(s => s !== slug);
                fData.excludedItems = (fData.excludedItems || []).filter(s => s !== slug);

                let fInsertIdx = typeof targetIndex === "number" ? targetIndex : fData.items.length;
                if (fInsertIdx < 0) fInsertIdx = 0;
                if (fInsertIdx > fData.items.length) fInsertIdx = fData.items.length;

                fData.items.splice(fInsertIdx, 0, slug);
                fData.updatedAt = new Date().toISOString();
                await fs.writeFile(filterColPath, JSON.stringify(fData, null, 2), "utf8");
            }

            try {
                const infoData = JSON.parse(await fs.readFile(infoFilePath, "utf8"));
                infoData.count = allProducts.length;
                await fs.writeFile(infoFilePath, JSON.stringify(infoData, null, 2), "utf8");
            } catch {}

            res.writeHead(200, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ 
                success: true, 
                product: productObj, 
                index: insertIdx, 
                count: allProducts.length 
            }));
        } catch (e) {
            res.writeHead(500, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ error: e.message }));
        }
        return;
    }

    function isProductIncomplete(p) {
        if (!p) return false;
        if (Boolean(p.isDraft)) return true;
        const desc = (p.fullDescription || p.description || "").trim();
        if (desc.length < 15) return true;
        if (!p.image && (!Array.isArray(p.gallery) || p.gallery.length === 0)) return true;
        return false;
    }

    // 4.5. API ДЛЯ БРАУЗЕРНОГО РАСШИРЕНИЯ (Chrome Extension): Статус подборки (слаги товаров и корзины)
    if (pathname === "/api/extension/status" && req.method === "GET") {
        try {
            const category = reqUrl.searchParams.get("category");
            const collection = reqUrl.searchParams.get("collection");
            if (!category || !collection) {
                res.writeHead(200, { "Content-Type": "application/json" });
                res.end(JSON.stringify({
                    success: true,
                    category: category || "",
                    collection: collection || "",
                    count: 0,
                    slugs: [],
                    deletedSlugs: [],
                    draftSlugs: []
                }));
                return;
            }

            const colDir = path.join(CONTENT_DIR, category, collection);
            const colKey = `${category}/${collection}`;
            const deleteLinksPath = path.join(colDir, "delete_links.txt");

            const { allProducts, collectionSlugs } = await runWithCollectionLock(colKey, () => reconcileCollection(colDir));
            const slugs = collectionSlugs;

            let deletedSlugs = [];
            try {
                const delText = await fs.readFile(deleteLinksPath, "utf8");
                deletedSlugs = delText.split("\n")
                    .map(l => l.trim())
                    .filter(l => l.startsWith("http"))
                    .map(l => getSlugFromUrl(normalizeProductUrl(l)))
                    .filter(Boolean);
            } catch {}

            let draftSlugs = allProducts.filter(isProductIncomplete).map(p => p.slug);

            res.writeHead(200, { "Content-Type": "application/json" });
            res.end(JSON.stringify({
                success: true,
                category,
                collection,
                count: slugs.length,
                slugs: [...new Set(slugs)],
                deletedSlugs: [...new Set(deletedSlugs)],
                draftSlugs: [...new Set(draftSlugs)]
            }));
        } catch (e) {
            res.writeHead(500, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ error: e.message }));
        }
        return;
    }

    // 4.55. API ДЛЯ БРАУЗЕРНОГО РАСШИРЕНИЯ: Список товаров с неполной информацией (черновики / неполное описание / без фото)
    if (pathname === "/api/extension/incomplete-products" && req.method === "GET") {
        try {
            const category = reqUrl.searchParams.get("category");
            const collection = reqUrl.searchParams.get("collection");

            const incompleteItems = [];

            const checkCollection = async (cat, col) => {
                const colDir = path.join(CONTENT_DIR, cat, col);
                const allProdPath = path.join(colDir, "all_products.json");
                try {
                    const allData = JSON.parse(await fs.readFile(allProdPath, "utf8"));
                    for (const p of allData) {
                        if (isProductIncomplete(p)) {
                            incompleteItems.push({
                                category: cat,
                                collection: col,
                                slug: p.slug,
                                title: p.title || p.slug,
                                author: p.author || "",
                                url: p.canonical || p.url || `https://www.creativefabrica.com/product/${p.slug}/`,
                                image: p.image || "",
                                gallery: p.gallery || []
                            });
                        }
                    }
                } catch {}
            };

            if (category && collection) {
                await checkCollection(category, collection);
            } else if (category) {
                const catDir = path.join(CONTENT_DIR, category);
                try {
                    const cols = (await fs.readdir(catDir, { withFileTypes: true }))
                        .filter(d => d.isDirectory())
                        .map(d => d.name);
                    for (const col of cols) {
                        await checkCollection(category, col);
                    }
                } catch {}
            } else {
                const entries = await fs.readdir(CONTENT_DIR, { withFileTypes: true });
                const cats = entries.filter(d => d.isDirectory() && d.name !== "products").map(d => d.name);
                for (const cat of cats) {
                    const catPath = path.join(CONTENT_DIR, cat);
                    let cols = [];
                    try {
                        cols = (await fs.readdir(catPath, { withFileTypes: true }))
                            .filter(d => d.isDirectory())
                            .map(d => d.name);
                    } catch {}
                    for (const col of cols) {
                        await checkCollection(cat, col);
                    }
                }
            }

            res.writeHead(200, { "Content-Type": "application/json" });
            res.end(JSON.stringify({
                success: true,
                scope: (category && collection) ? "collection" : (category ? "category" : "all"),
                category: category || "",
                collection: collection || "",
                totalIncomplete: incompleteItems.length,
                items: incompleteItems
            }));
        } catch (e) {
            res.writeHead(500, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ error: e.message }));
        }
        return;
    }

    // 4.6. API ДЛЯ БРАУЗЕРНОГО РАСШИРЕНИЯ: Добавление одного товара напрямую из браузера
    if (pathname === "/api/extension/add-product" && req.method === "POST") {
        try {
            const { category, collection, product, mode = "full", position = "top" } = await parseJsonBody(req);
            if (!category || !collection || !product || !product.url) {
                res.writeHead(400, { "Content-Type": "application/json" });
                res.end(JSON.stringify({ error: "Поля category, collection и product.url обязательны" }));
                return;
            }

            const cleanUrl = normalizeProductUrl(product.url);
            const slug = product.slug || getSlugFromUrl(cleanUrl);
            if (!slug) {
                res.writeHead(400, { "Content-Type": "application/json" });
                res.end(JSON.stringify({ error: "Не удалось определить slug товара" }));
                return;
            }

            const colDir = path.join(CONTENT_DIR, category, collection);
            const colKey = `${category}/${collection}`;

            const result = await runWithCollectionLock(colKey, async () => {
                const prodDir = path.join(colDir, "products");
                await fs.mkdir(prodDir, { recursive: true });

                const productFilePath = path.join(prodDir, `${slug}.json`);
                let existingObj = {};
                try {
                    existingObj = JSON.parse(await fs.readFile(productFilePath, "utf8"));
                } catch {}

                const fallbackTitle = slug.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
                const isFullMode = mode === "full";

                let cleanImage = product.image || existingObj.image || "";
                if (cleanImage.includes('cdn.creativefabrica.com')) {
                    cleanImage = cleanImage
                        .replace(/-\d+x\d+(?=\.(jpg|jpeg|png|webp))/gi, '')
                        .replace(/-1-1(?=\.(jpg|jpeg|png|webp))/gi, '-1');
                }

                let gallery = Array.isArray(product.gallery) && product.gallery.length > 0 
                    ? product.gallery 
                    : (existingObj.gallery && existingObj.gallery.length > 0 ? existingObj.gallery : [cleanImage].filter(Boolean));

                const productObj = {
                    slug,
                    title: product.title?.trim() || existingObj.title || fallbackTitle,
                    author: product.author?.trim() || existingObj.author || "",
                    canonical: cleanUrl,
                    url: cleanUrl,
                    description: product.description || existingObj.description || "",
                    fullDescription: product.fullDescription || existingObj.fullDescription || "",
                    image: cleanImage,
                    gallery: gallery,
                    rating: product.rating ?? existingObj.rating ?? null,
                    reviewsCount: product.reviewsCount ?? existingObj.reviewsCount ?? (product.rating ? 1 : 0),
                    favorites: product.favorites ?? existingObj.favorites ?? null,
                    favoritesRaw: product.favoritesRaw ?? existingObj.favoritesRaw ?? null,
                    designerTags: product.designerTags || existingObj.designerTags || [],
                    designerTagLinks: product.designerTagLinks || existingObj.designerTagLinks || [],
                    tags: product.designerTags || existingObj.tags || [],
                    isDraft: !isFullMode,
                    addedViaExtension: true,
                    scrapedAt: new Date().toISOString()
                };

                await safeWriteJson(productFilePath, productObj);

                // Загружаем и восстанавливаем состояние подборки (ничего не теряя!)
                const { allProducts, collectionSlugs, linksLines } = await reconcileCollection(colDir);

                // Удаляем старые вхождения если уже был
                let updatedProducts = allProducts.filter(p => p.slug !== slug);
                let updatedSlugs = collectionSlugs.filter(s => s !== slug);
                let updatedLinks = linksLines.filter(l => getSlugFromUrl(normalizeProductUrl(l)) !== slug);

                // Вставляем наверх (позиция 0) или вниз
                if (position === "bottom") {
                    updatedProducts.push(productObj);
                    updatedSlugs.push(slug);
                    updatedLinks.push(cleanUrl);
                } else {
                    updatedProducts.unshift(productObj);
                    updatedSlugs.unshift(slug);
                    updatedLinks.unshift(cleanUrl);
                }

                // Очищаем из delete_links.txt
                const deleteLinksPath = path.join(colDir, "delete_links.txt");
                try {
                    let delText = await fs.readFile(deleteLinksPath, "utf8");
                    if (delText.includes(cleanUrl) || delText.includes(slug)) {
                        const cleanedLines = delText.split("\n").filter(l => !l.includes(cleanUrl) && !l.includes(slug));
                        await fs.writeFile(deleteLinksPath, cleanedLines.join("\n") + "\n", "utf8");
                    }
                } catch {}

                const allProdPath = path.join(colDir, "all_products.json");
                const collectionFilePath = path.join(colDir, "collection.json");
                const linksFilePath = path.join(colDir, "links.txt");
                const infoFilePath = path.join(colDir, "info.json");

                await safeWriteJson(allProdPath, updatedProducts);
                await safeWriteJson(collectionFilePath, { items: updatedSlugs });
                await fs.writeFile(linksFilePath, updatedLinks.join("\n") + "\n", "utf8");

                // Обновляем info.json
                try {
                    let infoData = { title: collection, count: updatedProducts.length, image: "" };
                    try { infoData = JSON.parse(await fs.readFile(infoFilePath, "utf8")); } catch {}
                    infoData.count = updatedProducts.length;
                    if (!infoData.image && cleanImage) infoData.image = cleanImage;
                    await safeWriteJson(infoFilePath, infoData);
                } catch {}

                return {
                    slug,
                    title: productObj.title,
                    image: productObj.image,
                    isDraft: productObj.isDraft,
                    totalCount: updatedProducts.length
                };
            });

            res.writeHead(200, { "Content-Type": "application/json" });
            res.end(JSON.stringify({
                success: true,
                slug: result.slug,
                title: result.title,
                image: result.image,
                isDraft: result.isDraft,
                totalCount: result.totalCount
            }));
        } catch (e) {
            res.writeHead(500, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ error: e.message }));
        }
        return;
    }

    // 4.7. API ДЛЯ БРАУЗЕРНОГО РАСШИРЕНИЯ: Пакетное добавление товаров
    if (pathname === "/api/extension/add-batch" && req.method === "POST") {
        try {
            const { category, collection, products, mode = "full", position = "top" } = await parseJsonBody(req);
            if (!category || !collection || !Array.isArray(products) || products.length === 0) {
                res.writeHead(400, { "Content-Type": "application/json" });
                res.end(JSON.stringify({ error: "Параметры category, collection и массив products обязательны" }));
                return;
            }

            const colKey = `${category}/${collection}`;
            const result = await runWithCollectionLock(colKey, async () => {
                const colDir = path.join(CONTENT_DIR, category, collection);
                const prodDir = path.join(colDir, "products");
                await fs.mkdir(prodDir, { recursive: true });

                const allProdPath = path.join(colDir, "all_products.json");
                const collectionFilePath = path.join(colDir, "collection.json");
                const linksFilePath = path.join(colDir, "links.txt");
                const deleteLinksPath = path.join(colDir, "delete_links.txt");
                const infoFilePath = path.join(colDir, "info.json");

                // Гарантируем восстановление и синхронизацию подборки до записи пакета
                const reconciled = await reconcileCollection(colDir);
                let allProducts = reconciled.allProducts;
                let collectionSlugs = reconciled.collectionSlugs;
                let linksLines = reconciled.linksLines;

                let delText = "";
                try { delText = await fs.readFile(deleteLinksPath, "utf8"); } catch {}

                const addedItems = [];

                for (const item of products) {
                    if (!item.url) continue;
                    const cleanUrl = normalizeProductUrl(item.url);
                    const slug = item.slug || getSlugFromUrl(cleanUrl);
                    if (!slug) continue;

                    let existingObj = {};
                    try {
                        existingObj = JSON.parse(await fs.readFile(path.join(prodDir, `${slug}.json`), "utf8"));
                    } catch {}

                    let cleanImage = item.image || existingObj.image || "";
                    if (cleanImage.includes('cdn.creativefabrica.com')) {
                        cleanImage = cleanImage
                            .replace(/-\d+x\d+(?=\.(jpg|jpeg|png|webp))/gi, '')
                            .replace(/-1-1(?=\.(jpg|jpeg|png|webp))/gi, '-1');
                    }

                    let cleanGallery = Array.isArray(item.gallery) && item.gallery.length > 0 
                        ? item.gallery 
                        : (existingObj.gallery && existingObj.gallery.length > 0 ? existingObj.gallery : [cleanImage].filter(Boolean));
                    cleanGallery = cleanGallery.map(img => {
                        if (typeof img === 'string' && img.includes('cdn.creativefabrica.com')) {
                            return img.replace(/-\d+x\d+(?=\.(jpg|jpeg|png|webp))/gi, '').replace(/-1-1(?=\.(jpg|jpeg|png|webp))/gi, '-1');
                        }
                        return img;
                    });

                    const fallbackTitle = slug.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
                    const productObj = {
                        slug,
                        title: item.title?.trim() || existingObj.title || fallbackTitle,
                        author: item.author?.trim() || existingObj.author || "",
                        canonical: cleanUrl,
                        url: cleanUrl,
                        description: item.description || existingObj.description || "",
                        fullDescription: item.fullDescription || existingObj.fullDescription || "",
                        image: cleanImage,
                        gallery: cleanGallery,
                        rating: item.rating ?? existingObj.rating ?? null,
                        reviewsCount: item.reviewsCount ?? existingObj.reviewsCount ?? (item.rating ? 1 : 0),
                        favorites: item.favorites ?? existingObj.favorites ?? null,
                        favoritesRaw: item.favoritesRaw ?? existingObj.favoritesRaw ?? null,
                        designerTags: item.designerTags || existingObj.designerTags || [],
                        designerTagLinks: item.designerTagLinks || existingObj.designerTagLinks || [],
                        tags: item.designerTags || existingObj.tags || [],
                        isDraft: mode === "draft",
                        deepParsed: mode !== "draft",
                        addedViaExtension: true,
                        scrapedAt: new Date().toISOString()
                    };

                    await safeWriteJson(path.join(prodDir, `${slug}.json`), productObj);

                    const existingIndex = allProducts.findIndex(p => p.slug === slug);
                    if (existingIndex !== -1 && (item.preservePosition || position === "preserve")) {
                        allProducts[existingIndex] = { ...allProducts[existingIndex], ...productObj };
                    } else {
                        allProducts = allProducts.filter(p => p.slug !== slug);
                        collectionSlugs = collectionSlugs.filter(s => s !== slug);
                        linksLines = linksLines.filter(l => getSlugFromUrl(normalizeProductUrl(l)) !== slug);

                        if (position === "bottom") {
                            allProducts.push(productObj);
                            collectionSlugs.push(slug);
                            linksLines.push(cleanUrl);
                        } else {
                            allProducts.unshift(productObj);
                            collectionSlugs.unshift(slug);
                            linksLines.unshift(cleanUrl);
                        }
                    }

                    if (delText.includes(cleanUrl) || delText.includes(slug)) {
                        delText = delText.split("\n").filter(l => !l.includes(cleanUrl) && !l.includes(slug)).join("\n");
                    }

                    addedItems.push(slug);
                }

                await fs.writeFile(deleteLinksPath, delText.trim() + "\n", "utf8");
                await safeWriteJson(allProdPath, allProducts);
                await safeWriteJson(collectionFilePath, { items: collectionSlugs });
                await fs.writeFile(linksFilePath, linksLines.join("\n") + "\n", "utf8");

                try {
                    let infoData = { title: collection, count: allProducts.length, image: "" };
                    try { infoData = JSON.parse(await fs.readFile(infoFilePath, "utf8")); } catch {}
                    infoData.count = allProducts.length;
                    if (!infoData.image && allProducts.length > 0 && allProducts[0].image) {
                        infoData.image = allProducts[0].image;
                    }
                    await safeWriteJson(infoFilePath, infoData);
                } catch {}

                return {
                    addedCount: addedItems.length,
                    totalCount: allProducts.length,
                    addedSlugs: addedItems
                };
            });

            res.writeHead(200, { "Content-Type": "application/json" });
            res.end(JSON.stringify({
                success: true,
                ...result
            }));
        } catch (e) {
            res.writeHead(500, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ error: e.message }));
        }
        return;
    }

    // 4.8. API ДЛЯ БРАУЗЕРНОГО РАСШИРЕНИЯ: Отмена добавления товаров (Undo)
    if (pathname === "/api/extension/undo-last" && req.method === "POST") {
        try {
            const { category, collection, slugs } = await parseJsonBody(req);
            if (!category || !collection || !Array.isArray(slugs) || slugs.length === 0) {
                res.writeHead(400, { "Content-Type": "application/json" });
                res.end(JSON.stringify({ error: "Параметры category, collection и массив slugs обязательны" }));
                return;
            }

            const colKey = `${category}/${collection}`;
            const result = await runWithCollectionLock(colKey, async () => {
                const colDir = path.join(CONTENT_DIR, category, collection);
                const allProdPath = path.join(colDir, "all_products.json");
                const collectionFilePath = path.join(colDir, "collection.json");
                const linksFilePath = path.join(colDir, "links.txt");
                const prodDir = path.join(colDir, "products");
                const infoFilePath = path.join(colDir, "info.json");

                const slugSet = new Set(slugs);

                const reconciled = await reconcileCollection(colDir);
                let allProducts = reconciled.allProducts;
                let collectionSlugs = reconciled.collectionSlugs;
                let linksLines = reconciled.linksLines;

                const prevCount = allProducts.length;

                allProducts = allProducts.filter(p => !slugSet.has(p.slug));
                collectionSlugs = collectionSlugs.filter(s => !slugSet.has(s));
                linksLines = linksLines.filter(l => !slugSet.has(getSlugFromUrl(normalizeProductUrl(l))));

                for (const s of slugs) {
                    try {
                        await fs.unlink(path.join(prodDir, `${s}.json`));
                    } catch {}
                }

                await safeWriteJson(allProdPath, allProducts);
                await safeWriteJson(collectionFilePath, { items: collectionSlugs });
                await fs.writeFile(linksFilePath, linksLines.join("\n") + "\n", "utf8");

                try {
                    let infoData = { title: collection, count: allProducts.length, image: "" };
                    try { infoData = JSON.parse(await fs.readFile(infoFilePath, "utf8")); } catch {}
                    infoData.count = allProducts.length;
                    if (allProducts.length > 0 && allProducts[0].image) {
                        infoData.image = allProducts[0].image;
                    }
                    await safeWriteJson(infoFilePath, infoData);
                } catch {}

                return {
                    removedCount: prevCount - allProducts.length,
                    totalCount: allProducts.length
                };
            });

            res.writeHead(200, { "Content-Type": "application/json" });
            res.end(JSON.stringify({
                success: true,
                ...result
            }));
        } catch (e) {
            res.writeHead(500, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ error: e.message }));
        }
        return;
    }

    // 5. API: Добавление товара по слагу в конкретный фильтр
    if (pathname === "/api/add-product-to-filter" && req.method === "POST") {
        try {
            const { category, collection, filter: filterId, slug } = await parseJsonBody(req);
            if (!category || !collection || !filterId || !slug) {
                res.writeHead(400, { "Content-Type": "application/json" });
                res.end(JSON.stringify({ error: "Все параметры обязательны" }));
                return;
            }

            const cleanSlug = slug.trim().toLowerCase();
            const colDir = path.join(CONTENT_DIR, category, collection);
            const allProdPath = path.join(colDir, "all_products.json");
            const filterColPath = path.join(colDir, "filter_collections", `${filterId}.json`);

            // Проверяем, существует ли такой товар в подборке
            const allProducts = JSON.parse(await fs.readFile(allProdPath, "utf8"));
            const targetProduct = allProducts.find(p => p.slug === cleanSlug);

            if (!targetProduct) {
                res.writeHead(404, { "Content-Type": "application/json" });
                res.end(JSON.stringify({ error: `Товар со слагом "${cleanSlug}" не найден в этой подборке!` }));
                return;
            }

            let fData = {
                filterId: filterId,
                label: filterId,
                items: [],
                excludedItems: []
            };

            try {
                const raw = await fs.readFile(filterColPath, "utf8");
                fData = JSON.parse(raw);
            } catch {}

            fData.items = fData.items || [];
            fData.excludedItems = (fData.excludedItems || []).filter(s => s !== cleanSlug);

            // Если товара еще нет в фильтре — добавляем на самое 1-е место!
            if (!fData.items.includes(cleanSlug)) {
                fData.items.unshift(cleanSlug);
            }
            fData.updatedAt = new Date().toISOString();

            await fs.writeFile(filterColPath, JSON.stringify(fData, null, 2), "utf8");

            res.writeHead(200, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ success: true, product: targetProduct, count: fData.items.length }));
        } catch (e) {
            res.writeHead(500, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ error: e.message }));
        }
        return;
    }

    // ========================================================
    // 6. API: Управление структурой (Категории, Подборки, Порядок, Перенос из корзины)
    // ========================================================

    // 6.1 Создание новой категории
    if (pathname === "/api/category/create" && req.method === "POST") {
        try {
            const { id, title, subtitle, description, image } = await parseJsonBody(req);
            if (!id || !title) {
                res.writeHead(400, { "Content-Type": "application/json" });
                res.end(JSON.stringify({ error: "Slug (ID) и Название категории обязательны" }));
                return;
            }
            const cleanId = id.trim().toLowerCase().replace(/[^a-z0-9_-]/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "");
            if (!cleanId) {
                res.writeHead(400, { "Content-Type": "application/json" });
                res.end(JSON.stringify({ error: "Некорректный slug категории" }));
                return;
            }

            const cats = await readCategoriesJson();
            if (cats.some(c => c.id === cleanId)) {
                res.writeHead(400, { "Content-Type": "application/json" });
                res.end(JSON.stringify({ error: `Категория с ID "${cleanId}" уже существует` }));
                return;
            }

            const newCat = {
                id: cleanId,
                title: title.trim(),
                subtitle: (subtitle || `Best ${title.trim()} Collections`).trim(),
                description: (description || `Curated collections of ${title.trim()}.`).trim(),
                image: (image || "").trim(),
                href: `/${cleanId}`,
                count: "0 Collections"
            };
            cats.push(newCat);
            await writeCategoriesJson(cats);

            // Создаем папку в content/
            const catDir = path.join(CONTENT_DIR, cleanId);
            await fs.mkdir(catDir, { recursive: true });
            await fs.writeFile(path.join(catDir, "order.json"), JSON.stringify({ order: [] }, null, 2), "utf8");

            res.writeHead(200, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ success: true, category: newCat }));
        } catch (e) {
            res.writeHead(500, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ error: e.message }));
        }
        return;
    }

    // 6.2 Обновление метаданных категории (название, подзаголовок, описание, фото главной)
    if (pathname === "/api/category/update" && req.method === "POST") {
        try {
            const { id, title, subtitle, description, image } = await parseJsonBody(req);
            if (!id) {
                res.writeHead(400, { "Content-Type": "application/json" });
                res.end(JSON.stringify({ error: "ID категории обязателен" }));
                return;
            }

            const cats = await readCategoriesJson();
            const cat = cats.find(c => c.id === id);
            if (!cat) {
                res.writeHead(404, { "Content-Type": "application/json" });
                res.end(JSON.stringify({ error: "Категория не найдена" }));
                return;
            }

            if (title !== undefined) cat.title = title.trim();
            if (subtitle !== undefined) cat.subtitle = subtitle.trim();
            if (description !== undefined) cat.description = description.trim();
            if (image !== undefined) cat.image = image.trim();

            // Пересчитываем актуальное количество подборок
            try {
                const catDir = path.join(CONTENT_DIR, id);
                const subEntries = await fs.readdir(catDir, { withFileTypes: true });
                const colCount = subEntries.filter(e => e.isDirectory() && e.name !== "products").length;
                cat.count = `${colCount} Collection${colCount === 1 ? '' : 's'}`;
            } catch {}

            await writeCategoriesJson(cats);

            res.writeHead(200, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ success: true, category: cat }));
        } catch (e) {
            res.writeHead(500, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ error: e.message }));
        }
        return;
    }

    // 6.3 Изменение порядка категорий на главной (кто первее)
    if (pathname === "/api/category/reorder" && req.method === "POST") {
        try {
            const { order } = await parseJsonBody(req);
            if (!Array.isArray(order) || order.length === 0) {
                res.writeHead(400, { "Content-Type": "application/json" });
                res.end(JSON.stringify({ error: "Массив order обязателен" }));
                return;
            }

            const cats = await readCategoriesJson();
            const map = new Map(cats.map(c => [c.id, c]));
            const reordered = [];

            for (const id of order) {
                if (map.has(id)) {
                    reordered.push(map.get(id));
                    map.delete(id);
                }
            }
            for (const rem of map.values()) {
                reordered.push(rem);
            }

            await writeCategoriesJson(reordered);

            res.writeHead(200, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ success: true, categories: reordered }));
        } catch (e) {
            res.writeHead(500, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ error: e.message }));
        }
        return;
    }

    // 6.4 Создание новой подборки
    if (pathname === "/api/collection/create" && req.method === "POST") {
        try {
            const { category, slug, title, description, image } = await parseJsonBody(req);
            if (!category || !slug) {
                res.writeHead(400, { "Content-Type": "application/json" });
                res.end(JSON.stringify({ error: "Параметры category и slug обязательны" }));
                return;
            }

            const cleanSlug = slug.trim().toLowerCase().replace(/[^a-z0-9_-]/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "");
            if (!cleanSlug) {
                res.writeHead(400, { "Content-Type": "application/json" });
                res.end(JSON.stringify({ error: "Некорректный slug подборки" }));
                return;
            }

            const catDir = path.join(CONTENT_DIR, category);
            const colDir = path.join(catDir, cleanSlug);

            try {
                await fs.access(colDir);
                res.writeHead(400, { "Content-Type": "application/json" });
                res.end(JSON.stringify({ error: `Подборка "${cleanSlug}" в категории "${category}" уже существует` }));
                return;
            } catch {}

            await fs.mkdir(colDir, { recursive: true });
            await fs.mkdir(path.join(colDir, "products"), { recursive: true });
            await fs.mkdir(path.join(colDir, "filter_collections"), { recursive: true });

            const info = {
                title: (title || cleanSlug.split("-").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ")).trim(),
                description: (description || "").trim(),
                image: (image || "").trim(),
                count: 0
            };

            await fs.writeFile(path.join(colDir, "info.json"), JSON.stringify(info, null, 2), "utf8");
            await fs.writeFile(path.join(colDir, "all_products.json"), "[]\n", "utf8");
            await fs.writeFile(path.join(colDir, "collection.json"), JSON.stringify({ items: [] }, null, 2), "utf8");
            await fs.writeFile(path.join(colDir, "links.txt"), "", "utf8");
            await fs.writeFile(path.join(colDir, "for_links.txt"), "# Ссылки для парсинга Creative Fabrica\n", "utf8");
            await fs.writeFile(path.join(colDir, "filters.json"), "[]\n", "utf8");
            await fs.writeFile(path.join(colDir, "trash.json"), JSON.stringify({ items: [] }, null, 2), "utf8");

            // Добавляем в order.json категории
            const orderPath = path.join(catDir, "order.json");
            let order = [];
            try {
                const raw = await fs.readFile(orderPath, "utf8");
                order = JSON.parse(raw).order || [];
            } catch {}
            if (!order.includes(cleanSlug)) {
                order.push(cleanSlug);
                await fs.writeFile(orderPath, JSON.stringify({ order }, null, 2), "utf8");
            }

            // Обновляем счетчик подборок в categories.json
            const cats = await readCategoriesJson();
            const catEntry = cats.find(c => c.id === category);
            if (catEntry) {
                const subEntries = await fs.readdir(catDir, { withFileTypes: true });
                const colCount = subEntries.filter(e => e.isDirectory() && e.name !== "products").length;
                catEntry.count = `${colCount} Collection${colCount === 1 ? '' : 's'}`;
                await writeCategoriesJson(cats);
            }

            res.writeHead(200, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ success: true, collection: { slug: cleanSlug, ...info } }));
        } catch (e) {
            res.writeHead(500, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ error: e.message }));
        }
        return;
    }

    // 6.5 Обновление метаданных подборки (название, описание, обложка)
    if (pathname === "/api/collection/update" && req.method === "POST") {
        try {
            const { category, slug, title, description, image } = await parseJsonBody(req);
            if (!category || !slug) {
                res.writeHead(400, { "Content-Type": "application/json" });
                res.end(JSON.stringify({ error: "Параметры category и slug обязательны" }));
                return;
            }

            const colDir = path.join(CONTENT_DIR, category, slug);
            const infoPath = path.join(colDir, "info.json");
            let info = {
                title: slug,
                description: "",
                image: "",
                count: 0
            };
            try {
                info = { ...info, ...JSON.parse(await fs.readFile(infoPath, "utf8")) };
            } catch {}

            if (title !== undefined) info.title = title.trim();
            if (description !== undefined) info.description = description.trim();
            if (image !== undefined) info.image = image.trim();

            try {
                const allProdPath = path.join(colDir, "all_products.json");
                const prods = JSON.parse(await fs.readFile(allProdPath, "utf8"));
                info.count = prods.length;
            } catch {}

            await fs.writeFile(infoPath, JSON.stringify(info, null, 2), "utf8");

            res.writeHead(200, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ success: true, info }));
        } catch (e) {
            res.writeHead(500, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ error: e.message }));
        }
        return;
    }

    // 6.6 Изменение порядка подборок в категории (кто первее)
    if (pathname === "/api/collection/reorder" && req.method === "POST") {
        try {
            const { category, order } = await parseJsonBody(req);
            if (!category || !Array.isArray(order)) {
                res.writeHead(400, { "Content-Type": "application/json" });
                res.end(JSON.stringify({ error: "Параметры category и order (массив) обязательны" }));
                return;
            }

            const catDir = path.join(CONTENT_DIR, category);
            const orderPath = path.join(catDir, "order.json");
            await fs.writeFile(orderPath, JSON.stringify({ order }, null, 2), "utf8");

            res.writeHead(200, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ success: true, order }));
        } catch (e) {
            res.writeHead(500, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ error: e.message }));
        }
        return;
    }

    // 6.7 API управления фильтрами подборки (Создание, Редактирование, Порядок, Удаление)
    if (pathname === "/api/filters" && req.method === "GET") {
        try {
            const category = query.get("category");
            const collection = query.get("collection");
            if (!category || !collection) {
                res.writeHead(400, { "Content-Type": "application/json" });
                res.end(JSON.stringify({ error: "category и collection обязательны" }));
                return;
            }

            const colDir = path.join(CONTENT_DIR, category, collection);
            const filtersPath = path.join(colDir, "filters.json");
            let filters = [];
            try {
                filters = JSON.parse(await fs.readFile(filtersPath, "utf8"));
            } catch {}

            // Подсчитываем товары для каждого фильтра
            const filterCollectionsDir = path.join(colDir, "filter_collections");
            for (const f of filters) {
                f.count = 0;
                try {
                    const fcPath = path.join(filterCollectionsDir, `${f.id}.json`);
                    const fcData = JSON.parse(await fs.readFile(fcPath, "utf8"));
                    if (Array.isArray(fcData.items)) {
                        f.count = fcData.items.length;
                    }
                } catch {}
            }

            res.writeHead(200, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ success: true, filters }));
        } catch (e) {
            res.writeHead(500, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ error: e.message }));
        }
        return;
    }

    if (pathname === "/api/filter/create" && req.method === "POST") {
        try {
            const { category, collection, id, label, keywords } = await parseJsonBody(req);
            if (!category || !collection || !id || !label) {
                res.writeHead(400, { "Content-Type": "application/json" });
                res.end(JSON.stringify({ error: "Параметры category, collection, id и label обязательны" }));
                return;
            }

            const cleanId = id.trim().toLowerCase().replace(/[^a-z0-9_-]/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "");
            if (!cleanId) {
                res.writeHead(400, { "Content-Type": "application/json" });
                res.end(JSON.stringify({ error: "Некорректный ID фильтра" }));
                return;
            }

            const colDir = path.join(CONTENT_DIR, category, collection);
            const filtersPath = path.join(colDir, "filters.json");
            let filters = [];
            try {
                filters = JSON.parse(await fs.readFile(filtersPath, "utf8"));
            } catch {}

            if (filters.some(f => f.id === cleanId)) {
                res.writeHead(400, { "Content-Type": "application/json" });
                res.end(JSON.stringify({ error: `Фильтр с ID "${cleanId}" уже существует в этой подборке` }));
                return;
            }

            let kwList = [];
            if (Array.isArray(keywords)) {
                kwList = keywords.map(k => String(k).trim()).filter(Boolean);
            } else if (typeof keywords === 'string') {
                kwList = keywords.split(",").map(k => k.trim()).filter(Boolean);
            }

            const newFilter = {
                id: cleanId,
                label: label.trim(),
                keywords: kwList
            };

            filters.push(newFilter);
            await fs.writeFile(filtersPath, JSON.stringify(filters, null, 2), "utf8");

            const fcDir = path.join(colDir, "filter_collections");
            await fs.mkdir(fcDir, { recursive: true });
            const fcPath = path.join(fcDir, `${cleanId}.json`);
            try {
                await fs.access(fcPath);
            } catch {
                await fs.writeFile(fcPath, JSON.stringify({ filterId: cleanId, items: [] }, null, 2), "utf8");
            }

            res.writeHead(200, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ success: true, filter: newFilter, filters }));
        } catch (e) {
            res.writeHead(500, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ error: e.message }));
        }
        return;
    }

    if (pathname === "/api/filter/update" && req.method === "POST") {
        try {
            const { category, collection, id, label, keywords } = await parseJsonBody(req);
            if (!category || !collection || !id) {
                res.writeHead(400, { "Content-Type": "application/json" });
                res.end(JSON.stringify({ error: "Параметры category, collection и id обязательны" }));
                return;
            }

            const colDir = path.join(CONTENT_DIR, category, collection);
            const filtersPath = path.join(colDir, "filters.json");
            let filters = [];
            try {
                filters = JSON.parse(await fs.readFile(filtersPath, "utf8"));
            } catch {}

            const targetFilter = filters.find(f => f.id === id);
            if (!targetFilter) {
                res.writeHead(404, { "Content-Type": "application/json" });
                res.end(JSON.stringify({ error: `Фильтр "${id}" не найден` }));
                return;
            }

            if (label && typeof label === 'string') {
                targetFilter.label = label.trim();
            }

            if (keywords !== undefined) {
                if (Array.isArray(keywords)) {
                    targetFilter.keywords = keywords.map(k => String(k).trim()).filter(Boolean);
                } else if (typeof keywords === 'string') {
                    targetFilter.keywords = keywords.split(",").map(k => k.trim()).filter(Boolean);
                }
            }

            await fs.writeFile(filtersPath, JSON.stringify(filters, null, 2), "utf8");

            res.writeHead(200, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ success: true, filter: targetFilter, filters }));
        } catch (e) {
            res.writeHead(500, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ error: e.message }));
        }
        return;
    }

    if (pathname === "/api/filter/reorder" && req.method === "POST") {
        try {
            const { category, collection, order } = await parseJsonBody(req);
            if (!category || !collection || !Array.isArray(order)) {
                res.writeHead(400, { "Content-Type": "application/json" });
                res.end(JSON.stringify({ error: "Параметры category, collection и order (массив) обязательны" }));
                return;
            }

            const colDir = path.join(CONTENT_DIR, category, collection);
            const filtersPath = path.join(colDir, "filters.json");
            let filters = [];
            try {
                filters = JSON.parse(await fs.readFile(filtersPath, "utf8"));
            } catch {}

            const filterMap = new Map(filters.map(f => [f.id, f]));
            const reordered = [];

            for (const fId of order) {
                if (filterMap.has(fId)) {
                    reordered.push(filterMap.get(fId));
                    filterMap.delete(fId);
                }
            }
            for (const rem of filterMap.values()) {
                reordered.push(rem);
            }

            await fs.writeFile(filtersPath, JSON.stringify(reordered, null, 2), "utf8");

            res.writeHead(200, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ success: true, filters: reordered }));
        } catch (e) {
            res.writeHead(500, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ error: e.message }));
        }
        return;
    }

    if (pathname === "/api/filter/delete" && req.method === "POST") {
        try {
            const { category, collection, id } = await parseJsonBody(req);
            if (!category || !collection || !id) {
                res.writeHead(400, { "Content-Type": "application/json" });
                res.end(JSON.stringify({ error: "Параметры category, collection и id обязательны" }));
                return;
            }

            const colDir = path.join(CONTENT_DIR, category, collection);
            const filtersPath = path.join(colDir, "filters.json");
            let filters = [];
            try {
                filters = JSON.parse(await fs.readFile(filtersPath, "utf8"));
            } catch {}

            const newFilters = filters.filter(f => f.id !== id);
            await fs.writeFile(filtersPath, JSON.stringify(newFilters, null, 2), "utf8");

            try {
                await fs.unlink(path.join(colDir, "filter_collections", `${id}.json`));
            } catch {}

            res.writeHead(200, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ success: true, filters: newFilters }));
        } catch (e) {
            res.writeHead(500, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ error: e.message }));
        }
        return;
    }

    // 6.8 Перемещение / восстановление товара в ДРУГУЮ подборку (из корзины или из активных товаров)
    if ((pathname === "/api/trash/restore-to" || pathname === "/api/product/move-to") && req.method === "POST") {
        try {
            const { 
                fromCategory, 
                fromCollection, 
                toCategory, 
                toCollection, 
                slug, 
                newCollection,
                isTrash
            } = await parseJsonBody(req);

            if (!fromCategory || !fromCollection || !toCategory || !slug) {
                res.writeHead(400, { "Content-Type": "application/json" });
                res.end(JSON.stringify({ error: "Параметры fromCategory, fromCollection, toCategory и slug обязательны" }));
                return;
            }

            let targetCol = toCollection;

            // Если переданы данные для создания новой подборки на лету
            if (newCollection && newCollection.slug) {
                const cleanSlug = newCollection.slug.trim().toLowerCase().replace(/[^a-z0-9_-]/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "");
                targetCol = cleanSlug;
                const newColDir = path.join(CONTENT_DIR, toCategory, cleanSlug);

                let exists = false;
                try {
                    await fs.access(newColDir);
                    exists = true;
                } catch {}

                if (!exists) {
                    await fs.mkdir(newColDir, { recursive: true });
                    await fs.mkdir(path.join(newColDir, "products"), { recursive: true });
                    await fs.mkdir(path.join(newColDir, "filter_collections"), { recursive: true });

                    const info = {
                        title: (newCollection.title || cleanSlug.split("-").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ")).trim(),
                        description: (newCollection.description || "").trim(),
                        image: (newCollection.image || "").trim(),
                        count: 0
                    };
                    await fs.writeFile(path.join(newColDir, "info.json"), JSON.stringify(info, null, 2), "utf8");
                    await fs.writeFile(path.join(newColDir, "all_products.json"), "[]\n", "utf8");
                    await fs.writeFile(path.join(newColDir, "collection.json"), JSON.stringify({ items: [] }, null, 2), "utf8");
                    await fs.writeFile(path.join(newColDir, "links.txt"), "", "utf8");
                    await fs.writeFile(path.join(newColDir, "for_links.txt"), "# Ссылки для парсинга Creative Fabrica\n", "utf8");
                    await fs.writeFile(path.join(newColDir, "filters.json"), "[]\n", "utf8");
                    await fs.writeFile(path.join(newColDir, "trash.json"), JSON.stringify({ items: [] }, null, 2), "utf8");

                    // Добавляем в order.json
                    const orderPath = path.join(CONTENT_DIR, toCategory, "order.json");
                    let ord = [];
                    try {
                        ord = JSON.parse(await fs.readFile(orderPath, "utf8")).order || [];
                    } catch {}
                    if (!ord.includes(cleanSlug)) {
                        ord.push(cleanSlug);
                        await fs.writeFile(orderPath, JSON.stringify({ order: ord }, null, 2), "utf8");
                    }

                    // Обновляем categories.json
                    const cats = await readCategoriesJson();
                    const catEntry = cats.find(c => c.id === toCategory);
                    if (catEntry) {
                        const subEntries = await fs.readdir(path.join(CONTENT_DIR, toCategory), { withFileTypes: true });
                        const colCount = subEntries.filter(e => e.isDirectory() && e.name !== "products").length;
                        catEntry.count = `${colCount} Collection${colCount === 1 ? '' : 's'}`;
                        await writeCategoriesJson(cats);
                    }
                }
            }

            if (!targetCol) {
                res.writeHead(400, { "Content-Type": "application/json" });
                res.end(JSON.stringify({ error: "Целевая подборка не указана" }));
                return;
            }

            const fromColDir = path.join(CONTENT_DIR, fromCategory, fromCollection);
            const toColDir = path.join(CONTENT_DIR, toCategory, targetCol);

            // 1. Ищем товар: в корзине или в активных товарах
            const fromTrashData = await getTrashData(fromColDir);
            const trashItemIdx = (fromTrashData.items || []).findIndex(it => it.slug === slug);
            let prod = null;

            if (isTrash !== false && trashItemIdx !== -1) {
                // Товар найден в корзине — удаляем из исходной корзины
                const trashItem = fromTrashData.items[trashItemIdx];
                prod = trashItem.product;
                fromTrashData.items.splice(trashItemIdx, 1);
                await saveTrashData(fromColDir, fromTrashData);
            } else {
                // Товар перемещается из активных товаров
                const fromAllProdPath = path.join(fromColDir, "all_products.json");
                let fromAllProducts = [];
                try {
                    fromAllProducts = JSON.parse(await fs.readFile(fromAllProdPath, "utf8"));
                } catch {}

                const activeIdx = fromAllProducts.findIndex(p => p.slug === slug);
                if (activeIdx !== -1) {
                    prod = fromAllProducts[activeIdx];
                    fromAllProducts.splice(activeIdx, 1);
                    await fs.writeFile(fromAllProdPath, JSON.stringify(fromAllProducts, null, 2), "utf8");
                }

                // Удаляем из исходного collection.json
                const fromColFilePath = path.join(fromColDir, "collection.json");
                try {
                    const colData = JSON.parse(await fs.readFile(fromColFilePath, "utf8"));
                    if (Array.isArray(colData.items)) {
                        colData.items = colData.items.filter(s => s !== slug);
                        await fs.writeFile(fromColFilePath, JSON.stringify(colData, null, 2), "utf8");
                    }
                } catch {}

                // Удаляем из исходного links.txt
                const fromLinksPath = path.join(fromColDir, "links.txt");
                try {
                    let lines = (await fs.readFile(fromLinksPath, "utf8")).split("\n");
                    lines = lines.filter(l => l.trim() && !l.includes(slug));
                    await fs.writeFile(fromLinksPath, lines.join("\n") + (lines.length > 0 ? "\n" : ""), "utf8");
                } catch {}

                // Обновляем count в исходном info.json
                const fromInfoPath = path.join(fromColDir, "info.json");
                try {
                    const info = JSON.parse(await fs.readFile(fromInfoPath, "utf8"));
                    info.count = fromAllProducts.length;
                    await fs.writeFile(fromInfoPath, JSON.stringify(info, null, 2), "utf8");
                } catch {}

                // Удаляем из filter_collections/ если есть
                try {
                    const filterDir = path.join(fromColDir, "filter_collections");
                    const filterFiles = await fs.readdir(filterDir);
                    for (const f of filterFiles) {
                        if (f.endsWith(".json")) {
                            const fPath = path.join(filterDir, f);
                            const fData = JSON.parse(await fs.readFile(fPath, "utf8"));
                            if (Array.isArray(fData.items) && fData.items.includes(slug)) {
                                fData.items = fData.items.filter(s => s !== slug);
                                await fs.writeFile(fPath, JSON.stringify(fData, null, 2), "utf8");
                            }
                        }
                    }
                } catch {}
            }

            // Получаем объект товара, если еще не извлечен
            if (!prod) {
                try {
                    prod = JSON.parse(await fs.readFile(path.join(fromColDir, "products", `${slug}.json`), "utf8"));
                } catch {
                    prod = { slug, title: slug };
                }
            }

            // 2. Добавляем в целевую подборку
            await fs.mkdir(path.join(toColDir, "products"), { recursive: true });
            await fs.writeFile(path.join(toColDir, "products", `${slug}.json`), JSON.stringify(prod, null, 2), "utf8");

            // Удаляем старый файл карточки товара из исходной подборки
            try {
                await fs.unlink(path.join(fromColDir, "products", `${slug}.json`));
            } catch {}

            const toAllProdPath = path.join(toColDir, "all_products.json");
            let toAllProducts = [];
            try {
                toAllProducts = JSON.parse(await fs.readFile(toAllProdPath, "utf8"));
            } catch {}

            // Вставляем в серединку подборки, чтобы не сбить топ витрины
            const insertIndex = Math.floor(toAllProducts.length / 2);

            if (!toAllProducts.some(p => p.slug === slug)) {
                toAllProducts.splice(insertIndex, 0, prod);
                await fs.writeFile(toAllProdPath, JSON.stringify(toAllProducts, null, 2), "utf8");
            }

            const toColFilePath = path.join(toColDir, "collection.json");
            let toColSlugs = [];
            try {
                toColSlugs = JSON.parse(await fs.readFile(toColFilePath, "utf8")).items || [];
            } catch {}

            if (!toColSlugs.includes(slug)) {
                const slugInsertIndex = Math.min(insertIndex, toColSlugs.length);
                toColSlugs.splice(slugInsertIndex, 0, slug);
                await fs.writeFile(toColFilePath, JSON.stringify({ items: toColSlugs }, null, 2), "utf8");
            }

            const toLinksPath = path.join(toColDir, "links.txt");
            let toLinks = [];
            try {
                toLinks = (await fs.readFile(toLinksPath, "utf8")).split("\n").filter(Boolean);
            } catch {}
            const canonicalUrl = prod.canonical || `https://www.creativefabrica.com/product/${slug}/`;
            if (!toLinks.includes(canonicalUrl)) {
                const linkInsertIndex = Math.min(insertIndex, toLinks.length);
                toLinks.splice(linkInsertIndex, 0, canonicalUrl);
                await fs.writeFile(toLinksPath, toLinks.join("\n") + "\n", "utf8");
            }

            // 3. Обновляем info.json в целевой подборке
            const toInfoPath = path.join(toColDir, "info.json");
            try {
                const info = JSON.parse(await fs.readFile(toInfoPath, "utf8"));
                info.count = toAllProducts.length;
                if (!info.image && (prod.image || prod.previewUrl)) {
                    info.image = prod.image || prod.previewUrl;
                }
                await fs.writeFile(toInfoPath, JSON.stringify(info, null, 2), "utf8");
            } catch {}

            res.writeHead(200, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ 
                success: true, 
                movedTo: { category: toCategory, collection: targetCol, position: insertIndex + 1 },
                product: { slug: prod.slug, title: prod.title, image: prod.image || prod.previewUrl || '' }
            }));
        } catch (e) {
            res.writeHead(500, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ error: e.message }));
        }
        return;
    }

    // 6.9 Удалённое обновление проекта (Git Pull)
    if (pathname === "/api/system/git-pull" && req.method === "POST") {
        try {
            const { stdout, stderr } = await execAsync("git pull origin main", { cwd: PROJECT_ROOT });
            const output = (stdout || stderr || "Already up to date.").trim();
            res.writeHead(200, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ success: true, output }));
        } catch (e) {
            res.writeHead(500, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ error: e.message }));
        }
        return;
    }

    // 7. Главная страница панели управления (HTML)
    if (pathname === "/" || pathname === "/index.html") {
        try {
            const html = await fs.readFile(HTML_FILE, "utf8");
            res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
            res.end(html);
        } catch (e) {
            res.writeHead(500, { "Content-Type": "text/plain; charset=utf-8" });
            res.end("Ошибка загрузки интерфейса: " + e.message);
        }
        return;
    }

    res.writeHead(404, { "Content-Type": "text/plain" });
    res.end("Not Found");
});

server.listen(PORT, "0.0.0.0", () => {
    console.log(`\n==================================================`);
    console.log(`🚀 ВИЗУАЛЬНАЯ АДМИНКА ЗАПУЩЕНА!`);
    console.log(`🌐 Локально: http://localhost:${PORT} (или http://127.0.0.1:${PORT})`);
    console.log(`==================================================\n`);
});
