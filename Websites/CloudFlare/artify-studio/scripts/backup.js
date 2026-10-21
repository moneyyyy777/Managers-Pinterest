// scripts/backup.js
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

const PROJECT_ROOT = process.cwd();
const BACKUPS_DIR = path.join(PROJECT_ROOT, 'backups');

// Создаем папку backups, если её еще нет
if (!fs.existsSync(BACKUPS_DIR)) {
    fs.mkdirSync(BACKUPS_DIR, { recursive: true });
}

// Формируем имя файла с датой и временем: backup-artify-2025-07-25_14-30.zip
const now = new Date();
const dateStr = now.toISOString().replace(/[:.]/g, '-').slice(0, 19);
const backupName = `backup-artify-${dateStr}.zip`;
const backupPath = path.join(BACKUPS_DIR, backupName);

console.log(`\n📦 Создаю легкий ZIP-бэкап проекта...`);

try {
    // Архивируем всё, ИСКЛЮЧАЯ тяжелый мусор (node_modules, .astro, dist, старые бэкапы)
    execSync(`zip -r "${backupPath}" . -x "node_modules/*" ".astro/*" ".git/*" "backups/*" "dist/*"`);
    
    const stats = fs.statSync(backupPath);
    const fileSizeInMB = (stats.size / (1024 * 1024)).toFixed(2);

    console.log(`\n✨ БЭКАП УСПЕШНО СОЗДАН!`);
    console.log(`📁 Файл: backups/${backupName}`);
    console.log(`📊 Размер: ${fileSizeInMB} МБ`);
    console.log(`💡 Подсказка: скопируй этот файл на Яндекс.Диск или Google Drive.\n`);
} catch (e) {
    console.error(`❌ Ошибка создания бэкапа:`, e.message);
}