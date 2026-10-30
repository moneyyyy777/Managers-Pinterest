import { NextResponse } from 'next/server';
import { spawn, exec } from 'child_process';
import path from 'path';
import fs from 'fs';
import util from 'util';
import { findKeywordFolder, getProjectRoot } from '@/lib/paths';

const execPromise = util.promisify(exec);

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

async function isSearchVolumeAlive() {
  if (activeSearchVolumeProcess && !activeSearchVolumeProcess.killed) {
    try {
      process.kill(activeSearchVolumeProcess.pid, 0);
      return true;
    } catch {
      activeSearchVolumeProcess = null;
    }
  }

  try {
    const isWin = process.platform === 'win32';
    if (isWin) {
      const { stdout } = await execPromise('wmic process where "commandline like \'%searchvolume.js%\'" get processid');
      const lines = stdout.split('\n').map((l) => l.trim()).filter((l) => /^\d+$/.test(l));
      return lines.length > 0;
    } else {
      const { stdout } = await execPromise('pgrep -f "searchvolume.js"');
      return Boolean(stdout && stdout.trim());
    }
  } catch {
    return false;
  }
}

export async function GET() {
  const isChromeRunning = await checkChromeAlive();
  const isRunning = await isSearchVolumeAlive();
  const root = getProjectRoot();
  const logFile = path.join(root, 'manager_gui', '.logs', 'searchvolume.log');

  let recentLogs = '';
  if (fs.existsSync(logFile)) {
    try {
      const allText = fs.readFileSync(logFile, 'utf-8');
      const lines = allText.split(/\r?\n/).filter(Boolean);
      recentLogs = lines.slice(-35).join('\n');
    } catch {}
  }

  return NextResponse.json({
    chromeRunning: isChromeRunning,
    isRunning,
    recentLogs
  });
}

export async function DELETE() {
  try {
    const root = getProjectRoot();
    const logFile = path.join(root, 'manager_gui', '.logs', 'searchvolume.log');

    // 1. Try to kill process reference with SIGTERM for graceful CSV saving
    if (activeSearchVolumeProcess && !activeSearchVolumeProcess.killed) {
      try {
        process.kill(-activeSearchVolumeProcess.pid, 'SIGTERM');
      } catch {
        try {
          activeSearchVolumeProcess.kill('SIGTERM');
        } catch {}
      }
    }

    const isWin = process.platform === 'win32';
    try {
      if (isWin) {
        await execPromise('taskkill /F /FI "WINDOWTITLE eq *searchvolume*" /T').catch(() => {});
      } else {
        await execPromise('pkill -15 -f "searchvolume.js"').catch(() => {});
      }
    } catch {}

    // Allow 1 second for graceful progress save
    await new Promise((r) => setTimeout(r, 1000));

    // 2. Force kill remaining processes
    if (activeSearchVolumeProcess && !activeSearchVolumeProcess.killed) {
      try {
        process.kill(-activeSearchVolumeProcess.pid, 'SIGKILL');
      } catch {
        try {
          activeSearchVolumeProcess.kill('SIGKILL');
        } catch {}
      }
    }

    try {
      if (isWin) {
        await execPromise('wmic process where "commandline like \'%searchvolume.js%\'" call terminate').catch(() => {});
      } else {
        await execPromise('pkill -9 -f "searchvolume.js"').catch(() => {});
      }
    } catch {}

    activeSearchVolumeProcess = null;

    if (fs.existsSync(logFile)) {
      try {
        fs.appendFileSync(
          logFile,
          `\n=== 🛑 Batch SearchVolume ОСТАНОВЛЕН ПОЛЬЗОВАТЕЛЕМ: ${new Date().toISOString()} ===\n`,
          'utf-8'
        );
      } catch {}
    }

    return NextResponse.json({
      success: true,
      message: 'Сбор SearchVolume успешно остановлен',
      isRunning: false
    });
  } catch (error) {
    console.error('Error stopping SearchVolume:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json().catch(() => ({}));

    // Handle explicit stop action via POST
    if (body.action === 'stop') {
      return DELETE();
    }
    const { category, collection, segment, segmentName, mode = 'niche', useSystemVpn = true, maxWords = 4 } = body;
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

    // 2. Resolve target directories or files
    let targetArgs = [];

    if (Array.isArray(body.targets) && body.targets.length > 0) {
      for (const t of body.targets) {
        const cat = t.category;
        const coll = t.collection;
        const s = t.segment || t.segmentName;
        if (!cat || !coll) continue;
        const kwPath = findKeywordFolder(cat, coll);
        if (kwPath && fs.existsSync(kwPath)) {
          const targetDir = s && fs.existsSync(path.join(kwPath, s)) ? path.join(kwPath, s) : kwPath;
          targetArgs.push(targetDir);
        }
      }
    } else if (mode === 'niche' && category && collection) {
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

      targetArgs.push(targetDir);
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
    const targetSummary = targetArgs.length > 0
      ? `${targetArgs.length} папок: ${targetArgs.map((p) => path.basename(p)).join(', ')}`
      : 'ALL';

    fs.writeFileSync(
      logFile,
      `=== Batch SearchVolume start: ${new Date().toISOString()} ===\nTarget: ${targetSummary}\n`,
      'utf-8'
    );

    const outLog = fs.openSync(logFile, 'a');
    const errLog = fs.openSync(logFile, 'a');

    const nodeArgs = [scriptPath, ...targetArgs];
    if (useSystemVpn) {
      nodeArgs.push('--system-vpn');
    }
    if (maxWords && Number(maxWords) > 0) {
      nodeArgs.push(`--max-words=${maxWords}`);
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
        SYSTEM_VPN: useSystemVpn ? '1' : '0',
        MAX_WORDS: String(maxWords || 0),
        NODE_PATH: combinedNodePath,
        PATH: process.env.PATH
      }
    });

    child.unref();
    activeSearchVolumeProcess = child;

    return NextResponse.json({
      success: true,
      message: `Batch SearchVolume запущен (${targetArgs.length > 0 ? targetArgs.length : 'все'} папок)`,
      chromeRunning: isChromeRunning,
      useSystemVpn: Boolean(useSystemVpn),
      targetsCount: targetArgs.length,
      target: targetSummary
    });
  } catch (error) {
    console.error('Error starting SearchVolume batch:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
