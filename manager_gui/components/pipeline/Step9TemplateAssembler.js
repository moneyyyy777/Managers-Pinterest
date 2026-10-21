'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Package,
  Layers,
  FolderSync,
  CheckCircle2,
  AlertCircle,
  Loader2,
  FileText,
  FileSpreadsheet,
  Globe,
  Sliders,
  Sparkles,
  ArrowRight,
  ExternalLink,
  Copy,
  Check,
  SlidersHorizontal
} from 'lucide-react';
import TagManagerModal from '../tags/TagManagerModal';

export default function Step9TemplateAssembler({
  selectedNiche,
  nicheDetail,
  activeSegment = null,
  onGoToNextStep = null
}) {
  const category = selectedNiche?.category || nicheDetail?.niche?.category || '';
  const collection = selectedNiche?.collection || nicheDetail?.niche?.collection || '';

  // API data
  const [loading, setLoading] = useState(true);
  const [templateStatus, setTemplateStatus] = useState({
    exists: false,
    templatePath: '',
    donors: [],
    availableExcels: []
  });

  // Mapper form state
  const [selectedDonor, setSelectedDonor] = useState('');
  const [boardsName, setBoardsName] = useState('');
  const [boardsTags, setBoardsTags] = useState('');
  const [linkSite, setLinkSite] = useState('');
  const [nameAccounts, setNameAccounts] = useState('Design');
  const [descGenerator, setDescGenerator] = useState('Design_Cliparts');
  const [sphere, setSphere] = useState('DESIGN_AND_ART');
  const [selectedExcel, setSelectedExcel] = useState('');
  const [isTagModalOpen, setIsTagModalOpen] = useState(false);

  // Assembler submission state
  const [isAssembling, setIsAssembling] = useState(false);
  const [assembleSuccess, setAssembleSuccess] = useState(false);
  const [assembledPath, setAssembledPath] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // Fetch template status & donors
  const fetchStatus = useCallback(async () => {
    setLoading(true);
    setErrorMessage('');
    try {
      const params = new URLSearchParams();
      if (category) params.set('category', category);
      if (collection) params.set('collection', collection);

      const res = await fetch(`/api/templates?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setTemplateStatus(data);
        if (data.donors && data.donors.length > 0 && !selectedDonor) {
          // Default donor: prefer one matching category or first
          const matching = data.donors.find((d) =>
            d.name.toLowerCase().includes((category || '').toLowerCase())
          );
          setSelectedDonor(matching ? matching.id : data.donors[0].id);
        }
        if (data.availableExcels && data.availableExcels.length > 0 && !selectedExcel) {
          setSelectedExcel(data.availableExcels[0].relativePath || data.availableExcels[0].filename);
        }
      }
    } catch (err) {
      console.error('Error fetching template status:', err);
    } finally {
      setLoading(false);
    }
  }, [category, collection, selectedDonor, selectedExcel]);

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  // Pre-fill Mapper with nicheDetail defaults
  useEffect(() => {
    if (nicheDetail?.niche) {
      const n = nicheDetail.niche;

      // Boards Name from intents or title
      if (!boardsName) {
        if (n.intents && n.intents.length > 0) {
          const names = n.intents.map((it) => it.name || it.folderName).join('\n');
          setBoardsName(names);
        } else if (n.title || collection) {
          setBoardsName(n.title || collection);
        }
      }

      // Boards Tags from intents or seed tags
      if (!boardsTags) {
        let tagsList = [];
        if (n.intents && n.intents.length > 0) {
          n.intents.forEach((it) => {
            if (Array.isArray(it.tags)) tagsList.push(...it.tags);
          });
        }
        if (tagsList.length === 0 && Array.isArray(n.seedTags)) {
          tagsList = n.seedTags;
        }
        setBoardsTags(Array.from(new Set(tagsList)).slice(0, 50).join('\n'));
      }

      // Link site
      if (!linkSite) {
        setLinkSite(n.websiteLink || 'https://artifystudio.com/');
      }

      // Generator names
      if (n.assignedGenerators) {
        if (n.assignedGenerators.nameGenerator) setNameAccounts(n.assignedGenerators.nameGenerator);
        if (n.assignedGenerators.descGenerator) setDescGenerator(n.assignedGenerators.descGenerator);
      }
    }
  }, [nicheDetail, collection, boardsName, boardsTags, linkSite]);

  // Handle assembly execution
  const handleAssemble = async () => {
    if (!category || !collection) {
      setErrorMessage('Сначала выберите нишу в верхней панели');
      return;
    }
    setIsAssembling(true);
    setErrorMessage('');
    setAssembleSuccess(false);

    try {
      const res = await fetch('/api/templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'assemble',
          category,
          collection,
          donor: selectedDonor,
          boardsName,
          boardsTags,
          linkSite,
          nameAccounts,
          descGenerator,
          sphere,
          excelFile: selectedExcel
        })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setAssembleSuccess(true);
        setAssembledPath(data.templatePath);
        fetchStatus();
      } else {
        setErrorMessage(data.error || 'Ошибка при сборке шаблона');
      }
    } catch (err) {
      console.error('Error assembling template:', err);
      setErrorMessage('Сетевая ошибка при сборке шаблона');
    } finally {
      setIsAssembling(false);
    }
  };

  const parsedTagsCount = useMemo(() => {
    return boardsTags
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean).length;
  }, [boardsTags]);

  // Niche files for TagManagerModal in Step 9
  const nicheFiles = useMemo(() => {
    const files = [];
    const n = nicheDetail?.niche;
    if (!n) return files;

    // Intent tags
    if (n.intents && n.intents.length > 0) {
      const intentTags = [];
      n.intents.forEach((it) => {
        if (Array.isArray(it.tags)) intentTags.push(...it.tags);
      });
      if (intentTags.length > 0) {
        files.push({
          name: 'Все теги интентов (Шаг 5)',
          count: intentTags.length,
          tags: intentTags,
          desc: 'Собранные теги со всех интентов'
        });
      }
    }

    // Filter tags
    const ft = n.filterTags?.items || [];
    if (ft.length > 0) {
      files.push({
        name: 'Filter by OpenAI.csv (Шаг 4)',
        count: ft.length,
        tags: ft.map((i) => (typeof i === 'string' ? i : i.keyword || i.tag)).filter(Boolean),
        desc: 'Очищенные AI теги'
      });
    }

    // Seed tags
    const seed = n.seedTags?.content || '';
    if (seed) {
      const seeds = seed.split('\n').map((s) => s.trim()).filter(Boolean);
      files.push({
        name: 'Seed Tags.txt (Шаг 2)',
        count: seeds.length,
        tags: seeds,
        desc: 'Исходные семена ниши'
      });
    }

    return files;
  }, [nicheDetail]);

  const parsedBoardsCount = useMemo(() => {
    return boardsName
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean).length;
  }, [boardsName]);

  return (
    <div className="w-full bg-white border border-gray-200 rounded-2xl p-6 shadow-xs space-y-6 text-slate-800">
      {/* Step Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-100">
        <div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <span className="flex items-center justify-center w-6 h-6 rounded-full bg-[#E60023] text-white text-xs font-bold shadow-xs">
              9
            </span>
            <h3 className="text-base font-bold text-slate-900">
              Шаг 9: Сборка Шаблона для отдела Make (All Folders)
            </h3>
            {activeSegment && (
              <span className="text-xs bg-red-50 text-[#E60023] border border-red-200 px-2 py-0.5 rounded-full font-semibold flex items-center gap-1">
                🏷️ {activeSegment}
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Финализация структуры All Folders/Artify Studio/[Category]/[Collection]/Template для автоматизированных сценариев Integromat/Make.
          </p>
        </div>

        {/* Status Pill */}
        {templateStatus.exists ? (
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 shrink-0">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Шаблон собран в All Folders</span>
          </div>
        ) : (
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200 shrink-0">
            <AlertCircle className="w-4 h-4 text-amber-600" />
            <span>Требуется сборка шаблона</span>
          </div>
        )}
      </div>

      {/* Template Status Banner */}
      {templateStatus.exists ? (
        <div className="p-4 bg-emerald-50/60 border border-emerald-200 rounded-xl space-y-1.5">
          <div className="flex items-center gap-2 text-xs font-bold text-emerald-900">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Готовый шаблон обнаружен на диске</span>
          </div>
          <p className="text-xs text-emerald-800 font-mono break-all">
            📁 {templateStatus.templatePath}
          </p>
          <p className="text-[11px] text-emerald-700">
            Вы можете пересобрать или обновить файлы шаблона (For Main, Template.xlsx, параметры) повторным запуском сборки.
          </p>
        </div>
      ) : (
        <div className="p-4 bg-amber-50/60 border border-amber-200 rounded-xl space-y-1">
          <div className="flex items-center gap-2 text-xs font-bold text-amber-900">
            <AlertCircle className="w-4 h-4 text-amber-600" />
            <span>Шаблон еще не экспортирован в All Folders</span>
          </div>
          <p className="text-xs text-amber-800">
            Настройте маппинг параметров ниже и нажмите «Собрать и экспортировать шаблон в All Folders», чтобы сгенерировать служебные файлы для Make.
          </p>
        </div>
      )}

      {/* Assembly Form / File Mapper */}
      <div className="bg-gray-50 border border-gray-200 rounded-2xl p-5 space-y-5">
        <div className="flex items-center justify-between pb-3 border-b border-gray-200">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-900">
            <Sliders className="w-4 h-4 text-[#E60023]" />
            <span>Маппинг компонентов шаблона Make (File Mapper)</span>
          </div>
          <span className="text-[11px] text-slate-500 font-mono">
            {collection || 'Ниша не выбрана'}
          </span>
        </div>

        {errorMessage && (
          <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs">
            ⚠️ {errorMessage}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* 1. Donor Selector */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 flex items-center justify-between">
              <span>1. Донор базовых файлов (Template Donor):</span>
              <span className="text-[10px] text-slate-400">Cookie, Token, конфиги</span>
            </label>
            <select
              value={selectedDonor}
              onChange={(e) => setSelectedDonor(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-gray-300 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-[#E60023]"
            >
              {templateStatus.donors.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>

          {/* 2. Excel Selector */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 flex items-center justify-between">
              <span>2. Таблица пинов (Template.xlsx):</span>
              <span className="text-[10px] text-slate-400">из папки ниши</span>
            </label>
            <select
              value={selectedExcel}
              onChange={(e) => setSelectedExcel(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-gray-300 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-[#E60023]"
            >
              {templateStatus.availableExcels.length === 0 ? (
                <option value="">Таблицы не найдены (будет использован шаблон донора)</option>
              ) : (
                templateStatus.availableExcels.map((ex) => (
                  <option key={ex.filename} value={ex.relativePath || ex.filename}>
                    {ex.filename}
                  </option>
                ))
              )}
            </select>
          </div>

          {/* 3. Boards_Name.txt */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 flex items-center justify-between">
              <span>3. Названия досок (Boards_Name.txt):</span>
              <span className="text-[11px] text-slate-500 font-mono">
                {parsedBoardsCount} досок
              </span>
            </label>
            <textarea
              value={boardsName}
              onChange={(e) => setBoardsName(e.target.value)}
              rows={4}
              placeholder="Введите названия досок, по одной на строку..."
              className="w-full p-3 bg-white border border-gray-300 rounded-xl text-xs font-mono text-slate-900 focus:outline-none focus:border-[#E60023]"
            />
          </div>

          {/* 4. Boards_Tags.txt */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
              <label>4. Целевые теги досок (Boards_Tags.txt):</label>
              <div className="flex items-center gap-2">
                <span className="text-[11px] text-slate-500 font-mono">
                  {parsedTagsCount} тегов
                </span>
                <button
                  type="button"
                  onClick={() => setIsTagModalOpen(true)}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-semibold bg-white hover:bg-gray-100 text-slate-800 rounded-lg border border-gray-300 shadow-2xs transition-colors cursor-pointer"
                >
                  <SlidersHorizontal className="w-3 h-3 text-[#E60023]" />
                  <span>📥 Менеджер тегов</span>
                </button>
              </div>
            </div>
            <textarea
              value={boardsTags}
              onChange={(e) => setBoardsTags(e.target.value)}
              rows={4}
              placeholder="Целевые поисковые теги, по одному на строку..."
              className="w-full p-3 bg-white border border-gray-300 rounded-xl text-xs font-mono text-slate-900 focus:outline-none focus:border-[#E60023]"
            />
          </div>

          {/* 5. Link_Site.txt */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700">
              5. Ссылка сайта для профиля (Link_Site.txt):
            </label>
            <div className="relative">
              <Globe className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={linkSite}
                onChange={(e) => setLinkSite(e.target.value)}
                placeholder="https://artifystudio.com/..."
                className="w-full pl-9 pr-3 py-2 bg-white border border-gray-300 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-[#E60023]"
              />
            </div>
          </div>

          {/* 6. Sphere.txt */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700">
              6. Сфера ниши (Sphere.txt):
            </label>
            <select
              value={sphere}
              onChange={(e) => setSphere(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-gray-300 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-[#E60023]"
            >
              <option value="DESIGN_AND_ART">DESIGN_AND_ART (Арт, клипарты, шрифты)</option>
              <option value="HOME_DECOR">HOME_DECOR (Декор и уют)</option>
              <option value="WELLNESS">WELLNESS (Здоровье, рецепты, фитнес)</option>
              <option value="FASHION">FASHION (Мода, стиль)</option>
            </select>
          </div>

          {/* 7. Name_Accounts & Description_Generator */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700">
              7. Генератор аккаунтов (Name_Accounts.txt):
            </label>
            <input
              type="text"
              value={nameAccounts}
              onChange={(e) => setNameAccounts(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-gray-300 rounded-xl text-xs font-mono text-slate-800 focus:outline-none focus:border-[#E60023]"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700">
              8. Генератор био (Description_Generator.txt):
            </label>
            <input
              type="text"
              value={descGenerator}
              onChange={(e) => setDescGenerator(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-gray-300 rounded-xl text-xs font-mono text-slate-800 focus:outline-none focus:border-[#E60023]"
            />
          </div>
        </div>

        {/* Action Button & Success Feedback */}
        <div className="pt-3 border-t border-gray-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="text-[11px] text-slate-500">
            Сборка создаст подпапку <strong>Template/For Main</strong> и скопирует файл <strong>Template.xlsx</strong>
          </div>

          <button
            type="button"
            onClick={handleAssemble}
            disabled={isAssembling || !category || !collection}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-xs font-semibold bg-[#E60023] hover:bg-[#ad081b] disabled:opacity-50 text-white shadow-xs transition-all cursor-pointer shrink-0"
          >
            {isAssembling ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Сборка шаблона...</span>
              </>
            ) : (
              <>
                <Package className="w-4 h-4" />
                <span>🚀 Собрать и экспортировать шаблон в All Folders</span>
              </>
            )}
          </button>
        </div>

        {assembleSuccess && (
          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between gap-3 text-xs text-emerald-800 animate-in fade-in">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>
                Шаблон успешно собран в: <strong>{assembledPath}</strong>
              </span>
            </div>
            {onGoToNextStep && (
              <button
                type="button"
                onClick={onGoToNextStep}
                className="inline-flex items-center gap-1 font-semibold text-emerald-700 hover:text-emerald-900 underline cursor-pointer shrink-0"
              >
                <span>Перейти к Шагу 10 (Make)</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        )}
      </div>
      {/* Connected TagManagerModal */}
      {isTagModalOpen && (
        <TagManagerModal
          isOpen={isTagModalOpen}
          onClose={() => setIsTagModalOpen(false)}
          currentTags={boardsTags.split('\n').filter(Boolean)}
          nicheFiles={nicheFiles}
          title={`Менеджер тегов досок: ${collection || category}`}
          onApply={(newTags) => {
            if (Array.isArray(newTags)) {
              setBoardsTags(newTags.join('\n'));
            }
            setIsTagModalOpen(false);
          }}
        />
      )}
    </div>
  );
}
