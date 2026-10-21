import fs from 'fs';
import path from 'path';
import { getPromptTemplatesPath, findKeywordFolder, getProjectRoot } from './paths.js';

export const UNIVERSAL_STOP_WORDS = [
  '2021', '2022', '2023', '2024', '2025',
  'adobe', 'canva', 'creative fabrica', 'creative market',
  'design bundles', 'etsy', 'font bundles', 'fonts',
  'goodnotes', 'illustrator', 'journaling', 'notion',
  'photoshop', 'planners', 'sublimation', 'svg'
];

export const PRODUCT_KEYWORDS = {
  svg: ['svg', 'svgs', 'cut file', 'cut files'],
  clipart: ['clipart', 'clip art'],
  font: ['font', 'fonts', 'typeface', 'typography'],
  planner: ['planner', 'planners'],
  sublimation: ['sublimation', 'sublimate'],
  sticker: ['sticker', 'stickers'],
  journal: ['journal', 'journaling'],
  pattern: ['pattern', 'patterns', 'seamless']
};

/**
 * 1. Dynamic Strategy Context:
 * Detects whether the directory is an overarching Filter or a specific Intent.
 */
export function detectFileType(stratPathOrName = '') {
  const name = path.basename(stratPathOrName || '');
  const isFilter = /filter/i.test(name);
  if (isFilter) {
    return {
      fileType: 'ОБЩИЙ (Filter by OpenAI)',
      isFilter: true,
      description:
        '📌 ТИП ФАЙЛА: ОБЩИЙ (Filter by OpenAI) — теги РАЗНОРОДНЫЕ.\n' +
        'Пиши ШИРЕ. Тексты должны работать для ВСЕХ тегов одновременно. Используй слова уровня ниши, не уходи в узкую под-тему.'
    };
  }
  return {
    fileType: 'ИНТЕНТ',
    isFilter: false,
    description:
      '📌 ТИП ФАЙЛА: ИНТЕНТ — теги ОДНОРОДНЫЕ.\n' +
      'Можно писать ЧУТЬ конкретнее, но не привязывайся к одному объекту. Картинки внутри интента похожи, но всё равно разные.'
  };
}

/**
 * 2. Dynamic Sibling Stop-Words:
 * Inspects sibling directories in parentDir, extracting distinguishing words
 * and merging with universal stop-words.
 */
