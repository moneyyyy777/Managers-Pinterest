import { NextResponse } from 'next/server';
import { exec } from 'child_process';
import util from 'util';
import path from 'path';
import { getProjectRoot } from '@/lib/paths';

const execAsync = util.promisify(exec);

export async function POST(req) {
  const root = getProjectRoot();
  let commitMsg = '';
  try {
    const body = await req.json();
    commitMsg = body?.message || '';
  } catch {}

  const scriptPath = path.join(root, 'sync_push.py');
  const cmd = commitMsg
    ? `python3 "${scriptPath}" "${commitMsg.replace(/"/g, '\\"')}"`
    : `python3 "${scriptPath}"`;

  try {
    const { stdout, stderr } = await execAsync(cmd, { cwd: root, timeout: 120000 });
    const output = (stdout || '').trim() || (stderr || '').trim();
    const isSuccess = output.includes('ВСЁ ГОТОВО') || (!output.includes('ВНИМАНИЕ: GitHub заблокировал') && !output.includes('Ошибка при отправке'));

    return NextResponse.json({
      success: isSuccess,
      output,
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    return NextResponse.json({
      success: false,
      error: err.message,
      output: (err.stdout || err.stderr || '').trim()
    }, { status: 500 });
  }
}
