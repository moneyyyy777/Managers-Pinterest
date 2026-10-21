import { chromium } from "playwright";
(async () => {
    const browser = await chromium.connectOverCDP('http://127.0.0.1:9222');
    const ctx = browser.contexts()[0];
    const page = ctx.pages().find(p => p.url().includes("aistudio"));
    if (page) {
        const text = await page.evaluate(() => document.body.innerText);
        const match = text.match(/\[\s*\{[\s\S]*\}\s*\]/);
        console.log("Found JSON array?", !!match);
        if (match) console.log("Length:", match[0].length);
    }
    process.exit(0);
})();
