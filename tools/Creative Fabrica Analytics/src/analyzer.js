import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { MASTER_DB_PATH, REPORTS_DIR } from './config.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const DAILY_ANALYTICS_PATH = path.join(REPORTS_DIR, 'analytics-daily.json');
export const DAILY_ANALYTICS_JS_PATH = path.join(REPORTS_DIR, 'analytics-daily.js');

const MONTH_MAP = {
  january: '01', february: '02', march: '03', april: '04',
  may: '05', june: '06', july: '07', august: '08',
  september: '09', october: '10', november: '11', december: '12',
  jan: '01', feb: '02', mar: '03', apr: '04', jun: '06',
  jul: '07', aug: '08', sep: '09', oct: '10', nov: '11', dec: '12',
};

/**
 * Normalizes human date string into ISO YYYY-MM-DD
 * Examples: "November 5, 2026", "November 7, 2026 6:57 pm" -> "2026-11-05" / "2026-11-07"
 */
export function parseDateToYMD(str) {
  if (!str) return null;
  const match = str.trim().match(/^([A-Za-z]+)\s+(\d{1,2}),\s+(\d{4})/);
  if (!match) return null;
  const monthName = match[1].toLowerCase();
  const month = MONTH_MAP[monthName];
  if (!month) return null;
  const day = match[2].padStart(2, '0');
  const year = match[3];
  return `${year}-${month}-${day}`;
}

/**
 * Parses currency string into float
 */
export function parseCurrency(str) {
  if (!str) return 0;
  const match = String(str).match(/[\d,.]+/);
  return match ? parseFloat(match[0].replace(/,/g, '')) || 0 : 0;
}

/**
 * Core daily analytics processor
 */
export function processDailyAnalytics() {
  console.log('\n======================================================');
  console.log('📈 [ANALYZER] Запуск аналитической обработки базы данных');
  console.log(`   Источник: ${MASTER_DB_PATH}`);
  console.log('======================================================\n');

  if (!fs.existsSync(MASTER_DB_PATH)) {
    throw new Error(`Файл базы данных не найден: ${MASTER_DB_PATH}`);
  }

  const db = JSON.parse(fs.readFileSync(MASTER_DB_PATH, 'utf-8'));
  const visits = db.visits || [];
  const referrals = Object.values(db.referrals || {});

  console.log(`[ANALYZER] Загружено из базы: ${visits.length} визитов, ${referrals.length} рефералов.`);

  const dailyMap = {};

  function getDayRecord(ymd) {
    if (!dailyMap[ymd]) {
      dailyMap[ymd] = {
        date: ymd,
        total_visits: 0,
        blue_checkmarks: 0,
        referrals_zero: 0,
        missing_referrals: 0,
        renewals_count: 0,
        daily_earnings: 0,
      };
    }
    return dailyMap[ymd];
  }

  // 1. Process all visits (total_visits, blue_checkmarks)
  visits.forEach((v) => {
    const ymd = parseDateToYMD(v.DATE?.text);
    if (!ymd) return;
    const day = getDayRecord(ymd);
    day.total_visits++;

    const cell = v.CONVERTED || {};
    const html = cell.html || '';
    const aria = cell.ariaLabel || '';
    
    // Accurate detection of blue checkmark (ignoring red cross)
    const isBlue =
      (/fa-check|color-blue/i.test(html) || /converted:\s*yes/i.test(aria)) &&
      !/fa-times|color-red/i.test(html);

    if (isBlue) {
      day.blue_checkmarks++;
    }
  });

  // 2. Process all referrals (referrals_zero, renewals_count, daily_earnings)
  referrals.forEach((r) => {
    const ymd = parseDateToYMD(r.DATE?.text);
    if (!ymd) return;
    const day = getDayRecord(ymd);
    const amount = parseCurrency(r.AMOUNT?.text);

    if (amount === 0) {
      day.referrals_zero++;
    } else {
      day.renewals_count++;
      day.daily_earnings += amount;
    }
  });

  // 3. Apply business formula: missing_referrals = (blue_checkmarks - referrals_zero)
  const dailyResults = Object.values(dailyMap)
    .map((day) => {
      const diff = day.blue_checkmarks - day.referrals_zero;
      return {
        date: day.date,
        total_visits: day.total_visits,
        blue_checkmarks: day.blue_checkmarks,
        referrals_zero: day.referrals_zero,
        missing_referrals: diff > 0 ? diff : 0,
        renewals_count: day.renewals_count,
        daily_earnings: parseFloat(day.daily_earnings.toFixed(2)),
      };
    })
    .sort((a, b) => b.date.localeCompare(a.date)); // Sort by date descending (newest first)

  // 4. Save to data/reports/analytics-daily.json & analytics-daily.js
  fs.writeFileSync(DAILY_ANALYTICS_PATH, JSON.stringify(dailyResults, null, 2), 'utf-8');
  fs.writeFileSync(DAILY_ANALYTICS_JS_PATH, `window.CREATIVE_FABRICA_DATA = ${JSON.stringify(dailyResults)};\n`, 'utf-8');
  console.log(`💾 [ANALYZER] Результат успешно сохранен в:`);
  console.log(`   👉 ${DAILY_ANALYTICS_PATH}`);
  console.log(`   👉 ${DAILY_ANALYTICS_JS_PATH}`);
  console.log(`   📊 Всего обработано уникальных дней: ${dailyResults.length}\n`);

  // 5. Calculate Top-10 days with maximum losses
  const daysWithLosses = dailyResults.filter((d) => d.missing_referrals > 0);
  const top10Losses = [...daysWithLosses]
    .sort((a, b) => b.missing_referrals - a.missing_referrals || b.date.localeCompare(a.date))
    .slice(0, 10);

  console.log('========================================================================================');
  console.log(`🚨 [ТОП-10 ДНЕЙ С МАКСИМАЛЬНЫМИ ПОТЕРЯМИ (MISSING REFERRALS)]`);
  console.log(`   Всего дней с потерями в истории: ${daysWithLosses.length}`);
  console.log('========================================================================================');
  console.table(top10Losses);
  console.log('========================================================================================\n');

  return {
    totalDays: dailyResults.length,
    daysWithLossesCount: daysWithLosses.length,
    top10Losses,
    dailyResults,
  };
}

// Direct execution check
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  processDailyAnalytics();
}
