'use client';

import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import {
  Copy,
  Check,
  Sparkles,
  Compass,
  Loader2,
  ArrowRight,
  Layers,
  FileCode,
  SlidersHorizontal,
  Tag
} from 'lucide-react';

import PipelineRibbon from './pipeline/PipelineRibbon';
import Step1Foundation from './pipeline/Step1Foundation';
import Step2SeedTags from './pipeline/Step2SeedTags';
import Step3Inspector from './pipeline/Step3Inspector';
import Step4FilterTags from './pipeline/Step4FilterTags';
import Step5Intents from './pipeline/Step5Intents';
import Step6Excel from './pipeline/Step6Excel';
import Step7Audit from './pipeline/Step7Audit';
import Step8Generators from './pipeline/Step8Generators';
import Step9TemplateAssembler from './pipeline/Step9TemplateAssembler';
import Step10Make from './pipeline/Step10Make';
import TagManagerModal from './tags/TagManagerModal';

const STEP_DEFINITIONS = {
  1: { num: 1, title: 'База ниши' },
  2: { num: 2, title: 'Seed Tags' },
  3: { num: 3, title: 'PinInspector' },
  4: { num: 4, title: 'AI Фильтр' },
  5: { num: 5, title: 'Интенты' },
  6: { num: 6, title: 'Генерация Excel' },
  7: { num: 7, title: 'QA Аудит' },
  8: { num: 8, title: '⚙️ Генераторы' },
  9: { num: 9, title: '📦 Шаблон Make' },
  10: { num: 10, title: '🚀 Make & Deploy' }
};

