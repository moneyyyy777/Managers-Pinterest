#!/usr/bin/env node

/**
 * Скрипт обновления проекта (git pull) и формирования дайджеста изменений для менеджера.
 * Использование:
 *   node pull-and-digest.js [--check-recent] [--json]
 */

import { exec } from 'node:child_process';
import { promisify } from 'node:util';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const execAsync = promisify(exec);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, '../../../../');

const args = process.argv.slice(2);
const checkRecentOnly = args.includes('--check-recent');
const isJson = args.includes('--json');

async function runCommand(cmd) {
    try {
        const { stdout } = await execAsync(cmd, { cwd: PROJECT_ROOT });
        return stdout.trim();
    } catch (e) {
        return '';
    }
}

async function main() {
    const oldCommit = await runCommand('git rev-parse HEAD');

    let pullOutput = '';
    if (!checkRecentOnly) {
        console.log('⏳ Подтягивание свежих обновлений с GitHub (git pull origin main)...');
        pullOutput = await runCommand('git pull origin main');
    }

    const newCommit = await runCommand('git rev-parse HEAD');
    const isUpdated = oldCommit !== newCommit;

    let range = `${oldCommit}..${newCommit}`;
    if (!isUpdated || checkRecentOnly) {
        // Если коммитов новых нет или запрошена проверка недавних, смотрим последние 3 коммита
        range = 'HEAD~3..HEAD';
    }

    const logRaw = await runCommand(`git log ${range} --pretty=format:"%h|%s|%an|%cr"`);
    const diffStat = await runCommand(`git diff ${range} --stat`);
    const changedFilesRaw = await runCommand(`git diff ${range} --name-only`);

    const commits = logRaw ? logRaw.split('\n').filter(Boolean).map(line => {
        const [hash, subject, author, timeAgo] = line.split('|');
        return { hash, subject, author, timeAgo };
    }) : [];

    const changedFiles = changedFilesRaw ? changedFilesRaw.split('\n').filter(Boolean) : [];

    // Классификация изменений для менеджера
    const categories = {
        admin: changedFiles.some(f => f.startsWith('scripts/admin/')),
        skills: changedFiles.some(f => f.startsWith('.agents/skills/')),
        content: changedFiles.some(f => f.startsWith('content/') || f.includes('categories.json')),
        docs: changedFiles.some(f => f.startsWith('docs/')),
        code: changedFiles.some(f => f.startsWith('src/') || f.startsWith('scripts/creative-fabrica/'))
    };

    if (isJson) {
        console.log(JSON.stringify({ isUpdated, pullOutput, commits, changedFiles, categories }, null, 2));
        return;
    }

    console.log('\n========================================================================');
    if (isUpdated) {
        console.log('🎉 ПРОЕКТ УСПЕШНО ОБНОВЛЁН ДО ПОСЛЕДНЕЙ ВЕРСИИ!');
    } else {
        console.log('ℹ️  ПРОЕКТ УЖЕ В АКТУАЛЬНОМ СОСТОЯНИИ (Новых коммитов нет)');
        console.log('    Ниже показаны последние обновления, которые уже активны:');
    }
    console.log('========================================================================\n');

    if (commits.length > 0) {
        console.log('📋 Список изменений (коммиты разработчика):');
        commits.forEach(c => {
            console.log(`  • [${c.hash}] ${c.subject} (${c.timeAgo})`);
        });
    }

    console.log('\n🔍 Что было затронуто в проекте:');
    if (categories.admin) console.log('  🖥️  Админка (localhost:3333) — обновлён интерфейс или добавлены кнопки');
    if (categories.skills) console.log('  🧠 ИИ-скиллы для менеджера — добавлены или обновлены возможности ассистента');
    if (categories.content) console.log('  📦 Контент и подборки — обновлены товары, фильтры или категории');
    if (categories.docs) console.log('  📚 База знаний / инструкции — обновлены файлы документации');
    if (categories.code) console.log('  ⚙️  Ядро сайта / парсеры — технические улучшения в коде проекта');

    if (diffStat) {
        console.log('\n📊 Сводка файлов:');
        console.log(diffStat);
    }

    console.log('========================================================================\n');
}

main().catch(err => {
    console.error('Ошибка проверки обновлений:', err);
    process.exit(1);
});
