import fs from 'fs';
import path from 'path';
import { getContentDir, getKeywordsDir, findKeywordFolder, getProjectRoot } from './paths.js';

const EXCLUDED_DIRS = new Set([
  'all folders',
  '!all folders',
  '!generators',
  '.git',
  'node_modules',
  'scripts',
  '.vscode',
  'for main'
]);

/**
 * Finds the corresponding collection directory in Websites/CloudFlare/artify-studio/content
 */
export function findContentFolder(category, collection) {
  const contentDir = getContentDir();
  if (!fs.existsSync(contentDir)) return null;

  const exact = path.join(contentDir, category, collection);
  if (fs.existsSync(exact)) return exact;

  const catDirs = fs.readdirSync(contentDir).filter(d => !d.startsWith('.') && fs.statSync(path.join(contentDir, d)).isDirectory());
  const normCat = (category || '').toLowerCase().replace(/[^a-z0-9]/g, '');
  const matchedCat = catDirs.find(d => d.toLowerCase().replace(/[^a-z0-9]/g, '') === normCat);
  if (!matchedCat) return null;

  const catPath = path.join(contentDir, matchedCat);
  const collDirs = fs.readdirSync(catPath).filter(d => !d.startsWith('.') && fs.statSync(path.join(catPath, d)).isDirectory());
  const normColl = (collection || '').toLowerCase().replace(/[^a-z0-9]/g, '');

  let matchedColl = collDirs.find(d => d.toLowerCase().replace(/[^a-z0-9]/g, '') === normColl);
  if (!matchedColl) {
    const tokensA = (collection || '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim().split(/\s+/).filter(Boolean);
    let bestScore = 0;
    let bestDir = null;
    for (const d of collDirs) {
      const tokensB = d.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim().split(/\s+/).filter(Boolean);
      const common = tokensA.filter(w => tokensB.includes(w));
      const score = common.length / Math.max(tokensA.length, tokensB.length);
      if (score > bestScore && score >= 0.5) {
        bestScore = score;
        bestDir = d;
      }
    }
    if (bestDir) matchedColl = bestDir;
  }

  return matchedColl ? path.join(catPath, matchedColl) : null;
}

/**
 * Detects whether a keyword directory contains sub-segments.
 * A subdirectory is a Segment if it is not an excluded folder or numbered intent folder,
 * and contains numbered folders (/^\d+\s+/) OR has its own Seed Tags.txt or *.csv files.
 */
export function detectSegments(kwPath) {
  if (!kwPath || !fs.existsSync(kwPath)) return [];
  try {
    const entries = fs.readdirSync(kwPath, { withFileTypes: true });
    const segments = [];
    for (const entry of entries) {
      if (!entry.isDirectory()) continue;
      if (entry.name.startsWith('.')) continue;
      if (/^\d+\s+/.test(entry.name)) continue;
      if (EXCLUDED_DIRS.has(entry.name.toLowerCase())) continue;

      const subPath = path.join(kwPath, entry.name);
      try {
        const subEntries = fs.readdirSync(subPath, { withFileTypes: true });
        const isSegment = subEntries.some(e => {
          if (e.isDirectory()) {
            return /^\d+\s+/.test(e.name);
          } else {
            const lower = e.name.toLowerCase();
            return (lower.includes('seed tags') && lower.endsWith('.txt')) || lower.endsWith('.csv');
          }
        });
        if (isSegment) {
          segments.push({
            name: entry.name,
            fullPath: subPath
          });
        }
      } catch (err) {}
    }
    return segments;
  } catch (err) {
    return [];
  }
}

/**
 * Computes 10-step Pinterest funnel statuses, current step, and completed count.
 */
export function computeStepStatuses(filesInfo, isInitialized) {
  // Step 1: Foundation (content exists, initialized in Keywords, has linksite.txt or all_products)
  const step1 = Boolean(isInitialized && (filesInfo.hasLinksite || filesInfo.hasAllProducts));
  // Step 2: Seed Tags (Seed Tags.txt non-empty)
  const step2 = Boolean(filesInfo.hasSeedTags && filesInfo.seedTagsCount > 0);
  // Step 3: Parsing & Volume (Pininspector + All.csv)
  const step3 = Boolean(filesInfo.hasPininspector && filesInfo.hasAllCsv);
  // Step 4: AI Filtering (Filter by OpenAI.csv non-empty)
  const step4 = Boolean(filesInfo.hasFilterOpenAi && filesInfo.filterOpenAiCount > 0);
  // Step 5: Intents (Intent files or numbered folders)
  const step5 = Boolean(
    (filesInfo.intentFiles?.length || filesInfo.intentFilesCount || 0) > 0 ||
    (filesInfo.numberedFolders?.length || filesInfo.numberedFoldersCount || 0) > 0
  );
  // Step 6: Content Generation (Excel files present)
  const step6 = Boolean((filesInfo.excelFiles?.length || filesInfo.excelFilesCount || 0) > 0);
  // Step 7: QA Audit (For Main + Boards_Name + Boards_Tags)
  const step7 = Boolean(filesInfo.hasForMain && filesInfo.hasBoardsName && filesInfo.hasBoardsTags);
  // Step 8: Generators (Name_Accounts.txt & Description_Generator.txt)
  const step8 = Boolean(filesInfo.hasGenerators);
  // Step 9: Template Assembler (Template assembled in All Folders or ready for Make)
  const step9 = Boolean(filesInfo.hasTemplateFolder || (step7 && step8));
  // Step 10: Ready for Make & Deployment
  const step10 = Boolean(step9 && (filesInfo.excelFiles?.length || filesInfo.excelFilesCount || 0) >= 4);

  const stepStatuses = [step1, step2, step3, step4, step5, step6, step7, step8, step9, step10];

  let currentStep = 1;
  for (let i = 0; i < stepStatuses.length; i++) {
    if (!stepStatuses[i]) {
      currentStep = i + 1;
      break;
    }
    if (i === stepStatuses.length - 1) {
      currentStep = 10;
    }
  }

  const completedCount = stepStatuses.filter(Boolean).length;
  return { stepStatuses, currentStep, completedCount };
}

/**
 * Scans a keyword directory (including its subdirectories) for relevant Pinterest funnel files
 */
export function scanKeywordFiles(dirPath) {
  if (!dirPath || !fs.existsSync(dirPath)) {
    return {
      hasLinksite: false,
      hasAllProducts: false,
      hasSeedTags: false,
      seedTagsCount: 0,
      hasPininspector: false,
      hasPininspectorSeeds: false,
      hasAllCsv: false,
      hasFilterOpenAi: false,
      filterOpenAiCount: 0,
      intentFiles: [],
      numberedFolders: [],
      excelFiles: [],
      hasForMain: false,
      hasBoardsName: false,
      hasBoardsTags: false,
      hasGenerators: false,
      hasTemplateFolder: false
    };
  }

  const result = {
    hasLinksite: false,
    hasAllProducts: false,
    hasSeedTags: false,
    seedTagsCount: 0,
    hasPininspector: false,
    hasPininspectorSeeds: false,
    hasAllCsv: false,
    hasFilterOpenAi: false,
    filterOpenAiCount: 0,
    intentFiles: [],
    numberedFolders: [],
    excelFiles: [],
    hasForMain: false,
    hasBoardsName: false,
    hasBoardsTags: false,
    hasGenerators: false,
    hasTemplateFolder: false
  };

  function walk(currentDir, depth = 0) {
    if (depth > 4) return;
    try {
      const entries = fs.readdirSync(currentDir, { withFileTypes: true });

      for (const entry of entries) {
        if (entry.name.startsWith('.')) continue;
        const fullPath = path.join(currentDir, entry.name);
        const lowerName = entry.name.toLowerCase();

        if (entry.isDirectory()) {
          // Check for numbered folders like "1 Bundles...", "2 ..."
          if (/^\d+\s+/.test(entry.name)) {
            result.numberedFolders.push(entry.name);
          }
          if (entry.name === 'For Main') {
            result.hasForMain = true;
          }
          if (entry.name === 'Template') {
            result.hasTemplateFolder = true;
          }
          walk(fullPath, depth + 1);
        } else {
          // Check files
          if (lowerName === 'linksite.txt' || lowerName === 'link_site.txt') {
            result.hasLinksite = true;
          }
          if (lowerName === 'all_products.json') {
            result.hasAllProducts = true;
          }
          if (lowerName.includes('seed tags') && lowerName.endsWith('.txt')) {
            result.hasSeedTags = true;
            try {
              const lines = fs.readFileSync(fullPath, 'utf-8').split('\n').filter(l => l.trim().length > 0);
              result.seedTagsCount = Math.max(result.seedTagsCount, lines.length);
            } catch (e) {}
          }
          if (lowerName.includes('pininspector') && lowerName.endsWith('.txt')) {
            result.hasPininspector = true;
            if (lowerName.includes('seed')) {
              result.hasPininspectorSeeds = true;
            }
          }
          if (lowerName.includes('(all).csv') || lowerName.endsWith(' all.csv')) {
            result.hasAllCsv = true;
          }
          if (lowerName.includes('filter by openai') && lowerName.endsWith('.csv')) {
            result.hasFilterOpenAi = true;
            try {
              const lines = fs.readFileSync(fullPath, 'utf-8').split('\n').filter(l => l.trim().length > 0);
              result.filterOpenAiCount = Math.max(result.filterOpenAiCount, lines.length);
            } catch (e) {}
          }
          if (lowerName.includes('itent') || lowerName.includes('intent')) {
            result.intentFiles.push(entry.name);
          }
          if (lowerName.endsWith('.xlsx') && !lowerName.startsWith('~$')) {
            result.excelFiles.push(entry.name);
          }
          if (lowerName === 'boards_name.txt') {
            result.hasBoardsName = true;
          }
          if (lowerName === 'boards_tags.txt') {
            result.hasBoardsTags = true;
          }
          if (lowerName === 'name_accounts.txt' || lowerName === 'description_generator.txt') {
            result.hasGenerators = true;
          }
        }
      }
    } catch (e) {
      console.error('Error scanning dir:', currentDir, e);
    }
  }

  walk(dirPath);
  return result;
}

/**
 * Scans all collections in content/ and matches with Keywords/Artify Studio
 */
export function getAllNiches() {
  const contentDir = getContentDir();
  const rootDir = getProjectRoot();

  if (!fs.existsSync(contentDir)) {
    return [];
  }

  const niches = [];
  const categories = fs.readdirSync(contentDir).filter(f => !f.startsWith('.') && fs.statSync(path.join(contentDir, f)).isDirectory());

  for (const cat of categories) {
    const catPath = path.join(contentDir, cat);
    const collections = fs.readdirSync(catPath).filter(f => !f.startsWith('.') && fs.statSync(path.join(catPath, f)).isDirectory());

    for (const coll of collections) {
      const collPath = path.join(catPath, coll);
      let info = { title: coll, description: '', image: '', count: 0 };
      let productCount = 0;

      // Read info.json
      const infoPath = path.join(collPath, 'info.json');
      if (fs.existsSync(infoPath)) {
        try {
          info = JSON.parse(fs.readFileSync(infoPath, 'utf-8'));
        } catch (e) {}
      }

      // Read all_products.json
      const productsPath = path.join(collPath, 'all_products.json');
      if (fs.existsSync(productsPath)) {
        try {
          const prods = JSON.parse(fs.readFileSync(productsPath, 'utf-8'));
          productCount = Array.isArray(prods) ? prods.length : (info.count || 0);
        } catch (e) {
          productCount = info.count || 0;
        }
      } else {
        productCount = info.count || 0;
      }

      // Look up corresponding folder in Keywords/Artify Studio/
      const kwPath = findKeywordFolder(cat, coll);
      const isInitialized = kwPath !== null && fs.existsSync(kwPath);
      const filesInfo = scanKeywordFiles(kwPath);

      // Detect segments in keyword directory
      const detectedSegments = isInitialized ? detectSegments(kwPath) : [];
      const isMultiSegment = detectedSegments.length > 0;
      const architecture = isMultiSegment ? 'multi_segment' : 'single_core';

      const segments = [];
      if (isMultiSegment) {
        for (const seg of detectedSegments) {
          const segFiles = scanKeywordFiles(seg.fullPath);
          if (filesInfo.hasLinksite) segFiles.hasLinksite = true;
          if (filesInfo.hasAllProducts) segFiles.hasAllProducts = true;

          const segSteps = computeStepStatuses(segFiles, isInitialized);
          segments.push({
            name: seg.name,
            path: path.relative(rootDir, seg.fullPath),
            stepStatuses: segSteps.stepStatuses,
            currentStep: segSteps.currentStep,
            completedCount: segSteps.completedCount,
            filesInfo: {
              hasLinksite: segFiles.hasLinksite,
              hasSeedTags: segFiles.hasSeedTags,
              seedTagsCount: segFiles.seedTagsCount,
              hasPininspector: segFiles.hasPininspector,
              hasPininspectorSeeds: segFiles.hasPininspectorSeeds,
              hasAllCsv: segFiles.hasAllCsv,
              hasFilterOpenAi: segFiles.hasFilterOpenAi,
              filterOpenAiCount: segFiles.filterOpenAiCount,
              intentFilesCount: segFiles.intentFiles.length,
              numberedFoldersCount: segFiles.numberedFolders.length,
              excelFilesCount: segFiles.excelFiles.length,
              hasForMain: segFiles.hasForMain,
              hasBoardsName: segFiles.hasBoardsName,
              hasBoardsTags: segFiles.hasBoardsTags,
              hasGenerators: segFiles.hasGenerators
            }
          });
        }
      }

      const { stepStatuses, currentStep, completedCount } = computeStepStatuses(filesInfo, isInitialized);

      niches.push({
        id: `${cat}/${coll}`,
        category: cat,
        collection: coll,
        title: info.title || coll,
        description: info.description || '',
        coverImage: info.image || '',
        productCount: productCount,
        siteUrl: `https://artify-studio.pages.dev/${cat}/${coll}`,
        isInitialized,
        architecture,
        segmentsCount: segments.length,
        segments,
        keywordPath: kwPath ? path.relative(rootDir, kwPath) : null,
        stepStatuses,
        currentStep,
        completedCount,
        filesInfo: {
          hasLinksite: filesInfo.hasLinksite,
          hasSeedTags: filesInfo.hasSeedTags,
          seedTagsCount: filesInfo.seedTagsCount,
          hasPininspector: filesInfo.hasPininspector,
          hasPininspectorSeeds: filesInfo.hasPininspectorSeeds,
          hasAllCsv: filesInfo.hasAllCsv,
          hasFilterOpenAi: filesInfo.hasFilterOpenAi,
          filterOpenAiCount: filesInfo.filterOpenAiCount,
          intentFilesCount: filesInfo.intentFiles.length,
          numberedFoldersCount: filesInfo.numberedFolders.length,
          excelFilesCount: filesInfo.excelFiles.length,
          hasForMain: filesInfo.hasForMain,
          hasBoardsName: filesInfo.hasBoardsName,
          hasBoardsTags: filesInfo.hasBoardsTags,
          hasGenerators: filesInfo.hasGenerators
        }
      });
    }
  }

  // Sort by category, then collection name
  return niches.sort((a, b) => a.category.localeCompare(b.category) || a.collection.localeCompare(b.collection));
}

/**
 * Retrieves full detail for a single niche, optionally scoped to a specific segment.
 */
export function getNicheDetail(category, collection, segmentName = null) {
  const root = getProjectRoot();
  const collContentPath = findContentFolder(category, collection);

  if (!collContentPath || !fs.existsSync(collContentPath)) {
    return null;
  }

  // 1. Read Content data
  let info = { title: collection, description: '', image: '', count: 0 };
  const infoPath = path.join(collContentPath, 'info.json');
  if (fs.existsSync(infoPath)) {
    try {
      info = JSON.parse(fs.readFileSync(infoPath, 'utf-8'));
    } catch (e) {}
  }

  let products = [];
  const prodsPath = path.join(collContentPath, 'all_products.json');
  if (fs.existsSync(prodsPath)) {
    try {
      products = JSON.parse(fs.readFileSync(prodsPath, 'utf-8'));
    } catch (e) {}
  }

  let linksText = '';
  const linksPath = path.join(collContentPath, 'links.txt');
  if (fs.existsSync(linksPath)) {
    try {
      linksText = fs.readFileSync(linksPath, 'utf-8');
    } catch (e) {}
  }

  // 2. Read Keywords folder
  const kwPath = findKeywordFolder(category, collection);
  const isInitialized = kwPath !== null && fs.existsSync(kwPath);

  const detectedSegments = isInitialized ? detectSegments(kwPath) : [];
  const isMultiSegment = detectedSegments.length > 0;
  const architecture = isMultiSegment ? 'multi_segment' : 'single_core';

  // Build segments breakdown
  const rootFilesInfo = isInitialized ? scanKeywordFiles(kwPath) : scanKeywordFiles(null);
  const segments = [];
  if (isMultiSegment) {
    for (const seg of detectedSegments) {
      const segFiles = scanKeywordFiles(seg.fullPath);
      if (rootFilesInfo.hasLinksite) segFiles.hasLinksite = true;
      if (rootFilesInfo.hasAllProducts) segFiles.hasAllProducts = true;
      const segSteps = computeStepStatuses(segFiles, isInitialized);
      segments.push({
        name: seg.name,
        path: path.relative(root, seg.fullPath),
        stepStatuses: segSteps.stepStatuses,
        currentStep: segSteps.currentStep,
        completedCount: segSteps.completedCount,
        filesInfo: {
          hasLinksite: segFiles.hasLinksite,
          hasSeedTags: segFiles.hasSeedTags,
          seedTagsCount: segFiles.seedTagsCount,
          hasPininspector: segFiles.hasPininspector,
          hasAllCsv: segFiles.hasAllCsv,
          hasFilterOpenAi: segFiles.hasFilterOpenAi,
          filterOpenAiCount: segFiles.filterOpenAiCount,
          intentFilesCount: segFiles.intentFiles.length,
          numberedFoldersCount: segFiles.numberedFolders.length,
          excelFilesCount: segFiles.excelFiles.length,
          hasForMain: segFiles.hasForMain,
          hasBoardsName: segFiles.hasBoardsName,
          hasBoardsTags: segFiles.hasBoardsTags,
          hasGenerators: segFiles.hasGenerators
        }
      });
    }
  }

  // Determine target keyword path for scoped file queries
  let targetKwPath = kwPath;
  let activeSegmentName = null;
  if (segmentName && isInitialized) {
    const foundSeg = detectedSegments.find(s => s.name.toLowerCase() === segmentName.toLowerCase().trim());
    if (foundSeg) {
      targetKwPath = foundSeg.fullPath;
      activeSegmentName = foundSeg.name;
    } else if (fs.existsSync(path.join(kwPath, segmentName))) {
      targetKwPath = path.join(kwPath, segmentName);
      activeSegmentName = segmentName;
    }
  }

  let seedTagsContent = '';
  let seedTagsPath = null;
  let filterTags = [];
  let linksiteContent = '';
  const intentFolders = [];
  const excelFiles = [];

  if (isInitialized && targetKwPath && fs.existsSync(targetKwPath)) {
    function searchFiles(dir, depth = 0) {
      if (depth > 3) return;
      try {
        const entries = fs.readdirSync(dir, { withFileTypes: true });
        for (const e of entries) {
          const full = path.join(dir, e.name);
          if (e.isDirectory() && !e.name.startsWith('.')) {
            if (/^\d+\s+/.test(e.name)) {
              const intentObj = { name: e.name, path: path.relative(root, full), tagsCount: 0, hasExcel: false, excelName: null };
              const subFiles = fs.readdirSync(full);
              const excel = subFiles.find(f => f.endsWith('.xlsx') && !f.startsWith('~$'));
              if (excel) {
                intentObj.hasExcel = true;
                intentObj.excelName = excel;
                excelFiles.push({ name: excel, folder: e.name, fullPath: path.relative(root, path.join(full, excel)) });
              }
              const forMainTags = path.join(full, 'For Main', 'Boards_Tags.txt');
              if (fs.existsSync(forMainTags)) {
                try {
                  const tagLines = fs.readFileSync(forMainTags, 'utf-8').split('\n').filter(Boolean);
                  intentObj.tagsCount = tagLines.length;
                  intentObj.sampleTags = tagLines.slice(0, 5);
                  intentObj.tags = tagLines.map(s => s.trim()).filter(Boolean);
                } catch (err) {}
              }
              intentFolders.push(intentObj);
            }
            searchFiles(full, depth + 1);
          } else {
            const lower = e.name.toLowerCase();
            if (lower.includes('seed tags') && lower.endsWith('.txt') && !seedTagsPath) {
              seedTagsPath = full;
              try {
                seedTagsContent = fs.readFileSync(full, 'utf-8');
              } catch (err) {}
            }
            if (lower === 'linksite.txt' || lower === 'link_site.txt') {
              try {
                linksiteContent = fs.readFileSync(full, 'utf-8').trim();
              } catch (err) {}
            }
            if (lower.includes('filter by openai') && lower.endsWith('.csv') && filterTags.length === 0) {
              try {
                const csvData = fs.readFileSync(full, 'utf-8');
                const lines = csvData.split('\n').map(l => l.trim()).filter(Boolean);
                const dataLines = lines.length > 0 && lines[0].toLowerCase().includes('keyword') ? lines.slice(1) : lines;
                filterTags = dataLines.map((line, idx) => {
                  const parts = line.split(',');
                  const kw = parts[0].replace(/"/g, '').trim();
                  const vol = parts.length > 1 ? parts[1].replace(/"/g, '').trim() : '';
                  const hasOldYear = /\b(202[1-5])\b/.test(kw);
                  return { id: idx, keyword: kw, volume: vol, hasOldYear };
                });
              } catch (err) {}
            }
          }
        }
      } catch (e) {}
    }

    searchFiles(targetKwPath);

    // Fallbacks to root kwPath for foundation files if not found in segment
    if (!linksiteContent && kwPath && fs.existsSync(kwPath)) {
      const rootLink = path.join(kwPath, 'linksite.txt');
      const rootLinkAlt = path.join(kwPath, 'link_site.txt');
      if (fs.existsSync(rootLink)) {
        try { linksiteContent = fs.readFileSync(rootLink, 'utf-8').trim(); } catch (e) {}
      } else if (fs.existsSync(rootLinkAlt)) {
        try { linksiteContent = fs.readFileSync(rootLinkAlt, 'utf-8').trim(); } catch (e) {}
      }
    }

    if (!seedTagsContent && kwPath && fs.existsSync(kwPath) && targetKwPath !== kwPath) {
      const rootSeed = path.join(kwPath, 'Seed Tags.txt');
      if (fs.existsSync(rootSeed)) {
        seedTagsPath = rootSeed;
        try { seedTagsContent = fs.readFileSync(rootSeed, 'utf-8'); } catch (e) {}
      }
    }
  }

  // Scoped filesInfo & steps
  const scopedFiles = scanKeywordFiles(targetKwPath);
  if (rootFilesInfo.hasLinksite || Boolean(linksiteContent)) scopedFiles.hasLinksite = true;
  if (rootFilesInfo.hasAllProducts || products.length > 0) scopedFiles.hasAllProducts = true;
  const scopedSteps = computeStepStatuses(scopedFiles, isInitialized);

  return {
    category,
    collection,
    segmentName: activeSegmentName || segmentName || null,
    title: info.title || collection,
    description: info.description || '',
    coverImage: info.image || '',
    totalProducts: products.length || info.count || 0,
    sampleProducts: products.slice(0, 8),
    siteUrl: `https://artify-studio.pages.dev/${category}/${collection}`,
    isInitialized,
    architecture,
    segmentsCount: segments.length,
    segments,
    keywordPath: targetKwPath ? path.relative(root, targetKwPath) : null,
    rootKeywordPath: kwPath ? path.relative(root, kwPath) : null,
    linksiteContent,
    stepStatuses: scopedSteps.stepStatuses,
    currentStep: scopedSteps.currentStep,
    completedCount: scopedSteps.completedCount,
    filesInfo: {
      hasLinksite: scopedFiles.hasLinksite,
      hasSeedTags: scopedFiles.hasSeedTags,
      seedTagsCount: scopedFiles.seedTagsCount,
      hasPininspector: scopedFiles.hasPininspector,
      hasPininspectorSeeds: scopedFiles.hasPininspectorSeeds,
      hasAllCsv: scopedFiles.hasAllCsv,
      hasFilterOpenAi: scopedFiles.hasFilterOpenAi,
      filterOpenAiCount: scopedFiles.filterOpenAiCount,
      intentFilesCount: scopedFiles.intentFiles.length,
      numberedFoldersCount: scopedFiles.numberedFolders.length,
      excelFilesCount: scopedFiles.excelFiles.length,
      hasForMain: scopedFiles.hasForMain,
      hasBoardsName: scopedFiles.hasBoardsName,
      hasBoardsTags: scopedFiles.hasBoardsTags,
      hasGenerators: scopedFiles.hasGenerators
    },
    seedTags: {
      path: seedTagsPath ? path.relative(root, seedTagsPath) : null,
      content: seedTagsContent,
      count: seedTagsContent.split('\n').map(s => s.trim()).filter(Boolean).length
    },
    filterTags: {
      count: filterTags.length,
      items: filterTags.slice(0, 200),
      oldYearsCount: filterTags.filter(t => t.hasOldYear).length
    },
    intentFolders,
    excelFiles
  };
}
