import fs from 'fs';
import path from 'path';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const XLSX = require('xlsx');
import { getProjectRoot, getKeywordsDir, getGeneratorsDir, findKeywordFolder } from './paths.js';

// Regex to detect old years 2021 to 2025
const OLD_YEAR_REGEX = /\b(202[1-5])\b/gi;
// Marketplace competitors check
const COMPETITORS = ['etsy', 'creative fabrica', 'creativefabrica', 'amazon', 'aliexpress', 'temu', 'shopee'];

// Helper to extract initial emoji from text
function getLeadingEmoji(text) {
  if (!text || typeof text !== 'string') return null;
  const trimmed = text.trim();
  // Match emoji sequence at start of string
  const match = trimmed.match(/^(\p{Extended_Pictographic}|\p{Emoji_Presentation}|[\u2600-\u27BF])/u);
  return match ? match[0] : null;
}

export function auditNiche(category, collection, segmentName = null) {
  const root = getProjectRoot();
  const kwPath = findKeywordFolder(category, collection);

  const report = {
    category,
    collection,
    segmentName,
    keywordPath: kwPath ? path.relative(root, kwPath) : null,
    timestamp: new Date().toISOString(),
    status: 'PASS', // 'PASS' | 'WARN' | 'FAIL'
    score: 100,
    summary: {
      totalChecks: 0,
      passedChecks: 0,
      warningsCount: 0,
      errorsCount: 0
    },
    issues: [],
    details: {
      structure: { status: 'PASS', items: [] },
      tags: { status: 'PASS', items: [], oldYearsFound: [], competitorsFound: [] },
      generators: { status: 'PASS', items: [] },
      excel: { status: 'PASS', items: [], filesAnalyzed: 0 }
    }
  };

  function addIssue(severity, categoryName, title, message, suggestion = '') {
    report.issues.push({ severity, category: categoryName, title, message, suggestion });
    if (severity === 'error') {
      report.summary.errorsCount++;
      report.score = Math.max(0, report.score - 15);
      report.status = 'FAIL';
      if (report.details[categoryName]) report.details[categoryName].status = 'FAIL';
    } else if (severity === 'warning') {
      report.summary.warningsCount++;
      report.score = Math.max(0, report.score - 5);
      if (report.status !== 'FAIL') report.status = 'WARN';
      if (report.details[categoryName] && report.details[categoryName].status !== 'FAIL') {
        report.details[categoryName].status = 'WARN';
      }
    }
  }

  if (!kwPath || !fs.existsSync(kwPath)) {
    addIssue('error', 'structure', 'Папка ниши не найдена в Keywords', 
      `Не удалось найти директорию для ниши ${category}/${collection} в Keywords/Artify Studio/`,
      'Нажмите «Развернуть нишу в Keywords» на Шаге 1 для создания структуры.');
    return report;
  }

  // --- 1. ПРОВЕРКА СТРУКТУРЫ И БАЗОВЫХ ФАЙЛОВ ---
  report.summary.totalChecks++;
  const linksiteFile = path.join(kwPath, 'linksite.txt');
  const linksiteAlt = path.join(kwPath, 'Link_Site.txt');
  const hasLinksite = fs.existsSync(linksiteFile) || fs.existsSync(linksiteAlt);

  if (hasLinksite) {
    const content = fs.existsSync(linksiteFile) ? fs.readFileSync(linksiteFile, 'utf-8').trim() : fs.readFileSync(linksiteAlt, 'utf-8').trim();
    if (content.length > 5 && content.startsWith('http')) {
      report.summary.passedChecks++;
      report.details.structure.items.push({ check: 'linksite.txt', passed: true, detail: content });
    } else {
      addIssue('warning', 'structure', 'linksite.txt пуст или не содержит корректную ссылку', `Содержимое: "${content}"`, 'Укажите URL вида https://artify-studio.pages.dev/...');
    }
  } else {
    addIssue('error', 'structure', 'Отсутствует linksite.txt в корне ниши', 'Файл linksite.txt необходим для связки с сайтом', 'Создайте linksite.txt со ссылкой на страницу подборки');
  }

  // Поиск всех подпапок (стратегий, интентов, нумерованных папок)
  let subdirs = [];
  function findSubdirs(dir, depth = 0) {
    if (depth > 3) return;
    try {
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      for (const entry of entries) {
        if (entry.isDirectory() && !entry.name.startsWith('.')) {
          const full = path.join(dir, entry.name);
          subdirs.push({ name: entry.name, fullPath: full, relative: path.relative(kwPath, full) });
          findSubdirs(full, depth + 1);
        }
      }
    } catch (e) {}
  }
  findSubdirs(kwPath);

  if (segmentName) {
    const cleanSeg = segmentName.replace(/^[/\\]+|[/\\]+$/g, '').toLowerCase();
    subdirs = subdirs.filter(d => {
      const relNorm = d.relative.replace(/\\/g, '/').toLowerCase();
      if (relNorm === cleanSeg || relNorm.startsWith(cleanSeg + '/')) return true;
      const parts = relNorm.split('/');
      if (parts.includes(cleanSeg)) return true;
      const nameLower = d.name.toLowerCase();
      if (nameLower === cleanSeg) return true;
      if (nameLower.startsWith(cleanSeg + '/') || nameLower.startsWith(cleanSeg + ' ') || nameLower.startsWith(cleanSeg + '-')) return true;
      return false;
    });
  }

  const numberedFolders = subdirs.filter(d => /^\d+\s+/.test(d.name));
  report.summary.totalChecks++;
  if (numberedFolders.length >= 4) {
    report.summary.passedChecks++;
    report.details.structure.items.push({ check: 'Интент-папки (нумерованные)', passed: true, detail: `Найдено ${numberedFolders.length} папок (эталон 4-6)` });
  } else if (numberedFolders.length > 0) {
    addIssue('warning', 'structure', 'Мало интент-папок', `Найдено ${numberedFolders.length} нумерованных папок (рекомендуется от 4 до 6)`, 'Проверьте кластеризацию по интентам на Шаге 5');
  } else {
    addIssue('error', 'structure', 'Отсутствуют нумерованные интент-папки', 'Не найдены папки вида 1..., 2... с контентом', 'Сформируйте интенты и создайте папки контента');
  }

  // --- 2. ПРОВЕРКА ТЕГОВ И СЕМАНТИКИ ---
  // Ищем Seed Tags.txt
  let seedTagsContent = '';
  function findFile(dir, fileName) {
    try {
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      for (const e of entries) {
        const full = path.join(dir, e.name);
        if (!e.isDirectory() && e.name.toLowerCase() === fileName.toLowerCase()) {
          return full;
        }
        if (e.isDirectory() && !e.name.startsWith('.')) {
          const sub = findFile(full, fileName);
          if (sub) return sub;
        }
      }
    } catch (e) {}
    return null;
  }

  const targetSeedDir = (segmentName && fs.existsSync(path.join(kwPath, segmentName)))
    ? path.join(kwPath, segmentName)
    : kwPath;
  const seedFile = findFile(targetSeedDir, 'Seed Tags.txt') || findFile(kwPath, 'Seed Tags.txt');
  report.summary.totalChecks++;
  if (seedFile && fs.existsSync(seedFile)) {
    seedTagsContent = fs.readFileSync(seedFile, 'utf-8');
    const seeds = seedTagsContent.split('\n').map(s => s.trim()).filter(Boolean);
    if (seeds.length >= 5) {
      report.summary.passedChecks++;
      report.details.tags.items.push({ check: 'Seed Tags.txt', passed: true, detail: `${seeds.length} семян тегов` });
    } else {
      addIssue('warning', 'tags', 'Мало семян в Seed Tags.txt', `Найдено всего ${seeds.length} семян (рекомендуется 10-30)`, 'Добавьте больше релевантных семян');
    }
  } else {
    addIssue('error', 'tags', 'Файл Seed Tags.txt не найден', 'В нише отсутствует файл семян тегов', 'Создайте и заполните Seed Tags.txt на Шаге 2');
  }

  // Ищем Filter by OpenAI.csv
  let filterCsvFile = null;
  const searchDirs = segmentName ? subdirs.map(s => s.fullPath) : [kwPath, ...subdirs.map(s => s.fullPath)];
  for (const d of searchDirs) {
    try {
      const files = fs.readdirSync(d);
      const matched = files.find(f => f.toLowerCase().includes('filter by openai') && f.endsWith('.csv'));
      if (matched) {
        filterCsvFile = path.join(d, matched);
        break;
      }
    } catch (e) {}
  }

  report.summary.totalChecks++;
  if (filterCsvFile && fs.existsSync(filterCsvFile)) {
    const csvContent = fs.readFileSync(filterCsvFile, 'utf-8');
    const lines = csvContent.split('\n').map(l => l.trim()).filter(Boolean);
    const tagLines = lines.length > 1 ? lines.slice(1) : lines; // skip header if any

    report.summary.passedChecks++;
    report.details.tags.items.push({ check: 'Filter by OpenAI.csv', passed: true, detail: `${tagLines.length} отфильтрованных тегов` });

    // Проверка старых годов (2021-2025) в тегах!
    const oldYearsInTags = [];
    const competitorsInTags = [];

    for (const line of tagLines) {
      const tag = line.split(',')[0].replace(/"/g, '').trim();
      const yearMatches = tag.match(OLD_YEAR_REGEX);
      if (yearMatches) {
        oldYearsInTags.push({ tag, years: yearMatches });
      }
      for (const comp of COMPETITORS) {
        if (tag.toLowerCase().includes(comp)) {
          competitorsInTags.push({ tag, competitor: comp });
        }
      }
    }

    if (oldYearsInTags.length > 0) {
      report.details.tags.oldYearsFound = oldYearsInTags;
      addIssue('error', 'tags', `Обнаружены устаревшие годы (2021-2025) в ${oldYearsInTags.length} тегах`,
        `Теги с устаревшими годами: ${oldYearsInTags.slice(0, 5).map(o => `"${o.tag}"`).join(', ')}${oldYearsInTags.length > 5 ? ' и др.' : ''}`,
        'Замените устаревшие годы на 2026/2027 или удалите их перед запуском.');
    } else {
      report.details.tags.items.push({ check: 'Детектор старых годов (2021-2025)', passed: true, detail: 'Устаревшие годы не обнаружены ✅' });
    }

    if (competitorsInTags.length > 0) {
      report.details.tags.competitorsFound = competitorsInTags;
      addIssue('warning', 'tags', `Обнаружены бренды конкурентов в ${competitorsInTags.length} тегах`,
        `Теги: ${competitorsInTags.slice(0, 4).map(c => `"${c.tag}" (${c.competitor})`).join(', ')}`,
        'Удалите упоминания чужих маркетплейсов из ключевых слов.');
    }
  } else {
    addIssue('warning', 'tags', 'Файл Filter by OpenAI.csv не найден', 'Теги еще не были отфильтрованы через ИИ', 'Запустите фильтрацию по Промпту 2.1');
  }

  // --- 3. ПРОВЕРКА BOARDS И ГЕНЕРАТОРОВ В FOR MAIN ---
  const generatorsDir = getGeneratorsDir();
  const nameGenDir = path.join(generatorsDir, 'Name_Account_Generator');
  const descGenDir = path.join(generatorsDir, 'Description_Generator');

  let forMainChecked = 0;
  for (const folder of numberedFolders) {
    const forMainPath = path.join(folder.fullPath, 'For Main');
    if (fs.existsSync(forMainPath)) {
      forMainChecked++;

      // Boards_Name.txt
      const bnFile = path.join(forMainPath, 'Boards_Name.txt');
      if (fs.existsSync(bnFile)) {
        const bName = fs.readFileSync(bnFile, 'utf-8').trim();
        if (!bName) {
          addIssue('error', 'generators', `Пустой Boards_Name.txt в ${folder.name}`, 'Файл названия доски пуст', 'Заполните название доски');
        }
      } else {
        addIssue('error', 'generators', `Отсутствует Boards_Name.txt в ${folder.name}`, 'Не найден файл названия доски в For Main', 'Создайте Boards_Name.txt');
      }

      // Boards_Tags.txt
      const btFile = path.join(forMainPath, 'Boards_Tags.txt');
      if (fs.existsSync(btFile)) {
        const btContent = fs.readFileSync(btFile, 'utf-8').trim();
        const tagCount = btContent.split('\n').filter(Boolean).length;
        if (tagCount < 10) {
          addIssue('warning', 'generators', `Мало тегов в Boards_Tags.txt (${folder.name})`, `Всего ${tagCount} тегов`, 'Рекомендуется от 30 до 150 тегов на доску');
        }
      } else {
        addIssue('error', 'generators', `Отсутствует Boards_Tags.txt в ${folder.name}`, 'Не найден файл тегов доски в For Main', 'Скопируйте теги интента в Boards_Tags.txt');
      }

      // Name_Accounts.txt -> Generator check
      const naFile = path.join(forMainPath, 'Name_Accounts.txt');
      if (fs.existsSync(naFile)) {
        const genName = fs.readFileSync(naFile, 'utf-8').trim();
        if (genName) {
          const genFileName = genName.endsWith('.py') ? genName : `${genName}.py`;
          const expectedPy = path.join(nameGenDir, genFileName);
          if (!fs.existsSync(expectedPy)) {
            addIssue('error', 'generators', `Генератор имён не найден: ${genFileName}`,
              `Указанный в ${folder.name}/For Main/Name_Accounts.txt файл не существует в All Folders/!Generators/Name_Account_Generator/`,
              `Создайте скрипт ${genFileName} по Промпту 4`);
          }
        }
      }

      // Description_Generator.txt -> Generator check
      const dgFile = path.join(forMainPath, 'Description_Generator.txt');
      if (fs.existsSync(dgFile)) {
        const descGenName = fs.readFileSync(dgFile, 'utf-8').trim();
        if (descGenName) {
          const descGenFile = descGenName.endsWith('.py') ? descGenName : `${descGenName}.py`;
          const expectedDescPy = path.join(descGenDir, descGenFile);
          if (!fs.existsSync(expectedDescPy)) {
            addIssue('error', 'generators', `Генератор описаний не найден: ${descGenFile}`,
              `Указанный в ${folder.name}/For Main/Description_Generator.txt файл не существует в All Folders/!Generators/Description_Generator/`,
              `Создайте скрипт ${descGenFile} по Промпту 5`);
          }
        }
      }
    }
  }

  if (forMainChecked > 0) {
    report.details.generators.items.push({ check: 'Папки For Main проверены', passed: true, detail: `Проверено ${forMainChecked} папок` });
  }

  // --- 4. ПРОВЕРКА EXCEL ТАБЛИЦ (.XLSX) ---
  const excelFiles = [];
  for (const folder of numberedFolders) {
    try {
      const files = fs.readdirSync(folder.fullPath);
      for (const f of files) {
        if (f.endsWith('.xlsx') && !f.startsWith('~$')) {
          excelFiles.push({ path: path.join(folder.fullPath, f), name: f, folderName: folder.name });
        }
      }
    } catch (e) {}
  }

  report.details.excel.filesAnalyzed = excelFiles.length;

  if (excelFiles.length === 0) {
    addIssue('error', 'excel', 'Excel файлы контента не найдены', 'В нумерованных папках отсутствуют .xlsx файлы с контентом', 'Сгенерируйте контент по Промпту 6');
  } else {
    for (const ex of excelFiles) {
      try {
        const buf = fs.readFileSync(ex.path);
        const pkg = XLSX.default || XLSX;
        const wb = pkg.read(buf, { type: 'buffer' });
        const firstSheetName = wb.SheetNames[0];
        const sheet = wb.Sheets[firstSheetName];
        const rows = (pkg.utils || XLSX.utils).sheet_to_json(sheet, { defval: '' });

        if (rows.length === 0) {
          addIssue('error', 'excel', `Пустой Excel файл: ${ex.name}`, `Файл ${ex.name} не содержит строк`, 'Заполните файл контентом');
          continue;
        }

        // Анализ первых 100 строк (по стандарту Промпта 6 и 7.1)
        const sampleRows = rows.slice(0, 100);

        // Определяем имена колонок с приоритетом для шаблонов Make/Pinterest
        const firstRow = sampleRows[0] || {};
        const colKeys = Object.keys(firstRow);

        // Приоритет описаний: description_template -> description -> Unnamed: 4
        const descKey =
          colKeys.find(k => k.toLowerCase() === 'description_template') ||
          colKeys.find(k => k.toLowerCase().includes('desc') && k.toLowerCase() !== 'description') ||
          colKeys.find(k => k.toLowerCase() === 'unnamed: 4') ||
          colKeys.find(k => k.toLowerCase().includes('desc')) ||
          'description';

        const ctaKey =
          colKeys.find(k => k.toLowerCase() === 'cta' || k.toLowerCase().includes('call')) ||
          'CTA';

        const titleKey =
          colKeys.find(k => k.toLowerCase() === 'title.1') ||
          colKeys.find(k => k.toLowerCase() === 'title') ||
          colKeys.find(k => k.toLowerCase().includes('title') && k !== descKey && k !== ctaKey) ||
          'title';

        // Умное извлечение: проверяем основную колонку, затем fallback на description_template / Unnamed: 4
        const descriptions = sampleRows
          .map(r => {
            const val = r[descKey] || r['description_template'] || r['Unnamed: 4'] || r['description'] || '';
            return String(val || '').trim();
          })
          .filter(Boolean);

        const ctas = sampleRows
          .map(r => {
            const val = r[ctaKey] || r['CTA'] || r['cta'] || '';
            return String(val || '').trim();
          })
          .filter(Boolean);

        const titles = sampleRows
          .map(r => {
            const val = r[titleKey] || r['title.1'] || r['title'] || '';
            return String(val || '').trim();
          })
          .filter(Boolean);

        // 1. Проверка уникальных строк (цель: 100 строк в первом блоке)
        const uniqueDesc = new Set(descriptions).size;
        const uniqueCta = new Set(ctas).size;

        if (descriptions.length < 50) {
          addIssue('error', 'excel', `Недозаполненный контент в ${ex.name}`,
            `Заполнено всего ${descriptions.length} строк Description (норматив: 100 уникальных строк)`,
            'Дозаполните таблицу до 100 строк уникального контента');
        }

        // 2. Проверка стартовых эмодзи
        let descEmojiStartCount = 0;
        const descEmojis = new Set();
        for (const d of descriptions) {
          const em = getLeadingEmoji(d);
          if (em) {
            descEmojiStartCount++;
            descEmojis.add(em);
          }
        }

        let ctaEmojiStartCount = 0;
        const ctaEmojis = new Set();
        let freeCount = 0;
        for (const c of ctas) {
          const em = getLeadingEmoji(c);
          if (em) {
            ctaEmojiStartCount++;
            ctaEmojis.add(em);
          }
          if (/\bfree\b/i.test(c)) {
            freeCount++;
          }
        }

        const freePercentage = ctas.length > 0 ? Math.round((freeCount / ctas.length) * 100) : 0;

        // Разнообразие эмодзи
        if (descriptions.length >= 20 && descEmojis.size < 10) {
          addIssue('warning', 'excel', `Низкое разнообразие эмодзи в Description (${ex.name})`,
            `Всего ${descEmojis.size} уникальных эмодзи на ${descriptions.length} строк (норма: ≥ 10)`,
            'Используйте разнообразные сезонные и тематические эмодзи');
        }

        if (ctas.length >= 20 && ctaEmojis.size < 8) {
          addIssue('warning', 'excel', `Монотонные CTA в ${ex.name}`,
            `Всего ${ctaEmojis.size} уникальных эмодзи в CTA (норма: ≥ 10). Частая ошибка: одинаковый эмодзи на все строки`,
            'Разбавьте эмодзи в начале каждой строки CTA');
        }

        // Проверка триггера FREE
        if (ctas.length > 0 && freePercentage < 50) {
          addIssue('warning', 'excel', `Мало триггера FREE в CTA (${ex.name})`,
            `Слово FREE содержится только в ${freePercentage}% строк CTA`,
            'Рекомендуется упоминать FREE в большинстве CTA для максимальной конверсии');
        }

        // Проверка устаревших годов в Excel
        let excelOldYearsCount = 0;
        for (const r of sampleRows) {
          const combined = Object.values(r).join(' ');
          if (OLD_YEAR_REGEX.test(combined)) {
            excelOldYearsCount++;
          }
        }

        if (excelOldYearsCount > 0) {
          addIssue('error', 'excel', `Устаревшие годы (2021-2025) в ${ex.name}`,
            `Найдено ${excelOldYearsCount} строк с устаревшими годами в Excel`,
            'Замените даты на актуальный 2026 год');
        }

        report.details.excel.items.push({
          file: ex.name,
          folder: ex.folderName,
          totalRows: rows.length,
          sampleCount: sampleRows.length,
          uniqueDescriptions: uniqueDesc,
          uniqueCtas: uniqueCta,
          descUniqueEmojis: descEmojis.size,
          ctaUniqueEmojis: ctaEmojis.size,
          freePercentage: `${freePercentage}%`,
          passed: uniqueDesc >= 80 && descEmojis.size >= 8 && excelOldYearsCount === 0
        });

      } catch (err) {
        addIssue('error', 'excel', `Ошибка чтения Excel файла ${ex.name}`, err.message, 'Проверьте структуру книги Excel');
      }
    }
  }

  // Финальный пересчет
  if (report.summary.errorsCount === 0 && report.summary.warningsCount === 0) {
    report.status = 'PASS';
    report.score = 100;
  } else if (report.summary.errorsCount === 0 && report.summary.warningsCount > 0) {
    report.status = 'WARN';
    report.score = Math.max(70, 100 - (report.summary.warningsCount * 5));
  } else {
    report.status = 'FAIL';
    report.score = Math.max(20, 100 - (report.summary.errorsCount * 15) - (report.summary.warningsCount * 5));
  }

  return report;
}
