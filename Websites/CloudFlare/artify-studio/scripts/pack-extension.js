// scripts/pack-extension.js
import fs from "fs";
import path from "path";
import { execSync } from "child_process";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");
const extDir = path.join(rootDir, "extension");
const zipPath = path.join(rootDir, "artify-extension.zip");

console.log("📦 Упаковка расширения Artify Studio Clipper...");

if (!fs.existsSync(extDir)) {
    console.error("❌ Папка extension не найдена!");
    process.exit(1);
}

// Удаляем старый zip если был
if (fs.existsSync(zipPath)) {
    fs.unlinkSync(zipPath);
}

try {
    // Используем zip утилиту ОС
    execSync(`cd "${rootDir}" && zip -r "${zipPath}" extension -x "*.DS_Store"`, { stdio: "inherit" });
    console.log(`\n✅ Расширение успешно упаковано: ${zipPath}`);
    console.log(`💡 Как установить:`);
    console.log(`1. В браузере (Chrome / Brave / Edge / Яндекс) откройте chrome://extensions`);
    console.log(`2. Включите переключатель "Режим разработчика" (Developer mode) в правом верхнем углу`);
    console.log(`3. Нажмите кнопку "Загрузить распакованное расширение" (Load unpacked) и выберите папку:`);
    console.log(`   ${extDir}`);
    console.log(`   Либо разархивируйте ${zipPath} и выберите распакованную папку.`);
} catch (e) {
    console.error("❌ Ошибка упаковки zip:", e.message);
    process.exit(1);
}
