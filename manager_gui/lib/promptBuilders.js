/**
 * Client-safe Prompt Builders (no Node.js 'fs' dependencies)
 */

export function buildArchitectureAdvisorPrompt({
  category = '',
  collection = '',
  siteUrl = '',
  localPath = '',
  pathMode = 'online',
  productsJson = null
} = {}) {
  const nicheName = collection
    ? (category ? `${category} ${collection}` : collection)
    : '[Название Ниши]';
  const effectiveCategory = category || '[Категория]';
  const effectiveCollection = collection || '[Подборка]';
  const finalUrl = siteUrl || `https://artify-studio.pages.dev/${effectiveCategory.toLowerCase()}/${effectiveCollection.toLowerCase()}`;
  const effectiveLocalPath = localPath || `Keywords/Artify Studio/${effectiveCategory}/${effectiveCollection}`;

  let productsSnippet = '(Товары коллекции не переданы в явном виде. Ориентируйся на тематику витрины, категорию и подборку.)';
  if (productsJson) {
    if (typeof productsJson === 'string') {
      productsSnippet = productsJson.trim();
    } else {
      try {
        productsSnippet = JSON.stringify(productsJson, null, 2);
      } catch {
        productsSnippet = String(productsJson);
      }
    }
  }

  const inputTargetStr = pathMode === 'local'
    ? `- Локальная папка проекта (Antigravity): ${effectiveLocalPath}\n- Каталог товаров: all_products.json (в папке ниши)`
    : `- URL витрины (Cloudflare): ${finalUrl}`;

  const promptText =
`Ты — Senior Pinterest Search Strategist и Архитектор Семантики Artify Studio.
Твоя цель: определить оптимальную архитектурную модель для продвижения ниши "${nicheName}" на Pinterest перед сбором семантики и развертыванием папок:
1) МОНО-ЯДРО (Single Core) — если товарная подборка однородна, представляет один тип продуктов (напр. только Clipart или только Fonts) и единый поисковый интент покупателей.
2) МУЛЬТИ-СЕГМЕНТ (Multi-Segment) — если ассортимент содержит разные категории товаров (Clipart, Fonts, SVG, Planners, Sublimation) или разные независимые целевые аудитории.

═══ ВХОДНЫЕ ДАННЫЕ ═══
- Ниша: ${nicheName}
- Категория: ${effectiveCategory} / Коллекция: ${effectiveCollection}
${inputTargetStr}

Товары витрины:
${productsSnippet}

═══ КРИТЕРИИ АРХИТЕКТУРНОГО ВЫБОРА ═══
- Однородный ли ассортимент или включает разнородные форматы товаров?
- Одинаковый ли поисковый интент (search / buyer intent) у аудитории?
- Требуются ли изолированные папки, независимые доски и разные генераторы под каждый сегмент?

═══ ЗАДАНИЕ ═══
1. Проанализируй товарный ассортимент коллекции.
2. Вынеси аргументированный вердикт: МОНО-ЯДРО или МУЛЬТИ-СЕГМЕНТ с подробным обоснованием логики.
3. Если МУЛЬТИ-СЕГМЕНТ:
   - Предложи список из 3–6 изолированных подниш-сегментов с их точными англоязычными названиями с учетом специфики ниши "${nicheName}".
   - Для каждого сегмента сформируй первичный пул из 15–25 точных англоязычных seed tags без брендов и мусора (строго 2–4 слова, lowercase, коммерческий интент).
4. Если МОНО-ЯДРО:
   - Сформируй единый список из 25–40 точных проверенных англоязычных seed tags для вставки в Seed Tags.txt (2–4 слова, lowercase, коммерческий интент, без брендов и мусора).`;

  return {
    promptText,
    category: effectiveCategory,
    collection: effectiveCollection,
    siteUrl: finalUrl,
    localPath: effectiveLocalPath,
    pathMode,
    nicheName,
    toString() {
      return this.promptText;
    }
  };
}

