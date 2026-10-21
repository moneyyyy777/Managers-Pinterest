import { chromium } from "playwright";

export async function getBrowser() {
    try {
        return await chromium.connectOverCDP(
            "http://127.0.0.1:9222",
            { timeout: 1500 }
        );
    } catch {
        try {
            return await chromium.launch({ headless: true });
        } catch {
            throw new Error("Браузер Playwright не запущен. Для быстрого допарсинга используйте кнопку в расширении браузера.");
        }
    }
}