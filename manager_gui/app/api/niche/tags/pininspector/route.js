import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { findKeywordFolder, getProjectRoot } from '@/lib/paths';

/**
 * Normalizes a keyword: lowercase, removes surrounding quotes, collapses internal whitespaces
 */
function cleanKeyword(kw) {
  if (!kw) return '';
  return kw
    .replace(/^["'`\s]+|["'`\s]+$/g, '') // remove leading/trailing quotes and spaces
    .replace(/\s+/g, ' ') // collapse multiple spaces
    .trim()
    .toLowerCase();
}

/**
 * Splits raw input text according to delimiter, stripping whitespace cleanly
 */
function parseRawTags(rawText, delimiter = 'auto') {
  if (!rawText || typeof rawText !== 'string') return [];

  let items = [];

  if (delimiter === ',' || delimiter === ', ') {
    // Split on commas, clean surrounding spaces
    items = rawText.split(',').map((s) => s.trim()).filter(Boolean);
  } else if (delimiter === ';' || delimiter === '; ') {
    items = rawText.split(';').map((s) => s.trim()).filter(Boolean);
  } else if (delimiter === '\t') {
    items = rawText.split('\t').map((s) => s.trim()).filter(Boolean);
  } else {
    // Auto or newline
    const lines = rawText.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);

    // If only one line was passed but it has many commas or semicolons
    if (lines.length === 1 && lines[0].includes(',') && !lines[0].includes(';')) {
      const parts = lines[0].split(',').map((s) => s.trim()).filter(Boolean);
      if (parts.length > 2) {
        return parts;
      }
    }

    items = lines;
  }

  return items;
}

/**
 * Parses lines into structured objects { keyword, volume }
 */
function parseKeywordsAndVolume(items) {
  const result = [];
  const seen = new Set();
  let volumeCount = 0;

  for (const item of items) {
    if (!item) continue;

    // Check for delimiter with volume: keyword;volume or keyword,volume or keyword\tvolume
    let kw = item;
    let vol = null;

    if (item.includes(';')) {
      const parts = item.split(';');
      kw = parts[0];
      const possibleVol = parts[1]?.trim();
      if (possibleVol && /^\d+$/.test(possibleVol)) {
        vol = parseInt(possibleVol, 10);
      }
    } else if (item.includes('\t')) {
      const parts = item.split('\t');
      kw = parts[0];
      const possibleVol = parts[parts.length - 1]?.trim();
      if (possibleVol && /^\d+$/.test(possibleVol)) {
        vol = parseInt(possibleVol, 10);
      }
    } else if (item.includes(',')) {
      // Be careful: could be "keyword, 880" or just comma-separated tags
      const lastCommaIdx = item.lastIndexOf(',');
      const candidateVol = item.slice(lastCommaIdx + 1).trim();
      if (/^\d+$/.test(candidateVol)) {
        kw = item.slice(0, lastCommaIdx);
        vol = parseInt(candidateVol, 10);
      }
    }

    const cleanedKw = cleanKeyword(kw);
    if (!cleanedKw) continue;

    // Skip CSV header line if present
    if (cleanedKw === 'keyword' || cleanedKw === 'keywords' || cleanedKw === 'search volume' || cleanedKw === 'tag') {
      continue;
    }

    if (!seen.has(cleanedKw)) {
      seen.add(cleanedKw);
      if (vol !== null) volumeCount++;
      result.push({
        keyword: cleanedKw,
        volume: vol
      });
    }
  }

  return { items: result, hasVolume: volumeCount > 0, volumeCount };
}

export async function POST(request) {
  try {
    const body = await request.json();
    const {
      category,
      collection,
      segment,
      segmentName,
      rawText,
      delimiter = 'auto',
      saveAsAllCsv = true,
      allCsvFileName,
      defaultVolume = 100,
      volumeSeparator = ';'
    } = body;

    const seg = segment || segmentName;

    if (!category || !collection) {
      return NextResponse.json(
        { success: false, error: 'Category and collection are required' },
        { status: 400 }
      );
    }

    if (!rawText || typeof rawText !== 'string' || !rawText.trim()) {
      return NextResponse.json(
        { success: false, error: 'rawText (keywords from Pin Inspector) is required' },
        { status: 400 }
      );
    }

    const kwPath = findKeywordFolder(category, collection);
    if (!kwPath || !fs.existsSync(kwPath)) {
      return NextResponse.json(
        { success: false, error: 'Keyword folder does not exist. Initialize niche first.' },
        { status: 400 }
      );
    }

    const targetDir =
      seg && fs.existsSync(path.join(kwPath, seg))
        ? path.join(kwPath, seg)
        : kwPath;

    // 1. Parse raw text into keywords and volumes
    const rawItems = parseRawTags(rawText, delimiter);
    const { items: parsedKeywords, hasVolume, volumeCount } = parseKeywordsAndVolume(rawItems);

    if (parsedKeywords.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No valid keywords found in input' },
        { status: 400 }
      );
    }

    // 2. Write Pininspector.txt
    const pininspectorPath = path.join(targetDir, 'Pininspector.txt');
    const pininspectorLines = parsedKeywords.map((i) => i.keyword);
    fs.writeFileSync(pininspectorPath, pininspectorLines.join('\n') + '\n', 'utf-8');

    // 3. Read Seed Tags.txt from targetDir or kwPath fallback
    let seedTags = [];
    let seedTagsSource = null;
    const directSeedPath = path.join(targetDir, 'Seed Tags.txt');
    const rootSeedPath = path.join(kwPath, 'Seed Tags.txt');

    if (fs.existsSync(directSeedPath)) {
      seedTagsSource = directSeedPath;
    } else if (fs.existsSync(rootSeedPath)) {
      seedTagsSource = rootSeedPath;
    }

    if (seedTagsSource) {
      try {
        const seedContent = fs.readFileSync(seedTagsSource, 'utf-8');
        seedTags = seedContent
          .split(/\r?\n/)
          .map(cleanKeyword)
          .filter(Boolean);
      } catch (err) {
        console.error('Error reading Seed Tags:', err);
      }
    }

    // 4. Merge Seed Tags + Pininspector Tags (preserving seed priority, deduplicating)
    const mergedList = [];
    const mergedSet = new Set();
    let duplicatesRemoved = 0;

    // Include Pininspector keywords first (as in standard project files)
    for (const kw of pininspectorLines) {
      if (!mergedSet.has(kw)) {
        mergedSet.add(kw);
        mergedList.push(kw);
      } else {
        duplicatesRemoved++;
      }
    }

    // Append seeds that were not already in Pininspector
    let seedsAdded = 0;
    for (const seed of seedTags) {
      if (!mergedSet.has(seed)) {
        mergedSet.add(seed);
        mergedList.push(seed);
        seedsAdded++;
      } else {
        duplicatesRemoved++;
      }
    }

    const mergedSeedsPath = path.join(targetDir, 'Pininspector + Seeds.txt');
    fs.writeFileSync(mergedSeedsPath, mergedList.join('\n') + '\n', 'utf-8');

    // 5. Save [Collection] (All).csv if requested
    let allCsvSaved = false;
    let finalCsvName = null;
    let highVolCount = 0;
    let midVolCount = 0;
    let lowVolCount = 0;

    if (saveAsAllCsv) {
      // Determine file name: e.g. "Bundles Christmas (All).csv" or "(All).csv"
      const defaultName = `${collection} (All).csv`;
      finalCsvName = allCsvFileName && allCsvFileName.trim() ? allCsvFileName.trim() : defaultName;
      if (!finalCsvName.toLowerCase().endsWith('.csv')) {
        finalCsvName += '.csv';
      }

      const allCsvPath = path.join(targetDir, finalCsvName);

      // Build CSV lines with volumeSeparator (default ';')
      const csvLines = parsedKeywords.map((item) => {
        let vol = item.volume;
        if (vol === null || isNaN(vol)) {
          vol = parseInt(defaultVolume, 10) || 100;
        }

        if (vol >= 500) highVolCount++;
        else if (vol >= 100) midVolCount++;
        else lowVolCount++;

        return `${item.keyword}${volumeSeparator}${vol}`;
      });

      fs.writeFileSync(allCsvPath, csvLines.join('\n') + '\n', 'utf-8');
      allCsvSaved = true;
    }

    return NextResponse.json({
      success: true,
      message: `Файлы Pininspector.txt и Pininspector + Seeds.txt успешно созданы!${allCsvSaved ? ` Также сохранен ${finalCsvName}.` : ''}`,
      stats: {
        pininspectorCount: pininspectorLines.length,
        seedTagsCount: seedTags.length,
        seedsAddedCount: seedsAdded,
        duplicatesRemoved,
        mergedCount: mergedList.length,
        hasVolume,
        volumeCount,
        allCsvSaved,
        allCsvFileName: finalCsvName,
        allCsvCount: parsedKeywords.length,
        volumeDistribution: {
          high: highVolCount,
          medium: midVolCount,
          low: lowVolCount
        }
      },
      targetPath: path.relative(getProjectRoot(), targetDir)
    });
  } catch (error) {
    console.error('Error in Pininspector save API:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
