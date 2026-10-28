'use client';

import React, { useState, useMemo, useRef } from 'react';
import {
  FileText,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  Info,
  ExternalLink,
  Search,
  Clipboard,
  Upload,
  Save,
  Loader2,
  Trash2,
  Type,
  SlidersHorizontal,
  Layers,
  ArrowRight,
  TrendingUp,
  BarChart2
} from 'lucide-react';
import TagManagerModal from '../tags/TagManagerModal';

/**
 * Normalizes keyword tokens and trims whitespace cleanly around custom delimiters
 */
function parseRawInput(rawText, delimiter) {
  if (!rawText || typeof rawText !== 'string') return [];

  let tokens = [];
  if (delimiter === ',' || delimiter === ', ') {
    tokens = rawText.split(',');
  } else if (delimiter === ';' || delimiter === '; ') {
    tokens = rawText.split(';');
  } else if (delimiter === '\t') {
    tokens = rawText.split('\t');
  } else {
    // Auto or newline
    const lines = rawText.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
    if (lines.length === 1 && lines[0].includes(',') && !lines[0].includes(';')) {
      tokens = lines[0].split(',');
    } else {
      tokens = lines;
    }
  }

  return tokens
    .map((t) => t.replace(/^["'`\s]+|["'`\s]+$/g, '').trim())
    .filter((t) => t.length > 0);
}

export default function Step3Inspector({
  selectedNiche,
  nicheDetail,
  onRefreshDetail,
  activeSegment = null
}) {
  const category = nicheDetail?.niche?.category || selectedNiche?.category || '';
  const collection = nicheDetail?.niche?.collection || selectedNiche?.collection || '';

  // Extract file statuses
  const filesInfo = selectedNiche?.filesInfo || nicheDetail?.niche?.filesInfo || {};

  const hasPininspector = Boolean(
    filesInfo.hasPininspector ??
    selectedNiche?.hasPininspector ??
    nicheDetail?.niche?.hasPininspector ??
    nicheDetail?.hasPininspector
  );

  const hasAllCsv = Boolean(
    filesInfo.hasAllCsv ??
    selectedNiche?.hasAllCsv ??
    nicheDetail?.niche?.hasAllCsv ??
    nicheDetail?.hasAllCsv
  );

  const hasMergedSeeds = Boolean(
    filesInfo.hasPininspectorSeeds ??
    nicheDetail?.niche?.filesInfo?.hasPininspectorSeeds
  );

  // Seed tags content from Step 2
  const seedContent =
    nicheDetail?.niche?.seedTags?.content ??
    nicheDetail?.files?.seedTags?.content ??
    nicheDetail?.seedTags?.content ??
    '';

  const seedTagsList = useMemo(() => {
    return seedContent
      .split(/\r?\n/)
      .map((s) => s.replace(/^["'`\s]+|["'`\s]+$/g, '').trim().toLowerCase())
      .filter(Boolean);
  }, [seedContent]);

  // Form State for Ingestion
  const [inputText, setInputText] = useState('');
  const [inputDelimiter, setInputDelimiter] = useState('auto'); // 'auto', '\n', ',', ';', '\t'
  const [saveAsAllCsv, setSaveAsAllCsv] = useState(true);
  const [allCsvNaming, setAllCsvNaming] = useState(
    collection ? `${collection} (All).csv` : '(All).csv'
  );
  const [defaultVolume, setDefaultVolume] = useState('100');
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState(null); // { type: 'success' | 'error', message: string, stats?: any }
  const [copiedSeeds, setCopiedSeeds] = useState(false);
  const [isTagModalOpen, setIsTagModalOpen] = useState(false);
  const fileInputRef = useRef(null);

  // Parse ingested tags live
  const parsedItems = useMemo(() => {
    return parseRawInput(inputText, inputDelimiter);
  }, [inputText, inputDelimiter]);

  // Live detection of volume and uniqueness
  const { uniqueKeywords, detectedVolumeCount, hasVolumeData } = useMemo(() => {
    const seen = new Set();
    const keywords = [];
    let volCount = 0;

    for (const item of parsedItems) {
      let kw = item;
      let hasVol = false;

      if (item.includes(';')) {
        const parts = item.split(';');
        kw = parts[0];
        if (parts[1] && /^\d+$/.test(parts[1].trim())) hasVol = true;
      } else if (item.includes(',')) {
        const lastIdx = item.lastIndexOf(',');
        const possible = item.slice(lastIdx + 1).trim();
        if (/^\d+$/.test(possible)) {
          kw = item.slice(0, lastIdx);
          hasVol = true;
        }
      }

      const cleanKw = kw.replace(/^["'`\s]+|["'`\s]+$/g, '').trim().toLowerCase();
      if (!cleanKw || cleanKw === 'keyword' || cleanKw === 'keywords') continue;

      if (!seen.has(cleanKw)) {
        seen.add(cleanKw);
        keywords.push(cleanKw);
        if (hasVol) volCount++;
      }
    }

    return {
      uniqueKeywords: keywords,
      detectedVolumeCount: volCount,
      hasVolumeData: volCount > 0
    };
  }, [parsedItems]);

  // Merge calculation with Seed Tags
  const mergeStats = useMemo(() => {
    const seedSet = new Set(seedTagsList);
    let dupes = 0;
    for (const kw of uniqueKeywords) {
      if (seedSet.has(kw)) dupes++;
    }
    const totalMerged = uniqueKeywords.length + seedTagsList.length - dupes;
    return {
      pinTagsCount: uniqueKeywords.length,
      seedTagsCount: seedTagsList.length,
      duplicatesCount: dupes,
      mergedTotal: totalMerged
    };
  }, [uniqueKeywords, seedTagsList]);

  // 1-Click Copy Seeds for Pin Inspector
  const handleCopySeeds = async () => {
    if (!seedContent) return;
    try {
      await navigator.clipboard.writeText(seedContent);
      setCopiedSeeds(true);
      setTimeout(() => setCopiedSeeds(false), 2000);
    } catch (err) {
      console.error('Failed to copy seeds:', err);
    }
  };

  // 1-Click Paste from Clipboard (handles "Copy all keywords" from Pin Inspector)
  const handlePasteClipboard = async () => {
    try {
      const clip = await navigator.clipboard.readText();
      if (clip) {
        setInputText((prev) => (prev ? `${prev}\n${clip}` : clip));
      }
    } catch (err) {
      console.error('Failed to read clipboard:', err);
    }
  };

  // Upload file (.txt or .csv) from Pin Inspector export
  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const raw = event.target?.result;
      if (typeof raw === 'string') {
        setInputText(raw);
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Text cleanup helpers
  const handleToLowercase = () => {
    setInputText((prev) =>
      prev
        .split(/\r?\n/)
        .map((l) => l.toLowerCase())
        .join('\n')
    );
  };

  const handleRemoveDupes = () => {
    const seen = new Set();
    const result = [];
    for (const line of inputText.split(/\r?\n/)) {
      const clean = line.trim().toLowerCase();
      if (clean && !seen.has(clean)) {
        seen.add(clean);
        result.push(line.trim());
      }
    }
    setInputText(result.join('\n'));
  };

  // Save PinInspector tags & generate files
  const handleSavePininspector = async () => {
    if (!category || !collection) {
      setSaveStatus({
        type: 'error',
        message: 'Не выбрана категория или коллекция'
      });
      return;
    }

    if (!inputText.trim()) {
      setSaveStatus({
        type: 'error',
        message: 'Вставьте теги из Pin Inspector перед сохранением'
      });
      return;
    }

    try {
      setIsSaving(true);
      setSaveStatus(null);

      const res = await fetch('/api/niche/tags/pininspector', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category,
          collection,
          segment: activeSegment,
          rawText: inputText,
          delimiter: inputDelimiter,
          saveAsAllCsv,
          allCsvFileName: allCsvNaming,
          defaultVolume: parseInt(defaultVolume, 10) || 100
        })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Ошибка при сохранении тегов Pin Inspector');
      }

      setSaveStatus({
        type: 'success',
        message: data.message,
        stats: data.stats
      });

      if (onRefreshDetail) {
        await onRefreshDetail();
      }
    } catch (err) {
      console.error('Error saving Pininspector tags:', err);
      setSaveStatus({
        type: 'error',
        message: err.message || 'Не удалось сохранить файлы'
      });
    } finally {
      setIsSaving(false);
    }
  };

  const isStepComplete = hasPininspector && hasAllCsv;

  return (
    <div className="w-full bg-white border border-gray-200 rounded-2xl p-6 shadow-xs space-y-6 text-slate-800">
      {/* Step Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-100">
        <div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <span className="flex items-center justify-center w-6 h-6 rounded-full bg-[#E60023] text-white text-xs font-bold shadow-xs">
              3
            </span>
            <h3 className="text-base font-bold text-slate-900">
              Шаг 3: Частотность (Pin Inspector)
            </h3>
            {activeSegment && (
              <span className="text-xs bg-red-50 text-[#E60023] border border-red-200 px-2 py-0.5 rounded-full font-semibold flex items-center gap-1">
                🏷️ {activeSegment}
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Сбор ключевых слов из Pin Inspector, автоматическое слияние с Seed Tags и подготовка файла (All).csv для AI-фильтрации.
          </p>
        </div>

        {/* Global Step Status */}
        <div className="flex items-center gap-2">
          {isStepComplete ? (
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Частотность собрана</span>
            </div>
          ) : (
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>Ожидается сохранение тегов</span>
            </div>
          )}

          <button
            type="button"
            onClick={() => setIsTagModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-white hover:bg-gray-50 text-slate-700 border border-gray-300 transition-colors cursor-pointer shadow-2xs"
          >
            <SlidersHorizontal className="w-3.5 h-3.5 text-[#E60023]" />
            <span>Менеджер тегов ниши</span>
          </button>
        </div>
      </div>

      {/* Instructions & Quick Copy Seeds Card */}
      <div className="bg-red-50/50 border border-red-100/80 rounded-2xl p-4 space-y-3">
        <div className="flex items-start gap-3">
          <Info className="w-5 h-5 text-[#E60023] shrink-0 mt-0.5" />
          <div className="space-y-1 text-xs">
            <div className="font-bold text-slate-900 text-sm">
              Инструкция менеджера для Шага 3:
            </div>
            <p className="text-slate-700 leading-relaxed">
              1. Скопируйте семена тегов кнопкой ниже $\to$ 2. Вставьте в программу <strong className="text-slate-900">Pin Inspector</strong> $\to$ 3. После завершения поиска нажмите в Pin Inspector <strong className="text-slate-900">«Copy all keywords»</strong> или экспортируйте CSV $\to$ 4. Нажмите здесь кнопку <strong className="text-slate-900">«📋 Вставить из буфера»</strong> и сохраните.
            </p>
          </div>
        </div>

        {/* Quick copy seed tags button */}
        {seedContent && (
          <div className="pt-2.5 border-t border-red-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <span className="text-[11px] text-slate-600 font-medium">
              Доступно семян для поиска в Pin Inspector: <strong className="text-slate-900">{seedTagsList.length} шт.</strong>
            </span>
            <button
              type="button"
              onClick={handleCopySeeds}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-white hover:bg-gray-50 text-xs font-semibold text-slate-800 transition-colors border border-gray-300 shadow-2xs cursor-pointer"
            >
              {copiedSeeds ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="text-emerald-700">Семена скопированы!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-[#E60023]" />
                  <span>Скопировать семена ({seedTagsList.length})</span>
                </>
              )}
            </button>
          </div>
        )}
      </div>

      {/* Target Files Indicators */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {/* File 1: Pininspector.txt */}
        <div
          className={`flex items-start justify-between p-3.5 rounded-xl border transition-all ${
            hasPininspector
              ? 'bg-emerald-50/60 border-emerald-200'
              : 'bg-gray-50 border-gray-200'
          }`}
        >
          <div className="flex items-start gap-2.5 min-w-0">
            <div
              className={`p-2 rounded-xl shrink-0 ${
                hasPininspector ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-200 text-slate-500'
              }`}
            >
              <FileText className="w-4 h-4" />
            </div>
            <div className="space-y-0.5 truncate">
              <div className="text-xs font-bold text-slate-900 font-mono truncate">
                Pininspector.txt
              </div>
              <p className="text-[10px] text-slate-500 truncate">
                Сырые теги из парсера
              </p>
            </div>
          </div>

          <div className="shrink-0 ml-2">
            {hasPininspector ? (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-semibold bg-emerald-100 text-emerald-700 border border-emerald-200">
                <CheckCircle2 className="w-3 h-3" />
                <span>Найден</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-medium bg-gray-100 text-slate-600 border border-gray-300">
                <AlertCircle className="w-3 h-3 text-amber-500" />
                <span>Нет</span>
              </span>
            )}
          </div>
        </div>

        {/* File 2: Pininspector + Seeds.txt */}
        <div
          className={`flex items-start justify-between p-3.5 rounded-xl border transition-all ${
            hasPininspector
              ? 'bg-emerald-50/60 border-emerald-200'
              : 'bg-gray-50 border-gray-200'
          }`}
        >
          <div className="flex items-start gap-2.5 min-w-0">
            <div
              className={`p-2 rounded-xl shrink-0 ${
                hasPininspector ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-200 text-slate-500'
              }`}
            >
              <Layers className="w-4 h-4" />
            </div>
            <div className="space-y-0.5 truncate">
              <div className="text-xs font-bold text-slate-900 font-mono truncate">
                Pininspector + Seeds.txt
              </div>
              <p className="text-[10px] text-slate-500 truncate">
                Объединенные теги + семена
              </p>
            </div>
          </div>

          <div className="shrink-0 ml-2">
            {hasPininspector ? (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-semibold bg-emerald-100 text-emerald-700 border border-emerald-200">
                <CheckCircle2 className="w-3 h-3" />
                <span>Готов</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-medium bg-gray-100 text-slate-600 border border-gray-300">
                <AlertCircle className="w-3 h-3 text-amber-500" />
                <span>Нет</span>
              </span>
            )}
          </div>
        </div>

        {/* File 3: (All).csv */}
        <div
          className={`flex items-start justify-between p-3.5 rounded-xl border transition-all ${
            hasAllCsv
              ? 'bg-emerald-50/60 border-emerald-200'
              : 'bg-gray-50 border-gray-200'
          }`}
        >
          <div className="flex items-start gap-2.5 min-w-0">
            <div
              className={`p-2 rounded-xl shrink-0 ${
                hasAllCsv ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-200 text-slate-500'
              }`}
            >
              <FileSpreadsheet className="w-4 h-4" />
            </div>
            <div className="space-y-0.5 truncate">
              <div className="text-xs font-bold text-slate-900 font-mono truncate">
                (All).csv
              </div>
              <p className="text-[10px] text-slate-500 truncate">
                Ключи и Search Volume
              </p>
            </div>
          </div>

          <div className="shrink-0 ml-2">
            {hasAllCsv ? (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-semibold bg-emerald-100 text-emerald-700 border border-emerald-200">
                <CheckCircle2 className="w-3 h-3" />
                <span>Найден</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-medium bg-gray-100 text-slate-600 border border-gray-300">
                <AlertCircle className="w-3 h-3 text-amber-500" />
                <span>Нет</span>
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Main Ingestion Box */}
      <div className="border border-gray-200 rounded-2xl p-5 space-y-4 bg-gray-50/30">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-gray-100">
          <div>
            <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <span>📥 Вставка результатов Pin Inspector</span>
            </h4>
            <p className="text-xs text-slate-500 mt-0.5">
              Вставьте скопированный текст ("Copy all keywords") или перетащите файл с частотностью.
            </p>
          </div>

          {/* Quick Actions Bar */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handlePasteClipboard}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-[#E60023] hover:bg-[#ad081b] text-white shadow-xs transition-colors cursor-pointer"
            >
              <Clipboard className="w-3.5 h-3.5" />
              <span>📋 Вставить из буфера</span>
            </button>

            <input
              ref={fileInputRef}
              type="file"
              accept=".txt,.csv"
              onChange={handleFileUpload}
              className="hidden"
              id="step3-file-input"
            />
            <label
              htmlFor="step3-file-input"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-white hover:bg-gray-100 text-slate-800 border border-gray-300 shadow-2xs transition-colors cursor-pointer"
            >
              <Upload className="w-3.5 h-3.5 text-slate-500" />
              <span>Загрузить файл</span>
            </label>

            <button
              type="button"
              onClick={handleRemoveDupes}
              disabled={!inputText}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-semibold bg-white hover:bg-gray-100 disabled:opacity-50 text-slate-700 border border-gray-300 transition-colors cursor-pointer shadow-2xs"
            >
              <Trash2 className="w-3.5 h-3.5 text-slate-500" />
              <span>Дубли</span>
            </button>

            <button
              type="button"
              onClick={handleToLowercase}
              disabled={!inputText}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-semibold bg-white hover:bg-gray-100 disabled:opacity-50 text-slate-700 border border-gray-300 transition-colors cursor-pointer shadow-2xs"
            >
              <Type className="w-3.5 h-3.5 text-slate-500" />
              <span>Lowercase</span>
            </button>
          </div>
        </div>

        {/* Delimiter & Volume pre-check bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3 rounded-xl border border-gray-200">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-700">Разделитель:</span>
            <select
              value={inputDelimiter}
              onChange={(e) => setInputDelimiter(e.target.value)}
              className="text-xs bg-gray-50 border border-gray-300 rounded-lg px-2.5 py-1 text-slate-800 font-semibold focus:outline-none focus:border-[#E60023]"
            >
              <option value="auto">⚡ Авто (строки / запятые)</option>
              <option value="\n">Построчно (новая строка \n)</option>
              <option value=",">Запятая с пробелом (, пробел учитывается)</option>
              <option value=";">Точка с запятой (;)</option>
              <option value="\t">Табуляция (\t)</option>
            </select>
          </div>

          {/* Volume Indicator Badge */}
          <div>
            {hasVolumeData ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
                <span>Search Volume обнаружен ({detectedVolumeCount} значений)</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-800 border border-blue-200">
                <FileText className="w-3.5 h-3.5 text-blue-600" />
                <span>Плоский список слов ("Copy all keywords")</span>
              </span>
            )}
          </div>
        </div>

        {/* Textarea */}
        <textarea
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="Вставьте сюда результаты из Pin Inspector...&#10;Пример 1 (Copy all keywords):&#10;christmas bundle gift ideas&#10;christmas bundles design&#10;&#10;Пример 2 (с частотностью):&#10;christmas letter ideas;880&#10;christmas quilt set;880"
          rows={9}
          className="w-full p-4 bg-white border border-gray-200 rounded-xl text-xs font-mono text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#E60023] leading-relaxed resize-y shadow-2xs"
        />

        {/* Live Merge Preview & Formula */}
        {uniqueKeywords.length > 0 && (
          <div className="bg-white p-4 rounded-xl border border-gray-200 space-y-3">
            <div className="flex items-center justify-between text-xs font-bold text-slate-900">
              <span className="flex items-center gap-1.5">
                <BarChart2 className="w-4 h-4 text-[#E60023]" />
                <span>Предпросмотр объединения тегов:</span>
              </span>
              <span className="font-mono text-slate-500">
                Готово к генерации
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
              <div className="p-2.5 rounded-xl bg-gray-50 border border-gray-200">
                <span className="text-[10px] text-slate-500 uppercase font-semibold block">Pin Inspector</span>
                <span className="text-base font-bold text-slate-900 font-mono">{mergeStats.pinTagsCount}</span>
              </div>
              <div className="p-2.5 rounded-xl bg-gray-50 border border-gray-200">
                <span className="text-[10px] text-slate-500 uppercase font-semibold block">Seed Tags</span>
                <span className="text-base font-bold text-slate-900 font-mono">{mergeStats.seedTagsCount}</span>
              </div>
              <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200">
                <span className="text-[10px] text-amber-700 uppercase font-semibold block">Дубликаты</span>
                <span className="text-base font-bold text-amber-800 font-mono">-{mergeStats.duplicatesCount}</span>
              </div>
              <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200">
                <span className="text-[10px] text-emerald-700 uppercase font-semibold block">Итого в файле</span>
                <span className="text-base font-bold text-emerald-800 font-mono">{mergeStats.mergedTotal}</span>
              </div>
            </div>
          </div>
        )}

        {/* Search Volume Configuration & Options before Step 4 */}
        <div className="bg-white p-4 rounded-xl border border-gray-200 space-y-3">
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={saveAsAllCsv}
                onChange={(e) => setSaveAsAllCsv(e.target.checked)}
                className="w-4 h-4 text-[#E60023] rounded border-gray-300 focus:ring-[#E60023]"
              />
              <span className="text-xs font-bold text-slate-800">
                Сгенерировать файл (All).csv для Шага 4 (AI Фильтр)
              </span>
            </label>

            {!hasVolumeData && saveAsAllCsv && (
              <span className="text-[11px] text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200 font-medium">
                Частотность будет заполнена стандартным значением ({defaultVolume})
              </span>
            )}
          </div>

          {saveAsAllCsv && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div>
                <span className="text-[11px] text-slate-500 font-semibold block mb-1">
                  Имя CSV-файла:
                </span>
                <input
                  type="text"
                  value={allCsvNaming}
                  onChange={(e) => setAllCsvNaming(e.target.value)}
                  className="w-full px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-xs font-mono text-slate-800 focus:outline-none focus:border-[#E60023]"
                />
              </div>

              {!hasVolumeData && (
                <div>
                  <span className="text-[11px] text-slate-500 font-semibold block mb-1">
                    Дефолтная частотность (Search Volume):
                  </span>
                  <input
                    type="number"
                    value={defaultVolume}
                    onChange={(e) => setDefaultVolume(e.target.value)}
                    className="w-full px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-xs font-mono text-slate-800 focus:outline-none focus:border-[#E60023]"
                  />
                </div>
              )}
            </div>
          )}
        </div>

        {/* Save Status Notification */}
        {saveStatus && (
          <div
            className={`p-3.5 rounded-xl text-xs flex items-center justify-between gap-2 ${
              saveStatus.type === 'success'
                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                : 'bg-red-50 text-red-800 border border-red-200'
            }`}
          >
            <div className="flex items-center gap-2">
              {saveStatus.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
              )}
              <span>{saveStatus.message}</span>
            </div>

            {saveStatus.stats && (
              <span className="font-mono text-[11px] font-bold shrink-0">
                +{saveStatus.stats.mergedCount} тегов объединено
              </span>
            )}
          </div>
        )}

        {/* Bottom Action: Save and Generate Files */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
          <span className="text-xs text-slate-500">
            После сохранения будут сформированы: <code className="font-mono text-slate-800 font-bold">Pininspector.txt</code>, <code className="font-mono text-slate-800 font-bold">Pininspector + Seeds.txt</code> и <code className="font-mono text-slate-800 font-bold">(All).csv</code>.
          </span>

          <button
            type="button"
            onClick={handleSavePininspector}
            disabled={isSaving || uniqueKeywords.length === 0}
            className="inline-flex items-center justify-center gap-2 px-6 py-2.5 bg-[#E60023] hover:bg-[#ad081b] disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer active:scale-98"
          >
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-white" />
                <span>Генерация файлов...</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4 text-white" />
                <span>💾 Сохранить и объединить с Seed Tags</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Connected TagManagerModal */}
      {isTagModalOpen && (
        <TagManagerModal
          isOpen={isTagModalOpen}
          onClose={() => setIsTagModalOpen(false)}
          category={category}
          collection={collection}
          activeSegment={activeSegment}
          currentTags={uniqueKeywords}
          title={`Менеджер тегов ниши: ${collection || 'Теги'}`}
          onApply={(newTags) => {
            setInputText(newTags.join('\n'));
            setIsTagModalOpen(false);
          }}
          onFileSaved={() => {
            if (onRefreshDetail) onRefreshDetail();
          }}
        />
      )}
    </div>
  );
}
