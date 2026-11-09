import fs from 'node:fs';
import path from 'node:path';
import { REPORTS_DIR } from './config.js';

/**
 * Extracts a numeric value from string like "$9.40", "0", "€9,40"
 */
function parseCurrency(str) {
  if (!str) return 0;
  const match = String(str).match(/[\d,.]+/);
  if (!match) return 0;
  return parseFloat(match[0].replace(/,/g, '')) || 0;
}

/**
 * Normalizes date string like "November 7, 2026 2:19 pm" or "November 5, 2026" to "November 5, 2026"
 */
function normalizeDateOnly(dateStr) {
  if (!dateStr) return 'Unknown';
  // Strip time part if present: "November 7, 2026 2:19 pm" -> "November 7, 2026"
  const match = dateStr.match(/^([A-Za-z]+ \d{1,2}, \d{4})/);
  return match ? match[1] : dateStr.trim();
}

/**
 * Extracts month and year: "November 2026"
 */
function extractMonthYear(dateStr) {
  if (!dateStr) return 'Unknown';
  const match = dateStr.match(/^([A-Za-z]+)\s+\d{1,2},\s+(\d{4})/);
  return match ? `${match[1]} ${match[2]}` : 'Unknown';
}

/**
 * Loads the latest raw dump or a specific JSON file
 */
export function loadReportData(filePath = null) {
  const targetPath = filePath || path.join(REPORTS_DIR, 'latest.json');
  if (!fs.existsSync(targetPath)) {
    throw new Error(`Файл отчета не найден: ${targetPath}. Сначала запустите сбор: npm run stats`);
  }
  return JSON.parse(fs.readFileSync(targetPath, 'utf-8'));
}

/**
 * Analyzes referrals: groups $0 registrations with $9.40 conversions
 */
export function analyzeReferrals(dumpData) {
  const rawRows = dumpData.referrals?.rows || [];
  if (rawRows.length === 0) return null;

  const normalized = rawRows.map((row, idx) => {
    const amountEntry = Object.entries(row).find(([k]) => /amount|цена|сумма/i.test(k));
    const amountRaw = amountEntry ? amountEntry[1].text : '';
    const amount = parseCurrency(amountRaw);

    const orderEntry = Object.entries(row).find(([k]) => /order|id|номер/i.test(k));
    const orderId = orderEntry ? orderEntry[1].text.trim() : '';

    const descEntry = Object.entries(row).find(([k]) => /description|описание|details/i.test(k));
    const description = descEntry ? descEntry[1].text.trim() : '';

    const statusEntry = Object.entries(row).find(([k]) => /status|статус/i.test(k));
    const status = statusEntry ? statusEntry[1].text.trim() : 'Approved';

    const dateEntry = Object.entries(row).find(([k]) => /date|дата/i.test(k));
    const rawDate = dateEntry ? dateEntry[1].text.trim() : '';
    const date = normalizeDateOnly(rawDate);
    const monthYear = extractMonthYear(rawDate);

    const originalRefMatch = description.match(/Subscription payment for\s+([A-Za-z0-9_]+)/i);
    const parentOrderId = originalRefMatch ? originalRefMatch[1] : null;

    return {
      index: idx,
      orderId,
      parentOrderId,
      amount,
      amountRaw,
      description,
      status,
      date,
      monthYear,
      rawDate,
    };
  });

  const zeroReferrals = normalized.filter((r) => r.amount === 0);
  const paidReferrals = normalized.filter((r) => r.amount > 0);

  const zeroByOrderId = new Map();
  zeroReferrals.forEach((z) => {
    if (z.orderId) zeroByOrderId.set(z.orderId, z);
  });

  const linkedConversions = [];
  const unmatchedPaid = [];

  paidReferrals.forEach((paid) => {
    const matchedZero = paid.parentOrderId ? zeroByOrderId.get(paid.parentOrderId) : null;
    if (matchedZero) {
      linkedConversions.push({
        status: 'LINKED_CONVERSION (0 -> $9.40)',
        originalOrderId: matchedZero.orderId,
        payoutOrderId: paid.orderId,
        registeredDate: matchedZero.date,
        paidDate: paid.date,
        amount: `$${paid.amount.toFixed(2)}`,
        plan: matchedZero.description || paid.description,
      });
    } else {
      unmatchedPaid.push({
        orderId: paid.orderId,
        parentOrderId: paid.parentOrderId,
        amount: `$${paid.amount.toFixed(2)}`,
        date: paid.date,
        description: paid.description,
      });
    }
  });

  const linkedZeroIds = new Set(linkedConversions.map((l) => l.originalOrderId));
  const pendingZeroReferrals = zeroReferrals
    .filter((z) => !linkedZeroIds.has(z.orderId))
    .map((z) => ({
      orderId: z.orderId,
      date: z.date,
      plan: z.description,
      expectedPayout: '$9.40',
    }));

  return {
    totalScraped: normalized.length,
    zeroCount: zeroReferrals.length,
    paidCount: paidReferrals.length,
    linkedConversionsCount: linkedConversions.length,
    pendingZeroCount: pendingZeroReferrals.length,
    totalPaidEarnings: paidReferrals.reduce((sum, r) => sum + r.amount, 0).toFixed(2),
    linkedConversions,
    pendingZeroReferrals: pendingZeroReferrals.slice(0, 15),
    unmatchedPaid: unmatchedPaid.slice(0, 15),
    normalized,
  };
}

