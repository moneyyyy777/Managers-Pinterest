import { chromium } from "playwright";
(async () => {
    const browser = await chromium.connectOverCDP('http://127.0.0.1:9222');
    const ctx = browser.contexts()[0];
    const page = ctx.pages().find(p => p.url().includes("aistudio"));
    if (page) {
        await page.screenshot({ path: "aistudio_snap.png" });
        console.log("Screenshot saved!");
    } else {
        console.log("No AI Studio page found!");
    }
    process.exit(0);
})();
