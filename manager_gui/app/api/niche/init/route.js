import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { getContentDir, getKeywordsDir, findKeywordFolder, getProjectRoot } from '@/lib/paths';

export async function POST(request) {
  try {
    const body = await request.json();
    const {
      category,
      collection,
      architecture = 'single_core',
      createMainFolder = true,
      segments = []
    } = body;

    if (!category || !collection) {
      return NextResponse.json({ success: false, error: 'Category and collection are required' }, { status: 400 });
    }

    const root = getProjectRoot();
    const contentDir = getContentDir();
    const keywordsDir = getKeywordsDir();

    const collContentPath = path.join(contentDir, category, collection);
    if (!fs.existsSync(collContentPath)) {
      return NextResponse.json({ success: false, error: 'Collection does not exist in content directory' }, { status: 404 });
    }

    // Check if folder already exists
    let targetDir = findKeywordFolder(category, collection);

    // Title Case helpers
    const catFolder = category.charAt(0).toUpperCase() + category.slice(1);
    const collFolderName = collection
      .split('-')
      .map(w => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ');

    if (!targetDir) {
      // Find category folder in Keywords or create it
      const catDirs = fs.existsSync(keywordsDir) ? fs.readdirSync(keywordsDir) : [];
      let matchedCat = catDirs.find(d => d.toLowerCase() === category.toLowerCase());

      if (!matchedCat) {
        matchedCat = catFolder;
        fs.mkdirSync(path.join(keywordsDir, matchedCat), { recursive: true });
      }

      targetDir = path.join(keywordsDir, matchedCat, collFolderName);
      fs.mkdirSync(targetDir, { recursive: true });
    }

    // 1. Copy canonical all_products.json to root
    const srcProducts = path.join(collContentPath, 'all_products.json');
    const destProducts = path.join(targetDir, 'all_products.json');
    if (fs.existsSync(srcProducts)) {
      fs.copyFileSync(srcProducts, destProducts);
    }

    // 2. Create linksite.txt in root
    const linksiteUrl = `https://artify-studio.pages.dev/${category}/${collection}`;
    fs.writeFileSync(path.join(targetDir, 'linksite.txt'), linksiteUrl, 'utf-8');

    const createdFolders = [];

    // 3. Multi-Segment or Single-Core logic
    if (architecture === 'multi_segment' || (Array.isArray(segments) && segments.length > 0)) {
      // Option A: Main common core folder (e.g. "Bundles Christmas")
      if (createMainFolder) {
        const mainFolderName = `${collFolderName} ${catFolder}`.trim();
        const mainFolderPath = path.join(targetDir, mainFolderName);
        if (!fs.existsSync(mainFolderPath)) {
          fs.mkdirSync(mainFolderPath, { recursive: true });
        }
        const sFile = path.join(mainFolderPath, 'Seed Tags.txt');
        if (!fs.existsSync(sFile)) fs.writeFileSync(sFile, '', 'utf-8');
        const pFile = path.join(mainFolderPath, 'Pininspector.txt');
        if (!fs.existsSync(pFile)) fs.writeFileSync(pFile, '', 'utf-8');
        createdFolders.push(mainFolderName);
      }

      // Option B: Segment subfolders (e.g. "Bundles Christmas Fonts", "Bundles Christmas Invitations")
      if (Array.isArray(segments)) {
        for (const seg of segments) {
          const rawName = typeof seg === 'string' ? seg : (seg.name || '');
          let customFolderName = typeof seg === 'object' && seg.folderName ? seg.folderName.trim() : '';

          if (!customFolderName && rawName) {
            // Auto format: "[Collection] [Category] [Segment]"
            customFolderName = `${collFolderName} ${catFolder} ${rawName.trim()}`.trim();
          }

          if (customFolderName) {
            const segPath = path.join(targetDir, customFolderName);
            if (!fs.existsSync(segPath)) {
              fs.mkdirSync(segPath, { recursive: true });
            }
            const sFile = path.join(segPath, 'Seed Tags.txt');
            if (!fs.existsSync(sFile)) fs.writeFileSync(sFile, '', 'utf-8');
            const pFile = path.join(segPath, 'Pininspector.txt');
            if (!fs.existsSync(pFile)) fs.writeFileSync(pFile, '', 'utf-8');
            createdFolders.push(customFolderName);
          }
        }
      }
    } else {
      // Single-Core: standard Seed Tags.txt and Pininspector.txt directly in targetDir
      const seedFile = path.join(targetDir, 'Seed Tags.txt');
      if (!fs.existsSync(seedFile)) {
        fs.writeFileSync(seedFile, '', 'utf-8');
      }

      const pinFile = path.join(targetDir, 'Pininspector.txt');
      if (!fs.existsSync(pinFile)) {
        fs.writeFileSync(pinFile, '', 'utf-8');
      }
      createdFolders.push(path.basename(targetDir));
    }

    return NextResponse.json({
      success: true,
      message: architecture === 'multi_segment'
        ? `Мульти-сегмент ниши успешно развернут (${createdFolders.length} папок)!`
        : 'Ниша успешно развернута в Keywords (Моно-ядро)!',
      targetPath: path.relative(root, targetDir),
      architecture,
      createdFolders,
      linksiteUrl
    });
  } catch (error) {
    console.error('Error initializing niche:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
