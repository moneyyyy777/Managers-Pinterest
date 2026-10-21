import { NextResponse } from 'next/server';
import { exec } from 'child_process';
import util from 'util';
import path from 'path';
import fs from 'fs';
import { getProjectRoot, getKeywordsDir } from '@/lib/paths';

const execAsync = util.promisify(exec);

export async function POST() {
  const root = getProjectRoot();
  const keywordsDir = getKeywordsDir();
  const artifyDir = path.join(root, 'Websites', 'CloudFlare', 'artify-studio');

  const targets = [];

  // Check root
  if (fs.existsSync(path.join(root, '.git'))) {
    targets.push({ name: 'Root Repository', dir: root });
  }

  // Check Keywords / Manager repo
  if (fs.existsSync(path.join(keywordsDir, '.git'))) {
    targets.push({ name: 'Keywords / Pinterest Manager Repo', dir: keywordsDir });
  }

  // Check Artify Studio repo
  if (fs.existsSync(path.join(artifyDir, '.git'))) {
    targets.push({ name: 'Artify Studio Repo', dir: artifyDir });
  }

  const results = [];
  let allSuccess = true;

  for (const t of targets) {
    try {
      const { stdout, stderr } = await execAsync('git pull', { cwd: t.dir, timeout: 20000 });
      results.push({
        name: t.name,
        dir: path.relative(root, t.dir) || '.',
        success: true,
        output: (stdout || '').trim() || (stderr || '').trim() || 'Already up to date.'
      });
    } catch (err) {
      allSuccess = false;
      results.push({
        name: t.name,
        dir: path.relative(root, t.dir) || '.',
        success: false,
        error: err.message,
        output: (err.stdout || err.stderr || '').trim()
      });
    }
  }

  if (targets.length === 0) {
    results.push({
      name: 'No Git Repositories Found',
      dir: '.',
      success: true,
      output: 'No .git directories found in standard project paths.'
    });
  }

  return NextResponse.json({
    success: allSuccess,
    timestamp: new Date().toISOString(),
    results
  });
}
