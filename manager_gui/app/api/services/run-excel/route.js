import { NextResponse } from 'next/server';
import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';
import { getProjectRoot } from '@/lib/paths';

export async function POST(request) {
  try {
    const body = await request.json().catch(() => ({}));
    const { category, collection, nichePath, segment, targetFolder } = body;

    const root = getProjectRoot();
    const scriptPath = path.join(
      root,
      'Keywords',
      'Scripts for Faster',
      'Module_Excel_Prompt_6',
      'run_folder.py'
    );

    if (!fs.existsSync(scriptPath)) {
      return NextResponse.json(
        { success: false, error: `Скрипт не найден по пути: ${scriptPath}` },
        { status: 404 }
      );
    }

    // Resolve target folder to process
    let targetDir = '';
    if (targetFolder && typeof targetFolder === 'string') {
      targetDir = path.isAbsolute(targetFolder) ? targetFolder : path.resolve(root, targetFolder);
    } else if (nichePath && typeof nichePath === 'string') {
      targetDir = path.isAbsolute(nichePath) ? nichePath : path.resolve(root, nichePath);
      if (segment && typeof segment === 'string') {
        const segCandidate = path.join(targetDir, segment.trim());
        if (fs.existsSync(segCandidate)) {
          targetDir = segCandidate;
        }
      }
    } else if (category && collection) {
      targetDir = path.join(root, 'Keywords', 'Artify Studio', category, collection);
      if (segment) {
        const segCandidate = path.join(targetDir, segment);
        if (fs.existsSync(segCandidate)) {
          targetDir = segCandidate;
        }
      }
    }

    if (!targetDir || !fs.existsSync(targetDir)) {
      return NextResponse.json(
        { success: false, error: `Папка ниши не найдена: ${targetDir}` },
        { status: 400 }
      );
    }

    // Find intent subfolders if root was provided
    let foldersToRun = [];
    const entries = fs.readdirSync(targetDir, { withFileTypes: true });
    const subfolders = entries
      .filter((e) => e.isDirectory() && !e.name.startsWith('.') && e.name !== 'For Main')
      .map((e) => path.join(targetDir, e.name));

    // Check if targetDir itself has an .xlsx file or if subfolders do
    const directXlsx = fs.readdirSync(targetDir).some((f) => f.endsWith('.xlsx') && !f.startsWith('~'));
    if (directXlsx) {
      foldersToRun.push(targetDir);
    } else if (subfolders.length > 0) {
      foldersToRun = subfolders.filter((dir) => {
        try {
          return fs.readdirSync(dir).some((f) => f.endsWith('.xlsx') && !f.startsWith('~'));
        } catch {
          return false;
        }
      });
    }

    if (foldersToRun.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: `В папке ${targetDir} не найдены подпапки с .xlsx файлами для заполнения.`
        },
        { status: 400 }
      );
    }

    const isWin = process.platform === 'win32';
    const venvBinDir = isWin
      ? path.join(root, 'Keywords', '.venv', 'Scripts')
      : path.join(root, 'Keywords', '.venv', 'bin');
    const pythonBin = isWin
      ? (fs.existsSync(path.join(venvBinDir, 'python.exe')) ? path.join(venvBinDir, 'python.exe') : 'python')
      : (fs.existsSync(path.join(venvBinDir, 'python3')) ? path.join(venvBinDir, 'python3') : 'python3');

    // Run on the first matching folder or trigger background queue
    const primaryFolder = foldersToRun[0];

    const child = spawn(pythonBin, [scriptPath, primaryFolder], {
      cwd: path.dirname(scriptPath),
      detached: true,
      stdio: 'ignore'
    });
    child.unref();

    return NextResponse.json({
      success: true,
      message: `Генерация Excel успешно запущена для папки: ${path.basename(primaryFolder)}`,
      folder: primaryFolder,
      totalFolders: foldersToRun.length,
      allFolders: foldersToRun.map((f) => path.basename(f))
    });
  } catch (error) {
    console.error('Error in run-excel route:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
