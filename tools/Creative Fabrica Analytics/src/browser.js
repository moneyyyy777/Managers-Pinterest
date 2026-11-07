import fs from 'node:fs';
import { chromium } from 'playwright-extra';
import stealthPlugin from 'puppeteer-extra-plugin-stealth';
import { PROFILE_DIR, BROWSER_CONFIG, SCREENSHOTS_DIR, REPORTS_DIR } from './config.js';

// Activate stealth plugin
chromium.use(stealthPlugin());

/**
 * Ensures required directories exist
 */
export function ensureDirs() {
  if (!fs.existsSync(PROFILE_DIR)) {
    fs.mkdirSync(PROFILE_DIR, { recursive: true });
  }
  if (!fs.existsSync(REPORTS_DIR)) {
    fs.mkdirSync(REPORTS_DIR, { recursive: true });
  }
  if (!fs.existsSync(SCREENSHOTS_DIR)) {
    fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });
  }
}

/**
 * Human-like random delay
 * @param {number} min 
 * @param {number} max 
 */
export async function randomDelay(min = 1200, max = 3000) {
  const ms = Math.floor(Math.random() * (max - min + 1)) + min;
  await new Promise((resolve) => setTimeout(resolve, ms));
  return ms;
}

/**
 * Launches persistent browser context with anti-detect flags
 * @param {object} options
 * @param {boolean} [options.headless]
 * @returns {Promise<{ context: import('playwright').BrowserContext, page: import('playwright').Page }>}
 */
export async function launchBrowser({ headless = BROWSER_CONFIG.defaultHeadless } = {}) {
  ensureDirs();

  const launchArgs = [
    '--disable-blink-features=AutomationControlled',
    '--no-sandbox',
    '--disable-setuid-sandbox',
    '--disable-infobars',
    '--disable-dev-shm-usage',
    '--window-size=1440,900',
  ];

  const context = await chromium.launchPersistentContext(PROFILE_DIR, {
    headless,
    args: launchArgs,
    viewport: BROWSER_CONFIG.viewport,
    userAgent: BROWSER_CONFIG.userAgent,
    locale: BROWSER_CONFIG.locale,
    timezoneId: BROWSER_CONFIG.timezoneId,
    ignoreDefaultArgs: ['--enable-automation'],
    permissions: ['geolocation'],
  });

  // Get active page or create one
  const pages = context.pages();
  const page = pages.length > 0 ? pages[0] : await context.newPage();

  // Remove webdriver flag defensively inside browser context
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'webdriver', {
      get: () => undefined,
    });
  });

  return { context, page };
}