/**
 * Analyzes visits and detects blue checkmarks (Visit converted: yes)
 */
export function analyzeVisits(dumpData) {
  const rawVisits = dumpData.visits?.rows || [];
  if (rawVisits.length === 0) return null;

  const productStats = {};
  const convertedVisitsList = [];

  const normalized = rawVisits.map((row, idx) => {
    const urlEntry = Object.entries(row).find(([k]) => /page|url|landing|ссылка/i.test(k));
    const targetUrl = urlEntry ? urlEntry[1].text || urlEntry[1].linkHref : 'Unknown';

    const refEntry = Object.entries(row).find(([k]) => /referr/i.test(k));
    const referringUrl = refEntry ? refEntry[1].text || refEntry[1].linkHref : '';

    const convertedEntry = Object.entries(row).find(([k]) => /converted|конверт/i.test(k));
    const dateEntry = Object.entries(row).find(([k]) => /date|дата/i.test(k));
    const rawDate = dateEntry ? dateEntry[1].text.trim() : '';
    const date = normalizeDateOnly(rawDate);
    const monthYear = extractMonthYear(rawDate);

    // Exact checkmark detection (<i class="fas fa-check color-blue" aria-label="Visit converted: yes">)
    const isConverted =
      row._isConvertedVisit === true ||
      Boolean(convertedEntry?.[1]?.hasCheckmark) ||
      /converted:\s*yes|yes|да|1|true/i.test(convertedEntry?.[1]?.ariaLabel || '') ||
      /converted:\s*yes|yes|да|1|true/i.test(convertedEntry?.[1]?.text || '') ||
      /fa-check|color-blue/i.test(convertedEntry?.[1]?.html || '');

    if (!productStats[targetUrl]) {
      productStats[targetUrl] = { visits: 0, conversions: 0 };
    }
    productStats[targetUrl].visits += 1;

    const visitItem = {
      index: idx,
      targetUrl,
      referringUrl,
      isConverted,
      rawDate,
      date,
      monthYear,
    };

    if (isConverted) {
      productStats[targetUrl].conversions += 1;
      convertedVisitsList.push(visitItem);
    }

    return visitItem;
  });

  const sortedProducts = Object.entries(productStats)
    .map(([url, s]) => ({
      productOrPage: url.replace('https://www.creativefabrica.com', ''),
      visits: s.visits,
      conversions: s.conversions,
      conversionRate: s.visits > 0 ? ((s.conversions / s.visits) * 100).toFixed(1) + '%' : '0%',
    }))
    .sort((a, b) => b.conversions - a.conversions || b.visits - a.visits);

  return {
    totalVisits: rawVisits.length,
    totalConvertedVisits: convertedVisitsList.length,
    convertedVisits: convertedVisitsList,
    uniqueUrls: sortedProducts.length,
    topProducts: sortedProducts.slice(0, 20),
    normalized,
  };
}

/**
 * Cross-reconciles Visits Checkmarks vs Referrals Table (Discrepancy Audit)
 */
