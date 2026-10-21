import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { findKeywordFolder } from '@/lib/paths';
import { getNicheDetail } from '@/lib/nicheScanner';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const collection = searchParams.get('collection');
    const segment = searchParams.get('segment') || searchParams.get('segmentName');

    if (!category || !collection) {
      return NextResponse.json({ success: false, error: 'Category and collection are required' }, { status: 400 });
    }

    const niche = getNicheDetail(category, collection, segment);

    if (!niche) {
      return NextResponse.json({ success: false, error: 'Collection not found in content directory' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      niche
    });
  } catch (error) {
    console.error('Error in niche detail API:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { category, collection, segment, segmentName, seedTagsContent } = body;
    const seg = segment || segmentName;

    if (!category || !collection || typeof seedTagsContent !== 'string') {
      return NextResponse.json({ success: false, error: 'Category, collection, and seedTagsContent are required' }, { status: 400 });
    }

    const kwPath = findKeywordFolder(category, collection);
    if (!kwPath || !fs.existsSync(kwPath)) {
      return NextResponse.json({ success: false, error: 'Keyword folder does not exist. Initialize niche first.' }, { status: 400 });
    }

    const targetDir = (seg && fs.existsSync(path.join(kwPath, seg)))
      ? path.join(kwPath, seg)
      : kwPath;

    // Target Seed Tags.txt path
    const seedFilePath = path.join(targetDir, 'Seed Tags.txt');
    fs.writeFileSync(seedFilePath, seedTagsContent, 'utf-8');

    const lineCount = seedTagsContent.split('\n').map(s => s.trim()).filter(Boolean).length;

    return NextResponse.json({
      success: true,
      message: 'Seed Tags.txt successfully saved',
      count: lineCount
    });
  } catch (error) {
    console.error('Error saving seed tags:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
