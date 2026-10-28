import { NextResponse } from 'next/server';
import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';
import { findKeywordFolder, getProjectRoot } from '@/lib/paths';

let activeSearchVolumeProcess = null;

async function checkChromeAlive(port = 9222, timeoutMs = 1200) {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    const res = await fetch(`http://127.0.0.1:${port}/json/version`, {
      method: 'GET',
      signal: controller.signal
    });
    clearTimeout(timer);
    return res.ok || res.status < 500;
  } catch {
    return false;
  }
}

export async function GET() {
  const isChromeRunning = await checkChromeAlive();
  const root = getProjectRoot();
  const logFile = path.join(root, 'manager_gui', '.logs', 'searchvolume.log');

  let recentLogs = '';
  if (fs.existsSync(logFile)) {
    try {
      const allText = fs.readFileSync(logFile, 'utf-8');
      const lines = allText.split(/\r?\n/).filter(Boolean);
      recentLogs = lines.slice(-25).join('\n');
    } catch {}
  }

  return NextResponse.json({
    chromeRunning: isChromeRunning,
    isRunning: Boolean(activeSearchVolumeProcess && !activeSearchVolumeProcess.killed),
    recentLogs
  });
}

export async function POST(request) {
  try {
    const body = await request.json().catch(() => ({}));
    const { category, collection, segment, segmentName, mode = 'niche' } = body;
    const seg = segment || segmentName;
    const root = getProjectRoot();
    const isWin = process.platform === 'win32';

    // 1. Check or launch Chrome on port 9222
    let isChromeRunning = await checkChromeAlive();
    if (!isChromeRunning) {
      const scriptName = isWin ? 'launch_browser_windows.bat' : 'launch_browser_mac.sh';
      const scriptPath = path.join(root, 'scripts', scriptName);

      if (fs.existsSync(scriptPath)) {
        if (isWin) {
          spawn('cmd.exe', ['/c', scriptPath], { cwd: root, detached: true, stdio: 'ignore' }).unref();
        } else {
          spawn('bash', [scriptPath], { cwd: root, detached: true, stdio: 'ignore' }).unref();
        }

        // Wait up to 3.5s for Chrome to respond
        for (let i = 0; i < 7; i++) {
          await new Promise((r) => setTimeout(r, 500));
          isChromeRunning = await checkChromeAlive();
          if (isChromeRunning) break;
        }
      }
    }

    // 2. Resolve target directory or file
    let targetArg = '';
    if (mode === 'niche' && category && collection) {
      const kwPath = findKeywordFolder(category, collection);
      if (!kwPath || !fs.existsSync(kwPath)) {
        return NextResponse.json(
          { success: false, error: 'Папка ниши не найдена' },
          { status: 404 }
        );
      }

      const targetDir =
        seg && fs.existsSync(path.join(kwPath, seg))
          ? path.join(kwPath, seg)
          : kwPath;

      targetArg = targetDir;
    }

    const scriptPath = path.join(root, 'Keywords', 'Scripts for Faster', 'searchvolume.js');
    if (!fs.existsSync(scriptPath)) {
      return NextResponse.json(
        { success: false, error: `searchvolume.js не найден по пути: ${scriptPath}` },
        { status: 404 }
      );
    }

    const logsDir = path.join(root, 'manager_gui', '.logs');
    if (!fs.existsSync(logsDir)) {
      fs.mkdirSync(logsDir, { recursive: true });
    }
    const logFile = path.join(logsDir, 'searchvolume.log');
    fs.writeFileSync(logFile, `=== Batch SearchVolume start: ${new Date().toISOString()} ===\nTarget: ${targetArg || 'ALL'}\n`, 'utf-8');

    const outLog = fs.openSync(logFile, 'a');
    const errLog = fs.openSync(logFile, 'a');

    const nodeArgs = [scriptPath];
    if (targetArg) {
      nodeArgs.push(targetArg);
    }

    const nodeModulesCandidates = [
      path.join(root, 'Keywords', 'Artify Studio', 'node_modules'),
      path.join(root, 'manager_gui', 'node_modules'),
      path.join(root, 'Websites', 'CloudFlare', 'artify-studio', 'node_modules'),
      path.join(root, 'node_modules')
    ].filter(fs.existsSync);

    const existingNodePath = process.env.NODE_PATH || '';
    const combinedNodePath = [existingNodePath, ...nodeModulesCandidates].filter(Boolean).join(path.delimiter);

    const child = spawn(process.execPath || 'node', nodeArgs, {
      cwd: path.dirname(scriptPath),
      detached: true,
      stdio: ['ignore', outLog, errLog],
      env: {
        ...process.env,
        NODE_PATH: combinedNodePath,
        PATH: process.env.PATH
      }
    });

    child.unref();
    activeSearchVolumeProcess = child;

    return NextResponse.json({
      success: true,
      message: 'Batch SearchVolume запущен в фоновом режиме',
      chromeRunning: isChromeRunning,
      target: targetArg || 'ALL'
    });
  } catch (error) {
    console.error('Error starting SearchVolume batch:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