export function buildSeedTagsPrompt({
  category = '',
  collection = '',
  siteUrl = '',
  localPath = '',
  pathMode = 'online',
  architecture = 'single_core',
  segments = []
} = {}) {
  const nicheName = collection
    ? (category ? `${category} ${collection}` : collection)
    : '[Название Ниши]';
  const effectiveCategory = category || '[Категория]';
  const effectiveCollection = collection || '[Подборка]';
  const finalUrl = siteUrl || `https://artify-studio.pages.dev/${effectiveCategory.toLowerCase()}/${effectiveCollection.toLowerCase()}`;
  const effectiveLocalPath = localPath || `Keywords/Artify Studio/${effectiveCategory}/${effectiveCollection}`;

  const isMulti = architecture === 'multi_segment' || (Array.isArray(segments) && segments.length > 0);

  const inputTargetStr = pathMode === 'local'
    ? `- Локальная папка проекта (Antigravity): ${effectiveLocalPath}\n- Каталог товаров: all_products.json (в папке ниши)`
    : `- URL витрины (Cloudflare): ${finalUrl}`;

  let promptText = '';

  if (isMulti) {
    let segmentsListStr = '';
    if (Array.isArray(segments) && segments.length > 0) {
      segmentsListStr = segments
        .map((s, idx) => {
          const segName = typeof s === 'string' ? s : (s.name || `Сегмент ${idx + 1}`);
          return `- Сегмент ${idx + 1}: ${segName}`;
        })
        .join('\n');
    } else {
      segmentsListStr =
`- Выдели ключевые направления товаров для коллекции "${nicheName}" и сформируй блоки тегов под каждое направление.`;
    }

    promptText =
`Ты — Senior Pinterest Search Strategist Artify Studio.
Создай изолированные пулы seed tags (по 20-30 seeds на сегмент) для МУЛЬТИ-СЕГМЕНТНОЙ ниши "${nicheName}".

ВХОДНЫЕ ДАННЫЕ:
- Ниша: ${nicheName}
${inputTargetStr}
- Архитектурная модель: Мульти-сегмент (Multi-Segment)

СЕГМЕНТЫ ДЛЯ ГЕНЕРАЦИИ:
${segmentsListStr}

ОБЯЗАТЕЛЬНЫЕ ПРАВИЛА:
1. Для каждого сегмента сформируй отдельный независимый список тегов без смысловых пересечений.
2. Только английский язык, lowercase.
3. Строго 2–4 слова в каждом теге. Никаких однословных или 5+ слов.
4. Без чужих брендов (Etsy, Canva, Cricut, Silhouette, Disney, Amazon) и слов 'free', 'download'.
5. Строго коммерческий / крафтерский покупательский интент.
6. Выведи результат отдельными блоками кода под каждый сегмент.`;
  } else {
    promptText =
`Ты — Senior Pinterest Search Strategist и Product Taxonomist Artify Studio.
Работаешь автономно в Antigravity, но не меняешь архитектуру сайта и не создаёшь папки до явного одобрения пользователя.

ТВОЯ ЦЕЛЬ:
Создать точные англоязычные seed tags (25–40 seeds) для МОНО-ЯДРА коллекции: "${nicheName}".
Эти seeds будут вставлены в PinInspector, чтобы получить широкий, но релевантный список Pinterest keywords для дальнейшей фильтрации.

ВХОДНЫЕ ДАННЫЕ:
- Ниша: ${nicheName}
${inputTargetStr}
- Архитектурная модель: Моно-ядро (Single Core)

ГЛАВНЫЙ ПРИНЦИП:
Одна collection = один search / buyer intent.
Не смешивай в одном seed-наборе разные типы товаров, use cases или визуальные миры.

ОБЯЗАТЕЛЬНЫЙ ФИЛЬТР КАЖДОГО SEED TAG:
1. ТОВАР: Запрос должен вести к digital product, который разрешён для данной collection.
2. НИША: Запрос обязан попадать в тему выбранной collection (${nicheName}).
3. ПОКУПАТЕЛЬСКИЙ СЦЕНАРИЙ: Пользователь по этому запросу должен искать именно этот asset.
4. ВИЗУАЛЬНАЯ ВЫДАЧА: Pinterest-выдача по тегу должна быть визуально совместима с товарами коллекции.

ФОРМАТ И КАЧЕСТВО SEEDS:
- Только английский язык, lowercase.
- Строго 2–4 слова. Никаких однословных или 5+ слов.
- Без решёток, кавычек, эмодзи, частотности и нумерации.
- Без слов 'free', 'download', 'etsy', 'amazon', чужих брендов.
- Сгенерируй от 25 до 40 проверенных семян для вставки в Seed Tags.txt.
- Формат: только список тегов, по одному на строку в блоке кода.`;
  }

  return {
    promptText,
    architecture: isMulti ? 'multi_segment' : 'single_core',
    segments: Array.isArray(segments) ? segments : [],
    category: effectiveCategory,
    collection: effectiveCollection,
    siteUrl: finalUrl,
    localPath: effectiveLocalPath,
    pathMode,
    nicheName,
    toString() {
      return this.promptText;
    }
  };
}
