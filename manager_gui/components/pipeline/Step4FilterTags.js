'use client';

import React, { useState, useMemo } from 'react';
import {
  Search,
  ExternalLink,
  AlertTriangle,
  CheckCircle2,
  Filter,
  Sparkles,
  Tag,
  AlertCircle,
  SlidersHorizontal,
  Copy
} from 'lucide-react';
import TagManagerModal from '../tags/TagManagerModal';

const OLD_YEAR_REGEX = /\b(202[1-5])\b/;

export default function Step4FilterTags({
  selectedNiche,
  nicheDetail,
  activeSegment = null
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [onlyOldYears, setOnlyOldYears] = useState(false);
  const [isTagModalOpen, setIsTagModalOpen] = useState(false);

  // Extract raw filter items from nicheDetail or props
  const filterTagsData = useMemo(() => {
    return (
      nicheDetail?.niche?.filterTags ||
      nicheDetail?.files?.filterTags ||
      nicheDetail?.filterTags ||
      {}
    );
  }, [nicheDetail]);

  const rawItems = useMemo(() => {
    const items = filterTagsData.items || [];
    if (!Array.isArray(items)) return [];
    return items.map((item, index) => {
      if (typeof item === 'string') {
        const match = item.match(OLD_YEAR_REGEX);
        return {
          id: index,
          keyword: item,
          volume: null,
          hasOldYear: Boolean(match),
          yearMatch: match ? match[1] : null
        };
      }
      const kw = item.keyword || item.tag || '';
      const match = kw.match(OLD_YEAR_REGEX);
      return {
        id: item.id ?? index,
        keyword: kw,
        volume: item.volume ?? null,
        hasOldYear: Boolean(item.hasOldYear || match),
        yearMatch: match ? match[1] : null
      };
    });
  }, [filterTagsData]);

  // Overall statistics
  const totalCount = filterTagsData.count ?? rawItems.length;
  const oldYearsCount = useMemo(() => {
    if (typeof filterTagsData.oldYearsCount === 'number') {
      return filterTagsData.oldYearsCount;
    }
    return rawItems.filter((i) => i.hasOldYear).length;
  }, [filterTagsData, rawItems]);

  // Filtered items based on search and old years toggle
  const filteredItems = useMemo(() => {
    let list = rawItems;
    if (onlyOldYears) {
      list = list.filter((i) => i.hasOldYear);
    }
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase().trim();
      list = list.filter((i) => i.keyword.toLowerCase().includes(q));
    }
    return list;
  }, [rawItems, onlyOldYears, searchTerm]);

  return (
    <div className="w-full bg-white border border-gray-200 rounded-2xl p-6 shadow-xs space-y-6 text-slate-800">
      {/* Step Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-100">
        <div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <span className="flex items-center justify-center w-6 h-6 rounded-full bg-[#E60023] text-white text-xs font-bold shadow-xs">
              4
            </span>
            <h3 className="text-base font-bold text-slate-900">
              Шаг 4: AI Фильтр (OpenAI Cleaned Tags)
            </h3>
            {activeSegment && (
              <span className="text-xs bg-red-50 text-[#E60023] border border-red-200 px-2 py-0.5 rounded-full font-semibold flex items-center gap-1">
                🏷️ {activeSegment}
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Проверка очищенных ключевых слов из файла <code className="text-slate-800 bg-gray-100 px-1.5 py-0.5 rounded font-mono font-semibold">Filter by OpenAI.csv</code> и аудит на устаревшие годы.
          </p>
        </div>

        {/* Top Metric Badges */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gray-50 border border-gray-200 text-xs">
            <Tag className="w-3.5 h-3.5 text-slate-500" />
            <span className="text-slate-500">Всего тегов:</span>
            <span className="font-bold text-slate-900 font-mono">{totalCount}</span>
          </div>

          <div
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold ${
              oldYearsCount > 0
                ? 'bg-amber-50 text-amber-800 border-amber-200'
                : 'bg-emerald-50 text-emerald-700 border-emerald-200'
            }`}
          >
            {oldYearsCount > 0 ? (
              <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
            ) : (
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            )}
            <span>Старых годов:</span>
            <span className="font-bold font-mono">{oldYearsCount}</span>
          </div>
        </div>
      </div>

      {/* Warning message if old years detected */}
      {oldYearsCount > 0 && (
        <div className="flex items-start gap-3 p-4 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900">
          <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <div className="font-bold text-amber-900">
              Внимание: обнаружены теги с прошедшими годами (2021–2025)
            </div>
            <p className="text-amber-800/90 leading-relaxed">
              Такие теги снижают CTR и конверсию в Pinterest. Рекомендуется заменить их на 2026/2027 год или удалить перед кластеризацией.
            </p>
          </div>
        </div>
      )}

      {/* Search and Filters Toolbar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Search Field */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Поиск по отфильтрованным ключевым словам..."
            className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#E60023] focus:bg-white transition-all shadow-2xs"
          />
        </div>

        {/* Filter Toggle */}
        <div className="flex items-center gap-2 shrink-0 flex-wrap">
          <button
            type="button"
            onClick={() => setIsTagModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-white text-slate-800 border border-gray-300 hover:bg-gray-50 transition-all cursor-pointer shadow-2xs"
          >
            <SlidersHorizontal className="w-3.5 h-3.5 text-[#E60023]" />
            <span>📥 Менеджер тегов ({rawItems.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setOnlyOldYears(!onlyOldYears)}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
              onlyOldYears
                ? 'bg-amber-50 text-amber-800 border-amber-300 shadow-2xs'
                : 'bg-white text-slate-700 border-gray-200 hover:text-slate-900 hover:bg-gray-50'
            }`}
          >
            <Filter className="w-3.5 h-3.5 text-slate-500" />
            <span>Только старые годы</span>
            {oldYearsCount > 0 && (
              <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-amber-500 text-white font-mono font-bold">
                {oldYearsCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Tags List */}
      <div className="bg-gray-50/70 border border-gray-200 rounded-xl p-3">
        {rawItems.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-500 space-y-3">
            <Sparkles className="w-8 h-8 text-slate-400 mx-auto opacity-50" />
            <div>
              <p className="font-semibold text-slate-800">
                Файл Filter by OpenAI.csv еще не создан или не содержит тегов.
              </p>
              <p className="text-[11px] text-slate-500 max-w-md mx-auto mt-0.5">
                Запустите фильтрацию сырых ключевых слов из (All).csv через ChatGPT / Claude с промптом Шага 4 или импортируйте теги вручную.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setIsTagModalOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-white hover:bg-gray-50 text-slate-800 text-xs font-semibold rounded-xl border border-gray-300 shadow-2xs transition-colors cursor-pointer"
            >
              <SlidersHorizontal className="w-3.5 h-3.5 text-[#E60023]" />
              <span>📥 Открыть Менеджер тегов (Импорт / Буфер / Файл)</span>
            </button>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-500">
            По вашему запросу теги не найдены.
          </div>
        ) : (
          <div className="max-h-[380px] overflow-y-auto divide-y divide-gray-200/60 pr-1 no-scrollbar">
            {filteredItems.map((item, idx) => {
              const pinterestUrl = `https://www.pinterest.com/search/pins/?q=${encodeURIComponent(item.keyword)}`;

              return (
                <div
                  key={item.id ?? idx}
                  className="flex items-center justify-between gap-3 py-2 px-2 hover:bg-white rounded-lg transition-colors group"
                >
                  {/* Left: Tag name & Volume & Warning badge */}
                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
                    <span className="text-[11px] text-slate-400 font-mono w-6 shrink-0 text-right">
                      {idx + 1}.
                    </span>

                    <span className="text-xs text-slate-800 font-medium truncate">
                      {item.keyword}
                    </span>

                    {/* Volume Pill */}
                    {item.volume && (
                      <span className="text-[10px] font-mono text-slate-500 bg-white px-1.5 py-0.5 rounded border border-gray-200 shrink-0">
                        vol: {item.volume}
                      </span>
                    )}

                    {/* Old Year Alert Badge */}
                    {item.hasOldYear && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200 shrink-0 animate-pulse">
                        ⚠️ Старый год ({item.yearMatch || '202x'})
                      </span>
                    )}
                  </div>

                  {/* Right: Pinterest button */}
                  <div className="shrink-0 flex items-center gap-2">
                    <a
                      href={pinterestUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-red-50 hover:bg-red-100 text-[#E60023] border border-red-200 text-[11px] font-semibold transition-colors shrink-0"
                      title={`Искать «${item.keyword}» на Pinterest`}
                    >
                      <span>📌</span>
                      <span>Pinterest</span>
                      <ExternalLink className="w-3 h-3 opacity-70 group-hover:opacity-100" />
                    </a>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="text-[11px] text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-2">
        <span>Показано: {filteredItems.length} из {rawItems.length} тегов</span>
        <span>Рекомендуемый объем выборки для кластеризации: 150–250 чистых тегов</span>
      </div>

      {/* Connected TagManagerModal */}
      {isTagModalOpen && (
        <TagManagerModal
          isOpen={isTagModalOpen}
          onClose={() => setIsTagModalOpen(false)}
          currentTags={rawItems.map((i) => i.keyword)}
          title={`Менеджер тегов (AI Фильтр): ${selectedNiche?.collection || selectedNiche?.category || 'Теги'}`}
          onApply={(newTags) => {
            // Can update local items or export
            setIsTagModalOpen(false);
          }}
        />
      )}
    </div>
  );
}
