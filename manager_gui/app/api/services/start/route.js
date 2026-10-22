import { NextResponse } from 'next/server';
import { spawn, exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import fs from 'fs';
import net from 'net';
import { getProjectRoot } from '@/lib/paths';

const execPromise = promisify(exec);

let currentStreamlitNiche = null;

async function freePort(port) {
  try {
    if (process.platform === 'win32') {
      const { stdout } = await execPromise(`netstat -ano | findstr :${port} | findstr LISTENING`);
      const lines = stdout.trim().split('\n');
      for (const line of lines) {
        const parts = line.trim().split(/\s+/);
        const pid = parts[parts.length - 1];
        if (pid && !isNaN(pid) && pid !== '0') {
          await execPromise(`taskkill /F /PID ${pid}`);
        }
      }
    } else {
      await execPromise(`lsof -ti :${port} | xargs kill -9`);
    }
  } catch (_) {}
}

function checkPortOpen(port, host = '127.0.0.1', timeoutMs = 4500) {
  const startTime = Date.now();
  return new Promise((resolve) => {
    const tryConnect = () => {
      const socket = new net.Socket();
      socket.setTimeout(350);
      socket.on('connect', () => {
        socket.destroy();
        resolve(true);
      });
      socket.on('error', () => {
        socket.destroy();
        if (Date.now() - startTime > timeoutMs) {
          resolve(false);
        } else {
          setTimeout(tryConnect, 250);
        }
      });
      socket.on('timeout', () => {
        socket.destroy();
        if (Date.now() - startTime > timeoutMs) {
          resolve(false);
        } else {
          setTimeout(tryConnect, 250);
        }
      });
      socket.connect(port, host);
    };
    tryConnect();
  });
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { service, nichePath, segment } = body || {};

    if (!service || !['admin', 'site', 'all', 'manager', 'browser', 'streamlit'].includes(service)) {
      return NextResponse.json(
        {
          success: false,
          error: `Invalid service specified. Expected 'admin', 'site', 'all', 'browser', or 'streamlit'. Received: '${service}'`
        },
        { status: 400 }
      );
    }

    const root = getProjectRoot();

    if (service === 'site' || service === 'all') {
      const siteDir = path.join(root, 'Websites', 'CloudFlare', 'artify-studio');
      const isWin = process.platform === 'win32';
      const cmd = isWin ? 'npx.cmd' : 'npx';
      const child = spawn(cmd, ['astro', 'dev', '--port', '4321', '--host'], {
        cwd: siteDir,
        detached: true,
        stdio: 'ignore',
        shell: isWin
      });
      child.unref();

      if (service === 'site') {
        return NextResponse.json({
          success: true,
          service,
          message: 'Local site started on port 4321'
        });
      }
    }

    if (service === 'admin' || service === 'all') {
      const adminDir = path.join(root, 'Websites', 'CloudFlare', 'artify-studio');
      const adminScript = path.join(adminDir, 'scripts', 'admin', 'server.js');

      if (!fs.existsSync(adminScript)) {
        return NextResponse.json(
          { success: false, service, error: `Admin script not found at ${adminScript}` },
          { status: 404 }
        );
      }

      const nodeBin = process.execPath || 'node';
      const child = spawn(nodeBin, ['scripts/admin/server.js'], {
        cwd: adminDir,
        detached: true,
        stdio: 'ignore'
      });
      child.unref();

      return NextResponse.json({
        success: true,
        service,
        message: 'Admin server started on port 3333'
      });
    }

    if (service === 'browser') {
      const isWin = process.platform === 'win32';
      const scriptName = isWin ? 'launch_browser_windows.bat' : 'launch_browser_mac.sh';
      const scriptPath = path.join(root, 'scripts', scriptName);

      if (!fs.existsSync(scriptPath)) {
        return NextResponse.json(
          { success: false, service, error: `Browser launch script not found at ${scriptPath}` },
          { status: 404 }
        );
      }

      let child;
      if (isWin) {
        child = spawn('cmd.exe', ['/c', scriptPath], {
          cwd: root,
          detached: true,
          stdio: 'ignore'
        });
      } else {
        child = spawn('bash', [scriptPath], {
          cwd: root,
          detached: true,
          stdio: 'ignore'
        });
      }
      child.unref();

      return NextResponse.json({
        success: true,
        service,
        message: 'Browser launch initiated on port 9222'
      });
    }

    if (service === 'streamlit') {
      const isWin = process.platform === 'win32';
      const venvBinDir = isWin
        ? path.join(root, 'Keywords', '.venv', 'Scripts')
        : path.join(root, 'Keywords', '.venv', 'bin');
      const pythonBin = isWin
        ? (fs.existsSync(path.join(venvBinDir, 'python.exe')) ? path.join(venvBinDir, 'python.exe') : 'python')
        : (fs.existsSync(path.join(venvBinDir, 'python3')) ? path.join(venvBinDir, 'python3') : 'python3');

      let targetScript = path.join(root, 'manager_gui', 'templates', 'ai_auto_content_filler_UI.py');
      let targetCwd = root;
      let resolvedNiche = '';

      if (nichePath && typeof nichePath === 'string') {
        resolvedNiche = path.isAbsolute(nichePath) ? nichePath : path.resolve(root, nichePath);
        if (segment && typeof segment === 'string') {
          const segCandidate = path.join(resolvedNiche, segment.trim());
          if (fs.existsSync(segCandidate)) {
            resolvedNiche = segCandidate;
          }
        }
        const nicheCandidate = path.join(resolvedNiche, 'ai_auto_content_filler_UI.py');
        if (fs.existsSync(nicheCandidate)) {
          targetScript = nicheCandidate;
          targetCwd = resolvedNiche;
        } else if (fs.existsSync(resolvedNiche)) {
          targetCwd = resolvedNiche;
        }
      }

      if (!fs.existsSync(targetScript)) {
        return NextResponse.json(
          { success: false, service, error: `Streamlit script not found at ${targetScript}` },
          { status: 404 }
        );
      }

      const requestedNiche = (resolvedNiche || nichePath || '').trim();

      // Check if already running on port 8501
      const alreadyRunning = await checkPortOpen(8501, '127.0.0.1', 800);
      if (alreadyRunning) {
        // Если та же ниша уже работает и отвечает — мгновенно отдаем ее
        if (currentStreamlitNiche && currentStreamlitNiche === requestedNiche) {
          try {
            const testRes = await fetch('http://127.0.0.1:8501', { method: 'HEAD', signal: AbortSignal.timeout(1000) });
            if (testRes.ok || testRes.status < 500) {
              return NextResponse.json({
                success: true,
                service,
                running: true,
                port: 8501,
                url: 'http://localhost:8501',
                message: 'Streamlit уже запущен для этой ниши на порту 8501'
              });
            }
          } catch (_) {}
        }
        // Если выбрана ДРУГАЯ ниша (или сервер завис) — мягко освобождаем порт и перезапускаем
        await freePort(8501);
        await new Promise(r => setTimeout(r, 600));
      }

      const logsDir = path.join(root, 'manager_gui', '.logs');
      if (!fs.existsSync(logsDir)) {
        fs.mkdirSync(logsDir, { recursive: true });
      }
      const logFile = path.join(logsDir, 'streamlit.log');
      const outLog = fs.openSync(logFile, 'a');
      const errLog = fs.openSync(logFile, 'a');

      const env = {
        ...process.env,
        STREAMLIT_NICHE_DIR: resolvedNiche || nichePath || '',
        PATH: fs.existsSync(venvBinDir)
          ? `${venvBinDir}${path.delimiter}${process.env.PATH || ''}`
          : process.env.PATH
      };

      const streamlitArgs = [
        '-m',
        'streamlit',
        'run',
        targetScript,
        '--server.port=8501',
        '--server.address=127.0.0.1',
        '--server.headless=true',
        '--browser.gatherUsageStats=false'
      ];

      const child = spawn(pythonBin, streamlitArgs, {
        cwd: targetCwd,
        detached: true,
        stdio: ['ignore', outLog, errLog],
        env
      });
      child.unref();

      // Wait for port 8501 to open (up to 12s on cold start)
      const isUp = await checkPortOpen(8501, '127.0.0.1', 12000);
      if (isUp) {
        currentStreamlitNiche = requestedNiche;
        return NextResponse.json({
          success: true,
          service,
          running: true,
          port: 8501,
          url: 'http://localhost:8501',
          message: `Streamlit server started on port 8501 with script ${path.basename(targetScript)}`
        });
      } else {
        // Read recent log output to provide helpful error message
        let errorDetails = '';
        try {
          if (fs.existsSync(logFile)) {
            const logContent = fs.readFileSync(logFile, 'utf8');
            errorDetails = logContent.slice(-400);
          }
        } catch (_) {}

        return NextResponse.json(
          {
            success: false,
            service,
            running: false,
            error: `Streamlit did not respond on port 8501 within 5s. ${errorDetails}`
          },
          { status: 500 }
        );
      }
    }

    return NextResponse.json(
      { success: false, error: 'Unhandled service condition' },
      { status: 400 }
    );
  } catch (err) {
    return NextResponse.json(
      { success: false, error: err.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
