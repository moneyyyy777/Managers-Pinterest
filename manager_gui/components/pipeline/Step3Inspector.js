'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
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
  BarChart2,
  Scissors,
  FolderOpen,
  Filter,
  Play,
  Terminal,
  Zap,
  Globe
} from 'lucide-react';
import TagManagerModal from '../tags/TagManagerModal';

/**
 * Splits and trims tokens by any custom or preset delimiter
 */
function parseTokens(rawText, delimiter, customDelim = '') {
  if (!rawText || typeof rawText !== 'string') return [];

  const delimToUse = customDelim && delimiter === 'custom' ? customDelim : delimiter;
  let tokens = [];

  if (delimToUse && delimToUse !== 'auto' && delimToUse !== '\n') {
    tokens = rawText.split(delimToUse);
  } else {
    // Auto or newline
    const lines = rawText.split(/\r?\n/);
    if (lines.length === 1 && lines[0].includes(',') && !lines[0].includes(';')) {
      tokens = lines[0].split(',');
    } else if (lines.length === 1 && lines[0].includes(';')) {
      tokens = lines[0].split(';');
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

  // Exact check for Pininspector + Seeds.txt
  const hasMergedSeeds = Boolean(
    filesInfo.hasPininspectorSeeds ??
    selectedNiche?.hasPininspectorSeeds ??
    nicheDetail?.niche?.filesInfo?.hasPininspectorSeeds ??
    nicheDetail?.hasPininspectorSeeds
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

  // Standard (All).csv naming convention: "[Segment or Collection] (All).csv"
  const defaultCsvFileName = useMemo(() => {
    const baseName = activeSegment || collection || selectedNiche?.collection || 'Keywords';
    return `${baseName} (All).csv`;
  }, [activeSegment, collection, selectedNiche]);

  // Form State
  const [inputText, setInputText] = useState('');
  const [inputDelimiter, setInputDelimiter] = useState('auto'); // 'auto', '\n', ',', ';', '\t', '|', 'custom'
  const [customDelimiterStr, setCustomDelimiterStr] = useState('');
  const [savePininspectorTxt, setSavePininspectorTxt] = useState(true);
  const [saveMergedSeeds, setSaveMergedSeeds] = useState(true);
  const [saveAsAllCsv, setSaveAsAllCsv] = useState(true);
  const [allCsvNaming, setAllCsvNaming] = useState(defaultCsvFileName);
  const [defaultVolume, setDefaultVolume] = useState('100');
  const [maxWordsCount, setMaxWordsCount] = useState(4);
  const [saveLongWordsToFile, setSaveLongWordsToFile] = useState(true);

  // Async States
  const [isSaving, setIsSaving] = useState(false);
  const [isMerging, setIsMerging] = useState(false);
  const [saveStatus, setSaveStatus] = useState(null);
  const [splitNotice, setSplitNotice] = useState(null);
  const [copiedSeeds, setCopiedSeeds] = useState(false);
  const [isTagModalOpen, setIsTagModalOpen] = useState(false);
  const [isLoadingExistingFile, setIsLoadingExistingFile] = useState(false);

  // SearchVolume Runner state
  const [isSearchVolumeRunning, setIsSearchVolumeRunning] = useState(false);
  const [searchVolumeLogs, setSearchVolumeLogs] = useState('');
  const [showSearchVolumeLogs, setShowSearchVolumeLogs] = useState(false);
  const [chromeRunning, setChromeRunning] = useState(false);
  const [useSystemVpn, setUseSystemVpn] = useState(true);

  const fileInputRef = useRef(null);

  // Auto-sync CSV name if active segment or collection changes
  useEffect(() => {
    setAllCsvNaming(defaultCsvFileName);
  }, [defaultCsvFileName]);

  // Check Chrome status periodically or on mount
  useEffect(() => {
    const checkStatus = async () => {
      try {
        const res = await fetch('/api/services/run-searchvolume');
        if (res.ok) {
          const data = await res.json();
          setChromeRunning(Boolean(data.chromeRunning));
          setIsSearchVolumeRunning(Boolean(data.isRunning));
          if (data.recentLogs) setSearchVolumeLogs(data.recentLogs);
        }
      } catch {}
    };
    checkStatus();
    const interval = setInterval(checkStatus, 5000);
    return () => clearInterval(interval);
  }, []);

  // Parse items live
  const parsedItems = useMemo(() => {
    return parseTokens(inputText, inputDelimiter, customDelimiterStr);
  }, [inputText, inputDelimiter, customDelimiterStr]);

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
        const v = parts[1]?.trim().replace(/[,.\s']/g, '');
        if (v && /^\d+$/.test(v)) hasVol = true;
      } else if (item.includes(',')) {
        const lastIdx = item.lastIndexOf(',');
        const possible = item.slice(lastIdx + 1).trim().replace(/[,.\s']/g, '');
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

  // Action: 1-Click direct merge of Pininspector.txt + Seed Tags.txt on disk
  const handleDirectMerge = async () => {
    if (!category || !collection) return;
    try {
      setIsMerging(true);
      setSaveStatus(null);
      const res = await fetch('/api/niche/tags/pininspector/merge', {
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
        throw new Error(data.error || 'Ошибка слияния тегов');
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
      console.error('Error merging Pininspector + Seeds:', err);
      setSaveStatus({
        type: 'error',
        message: err.message || 'Не удалось объединить файлы'
      });
    } finally {
      setIsMerging(false);
    }
  };

  // Action: Filter out tags with word count > maxWordsCount
  const handleFilterMaxWords = async () => {
    if (!inputText.trim()) return;
    const lines = inputText.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
    const short = [];
    const long = [];

    for (const line of lines) {
      const kwPart = line.includes(';')
        ? line.split(';')[0].trim()
        : (line.includes(',') ? line.split(',')[0].trim() : line);
      const wordCount = kwPart.split(/\s+/).filter(Boolean).length;
      if (wordCount > maxWordsCount) {
        long.push(line);
      } else {
        short.push(line);
      }
    }

    setInputText(short.join('\n'));

    if (saveLongWordsToFile && long.length > 0 && category && collection) {
      try {
        let existingLong = [];
        try {
          const checkRes = await fetch(
            `/api/niche/files?category=${encodeURIComponent(category)}&collection=${encodeURIComponent(collection)}&file=More%204%20Words%20Tags.txt${activeSegment ? `&segment=${encodeURIComponent(activeSegment)}` : ''}`
          );
          if (checkRes.ok) {
            const data = await checkRes.json();
            if (data.file?.content) {
              existingLong = data.file.content.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
            }
          }
        } catch {}

        const mergedLong = Array.from(new Set([...existingLong, ...long]));

        await fetch('/api/niche/files', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            category,
            collection,
            segment: activeSegment,
            relativePath: 'More 4 Words Tags.txt',
            content: mergedLong.join('\n') + '\n'
          })
        });
      } catch (err) {
        console.error('Failed to save More 4 Words Tags.txt:', err);
      }
    }

    setSplitNotice(`Очищено: оставлено ${short.length} тегов, отсеяно ${long.length} длинных тегов. Длинные теги сохранены в More 4 Words Tags.txt!`);
    setTimeout(() => setSplitNotice(null), 4500);
  };

  // Action: Paste from clipboard directly for Search Volume (with auto-filter of > maxWords)
  const handlePasteForSearchVolume = async () => {
    try {
      const clip = await navigator.clipboard.readText();
      if (!clip) return;
      const tokens = parseTokens(clip, inputDelimiter, customDelimiterStr);
      const short = [];
      const long = [];

      for (const t of tokens) {
        const kwPart = t.includes(';')
          ? t.split(';')[0].trim()
          : (t.includes(',') ? t.split(',')[0].trim() : t);
        const wordCount = kwPart.split(/\s+/).filter(Boolean).length;
        if (wordCount > maxWordsCount) {
          long.push(t);
        } else {
          short.push(t);
        }
      }

      setInputText(short.join('\n'));
      setInputDelimiter('\n');

      if (saveLongWordsToFile && long.length > 0 && category && collection) {
        try {
          let existingLong = [];
          try {
            const checkRes = await fetch(
              `/api/niche/files?category=${encodeURIComponent(category)}&collection=${encodeURIComponent(collection)}&file=More%204%20Words%20Tags.txt${activeSegment ? `&segment=${encodeURIComponent(activeSegment)}` : ''}`
            );
            if (checkRes.ok) {
              const data = await checkRes.json();
              if (data.file?.content) {
                existingLong = data.file.content.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
              }
            }
          } catch {}

          const mergedLong = Array.from(new Set([...existingLong, ...long]));

          await fetch('/api/niche/files', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              category,
              collection,
              segment: activeSegment,
              relativePath: 'More 4 Words Tags.txt',
              content: mergedLong.join('\n') + '\n'
            })
          });
        } catch (err) {
          console.error('Failed to save More 4 Words Tags.txt:', err);
        }
      }

      setSplitNotice(`Очищено: оставлено ${short.length} тегов, отсеяно ${long.length} длинных тегов. Длинные теги сохранены в More 4 Words Tags.txt!`);
      setTimeout(() => setSplitNotice(null), 4500);
    } catch (err) {
      console.error('Failed to paste for Search Volume:', err);
    }
  };

  // Action: Copy clean short tags buffer
  const handleCopyCleanBuffer = async () => {
    if (!inputText.trim()) return;
    try {
      await navigator.clipboard.writeText(inputText);
      setSplitNotice(`Скопировано в буфер обмена ${parsedItems.length} тегов для Search Volume!`);
      setTimeout(() => setSplitNotice(null), 3000);
    } catch (err) {
      console.error('Failed to copy buffer:', err);
    }
  };

  // Action: Split text by chosen delimiter into clean lines
  const handleSplitByDelimiter = () => {
    if (!inputText.trim()) return;
    const tokens = parseTokens(inputText, inputDelimiter, customDelimiterStr);
    const seen = new Set();
    const unique = [];
    for (const t of tokens) {
      const lower = t.toLowerCase();
      if (!seen.has(lower)) {
        seen.add(lower);
        unique.push(t);
      }
    }
    setInputText(unique.join('\n'));
    setInputDelimiter('\n');
    setSplitNotice(`Успешно разделено: ${unique.length} чистых строк`);
    setTimeout(() => setSplitNotice(null), 3000);
  };

  // Action: Paste from clipboard and immediately split
  const handlePasteAndSplit = async () => {
    try {
      const clip = await navigator.clipboard.readText();
      if (!clip) return;
      const tokens = parseTokens(clip, inputDelimiter, customDelimiterStr);
      const seen = new Set();
      const unique = [];
      for (const t of tokens) {
        const lower = t.toLowerCase();
        if (!seen.has(lower)) {
          seen.add(lower);
          unique.push(t);
        }
      }
      setInputText(unique.join('\n'));
      setInputDelimiter('\n');
      setSplitNotice(`Вставлено и разделено: ${unique.length} тегов`);
      setTimeout(() => setSplitNotice(null), 3000);
    } catch (err) {
      console.error('Failed to paste:', err);
    }
  };

  // Action: Load from existing file in current niche folder
  const handleLoadExistingFile = async (fileName) => {
    if (!category || !collection) return;
    try {
      setIsLoadingExistingFile(true);
      const params = new URLSearchParams({
        category,
        collection,
        file: fileName,
        ...(activeSegment ? { segment: activeSegment } : {})
      });
      const res = await fetch(`/api/niche/files?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.file?.content) {
          setInputText(data.file.content);
          setInputDelimiter('\n');
          setSplitNotice(`Загружено из ${fileName}: ${data.file.lineCount} строк`);
          setTimeout(() => setSplitNotice(null), 3500);
        }
      }
    } catch (err) {
      console.error('Failed to load file:', err);
    } finally {
      setIsLoadingExistingFile(false);
    }
  };

  // Action: 1-Click Copy Seeds
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

  // Action: File upload (.txt or .csv)
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

  // Action: Launch Batch SearchVolume script
  const handleStartSearchVolume = async () => {
    try {
      setIsSearchVolumeRunning(true);
      setShowSearchVolumeLogs(true);
      setSaveStatus(null);

      const res = await fetch('/api/services/run-searchvolume', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category,
          collection,
          segment: activeSegment,
          mode: 'niche',
          useSystemVpn
        })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Ошибка запуска SearchVolume');
      }

      setSaveStatus({
        type: 'success',
        message: `Batch SearchVolume запущен! ${data.chromeRunning ? 'Chrome 9222 активен.' : 'Запускается профиль браузера...'}`
      });
    } catch (err) {
      console.error('Error starting SearchVolume batch:', err);
      setSaveStatus({
        type: 'error',
        message: err.message || 'Ошибка запуска Batch SearchVolume'
      });
      setIsSearchVolumeRunning(false);
    }
  };

  // Action: Save files
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
        message: 'Вставьте теги перед сохранением'
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
          customDelimiter: customDelimiterStr,
          savePininspectorTxt,
          saveMergedSeeds,
          saveAsAllCsv,
          allCsvFileName: allCsvNaming,
          defaultVolume: parseInt(defaultVolume, 10) || 100
        })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Ошибка при сохранении файлов');
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

  const isStepComplete = (hasPininspector || hasMergedSeeds) && hasAllCsv;

  return (
    <div className="w-full bg-white border border-gray-200 rounded-2xl p-6 shadow-xs space-y-6 text-slate-800">
      {/* Header */}
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
            Сбор ключевых слов из Pin Inspector, автоматическое слияние с Seed Tags и создание файла частотностей (All).csv.
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
              <span>Ожидается сохранение файлов</span>
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
              1. Скопируйте семена тегов кнопкой ниже $\to$ 2. Вставьте в программу <strong className="text-slate-900">Pin Inspector</strong> $\to$ 3. После сбора нажмите <strong className="text-slate-900">«Copy all keywords»</strong> или экспортируйте CSV $\to$ 4. Нажмите «Слить с семенами» или вставьте данные для сохранения.
            </p>
          </div>
        </div>

        {/* Quick copy seed tags button */}
        {seedContent && (
          <div className="pt-2.5 border-t border-red-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <span className="text-[11px] text-slate-600 font-medium">
              Доступно семян для поиска: <strong className="text-slate-900">{seedTagsList.length} шт.</strong>
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

      {/* Target Files Indicators & 1-Click Merge Button */}
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

        {/* File 2: Pininspector + Seeds.txt (WITH 1-CLICK MERGE BUTTON) */}
        <div
          className={`flex flex-col justify-between p-3.5 rounded-xl border transition-all ${
            hasMergedSeeds
              ? 'bg-emerald-50/60 border-emerald-200'
              : 'bg-gray-50 border-gray-200'
          }`}
        >
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-start gap-2.5 min-w-0">
              <div
                className={`p-2 rounded-xl shrink-0 ${
                  hasMergedSeeds ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-200 text-slate-500'
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

            <div className="shrink-0">
              {hasMergedSeeds ? (
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

          {/* Quick 1-click merge action button */}
          {hasPininspector && !hasMergedSeeds && (
            <div className="pt-2 mt-2 border-t border-gray-200/60">
              <button
                type="button"
                onClick={handleDirectMerge}
                disabled={isMerging}
                className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-1.5 bg-[#E60023] hover:bg-[#ad081b] disabled:opacity-50 text-white rounded-lg text-xs font-bold transition-all shadow-xs cursor-pointer active:scale-98"
              >
                {isMerging ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Zap className="w-3.5 h-3.5" />
                )}
                <span>⚡ Слить Pininspector + Seeds</span>
              </button>
            </div>
          )}
        </div>

        {/* File 3: [Segment or Collection] (All).csv */}
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
                {defaultCsvFileName}
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

      {/* Main Ingestion & Delimiter Box */}
      <div className="border border-gray-200 rounded-2xl p-5 space-y-4 bg-gray-50/30">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-gray-100">
          <div>
            <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <span>📥 Ввод тегов и подготовка к Search Volume</span>
            </h4>
            <p className="text-xs text-slate-500 mt-0.5">
              Вставьте текст от себя, скопируйте из Pin Inspector или возьмите из существующего файла в папке.
            </p>
          </div>

          {/* Quick source actions */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handlePasteForSearchVolume}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-[#E60023] hover:bg-[#ad081b] text-white shadow-xs transition-colors cursor-pointer"
              title="Вставить из буфера и автоматически отсечь теги длиннее 4 слов в More 4 Words Tags.txt"
            >
              <Clipboard className="w-3.5 h-3.5" />
              <span>📋 Вставить для Search Volume (&le; {maxWordsCount} слов)</span>
            </button>

            <button
              type="button"
              onClick={handlePasteAndSplit}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-white hover:bg-gray-100 text-slate-800 border border-gray-300 shadow-2xs transition-colors cursor-pointer"
            >
              <Scissors className="w-3.5 h-3.5 text-slate-500" />
              <span>Вставить и разделить</span>
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
          </div>
        </div>

        {/* Load From Folder Files Toolbar */}
        <div className="flex flex-wrap items-center gap-2 p-2.5 bg-blue-50/60 border border-blue-200/80 rounded-xl text-xs">
          <span className="font-bold text-blue-900 flex items-center gap-1">
            <FolderOpen className="w-3.5 h-3.5 text-blue-700" />
            <span>Взять из файла в папке:</span>
          </span>

          <button
            type="button"
            onClick={() => handleLoadExistingFile('Pininspector.txt')}
            disabled={isLoadingExistingFile}
            className="px-2.5 py-1 bg-white hover:bg-blue-100 text-blue-900 rounded-lg border border-blue-200 font-mono text-[11px] font-semibold transition-colors cursor-pointer shadow-2xs"
          >
            Pininspector.txt
          </button>

          <button
            type="button"
            onClick={() => handleLoadExistingFile('Pininspector + Seeds.txt')}
            disabled={isLoadingExistingFile}
            className="px-2.5 py-1 bg-white hover:bg-blue-100 text-blue-900 rounded-lg border border-blue-200 font-mono text-[11px] font-semibold transition-colors cursor-pointer shadow-2xs"
          >
            Pininspector + Seeds.txt
          </button>

          <button
            type="button"
            onClick={() => handleLoadExistingFile('Seed Tags.txt')}
            disabled={isLoadingExistingFile}
            className="px-2.5 py-1 bg-white hover:bg-blue-100 text-blue-900 rounded-lg border border-blue-200 font-mono text-[11px] font-semibold transition-colors cursor-pointer shadow-2xs"
          >
            Seed Tags.txt
          </button>

          {isLoadingExistingFile && (
            <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-700 ml-1" />
          )}
        </div>

        {/* Word Length Filter & Delimiter Controls Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3 rounded-xl border border-gray-200">
          <div className="flex flex-wrap items-center gap-3">
            {/* Delimiter */}
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-slate-700">Разделитель:</span>
              <select
                value={inputDelimiter}
                onChange={(e) => setInputDelimiter(e.target.value)}
                className="text-xs bg-gray-50 border border-gray-300 rounded-lg px-2.5 py-1.5 text-slate-800 font-semibold focus:outline-none focus:border-[#E60023]"
              >
                <option value="auto">⚡ Авто (строки / запятые)</option>
                <option value="\n">Построчно (новая строка \n)</option>
                <option value=",">Запятая с пробелом ( , )</option>
                <option value=";">Точка с запятой ( ; )</option>
                <option value="\t">Табуляция ( \t )</option>
                <option value="|">Вертикальная черта ( | )</option>
                <option value="custom">✍️ Свой знак...</option>
              </select>

              {inputDelimiter === 'custom' && (
                <input
                  type="text"
                  placeholder="Символ"
                  value={customDelimiterStr}
                  onChange={(e) => setCustomDelimiterStr(e.target.value)}
                  className="w-20 px-2 py-1 text-xs border border-gray-300 rounded-lg focus:outline-none focus:border-[#E60023]"
                />
              )}

              <button
                type="button"
                onClick={handleSplitByDelimiter}
                disabled={!inputText.trim()}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-gray-100 hover:bg-gray-200 disabled:opacity-50 text-slate-800 border border-gray-300 transition-colors cursor-pointer"
                title="Разбить строку по выбранному разделителю"
              >
                <Scissors className="w-3 h-3 text-slate-600" />
                <span>Разделить</span>
              </button>
            </div>

            {/* Word Count Filter */}
            <div className="flex items-center gap-2 pl-2 border-l border-gray-200">
              <span className="text-xs font-bold text-slate-700">Слов в строке:</span>
              <input
                type="number"
                min={1}
                max={10}
                value={maxWordsCount}
                onChange={(e) => setMaxWordsCount(parseInt(e.target.value, 10) || 4)}
                className="w-12 px-2 py-1 bg-gray-50 border border-gray-300 rounded-lg text-xs font-mono text-center font-bold text-slate-800 focus:outline-none focus:border-[#E60023]"
              />

              <button
                type="button"
                onClick={handleFilterMaxWords}
                disabled={!inputText.trim()}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 transition-colors cursor-pointer shadow-2xs"
                title="Отфильтровать теги длиннее N слов и сохранить их в More 4 Words Tags.txt"
              >
                <Filter className="w-3.5 h-3.5 text-amber-700" />
                <span>Очистить теги &gt; {maxWordsCount} слов</span>
              </button>
            </div>
          </div>

          {/* Volume Status Badge */}
          <div>
            {hasVolumeData ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
                <span>Частотность найдена ({detectedVolumeCount} шт.)</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-800 border border-blue-200">
                <FileText className="w-3.5 h-3.5 text-blue-600" />
                <span>Плоский список тегов</span>
              </span>
            )}
          </div>
        </div>

        {/* Split Notice Toast */}
        {splitNotice && (
          <div className="p-2.5 rounded-xl text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{splitNotice}</span>
          </div>
        )}

        {/* Textarea */}
        <textarea
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder={`Вставьте теги сюда...&#10;Поддерживаются любые разделители: построчно, через запятую (japanese font , anime streetwear , manga lettering) или точку с запятой.&#10;Также можно вставить данные с частотностью (например: japanese font;880).`}
          rows={9}
          className="w-full p-4 bg-white border border-gray-200 rounded-xl text-xs font-mono text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#E60023] leading-relaxed resize-y shadow-2xs"
        />

        {/* Quick buffer action bar for Search Volume */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-xs">
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleFilterMaxWords}
              disabled={!inputText.trim()}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 transition-colors cursor-pointer shadow-2xs"
              title="Отсечь теги длиннее N слов и сохранить их в More 4 Words Tags.txt"
            >
              <Filter className="w-3.5 h-3.5 text-amber-700" />
              <span>🧹 Очистить буфер Search Volume (отсечь &gt; {maxWordsCount} слов)</span>
            </button>

            <button
              type="button"
              onClick={handleCopyCleanBuffer}
              disabled={!inputText.trim()}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-gray-100 hover:bg-gray-200 text-slate-800 border border-gray-300 transition-colors cursor-pointer shadow-2xs"
              title="Скопировать чистые короткие теги в буфер обмена для SearchVolume.io"
            >
              <Copy className="w-3.5 h-3.5 text-slate-600" />
              <span>📋 Скопировать очищенный буфер для Search Volume</span>
            </button>
          </div>

          <span className="text-[11px] text-slate-500 font-mono">
            В буфере: <strong className="text-slate-900">{parsedItems.length}</strong> тегов
          </span>
        </div>

        {/* Live Merge Preview & Formula */}
        {uniqueKeywords.length > 0 && (
          <div className="bg-white p-4 rounded-xl border border-gray-200 space-y-3">
            <div className="flex items-center justify-between text-xs font-bold text-slate-900">
              <span className="flex items-center gap-1.5">
                <BarChart2 className="w-4 h-4 text-[#E60023]" />
                <span>Формула слияния с семенами Шага 2:</span>
              </span>
              <span className="font-mono text-slate-500">
                Готово к формированию файлов
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
              <div className="p-2.5 rounded-xl bg-gray-50 border border-gray-200">
                <span className="text-[10px] text-slate-500 uppercase font-semibold block">Текущие теги</span>
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
                <span className="text-[10px] text-emerald-700 uppercase font-semibold block">В Pininspector + Seeds</span>
                <span className="text-base font-bold text-emerald-800 font-mono">{mergeStats.mergedTotal}</span>
              </div>
            </div>
          </div>
        )}

        {/* Search Volume Configuration & File Naming (Baby Cliparts Standard) */}
        <div className="bg-white p-4 rounded-xl border border-gray-200 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
              <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
              <span>Стандарт сохранения частотностей: <code className="text-[#E60023] font-mono font-bold bg-red-50 px-1.5 py-0.5 rounded">{defaultCsvFileName}</code></span>
            </span>

            {!hasVolumeData && (
              <span className="text-[11px] text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200 font-medium">
                Частотность будет заполнена стандартным объемом ({defaultVolume})
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <div>
              <span className="text-[11px] text-slate-500 font-semibold block mb-1">
                Имя CSV файла (по стандарту Baby Cliparts):
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
                  Дефолтная частотность:
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

          {/* Target checkboxes */}
          <div className="flex flex-wrap items-center gap-4 pt-2 border-t border-gray-100 text-xs text-slate-700">
            <label className="flex items-center gap-1.5 cursor-pointer">
              <input
                type="checkbox"
                checked={savePininspectorTxt}
                onChange={(e) => setSavePininspectorTxt(e.target.checked)}
                className="rounded text-[#E60023] focus:ring-[#E60023]"
              />
              <span>Pininspector.txt</span>
            </label>

            <label className="flex items-center gap-1.5 cursor-pointer">
              <input
                type="checkbox"
                checked={saveMergedSeeds}
                onChange={(e) => setSaveMergedSeeds(e.target.checked)}
                className="rounded text-[#E60023] focus:ring-[#E60023]"
              />
              <span className="font-semibold text-slate-900">Pininspector + Seeds.txt (объединить)</span>
            </label>

            <label className="flex items-center gap-1.5 cursor-pointer">
              <input
                type="checkbox"
                checked={saveAsAllCsv}
                onChange={(e) => setSaveAsAllCsv(e.target.checked)}
                className="rounded text-[#E60023] focus:ring-[#E60023]"
              />
              <span className="font-semibold text-slate-900">{allCsvNaming} (Search Volume)</span>
            </label>
          </div>
        </div>

        {/* Batch SearchVolume.io Runner Card */}
        <div className="bg-slate-900 text-white p-4 rounded-xl space-y-3 shadow-md">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-base">🚀</span>
                <h4 className="text-sm font-bold text-white">
                  Batch SearchVolume (SearchVolume.io через удаленный Chrome 9222)
                </h4>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                Автоматический сбор реальных объемов поиска из Pininspector + Seeds.txt ({useSystemVpn ? 'режим системного VPN без расширения' : 'через CDP и ротацию Qu VPN'}).
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <label
                title="Если включено, скрипт использует активный VPN вашей системы (Outline, WireGuard и др.) и не требует расширения Qu VPN в браузере"
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs bg-slate-800/90 hover:bg-slate-800 border border-slate-700 text-slate-200 cursor-pointer select-none transition-colors"
              >
                <input
                  type="checkbox"
                  checked={useSystemVpn}
                  onChange={(e) => setUseSystemVpn(e.target.checked)}
                  className="w-4 h-4 rounded text-red-600 focus:ring-red-500 bg-slate-900 border-slate-600 accent-red-600 cursor-pointer"
                />
                <span className="font-semibold text-[11px]">
                  {useSystemVpn ? '🛡️ Системный VPN (вкл)' : '🔄 Qu VPN (расширение)'}
                </span>
              </label>

              {chromeRunning ? (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-semibold bg-emerald-950 text-emerald-400 border border-emerald-700">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span>Chrome 9222 подключен</span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-semibold bg-amber-950 text-amber-400 border border-amber-700">
                  <span>Chrome не запущен (запустится авто)</span>
                </span>
              )}

              <button
                type="button"
                onClick={handleStartSearchVolume}
                disabled={isSearchVolumeRunning}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#E60023] hover:bg-[#ad081b] disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer active:scale-98"
              >
                {isSearchVolumeRunning ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Сбор объемов...</span>
                  </>
                ) : (
                  <>
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>Запустить Batch SearchVolume</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Expandable Logs View */}
          {(showSearchVolumeLogs || searchVolumeLogs) && (
            <div className="pt-2 border-t border-slate-800 space-y-1.5">
              <div className="flex items-center justify-between text-[11px] text-slate-400">
                <span className="flex items-center gap-1 font-mono">
                  <Terminal className="w-3.5 h-3.5 text-slate-400" />
                  <span>Лог SearchVolume:</span>
                </span>
                <button
                  type="button"
                  onClick={() => setShowSearchVolumeLogs(!showSearchVolumeLogs)}
                  className="text-xs text-red-400 hover:text-red-300 font-semibold cursor-pointer"
                >
                  {showSearchVolumeLogs ? 'Скрыть лог' : 'Показать лог'}
                </button>
              </div>

              {showSearchVolumeLogs && (
                <pre className="p-3 bg-black/60 border border-slate-800 rounded-xl text-[11px] font-mono text-emerald-400 max-h-40 overflow-y-auto leading-relaxed">
                  {searchVolumeLogs || 'Запуск фонового скрипта...'}
                </pre>
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
                +{saveStatus.stats.mergedCount} тегов в слиянии
              </span>
            )}
          </div>
        )}

        {/* Bottom Action: Save and Generate Files */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
          <span className="text-xs text-slate-500">
            Файлы сохраняются в папку ниши: <code className="font-mono text-slate-800 font-bold">{activeSegment || collection}</code>
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
                <span>💾 Сохранить {allCsvNaming} и объединить с Seed Tags</span>
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
          title={`Менеджер тегов ниши: ${activeSegment || collection || 'Теги'}`}
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
