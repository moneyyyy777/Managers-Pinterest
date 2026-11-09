import fs from 'node:fs';
import path from 'node:path';
import { launchBrowser, randomDelay } from './browser.js';
import { CF_URLS, REPORTS_DIR, SCREENSHOTS_DIR } from './config.js';
import {
  MASTER_DB_PATH,
  loadMasterDatabase,
  mergeIntoMasterDatabase,
  inspectReferralRowsAgainstDb,
  inspectVisitRowsAgainstDb,
  loadCheckpoint,
  saveCheckpoint,
  clearCheckpoint,
} from './storage.js';

/**
 * Extracts table rows and cell metadata with checkmark detection
 */
async function extractGranularTableData(page) {
  return await page.evaluate(() => {
    const table = document.querySelector(
      'table#affwp-affiliate-dashboard-referrals, table#affwp-affiliate-dashboard-visits, table.affwp-table, table'
    );
    if (!table) return null;

    const headers = Array.from(table.querySelectorAll('thead th, tr:first-child th')).map((th) =>
      th.innerText.trim()
    );

    const rows = Array.from(table.querySelectorAll('tbody tr')).map((tr, index) => {
      const cells = Array.from(tr.querySelectorAll('td, th'));
      const rowData = {
        _rowIndex: index,
        rawText: tr.innerText.trim(),
        _isConvertedVisit: false,
      };

      cells.forEach((cell, cellIdx) => {
        const headerName = headers[cellIdx] || `col_${cellIdx}`;
        const link = cell.querySelector('a');
        const text = cell.innerText.trim();

        const checkIcon = cell.querySelector(
          'i.fa-check, i[class*="check"], .color-blue, [aria-label*="converted: yes" i]'
        );
        const ariaLabel =
          cell.getAttribute('aria-label') ||
          cell.querySelector('[aria-label]')?.getAttribute('aria-label') ||
          '';

        const hasCheckmark =
          Boolean(checkIcon) ||
          /converted:\s*yes|visit converted/i.test(ariaLabel) ||
          /color-blue|fa-check/i.test(cell.innerHTML);

        if (hasCheckmark) {
          rowData._isConvertedVisit = true;
        }

        rowData[headerName] = {
          text,
          html: cell.innerHTML.trim(),
          ariaLabel,
          hasCheckmark,
          linkHref: link ? link.getAttribute('href') : null,
          linkText: link ? link.innerText.trim() : null,
          dataAttributes: Object.fromEntries(
            Array.from(cell.attributes)
              .filter((a) => a.name.startsWith('data-'))
              .map((a) => [a.name, a.value])
          ),
        };
      });

      return rowData;
    });

    const hasNextBtn = Boolean(
      document.querySelector('.affwp-pagination a.next, .pagination a.next, a.next.page-numbers')
    );

    return {
      headers,
      rowCount: rows.length,
      rows,
      hasNextBtn,
    };
  });
}

/**
 * Scrapes tab with per-page persistence and smart incremental boundary detection
 */
