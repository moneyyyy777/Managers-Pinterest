import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { getProjectRoot, findKeywordFolder } from '@/lib/paths';

function safeRead(filePath) {
  try {
    if (fs.existsSync(filePath)) {
      return fs.readFileSync(filePath, 'utf-8').trim();
    }
  } catch {
    // Ignore error
  }
  return '';
}

function findTemplatesInDir(dir, depth = 0, maxDepth = 4) {
  const templates = [];
  if (depth > maxDepth || !fs.existsSync(dir)) {
    return templates;
  }

  try {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const ent of entries) {
      if (!ent.isDirectory() || ent.name.startsWith('.') || ent.name === 'node_modules' || ent.name === '.next') {
        continue;
      }

      const fullPath = path.join(dir, ent.name);
      if (ent.name === 'Template') {
        templates.push(fullPath);
      } else {
        templates.push(...findTemplatesInDir(fullPath, depth + 1, maxDepth));
      }
    }
  } catch (err) {
    console.error(`Error reading directory ${dir}:`, err);
  }

  return templates;
}

function getDonorDetails(templatePath) {
  const root = getProjectRoot();
  const relPath = path.relative(root, templatePath);
  const isArtify = relPath.includes('Artify Studio');

  const xlsxPath = path.join(templatePath, 'Template.xlsx');
  const hasExcel = fs.existsSync(xlsxPath);
  let excelSize = 0;
  if (hasExcel) {
    try {
      excelSize = fs.statSync(xlsxPath).size;
    } catch {
      // ignore
    }
  }

  const forMain = path.join(templatePath, 'For Main');
  const hasForMain = fs.existsSync(forMain);

  let sphere = '';
  let nameAccounts = '';
  let descriptionGenerator = '';
  let linkSite = '';

  if (hasForMain) {
    sphere = safeRead(path.join(forMain, 'Sphere.txt'));
    nameAccounts = safeRead(path.join(forMain, 'Name_Accounts.txt'));
    descriptionGenerator = safeRead(path.join(forMain, 'Description_Generator.txt'));
    linkSite = safeRead(path.join(forMain, 'Link_Site.txt')) || safeRead(path.join(forMain, 'linksite.txt'));
  }

  // Derive human-readable name from path
  const parts = relPath.split(path.sep).filter((p) => p !== 'Template' && p !== 'All Folders');
  const displayName = parts.join(' / ') || path.basename(templatePath);

  return {
    id: relPath,
    name: displayName,
    path: templatePath,
    relativePath: relPath,
    isArtify,
    hasExcel,
    excelSize,
    hasForMain,
    sphere,
    nameAccounts,
    descriptionGenerator,
    linkSite
  };
}

