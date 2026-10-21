'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  Save,
  Loader2,
  ExternalLink,
  CheckCircle2,
  Tag,
  Edit3,
  List,
  AlertCircle,
  SlidersHorizontal,
  Copy,
  Check
} from 'lucide-react';
import TagManagerModal from '../tags/TagManagerModal';

export default function Step2SeedTags({
  selectedNiche,
  nicheDetail,
  onRefreshDetail,
  activeSegment = null
}) {
  const category = nicheDetail?.niche?.category || selectedNiche?.category || '';
  const collection = nicheDetail?.niche?.collection || selectedNiche?.collection || '';

  // Extract initial seed tags content from possible paths
  const rawSeedContent = useMemo(() => {
    return (
      nicheDetail?.niche?.seedTags?.content ??
      nicheDetail?.files?.seedTags?.content ??
      nicheDetail?.seedTags?.content ??
      ''
    );
  }, [nicheDetail]);

  const [seedTagsText, setSeedTagsText] = useState(rawSeedContent);
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState(null); // { type: 'success' | 'error', message: string }
  const [isTagModalOpen, setIsTagModalOpen] = useState(false);

  // Sync state if niche detail changes
  useEffect(() => {
    setSeedTagsText(rawSeedContent);
    setSaveStatus(null);
  }, [rawSeedContent, category, collection, activeSegment]);

  // Parse parsed tags list
  const tagsList = useMemo(() => {
    return seedTagsText
      .split('\n')
      .map((t) => t.trim())
      .filter((t) => t.length > 0);
  }, [seedTagsText]);

  // Niche files for TagManagerModal
  const nicheFiles = useMemo(() => {
    const files = [];
    if (rawSeedContent) {
      files.push({
        name: 'Seed Tags.txt',
        count: tagsList.length,
        tags: tagsList,
        desc: 'Текущие сохраненные семена'
      });
    }
    const filterTags =
      nicheDetail?.niche?.filterTags?.items ||
      nicheDetail?.files?.filterTags?.items ||
      [];
    if (filterTags.length > 0) {
      files.push({
        name: 'Filter by OpenAI.csv',
        count: filterTags.length,
        tags: filterTags.map((i) => (typeof i === 'string' ? i : i.keyword || i.tag)).filter(Boolean),
        desc: 'Очищенные теги из AI-фильтра'
      });
    }
    return files;
  }, [rawSeedContent, tagsList, nicheDetail]);

  const handleApplyFromModal = (tags) => {
    if (Array.isArray(tags)) {
      setSeedTagsText(tags.join('\n'));
    }
    setIsTagModalOpen(false);
  };

  // Handle Save
  const handleSave = async () => {
    if (!category || !collection) {
      setSaveStatus({
        type: 'error',
        message: 'Не выбрана категория или коллекция'
      });
      return;
    }

    try {
      setIsSaving(true);
      setSaveStatus(null);

      const res = await fetch('/api/niche/detail', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category,
          collection,
          segment: activeSegment,
          seedTagsContent: seedTagsText
        })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Ошибка при сохранении семян тегов');
      }

      setSaveStatus({
        type: 'success',
        message: `Сохранено ${data.count || tagsList.length} тегов в Seed Tags.txt${activeSegment ? ` (${activeSegment})` : ''}`
      });

      if (onRefreshDetail) {
        await onRefreshDetail();
      }
    } catch (err) {
      console.error('Error saving seed tags:', err);
      setSaveStatus({
        type: 'error',
        message: err.message || 'Не удалось сохранить'
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="w-full bg-white border border-gray-200 rounded-2xl p-6 shadow-xs space-y-6 text-slate-800">
      {/* Step Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-100">
        <div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <span className="flex items-center justify-center w-6 h-6 rounded-full bg-[#E60023] text-white text-xs font-bold shadow-xs">
              2
            </span>
            <h3 className="text-base font-bold text-slate-900">
              Шаг 2: Семена тегов (Seed Tags)
            </h3>
            {activeSegment && (
              <span className="text-xs bg-red-50 text-[#E60023] border border-red-200 px-2 py-0.5 rounded-full font-semibold flex items-center gap-1">
                🏷️ {activeSegment}
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Сформируйте 10–25 точных семян тегов для дальнейшего парсинга в Pin Inspector.
          </p>
        </div>

        {/* Action Button & Status */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            type="button"
            onClick={() => setIsTagModalOpen(true)}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-white hover:bg-gray-50 text-slate-800 font-semibold text-xs rounded-xl border border-gray-300 shadow-2xs transition-colors cursor-pointer"
          >
            <SlidersHorizontal className="w-4 h-4 text-[#E60023]" />
            <span>📥 Менеджер тегов (Импорт / Экспорт)</span>
          </button>

          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-[#E60023] hover:bg-[#ad081b] disabled:opacity-50 text-white font-semibold text-xs rounded-xl shadow-xs transition-colors cursor-pointer active:scale-98"
          >
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Сохранение...</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>💾 Сохранить семена</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Status Alert */}
      {saveStatus && (
        <div
          className={`flex items-center gap-2.5 p-3.5 rounded-xl text-xs font-semibold border ${
            saveStatus.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
              : 'bg-red-50 text-red-700 border-red-200'
          }`}
        >
          {saveStatus.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
          )}
          <span>{saveStatus.message}</span>
        </div>
      )}

      {/* Main Content: Two Columns on desktop (Editor & Pinterest Links List) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Left: Textarea for Editing */}
        <div className="flex flex-col bg-gray-50 border border-gray-200 rounded-xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 text-xs font-semibold text-slate-800">
              <Edit3 className="w-3.5 h-3.5 text-slate-500" />
              <span>Редактирование (по одному тегу на строку)</span>
            </label>
            <span className="text-[11px] text-slate-600 font-mono bg-white px-2 py-0.5 rounded-md border border-gray-200">
              Строк: {tagsList.length}
            </span>
          </div>

          <textarea
            value={seedTagsText}
            onChange={(e) => setSeedTagsText(e.target.value)}
            placeholder="christmas clipart snowman&#10;vintage santa claus&#10;festive holiday bundle..."
            rows={12}
            className="w-full p-3.5 bg-white border border-gray-200 rounded-xl text-xs font-mono text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#E60023] focus:ring-1 focus:ring-[#E60023] transition-colors resize-y leading-relaxed shadow-2xs"
          />

          <div className="text-[11px] text-slate-500">
            Каждая строка будет записана как отдельный seed tag в <span className="font-mono text-slate-800 font-semibold">Seed Tags.txt</span>
          </div>
        </div>

        {/* Right: Interactive List with 📌 Pinterest Links */}
        <div className="flex flex-col bg-gray-50 border border-gray-200 rounded-xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-800">
              <List className="w-3.5 h-3.5 text-slate-500" />
              <span>Проверка в Pinterest ({tagsList.length})</span>
            </div>
            <span className="text-[11px] text-slate-400">
              Клик для проверки выдачи
            </span>
          </div>

          <div className="h-[288px] overflow-y-auto space-y-1.5 pr-1 no-scrollbar divide-y divide-gray-200/70">
            {tagsList.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center p-6 text-center text-xs text-slate-400">
                <Tag className="w-8 h-8 text-slate-300 mb-2 opacity-60" />
                <span>Список тегов пуст. Введите теги слева и сохраните.</span>
              </div>
            ) : (
              tagsList.map((tag, idx) => {
                const pinterestUrl = `https://www.pinterest.com/search/pins/?q=${encodeURIComponent(tag)}`;
                return (
                  <div
                    key={`${tag}-${idx}`}
                    className="flex items-center justify-between gap-2 py-2 px-1 hover:bg-white rounded-lg transition-colors group"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-[11px] text-slate-400 font-mono w-5 shrink-0 text-right">
                        {idx + 1}.
                      </span>
                      <span className="text-xs text-slate-800 truncate font-medium">
                        {tag}
                      </span>
                    </div>

                    {/* Pinterest Button */}
                    <a
                      href={pinterestUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-red-50 hover:bg-red-100 text-[#E60023] border border-red-200 text-[11px] font-semibold transition-colors shrink-0"
                      title={`Искать «${tag}» на Pinterest`}
                    >
                      <span>📌</span>
                      <span>Pinterest</span>
                      <ExternalLink className="w-3 h-3 opacity-70 group-hover:opacity-100" />
                    </a>
                  </div>
                );
              })
            )}
          </div>

          <div className="text-[11px] text-slate-500 pt-1 border-t border-gray-200">
            💡 Нажмите 📌 Pinterest у любого тега, чтобы оценить реальный интерес и визуальные паттерны выдачи.
          </div>
        </div>
      </div>

      {/* Connected TagManagerModal */}
      {isTagModalOpen && (
        <TagManagerModal
          isOpen={isTagModalOpen}
          onClose={() => setIsTagModalOpen(false)}
          currentTags={tagsList}
          nicheFiles={nicheFiles}
          title={`Менеджер тегов (Семена): ${collection || category}`}
          onApply={handleApplyFromModal}
        />
      )}
    </div>
  );
}
