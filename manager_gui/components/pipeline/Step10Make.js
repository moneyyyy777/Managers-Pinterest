'use client';

import React from 'react';
import {
  Zap,
  CheckCircle2,
  AlertCircle,
  FolderSync,
  Bot,
  Calendar,
  FileText,
  Share2,
  Clock,
  Sparkles,
  Layers,
  Package
} from 'lucide-react';

export default function Step10Make({
  selectedNiche,
  nicheDetail,
  activeSegment = null
}) {
  const filesInfo = selectedNiche?.filesInfo || nicheDetail?.niche?.filesInfo || {};
  const excelCount = filesInfo.excelFilesCount ?? (nicheDetail?.niche?.excelFiles?.length || 0);
  const hasForMain = Boolean(filesInfo.hasForMain);
  const hasGenerators = Boolean(filesInfo.hasGenerators);
  const hasBoardsName = Boolean(filesInfo.hasBoardsName);
  const hasBoardsTags = Boolean(filesInfo.hasBoardsTags);
  const hasTemplateFolder = Boolean(filesInfo.hasTemplateFolder || filesInfo.hasAllFoldersTemplate);

  // Overall readiness conditions
  const isReadyForPosting = excelCount >= 4 && hasForMain && hasBoardsName && hasBoardsTags;

  const readinessChecklist = [
    {
      id: 'excel',
      label: '4 Excel таблицы сгенерированы и согласованы',
      passed: excelCount >= 4,
      desc: `${excelCount} из 4 таблиц готовы к импорту в сценарии Make.`
    },
    {
      id: 'boards',
      label: 'Метаданные досок (Boards_Name & Boards_Tags)',
      passed: hasBoardsName && hasBoardsTags,
      desc: 'Названия досок и целевые теги аккаунта готовы для первичной настройки.'
    },
    {
      id: 'main',
      label: 'Служебная папка For Main',
      passed: hasForMain,
      desc: 'Файлы общих тегов и шаблонов сформированы.'
    },
    {
      id: 'generators',
      label: 'Генераторы профиля (Шаг 8: Имена и Описания)',
      passed: hasGenerators,
      desc: 'Name_Accounts.txt и Description_Generator.txt протестированы и назначены.'
    },
    {
      id: 'template',
      label: 'Шаблон Make собран в All Folders (Шаг 9)',
      passed: hasTemplateFolder,
      desc: 'Структура All Folders/Artify Studio/.../Template проверена и готова к выгрузке.'
    }
  ];

  return (
    <div className="w-full bg-white border border-gray-200 rounded-2xl p-6 shadow-xs space-y-6 text-slate-800">
      {/* Step Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-100">
        <div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <span className="flex items-center justify-center w-6 h-6 rounded-full bg-[#E60023] text-white text-xs font-bold shadow-xs">
              10
            </span>
            <h3 className="text-base font-bold text-slate-900">
              Шаг 10: Передача в Make (Автопостинг & Расписание)
            </h3>
            {activeSegment && (
              <span className="text-xs bg-red-50 text-[#E60023] border border-red-200 px-2 py-0.5 rounded-full font-semibold flex items-center gap-1">
                🏷️ {activeSegment}
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Финальная интеграция ниши в сценарии Make (Integromat) и запуск автопостинга пинов в Pinterest.
          </p>
        </div>

        {/* Global Readiness Badge */}
        <div>
          {isReadyForPosting ? (
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
              <Zap className="w-4 h-4 text-emerald-600 fill-emerald-600" />
              <span>Ниша готова к автопостингу</span>
            </div>
          ) : (
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
              <Clock className="w-4 h-4 text-amber-600" />
              <span>Подготовка к интеграции Make</span>
            </div>
          )}
        </div>
      </div>

      {/* Checklist items */}
      <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-900">
            <Bot className="w-4 h-4 text-[#E60023]" />
            <span>Контрольный чек-лист готовности к автопостингу (Make)</span>
          </div>
          <span className="text-[11px] text-slate-600 font-mono font-semibold">
            {readinessChecklist.filter((c) => c.passed).length} / {readinessChecklist.length} выполнено
          </span>
        </div>

        <div className="divide-y divide-gray-200/80">
          {readinessChecklist.map((item) => (
            <div
              key={item.id}
              className="py-3 flex items-start justify-between gap-3 first:pt-1 last:pb-1"
            >
              <div className="flex items-start gap-3">
                <div className="pt-0.5">
                  {item.passed ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-amber-500 shrink-0" />
                  )}
                </div>
                <div className="space-y-0.5">
                  <div
                    className={`text-xs font-semibold ${
                      item.passed ? 'text-slate-900' : 'text-slate-600'
                    }`}
                  >
                    {item.label}
                  </div>
                  <div className="text-[11px] text-slate-500">
                    {item.desc}
                  </div>
                </div>
              </div>

              <div className="shrink-0">
                {item.passed ? (
                  <span className="text-[11px] font-mono font-semibold text-emerald-700 bg-emerald-100 px-2.5 py-0.5 rounded-lg border border-emerald-200">
                    Готово
                  </span>
                ) : (
                  <span className="text-[11px] font-mono font-semibold text-amber-700 bg-amber-100 px-2.5 py-0.5 rounded-lg border border-amber-200">
                    Ожидает
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* All Folders & Posting Workflow Banner */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* All Folders Aggregator */}
        <div className="bg-gray-50/70 border border-gray-200 rounded-xl p-4 space-y-2">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-900">
            <FolderSync className="w-4 h-4 text-[#E60023]" />
            <span>Агрегатор «All Folders»</span>
          </div>
          <p className="text-[11px] text-slate-600 leading-relaxed">
            Автоматическая сборка всех интентов ниши и шаблона Make в общую папку для централизованной загрузки в сценарий Make.
          </p>
          <div className="text-[11px] text-slate-700 font-mono bg-white p-2.5 rounded-lg border border-gray-200 font-semibold truncate">
            All Folders/Artify Studio/...
          </div>
        </div>

        {/* Schedule & Make Scenario */}
        <div className="bg-gray-50/70 border border-gray-200 rounded-xl p-4 space-y-2">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-900">
            <Calendar className="w-4 h-4 text-[#E60023]" />
            <span>Расписание и автопилот</span>
          </div>
          <p className="text-[11px] text-slate-600 leading-relaxed">
            Make публикует по 10–15 пинов в сутки согласно временным слотам, распределяя нагрузку между досками.
          </p>
          <div className="text-[11px] text-emerald-700 font-semibold flex items-center gap-1.5 pt-0.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>Режим публикации: 100 пинов / интент</span>
          </div>
        </div>
      </div>
    </div>
  );
}