function findNicheTemplate(category, collection) {
  const root = getProjectRoot();
  if (!category || !collection) return null;

  const targetDir = path.join(root, 'All Folders', 'Artify Studio', category, collection, 'Template');
  const exists = fs.existsSync(targetDir);

  if (!exists) {
    return {
      exists: false,
      targetDir,
      hasExcel: false,
      hasForMain: false,
      files: []
    };
  }

  const details = getDonorDetails(targetDir);
  let files = [];
  try {
    files = fs.readdirSync(targetDir).filter((f) => !f.startsWith('.'));
  } catch {
    // ignore
  }

  let forMainFiles = [];
  const forMainPath = path.join(targetDir, 'For Main');
  if (fs.existsSync(forMainPath)) {
    try {
      forMainFiles = fs.readdirSync(forMainPath).filter((f) => !f.startsWith('.'));
    } catch {
      // ignore
    }
  }

  return {
    exists: true,
    ...details,
    files,
    forMainFiles,
    config: {
      sphere: details.sphere,
      nameAccounts: details.nameAccounts,
      descriptionGenerator: details.descriptionGenerator,
      linkSite: details.linkSite,
      boardsName: safeRead(path.join(forMainPath, 'Boards_Name.txt')),
      boardsTags: safeRead(path.join(forMainPath, 'Boards_Tags.txt'))
    }
  };
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category') || '';
    const collection = searchParams.get('collection') || '';

    const root = getProjectRoot();
    const allFolders = path.join(root, 'All Folders');

    // Find all donors
    const foundPaths = findTemplatesInDir(allFolders, 0, 4);
    const donors = foundPaths
      .map(getDonorDetails)
      .sort((a, b) => {
        // Artify Studio templates first, then alphabetical
        if (a.isArtify && !b.isArtify) return -1;
        if (!a.isArtify && b.isArtify) return 1;
        return a.name.localeCompare(b.name);
      });

    // Inspect current niche if provided
    const currentTemplate = category && collection ? findNicheTemplate(category, collection) : null;

    // Scan for available Excel files in the niche folder
    let availableExcels = [];
    if (category && collection) {
      const kw = findKeywordFolder(category, collection);
      if (kw && fs.existsSync(kw)) {
        try {
          const scanExcel = (dir) => {
            const ents = fs.readdirSync(dir, { withFileTypes: true });
            for (const ent of ents) {
              if (
                ent.isFile() &&
                ent.name.endsWith('.xlsx') &&
                !ent.name.startsWith('~$') &&
                !ent.name.startsWith('.')
              ) {
                const fullP = path.join(dir, ent.name);
                let sz = 0;
                try {
                  sz = fs.statSync(fullP).size;
                } catch {
                  // ignore
                }
                availableExcels.push({
                  filename: ent.name,
                  path: fullP,
                  relativePath: path.relative(root, fullP),
                  size: sz
                });
              } else if (
                ent.isDirectory() &&
                !ent.name.startsWith('.') &&
                ent.name !== 'Template'
              ) {
                scanExcel(path.join(dir, ent.name));
              }
            }
          };
          scanExcel(kw);
        } catch {
          // ignore
        }
      }
    }

    return NextResponse.json({
      success: true,
      currentTemplate,
      totalDonors: donors.length,
      donors,
      availableExcels
    });
  } catch (error) {
    console.error('Templates API GET error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { action = 'assemble' } = body;
    const root = getProjectRoot();

    if (action === 'assemble') {
      const {
        category,
        collection,
        donor,
        donorPath,
        boardsName = '',
        boardsTags = '',
        linkSite = '',
        sphere = 'DESIGN_AND_ART',
        nameAccounts = '',
        nameGenerator = '',
        descGenerator = '',
        descriptionGenerator = '',
        excelFile = null,
        overwrite = false
      } = body;

      if (!category || !collection) {
        return NextResponse.json(
          { success: false, error: 'Параметры category и collection обязательны' },
          { status: 400 }
        );
      }

      const effectiveDonorInput = donor || donorPath || '';
      const effectiveNameGen = nameAccounts || nameGenerator || '';
      const effectiveDescGen = descGenerator || descriptionGenerator || '';

      const targetDir = path.join(root, 'All Folders', 'Artify Studio', category, collection, 'Template');
      const forMainDir = path.join(targetDir, 'For Main');

      if (!fs.existsSync(forMainDir)) {
        fs.mkdirSync(forMainDir, { recursive: true });
      }

      const createdFiles = [];

      // Resolve donor
      let effectiveDonor = null;
      if (effectiveDonorInput) {
        const candidatePath = path.isAbsolute(effectiveDonorInput)
          ? effectiveDonorInput
          : path.join(root, effectiveDonorInput);
        if (fs.existsSync(candidatePath)) {
          effectiveDonor = candidatePath;
        }
      }

      if (!effectiveDonor || !fs.existsSync(effectiveDonor)) {
        // Fallback: look for a default Artify donor with Template.xlsx
        const defaultDonor = path.join(root, 'All Folders', 'Artify Studio', 'Cliparts', 'Baby Cliparts', 'Template');
        if (fs.existsSync(defaultDonor)) {
          effectiveDonor = defaultDonor;
        }
      }

      // Copy Template.xlsx (prefer excelFile if specified, otherwise copy from donor)
      const targetXlsx = path.join(targetDir, 'Template.xlsx');
      let excelCopied = false;

      if (excelFile) {
        let sourceExcelPath = path.isAbsolute(excelFile) ? excelFile : path.join(root, excelFile);
        if (!fs.existsSync(sourceExcelPath)) {
          const kw = findKeywordFolder(category, collection);
          if (kw && fs.existsSync(path.join(kw, excelFile))) {
            sourceExcelPath = path.join(kw, excelFile);
          }
        }
        if (fs.existsSync(sourceExcelPath) && (!fs.existsSync(targetXlsx) || overwrite)) {
          fs.copyFileSync(sourceExcelPath, targetXlsx);
          createdFiles.push('Template.xlsx');
          excelCopied = true;
        }
      }

      if (!excelCopied && effectiveDonor) {
        const donorXlsx = path.join(effectiveDonor, 'Template.xlsx');
        if (fs.existsSync(donorXlsx) && (!fs.existsSync(targetXlsx) || overwrite)) {
          fs.copyFileSync(donorXlsx, targetXlsx);
          createdFiles.push('Template.xlsx');
        }
      }

      if (effectiveDonor) {
        // Copy standard boilerplate txt files if present in donor
        const boilerplateFiles = [
          'Coda Token.txt',
          'Count_Automation.txt',
          'Count_accounts.txt',
          'have_link_count.txt',
          'vpn_language.txt'
        ];

        for (const file of boilerplateFiles) {
          const donorFile = path.join(effectiveDonor, file);
          const targetFile = path.join(targetDir, file);
          if (fs.existsSync(donorFile) && (!fs.existsSync(targetFile) || overwrite)) {
            fs.copyFileSync(donorFile, targetFile);
            createdFiles.push(file);
          }
        }
      }

      // Ensure minimal boilerplate exists even if donor lacked them
      const defaultBoilerplate = {
        'Count_Automation.txt': '1',
        'Count_accounts.txt': '1',
        'have_link_count.txt': '1',
        'vpn_language.txt': 'eng'
      };

      for (const [file, defVal] of Object.entries(defaultBoilerplate)) {
        const targetFile = path.join(targetDir, file);
        if (!fs.existsSync(targetFile)) {
          fs.writeFileSync(targetFile, defVal, 'utf-8');
          createdFiles.push(file);
        }
      }

      // Build For Main files
      const effectiveUrl =
        linkSite ||
        `https://artify-studio.pages.dev/${category.toLowerCase()}/${collection.toLowerCase()}`;

      const cleanNameGen = (effectiveNameGen || nameGenerator || '').replace(/\.py$/i, '').trim();
      const cleanDescGen = (effectiveDescGen || descriptionGenerator || '').replace(/\.py$/i, '').trim();

      const forMainFilesMap = {
        'Boards_Name.txt': boardsName,
        'Boards_Tags.txt': boardsTags,
        'Link_Site.txt': effectiveUrl,
        'Sphere.txt': sphere || 'DESIGN_AND_ART',
        'Name_Accounts.txt': cleanNameGen,
        'Description_Generator.txt': cleanDescGen
      };

      for (const [file, content] of Object.entries(forMainFilesMap)) {
        const targetFile = path.join(forMainDir, file);
        // Only write if not exists or if content provided or overwrite
        if (!fs.existsSync(targetFile) || content || overwrite) {
          fs.writeFileSync(targetFile, content || '', 'utf-8');
          createdFiles.push(`For Main/${file}`);
        }
      }

      return NextResponse.json({
        success: true,
        targetDir,
        forMainDir,
        donorUsed: effectiveDonor ? path.relative(root, effectiveDonor) : null,
        createdFiles,
        message: `Шаблон для ${category} / ${collection} успешно собран`
      });
    }

    return NextResponse.json(
      { success: false, error: `Неизвестное действие (action): ${action}` },
      { status: 400 }
    );
  } catch (error) {
    console.error('Templates API POST error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
