import fs from 'node:fs';
import path from 'node:path';
import { launchBrowser, randomDelay } from './browser.js';
import { CF_URLS, REPORTS_DIR, SCREENSHOTS_DIR } from './config.js';
import { checkAuthStatus } from './auth.js';

/**
 * Collects designer statistics from Creative Fabrica
 * @param {object} options
 * @param {boolean} [options.headless]
 */
export async function collectStats({ headless = false } = {}) {
  console.log('\n======================================================');
  console.log(`📊 [STATS] Запуск сбора статистики (headless: ${headless})`);
  console.log('======================================================\n');

  const { context, page } = await launchBrowser({ headless });

  try {
    console.log(`[STATS] Переход на панель Creative Fabrica: ${CF_URLS.designerDashboard}`);
    await page.goto(CF_URLS.designerDashboard, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await randomDelay(2000, 3500);

    // Verify authentication
    const isLogged = await checkAuthStatus(page);
    if (!isLogged) {
      // Check if redirected to login page
      if (page.url().includes('/login')) {
        throw new Error(
          'Сессия не авторизована! Запустите сначала команду: npm run auth (или ./scripts/auth.sh)'
        );
      }
    }

    console.log('[STATS] Авторизация подтверждена. Извлечение метрик...');

    // Extract available stats from the page
    const statsData = await page.evaluate(() => {
      const getText = (selector) => {
        const el = document.querySelector(selector);
        return el ? el.textContent.trim() : null;
      };

      // Heuristic extractors for common dashboard metrics
      const bodyText = document.body.innerText || '';
      const numbersInText = {};

      // Match common patterns like "$123.45" or "Downloads: 12"
      const earningsMatch = bodyText.match(/\$\s?([0-9,]+(\.[0-9]{2})?)/);
      const downloadsMatch = bodyText.match(/downloads?[:\s]+([0-9,]+)/i);
      const salesMatch = bodyText.match(/sales?[:\s]+([0-9,]+)/i);
      const followersMatch = bodyText.match(/followers?[:\s]+([0-9,]+)/i);

      return {
        url: window.location.href,
        title: document.title,
        extracted: {
          earningsRaw: earningsMatch ? earningsMatch[0] : null,
          earningsValue: earningsMatch ? parseFloat(earningsMatch[1].replace(/,/g, '')) : null,
          downloads: downloadsMatch ? parseInt(downloadsMatch[1].replace(/,/g, ''), 10) : null,
          sales: salesMatch ? parseInt(salesMatch[1].replace(/,/g, ''), 10) : null,
          followers: followersMatch ? parseInt(followersMatch[1].replace(/,/g, ''), 10) : null,
        },
      };
    });

    const now = new Date();
    const dateStr = now.toISOString().split('T')[0];
    const timeStr = now.toTimeString().split(' ')[0].replace(/:/g, '-');
    const timestamp = now.toISOString();

    const report = {
      timestamp,
      date: dateStr,
      data: statsData.extracted,
      meta: {
        pageUrl: statsData.url,
        pageTitle: statsData.title,
      },
    };

    // Save screenshot for visual audit
    const screenshotName = `stats-${dateStr}_${timeStr}.png`;
    const screenshotPath = path.join(SCREENSHOTS_DIR, screenshotName);
    await page.screenshot({ path: screenshotPath, fullPage: false });
    console.log(`📸 [STATS] Скриншот сохранен: ${screenshotPath}`);

    // Save daily JSON report
    const dailyReportPath = path.join(REPORTS_DIR, `stats-${dateStr}.json`);
    fs.writeFileSync(dailyReportPath, JSON.stringify(report, null, 2), 'utf-8');

    // Update latest.json
    const latestReportPath = path.join(REPORTS_DIR, 'latest.json');
    fs.writeFileSync(latestReportPath, JSON.stringify(report, null, 2), 'utf-8');

    // Append to history CSV
    const historyCsvPath = path.join(REPORTS_DIR, 'history.csv');
    const csvHeader = 'Timestamp,Date,EarningsRaw,EarningsValue,Downloads,Sales,Followers\n';
    const csvRow = `${timestamp},${dateStr},"${report.data.earningsRaw || ''}",${report.data.earningsValue ?? ''},${report.data.downloads ?? ''},${report.data.sales ?? ''},${report.data.followers ?? ''}\n`;

    if (!fs.existsSync(historyCsvPath)) {
      fs.writeFileSync(historyCsvPath, csvHeader + csvRow, 'utf-8');
    } else {
      fs.appendFileSync(historyCsvPath, csvRow, 'utf-8');
    }

    console.log(`📁 [STATS] Отчет сохранен:`);
    console.log(`   - ${dailyReportPath}`);
    console.log(`   - ${latestReportPath}`);
    console.log(`   - ${historyCsvPath}`);

    return report;
  } finally {
    await context.close();
    console.log('[STATS] Браузер закрыт.\n');
  }
}
