'use client';

import React, { useState, useMemo } from 'react';
import {
  ExternalLink,
  FolderCheck,
  FolderPlus,
  ShoppingBag,
  Layers,
  Zap,
  Loader2,
  CheckCircle2,
  AlertCircle,
  FileCode,
  Check,
  FolderTree,
  Lightbulb,
  Copy,
  SlidersHorizontal,
  ChevronDown,
  ChevronUp,
  Globe,
  Folder,
  Trash2,
  Plus
} from 'lucide-react';
import TagManagerModal from '../tags/TagManagerModal';
import {
  buildArchitectureAdvisorPrompt,
  buildSeedTagsPrompt
} from '@/lib/promptBuilders';

export default function Step1Foundation({
  selectedNiche,
  nicheDetail,
  onInitNiche,
  activeSegment = null
}) {
  const [isInitializing, setIsInitializing] = useState(false);
  const [isCopyingTemplate, setIsCopyingTemplate] = useState(false);
  const [copyStatus, setCopyStatus] = useState(null); // { success: boolean, message: string }

  // Architecture advisor & Link Mode states
  const [isAdvisorOpen, setIsAdvisorOpen] = useState(true);
  const [linkMode, setLinkMode] = useState('online'); // 'online' | 'local'
  const [copiedArchitect, setCopiedArchitect] = useState(false);
  const [copiedSingle, setCopiedSingle] = useState(false);
  const [copiedMulti, setCopiedMulti] = useState(false);
  const [isTagModalOpen, setIsTagModalOpen] = useState(false);

  // Extract category and collection reliably
  const category = nicheDetail?.niche?.category || selectedNiche?.category || '';
  const collection = nicheDetail?.niche?.collection || selectedNiche?.collection || '';
  const title = nicheDetail?.niche?.title || selectedNiche?.title || collection;

  // Title Case helpers for folder naming
  const catTitle = category ? category.charAt(0).toUpperCase() + category.slice(1) : '';
  const collTitle = collection
    ? collection
        .split('-')
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(' ')
    : '';
  const mainFolderName = `${collTitle} ${catTitle}`.trim();

  // Architecture selection before deployment
  const [selectedArch, setSelectedArch] = useState('single_core');
  const [createMainFolder, setCreateMainFolder] = useState(true);
  const [customSegments, setCustomSegments] = useState([]);
  const [newSegmentInput, setNewSegmentInput] = useState('');

  // Total products count
  const productCount =
    nicheDetail?.niche?.totalProducts ??
    selectedNiche?.productCount ??
    selectedNiche?.productsCount ??
    0;

  // Check if keywords directory is initialized
  const isInitialized = Boolean(
    nicheDetail?.niche?.isInitialized ??
    selectedNiche?.isInitialized ??
    selectedNiche?.hasKeywordsDir
  );

  const siteUrl =
    nicheDetail?.niche?.siteUrl ||
    selectedNiche?.siteUrl ||
    (category && collection ? `https://artify-studio.pages.dev/${category}/${collection}` : '#');

  const localPath = `Keywords/Artify Studio/${catTitle}/${collTitle}`;

  // Architecture & segments detected on disk
  const segments = nicheDetail?.niche?.segments || selectedNiche?.segments || [];
  const isMultiSegment =
    (nicheDetail?.niche?.architecture === 'multi_segment' ||
      selectedNiche?.architecture === 'multi_segment') &&
    segments.length > 0;

  // Current seed tags content if available
  const currentSeedContent =
    nicheDetail?.niche?.seedTags?.content ||
    nicheDetail?.files?.seedTags?.content ||
    '';

  // Format segment folder name: "[Collection] [Category] [Segment]"
  const formatSegmentFolderName = (segName) => {
    if (!segName) return '';
    const clean = segName.trim();
    return `${collTitle} ${catTitle} ${clean}`.trim();
  };

  const handleAddSegment = (nameToAdd) => {
    const raw = (nameToAdd || newSegmentInput).trim();
    if (!raw) return;
    const folderName = formatSegmentFolderName(raw);
    if (!customSegments.some((s) => s.name.toLowerCase() === raw.toLowerCase())) {
      setCustomSegments([...customSegments, { name: raw, folderName }]);
    }
    setNewSegmentInput('');
  };

  const handleRemoveSegment = (idx) => {
    setCustomSegments(customSegments.filter((_, i) => i !== idx));
  };

  const handleInit = async () => {
    if (!onInitNiche || isInitializing) return;
    try {
      setIsInitializing(true);
      await onInitNiche(category, collection, {
        architecture: selectedArch,
        createMainFolder,
        segments: customSegments
      });
    } catch (err) {
      console.error('Failed to initialize niche:', err);
    } finally {
      setIsInitializing(false);
    }
  };

  // Copy Streamlit filler template into the niche directory
  const handleCopyStreamlit = async () => {
    if (!category || !collection || isCopyingTemplate) return;
    try {
      setIsCopyingTemplate(true);
      setCopyStatus(null);
      const res = await fetch('/api/niche/copy-template', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category,
          collection,
          segment: activeSegment
        })
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Ошибка при копировании Streamlit скрипта');
      }
      setCopyStatus({
        success: true,
        message: data.message || 'Скрипт ai_auto_content_filler_UI.py скопирован в нишу!'
      });
      setTimeout(() => setCopyStatus(null), 4000);
    } catch (err) {
      console.error('Failed to copy Streamlit template:', err);
      setCopyStatus({ success: false, message: err.message });
      setTimeout(() => setCopyStatus(null), 4000);
    } finally {
      setIsCopyingTemplate(false);
    }
  };

  // Apply Seed Tags from TagManagerModal
  const handleApplySeedTags = async (tags) => {
    if (!category || !collection) return;
    try {
      const res = await fetch('/api/niche/detail', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category,
          collection,
          segment: activeSegment,
          seedTagsContent: tags.join('\n')
        })
      });
      const data = await res.json();
      if (data.success) {
        setCopyStatus({
          success: true,
          message: `Сохранено ${tags.length} тегов в Seed Tags.txt`
        });
        setTimeout(() => setCopyStatus(null), 4000);
      }
    } catch (err) {
      console.error('Failed to save seed tags from modal:', err);
    }
  };

  // Dynamic Architect Prompts with linkMode toggle
  const advisorPromptObj = useMemo(() => {
    return buildArchitectureAdvisorPrompt({
      category,
      collection,
      siteUrl,
      localPath,
      pathMode: linkMode,
      productsJson: nicheDetail?.niche?.products || null
    });
  }, [category, collection, siteUrl, localPath, linkMode, nicheDetail]);

  const singleCoreSeedPrompt = useMemo(() => {
    return buildSeedTagsPrompt({
      category,
      collection,
      siteUrl,
      localPath,
      pathMode: linkMode,
      architecture: 'single_core'
    }).promptText;
  }, [category, collection, siteUrl, localPath, linkMode]);

  const multiSegmentSeedPrompt = useMemo(() => {
    const segList = customSegments.length > 0 ? customSegments : segments;
    return buildSeedTagsPrompt({
      category,
      collection,
      siteUrl,
      localPath,
      pathMode: linkMode,
      architecture: 'multi_segment',
      segments: segList
    }).promptText;
  }, [category, collection, siteUrl, localPath, linkMode, customSegments, segments]);

  const handleCopyText = async (text, setter) => {
    try {
      await navigator.clipboard.writeText(text);
      setter(true);
      setTimeout(() => setter(false), 2000);
    } catch (err) {
      console.error('Failed to copy text:', err);
    }
  };

  return (
    <div className="w-full bg-white border border-gray-200 rounded-2xl p-6 shadow-xs space-y-6 text-slate-800">
      {/* Step Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-100">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="flex items-center justify-center w-6 h-6 rounded-full bg-[#E60023] text-white text-xs font-bold shadow-xs">
              1
            </span>
            <h3 className="text-base font-bold text-slate-900">
              Шаг 1: Фундамент ниши
            </h3>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Проверка наличия контента в каталоге Artify Studio, структуры папок в Keywords и архитектуры сегментов.
          </p>
        </div>

        {/* Keywords Status Badge */}
        <div className="flex items-center gap-2">
          {isInitialized ? (
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
              <FolderCheck className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Развернута в Keywords</span>
            </div>
          ) : (
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>Не развернута в Keywords</span>
            </div>
          )}
        </div>
      </div>

      {/* Grid of info parameters */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Category & Collection */}
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 space-y-1">
          <div className="flex items-center gap-1.5 text-slate-500 text-xs font-medium">
            <Layers className="w-3.5 h-3.5 text-slate-400" />
            <span>Категория и коллекция</span>
          </div>
          <div className="text-sm font-bold text-slate-900 truncate">
            {title}
          </div>
          <div className="text-xs text-slate-500 font-mono">
            {category || '—'} / {collection || '—'}
          </div>
        </div>

        {/* Product Count */}
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 space-y-1">
          <div className="flex items-center gap-1.5 text-slate-500 text-xs font-medium">
            <ShoppingBag className="w-3.5 h-3.5 text-slate-400" />
            <span>Товаров на сайте</span>
          </div>
          <div className="text-lg font-bold text-slate-900">
            {productCount} <span className="text-xs font-normal text-slate-500">шт.</span>
          </div>
          <div className="text-xs text-slate-500">
            {productCount > 0 ? 'Каталог all_products.json готов' : 'Товары не найдены'}
          </div>
        </div>

        {/* Site Link */}
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 space-y-1 flex flex-col justify-between">
          <div className="flex items-center gap-1.5 text-slate-500 text-xs font-medium">
            <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
            <span>Витрина Artify Studio</span>
          </div>
          <div className="truncate">
            <a
              href={siteUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#E60023] hover:underline transition-colors mt-0.5 truncate"
            >
              <span className="truncate">{siteUrl}</span>
              <ExternalLink className="w-3.5 h-3.5 shrink-0" />
            </a>
          </div>
          <div className="text-[11px] text-slate-400">
            Открыть веб-витрину в новой вкладке
          </div>
        </div>
      </div>

      {/* Model Indicator: Single Core vs Multi-Segment */}
      <div className="p-4 rounded-xl bg-gray-50 border border-gray-200 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <FolderTree className="w-4 h-4 text-[#E60023]" />
            <span className="text-xs font-bold text-slate-900">
              Архитектурная модель ниши:
            </span>
          </div>

          <div className="flex items-center gap-2">
            {isMultiSegment ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-red-50 text-[#E60023] border border-red-200">
                <span>🔴</span>
                <span>Мульти-сегмент (Multi-Segment)</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-gray-100 text-slate-700 border border-gray-200">
                <span>⚪</span>
                <span>Моно-ядро (Single Core)</span>
              </span>
            )}
          </div>
        </div>

        {/* List of Detected Segments (if Multi-Segment) */}
        {isMultiSegment && (
          <div className="pt-2 border-t border-gray-200/60 space-y-2">
            <p className="text-xs text-slate-500">
              Обнаружено изолированных подниш-сегментов: <strong className="text-slate-800">{segments.length}</strong>. Каждый сегмент формирует независимый пул ключевых слов и таблиц.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 pt-1">
              {segments.map((seg) => (
                <div
                  key={seg.name}
                  className={`p-2.5 rounded-xl border text-xs flex items-center justify-between gap-2 ${
                    activeSegment === seg.name
                      ? 'bg-red-50/70 border-red-200 text-[#E60023] font-semibold'
                      : 'bg-white border-gray-200 text-slate-700'
                  }`}
                >
                  <div className="truncate">
                    <span className="truncate block font-medium">🏷️ {seg.name}</span>
                    <span className="text-[10px] text-slate-400 font-mono truncate block">
                      {seg.path || seg.name}
                    </span>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-gray-100 text-slate-600 font-mono shrink-0">
                    {seg.completedCount ?? 0}/8
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 💡 Архитектурный Советник ДО Развертывания */}
      <div className="bg-gradient-to-br from-red-50/60 via-white to-red-50/20 border border-red-200/80 rounded-2xl p-5 space-y-4 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-[#E60023] text-white shrink-0">
              <Lightbulb className="w-4 h-4" />
            </span>
            <div>
              <h4 className="text-sm font-bold text-slate-900">
                💡 Архитектурный Советник ДО Развертывания
              </h4>
              <p className="text-[11px] text-slate-500">
                Определите правильную архитектуру ниши перед сбором семантики, чтобы не переделывать папки
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {/* Link Mode Switcher: Online Cloudflare vs Local Project Path */}
            <div className="flex items-center bg-white border border-red-200/80 rounded-xl p-0.5 shadow-2xs text-[11px]">
              <button
                type="button"
                onClick={() => setLinkMode('online')}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
                  linkMode === 'online'
                    ? 'bg-[#E60023] text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title="Использовать публичную ссылку на Cloudflare Pages витрину (для онлайн нейросетей ChatGPT, Claude)"
              >
                <Globe className="w-3 h-3" />
                <span>Онлайн URL</span>
              </button>
              <button
                type="button"
                onClick={() => setLinkMode('local')}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
                  linkMode === 'local'
                    ? 'bg-[#E60023] text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title="Использовать локальный путь к папке Keywords (удобно для локальных агентов Antigravity)"
              >
                <Folder className="w-3 h-3" />
                <span>Локальный путь</span>
              </button>
            </div>

            <button
              type="button"
              onClick={() => setIsAdvisorOpen(!isAdvisorOpen)}
              className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
            >
              {isAdvisorOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {isAdvisorOpen && (
          <div className="space-y-4 pt-1 border-t border-red-100">
            {/* Visual Differences Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
              {/* Single Core Explanation */}
              <div className="p-3.5 bg-white border border-gray-200 rounded-xl space-y-1.5 shadow-2xs">
                <div className="flex items-center gap-1.5 font-bold text-slate-800">
                  <span>⚪ Моно-ядро (Single Core)</span>
                </div>
                <p className="text-slate-600 text-[11px] leading-relaxed">
                  Подходит для узких однородных подборок (1 тип продукта). Вся коллекция имеет <strong>один файл (All).csv</strong>, один файл <code>Filter by OpenAI.csv</code> и 4 доски.
                </p>
                <div className="text-[10px] text-slate-500 font-mono bg-gray-50 p-1.5 rounded border border-gray-100">
                  Пример: Wedding Invitations, Christmas Snowman, Baby Cliparts
                </div>
              </div>

              {/* Multi-Segment Explanation */}
              <div className="p-3.5 bg-white border border-red-200 rounded-xl space-y-1.5 shadow-2xs">
                <div className="flex items-center gap-1.5 font-bold text-[#E60023]">
                  <span>🔴 Мульти-сегмент (Multi-Segment)</span>
                </div>
                <p className="text-slate-600 text-[11px] leading-relaxed">
                  Необходим, если коллекция включает разные категории (Clipart, Fonts, Planners, SVG). Каждая подниша получает <strong>свою независимую структуру папок</strong> и собственные доски.
                </p>
                <div className="text-[10px] text-slate-500 font-mono bg-red-50/50 p-1.5 rounded border border-red-100">
                  Пример: Christmas Bundles (Fonts, Clipart, Planners)
                </div>
              </div>
            </div>

            {/* Prompt Buttons & Seed Previews */}
            <div className="space-y-3 pt-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-800">
                    Инженерные промпты для проектирования:
                  </span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-gray-100 text-slate-600">
                    Режим: {linkMode === 'online' ? '🌐 Cloudflare URL' : '📁 Локальная папка'}
                  </span>
                </div>

                {/* Primary Button: Copy Architect Prompt for AI */}
                <button
                  type="button"
                  onClick={() => handleCopyText(advisorPromptObj.promptText, setCopiedArchitect)}
                  className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-[#E60023] hover:bg-[#ad081b] text-white font-semibold text-xs rounded-xl shadow-xs transition-colors cursor-pointer"
                >
                  {copiedArchitect ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-white" />
                      <span>Скопировано в буфер!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>📋 Скопировать промпт Архитектора для AI</span>
                    </>
                  )}
                </button>
              </div>

              {/* Previews for Seed Tags Prompts (Single Core vs Multi-Segment) */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                {/* Single Core Seed Preview */}
                <div className="bg-white border border-gray-200 rounded-xl p-3.5 space-y-2 flex flex-col justify-between shadow-2xs">
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-800">Семена для Моно-Ядра</span>
                      <span className="text-[10px] font-mono text-slate-400">25–40 seeds</span>
                    </div>
                    <pre className="p-2.5 bg-gray-50 border border-gray-200 rounded-lg text-[11px] font-mono text-slate-700 max-h-24 overflow-y-auto leading-relaxed">
                      {singleCoreSeedPrompt}
                    </pre>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleCopyText(singleCoreSeedPrompt, setCopiedSingle)}
                    className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-slate-800 text-xs font-semibold rounded-lg border border-gray-300 transition-colors cursor-pointer"
                  >
                    {copiedSingle ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        <span className="text-emerald-700">Скопировано!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5 text-slate-500" />
                        <span>Копировать промпт Моно-семян</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Multi-Segment Seed Preview */}
                <div className="bg-white border border-gray-200 rounded-xl p-3.5 space-y-2 flex flex-col justify-between shadow-2xs">
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-800">Семена для Мульти-Сегмента</span>
                      <span className="text-[10px] font-mono text-slate-400">
                        {customSegments.length > 0 ? `${customSegments.length} сегментов` : 'по 20-30 на сегмент'}
                      </span>
                    </div>
                    <pre className="p-2.5 bg-gray-50 border border-gray-200 rounded-lg text-[11px] font-mono text-slate-700 max-h-24 overflow-y-auto leading-relaxed">
                      {multiSegmentSeedPrompt}
                    </pre>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleCopyText(multiSegmentSeedPrompt, setCopiedMulti)}
                    className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-slate-800 text-xs font-semibold rounded-lg border border-gray-300 transition-colors cursor-pointer"
                  >
                    {copiedMulti ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        <span className="text-emerald-700">Скопировано!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5 text-slate-500" />
                        <span>Копировать промпт Мульти-семян</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Button to open TagManagerModal directly to import/save Seed Tags */}
              <div className="pt-2 flex items-center justify-between flex-wrap gap-2">
                <span className="text-xs text-slate-500">
                  Уже есть готовые семена тегов из чата?
                </span>
                <button
                  type="button"
                  onClick={() => setIsTagModalOpen(true)}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-white hover:bg-gray-50 text-slate-800 text-xs font-semibold rounded-xl border border-gray-300 shadow-2xs transition-colors cursor-pointer"
                >
                  <SlidersHorizontal className="w-3.5 h-3.5 text-[#E60023]" />
                  <span>📥 Импорт / Редактирование семян в TagManagerModal</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 🚀 ВЫБОР АРХИТЕКТУРЫ РАЗВЕРТЫВАНИЯ (МОНО VS МУЛЬТИ-СЕГМЕНТ) */}
      {!isInitialized && (
        <div className="bg-white border border-gray-200 rounded-2xl p-5 space-y-4 shadow-xs">
          <div className="space-y-1">
            <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <FolderTree className="w-4 h-4 text-[#E60023]" />
              <span>Способ развертывания ниши в Keywords</span>
            </h4>
            <p className="text-xs text-slate-500">
              Выберите способ создания структуры папок. Для мульти-сегмента названия папок подниш форматируются автоматически.
            </p>
          </div>

          {/* Radio Options Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {/* Option 1: Single-Core */}
            <div
              onClick={() => setSelectedArch('single_core')}
              className={`p-4 rounded-xl border-2 transition-all cursor-pointer space-y-2 ${
                selectedArch === 'single_core'
                  ? 'border-[#E60023] bg-red-50/40 shadow-xs'
                  : 'border-gray-200 bg-gray-50/60 hover:bg-gray-100/60'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-900 flex items-center gap-2">
                  <span className="text-sm">⚪</span>
                  <span>Моно-ядро (Single Core)</span>
                </span>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-white border border-gray-200 text-slate-600">
                  По умолчанию
                </span>
              </div>
              <p className="text-[11px] text-slate-600 leading-relaxed">
                Единая папка ниши. Подходит для узких однородных коллекций (один формат товаров).
              </p>
              <div className="text-[10px] font-mono text-slate-500 bg-white p-2 rounded-lg border border-gray-200 truncate">
                📁 Keywords/Artify Studio/{catTitle}/{collTitle}/
              </div>
            </div>

            {/* Option 2: Multi-Segment */}
            <div
              onClick={() => setSelectedArch('multi_segment')}
              className={`p-4 rounded-xl border-2 transition-all cursor-pointer space-y-2 ${
                selectedArch === 'multi_segment'
                  ? 'border-[#E60023] bg-red-50/40 shadow-xs'
                  : 'border-gray-200 bg-gray-50/60 hover:bg-gray-100/60'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-900 flex items-center gap-2">
                  <span className="text-sm">🔴</span>
                  <span>Мульти-сегмент (Multi-Segment)</span>
                </span>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-red-100 text-[#E60023]">
                  Для смешанных ниш
                </span>
              </div>
              <p className="text-[11px] text-slate-600 leading-relaxed">
                Изолированные папки для подниш (Fonts, Clipart, Planners и т.д.) со своими досками и тегами.
              </p>
              <div className="text-[10px] font-mono text-slate-500 bg-white p-2 rounded-lg border border-gray-200 truncate">
                📁 Keywords/.../{collTitle} {catTitle} [Сегмент]/
              </div>
            </div>
          </div>

          {/* Multi-Segment configuration block */}
          {selectedArch === 'multi_segment' && (
            <div className="pt-3 border-t border-gray-100 space-y-3 animate-in fade-in duration-150">
              {/* Checkbox: Main folder */}
              <label className="flex items-center gap-2 text-xs font-semibold text-slate-800 cursor-pointer">
                <input
                  type="checkbox"
                  checked={createMainFolder}
                  onChange={(e) => setCreateMainFolder(e.target.checked)}
                  className="rounded border-gray-300 text-[#E60023] focus:ring-[#E60023]"
                />
                <span>
                  Создать главную общую папку: <code className="bg-gray-100 px-1.5 py-0.5 rounded font-mono text-[#E60023]">{mainFolderName || `${collection} ${category}`}</code>
                </span>
              </label>

              {/* Add segment input */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-700">
                  Добавьте сегменты (автоформат папок: <span className="font-mono text-slate-500">{collTitle} {catTitle} [Сегмент]</span>):
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={newSegmentInput}
                    onChange={(e) => setNewSegmentInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddSegment();
                      }
                    }}
                    placeholder="Например: Fonts, Invitations, Shower, Planners, Clipart..."
                    className="flex-1 px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-[#E60023]"
                  />
                  <button
                    type="button"
                    onClick={() => handleAddSegment()}
                    className="px-4 py-2 bg-[#E60023] hover:bg-[#ad081b] text-white text-xs font-semibold rounded-xl shadow-xs transition-colors cursor-pointer"
                  >
                    + Добавить
                  </button>
                </div>

                {/* Suggestion chips */}
                <div className="flex items-center gap-1.5 flex-wrap pt-1">
                  <span className="text-[11px] text-slate-400">Быстрые пресеты:</span>
                  {['Clipart', 'Fonts', 'Invitations', 'Shower', 'Planners', 'SVG', 'Patterns', 'Sublimation'].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => handleAddSegment(preset)}
                      className="text-[11px] px-2 py-0.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-slate-700 border border-gray-200 transition-colors cursor-pointer"
                    >
                      + {preset}
                    </button>
                  ))}
                </div>
              </div>

              {/* List of configured segments */}
              {customSegments.length > 0 ? (
                <div className="space-y-1.5 pt-2">
                  <span className="text-xs font-bold text-slate-800">
                    Будут созданы следующие папки сегментов ({customSegments.length} шт.):
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {customSegments.map((seg, idx) => (
                      <div
                        key={idx}
                        className="p-2.5 bg-gray-50 border border-gray-200 rounded-xl flex items-center justify-between gap-2 text-xs"
                      >
                        <div className="truncate">
                          <span className="font-semibold text-slate-900 block truncate">🏷️ {seg.name}</span>
                          <span className="text-[10px] font-mono text-slate-500 block truncate">📁 {seg.folderName}</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveSegment(idx)}
                          className="p-1 hover:bg-red-50 text-slate-400 hover:text-red-600 rounded-lg transition-colors cursor-pointer shrink-0"
                          title="Удалить сегмент"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <p className="text-[11px] text-amber-700 bg-amber-50 p-2.5 rounded-xl border border-amber-200">
                  ⚠️ Вы выбрали Мульти-сегмент, но еще не добавили ни одного сегмента. Введите название (напр. <code>Fonts</code>, <code>Invitations</code>) и нажмите «+ Добавить».
                </p>
              )}
            </div>
          )}
        </div>
      )}

      {/* Action Buttons: Init Niche / Copy Streamlit */}
      <div className="flex flex-wrap items-center gap-3 pt-1">
        {/* If NOT initialized: Init Button */}
        {!isInitialized ? (
          <button
            type="button"
            onClick={handleInit}
            disabled={isInitializing}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#E60023] hover:bg-[#ad081b] disabled:opacity-50 text-white font-semibold text-xs rounded-xl shadow-xs transition-colors cursor-pointer"
          >
            {isInitializing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Разворачиваем...</span>
              </>
            ) : (
              <>
                <Zap className="w-4 h-4" />
                <span>
                  {selectedArch === 'multi_segment'
                    ? `⚡ Развернуть Мульти-сегмент в Keywords (${customSegments.length + (createMainFolder ? 1 : 0)} папок)`
                    : '⚡ Развернуть нишу в Keywords (Моно-ядро)'}
                </span>
              </>
            )}
          </button>
        ) : (
          /* When initialized: Button [📄 Скопировать Streamlit в нишу] */
          <button
            type="button"
            onClick={handleCopyStreamlit}
            disabled={isCopyingTemplate}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-slate-800 border border-gray-300 font-semibold text-xs rounded-xl shadow-2xs transition-colors cursor-pointer active:scale-98"
          >
            {isCopyingTemplate ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin text-[#E60023]" />
                <span>Копирование...</span>
              </>
            ) : (
              <>
                <FileCode className="w-3.5 h-3.5 text-[#E60023]" />
                <span>📄 Скопировать Streamlit в нишу</span>
              </>
            )}
          </button>
        )}

        {/* Copy Status Feedback */}
        {copyStatus && (
          <div
            className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold ${
              copyStatus.success
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                : 'bg-red-50 text-[#E60023] border border-red-200'
            }`}
          >
            {copyStatus.success ? (
              <Check className="w-4 h-4 text-emerald-600" />
            ) : (
              <AlertCircle className="w-4 h-4 text-red-600" />
            )}
            <span>{copyStatus.message}</span>
          </div>
        )}
      </div>

      {/* Success banner if initialized */}
      {isInitialized && (
        <div className="flex items-center gap-2.5 p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 font-medium">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>
            Фундамент настроен: папка ниши активна в Keywords, товары синхронизированы. Вы можете переходить к шагу 2 (Семена тегов).
          </span>
        </div>
      )}

      {/* Connected TagManagerModal for Seed Tags */}
      {isTagModalOpen && (
        <TagManagerModal
          isOpen={isTagModalOpen}
          onClose={() => setIsTagModalOpen(false)}
          currentTags={currentSeedContent}
          title={`Менеджер семян тегов (Seed Tags): ${title}`}
          onApply={handleApplySeedTags}
        />
      )}
    </div>
  );
}