export function extractSiblingStopWords(stratPath, baseDir = null) {
  const stopWords = new Set(UNIVERSAL_STOP_WORDS);

  if (!stratPath) {
    return Array.from(stopWords).sort((a, b) => a.localeCompare(b));
  }

  const resolvedStrat = path.resolve(stratPath);
  const stratName = path.basename(resolvedStrat);
  let nicheDir = path.dirname(resolvedStrat);
  let parentDir = path.dirname(nicheDir);

  if (!fs.existsSync(parentDir) || parentDir === nicheDir) {
    if (baseDir && fs.existsSync(baseDir)) {
      parentDir = path.resolve(baseDir);
      nicheDir = resolvedStrat;
    }
  }

  const nicheBasename = path.basename(nicheDir);
  const currentCompareStr = `${nicheBasename} ${stratName}`.toLowerCase();

  if (fs.existsSync(parentDir) && fs.statSync(parentDir).isDirectory()) {
    try {
      const entries = fs.readdirSync(parentDir);
      for (const sibling of entries) {
        if (sibling.startsWith('.')) continue;
        const siblingPath = path.join(parentDir, sibling);
        try {
          if (!fs.statSync(siblingPath).isDirectory()) continue;
        } catch {
          continue;
        }
        if (sibling === nicheBasename || sibling === stratName) continue;

        // Split sibling names by whitespace and punctuation
        const parts = sibling.split(/[\s_\-–—,.;:!?()[\]{}'"]+/);
        for (const word of parts) {
          const wLower = word.toLowerCase().trim();
          if (wLower.length > 2 && !currentCompareStr.includes(wLower)) {
            stopWords.add(wLower);
          }
        }
      }
    } catch {
      // Ignore read errors
    }
  }

  return Array.from(stopWords).sort((a, b) => a.localeCompare(b));
}

/**
 * 3. Product Type Detection:
 * Matches tag content against known digital product keywords.
 */
export function detectProductTypes(tagsText = '') {
  const text = (tagsText || '').toLowerCase();
  const detected = [];

  for (const [product, keywords] of Object.entries(PRODUCT_KEYWORDS)) {
    if (keywords.some((kw) => text.includes(kw))) {
      detected.push(product);
    }
  }

  return detected;
}

function safeRead(filePath) {
  try {
    if (fs.existsSync(filePath)) {
      return fs.readFileSync(filePath, 'utf-8').trim();
    }
  } catch {
    // Ignore error
  }
  return '';
}

function findFirstStrategyFolder(baseDir) {
  if (!baseDir || !fs.existsSync(baseDir)) return null;

  try {
    const entries = fs.readdirSync(baseDir);
    // Direct child check
    for (const entry of entries) {
      if (entry.startsWith('.')) continue;
      const entryPath = path.join(baseDir, entry);
      if (!fs.statSync(entryPath).isDirectory()) continue;
      if (fs.existsSync(path.join(entryPath, 'For Main'))) {
        return entryPath;
      }
    }

    // Sub-sub directory check (e.g. Bundles Christmas Clipart / 1 Bundles Christmas Clipart Filter by OpenAI)
    for (const entry of entries) {
      if (entry.startsWith('.')) continue;
      const entryPath = path.join(baseDir, entry);
      if (!fs.statSync(entryPath).isDirectory()) continue;
      const subEntries = fs.readdirSync(entryPath);
      for (const sub of subEntries) {
        if (sub.startsWith('.')) continue;
        const subPath = path.join(entryPath, sub);
        if (fs.existsSync(path.join(subPath, 'For Main'))) {
          return subPath;
        }
      }
    }
  } catch {
    // Ignore error
  }

  return null;
}

/**
 * 4. Generates Prompt 0: Architecture Advisor (Single-Core vs Multi-Segment).
 * Analyzes product assortment and determines optimal architecture.
 */
import { buildArchitectureAdvisorPrompt, buildSeedTagsPrompt } from './promptBuilders.js';
export { buildArchitectureAdvisorPrompt, buildSeedTagsPrompt };

/**
 * 6. Generate Master-Orchestrator Prompt (Step 6)
 */
export function buildMasterOrchestratorPrompt({
  stratPath = '',
  baseDir = '',
  boardName = '',
  tags = '',
  siteUrl = '',
  stopWords = null,
  productTypes = null,
  fileTypeDesc = ''
} = {}) {
  const root = getProjectRoot();

  // Resolve directory pointers
  let effectiveStrat = stratPath ? path.resolve(stratPath) : '';
  let effectiveBase = baseDir ? path.resolve(baseDir) : '';

  if (effectiveStrat && !effectiveBase) {
    const nicheDir = path.dirname(effectiveStrat);
    effectiveBase = path.dirname(nicheDir);
  }

  // Load files from disk if effectiveStrat exists
  let loadedBoard = boardName;
  let loadedTags = tags;
  let loadedUrl = siteUrl;

  if (effectiveStrat && fs.existsSync(effectiveStrat)) {
    const forMain = path.join(effectiveStrat, 'For Main');
    if (!loadedBoard) {
      loadedBoard = safeRead(path.join(forMain, 'Boards_Name.txt'));
    }
    if (!loadedTags) {
      loadedTags = safeRead(path.join(forMain, 'Boards_Tags.txt'));
    }
    if (!loadedUrl) {
      loadedUrl =
        safeRead(path.join(forMain, 'linksite.txt')) ||
        safeRead(path.join(forMain, 'Link_Site.txt')) ||
        (effectiveBase ? safeRead(path.join(effectiveBase, 'linksite.txt')) : '');
    }
  }

  const finalBoard = loadedBoard || '{boardName}';
  const finalUrl = loadedUrl || '{siteUrl}';
  const finalTags = loadedTags || '{tags}';

  // Context & stop words
  const typeInfo = fileTypeDesc
    ? { description: fileTypeDesc }
    : detectFileType(effectiveStrat || '');
  const sortedStopWords =
    stopWords && Array.isArray(stopWords)
      ? Array.from(new Set(stopWords)).sort((a, b) => a.localeCompare(b))
      : extractSiblingStopWords(effectiveStrat, effectiveBase);

  const detectedProducts =
    productTypes && Array.isArray(productTypes)
      ? productTypes
      : detectProductTypes(finalTags);

  const productLabel =
    detectedProducts.length > 0
      ? detectedProducts.map((p) => p.charAt(0).toUpperCase() + p.slice(1)).join(', ')
      : 'Digital Design Resources';

  const stopWordsListStr = sortedStopWords.join(', ');

  const promptText =
`Ты — Мастер-Оркестратор для Pinterest. Я продвигаю товар через массовые аккаунты.
Я прикрепил файл json с информацией по нашей подборке товара на сайте (детально изучи его, чтобы понять что пользователь получит при переходе с Pinterest).

═══ КОНТЕКСТ БИЗНЕСА ═══
Мы скрапим картинки из Pinterest по тегам, размещаем их на аккаунтах с Title + Description + CTA. CTA содержит ссылку на наш сайт. Мы НЕ знаем заранее, какая картинка попадётся — поэтому тексты должны подходить к ЛЮБОЙ картинке из выдачи по тегам.

📋 Доска: ${finalBoard}
🔗 Ссылка на сайт: ${finalUrl}
${typeInfo.description}

Теги доски (контекст для ключевых слов, НЕ вставляй дословно в тексты):
${finalTags}

🚫 СТОП-СЛОВА И ЗАПРЕЩЁННЫЕ ТЕМЫ (строго нельзя упоминать в текстах):
${stopWordsListStr}
Эти слова относятся к СОСЕДНИМ поднишам, которые продвигаются ОТДЕЛЬНО, к конкурирующему ПО или к устаревшим годам. НИКОГДА не используй их в текстах. Если тема граничит с одним из стоп-слов — используй более общий термин.

═══ ЗАДАНИЕ ═══
Сделай на английском:
1) РОВНО 100 ЗАГОЛОВКОВ (не 99, не 80, не 105 — точно 100 строк) (без эмодзи, без знаков препинания в конце, 3-8 слов, содержат ключевые слова из тегов естественно вписанные)
2) РОВНО 100 ОПИСАНИЙ (не 99, не 80, не 105 — точно 100 строк) (⚠️ ОБЯЗАТЕЛЬНО в КАЖДОЙ строке ставь эмодзи по смыслу к содержанию и тегам в самом начале предложения — это требование не снимается ни при каких условиях, без артикля "A" в начале, без призыва к действию внутри, 1-2 предложения, должны подходить к ЛЮБОЙ картинке из выдачи по данным тегам.)
3) РОВНО 100 ПРИЗЫВОВ К ДЕЙСТВИЮ — CTA (не 99, не 80, не 105 — точно 100 строк) (⚠️ ОБЯЗАТЕЛЬНО в КАЖДОЙ строке ставь эмодзи по смыслу в самом начале — это требование не снимается ни при каких условиях, одно короткое предложение, призыв перейти скачать наш товар бесплатно на сайте с подборкой лучшего товара, разные формулировки — не повторяться. Тип товара с Заглавной (например: ${productLabel}))

═══ ПРАВИЛА ФОРМАТА ═══
- Каждый список помести в ОТДЕЛЬНЫЙ блок кода (\`\`\`). В ответе РОВНО 3 блок(ов) кода.
- Без нумерации, без пустых строк между строками внутри блока.
- Только сами тексты, ничего лишнего.

═══ ПРАВИЛА КАЧЕСТВА (КРИТИЧЕСКИ ВАЖНО) ═══
1. УНИКАЛЬНОСТЬ: ВСЕ 100 строк в каждом блоке уникальны. Нельзя написать одну фразу и повторить с разными эмодзи. Используй разные синонимы, разную структуру предложений, разные углы (качество, стиль, применение, эмоция, выгода, тренд).

2. ЗОЛОТОЕ ПРАВИЛО: Рандомный title[17] + рандомный desc[42] + рандомный cta[88] должны ИДЕАЛЬНО сочетаться и подходить к ЛЮБОЙ картинке из выдачи.

3. ПРИНЦИП МАКСИМАЛЬНОЙ ГЛУБИНЫ: Погружайся в тематику ГЛУБОКО, но останавливайся в точке, где ЛЮБОЙ пин из ЛЮБОГО тега всё ещё подходит под текст. Не слишком общо (скучно) и не слишком узко (не подойдёт к большинству картинок).

4. ВИЗУАЛЬНЫЙ СТИЛЬ: Слова типа «watercolor», «boho», «vintage», «minimalist» — используй ТОЛЬКО если они есть в ПОДАВЛЯЮЩЕМ БОЛЬШИНСТВЕ тегов. Иначе пиши нейтрально: «digital», «beautiful», «stunning designs».

5. ДАТЫ: Мы живем в 2026-2027 годах. Категорически НЕ используй 2021-2025!

6. В CTA: В 70% строк используй слово FREE (БОЛЬШИМИ БУКВАМИ). Название типа товара с Заглавной (${productLabel}). НЕ упоминай названия ПО (Canva, Adobe, Procreate, GoodNotes).

7. ЭМОДЗИ: В Описаниях и CTA — эмодзи в начале КАЖДОЙ строки. ⚠️ ПРАВИЛО РЕЛЕВАНТНОСТИ И РАЗНООБРАЗИЯ: Эмодзи должны СТРОГО соответствовать тематике ниши! Ищи максимально широкое разнообразие внутри логики ниши (уникально и красиво), но без абсурда. Недопустимо лениво крутить 3-4 одинаковых эмодзи на все 100 строк — используй весь арсенал релевантных (например, 15-25 идеально подходящих). Для CTA также разрешается миксовать их со стандартными «кнопочными» эмодзи конверсии для Pinterest которые дают большую конверсию.
В Заголовках — БЕЗ эмодзи, БЕЗ знаков препинания в конце.

═══ САМОПРОВЕРКА ПЕРЕД ОТПРАВКОЙ ═══
Перед выводом ОБЯЗАТЕЛЬНО проверь:
✅ В каждом блоке РОВНО 100 строк (не 80, не 99, не 105)? Если нет — допиши/удали.
✅ Все 100 строк уникальны (нет дублей даже с разными эмодзи)?
✅ В desc и CTA эмодзи стоит в начале КАЖДОЙ строки без исключения?
✅ Ни одно стоп-слово не просочилось?
✅ Нет старых годов (2021-2025)?
Если хоть одна проверка FAIL — исправь перед выводом.`;

  return {
    promptText,
    board: finalBoard,
    siteUrl: finalUrl,
    tags: finalTags,
    stopWords: sortedStopWords,
    productTypes: detectedProducts,
    productLabel,
    fileType: typeInfo.fileType,
    fileTypeDesc: typeInfo.description
  };
}

/**
 * Extracts and personalizes prompts from PROMPT_TEMPLATES.md for the selected niche,
 * with Step 6 dynamically powered by the Master-Orchestrator context engine.
 */
export function getContextualPrompts(category = '', collection = '', title = '', options = {}) {
  const filePath = getPromptTemplatesPath();
  const root = getProjectRoot();

  // Find actual folder in Keywords if exists
  let localPath = `Keywords/Artify Studio/${category ? category.charAt(0).toUpperCase() + category.slice(1) : '[Категория]'}/${collection ? collection.charAt(0).toUpperCase() + collection.slice(1) : '[Подборка]'}`;
  let baseKeywordDir = null;

  if (category && collection) {
    const kw = findKeywordFolder(category, collection);
    if (kw) {
      baseKeywordDir = kw;
      localPath = path.relative(root, kw);
    }
  }

  const siteUrl = category && collection
    ? `https://artify-studio.pages.dev/${category.toLowerCase()}/${collection.toLowerCase()}`
    : 'https://artify-studio.pages.dev/[категория]/[подборка]';

  const nicheName = title || (collection ? `${category} ${collection}` : '[Название Ниши]');

  // Resolve strategy path for dynamic Master-Orchestrator prompt
  let stratPath = options?.stratPath || options?.path || '';
  if (!stratPath && baseKeywordDir) {
    stratPath = findFirstStrategyFolder(baseKeywordDir) || '';
  }

  const architecture = options?.architecture || 'single_core';
  const segments = options?.segments || [];
  const productsJson = options?.productsJson || null;

  const archAdvisor = buildArchitectureAdvisorPrompt({
    category,
    collection,
    siteUrl: siteUrl.includes('[') ? '' : siteUrl,
    productsJson
  });

  const seedSingle = buildSeedTagsPrompt({
    category,
    collection,
    siteUrl: siteUrl.includes('[') ? '' : siteUrl,
    architecture: 'single_core'
  });

  const seedMulti = buildSeedTagsPrompt({
    category,
    collection,
    siteUrl: siteUrl.includes('[') ? '' : siteUrl,
    architecture: 'multi_segment',
    segments
  });

  const orchestrator = buildMasterOrchestratorPrompt({
    stratPath,
    baseDir: baseKeywordDir || '',
    siteUrl: siteUrl.includes('[') ? '' : siteUrl
  });

  const prompt1Template =
`Ты — Senior Pinterest Search Strategist и Product Taxonomist Artify Studio.
Работаешь автономно в Antigravity, но не меняешь архитектуру сайта и не создаёшь папки до явного одобрения пользователя.

ТВОЯ ЦЕЛЬ:
Создать точные англоязычные seed tags для одной collection Artify Studio: "${nicheName}".
Эти seeds будут вставлены в PinInspector, чтобы получить широкий, но релевантный список Pinterest keywords для дальнейшей фильтрации.

ВХОДНЫЕ ДАННЫЕ:
- Ниша: ${nicheName}
- URL на сайте: ${siteUrl}
- Локальный путь ниши: ${localPath}

ГЛАВНЫЙ ПРИНЦИП:
Одна collection = один search / buyer intent.
Не смешивай в одном seed-наборе разные типы товаров, use cases или визуальные миры.

ОБЯЗАТЕЛЬНЫЙ ФИЛЬТР КАЖДОГО SEED TAG:
1. ТОВАР: Запрос должен вести к digital product, который разрешён для данной collection.
2. НИША: Запрос обязан попадать в тему и URL выбранной collection (${nicheName}).
3. ПОКУПАТЕЛЬСКИЙ СЦЕНАРИЙ: Пользователь по этому запросу должен искать именно этот asset.
4. ВИЗУАЛЬНАЯ ВЫДАЧА: Pinterest-выдача по тегу должна быть визуально совместима с товарами коллекции.

ФОРМАТ И КАЧЕСТВО SEEDS:
- Только английский язык, lowercase.
- Строго 2–4 слова. Никаких однословных или 5+ слов.
- Без решёток, кавычек, эмодзи, частотности и нумерации.
- Без слов 'free', 'download', 'etsy', 'amazon', чужих брендов.
- Сгенерируй от 25 до 40 проверенных семян для вставки в Seed Tags.txt.`;

  const prompt2Template =
`Ты — Senior Pinterest SEO Auditor и Главный Фильтр Семантики проекта Artify Studio.
Твоя задача — провести бескомпромиссную очистку спарсенного семантического ядра для ниши "${nicheName}".

ВХОДНЫЕ ДАННЫЕ:
- Ниша: ${nicheName}
- Посадочный URL: ${siteUrl}
- Путь к спарсенным тегам: ${localPath}/(All).csv

КРИТЕРИИ ОТБОРА (5 ТЕСТОВ ПОКУПАТЕЛЯ):
1. Тест релевантности товара: человек ищет именно этот digital product?
2. Тест намерения: это коммерческий/крафтерский поиск, а не праздное любопытство?
3. Тест старых годов: СТРОЖАЙШЕ ЗАПРЕЩЕНЫ ГОДЫ 2021, 2022, 2023, 2024, 2025! Если тег содержит старый год — немедленно удали или замени на 2026/2027.
4. Тест брендов: удаляй любые бренды конкурентов (Etsy, Creative Fabrica, Cricut, Silhouette, Disney и т.д.).
5. Длина: отсекай бессмысленные хвосты длиннее 4 слов.

ВЫХОДНОЙ ФОРМАТ:
Сохрани результат в CSV-файл: "${localPath}/${collection || '[Подборка]'} (Filter by OpenAI).csv"
Строго без лишних колонок: Keyword, Search Volume.`;

  const prompt3Template =
`Ты — Head of Pinterest Board Architecture Artify Studio.
Разбей очищенное семантическое ядро ниши "${nicheName}" на 4–6 изолированных интент-групп.

КОНТЕКСТ:
- Путь: ${localPath}
- Исходный файл: (Filter by OpenAI).csv

ПРАВИЛА КЛАСТЕРИЗАЦИИ:
1. Интенты строятся вокруг АУДИТОРИИ и ФОРМАТА ИСПОЛЬЗОВАНИЯ (Use-Case), а не просто визуальных стилей.
2. Количество групп: строго от 4 до 6 (не раздувай до 15 и не сжимай до 2).
3. Каждая группа должна содержать минимум 30–80 тегов.
4. Для каждой группы придумай:
   - Номер и Название интента (например, "2 ${collection || '[Подборка]'} Intent Crafting")
   - Название доски Boards_Name (в Title Case, широкое, покрывающее группу)
   - Список тегов для Boards_Tags.txt`;

  const collCap = collection ? collection.charAt(0).toUpperCase() + collection.slice(1) : '[Подборка]';

  const prompt4Template =
`Создай Python-скрипт генератора имён аккаунтов Pinterest для ниши "${nicheName}".

ФАЙЛ ДЛЯ СОХРАНЕНИЯ:
All Folders/!Generators/Name_Account_Generator/Design_${collCap}.py

ТРЕБОВАНИЯ К КОДУ:
- 3 независимых массива слов: prefixes (30+), cores (40+), suffixes (30+).
- Все слова должны строго соответствовать нише "${nicheName}" и быть профессиональными.
- Никаких случайных цифр на конце.
- Функция generate_account_name() возвращает красивое уникальное имя аккаунта в Title Case.`;

  const prompt5Template =
`Создай Python-скрипт генератора описаний профилей Pinterest для ниши "${nicheName}".

ФАЙЛ ДЛЯ СОХРАНЕНИЯ:
All Folders/!Generators/Description_Generator/Description_${collCap}.py

ТРЕБОВАНИЯ:
- Шаблоны описаний профиля (bio) с акцентом на цифровые товары высокого качества.
- Органичное упоминание бесплатного скачивания и ссылки на сайт: ${siteUrl}
- Минимум 25 разнообразных вариаций фраз.
- Функция generate_profile_description() возвращает уникальное описание до 160 символов.`;

  const prompt6Template = orchestrator.promptText;

  const prompt7Template =
`Ты — Senior QA Auditor. Твоя задача — провести ПОЛНЫЙ аудит готовой ниши перед боевым запуском на Pinterest.

ВХОД:
Путь к корню ниши: ${localPath}
Целевой лендинг: ${siteUrl}

КРИТИЧЕСКИ ВАЖНО:
Ты НЕ ПРАВИШЬ ничего сам! Скрипты имеют право ТОЛЬКО ЧИТАТЬ файлы.
Ты НАХОДИШЬ проблемы, ПОКАЗЫВАЕШЬ их и ПРЕДЛАГАЕШЬ точные решения.

ЧЕК-ЛИСТ ПРОВЕРКИ:
1. КАРТА НИШИ: Все ли нумерованные папки на месте? Есть ли For Main/ в каждой?
2. ТЕГИ: Проверь Seed Tags.txt и Filter by OpenAI.csv. Нет ли старых годов (2021-2025)? Нет ли чужих брендов?
3. BOARDS: Названия досок в Title Case? Теги в Boards_Tags.txt соответствуют интенту?
4. ГЕНЕРАТОРЫ: Существуют ли файлы из Name_Accounts.txt и Description_Generator.txt в All Folders/!Generators/?
5. EXCEL: Ровно ли 100 уникальных строк? Начинаются ли Description и CTA с эмодзи? Разнообразны ли эмодзи (≥10 видов)? Присутствует ли триггер FREE?
6. ДАТЫ: Нет ли упоминаний старых годов 2021, 2022, 2023, 2024, 2025 в Excel и тегах?`;

  const prompts = [
    {
      id: 'step-0-architecture',
      step: 0,
      title: 'Промпт 0: Архитектурный Советник (Моно-ядро vs Мульти-сегмент)',
      category: 'Архитектура',
      description: 'Определение оптимальной архитектурной модели ниши (Моно-ядро vs Мульти-сегмент) перед развертыванием папок.',
      purpose: 'Анализ товарного ассортимента и выбор архитектуры: одно общее ядро или изолированные подниши-сегменты',
      whyNeeded: 'Предотвращает ошибки в структуре папок и смешивание разнородной семантики до начала парсинга',
      whenToUse: 'Шаг 0: До начала парсинга и создания структуры ниши',
      manualCopyPrompt: archAdvisor.promptText,
      template: archAdvisor.promptText
    },
    {
      id: 'step-1-seeds-single',
      step: 1,
      title: 'Промпт 1.1: Сбор семян для Моно-ядра',
      category: 'Исследование',
      description: 'Автономный сбор 25–40 узких англоязычных seed tags для единого моно-ядра ниши.',
      purpose: 'Сбор высокочастотных семантических семян (25-40 seeds) для моно-ядра в PinInspector',
      whyNeeded: 'Формирует чистое стартовое ядро без брендов и мусора для однородной коллекции',
      whenToUse: 'Шаг 1: Исследование и сбор семян для моно-ядра',
      manualCopyPrompt: seedSingle.promptText,
      template: seedSingle.promptText
    },
    {
      id: 'step-1-seeds-multi',
      step: 1,
      title: 'Промпт 1.2: Сбор семян для Мульти-сегментной архитектуры',
      category: 'Исследование',
      description: 'Сбор изолированных пулов seed tags (по 20-30 на сегмент) для сложной мульти-сегментной ниши.',
      purpose: 'Формирование независимых наборов семян для каждого сегмента без смысловых пересечений',
      whyNeeded: 'Гарантирует чистоту поисковой выдачи для каждого типа товара внутри большой ниши',
      whenToUse: 'Шаг 1: Исследование и сбор семян для мульти-сегментов',
      manualCopyPrompt: seedMulti.promptText,
      template: seedMulti.promptText
    },
    {
      id: 'step-1-seeds',
      step: 1,
      title: architecture === 'multi_segment' ? 'Промпт 1: Сбор семян (Мульти-сегмент)' : 'Промпт 1.2: Сбор семян тегов (Seed Tags)',
      category: 'Исследование',
      description: architecture === 'multi_segment' ? seedMulti.promptText : prompt1Template,
      purpose: 'Сбор высокочастотных семантических семян (25-40 seeds) для парсинга в PinInspector',
      whyNeeded: 'Позволяет охватить релевантный поисковый спрос Pinterest без попадания в мусорные или некоммерческие запросы',
      whenToUse: 'Шаг 1: Исследование и сбор первичной семантики',
      manualCopyPrompt: architecture === 'multi_segment' ? seedMulti.promptText : prompt1Template,
      template: architecture === 'multi_segment' ? seedMulti.promptText : prompt1Template
    },
    {
      id: 'step-2-filter',
      step: 4,
      title: 'Промпт 2.1: Автономный AI Filter (Очистка тегов)',
      category: 'Семантика',
      description: 'Глубокая смысловая фильтрация спарсенных тегов с детекцией старых годов и 5 тестами покупателя.',
      purpose: 'Очистка сырой базы тегов через 5 тестов покупателя и удаление брендов/старых годов',
      whyNeeded: 'Исключает нецелевой трафик, брендовые нарушения и устаревшие запросы 2021-2025 гг.',
      whenToUse: 'Шаг 4: Фильтрация семантики после парсинга',
      manualCopyPrompt: prompt2Template,
      template: prompt2Template
    },
    {
      id: 'step-3-clusters',
      step: 5,
      title: 'Промпт 3: Кластеризация по Интентам (4–6 Досок)',
      category: 'Кластеризация',
      description: 'Разбивка очищенного ядра на 4–6 изолированных групп по аудитории и сценарию применения.',
      purpose: 'Кластеризация семантики на 4–6 независимых досок по сценарию применения',
      whyNeeded: 'Структурирует доски под разные покупательские интенты (crafting, vintage, objects и т.д.)',
      whenToUse: 'Шаг 5: Архитектура досок',
      manualCopyPrompt: prompt3Template,
      template: prompt3Template
    },
    {
      id: 'step-4-name-generator',
      step: 5,
      title: 'Промпт 4: Генератор Имён Аккаунтов (Name Generator)',
      category: 'Генераторы',
      description: 'Создание Python-скрипта случайной генерации профессиональных имён аккаунтов.',
      purpose: 'Создание генератора уникальных профильных имен аккаунтов Pinterest',
      whyNeeded: 'Обеспечивает разнообразие и естественность сотен аккаунтов при масс-постинге',
      whenToUse: 'Шаг 5: Подготовка аккаунтов',
      manualCopyPrompt: prompt4Template,
      template: prompt4Template
    },
    {
      id: 'step-5-desc-generator',
      step: 5,
      title: 'Промпт 5: Генератор Описаний Аккаунтов (Description Generator)',
      category: 'Генераторы',
      description: 'Создание Python-скрипта генерации богатых bio-описаний аккаунтов с призывом к действию.',
      purpose: 'Создание генератора bio-описаний профилей с призывом к переходу',
      whyNeeded: 'Повышает конверсию из профиля на сайт с триггером бесплатного скачивания',
      whenToUse: 'Шаг 5: Подготовка аккаунтов',
      manualCopyPrompt: prompt5Template,
      template: prompt5Template
    },
    {
      id: 'step-6-excel',
      step: 6,
      title: 'Мастер-Оркестратор (100 Заголовков / 100 Описаний / 100 CTA)',
      category: 'Контент',
      description: 'Строгая генерация 100 уникальных строк контента: эмодзи, Titles без эмодзи, CTA с триггером FREE.',
      purpose: 'Генерирует 300 строк коммерческого контента для заполнения Excel книги пинов (100 Titles + 100 Descriptions + 100 CTAs)',
      whyNeeded: 'Критически важен для Pinterest SEO: создает естественные вариации ключей без переспама, добавляет релевантные эмодзи и триггер FREE для максимального CTR',
      whenToUse: 'Шаг 6: Генерация контента (после разбиения на интенты и создания папок)',
      manualCopyPrompt: prompt6Template,
      template: prompt6Template,
      context: {
        board: orchestrator.board,
        siteUrl: orchestrator.siteUrl,
        fileType: orchestrator.fileType,
        productTypes: orchestrator.productTypes,
        productLabel: orchestrator.productLabel,
        stopWordsCount: orchestrator.stopWords.length
      }
    },
    {
      id: 'step-7-audit',
      step: 7,
      title: 'Промпт 7.1: Финальный QA Аудит Ниши (Pre-Launch Gate)',
      category: 'Контроль Качества',
      description: 'Автономная глубокая ревизия всех файлов ниши, Excel-метрик, генераторов и дат перед боевым запуском.',
      purpose: 'Комплексный предаудит готовности папок ниши, тегов, генераторов и Excel файлов перед запуском',
      whyNeeded: 'Предотвращает бан аккаунтов и слив трафика из-за битых ссылок, пустых ячеек или дат 2021-2025',
      whenToUse: 'Шаг 7: Финальный аудит перед запуском',
      manualCopyPrompt: prompt7Template,
      template: prompt7Template
    }
  ];

  return prompts;
}
