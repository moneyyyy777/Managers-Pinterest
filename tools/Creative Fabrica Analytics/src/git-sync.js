import { execSync } from 'node:child_process';
import path from 'node:path';
import { WORKSPACE_ROOT, REPORTS_DIR } from './config.js';

/**
 * Automatically commits and pushes newly collected reports
 */
export async function syncToGit() {
  console.log('\n======================================================');
  console.log('🔄 [GIT-SYNC] Синхронизация отчетов с GitHub репозиторием');
  console.log('======================================================\n');

  try {
    // Relative path to reports from workspace root for git add
    const relReportsDir = path.relative(WORKSPACE_ROOT, REPORTS_DIR);

    console.log(`[GIT-SYNC] Добавление файлов отчетов: ${relReportsDir}`);
    execSync(`git add "${relReportsDir}"`, { cwd: WORKSPACE_ROOT, stdio: 'inherit' });

    // Check if there are staged changes
    const status = execSync('git status --porcelain', { cwd: WORKSPACE_ROOT }).toString();
    if (!status.includes(relReportsDir)) {
      console.log('ℹ️ [GIT-SYNC] Нет новых изменений в отчетах для коммита.');
      return;
    }

    const today = new Date().toISOString().split('T')[0];
    const commitMsg = `chore(cf-stats): auto-update statistics for ${today}`;

    console.log(`[GIT-SYNC] Создание коммита: "${commitMsg}"`);
    execSync(`git commit -m "${commitMsg}"`, { cwd: WORKSPACE_ROOT, stdio: 'inherit' });

    console.log('[GIT-SYNC] Отправка изменений (git push)...');
    execSync('git push', { cwd: WORKSPACE_ROOT, stdio: 'inherit' });

    console.log('🚀 [GIT-SYNC] Отчет успешно запушен в репозиторий!\n');
  } catch (error) {
    console.error(`❌ [GIT-SYNC] Ошибка синхронизации Git: ${error.message}`);
  }
}
