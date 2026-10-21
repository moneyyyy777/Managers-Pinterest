import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { execFile } from 'child_process';
import { promisify } from 'util';
import { getProjectRoot, findKeywordFolder } from '@/lib/paths';

const execFileAsync = promisify(execFile);

function getPythonExecutable() {
  const root = getProjectRoot();
  const venvPython = path.join(root, 'Keywords', '.venv', 'bin', 'python3');
  if (fs.existsSync(venvPython)) {
    return venvPython;
  }
  return 'python3';
}

function getGeneratorsDirs() {
  const root = getProjectRoot();
  const nameDir = path.join(root, 'All Folders', '!Generators', 'Name_Account_Generator');
  const descDir = path.join(root, 'All Folders', '!Generators', 'Description_Generator');
  return { nameDir, descDir };
}

function scanGeneratorDir(dirPath, type) {
  if (!fs.existsSync(dirPath)) {
    return [];
  }
  const root = getProjectRoot();
  try {
    const files = fs.readdirSync(dirPath);
    return files
      .filter((f) => f.endsWith('.py') && !f.startsWith('.'))
      .map((f) => {
        const fullPath = path.join(dirPath, f);
        let size = 0;
        let modifiedTime = null;
        try {
          const st = fs.statSync(fullPath);
          size = st.size;
          modifiedTime = st.mtime.toISOString();
        } catch {
          // ignore
        }
        return {
          name: f.replace(/\.py$/i, ''),
          filename: f,
          path: fullPath,
          relativePath: path.relative(root, fullPath),
          type,
          size,
          modifiedTime
        };
      })
      .sort((a, b) => a.name.localeCompare(b.name));
  } catch (err) {
    console.error(`Error scanning ${dirPath}:`, err);
    return [];
  }
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category') || '';
    const collection = searchParams.get('collection') || '';
    const segment = searchParams.get('segment') || '';

    const root = getProjectRoot();
    const { nameDir, descDir } = getGeneratorsDirs();
    const nameGenerators = scanGeneratorDir(nameDir, 'name');
    const descriptionGenerators = scanGeneratorDir(descDir, 'description');

    let assigned = { nameGenerator: '', descGenerator: '' };

    if (category && collection) {
      let kwDir = findKeywordFolder(category, collection);
      if (!kwDir) {
        kwDir = path.join(root, 'Keywords', 'Artify Studio', category, collection);
      }
      if (segment) {
        kwDir = path.join(kwDir, segment);
      }
      const forMain = path.join(kwDir, 'For Main');
      if (fs.existsSync(forMain)) {
        const nameAcc = path.join(forMain, 'Name_Accounts.txt');
        const descGen = path.join(forMain, 'Description_Generator.txt');
        if (fs.existsSync(nameAcc)) {
          assigned.nameGenerator = fs.readFileSync(nameAcc, 'utf-8').trim();
        }
        if (fs.existsSync(descGen)) {
          assigned.descGenerator = fs.readFileSync(descGen, 'utf-8').trim();
        }
      }
    }

    return NextResponse.json({
      success: true,
      pythonExecutable: getPythonExecutable(),
      totalCount: nameGenerators.length + descriptionGenerators.length,
      nameGenerators,
      descriptionGenerators,
      descGenerators: descriptionGenerators,
      assigned
    });
  } catch (error) {
    console.error('Failed to list generators:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { action = 'test' } = body;
    const { nameDir, descDir } = getGeneratorsDirs();
    const root = getProjectRoot();

    // 1. ACTION: TEST GENERATOR
    if (action === 'test') {
      const { type = 'name', scriptName, scriptPath, count = 5 } = body;
      const numCount = Math.min(Math.max(Number(count) || 5, 1), 50);

      let targetPath = scriptPath;
      if (!targetPath && scriptName) {
        const cleanName = scriptName.endsWith('.py') ? scriptName : `${scriptName}.py`;
        const primaryDir = type === 'description' ? descDir : nameDir;
        const fallbackDir = type === 'description' ? nameDir : descDir;

        if (fs.existsSync(path.join(primaryDir, cleanName))) {
          targetPath = path.join(primaryDir, cleanName);
        } else if (fs.existsSync(path.join(fallbackDir, cleanName))) {
          targetPath = path.join(fallbackDir, cleanName);
        }
      }

      if (!targetPath || !fs.existsSync(targetPath)) {
        return NextResponse.json(
          { success: false, error: `Файл генератора не найден: ${scriptName || scriptPath}` },
          { status: 404 }
        );
      }

      const pythonExe = getPythonExecutable();

      // Python execution runner snippet
      const runnerCode = `
import sys, os, importlib.util, json

script_path = sys.argv[1]
count = int(sys.argv[2]) if len(sys.argv) > 2 else 5
results = []

try:
    script_dir = os.path.dirname(os.path.abspath(script_path))
    if script_dir not in sys.path:
        sys.path.insert(0, script_dir)

    spec = importlib.util.spec_from_file_location("dynamic_generator", script_path)
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)

    fn = None
    for name in ['generate_account_name', 'generate_brand_name', 'generate_description', 'generate_profile_description', 'generate']:
        if hasattr(mod, name) and callable(getattr(mod, name)):
            fn = getattr(mod, name)
            break

    if fn:
        for _ in range(count):
            val = fn()
            if val:
                results.append(str(val).strip())
except Exception as e:
    pass

if not results:
    try:
        import subprocess
        p = subprocess.run([sys.executable, script_path], capture_output=True, text=True, timeout=10)
        lines = [line.strip() for line in p.stdout.splitlines() if line.strip()]
        filtered = [l for l in lines if not l.startswith('===') and not l.startswith('---') and not l.startswith('***')]
        results = filtered[:count]
    except Exception:
        pass

print(json.dumps(results))
`;

      try {
        const { stdout } = await execFileAsync(
          pythonExe,
          ['-c', runnerCode, targetPath, String(numCount)],
          { timeout: 15000 }
        );

        let parsed = [];
        try {
          parsed = JSON.parse(stdout.trim());
        } catch {
          parsed = stdout
            .split('\n')
            .map((s) => s.trim())
            .filter(Boolean);
        }

        return NextResponse.json({
          success: true,
          script: path.basename(targetPath),
          path: targetPath,
          count: parsed.length,
          items: parsed
        });
      } catch (execErr) {
        return NextResponse.json(
          {
            success: false,
            error: `Ошибка выполнения генератора: ${execErr.message}`,
            details: execErr.stderr || execErr.stdout
          },
          { status: 500 }
        );
      }
    }

    // 2. ACTION: ASSIGN GENERATORS TO NICHE / SEGMENT
    if (action === 'assign') {
      const {
        targetDir,
        category,
        collection,
        segment,
        nameGenerator,
        descriptionGenerator
      } = body;

      let forMainDir = null;

      if (targetDir) {
        forMainDir =
          path.basename(targetDir).toLowerCase() === 'for main'
            ? targetDir
            : path.join(targetDir, 'For Main');
      } else if (category && collection) {
        const kwDir = findKeywordFolder(category, collection);
        let baseDir = kwDir;
        if (!baseDir) {
          baseDir = path.join(root, 'Keywords', 'Artify Studio', category, collection);
        }
        if (segment) {
          baseDir = path.join(baseDir, segment);
        }
        forMainDir = path.join(baseDir, 'For Main');
      }

      if (!forMainDir) {
        return NextResponse.json(
          {
            success: false,
            error: 'Укажите targetDir или (category, collection) для назначения генераторов'
          },
          { status: 400 }
        );
      }

      if (!fs.existsSync(forMainDir)) {
        fs.mkdirSync(forMainDir, { recursive: true });
      }

      const assigned = {};

      const effectiveNameGen = body.nameGenerator || body.nameAccounts || '';
      const effectiveDescGen = body.descriptionGenerator || body.descGenerator || '';

      if (effectiveNameGen) {
        const cleanName = path.basename(effectiveNameGen).replace(/\.py$/i, '').trim();
        fs.writeFileSync(path.join(forMainDir, 'Name_Accounts.txt'), cleanName, 'utf-8');
        assigned.nameGenerator = cleanName;
        assigned.nameAccounts = cleanName;
      }

      if (effectiveDescGen) {
        const cleanDesc = path.basename(effectiveDescGen).replace(/\.py$/i, '').trim();
        fs.writeFileSync(path.join(forMainDir, 'Description_Generator.txt'), cleanDesc, 'utf-8');
        assigned.descriptionGenerator = cleanDesc;
        assigned.descGenerator = cleanDesc;
      }

      return NextResponse.json({
        success: true,
        forMainDir,
        assigned,
        message: 'Генераторы успешно назначены в For Main/'
      });
    }

    // 3. ACTION: CREATE NEW GENERATOR SCRIPT
    if (action === 'create') {
      const { type = 'name', filename, code } = body;

      if (!filename || !filename.trim()) {
        return NextResponse.json(
          { success: false, error: 'Укажите имя файла генератора' },
          { status: 400 }
        );
      }

      if (!code || !code.trim()) {
        return NextResponse.json(
          { success: false, error: 'Код генератора не может быть пустым' },
          { status: 400 }
        );
      }

      const cleanFilename = filename.trim().endsWith('.py')
        ? filename.trim()
        : `${filename.trim()}.py`;

      const targetDir = type === 'description' ? descDir : nameDir;
      if (!fs.existsSync(targetDir)) {
        fs.mkdirSync(targetDir, { recursive: true });
      }

      const targetFile = path.join(targetDir, cleanFilename);
      fs.writeFileSync(targetFile, code, 'utf-8');

      return NextResponse.json({
        success: true,
        filename: cleanFilename,
        type,
        path: targetFile,
        message: `Генератор ${cleanFilename} успешно создан`
      });
    }

    return NextResponse.json(
      { success: false, error: `Неизвестное действие (action): ${action}` },
      { status: 400 }
    );
  } catch (error) {
    console.error('Generators API error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
