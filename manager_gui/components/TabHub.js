'use client';

import React, { useState, useMemo } from 'react';
import {
  Search,
  ShoppingBag,
  Compass,
  ShieldCheck,
  FolderCheck,
  CheckCircle2,
  Layers,
  Zap,
  Loader2,
  Tag
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
  'wedding'
];

export default function TabHub({
  niches = [],
  onSelectNiche,
  onInitNiche
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Все');
  const [initializingKeys, setInitializingKeys] = useState({});

  // Summary Metrics calculations
  const totalNiches = niches.length;
  const initializedCount = useMemo(() => {
    return niches.filter((n) => Boolean(n.isInitialized || n.hasKeywordsDir)).length;
  }, [niches]);

  const completedCountTotal = useMemo(() => {
    return niches.filter((n) => (n.completedCount ?? 0) >= 10).length;
  }, [niches]);

  const totalProducts = useMemo(() => {
    return niches.reduce((sum, n) => {
      const count = n.productCount ?? n.productsCount ?? 0;
      return sum + count;
    }, 0);
  }, [niches]);

  // Derive categories list (standard + any from data)
  const categoryList = useMemo(() => {
    const set = new Set(STATIC_CATEGORIES);
    niches.forEach((n) => {
      if (n.category) set.add(n.category.toLowerCase());
    });
    return Array.from(set);
  }, [niches]);

  // Filter niches
  const filteredNiches = useMemo(() => {
    return niches.filter((niche) => {
      const title = (niche.title || '').toLowerCase();
      const coll = (niche.collection || '').toLowerCase();
      const cat = (niche.category || '').toLowerCase();
      const id = (niche.id || `${cat}/${coll}`).toLowerCase();
      const search = searchTerm.trim().toLowerCase();

      const matchesSearch =
        !search ||
        title.includes(search) ||
        coll.includes(search) ||
        cat.includes(search) ||
        id.includes(search);

      const matchesCategory =
        selectedCategory === 'Все' || cat === selectedCategory.toLowerCase();

      return matchesSearch && matchesCategory;
    });
  }, [niches, searchTerm, selectedCategory]);

  const handleInit = async (niche) => {
    const key = niche.id || `${niche.category}/${niche.collection}`;
    if (initializingKeys[key]) return;

    setInitializingKeys((prev) => ({ ...prev, [key]: true }));
    try {
      if (onInitNiche) {
        await onInitNiche(niche.category, niche.collection);
      }
    } catch (err) {
      console.error('Error initializing niche:', err);
    } finally {
      setInitializingKeys((prev) => ({ ...prev, [key]: false }));
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Верхняя панель со сводными метриками в чистом стиле Pinterest Light */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div className="bg-white border border-gray-200 rounded-xl p-4 flex flex-col justify-between shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium">Всего ниш</span>
            <Layers className="w-4 h-4 text-slate-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900">{totalNiches}</span>
            <span className="text-xs text-slate-500">коллекций</span>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-4 flex flex-col justify-between shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium">Развернуто в Keywords</span>
            <FolderCheck className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-emerald-600">{initializedCount}</span>
            <span className="text-xs text-slate-500">из {totalNiches}</span>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-4 flex flex-col justify-between shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium">Завершено на 100%</span>
            <CheckCircle2 className="w-4 h-4 text-[#E60023]" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-[#E60023]">{completedCountTotal}</span>
            <span className="text-xs text-slate-500">8/8 шагов</span>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-4 flex flex-col justify-between shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium">Товаров на сайте</span>
            <ShoppingBag className="w-4 h-4 text-blue-600" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-blue-600">
              {totalProducts.toLocaleString()}
            </span>
            <span className="text-xs text-slate-500">продуктов</span>
          </div>
        </div>
      </div>

      {/* 2. Поиск и фильтрация по категориям (chips) */}
      <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-3 shadow-xs">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Поиск по названию ниши, категории или коллекции..."
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-gray-200 rounded-lg text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-[#E60023] focus:ring-1 focus:ring-[#E60023] transition-colors"
          />
        </div>

        {/* Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 pt-1 no-scrollbar">
          {categoryList.map((cat) => {
            const isActive = selectedCategory.toLowerCase() === cat.toLowerCase();
            return (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition-all cursor-pointer ${
                  isActive
                    ? 'bg-[#E60023] text-white font-semibold shadow-xs'
                    : 'bg-white text-slate-600 hover:text-slate-900 hover:bg-slate-50 border border-gray-200'
                }`}
              >
                {cat}
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. Сетка карточек ниш (2-3 колонки) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredNiches.length === 0 ? (
          <div className="col-span-full py-12 text-center text-slate-500 bg-white border border-gray-200 rounded-xl text-xs shadow-xs">
            Ниши не найдены. Попробуйте сбросить фильтры поиска.
          </div>
        ) : (
          filteredNiches.map((niche) => {
            const nicheId = niche.id || `${niche.category}/${niche.collection}`;
            const isInitialized = Boolean(niche.isInitialized || niche.hasKeywordsDir);
            const pCount = niche.productCount ?? niche.productsCount ?? 0;
            const currentStep = niche.currentStep ?? niche.progress?.currentStep ?? 1;
            const completedCount =
              niche.completedCount ??
              (Array.isArray(niche.stepStatuses)
                ? niche.stepStatuses.filter(Boolean).length
                : currentStep - 1);
            const totalSteps = niche.totalSteps || 10;
            const percent =
              niche.progress?.percent ??
              Math.min(100, Math.round((completedCount / totalSteps) * 100));
            const isInitLoading = Boolean(initializingKeys[nicheId]);

            const isMulti =
              niche.architecture === 'multi_segment' ||
              (niche.segmentsCount !== undefined && niche.segmentsCount > 0) ||
              (Array.isArray(niche.segments) && niche.segments.length > 0);

            const segCount =
              niche.segmentsCount ?? (Array.isArray(niche.segments) ? niche.segments.length : 0);

            return (
              <div
                key={nicheId}
                className="bg-white border border-gray-200 hover:border-slate-300 rounded-xl p-4.5 flex flex-col justify-between transition-all duration-200 hover:shadow-md space-y-3.5 group shadow-xs"
              >
                {/* Header: Title + Keywords Indicator */}
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <h3
                      className="font-bold text-sm text-slate-900 group-hover:text-[#E60023] transition-colors truncate flex-1"
                      title={niche.title || niche.collection}
                    >
                      {niche.title || niche.collection}
                    </h3>

                    {/* Индикатор инициализации в Keywords */}
                    {isInitialized ? (
                      <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full shrink-0">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        <span>В Keywords</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-slate-500 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-full shrink-0">
                        <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                        <span>Не развернута</span>
                      </span>
                    )}
                  </div>

                  {/* Архитектура ниши + Категория + Товары */}
                  <div className="flex items-center gap-2 text-xs flex-wrap">
                    {/* Architecture Badge */}
                    {isMulti ? (
                      <span
                        className="inline-flex items-center gap-1 text-[11px] font-semibold rounded bg-red-50 text-[#E60023] border border-red-200 px-2 py-0.5"
                        title={`Мульти-сегментная ниша (${segCount} сегментов)`}
                      >
                        <span>🔴</span>
                        <span>{segCount} сегмента</span>
                      </span>
                    ) : (
                      <span
                        className="inline-flex items-center gap-1 text-[11px] font-medium rounded bg-slate-100 text-slate-700 border border-slate-200 px-2 py-0.5"
                        title="Моно-ядро (единый набор интентов)"
                      >
                        <span>⚪</span>
                        <span>Моно-ядро</span>
                      </span>
                    )}

                    <span className="px-2 py-0.5 rounded bg-slate-50 border border-gray-200 text-slate-600 font-mono text-[11px]">
                      {niche.category}
                    </span>

                    <span className="inline-flex items-center gap-1 text-slate-500 text-xs">
                      <ShoppingBag className="w-3.5 h-3.5 text-slate-400" />
                      <span>{pCount} шт.</span>
                    </span>
                  </div>
                </div>

                {/* Sub-Segments Preview (if multi_segment) */}
                {isMulti && Array.isArray(niche.segments) && niche.segments.length > 0 && (
                  <div className="space-y-1.5 pt-1 border-t border-slate-100">
                    <div className="text-[11px] font-medium text-slate-500 flex items-center justify-between">
                      <span>Сегменты ниши:</span>
                      <span className="text-[10px] text-slate-400 font-mono">{niche.segments.length} шт.</span>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {niche.segments.slice(0, 4).map((seg) => (
                        <span
                          key={seg.name}
                          onClick={() => onSelectNiche?.(nicheId, 'pipeline')}
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium bg-slate-50 hover:bg-red-50 text-slate-700 hover:text-[#E60023] border border-gray-200 hover:border-red-200 transition-colors cursor-pointer"
                          title={`Сегмент: ${seg.name} (${seg.completedCount}/10 шагов)`}
                        >
                          <span className="w-1 h-1 rounded-full bg-[#E60023]" />
                          <span className="truncate max-w-[130px]">{seg.name}</span>
                        </span>
                      ))}
                      {niche.segments.length > 4 && (
                        <span className="text-[10px] text-slate-400 font-mono self-center">
                          +{niche.segments.length - 4} ещё
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {/* Прогресс-бар (0-100%) и номер текущего шага */}
                <div className="space-y-1.5 pt-1">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-500 font-medium">
                      Шаг {currentStep} из 10
                    </span>
                    <span className="font-mono text-[#E60023] font-bold">
                      {percent}%
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden border border-slate-200 p-0.5">
                    <div
                      className="bg-gradient-to-r from-red-600 via-rose-500 to-[#E60023] h-full rounded-full transition-all duration-300"
                      style={{ width: `${Math.max(4, percent)}%` }}
                    />
                  </div>
                </div>

                {/* Кнопки действий */}
                <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center gap-2">
                  {/* Кнопка "В Штурман" styled with Pinterest Red */}
                  <button
                    type="button"
                    onClick={() => onSelectNiche?.(nicheId, 'pipeline')}
                    className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-[#E60023] hover:bg-[#ad081b] rounded-lg shadow-2xs transition-all active:scale-95 cursor-pointer"
                  >
                    <Compass className="w-3.5 h-3.5" />
                    <span>🧭 В Штурман</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => onSelectNiche?.(nicheId, 'auditor')}
                    className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg border border-slate-300 transition-colors cursor-pointer"
                  >
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                    <span>🛡️ В Аудитор</span>
                  </button>

                  {!isInitialized && (
                    <button
                      type="button"
                      onClick={() => handleInit(niche)}
                      disabled={isInitLoading}
                      className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-amber-600 hover:bg-amber-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg shadow transition-colors cursor-pointer"
                    >
                      {isInitLoading ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          <span>Развертывание...</span>
                        </>
                      ) : (
                        <>
                          <Zap className="w-3.5 h-3.5" />
                          <span>⚡ Развернуть</span>
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