async function scrapeTabWithPagination(
  page,
  tabName,
  { maxPages = 100, incremental = false, restart = false } = {}
) {
  console.log(`\n[SCRAPER] ======================================================`);
  console.log(`[SCRAPER] 🚀 Запуск сбора вкладки: ${tabName.toUpperCase()}`);
  console.log(`[SCRAPER]    Режим: ${incremental ? '⚡ ИНКРЕМЕНТАЛЬНЫЙ (до границы известных данных)' : '📦 ПОЛНЫЙ'}`);
  console.log(`[SCRAPER]    Максимальный лимит страниц: ${maxPages === 0 ? 'БЕЗ ОГРАНИЧЕНИЙ' : maxPages}`);
  console.log(`[SCRAPER] ======================================================`);

  const checkpoint = loadCheckpoint();
  const tabCheckpoint = checkpoint[tabName] || { lastCompletedPage: 0, completed: false };

  let startPage = 1;
  if (!restart && !incremental && tabCheckpoint.lastCompletedPage > 0 && !tabCheckpoint.completed) {
    startPage = tabCheckpoint.lastCompletedPage + 1;
    console.log(`📌 [SCRAPER] [${tabName}] Возобновление с контрольной точки: страница ${startPage}`);
  }

  // Pre-load lookup keys for fast incremental comparison
  let db = loadMasterDatabase();
  const existingVisitKeys = new Set(
    db.visits.map((v) => {
      const url = Object.entries(v).find(([k]) => /page|url/i.test(k))?.[1]?.text || '';
      const date = Object.entries(v).find(([k]) => /date/i.test(k))?.[1]?.text || '';
      const ref = Object.entries(v).find(([k]) => /referr/i.test(k))?.[1]?.text || '';
      return `${date}|${url}|${ref}`;
    })
  );

  let currentPage = startPage;
  let totalScrapedInThisRun = 0;

  while (true) {
    if (maxPages > 0 && currentPage > maxPages) {
      console.log(`[SCRAPER] [${tabName}] Достигнут лимит страниц (${maxPages}). Переход к следующему шагу.`);
      break;
    }

    const targetUrl =
      currentPage === 1
        ? `https://www.creativefabrica.com/affiliate-area/?tab=${tabName}`
        : `https://www.creativefabrica.com/affiliate-area/page/${currentPage}/?tab=${tabName}#affwp-affiliate-dashboard-${tabName}`;

    console.log(`\n[SCRAPER] [${tabName}] Загрузка стр. ${currentPage}: ${targetUrl}`);

    let loadSuccess = false;
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        await page.goto(targetUrl, { waitUntil: 'domcontentloaded', timeout: 60000 });
        await page.waitForSelector('table tbody tr', { state: 'attached', timeout: 30000 });
        loadSuccess = true;
        break;
      } catch (err) {
        console.warn(`[SCRAPER] [${tabName}] Попытка ${attempt}/3: ожидание таблицы (${err.message})...`);
        await randomDelay(3000, 6000);
      }
    }

    if (!loadSuccess) {
      console.log(`⚠️ [SCRAPER] [${tabName}] Не удалось загрузить таблицу на стр. ${currentPage}. Прогресс сохранен.`);
      break;
    }

    await randomDelay(2000, 3500);
    const pageData = await extractGranularTableData(page);

    if (!pageData || pageData.rowCount === 0) {
      console.log(`[SCRAPER] [${tabName}] На стр. ${currentPage} строк нет. Завершение.`);
      saveCheckpoint(tabName, currentPage, true);
      break;
    }

    // Incremental inspection against current master-database
    if (tabName === 'referrals') {
      const { newCount, updatedCount, knownCount } = inspectReferralRowsAgainstDb(pageData.rows, db);
      console.log(`🔍 [SCRAPER] [referrals] Стр. ${currentPage} (всего ${pageData.rowCount} строк): ` +
        `➕ Новых: ${newCount} | 🔄 Обновлено статусов/сумм: ${updatedCount} | 📚 Уже в базе: ${knownCount}`);

      // Merge into DB immediately
      const mergeResult = mergeIntoMasterDatabase(pageData.rows, []);
      db = mergeResult.db;

      if (incremental && newCount === 0 && updatedCount === 0) {
        console.log(`\n⚡ [SCRAPER] [referrals] ВСЕ ${pageData.rowCount} строк со страницы ${currentPage} уже есть в базе без изменений!`);
        console.log(`⚡ [SCRAPER] [referrals] Граница новых рефералов достигнута на странице ${currentPage}. Пагинация успешно остановлена.`);
        saveCheckpoint(tabName, currentPage, true);
        totalScrapedInThisRun += pageData.rowCount;
        break;
      }
    } else {
      // tabName === 'visits'
      const { newCount, knownCount } = inspectVisitRowsAgainstDb(pageData.rows, existingVisitKeys);
      console.log(`🔍 [SCRAPER] [visits] Стр. ${currentPage} (всего ${pageData.rowCount} визитов): ` +
        `➕ Новых: ${newCount} | 📚 Уже в базе: ${knownCount}`);

      // Merge into DB immediately
      const mergeResult = mergeIntoMasterDatabase([], pageData.rows);
      db = mergeResult.db;
      pageData.rows.forEach((r) => {
        const url = Object.entries(r).find(([k]) => /page|url/i.test(k))?.[1]?.text || '';
        const date = Object.entries(r).find(([k]) => /date/i.test(k))?.[1]?.text || '';
        const ref = Object.entries(r).find(([k]) => /referr/i.test(k))?.[1]?.text || '';
        existingVisitKeys.add(`${date}|${url}|${ref}`);
      });

      if (incremental && newCount === 0) {
        console.log(`\n⚡ [SCRAPER] [visits] ВСЕ ${pageData.rowCount} визитов со страницы ${currentPage} уже есть в базе!`);
        console.log(`⚡ [SCRAPER] [visits] Граница новых переходов достигнута на странице ${currentPage}. Пагинация успешно остановлена.`);
        saveCheckpoint(tabName, currentPage, true);
        totalScrapedInThisRun += pageData.rowCount;
        break;
      }
    }

    totalScrapedInThisRun += pageData.rowCount;
    saveCheckpoint(tabName, currentPage, false);

    if (!pageData.hasNextBtn) {
      console.log(`🏁 [SCRAPER] [${tabName}] Стр. ${currentPage} — последняя (кнопка 'Next' отсутствует). Вкладка полностью собрана!`);
      saveCheckpoint(tabName, currentPage, true);
      break;
    }

    currentPage++;
    await randomDelay(2500, 4500);
  }

  return {
    tabName,
    lastPage: currentPage,
    totalScrapedInThisRun,
  };
}