export default function TabPipeline({
  selectedNiche = null,
  nicheDetail = null,
  onRefreshDetail,
  onInitNiche,
  onSwitchTab
}) {
  // Active step state initialized from selectedNiche.currentStep or 1
  const [activeStep, setActiveStep] = useState(selectedNiche?.currentStep || 1);
  const [copiedPrompt, setCopiedPrompt] = useState(false);
  const [isLoadingPrompt, setIsLoadingPrompt] = useState(false);

  // Multi-Segment active state
  const [activeSegment, setActiveSegment] = useState(null);
  const [scopedDetail, setScopedDetail] = useState(null);
  const [loadingSegment, setLoadingSegment] = useState(false);
  const [isGlobalTagModalOpen, setIsGlobalTagModalOpen] = useState(false);

  // Cache for fetched prompts per niche
  const promptsCache = useRef({});

  // Sync active step when selected niche changes
  useEffect(() => {
    if (selectedNiche?.currentStep) {
      setActiveStep(selectedNiche.currentStep);
    } else {
      setActiveStep(1);
    }
  }, [selectedNiche?.category, selectedNiche?.collection, selectedNiche?.id]);

  // Extract category and collection
  const category = selectedNiche?.category || nicheDetail?.niche?.category || '';
  const collection = selectedNiche?.collection || nicheDetail?.niche?.collection || '';
  const nicheTitle = selectedNiche?.title || nicheDetail?.niche?.title || collection;

  // Reset active segment when category or collection changes
  useEffect(() => {
    setActiveSegment(null);
    setScopedDetail(null);
  }, [category, collection]);

  // Handle segment selection & fetch scoped detail
  const handleSelectSegment = useCallback(
    async (segName) => {
      setActiveSegment(segName);
      if (!segName) {
        setScopedDetail(null);
        return;
      }
      if (!category || !collection) return;
      try {
        setLoadingSegment(true);
        const params = new URLSearchParams({
          category,
          collection,
          segment: segName
        });
        const res = await fetch(`/api/niche/detail?${params.toString()}`);
        const data = await res.json();
        if (data.success && data.niche) {
          setScopedDetail(data);
        }
      } catch (err) {
        console.error('Error fetching scoped segment detail:', err);
      } finally {
        setLoadingSegment(false);
      }
    },
    [category, collection]
  );

  // Refresh handler that refreshes both global detail and active segment
  const handleRefresh = useCallback(async () => {
    if (activeSegment && category && collection) {
      try {
        const params = new URLSearchParams({
          category,
          collection,
          segment: activeSegment
        });
        const res = await fetch(`/api/niche/detail?${params.toString()}`);
        const data = await res.json();
        if (data.success && data.niche) {
          setScopedDetail(data);
        }
      } catch (e) {
        console.error('Error refreshing segment detail:', e);
      }
    }
    if (onRefreshDetail) {
      await onRefreshDetail();
    }
  }, [activeSegment, category, collection, onRefreshDetail]);

  // Determine effective segments & niche detail
  const segments = nicheDetail?.niche?.segments || selectedNiche?.segments || [];
  const isMultiSegment =
    (nicheDetail?.niche?.architecture === 'multi_segment' ||
      selectedNiche?.architecture === 'multi_segment') &&
    segments.length > 0;

  const effectiveNicheDetail = activeSegment && scopedDetail ? scopedDetail : nicheDetail;
  const currentSegmentObj = activeSegment ? segments.find((s) => s.name === activeSegment) : null;
  const currentStepStatuses = activeSegment
    ? scopedDetail?.niche?.stepStatuses || currentSegmentObj?.stepStatuses || []
    : selectedNiche?.stepStatuses || nicheDetail?.niche?.stepStatuses || [];

  // Gather all available niche files with tags for TagManagerModal
  const globalNicheFiles = useMemo(() => {
    const files = [];
    const n = effectiveNicheDetail?.niche;
    if (!n) return files;

    // Seed tags
    const seed = n.seedTags?.content || '';
    if (seed) {
      const seeds = seed.split('\n').map((s) => s.trim()).filter(Boolean);
      files.push({
        name: 'Seed Tags.txt',
        count: seeds.length,
        tags: seeds,
        desc: 'Семена тегов ниши'
      });
    }

    // Filter tags
    const ft = n.filterTags?.items || [];
    if (ft.length > 0) {
      files.push({
        name: 'Filter by OpenAI.csv',
        count: ft.length,
        tags: ft.map((i) => (typeof i === 'string' ? i : i.keyword || i.tag)).filter(Boolean),
        desc: 'Очищенные теги (Шаг 4)'
      });
    }

    // Intents
    if (n.intents && n.intents.length > 0) {
      n.intents.forEach((it) => {
        if (Array.isArray(it.tags) && it.tags.length > 0) {
          files.push({
            name: `Интент: ${it.name || it.folderName}`,
            count: it.tags.length,
            tags: it.tags,
            desc: `Теги папки интента`
          });
        }
      });
    }

    return files;
  }, [effectiveNicheDetail]);

  // Handle Copy Prompt for the active step
  const handleCopyPrompt = async () => {
    if (!category || !collection) return;

    try {
      setIsLoadingPrompt(true);
      const cacheKey = `${category}/${collection}${activeSegment ? `:${activeSegment}` : ''}`;
      let prompts = promptsCache.current[cacheKey];

      if (!prompts) {
        const params = new URLSearchParams({
          category,
          collection,
          title: nicheTitle
        });
        if (activeSegment) {
          params.set('segment', activeSegment);
        }
        const res = await fetch(`/api/prompts?${params.toString()}`);
        const data = await res.json();
        if (data.success && Array.isArray(data.prompts)) {
          prompts = data.prompts;
          promptsCache.current[cacheKey] = prompts;
        } else {
          prompts = [];
        }
      }

      // Find matching prompt for active step
      let matchedPrompt = null;
      if (activeStep === 1 || activeStep === 2) {
        matchedPrompt = prompts.find((p) => p.step === 1 || p.id === 'step-1-seeds');
      } else if (activeStep === 4) {
        matchedPrompt = prompts.find((p) => p.step === 4 || p.id === 'step-2-filter');
      } else if (activeStep === 5) {
        matchedPrompt = prompts.find((p) => p.step === 5 || p.id === 'step-3-clusters');
      } else if (activeStep === 6) {
        matchedPrompt = prompts.find((p) => p.step === 6 || p.id === 'step-6-excel');
      } else if (activeStep === 7) {
        matchedPrompt = prompts.find((p) => p.step === 7 || p.id === 'step-7-audit');
      } else {
        matchedPrompt = prompts.find((p) => p.step === activeStep);
      }

      let textToCopy = '';
      if (matchedPrompt && (matchedPrompt.manualCopyPrompt || matchedPrompt.template)) {
        textToCopy = matchedPrompt.manualCopyPrompt || matchedPrompt.template;
      } else if (activeStep === 3) {
        textToCopy = `Парсинг частотностей ключевых слов для ниши "${nicheTitle}" в Pin Inspector:
1. Скопируйте семена тегов из файла Seed Tags.txt
2. Запустите Pin Inspector с глубиной парсинга 2
3. Дождитесь завершения сбора подсказок Pinterest
4. Экспортируйте файл в корень ниши с именем (All).csv`;
      } else if (activeStep === 8) {
        textToCopy = `Настройка и тестирование генераторов профиля (Шаг 8) для ниши "${nicheTitle}":
1. Выберите категорию (имена аккаунтов или био)
2. Задайте количество вариантов в Playground (ползунок 5..50)
3. Протестируйте генератор и нажмите «Назначить для этой ниши»`;
      } else if (activeStep === 9) {
        textToCopy = `Сборка шаблона Make в All Folders (Шаг 9) для ниши "${nicheTitle}":
1. Выберите донор базовой конфигурации
2. Проверьте маппинг Boards_Name, Boards_Tags, Link_Site, Sphere
3. Нажмите «Собрать и экспортировать шаблон в All Folders»`;
      } else if (activeStep === 10) {
        textToCopy = `Интеграция ниши "${nicheTitle}" в Make (Integromat, Шаг 10):
1. Проверьте агрегатор All Folders/.../Template
2. Импортируйте таблицы .xlsx в сценарий публикации
3. Настройте публикацию с интервалом 10-15 пинов в сутки`;
      } else {
        textToCopy = `Промпт этапа ${activeStep} для ниши "${nicheTitle}" (${category}/${collection})`;
      }

      await navigator.clipboard.writeText(textToCopy);
      setCopiedPrompt(true);
      setTimeout(() => setCopiedPrompt(false), 2000);
    } catch (err) {
      console.error('Failed to copy prompt:', err);
    } finally {
      setIsLoadingPrompt(false);
    }
  };

  // 1. Empty state if no niche is selected
  if (!selectedNiche) {
    return (
      <div className="w-full bg-white border border-gray-200 rounded-2xl p-12 text-center space-y-4 shadow-xs my-4">
        <div className="w-16 h-16 rounded-2xl bg-red-50 border border-red-200 flex items-center justify-center mx-auto text-[#E60023]">
          <Compass className="w-8 h-8" />
        </div>
        <div className="space-y-1.5 max-w-md mx-auto">
          <h3 className="text-base font-bold text-slate-900">
            Ниша не выбрана
          </h3>
          <p className="text-xs text-slate-500 leading-relaxed">
            Выберите нишу в верхнем селекторе или в Хабе Ниш для работы в Штурмане пайплайна.
          </p>
        </div>
        {onSwitchTab && (
          <div className="pt-2">
            <button
              type="button"
              onClick={() => onSwitchTab('hub')}
              className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-slate-800 text-xs font-semibold rounded-xl border border-gray-300 transition-colors cursor-pointer"
            >
              <span>Перейти в Хаб Ниш</span>
              <ArrowRight className="w-3.5 h-3.5 text-slate-500" />
            </button>
          </div>
        )}
      </div>
    );
  }

  const currentStepInfo = STEP_DEFINITIONS[activeStep] || {
    num: activeStep,
    title: `Шаг ${activeStep}`
  };

  return (
    <div className="w-full space-y-4">
      {/* 2. Top Ribbon with 8 steps & Multi-Segment Selector */}
      <PipelineRibbon
        activeStep={activeStep}
        onSelectStep={setActiveStep}
        stepStatuses={currentStepStatuses}
        segments={segments}
        activeSegment={activeSegment}
        onSelectSegment={handleSelectSegment}
        isMultiSegment={isMultiSegment}
      />

      {/* 3. Active Step Context Header */}
      <div className="bg-white border border-gray-200 rounded-2xl px-6 py-4 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="flex items-center justify-center w-7 h-7 rounded-full bg-[#E60023] text-white text-xs font-bold shadow-xs shrink-0">
            {currentStepInfo.num}
          </span>
          <div>
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2 flex-wrap">
              <span>{currentStepInfo.title}</span>
              <span className="text-xs text-slate-500 font-mono font-normal">
                ({category} / {collection})
              </span>
              {activeSegment && (
                <span className="text-xs bg-red-50 text-[#E60023] border border-red-200 px-2.5 py-0.5 rounded-full font-semibold flex items-center gap-1">
                  🏷️ {activeSegment}
                </span>
              )}
            </h2>
          </div>
        </div>

        {/* Actions: Tag Manager & Copy Prompt Button */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => setIsGlobalTagModalOpen(true)}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold bg-white hover:bg-gray-50 text-slate-800 border border-gray-300 shadow-2xs transition-colors cursor-pointer"
            title="Универсальный менеджер тегов: импорт, экспорт, буфер, локальные файлы ниши"
          >
            <SlidersHorizontal className="w-3.5 h-3.5 text-[#E60023]" />
            <span>🏷️ Менеджер тегов</span>
          </button>

          <button
            type="button"
            onClick={handleCopyPrompt}
            disabled={isLoadingPrompt}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer shadow-2xs ${
              copiedPrompt
                ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                : 'bg-gray-100 hover:bg-gray-200 text-slate-800 border-gray-300'
            }`}
          >
            {isLoadingPrompt ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin text-[#E60023]" />
                <span>Загрузка...</span>
              </>
            ) : copiedPrompt ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                <span className="text-emerald-700 font-semibold">Скопировано!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-[#E60023]" />
                <span>📋 Скопировать промпт этапа</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* 4. Active Step Content Container */}
      <div className="w-full">
        {loadingSegment && (
          <div className="p-4 mb-4 rounded-2xl bg-gray-50 border border-gray-200 flex items-center justify-center gap-2 text-xs text-slate-600">
            <Loader2 className="w-4 h-4 animate-spin text-[#E60023]" />
            <span>Загрузка данных сегмента "{activeSegment}"...</span>
          </div>
        )}

        {activeStep === 1 && (
          <Step1Foundation
            selectedNiche={selectedNiche}
            nicheDetail={effectiveNicheDetail}
            onInitNiche={onInitNiche}
            activeSegment={activeSegment}
          />
        )}

        {activeStep === 2 && (
          <Step2SeedTags
            selectedNiche={selectedNiche}
            nicheDetail={effectiveNicheDetail}
            onRefreshDetail={handleRefresh}
            activeSegment={activeSegment}
          />
        )}

        {activeStep === 3 && (
          <Step3Inspector
            selectedNiche={selectedNiche}
            nicheDetail={effectiveNicheDetail}
            activeSegment={activeSegment}
          />
        )}

        {activeStep === 4 && (
          <Step4FilterTags
            selectedNiche={selectedNiche}
            nicheDetail={effectiveNicheDetail}
            activeSegment={activeSegment}
          />
        )}

        {activeStep === 5 && (
          <Step5Intents
            selectedNiche={selectedNiche}
            nicheDetail={effectiveNicheDetail}
            activeSegment={activeSegment}
          />
        )}

        {activeStep === 6 && (
          <Step6Excel
            selectedNiche={selectedNiche}
            nicheDetail={effectiveNicheDetail}
            activeSegment={activeSegment}
          />
        )}

        {activeStep === 7 && (
          <Step7Audit
            selectedNiche={selectedNiche}
            nicheDetail={effectiveNicheDetail}
            onSwitchTab={onSwitchTab}
            activeSegment={activeSegment}
          />
        )}

        {activeStep === 8 && (
          <Step8Generators
            selectedNiche={selectedNiche}
            nicheDetail={effectiveNicheDetail}
            activeSegment={activeSegment}
          />
        )}

        {activeStep === 9 && (
          <Step9TemplateAssembler
            selectedNiche={selectedNiche}
            nicheDetail={effectiveNicheDetail}
            activeSegment={activeSegment}
            onGoToNextStep={() => setActiveStep(10)}
          />
        )}

        {activeStep === 10 && (
          <Step10Make
            selectedNiche={selectedNiche}
            nicheDetail={effectiveNicheDetail}
            activeSegment={activeSegment}
          />
        )}
      </div>

      {/* Global Universal TagManagerModal */}
      {isGlobalTagModalOpen && (
        <TagManagerModal
          isOpen={isGlobalTagModalOpen}
          onClose={() => setIsGlobalTagModalOpen(false)}
          currentTags={[]}
          nicheFiles={globalNicheFiles}
          title={`Менеджер тегов ниши: ${nicheTitle || collection || category || 'Все теги'}`}
          onApply={(tags) => {
            setIsGlobalTagModalOpen(false);
          }}
        />
      )}
    </div>
  );
}