export function auditDiscrepancies(refAnalysis, visitAnalysis) {
  if (!refAnalysis || !visitAnalysis) return null;

  const referrals = refAnalysis.normalized || [];
  const visits = visitAnalysis.normalized || [];

  // Group by Date
  const refsByDate = {};
  referrals.forEach((r) => {
    if (!refsByDate[r.date]) refsByDate[r.date] = [];
    refsByDate[r.date].push(r);
  });

  const convertedVisitsByDate = {};
  visits.forEach((v) => {
    if (v.isConverted) {
      if (!convertedVisitsByDate[v.date]) convertedVisitsByDate[v.date] = [];
      convertedVisitsByDate[v.date].push(v);
    }
  });

  // Compare per Date
  const allDates = Array.from(new Set([...Object.keys(refsByDate), ...Object.keys(convertedVisitsByDate)]));
  const discrepancies = [];

  allDates.forEach((d) => {
    const convertedCount = convertedVisitsByDate[d]?.length || 0;
    const refCount = refsByDate[d]?.length || 0;

    // A discrepancy occurs when there are converted visits with checkmarks, but fewer or NO referrals recorded!
    if (convertedCount > refCount) {
      const missingCount = convertedCount - refCount;
      const affectedVisits = convertedVisitsByDate[d] || [];

      discrepancies.push({
        date: d,
        convertedVisitsCount: convertedCount,
        referralsRecorded: refCount,
        missingReferralsCount: missingCount,
        affectedProducts: affectedVisits.map((v) => ({
          product: v.targetUrl,
          referringUrl: v.referringUrl,
          time: v.rawDate,
        })),
      });
    }
  });

  // Monthly breakdown
  const monthlySummary = {};
  visits.forEach((v) => {
    if (!monthlySummary[v.monthYear]) {
      monthlySummary[v.monthYear] = { visits: 0, convertedCheckmarks: 0, referralsRecorded: 0 };
    }
    monthlySummary[v.monthYear].visits += 1;
    if (v.isConverted) {
      monthlySummary[v.monthYear].convertedCheckmarks += 1;
    }
  });

  referrals.forEach((r) => {
    if (!monthlySummary[r.monthYear]) {
      monthlySummary[r.monthYear] = { visits: 0, convertedCheckmarks: 0, referralsRecorded: 0 };
    }
    monthlySummary[r.monthYear].referralsRecorded += 1;
  });

  return {
    totalDiscrepancyDays: discrepancies.length,
    discrepancies,
    monthlySummary: Object.entries(monthlySummary).map(([month, s]) => ({
      month,
      totalVisits: s.visits,
      convertedCheckmarks: s.convertedCheckmarks,
      referralsRecorded: s.referralsRecorded,
      status: s.convertedCheckmarks > s.referralsRecorded ? '🚨 РАСХОЖДЕНИЕ (ПОТЕРИ)' : '✅ OK',
    })),
  };
}

/**
 * Generates ready-to-send support email ticket text
 */
function generateSupportTicketDraft(audit) {
  if (!audit || audit.discrepancies.length === 0) return null;

  let text = `Subject: Missing Affiliate Referrals Discrepancy Report - Account #8551108\n\n`;
  text += `Hello Creative Fabrica Affiliates Support Team,\n\n`;
  text += `I am contacting you regarding an ongoing tracking discrepancy in my affiliate account (#8551108, kalifornia.lover7@gmail.com).\n`;
  text += `Our automated audit detected conversions marked with a blue checkmark ('Visit converted: yes') in the Visits tab that were NOT credited in the Referrals tab.\n\n`;
  text += `Detailed Discrepancy Breakdown:\n`;
  text += `------------------------------------------------------------\n`;

  audit.discrepancies.forEach((d) => {
    text += `\n📅 Date: ${d.date}\n`;
    text += `   - Converted Visits with Blue Checkmark: ${d.convertedVisitsCount}\n`;
    text += `   - Referrals Credited in Referrals Tab:  ${d.referralsRecorded}\n`;
    text += `   - Missing Uncredited Referrals:         ${d.missingReferralsCount}\n`;
    text += `   - Product / Visit Details:\n`;
    d.affectedProducts.forEach((p) => {
      text += `     * Product: ${p.product}\n`;
      text += `       Time: ${p.time}\n`;
      text += `       Referrer: ${p.referringUrl}\n`;
    });
  });

  text += `\n------------------------------------------------------------\n`;
  text += `Please investigate this tracking failure, manually credit the missing referrals to my account, and let me know when this issue is resolved.\n\n`;
  text += `Thank you,\nKalifornia Lover\nAccount #8551108`;

  return text;
}

