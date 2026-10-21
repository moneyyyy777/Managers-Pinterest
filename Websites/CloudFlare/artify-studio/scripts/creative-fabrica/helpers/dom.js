// scripts/creative-fabrica/helpers/dom.js

export async function exists(page, selector) {
    return (await page.locator(selector).count()) > 0;
}

export async function text(page, selector) {
    try {
        const locator = page.locator(selector).first();
        const content = await locator.textContent({ timeout: 2000 });
        return content?.trim() || "";
    } catch {
        return ""; // Если элемента нет или не успел загрузиться — возвращаем пустую строку (фоллбэк)
    }
}

export async function html(page, selector) {
    try {
        const locator = page.locator(selector).first();
        const content = await locator.innerHTML({ timeout: 2000 });
        return content?.trim() || "";
    } catch {
        return "";
    }
}

export async function attr(page, selector, attribute) {
    try {
        const locator = page.locator(selector).first();
        const content = await locator.getAttribute(attribute, { timeout: 2000 });
        return content?.trim() || "";
    } catch {
        return "";
    }
}

export async function texts(page, selector) {
    try {
        const locator = page.locator(selector);
        // Ждем появления хотя бы одного элемента, но не долго
        await locator.first().waitFor({ state: 'attached', timeout: 2000 });
        const count = await locator.count();
        const result = [];

        for (let i = 0; i < count; i++) {
            const value = await locator.nth(i).textContent();
            if (value) result.push(value.trim());
        }
        return result;
    } catch {
        return [];
    }
}

export async function attrs(page, selector, attribute) {
    try {
        const locator = page.locator(selector);
        await locator.first().waitFor({ state: 'attached', timeout: 2000 });
        const count = await locator.count();
        const result = [];

        for (let i = 0; i < count; i++) {
            // Ищем сначала data-src (ленивая загрузка), если нет — берем обычный src
            const val = await locator.nth(i).getAttribute(attribute) || await locator.nth(i).getAttribute('src');
            if (val && !result.includes(val)) {
                result.push(val.trim());
            }
        }
        return result;
    } catch {
        return [];
    }
}