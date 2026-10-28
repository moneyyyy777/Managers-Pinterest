import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { findKeywordFolder, getProjectRoot } from '@/lib/paths';

function cleanKeyword(kw) {
  if (!kw) return '';
  return kw
    .replace(/^["'`\s]+|["'`\s]+$/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

/**
 * POST /api/niche/tags/pininspector/merge
 * Reads existing Pininspector.txt and Seed Tags.txt on disk, merges them without duplicates,
 * and writes Pininspector + Seeds.txt immediately.
 */
export async function POST(request) {
  try {
    const body = await request.json();
    const { category, collection, segment, segmentName } = body;
    const seg = segment || segmentName;

    if (!category || !collection) {
      return NextResponse.json(
        { success: false, error: 'Category and collection are required' },
        { status: 400 }
      );
    }

    const kwPath = findKeywordFolder(category, collection);
    if (!kwPath || !fs.existsSync(kwPath)) {
      return NextResponse.json(
        { success: false, error: 'Keyword folder does not exist' },
        { status: 400 }
      );
    }

    const targetDir =
      seg && fs.existsSync(path.join(kwPath, seg))
        ? path.join(kwPath, seg)
        : kwPath;

    // 1. Read Pininspector.txt
    const pininspectorPath = path.join(targetDir, 'Pininspector.txt');
    if (!fs.existsSync(pininspectorPath)) {
      return NextResponse.json(
        { success: false, error: 'Файл Pininspector.txt не найден в этой папке. Вставьте теги сначала.' },
        { status: 404 }
      );
    }

    const pininspectorContent = fs.readFileSync(pininspectorPath, 'utf-8');
    const pinKeywords = pininspectorContent
      .split(/\r?\n/)
      .map(cleanKeyword)
      .filter(Boolean);

    // 2. Read Seed Tags.txt
    let seedKeywords = [];
    const directSeedPath = path.join(targetDir, 'Seed Tags.txt');
    const rootSeedPath = path.join(kwPath, 'Seed Tags.txt');
    const seedPathToUse = fs.existsSync(directSeedPath)
      ? directSeedPath
      : (fs.existsSync(rootSeedPath) ? rootSeedPath : null);

    if (seedPathToUse) {
      const seedContent = fs.readFileSync(seedPathToUse, 'utf-8');
      seedKeywords = seedContent
        .split(/\r?\n/)
        .map(cleanKeyword)
        .filter(Boolean);
    }

    // 3. Merge Pininspector + Seeds (Pininspector first, Seeds appended, deduped)
    const mergedList = [];
    const mergedSet = new Set();
    let duplicatesRemoved = 0;

    for (const kw of pinKeywords) {
      if (!mergedSet.has(kw)) {
        mergedSet.add(kw);
        mergedList.push(kw);
      } else {
        duplicatesRemoved++;
      }
    }

    let seedsAdded = 0;
    for (const seed of seedKeywords) {
      if (!mergedSet.has(seed)) {
        mergedSet.add(seed);
        mergedList.push(seed);
        seedsAdded++;
      } else {
        duplicatesRemoved++;
      }
    }

    // 4. Save Pininspector + Seeds.txt
    const outputPath = path.join(targetDir, 'Pininspector + Seeds.txt');
    fs.writeFileSync(outputPath, mergedList.join('\n') + '\n', 'utf-8');

    return NextResponse.json({
      success: true,
      message: `Файл Pininspector + Seeds.txt успешно создан! Объединено ${mergedList.length} тегов.`,
      stats: {
        pininspectorCount: pinKeywords.length,
        seedTagsCount: seedKeywords.length,
        seedsAddedCount: seedsAdded,
        duplicatesRemoved,
        mergedCount: mergedList.length,
        targetPath: path.relative(getProjectRoot(), outputPath)
      }
    });
  } catch (error) {
    console.error('Error merging Pininspector + Seeds:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
