'use client';

import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  Search,
  FolderCheck,
  FolderPlus,
  ShoppingBag,
  Sparkles,
  ChevronDown,
  Check,
  ExternalLink,
  Loader2,
  X
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

export default function NicheSelector({
  niches = [],
  selectedKey = '',
  onSelectNiche,
  onInitNiche,
  loading = false
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Все');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isInitializing, setIsInitializing] = useState(false);
  const containerRef = useRef(null);

  // Close dropdown on click outside the container or on Escape
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsDropdownOpen(false);
      }
    };
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  // Helper to get uniform niche key
  const getNicheKey = (niche) => {
    if (!niche) return '';
    return niche.id || `${niche.category}/${niche.collection}`;
  };

  // Derive categories list (default + any extra found in data)
  const categoryList = useMemo(() => {
    const set = new Set(STATIC_CATEGORIES);
    niches.forEach((n) => {
      if (n.category) set.add(n.category.toLowerCase());
    });
    return Array.from(set);
  }, [niches]);

  // Filter niches based on search and selected category
  const filteredNiches = useMemo(() => {
    return niches.filter((niche) => {
      const key = getNicheKey(niche).toLowerCase();
      const title = (niche.title || '').toLowerCase();
      const coll = (niche.collection || '').toLowerCase();
      const cat = (niche.category || '').toLowerCase();
      const search = searchTerm.trim().toLowerCase();

      const matchesSearch =
        !search ||
        title.includes(search) ||
        coll.includes(search) ||
        cat.includes(search) ||
        key.includes(search);

      const matchesCategory =
        selectedCategory === 'Все' || cat === selectedCategory.toLowerCase();

      return matchesSearch && matchesCategory;
    });
  }, [niches, searchTerm, selectedCategory]);

  // Find currently selected niche object
  const activeNiche = useMemo(() => {
    if (!selectedKey) return null;
    return niches.find((n) => getNicheKey(n) === selectedKey) || null;
  }, [niches, selectedKey]);

  // Handle initialization of Keywords directory
  const handleInit = async (e, key) => {
    e?.stopPropagation();
    if (!onInitNiche || isInitializing) return;

    try {
      setIsInitializing(true);
      await onInitNiche(key);
    } catch (err) {
      console.error('Failed to initialize niche:', err);
    } finally {
      setIsInitializing(false);
    }
  };

  // Safe accessor for product count
  const productsCount =
    activeNiche?.productsCount ?? activeNiche?.productCount ?? 0;

  // Safe accessor for keywords initialization status
  const hasKeywordsDir = Boolean(
    activeNiche?.hasKeywordsDir ?? activeNiche?.isInitialized
  );

  // Safe accessor for progress
  const currentStep =
    activeNiche?.progress?.currentStep ?? activeNiche?.currentStep ?? 1;

  const progressPercent = useMemo(() => {
    if (activeNiche?.progress?.percent !== undefined) {
      return activeNiche.progress.percent;
    }
    const completed =
      activeNiche?.completedCount ??
      (Array.isArray(activeNiche?.stepStatuses)
        ? activeNiche.stepStatuses.filter(Boolean).length
        : currentStep - 1);
    const totalSteps = activeNiche?.totalSteps || 10;
    return Math.min(100, Math.round((completed / totalSteps) * 100));
  }, [activeNiche, currentStep]);

  // Nicely formatted display title for a niche
  const formatNicheTitle = (niche) => {
    if (!niche) return '';
    const rawTitle = niche.title || niche.collection || '';
    const cat = niche.category ? niche.category.charAt(0).toUpperCase() + niche.category.slice(1) : '';
    return `${rawTitle} (${cat})`;
  };

  // Architecture badge helper (Моно-ядро vs Мульти-сегмент)
  const renderArchitectureBadge = (niche, isSmall = false) => {
    const isMulti =
      niche?.architecture === 'multi_segment' ||
      (niche?.segmentsCount !== undefined && niche.segmentsCount > 0) ||
      (Array.isArray(niche?.segments) && niche.segments.length > 0);

    const count =
      niche?.segmentsCount ?? (Array.isArray(niche?.segments) ? niche.segments.length : 0);

    if (isMulti) {
      return (
        <span
          className={`inline-flex items-center gap-1 font-semibold rounded bg-red-50 text-[#E60023] border border-red-200 ${
            isSmall ? 'text-[10px] px-1.5 py-0.5' : 'text-xs px-2.5 py-1'
          }`}
          title={`Мульти-сегментная ниша (${count} сегментов)`}
        >
          <span>🔴</span>
          <span>{count} сегмента</span>
        </span>
      );
    }

    return (
      <span
        className={`inline-flex items-center gap-1 font-medium rounded bg-slate-100 text-slate-700 border border-slate-200 ${
          isSmall ? 'text-[10px] px-1.5 py-0.5' : 'text-xs px-2.5 py-1'
        }`}
        title="Моно-ядро (единый набор интентов)"
      >
        <span>⚪</span>
        <span>Моно-ядро</span>
      </span>
    );
  };

  return (
    <div className="w-full space-y-4">
      {/* 1. Search Bar & Dropdown Header */}
      <div ref={containerRef} className="bg-white border border-slate-200/90 rounded-2xl p-4 sm:p-5 shadow-xs space-y-3.5 relative">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setIsDropdownOpen(true);
              }}
              onFocus={() => {
                setIsDropdownOpen(true);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  setIsDropdownOpen(true);
                } else if (e.key === 'Escape') {
                  setIsDropdownOpen(false);
                }
              }}
              placeholder="Поиск ниши по названию, категории или ключу (Enter для выбора)..."
              className="w-full pl-9.5 pr-4 py-2.5 bg-slate-50/70 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-[#E60023] focus:ring-2 focus:ring-red-100 transition-all shadow-2xs"
            />
          </div>

          {/* 2. Dropdown Selector */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setIsDropdownOpen((prev) => !prev)}
              disabled={loading}
              className={`w-full sm:w-80 flex items-center justify-between gap-2 px-3.5 py-2.5 rounded-xl text-xs text-left transition-all cursor-pointer border ${
                isDropdownOpen
                  ? 'bg-white border-[#E60023] ring-2 ring-red-100 shadow-xs'
                  : 'bg-slate-50/70 border-slate-200 hover:bg-white hover:border-slate-300'
              }`}
            >
              <div className="flex items-center gap-2 truncate">
                <Sparkles className="w-3.5 h-3.5 text-[#E60023] shrink-0" />
                <span className="truncate text-slate-800 font-medium">
                  {loading
                    ? 'Загрузка ниш...'
                    : activeNiche
                    ? formatNicheTitle(activeNiche)
                    : 'Выберите нишу из списка...'}
                </span>
              </div>
              <ChevronDown
                className={`w-4 h-4 text-slate-400 transition-transform duration-200 shrink-0 ${
                  isDropdownOpen ? 'rotate-180 text-[#E60023]' : ''
                }`}
              />
            </button>

            {/* Pure White Dropdown Menu with Pinterest styling */}
            {isDropdownOpen && (
              <div className="absolute right-0 left-0 sm:left-auto sm:w-[520px] mt-2 z-50 bg-white border border-slate-200/90 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
                {/* Header with Title and Close Button */}
                <div className="px-4 py-3 border-b border-slate-100 bg-slate-50/90 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-800">
                      Доступные ниши ({filteredNiches.length})
                    </span>
                    {selectedCategory !== 'Все' && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#E60023] bg-red-50 border border-red-200 px-2 py-0.5 rounded-full">
                        <span>#{selectedCategory}</span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedCategory('Все');
                          }}
                          className="hover:text-red-950 cursor-pointer ml-0.5"
                          title="Сбросить категорию"
                        >
                          ✕
                        </button>
                      </span>
                    )}
                  </div>

                  {/* Explicit Close Button */}
                  <button
                    type="button"
                    onClick={() => setIsDropdownOpen(false)}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-200/70 border border-slate-200 bg-white transition-colors cursor-pointer shadow-2xs"
                    title="Закрыть список ниш"
                  >
                    <X className="w-3.5 h-3.5" />
                    <span>Закрыть</span>
                  </button>
                </div>

                {/* List of niches */}
                <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
                  {filteredNiches.length === 0 ? (
                    <div className="p-6 text-center text-xs text-slate-500 space-y-1">
                      <p className="font-semibold text-slate-700">Ниши не найдены</p>
                      <p>Попробуйте изменить поисковый запрос или выбрать категорию «Все»</p>
                    </div>
                  ) : (
                    filteredNiches.map((niche) => {
                      const key = getNicheKey(niche);
                      const isSelected = key === selectedKey;
                      const hasKw = Boolean(niche.hasKeywordsDir ?? niche.isInitialized);
                      const pCount = niche.productsCount ?? niche.productCount ?? 0;

                      return (
                        <button
                          key={key}
                          type="button"
                          onClick={() => {
                            onSelectNiche?.(key);
                            setIsDropdownOpen(false);
                          }}
                          className={`w-full flex items-center justify-between gap-3 px-4 py-3 text-left text-xs transition-colors hover:bg-red-50/40 cursor-pointer ${
                            isSelected ? 'bg-red-50/80 text-[#E60023] border-l-4 border-l-[#E60023]' : 'text-slate-800'
                          }`}
                        >
                          <div className="truncate flex-1">
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-slate-900 truncate text-xs">
                                {niche.title || niche.collection}
                              </span>
                              {isSelected && (
                                <Check className="w-3.5 h-3.5 text-[#E60023] shrink-0" />
                              )}
                            </div>
                            <div className="text-[11px] text-slate-500 font-mono truncate mt-0.5">
                              {niche.category} / {niche.collection}
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0">
                            {/* Architecture Badge */}
                            {renderArchitectureBadge(niche, true)}

                            <span className="text-[10px] text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full border border-slate-200">
                              {pCount} шт.
                            </span>

                            {hasKw ? (
                              <span className="inline-flex items-center text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                                KW
                              </span>
                            ) : (
                              <span className="inline-flex items-center text-[10px] font-medium text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                                new
                              </span>
                            )}
                          </div>
                        </button>
                      );
                    })
                  )}
                </div>

                {/* Footer with Hint & Close */}
                <div className="px-4 py-2 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                  <span>Кликните на нишу для перехода</span>
                  <button
                    type="button"
                    onClick={() => setIsDropdownOpen(false)}
                    className="text-slate-600 hover:text-[#E60023] font-semibold cursor-pointer"
                  >
                    Закрыть (Esc)
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Category Filter Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 pt-1 no-scrollbar">
          {categoryList.map((cat) => {
            const isActive = selectedCategory.toLowerCase() === cat.toLowerCase();
            return (
              <button
                key={cat}
                type="button"
                onClick={() => {
                  setSelectedCategory(cat);
                  setIsDropdownOpen(true);
                }}
                className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all cursor-pointer ${
                  isActive
                    ? 'bg-[#E60023] text-white shadow-xs font-semibold'
                    : 'bg-white text-slate-600 hover:text-slate-900 hover:bg-slate-50 border border-slate-200'
                }`}
              >
                {cat}
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. Active Niche Card */}
      {activeNiche ? (
        <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs space-y-4">
          {/* Card Top: Title, Subtitle, Badges */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2.5 flex-wrap">
                <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-[#E60023] shrink-0" />
                  <span>{formatNicheTitle(activeNiche)}</span>
                </h2>

                {activeNiche.siteUrl && (
                  <a
                    href={activeNiche.siteUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-[11px] text-slate-600 hover:text-[#E60023] transition-colors bg-slate-50 px-2 py-0.5 rounded-md border border-[#e5e7eb]"
                    title="Открыть страницу ниши на сайте"
                  >
                    <span>Сайт</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>

              {activeNiche.description && (
                <p className="text-xs text-slate-500 line-clamp-2 max-w-2xl">
                  {activeNiche.description}
                </p>
              )}
            </div>

            {/* Badges Container */}
            <div className="flex items-center gap-2 flex-wrap">
              {/* Architecture Badge: [⚪ Моно-ядро] or [🔴 X сегмента] */}
              {renderArchitectureBadge(activeNiche, false)}

              {/* Category & Collection Badges */}
              <span className="px-2.5 py-1 rounded-md text-xs font-mono font-medium bg-slate-50 text-slate-700 border border-[#e5e7eb]">
                📁 {activeNiche.category} / {activeNiche.collection}
              </span>

              {/* Products count */}
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-slate-50 text-slate-700 border border-[#e5e7eb]">
                <ShoppingBag className="w-3.5 h-3.5 text-slate-400" />
                <span>{productsCount} шт.</span>
              </span>

              {/* Keywords Status Badge / Init Action */}
              {hasKeywordsDir ? (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <FolderCheck className="w-3.5 h-3.5 text-emerald-600" />
                  <span>В Keywords</span>
                </span>
              ) : (
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                    <FolderPlus className="w-3.5 h-3.5 text-amber-600" />
                    <span>Не инициализирована</span>
                  </span>

                  <button
                    type="button"
                    onClick={(e) => handleInit(e, selectedKey)}
                    disabled={isInitializing}
                    className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold text-white bg-amber-600 hover:bg-amber-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-md shadow-xs transition-all active:scale-95 cursor-pointer"
                  >
                    {isInitializing ? (
                      <>
                        <Loader2 className="w-3 h-3 animate-spin" />
                        <span>Создание...</span>
                      </>
                    ) : (
                      <>
                        <span>⚡</span>
                        <span>Инициализировать</span>
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Sub-Segments Pills (if multi-segment niche) */}
          {Array.isArray(activeNiche.segments) && activeNiche.segments.length > 0 && (
            <div className="pt-2 border-t border-slate-100">
              <div className="text-[11px] font-semibold text-slate-500 mb-2 flex items-center justify-between">
                <span>Сегменты ниши ({activeNiche.segments.length}):</span>
                <span className="text-[10px] text-slate-400 font-mono">multi_segment</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {activeNiche.segments.map((seg) => (
                  <div
                    key={seg.name}
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-50 border border-slate-200 text-xs font-medium text-slate-700"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-[#E60023]" />
                    <span className="font-semibold">{seg.name}</span>
                    <span className="text-[10px] text-slate-500 font-mono bg-white px-1.5 py-0.5 rounded border border-slate-200">
                      {seg.completedCount}/8
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Funnel Progress Section */}
          <div className="pt-3 border-t border-[#e5e7eb] space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-600 font-medium flex items-center gap-1.5">
                <span>Прогресс воронки:</span>
                <span className="text-slate-900 font-semibold">
                  {currentStep} из 10 этапов
                </span>
              </span>
              <span className="font-mono font-bold text-[#E60023]">
                {progressPercent}%
              </span>
            </div>

            {/* Gradient Progress Bar */}
            <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden border border-slate-200/80 p-0.5">
              <div
                className="bg-gradient-to-r from-red-600 via-rose-500 to-[#E60023] h-full rounded-full transition-all duration-500 shadow-xs"
                style={{ width: `${Math.max(5, progressPercent)}%` }}
              />
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white border border-slate-200/90 border-dashed rounded-2xl p-8 text-center text-slate-400 space-y-2">
          <Sparkles className="w-6 h-6 text-slate-400 mx-auto" />
          <p className="text-sm font-medium text-slate-700">Ниша не выбрана</p>
          <p className="text-xs text-slate-500">
            Воспользуйтесь строкой поиска или выпадающим списком выше, чтобы выбрать нишу для анализа и управления.
          </p>
        </div>
      )}
    </div>
  );
}
