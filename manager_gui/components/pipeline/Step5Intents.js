'use client';

import React, { useState, useMemo } from 'react';
import {
  Folder,
  FolderCheck,
  FileSpreadsheet,
  FileText,
  CheckCircle2,
  AlertCircle,
  Tag,
  Layers,
  Eye,
  Search,
  Copy,
  Check,
  ExternalLink,
  X,
  SlidersHorizontal
} from 'lucide-react';
import TagManagerModal from '../tags/TagManagerModal';

export default function Step5Intents({
  selectedNiche,
  nicheDetail,
  activeSegment = null
}) {
  // Extract intent folders
  const intentFolders = nicheDetail?.niche?.intentFolders || [];

  // Extract boards info
  const filesInfo = selectedNiche?.filesInfo || nicheDetail?.niche?.filesInfo || {};
  const hasBoardsName = Boolean(filesInfo.hasBoardsName);
  const hasBoardsTags = Boolean(filesInfo.hasBoardsTags);

  const totalIntentsCount = intentFolders.length;
  const intentsWithExcel = intentFolders.filter((f) => f.hasExcel).length;

  // Inspector modal state
  const [inspectingFolder, setInspectingFolder] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedAll, setCopiedAll] = useState(false);
  const [isTagModalOpen, setIsTagModalOpen] = useState(false);

  // Tags list for current inspecting folder
  const currentFolderTags = useMemo(() => {
    if (!inspectingFolder) return [];
    if (Array.isArray(inspectingFolder.tags) && inspectingFolder.tags.length > 0) {
      return inspectingFolder.tags;
    }
    if (Array.isArray(inspectingFolder.sampleTags)) {
      return inspectingFolder.sampleTags;
    }
    return [];
  }, [inspectingFolder]);

  // Filtered tags for inspector modal
  const filteredInspectorTags = useMemo(() => {
    if (!searchQuery.trim()) return currentFolderTags;
    const q = searchQuery.toLowerCase().trim();
    return currentFolderTags.filter((t) => t.toLowerCase().includes(q));
  }, [currentFolderTags, searchQuery]);

  // Copy all tags of the inspecting folder
  const handleCopyAllFolderTags = async () => {
    if (currentFolderTags.length === 0) return;
    try {
      await navigator.clipboard.writeText(currentFolderTags.join('\n'));
      setCopiedAll(true);
      setTimeout(() => setCopiedAll(false), 2000);
    } catch (err) {
      console.error('Failed to copy tags:', err);
    }
  };

  return (
    <div className="w-full bg-white border border-gray-200 rounded-2xl p-6 shadow-xs space-y-6 text-slate-800">
      {/* Step Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-100">
        <div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <span className="flex items-center justify-center w-6 h-6 rounded-full bg-[#E60023] text-white text-xs font-bold shadow-xs">
              5
            </span>
            <h3 className="text-base font-bold text-slate-900">
              Шаг 5: Интенты (Кластеризация и папки)
            </h3>
            {activeSegment && (
              <span className="text-xs bg-red-50 text-[#E60023] border border-red-200 px-2 py-0.5 rounded-full font-semibold flex items-center gap-1">
                🏷️ {activeSegment}
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Разделение ключевых слов на целевые папки интентов (1..4+) и подготовка метаданных досок Pinterest.
          </p>
        </div>

        {/* Global Progress Badge */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gray-50 border border-gray-200 text-xs">
            <Folder className="w-3.5 h-3.5 text-slate-500" />
            <span className="text-slate-500">Папок интентов:</span>
            <span className="font-bold text-slate-900 font-mono">{totalIntentsCount}</span>
          </div>

          <div
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold ${
              totalIntentsCount >= 4
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                : 'bg-amber-50 text-amber-700 border-amber-200'
            }`}
          >
            {totalIntentsCount >= 4 ? (
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            ) : (
              <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
            )}
            <span>{totalIntentsCount >= 4 ? 'Все 4+ интентов созданы' : 'Требуется ≥ 4 интентов'}</span>
          </div>
        </div>
      </div>

      {/* Boards Status Section */}
      <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-900">
            <Layers className="w-4 h-4 text-[#E60023]" />
            <span>Статус служебных файлов досок Pinterest</span>
          </div>
          <span className="text-[11px] text-slate-500">
            Папка: <code className="text-slate-800 font-mono font-semibold">For Main/</code>
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Boards_Name.txt */}
          <div
            className={`flex items-center justify-between p-3.5 rounded-xl border text-xs transition-colors ${
              hasBoardsName
                ? 'bg-emerald-50/60 border-emerald-200'
                : 'bg-white border-gray-200'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <FileText
                className={`w-4 h-4 ${
                  hasBoardsName ? 'text-emerald-600' : 'text-slate-400'
                }`}
              />
              <div>
                <span className="font-semibold text-slate-800 font-mono">
                  Boards_Name.txt
                </span>
                <p className="text-[10px] text-slate-500">Названия досок аккаунта</p>
              </div>
            </div>
            {hasBoardsName ? (
              <span className="inline-flex items-center gap-1 text-[11px] text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-lg border border-emerald-200 font-semibold">
                <CheckCircle2 className="w-3 h-3" />
                <span>Готов</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-[11px] text-amber-700 bg-amber-100 px-2 py-0.5 rounded-lg border border-amber-200 font-semibold">
                <AlertCircle className="w-3 h-3" />
                <span>Не найден</span>
              </span>
            )}
          </div>

          {/* Boards_Tags.txt */}
          <div
            className={`flex items-center justify-between p-3.5 rounded-xl border text-xs transition-colors ${
              hasBoardsTags
                ? 'bg-emerald-50/60 border-emerald-200'
                : 'bg-white border-gray-200'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <Tag
                className={`w-4 h-4 ${
                  hasBoardsTags ? 'text-emerald-600' : 'text-slate-400'
                }`}
              />
              <div>
                <span className="font-semibold text-slate-800 font-mono">
                  Boards_Tags.txt
                </span>
                <p className="text-[10px] text-slate-500">Теги для досок и главной</p>
              </div>
            </div>
            {hasBoardsTags ? (
              <span className="inline-flex items-center gap-1 text-[11px] text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-lg border border-emerald-200 font-semibold">
                <CheckCircle2 className="w-3 h-3" />
                <span>Готов</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-[11px] text-amber-700 bg-amber-100 px-2 py-0.5 rounded-lg border border-amber-200 font-semibold">
                <AlertCircle className="w-3 h-3" />
                <span>Не найден</span>
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Intent Folders List */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-bold text-slate-900">
            Список папок интентов ниши
          </h4>
          <span className="text-[11px] text-slate-500">
            Сгенерировано Excel: <strong className="text-slate-800">{intentsWithExcel}</strong> из {totalIntentsCount}
          </span>
        </div>

        {intentFolders.length === 0 ? (
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-8 text-center text-xs text-slate-500 space-y-2">
            <Folder className="w-8 h-8 text-slate-300 mx-auto opacity-60" />
            <p className="font-semibold text-slate-800">
              Нумерованные папки интентов (1, 2, 3, 4...) пока не обнаружены.
            </p>
            <p className="text-[11px] text-slate-500 max-w-md mx-auto">
              Разложите отфильтрованные теги по смысловым интентам и создайте структуры папок вида «1 Название_Интента».
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {intentFolders.map((folder, index) => {
              const count = folder.tagsCount || folder.tags?.length || 0;

              return (
                <div
                  key={folder.name || index}
                  className="bg-gray-50/70 border border-gray-200 hover:border-gray-300 hover:bg-white rounded-xl p-4 space-y-3 transition-all shadow-2xs"
                >
                  {/* Folder Header */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <FolderCheck className="w-4 h-4 text-[#E60023] shrink-0" />
                      <span className="text-xs font-bold text-slate-900 truncate">
                        {folder.name}
                      </span>
                    </div>

                    {/* Excel file status badge */}
                    {folder.hasExcel ? (
                      <span className="inline-flex items-center gap-1 text-[10px] text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-md border border-emerald-200 shrink-0 font-semibold">
                        <FileSpreadsheet className="w-3 h-3 text-emerald-600" />
                        <span>{folder.excelName || '.xlsx'}</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[10px] text-slate-500 bg-white px-2 py-0.5 rounded-md border border-gray-200 shrink-0">
                        <span>Нет Excel</span>
                      </span>
                    )}
                  </div>

                  {/* Tags Info & Inspector Button */}
                  <div className="flex items-center justify-between text-xs text-slate-600 pt-1">
                    <div className="flex items-center gap-1.5">
                      <Tag className="w-3.5 h-3.5 text-slate-400" />
                      <span>Тегов в интенте:</span>
                      <span className="font-bold text-slate-900 font-mono">
                        {count}
                      </span>
                    </div>

                    {/* Button [👁️ Теги интента (X шт.)] */}
                    <button
                      type="button"
                      onClick={() => {
                        setInspectingFolder(folder);
                        setSearchQuery('');
                      }}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-white hover:bg-gray-100 text-[#E60023] border border-gray-300 shadow-2xs transition-all cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>👁️ Теги интента ({count} шт.)</span>
                    </button>
                  </div>

                  {/* Sample tags preview */}
                  {folder.sampleTags && folder.sampleTags.length > 0 && (
                    <div className="flex flex-wrap gap-1 pt-1.5 border-t border-gray-200/70">
                      {folder.sampleTags.slice(0, 3).map((tag, tIdx) => (
                        <span
                          key={tIdx}
                          className="text-[10px] bg-white text-slate-600 px-2 py-0.5 rounded-md border border-gray-200 truncate max-w-[150px]"
                        >
                          #{tag}
                        </span>
                      ))}
                      {folder.sampleTags.length > 3 && (
                        <span className="text-[10px] text-slate-400 self-center">
                          +{folder.sampleTags.length - 3}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Intent Tags Inspector Modal */}
      {inspectingFolder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div
            className="w-full max-w-2xl bg-white border border-gray-200 rounded-3xl shadow-2xl flex flex-col max-h-[85vh] overflow-hidden text-slate-800 animate-in fade-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50/50">
              <div className="flex items-center gap-2.5 min-w-0">
                <span className="flex items-center justify-center w-8 h-8 rounded-xl bg-red-50 text-[#E60023] border border-red-200 shrink-0">
                  <FolderCheck className="w-4 h-4" />
                </span>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-slate-900 truncate">
                      {inspectingFolder.name}
                    </h3>
                    <span className="text-xs px-2.5 py-0.5 rounded-full bg-red-50 text-[#E60023] border border-red-200 font-bold shrink-0">
                      {currentFolderTags.length} тегов
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 font-mono truncate">
                    {inspectingFolder.path}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setInspectingFolder(null)}
                className="w-8 h-8 flex items-center justify-center rounded-xl bg-white text-slate-400 hover:text-slate-800 hover:bg-gray-100 border border-gray-200 transition-colors cursor-pointer shrink-0 ml-2"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Toolbar: Search & Action Buttons */}
            <div className="p-4 border-b border-gray-100 bg-white space-y-3">
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                {/* Search Bar */}
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Быстрый поиск по тегам интента..."
                    className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#E60023] focus:bg-white"
                  />
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={handleCopyAllFolderTags}
                    disabled={currentFolderTags.length === 0}
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-gray-100 hover:bg-gray-200 text-slate-800 border border-gray-300 transition-colors cursor-pointer"
                  >
                    {copiedAll ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        <span className="text-emerald-700">Скопировано!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5 text-[#E60023]" />
                        <span>📋 Скопировать все</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsTagModalOpen(true)}
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-[#E60023] hover:bg-[#ad081b] text-white shadow-xs transition-colors cursor-pointer"
                  >
                    <SlidersHorizontal className="w-3.5 h-3.5" />
                    <span>📥 Менеджер тегов</span>
                  </button>
                </div>
              </div>

              <div className="text-[11px] text-slate-500 flex items-center justify-between">
                <span>Найдено: {filteredInspectorTags.length} из {currentFolderTags.length}</span>
                <span>Нажмите «🔍 Pinterest», чтобы посмотреть реальные пины</span>
              </div>
            </div>

            {/* Tags List */}
            <div className="p-4 overflow-y-auto max-h-[50vh] divide-y divide-gray-100">
              {filteredInspectorTags.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-400">
                  {currentFolderTags.length === 0
                    ? 'Теги в данном интенте еще не сформированы (Boards_Tags.txt пуст).'
                    : `По запросу «${searchQuery}» ничего не найдено.`}
                </div>
              ) : (
                filteredInspectorTags.map((tag, idx) => {
                  const pinterestUrl = `https://www.pinterest.com/search/pins/?q=${encodeURIComponent(tag)}`;

                  return (
                    <div
                      key={`${tag}-${idx}`}
                      className="flex items-center justify-between gap-3 py-2 px-2 hover:bg-gray-50 rounded-lg transition-colors group"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className="text-[11px] text-slate-400 font-mono w-6 shrink-0 text-right">
                          {idx + 1}.
                        </span>
                        <span className="text-xs text-slate-800 font-medium truncate">
                          {tag}
                        </span>
                      </div>

                      {/* Pinterest button */}
                      <a
                        href={pinterestUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-red-50 hover:bg-red-100 text-[#E60023] border border-red-200 text-[11px] font-semibold transition-colors shrink-0"
                        title={`Поиск «${tag}» на Pinterest`}
                      >
                        <span>🔍</span>
                        <span>Pinterest</span>
                        <ExternalLink className="w-3 h-3 opacity-70 group-hover:opacity-100" />
                      </a>
                    </div>
                  );
                })
              )}
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-end px-6 py-3 border-t border-gray-100 bg-gray-50/50">
              <button
                type="button"
                onClick={() => setInspectingFolder(null)}
                className="px-4 py-2 bg-white hover:bg-gray-100 text-slate-700 font-semibold text-xs rounded-xl border border-gray-200 transition-colors cursor-pointer"
              >
                Закрыть
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Connected TagManagerModal */}
      {isTagModalOpen && (
        <TagManagerModal
          isOpen={isTagModalOpen}
          onClose={() => setIsTagModalOpen(false)}
          currentTags={currentFolderTags}
          title={`Менеджер тегов: ${inspectingFolder?.name || 'Интент'}`}
          onApply={(newTags) => {
            if (inspectingFolder) {
              inspectingFolder.tags = newTags;
              inspectingFolder.tagsCount = newTags.length;
            }
            setIsTagModalOpen(false);
          }}
        />
      )}
    </div>
  );
}