/**
 * Generates and prints the complete analytics report
 */
export function runAnalytics(customPath = null) {
  console.log('\n======================================================');
  console.log('📈 [ANALYTICS] Анализ конверсий, визитов и аудит расхождений');
  console.log('======================================================\n');

  const dump = loadReportData(customPath);
  const refAnalysis = analyzeReferrals(dump);
  const visitAnalysis = analyzeVisits(dump);
  const audit = auditDiscrepancies(refAnalysis, visitAnalysis);

  if (refAnalysis) {
    console.log('💰 [СТАТИСТИКА РЕФЕРАЛОВ]');
    console.log(`   Всего записей в выгрузке:      ${refAnalysis.totalScraped}`);
    console.log(`   Оплаченных комиссий ($):       ${refAnalysis.paidCount}`);
    console.log(`   Общая сумма заработка:         $${refAnalysis.totalPaidEarnings}`);
    console.log(`   Слинкованных конверсий:        ${refAnalysis.linkedConversionsCount}`);
    console.log(`   Ожидающих конверсии в $9.40:   ${refAnalysis.pendingZeroCount} лидов`);

    if (refAnalysis.linkedConversions.length > 0) {
      console.log('\n🔗 [СЛИНКОВАННЫЕ КОНВЕРСИИ ($0 -> $9.40)]');
      console.table(refAnalysis.linkedConversions);
    }
  }

  if (visitAnalysis) {
    console.log('\n🌐 [СТАТИСТИКА ПЕРЕХОДОВ]');
    console.log(`   Всего визитов в выгрузке:      ${visitAnalysis.totalVisits}`);
    console.log(`   Визитов с синей галочкой (✔):  ${visitAnalysis.totalConvertedVisits}`);
  }

  // AUDIT SECTION
  if (audit) {
    console.log('\n======================================================');
    console.log('🔍 [СВЕРКА: СИНИЕ ГАЛОЧКИ vs ЗАСЧИТАННЫЕ РЕФЕРАЛЫ]');
    console.log('======================================================');
    console.table(audit.monthlySummary);

    if (audit.discrepancies.length > 0) {
      console.log('\n🚨 [ВНИМАНИЕ! ОБНАРУЖЕНЫ ПОТЕРЯННЫЕ РЕФЕРАЛЫ]');
      audit.discrepancies.forEach((d) => {
        console.log(`\n📅 Дата: ${d.date}`);
        console.log(`   Галочек в визитах: ${d.convertedVisitsCount} | Рефералов в таблице: ${d.referralsRecorded}`);
        console.log(`   ❗ Потеряно рефералов: ${d.missingReferralsCount}`);
        console.log('   Товары с неподтвержденной конверсией:');
        console.table(d.affectedProducts);
      });

      // Generate support ticket draft
      const ticketDraft = generateSupportTicketDraft(audit);
      const ticketPath = path.join(REPORTS_DIR, 'missing-referrals-ticket.txt');
      fs.writeFileSync(ticketPath, ticketDraft, 'utf-8');
      console.log(`\n📝 [ПОДДЕРЖКА] Готовый текст тикета в саппорт сохранен в:`);
      console.log(`   👉 ${ticketPath}\n`);
    } else {
      console.log('✅ Все конверсии с синей галочкой сходятся с таблицей рефералов! Потерь не обнаружено.');
    }
  }

  // Save report
  const summaryPath = path.join(REPORTS_DIR, 'analytics-summary.json');
  fs.writeFileSync(
    summaryPath,
    JSON.stringify(
      {
        timestamp: new Date().toISOString(),
        referrals: refAnalysis,
        visits: visitAnalysis,
        audit,
      },
      null,
      2
    ),
    'utf-8'
  );
  console.log(`📁 Итоговый файл аналитики обновлен: ${summaryPath}\n`);
}
