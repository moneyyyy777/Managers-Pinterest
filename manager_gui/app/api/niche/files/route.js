import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { findKeywordFolder, getProjectRoot } from '@/lib/paths';

/**
 * GET: Lists or reads .txt and .csv files in a niche / segment
 */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const collection = searchParams.get('collection');
    const segment = searchParams.get('segment') || searchParams.get('segmentName');
    const fileRelative = searchParams.get('file');

    if (!category || !collection) {
      return NextResponse.json(
        { success: false, error: 'Category and collection are required' },
        { status: 400 }
      );
    }

    const kwPath = findKeywordFolder(category, collection);
    if (!kwPath || !fs.existsSync(kwPath)) {
      return NextResponse.json(
        { success: false, error: 'Keyword directory not found for this niche' },
        { status: 404 }
      );
    }

    const targetDir =
      segment && fs.existsSync(path.join(kwPath, segment))
        ? path.join(kwPath, segment)
        : kwPath;

    // Mode 1: Read single file content
    if (fileRelative) {
      const safePath = path.resolve(targetDir, fileRelative);
      // Prevent directory traversal outside targetDir and kwPath
      if (!safePath.startsWith(kwPath)) {
        return NextResponse.json(
          { success: false, error: 'Access denied: Path outside niche directory' },
          { status: 403 }
        );
      }

      if (!fs.existsSync(safePath)) {
        return NextResponse.json(
          { success: false, error: 'File not found' },
          { status: 404 }
        );
      }

      const content = fs.readFileSync(safePath, 'utf-8');
      const lines = content.split(/\r?\n/).filter((l) => l.trim().length > 0);
      const stat = fs.statSync(safePath);

      return NextResponse.json({
        success: true,
        file: {
          name: path.basename(safePath),
          relativePath: path.relative(targetDir, safePath),
          size: stat.size,
          lineCount: lines.length,
          content,
          modifiedAt: stat.mtime
        }
      });
    }

    // Mode 2: List all .txt and .csv files in targetDir (including subdirectories like intent folders, For Main)
    const filesList = [];

    function scanDir(currentDir, depth = 0) {
      if (depth > 3) return;
      try {
        const entries = fs.readdirSync(currentDir, { withFileTypes: true });
        for (const entry of entries) {
          if (entry.name.startsWith('.')) continue;
          const fullPath = path.join(currentDir, entry.name);

          if (entry.isDirectory()) {
            scanDir(fullPath, depth + 1);
          } else {
            const lower = entry.name.toLowerCase();
            if (lower.endsWith('.txt') || lower.endsWith('.csv')) {
              try {
                const stat = fs.statSync(fullPath);
                const content = fs.readFileSync(fullPath, 'utf-8');
                const lines = content
                  .split(/\r?\n/)
                  .map((l) => l.trim())
                  .filter(Boolean);

                const relToTarget = path.relative(targetDir, fullPath);
                const isRootNicheFile = !relToTarget.includes(path.sep);

                // Determine file role/category for nice sorting and badges
                let role = 'other';
                if (lower.includes('seed tags')) role = 'seeds';
                else if (lower.includes('pininspector + seeds')) role = 'merged_seeds';
                else if (lower.includes('pininspector')) role = 'pininspector';
                else if (lower.includes('(all).csv') || lower.endsWith(' all.csv')) role = 'all_csv';
                else if (lower.includes('filter by openai')) role = 'filtered_csv';
                else if (lower.includes('boards_tags')) role = 'boards_tags';
                else if (lower.includes('boards_name')) role = 'boards_name';
                else if (lower.includes('intent') || lower.includes('itent')) role = 'intent';

                filesList.push({
                  name: entry.name,
                  relativePath: relToTarget,
                  fullPath: path.relative(getProjectRoot(), fullPath),
                  size: stat.size,
                  lineCount: lines.length,
                  type: lower.endsWith('.csv') ? 'csv' : 'txt',
                  role,
                  isRootNicheFile,
                  folderName: path.basename(path.dirname(fullPath)),
                  sampleLines: lines.slice(0, 5),
                  modifiedAt: stat.mtime
                });
              } catch (err) {
                console.error('Error reading file:', fullPath, err);
              }
            }
          }
        }
      } catch (err) {
        console.error('Error scanning dir:', currentDir, err);
      }
    }

    scanDir(targetDir);

    // Sort order: Core funnel files first, then alphabetically
    const rolePriority = {
      seeds: 1,
      pininspector: 2,
      merged_seeds: 3,
      all_csv: 4,
      filtered_csv: 5,
      boards_tags: 6,
      boards_name: 7,
      intent: 8,
      other: 9
    };

    filesList.sort((a, b) => {
      const pA = rolePriority[a.role] || 99;
      const pB = rolePriority[b.role] || 99;
      if (pA !== pB) return pA - pB;
      return a.relativePath.localeCompare(b.relativePath);
    });

    return NextResponse.json({
      success: true,
      targetDir: path.relative(getProjectRoot(), targetDir),
      files: filesList
    });
  } catch (error) {
    console.error('Error in niche files API GET:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

/**
 * POST: Saves/modifies content of a specific .txt or .csv file in the niche
 */
export async function POST(request) {
  try {
    const body = await request.json();
    const { category, collection, segment, segmentName, relativePath, content } = body;
    const seg = segment || segmentName;

    if (!category || !collection || !relativePath || typeof content !== 'string') {
      return NextResponse.json(
        {
          success: false,
          error: 'Category, collection, relativePath and content are required'
        },
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

    const safeFilePath = path.resolve(targetDir, relativePath);
    if (!safeFilePath.startsWith(kwPath)) {
      return NextResponse.json(
        { success: false, error: 'Access denied: Path outside niche directory' },
        { status: 403 }
      );
    }

    // Ensure parent directory exists
    const parentDir = path.dirname(safeFilePath);
    if (!fs.existsSync(parentDir)) {
      fs.mkdirSync(parentDir, { recursive: true });
    }

    // Write file content (UTF-8)
    fs.writeFileSync(safeFilePath, content, 'utf-8');

    const lines = content.split(/\r?\n/).filter((l) => l.trim().length > 0);
    const stat = fs.statSync(safeFilePath);

    return NextResponse.json({
      success: true,
      message: `Файл ${path.basename(safeFilePath)} успешно сохранен`,
      file: {
        name: path.basename(safeFilePath),
        relativePath,
        lineCount: lines.length,
        size: stat.size,
        modifiedAt: stat.mtime
      }
    });
  } catch (error) {
    console.error('Error in niche files API POST:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
