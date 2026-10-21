import { getBrowser } from "./browser-session.js";
import { parseProductPage } from "./parse-product-page.js";

const browser = await getBrowser();

const context = browser.contexts()[0];

const page = await context.newPage();

await page.goto(
    "https://www.creativefabrica.com/product/smart-bubble/",
    {
        waitUntil: "domcontentloaded",
        timeout: 30000
    }
);

// небольшая пауза, чтобы React успел дорисовать страницу
await page.waitForTimeout(1500);

const product =
    await parseProductPage(page);

console.log(
    JSON.stringify(
        product,
        null,
        2
    )
);

await page.close();