import { NextResponse } from 'next/server';
import { exec } from 'child_process';
import util from 'util';
import path from 'path';
import { getProjectRoot } from '@/lib/paths';

const execAsync = util.promisify(exec);

export async function POST() {
  const root = getProjectRoot();
  const scriptPath = path.join(root, 'sync_pull.py');
  const cmd = `python3 "${scriptPath}"`;

  try {
    const { stdout, stderr } = await execAsync(cmd, { cwd: root, timeout: 120000 });
    const output = (stdout || '').trim() || (stderr || '').trim();
    const isSuccess = output.includes('ВСЁ ГОТОВО') || !output.includes('Обнаружен конфликт');

    return NextResponse.json({
      success: isSuccess,
      message: output,
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    return NextResponse.json({
      success: false,
      error: err.message,
      message: (err.stdout || err.stderr || '').trim()
    }, { status: 500 });
  }
}