/**
 * Main scraper function
 */
export async function collectGranularStats({
  headless = false,
  maxPages = 10,
  incremental = false,
  restart = false,
} = {}) {
  // If incremental mode is requested, use high page threshold (up to 100 pages per day)
  // so that even 10-20-50 pages in a single day are fully captured without artificial limits!
  const effectiveMaxPages = incremental
    ? (maxPages > 10 ? maxPages : 100)
    : maxPages;

  console.log('\n======================================================');
  console.log(`📊 [SCRAPER] Запуск сбора статистики Creative Fabrica`);
  console.log(`   Режим: ${incremental ? '⚡ ИНКРЕМЕНТАЛЬНЫЙ (поиск границы до 100 стр)' : '📦 ПОЛНЫЙ СБОР'}`);
  console.log(`   Лимит страниц: ${effectiveMaxPages === 0 ? 'ВСЕ СТРАНИЦЫ ДО КОНЦА' : effectiveMaxPages}`);
  console.log(`   Возобновление (Resume): ${!restart ? 'ВКЛЮЧЕНО' : 'С НАЧАЛА'}`);
  console.log('======================================================\n');

  const { context, page } = await launchBrowser({ headless });

  const capturedResponses = [];
  page.on('response', async (response) => {
    try {
      const url = response.url();
      const contentType = response.headers()['content-type'] || '';
      if (
        url.includes('creativefabrica.com') &&
        (contentType.includes('application/json') || url.includes('/wp-json/') || url.includes('admin-ajax.php'))
      ) {
        const body = await response.json();
        if (body) {
          capturedResponses.push({
            url,
            status: response.status(),
            timestamp: new Date().toISOString(),
            data: body,
          });
        }
      }
    } catch {
      // ignore
    }
  });

  try {
    const now = new Date();
    const dateStr = now.toISOString().split('T')[0];
    const timeStr = now.toTimeString().split(' ')[0].replace(/:/g, '-');
    const timestamp = now.toISOString();

    // 1. Scrape Referrals
    await scrapeTabWithPagination(page, 'referrals', {
      maxPages: effectiveMaxPages,
      incremental,
      restart,
    });
    const screenshotReferralsPath = path.join(SCREENSHOTS_DIR, `referrals-${dateStr}_${timeStr}.png`);
    await page.screenshot({ path: screenshotReferralsPath, fullPage: false });

    // 2. Scrape Visits (no artificial 3-page cap! Full depth up to effectiveMaxPages!)
    await scrapeTabWithPagination(page, 'visits', {
      maxPages: effectiveMaxPages,
      incremental,
      restart,
    });
    const screenshotVisitsPath = path.join(SCREENSHOTS_DIR, `visits-${dateStr}_${timeStr}.png`);
    await page.screenshot({ path: screenshotVisitsPath, fullPage: false });

    // Load final master database
    const finalDb = loadMasterDatabase();
    const masterReferralRows = Object.values(finalDb.referrals);
    const masterVisitRows = finalDb.visits;

    const fullDump = {
      timestamp,
      date: dateStr,
      meta: {
        mode: incremental ? 'incremental' : 'full',
        totalHistoricalReferrals: masterReferralRows.length,
        totalHistoricalVisits: masterVisitRows.length,
      },
      referrals: {
        totalRows: masterReferralRows.length,
        rows: masterReferralRows,
      },
      visits: {
        totalRows: masterVisitRows.length,
        rows: masterVisitRows,
      },
      capturedNetworkResponses: capturedResponses,
    };

    // Save Daily JSON Report & latest.json
    const dailyReportPath = path.join(REPORTS_DIR, `stats-${dateStr}.json`);
    fs.writeFileSync(dailyReportPath, JSON.stringify(fullDump, null, 2), 'utf-8');

    const latestPath = path.join(REPORTS_DIR, 'latest.json');
    fs.writeFileSync(latestPath, JSON.stringify(fullDump, null, 2), 'utf-8');

    console.log('\n======================================================');
    console.log('🎉 [SCRAPER] Сбор данных завершен!');
    console.log(`   📚 Всего рефералов в master-database.json: ${masterReferralRows.length}`);
    console.log(`   📊 Всего визитов в master-database.json:   ${masterVisitRows.length}`);
    console.log(`📁 Файлы актуализированы:`);
    console.log(`   - ${MASTER_DB_PATH}`);
    console.log(`   - ${latestPath}`);
    console.log('======================================================\n');

    return fullDump;
  } finally {
    await context.close();
    console.log('[SCRAPER] Сессия браузера закрыта.\n');
  }
}
