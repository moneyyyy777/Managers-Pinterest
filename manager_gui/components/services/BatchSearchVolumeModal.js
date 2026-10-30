'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  X,
  Search,
  Check,
  AlertCircle,
  Play,
  Square,
  RefreshCw,
  Terminal,
  ExternalLink,
  Loader2,
  Calendar,
  FileText,
  FileSpreadsheet,
  CheckCircle2,
  ShieldCheck,
  Layers,
  ChevronDown,
  ChevronRight,
  Compass
} from 'lucide-react';

const STATIC_CATEGORIES = [
  'Все',
  'christmas',
  'cliparts',
  'fonts',
  'planners',
  'procreate',
  'stickers',
  'svg',
  'wedding',
  'patterns'
];

function formatFileDate(isoDate) {
  if (!isoDate) return '—';
  try {
    const d = new Date(isoDate);
    if (isNaN(d.getTime())) return '—';
    const now = new Date();
    const isToday =
      d.getDate() === now.getDate() &&
      d.getMonth() === now.getMonth() &&
      d.getFullYear() === now.getFullYear();

    const timeStr = d.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
    if (isToday) {
      return `Сегодня, ${timeStr}`;
    }

    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    const isYesterday =
      d.getDate() === yesterday.getDate() &&
      d.getMonth() === yesterday.getMonth() &&
      d.getFullYear() === yesterday.getFullYear();

    if (isYesterday) {
      return `Вчера, ${timeStr}`;
    }

    return d.toLocaleDateString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch {
    return '—';
  }
}

export default function BatchSearchVolumeModal({
  isOpen,
  onClose,
  niches = [],
  onSelectNiche,
  onRefreshNiches
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Все');
  const [activeFilterTab, setActiveFilterTab] = useState('all'); // 'all', 'ready', 'completed', 'no_txt'
  const [selectedNicheKeys, setSelectedNicheKeys] = useState(new Set());
  const [expandedNicheKeys, setExpandedNicheKeys] = useState(new Set());
  const [useSystemVpn, setUseSystemVpn] = useState(true);

  // Runner state & logs
  const [isRunning, setIsRunning] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  const [chromeRunning, setChromeRunning] = useState(false);
  const [logs, setLogs] = useState('');
  const [showLogs, setShowLogs] = useState(false);
  const [statusMessage, setStatusMessage] = useState(null);

  // Poll searchvolume status and logs
  const checkStatus = useCallback(async () => {
    try {
      const res = await fetch('/api/services/run-searchvolume');
      if (res.ok) {
        const data = await res.json();
        setChromeRunning(Boolean(data.chromeRunning));
        setIsRunning(Boolean(data.isRunning));
        if (data.recentLogs) setLogs(data.recentLogs);
      }
    } catch {}
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    checkStatus();
    const interval = setInterval(checkStatus, 3000);
    return () => clearInterval(interval);
  }, [isOpen, checkStatus]);

  // Derive categories list
  const categoryList = useMemo(() => {
    const set = new Set(STATIC_CATEGORIES);
    niches.forEach((n) => {
      if (n.category) set.add(n.category.toLowerCase());
    });
    return Array.from(set);
  }, [niches]);

  // Categorize niches for metrics and filters
  const { needsCollectionList, fullyCompletedList, noTxtList } = useMemo(() => {
    const needsCollection = [];
    const fullyCompleted = [];
    const noTxt = [];

    niches.forEach((n) => {
      const sv = n.searchVolumeStatus;
      if (!sv?.canBatch) {
        noTxt.push(n);
      } else if (sv.isFullyCompleted) {
        fullyCompleted.push(n);
      } else if (sv.needsCollection) {
        needsCollection.push(n);
      }
    });

    return { needsCollectionList: needsCollection, fullyCompletedList: fullyCompleted, noTxtList: noTxt };
  }, [niches]);

  // Backward compatibility alias
  const readyList = needsCollectionList;
  const completedList = fullyCompletedList;

  // Filtered niches based on category, search and active filter tab
  const filteredNiches = useMemo(() => {
    return niches.filter((n) => {
      const sv = n.searchVolumeStatus;

      // Filter Tab
      if (activeFilterTab === 'needs_collection' && !sv?.needsCollection) return false;
      if (activeFilterTab === 'ready' && !sv?.needsCollection) return false;
      if (activeFilterTab === 'completed' && !sv?.isFullyCompleted) return false;
      if (activeFilterTab === 'no_txt' && sv?.canBatch) return false;

      // Category
      if (selectedCategory !== 'Все' && n.category?.toLowerCase() !== selectedCategory.toLowerCase()) {
        return false;
      }

      // Search Query
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase().trim();
        const title = (n.title || n.collection || '').toLowerCase();
        const cat = (n.category || '').toLowerCase();
        const id = (n.id || '').toLowerCase();
        const hasSegMatch = Array.isArray(n.segments) && n.segments.some((s) => s.name.toLowerCase().includes(q));
        if (!title.includes(q) && !cat.includes(q) && !id.includes(q) && !hasSegMatch) {
          return false;
        }
      }

      return true;
    });
  }, [niches, activeFilterTab, selectedCategory, searchTerm]);

  // Master Checkbox logic
  const batchableFilteredNiches = useMemo(() => {
    return filteredNiches.filter((n) => n.searchVolumeStatus?.canBatch);
  }, [filteredNiches]);

  const allFilteredBatchableSelected =
    batchableFilteredNiches.length > 0 &&
    batchableFilteredNiches.every((n) => selectedNicheKeys.has(n.id || `${n.category}/${n.collection}`));

  const toggleSelectAll = () => {
    setSelectedNicheKeys((prev) => {
      const next = new Set(prev);
      if (allFilteredBatchableSelected) {
        batchableFilteredNiches.forEach((n) => next.delete(n.id || `${n.category}/${n.collection}`));
      } else {
        batchableFilteredNiches.forEach((n) => next.add(n.id || `${n.category}/${n.collection}`));
      }
      return next;
    });
  };

  const toggleSelectNiche = (nicheId, canBatch) => {
    if (!canBatch) return;
    setSelectedNicheKeys((prev) => {
      const next = new Set(prev);
      if (next.has(nicheId)) {
        next.delete(nicheId);
      } else {
        next.add(nicheId);
      }
      return next;
    });
  };

  const selectAllNeedsCollection = () => {
    const targetKeys = needsCollectionList.map((n) => n.id || `${n.category}/${n.collection}`);
    setSelectedNicheKeys(new Set(targetKeys));
    setActiveFilterTab('needs_collection');
  };

  const selectAllReady = selectAllNeedsCollection;

  const clearSelection = () => {
    setSelectedNicheKeys(new Set());
  };

  const toggleExpand = (nicheId) => {
    setExpandedNicheKeys((prev) => {
      const next = new Set(prev);
      if (next.has(nicheId)) {
        next.delete(nicheId);
      } else {
        next.add(nicheId);
      }
      return next;
    });
  };

  // Launch Batch SearchVolume
  const handleRunBatch = async (customTargets = null) => {
    try {
      setIsStarting(true);
      setShowLogs(true);
      setStatusMessage(null);

      let targetsToRun = [];

      if (customTargets) {
        targetsToRun = customTargets;
      } else {
        // Collect from selected niches
        const selectedNiches = niches.filter((n) =>
          selectedNicheKeys.has(n.id || `${n.category}/${n.collection}`)
        );

        for (const n of selectedNiches) {
          const sv = n.searchVolumeStatus || {};
          const isMulti = Array.isArray(n.segments) && n.segments.length > 0;
          if (isMulti) {
            // Find segments that actually need collection (canBatch and no All.csv)
            const pendingSegs = n.segments.filter(
              (s) => s.searchVolumeStatus?.canBatch && !s.searchVolumeStatus?.hasAllCsv
            );
            if (pendingSegs.length > 0) {
              for (const s of pendingSegs) {
                targetsToRun.push({
                  category: n.category,
                  collection: n.collection,
                  segment: s.name
                });
              }
            } else {
              // If none pending, collect all ready segments
              for (const s of n.segments.filter((s) => s.searchVolumeStatus?.canBatch)) {
                targetsToRun.push({
                  category: n.category,
                  collection: n.collection,
                  segment: s.name
                });
              }
            }
          } else {
            targetsToRun.push({
              category: n.category,
              collection: n.collection
            });
          }
        }
      }

      if (targetsToRun.length === 0) {
        setStatusMessage({
          type: 'error',
          text: 'Выберите хотя бы одну готовую нишу для запуска батчинга'
        });
        setIsStarting(false);
        return;
      }

      const res = await fetch('/api/services/run-searchvolume', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targets: targetsToRun,
          mode: 'batch',
          useSystemVpn
        })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Ошибка запуска Batch SearchVolume');
      }

      setIsRunning(true);
      setStatusMessage({
        type: 'success',
        text: `Пакетный SearchVolume запущен для ${targetsToRun.length} ниш! Фоновый режим активен (без перехвата окон).`
      });
      setTimeout(checkStatus, 1500);
    } catch (err) {
      console.error('Error starting batch:', err);
      setStatusMessage({
        type: 'error',
        text: err.message || 'Ошибка запуска'
      });
    } finally {
      setIsStarting(false);
    }
  };

  // Stop SearchVolume Process
  const handleStopBatch = async () => {
    try {
      setIsStarting(false);
      const res = await fetch('/api/services/run-searchvolume', {
        method: 'DELETE'
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setIsRunning(false);
        setStatusMessage({
          type: 'success',
          text: 'Сбор SearchVolume успешно остановлен. Все собранные данные сохранены в CSV.'
        });
      } else {
        throw new Error(data.error || 'Не удалось остановить процесс');
      }
      setTimeout(checkStatus, 800);
      onRefreshNiches?.();
    } catch (err) {
      console.error('Error stopping batch:', err);
      setStatusMessage({
        type: 'error',
        text: err.message || 'Ошибка при остановке'
      });
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-6xl max-h-[92vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between gap-4 bg-slate-50/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#E60023] to-rose-500 flex items-center justify-center text-white shadow-xs">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
                  Пакетный сбор SearchVolume.io
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-red-100 text-[#E60023] border border-red-200">
                  CDP Chrome 9222
                </span>
                {chromeRunning && (
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span>Chrome подключен</span>
                  </span>
                )}
                {isRunning && (
                  <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-rose-700 bg-rose-50 border border-rose-200 px-2.5 py-0.5 rounded-full animate-pulse">
                    <span className="w-2 h-2 rounded-full bg-rose-600 animate-ping" />
                    <span>Сбор активен (фоновый режим)</span>
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500">
                Автоматический сбор объемов поиска из <code className="font-mono text-slate-700">Pininspector + Seeds.txt</code> для выбранных ниш • <span className="text-slate-600 font-medium">Работает в фоне без перехвата активного окна</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200/70 transition-colors cursor-pointer"
              title="Закрыть окно"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Toolbar: Filters, Metrics, Selection controls */}
        <div className="p-4 sm:p-5 border-b border-slate-100 bg-white space-y-3.5">
          {/* Top row: Search input + Category chips */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Поиск по названию ниши, категории или сегменту..."
                className="w-full pl-9.5 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-[#E60023] focus:ring-2 focus:ring-red-100"
              />
            </div>

            {/* Filter Tabs */}
            <div className="flex items-center gap-1.5 bg-slate-100/90 p-1 rounded-xl shrink-0 overflow-x-auto no-scrollbar">
              <button
                type="button"
                onClick={() => setActiveFilterTab('all')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                  activeFilterTab === 'all'
                    ? 'bg-white text-slate-900 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Все ({niches.length})
              </button>
              <button
                type="button"
                onClick={() => setActiveFilterTab('needs_collection')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                  activeFilterTab === 'needs_collection' || activeFilterTab === 'ready'
                    ? 'bg-amber-500 text-white shadow-2xs'
                    : 'text-slate-600 hover:text-amber-700'
                }`}
              >
                🔥 Нужно дособрать ({needsCollectionList.length})
              </button>
              <button
                type="button"
                onClick={() => setActiveFilterTab('completed')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                  activeFilterTab === 'completed'
                    ? 'bg-emerald-600 text-white shadow-2xs'
                    : 'text-slate-600 hover:text-emerald-700'
                }`}
              >
                ✅ Полностью собраны ({fullyCompletedList.length})
              </button>
              <button
                type="button"
                onClick={() => setActiveFilterTab('no_txt')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                  activeFilterTab === 'no_txt'
                    ? 'bg-slate-700 text-white shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                ⚠️ Нет файла ({noTxtList.length})
              </button>
            </div>
          </div>

          {/* Category Filter Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 pt-0.5 no-scrollbar">
            <span className="text-[11px] font-semibold text-slate-400 mr-1 shrink-0">Категория:</span>
            {categoryList.map((cat) => {
              const isActive = selectedCategory.toLowerCase() === cat.toLowerCase();
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-2.5 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-all cursor-pointer ${
                    isActive
                      ? 'bg-[#E60023] text-white shadow-xs font-semibold'
                      : 'bg-slate-50 text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-slate-200'
                  }`}
                >
                  {cat}
                </button>
              );
            })}
          </div>

          {/* Batch Actions Bar */}
          <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
            {/* Selection Buttons */}
            <div className="flex items-center gap-2 flex-wrap text-xs">
              <button
                type="button"
                onClick={toggleSelectAll}
                disabled={batchableFilteredNiches.length === 0}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold border border-slate-200 disabled:opacity-50 cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={allFilteredBatchableSelected}
                  readOnly
                  className="rounded text-[#E60023] focus:ring-[#E60023] cursor-pointer pointer-events-none"
                />
                <span>Выбрать все доступные ({batchableFilteredNiches.length})</span>
              </button>

              <button
                type="button"
                onClick={selectAllNeedsCollection}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold border border-amber-500 shadow-2xs transition-all active:scale-95 cursor-pointer"
                title="Отфильтровать и выбрать все ниши, которым требуется сбор или добор ключей"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>⚡ Выбрать все, кому нужно дособрать ({needsCollectionList.length})</span>
              </button>

              {selectedNicheKeys.size > 0 && (
                <button
                  type="button"
                  onClick={clearSelection}
                  className="px-2.5 py-1.5 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 text-xs font-medium cursor-pointer"
                >
                  Снять выделение ({selectedNicheKeys.size})
                </button>
              )}
            </div>

            {/* VPN mode + Launch Button */}
            <div className="flex items-center gap-3">
              <label className="inline-flex items-center gap-2 text-xs text-slate-700 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={useSystemVpn}
                  onChange={(e) => setUseSystemVpn(e.target.checked)}
                  className="rounded text-[#E60023] focus:ring-[#E60023]"
                />
                <span className="font-medium">Системный VPN (без Qu VPN)</span>
              </label>

              <button
                type="button"
                onClick={() => setShowLogs((prev) => !prev)}
                className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border transition-colors cursor-pointer ${
                  showLogs
                    ? 'bg-slate-900 text-white border-slate-900'
                    : 'bg-white text-slate-700 hover:bg-slate-50 border-slate-200'
                }`}
                title="Показать / скрыть лог консоли"
              >
                <Terminal className="w-3.5 h-3.5" />
                <span>Лог SearchVolume</span>
              </button>

              {isRunning ? (
                <button
                  type="button"
                  onClick={handleStopBatch}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 active:scale-95 shadow-sm transition-all cursor-pointer animate-pulse"
                  title="Остановить сбор SearchVolume прямо сейчас (прогресс сохранится в CSV)"
                >
                  <Square className="w-3.5 h-3.5 fill-current" />
                  <span>Остановить сбор</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => handleRunBatch()}
                  disabled={selectedNicheKeys.size === 0 || isStarting}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-white bg-[#E60023] hover:bg-[#ad081b] disabled:opacity-50 disabled:cursor-not-allowed shadow-sm transition-all active:scale-[0.98] cursor-pointer"
                >
                  {isStarting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Запуск...</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4 fill-current" />
                      <span>Запустить для {selectedNicheKeys.size} ниш</span>
                    </>
                  )}
                </button>
              )}
            </div>
          </div>

          {/* Status Message Notification */}
          {statusMessage && (
            <div
              className={`p-3 rounded-xl text-xs flex items-center justify-between gap-2 animate-in fade-in ${
                statusMessage.type === 'success'
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                  : 'bg-red-50 text-red-800 border border-red-200'
              }`}
            >
              <div className="flex items-center gap-2">
                {statusMessage.type === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                )}
                <span>{statusMessage.text}</span>
              </div>
              <button
                type="button"
                onClick={() => setStatusMessage(null)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                ✕
              </button>
            </div>
          )}
        </div>

        {/* Live Logs Drawer (collapsible) */}
        {showLogs && (
          <div className="border-b border-slate-200 bg-slate-950 text-emerald-400 p-4 font-mono text-xs max-h-48 overflow-y-auto space-y-1">
            <div className="flex items-center justify-between text-[11px] text-slate-400 pb-1 border-b border-slate-800 mb-2">
              <span className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${isRunning ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'}`} />
                <span>Лог SearchVolume.io: {isRunning ? 'Выполняется сбор (фоновый режим)...' : 'Ожидание запуска'}</span>
              </span>
              <div className="flex items-center gap-2">
                {isRunning && (
                  <button
                    type="button"
                    onClick={handleStopBatch}
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-bold bg-rose-600 hover:bg-rose-700 text-white transition-colors cursor-pointer"
                    title="Принудительно остановить процесс сбора"
                  >
                    <Square className="w-3 h-3 fill-current" />
                    <span>Остановить</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => checkStatus()}
                  className="hover:text-white transition-colors cursor-pointer"
                  title="Обновить лог"
                >
                  <RefreshCw className="w-3 h-3" />
                </button>
              </div>
            </div>
            <pre className="whitespace-pre-wrap leading-relaxed text-[11px] select-text">
              {logs || 'Логи пока пусты. Запустите сбор для выбранных ниш.'}
            </pre>
          </div>
        )}

        {/* Niches Table */}
        <div className="flex-1 overflow-y-auto">
          {filteredNiches.length === 0 ? (
            <div className="py-16 text-center text-slate-400 space-y-2">
              <FileText className="w-8 h-8 text-slate-300 mx-auto" />
              <p className="text-sm font-semibold text-slate-700">Ниши не найдены</p>
              <p className="text-xs text-slate-500">Попробуйте сбросить фильтр или строку поиска</p>
            </div>
          ) : (
            <table className="w-full text-left text-xs border-collapse">
              <thead className="sticky top-0 bg-slate-100/95 backdrop-blur-xs border-b border-slate-200 z-10">
                <tr>
                  <th className="w-12 px-3.5 py-3 text-center border-r border-slate-200">
                    <input
                      type="checkbox"
                      checked={allFilteredBatchableSelected}
                      onChange={toggleSelectAll}
                      disabled={batchableFilteredNiches.length === 0}
                      className="rounded text-[#E60023] focus:ring-[#E60023] cursor-pointer"
                      title="Выбрать все доступные для батчинга"
                    />
                  </th>
                  <th className="px-4 py-3 font-bold text-slate-700 tracking-wide border-r border-slate-200">
                    Ниша / Сегменты
                  </th>
                  <th className="px-4 py-3 font-bold text-slate-700 tracking-wide border-r border-slate-200 w-72">
                    Файл тегов (Pininspector + Seeds.txt)
                  </th>
                  <th className="px-4 py-3 font-bold text-slate-700 tracking-wide border-r border-slate-200 w-52">
                    Статус Search Volume
                  </th>
                  <th className="px-4 py-3 font-bold text-slate-700 tracking-wide text-right w-44">
                    Действия
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-800">
                {filteredNiches.map((niche) => {
                  const nicheId = niche.id || `${niche.category}/${niche.collection}`;
                  const sv = niche.searchVolumeStatus || {};
                  const canBatch = Boolean(sv.canBatch);
                  const isSelected = selectedNicheKeys.has(nicheId);
                  const isExpanded = expandedNicheKeys.has(nicheId);
                  const hasSegments = Array.isArray(niche.segments) && niche.segments.length > 0;

                  return (
                    <React.Fragment key={nicheId}>
                      <tr
                        className={`transition-colors group hover:bg-slate-50/80 ${
                          isSelected ? 'bg-red-50/40' : ''
                        } ${!canBatch ? 'opacity-85 bg-slate-50/30' : ''}`}
                      >
                        {/* Checkbox (DISABLED if !canBatch) */}
                        <td className="px-3.5 py-3 text-center border-r border-slate-100 bg-slate-50/50">
                          {canBatch ? (
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => toggleSelectNiche(nicheId, canBatch)}
                              className="rounded text-[#E60023] focus:ring-[#E60023] cursor-pointer"
                              title="Выбрать для пакетного сбора"
                            />
                          ) : (
                            <span
                              className="inline-block"
                              title="Нельзя поставить на батчинг: нет текстового файла Pininspector + Seeds.txt"
                            >
                              <input
                                type="checkbox"
                                disabled
                                className="rounded text-slate-300 opacity-40 cursor-not-allowed"
                              />
                            </span>
                          )}
                        </td>

                        {/* Title & Category & Architecture */}
                        <td className="px-4 py-3 border-r border-slate-100">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              {hasSegments && (
                                <button
                                  type="button"
                                  onClick={() => toggleExpand(nicheId)}
                                  className="text-slate-400 hover:text-slate-700 cursor-pointer"
                                  title="Показать / скрыть сегменты"
                                >
                                  {isExpanded ? (
                                    <ChevronDown className="w-3.5 h-3.5 text-[#E60023]" />
                                  ) : (
                                    <ChevronRight className="w-3.5 h-3.5" />
                                  )}
                                </button>
                              )}
                              <span className="font-bold text-slate-900 text-xs">
                                {niche.title || niche.collection}
                              </span>
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-slate-100 text-slate-600 border border-slate-200">
                                {niche.category}
                              </span>
                            </div>

                            <div className="flex items-center gap-2 text-[11px] text-slate-500">
                              {hasSegments ? (
                                <span className="inline-flex items-center gap-1 font-semibold text-[#E60023]">
                                  <span>🔴 {niche.segments.length} сегментов</span>
                                  {sv.readySegmentsCount !== undefined && (
                                    <span className="text-slate-400 font-normal">
                                      ({sv.readySegmentsCount} готовы к сбору)
                                    </span>
                                  )}
                                </span>
                              ) : (
                                <span className="text-slate-500">⚪ Моно-ядро</span>
                              )}
                              <span>•</span>
                              <span>{niche.productCount || 0} товаров</span>
                            </div>
                          </div>
                        </td>

                        {/* Tag File & Last Modified Date */}
                        <td className="px-4 py-3 border-r border-slate-100">
                          {canBatch ? (
                            <div className="space-y-1">
                              <div className="flex items-center gap-1.5">
                                <FileText className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                                <span className="font-semibold text-slate-800 truncate" title={sv.tagFileName}>
                                  {sv.tagFileName || 'Pininspector + Seeds.txt'}
                                </span>
                                {sv.tagCount > 0 && (
                                  <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold bg-blue-50 text-blue-700 border border-blue-200 shrink-0">
                                    {sv.tagCount} тегов
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-1.5 text-[11px] text-slate-500 font-sans">
                                <Calendar className="w-3 h-3 text-slate-400" />
                                <span>Изменен:</span>
                                <span className="font-medium text-slate-700">
                                  {formatFileDate(sv.mtime)}
                                </span>
                              </div>
                            </div>
                          ) : (
                            <div className="space-y-1">
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-500 border border-slate-200">
                                <AlertCircle className="w-3.5 h-3.5 text-slate-400" />
                                <span>Нет текстового файла</span>
                              </span>
                              <p className="text-[10px] text-slate-400">
                                Нельзя поставить на батчинг
                              </p>
                            </div>
                          )}
                        </td>

                        {/* Search Volume CSV Status */}
                        <td className="px-4 py-3 border-r border-slate-100">
                          {sv.isPartiallyCompleted ? (
                            <div className="space-y-1">
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-900 border border-amber-300">
                                <AlertCircle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                                <span>Собрано {sv.completedSegmentsCount} из {sv.readySegmentsCount}</span>
                              </span>
                              <div className="text-[10px] text-amber-700 font-medium">
                                🔥 {sv.pendingSegmentsCount} сегм. нужно дособрать
                              </div>
                            </div>
                          ) : sv.isFullyCompleted ? (
                            <div className="space-y-1">
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                                <span>{hasSegments ? `Все ${sv.completedSegmentsCount} сегм. собраны` : 'Собрано (All.csv)'}</span>
                              </span>
                              {sv.allCsvMtime && (
                                <div className="text-[10px] text-slate-400">
                                  Дата CSV: {formatFileDate(sv.allCsvMtime)}
                                </div>
                              )}
                            </div>
                          ) : canBatch ? (
                            <div className="space-y-1">
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-800 border border-amber-200">
                                <RefreshCw className="w-3 h-3 text-amber-600 shrink-0" />
                                <span>Ожидает сбора {hasSegments ? `(${sv.readySegmentsCount} сегм.)` : ''}</span>
                              </span>
                            </div>
                          ) : (
                            <span className="text-[11px] text-slate-400">—</span>
                          )}
                        </td>

                        {/* Row Actions */}
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {canBatch && (
                              <button
                                type="button"
                                onClick={() => {
                                  const isMulti = hasSegments;
                                  const pendingSegs = isMulti
                                    ? niche.segments.filter((s) => s.searchVolumeStatus?.canBatch && !s.searchVolumeStatus?.hasAllCsv)
                                    : [];
                                  if (pendingSegs.length > 0) {
                                    handleRunBatch(
                                      pendingSegs.map((s) => ({
                                        category: niche.category,
                                        collection: niche.collection,
                                        segment: s.name
                                      }))
                                    );
                                  } else {
                                    handleRunBatch([
                                      { category: niche.category, collection: niche.collection }
                                    ]);
                                  }
                                }}
                                disabled={isStarting || isRunning}
                                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 transition-colors cursor-pointer"
                                title={
                                  sv.isPartiallyCompleted
                                    ? `Дособрать только ${sv.pendingSegmentsCount} недостающих сегментов`
                                    : 'Запустить сбор для этой ниши'
                                }
                              >
                                <Play className="w-3 h-3 fill-current text-slate-600" />
                                <span>{sv.isPartiallyCompleted ? 'Дособрать' : 'Собрать'}</span>
                              </button>
                            )}

                            <button
                              type="button"
                              onClick={() => {
                                onSelectNiche?.(nicheId, 'pipeline');
                                onClose();
                              }}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-[#E60023] hover:bg-red-50 transition-colors cursor-pointer"
                              title="Перейти в Штурман для этой ниши"
                            >
                              <Compass className="w-3.5 h-3.5" />
                              <span>В Штурман</span>
                            </button>
                          </div>
                        </td>
                      </tr>

                      {/* Expanded Sub-Segments View */}
                      {hasSegments && isExpanded && (
                        <tr className="bg-slate-50/50">
                          <td colSpan={5} className="p-3 pl-12 border-b border-slate-100">
                            <div className="space-y-2">
                              <div className="text-[11px] font-semibold text-slate-600">
                                Сегменты ниши ({niche.segments.length}):
                              </div>
                              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                                {niche.segments.map((seg) => {
                                  const segSv = seg.searchVolumeStatus || {};
                                  const segCan = Boolean(segSv.canBatch);
                                  const segIsDone = Boolean(segSv.hasAllCsv);

                                  return (
                                    <div
                                      key={seg.name}
                                      className={`p-2.5 rounded-xl border bg-white flex flex-col justify-between space-y-1.5 ${
                                        segIsDone
                                          ? 'border-emerald-200 bg-emerald-50/20'
                                          : segCan
                                          ? 'border-amber-200 bg-amber-50/10'
                                          : 'border-slate-200/60 opacity-75'
                                      }`}
                                    >
                                      <div className="flex items-center justify-between gap-1">
                                        <div className="flex items-center gap-1.5 min-w-0">
                                          <span
                                            className={`w-2 h-2 rounded-full shrink-0 ${
                                              segIsDone
                                                ? 'bg-emerald-500'
                                                : segCan
                                                ? 'bg-amber-500'
                                                : 'bg-slate-300'
                                            }`}
                                          />
                                          <span className="font-semibold text-slate-900 truncate text-[11px]" title={seg.name}>
                                            {seg.name}
                                          </span>
                                        </div>
                                        {segCan ? (
                                          <span className="text-[10px] font-bold text-blue-700 bg-blue-50 px-1.5 py-0.2 rounded border border-blue-200 shrink-0">
                                            {segSv.tagCount} тегов
                                          </span>
                                        ) : (
                                          <span className="text-[10px] font-medium text-slate-400 bg-slate-100 px-1.5 py-0.2 rounded shrink-0">
                                            нет txt
                                          </span>
                                        )}
                                      </div>

                                      <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1 border-t border-slate-100">
                                        <span>
                                          {segCan ? formatFileDate(segSv.mtime) : 'Файл отсутствует'}
                                        </span>
                                        {segSv.hasAllCsv ? (
                                          <span className="font-semibold text-emerald-600">All.csv ✅</span>
                                        ) : segCan ? (
                                          <div className="flex items-center gap-1.5">
                                            <span className="font-semibold text-amber-600">Ожидает сбора</span>
                                            <button
                                              type="button"
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                handleRunBatch([
                                                  {
                                                    category: niche.category,
                                                    collection: niche.collection,
                                                    segment: seg.name
                                                  }
                                                ]);
                                              }}
                                              disabled={isStarting || isRunning}
                                              className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-500 hover:bg-amber-600 text-white cursor-pointer"
                                              title={`Собрать только сегмент: ${seg.name}`}
                                            >
                                              Собрать
                                            </button>
                                          </div>
                                        ) : (
                                          <span className="text-slate-400">—</span>
                                        )}
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-5 py-3.5 border-t border-slate-200 bg-slate-50 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-600">
          <div className="flex items-center gap-4">
            <span className="font-medium">
              Показано: <strong className="text-slate-900">{filteredNiches.length}</strong> ниш
            </span>
            <span>•</span>
            <span className="text-amber-700 font-semibold">
              Нужно дособрать: {needsCollectionList.length}
            </span>
            <span>•</span>
            <span className="text-emerald-700 font-semibold">
              Полностью собраны: {fullyCompletedList.length}
            </span>
            <span>•</span>
            <span className="text-slate-500">
              Выбрано для батчинга: <strong className="text-[#E60023] font-bold">{selectedNicheKeys.size}</strong>
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 transition-colors cursor-pointer"
            >
              Закрыть
            </button>
            {isRunning ? (
              <button
                type="button"
                onClick={handleStopBatch}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 shadow-sm transition-all active:scale-95 cursor-pointer animate-pulse"
                title="Остановить сбор SearchVolume прямо сейчас"
              >
                <Square className="w-3.5 h-3.5 fill-current" />
                <span>Остановить сбор</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => handleRunBatch()}
                disabled={selectedNicheKeys.size === 0 || isStarting}
                className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-[#E60023] hover:bg-[#ad081b] disabled:opacity-50 disabled:cursor-not-allowed shadow-xs transition-all active:scale-[0.98] cursor-pointer"
              >
                {isStarting ? 'Запуск...' : `Запустить пакет (${selectedNicheKeys.size})`}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
