import fs from 'node:fs';
import path from 'node:path';
import { REPORTS_DIR } from './config.js';

export const MASTER_DB_PATH = path.join(REPORTS_DIR, 'master-database.json');
export const CHECKPOINT_PATH = path.join(REPORTS_DIR, '.scrape-checkpoint.json');

/**
 * Loads checkpoint state
 */
export function loadCheckpoint() {
  if (!fs.existsSync(CHECKPOINT_PATH)) {
    return {
      referrals: { lastCompletedPage: 0, completed: false },
      visits: { lastCompletedPage: 0, completed: false },
    };
  }
  try {
    return JSON.parse(fs.readFileSync(CHECKPOINT_PATH, 'utf-8'));
  } catch {
    return {
      referrals: { lastCompletedPage: 0, completed: false },
      visits: { lastCompletedPage: 0, completed: false },
    };
  }
}

/**
 * Updates checkpoint state
 */
export function saveCheckpoint(tabName, pageNumber, isCompleted = false) {
  const cp = loadCheckpoint();
  if (!cp[tabName]) cp[tabName] = {};
  cp[tabName].lastCompletedPage = pageNumber;
  cp[tabName].completed = isCompleted;
  cp[tabName].updatedAt = new Date().toISOString();
  fs.writeFileSync(CHECKPOINT_PATH, JSON.stringify(cp, null, 2), 'utf-8');
}

/**
 * Clears checkpoint when full collection is finished
 */
export function clearCheckpoint() {
  if (fs.existsSync(CHECKPOINT_PATH)) {
    try {
      fs.unlinkSync(CHECKPOINT_PATH);
    } catch {
      // ignore
    }
  }
}

/**
 * Loads the master database of all historical referrals and visits
 */
export function loadMasterDatabase() {
  if (!fs.existsSync(MASTER_DB_PATH)) {
    return {
      lastUpdated: null,
      latestOrderId: null,
      referrals: {}, // orderId -> referralData
      visits: [],    // array of visit objects
    };
  }
  try {
    return JSON.parse(fs.readFileSync(MASTER_DB_PATH, 'utf-8'));
  } catch {
    return {
      lastUpdated: null,
      latestOrderId: null,
      referrals: {},
      visits: [],
    };
  }
}

/**
 * Saves master database
 */
export function saveMasterDatabase(db) {
  db.lastUpdated = new Date().toISOString();
  fs.writeFileSync(MASTER_DB_PATH, JSON.stringify(db, null, 2), 'utf-8');
}

/**
 * Evaluates a single page of referrals against current database
 * @param {Array} rows 
 * @param {object} db 
 */
export function inspectReferralRowsAgainstDb(rows, db) {
  let newCount = 0;
  let updatedCount = 0;
  let knownCount = 0;

  rows.forEach((row) => {
    const orderEntry = Object.entries(row).find(([k]) => /order|id|номер/i.test(k));
    const orderId = orderEntry ? orderEntry[1].text.trim() : null;
    if (!orderId) return;

    if (!db.referrals[orderId]) {
      newCount++;
    } else {
      const oldAmount = db.referrals[orderId]['AMOUNT']?.text;
      const newAmount = row['AMOUNT']?.text;
      const oldStatus = db.referrals[orderId]['STATUS']?.text;
      const newStatus = row['STATUS']?.text;

      if (oldAmount !== newAmount || oldStatus !== newStatus) {
        updatedCount++;
      } else {
        knownCount++;
      }
    }
  });

  return { newCount, updatedCount, knownCount };
}

/**
 * Evaluates a single page of visits against current database
 * @param {Array} rows 
 * @param {Set} existingKeys 
 */
export function inspectVisitRowsAgainstDb(rows, existingKeys) {
  let newCount = 0;
  let knownCount = 0;

  rows.forEach((row) => {
    const url = Object.entries(row).find(([k]) => /page|url/i.test(k))?.[1]?.text || '';
    const date = Object.entries(row).find(([k]) => /date/i.test(k))?.[1]?.text || '';
    const ref = Object.entries(row).find(([k]) => /referr/i.test(k))?.[1]?.text || '';
    const key = `${date}|${url}|${ref}`;

    if (existingKeys.has(key)) {
      knownCount++;
    } else {
      newCount++;
    }
  });

  return { newCount, knownCount };
}

/**
 * Merges freshly scraped rows into the master database immediately
 * @param {Array} newReferralRows
 * @param {Array} newVisitRows
 */
export function mergeIntoMasterDatabase(newReferralRows = [], newVisitRows = []) {
  const db = loadMasterDatabase();
  let addedReferrals = 0;
  let updatedReferrals = 0;
  let knownReferrals = 0;
  let addedVisits = 0;
  let knownVisits = 0;

  // Merge Referrals by ORDER ID
  newReferralRows.forEach((row) => {
    const orderEntry = Object.entries(row).find(([k]) => /order|id|номер/i.test(k));
    const orderId = orderEntry ? orderEntry[1].text.trim() : null;

    if (!orderId) return;

    if (!db.referrals[orderId]) {
      db.referrals[orderId] = row;
      addedReferrals++;
    } else {
      const oldAmount = db.referrals[orderId]['AMOUNT']?.text;
      const newAmount = row['AMOUNT']?.text;
      const oldStatus = db.referrals[orderId]['STATUS']?.text;
      const newStatus = row['STATUS']?.text;

      if (oldAmount !== newAmount || oldStatus !== newStatus) {
        db.referrals[orderId] = row;
        updatedReferrals++;
      } else {
        knownReferrals++;
      }
    }
  });

  // Update latestOrderId from the first row of page 1 if available
  if (newReferralRows.length > 0) {
    const firstOrderEntry = Object.entries(newReferralRows[0]).find(([k]) => /order|id|номер/i.test(k));
    if (firstOrderEntry) {
      db.latestOrderId = firstOrderEntry[1].text.trim();
    }
  }

  // Merge Visits with deduplication by composite key (date + url + referrer)
  const existingVisitKeys = new Set(
    db.visits.map((v) => {
      const url = Object.entries(v).find(([k]) => /page|url/i.test(k))?.[1]?.text || '';
      const date = Object.entries(v).find(([k]) => /date/i.test(k))?.[1]?.text || '';
      const ref = Object.entries(v).find(([k]) => /referr/i.test(k))?.[1]?.text || '';
      return `${date}|${url}|${ref}`;
    })
  );

  newVisitRows.forEach((row) => {
    const url = Object.entries(row).find(([k]) => /page|url/i.test(k))?.[1]?.text || '';
    const date = Object.entries(row).find(([k]) => /date/i.test(k))?.[1]?.text || '';
    const ref = Object.entries(row).find(([k]) => /referr/i.test(k))?.[1]?.text || '';
    const key = `${date}|${url}|${ref}`;

    if (!existingVisitKeys.has(key)) {
      db.visits.push(row);
      existingVisitKeys.add(key);
      addedVisits++;
    } else {
      knownVisits++;
    }
  });

  saveMasterDatabase(db);
  return {
    db,
    addedReferrals,
    updatedReferrals,
    knownReferrals,
    addedVisits,
    knownVisits,
  };
}
