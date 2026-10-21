'use client';

import React from 'react';
import {
  ShieldCheck,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  FileSpreadsheet,
  FileCheck,
  Sparkles
} from 'lucide-react';

export default function Step7Audit({
  selectedNiche,
  onSwitchTab,
  activeSegment = null
}) {
  const title = selectedNiche?.title || selectedNiche?.collection || 'Выбранная ниша';

  const auditChecks = [
    {
      title: 'Проверка структуры и колонок Excel',
      desc: 'Автоматическая сверка обязательных колонок: Title, Description, Link, Board, Image, Alt Text, Date.'
    },
    {
      title: 'Валидация 100 строк и дат',
      desc: 'Контроль ровного объема (100 пинов), отсутствия пропусков и корректности временного интервала публикаций.'
    },
    {
      title: 'Контроль эмодзи и CTA триггеров',
      desc: 'Проверка разнообразия (≥10 типов эмодзи) и обязательного наличия FREE/Download триггера в CTA.'
    },
    {
      title: 'Проверка For Main и метаданных досок',
      desc: 'Наличие Boards_Name.txt, Boards_Tags.txt и генераторов профиля Pinterest.'
    }
  ];

  return (
    <div className="w-full bg-white border border-gray-200 rounded-2xl p-6 shadow-xs space-y-6 text-slate-800">
      {/* Step Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-100">
        <div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <span className="flex items-center justify-center w-6 h-6 rounded-full bg-[#E60023] text-white text-xs font-bold shadow-xs">
              7
            </span>
            <h3 className="text-base font-bold text-slate-900">
              Шаг 7: QA Аудит качества перед запуском
            </h3>
            {activeSegment && (
              <span className="text-xs bg-red-50 text-[#E60023] border border-red-200 px-2 py-0.5 rounded-full font-semibold flex items-center gap-1">
                🏷️ {activeSegment}
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Комплексный автоматический аудит таблиц и файлов для предотвращения сбоев в Make.
          </p>
        </div>

        {/* Status Badge */}
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-semibold">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>Модуль QA готов</span>
        </div>
      </div>

      {/* Main Feature Banner */}
      <div className="bg-gradient-to-br from-red-50/80 via-white to-red-50/30 border border-red-200/80 rounded-2xl p-6 text-center sm:text-left flex flex-col sm:flex-row items-center justify-between gap-6 shadow-2xs">
        <div className="space-y-2 max-w-xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-100/70 text-[#E60023] border border-red-200 text-[11px] font-semibold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Встроенный инспектор качества</span>
          </div>
          <h4 className="text-lg font-bold text-slate-900">
            Полная автоматическая проверка ниши «{title}»
          </h4>
          <p className="text-xs text-slate-600 leading-relaxed">
            Модуль QA Аудитора автоматически считывает все таблицы .xlsx, сканирует каждую строку на ошибки, проверяет даты публикаций, стоп-слова, эмодзи и выставляет итоговый вердикт готовности к запуску.
          </p>
        </div>

        {/* Big Action Button */}
        <div className="shrink-0 w-full sm:w-auto">
          <button
            type="button"
            onClick={() => onSwitchTab?.('auditor')}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-6 py-3.5 bg-[#E60023] hover:bg-[#ad081b] active:scale-98 text-white font-semibold text-sm rounded-xl shadow-xs transition-all cursor-pointer group"
          >
            <ShieldCheck className="w-5 h-5 text-white transition-transform group-hover:scale-110" />
            <span>🛡️ Перейти в QA Аудитор</span>
            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
          </button>
        </div>
      </div>

      {/* Checks Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
        {auditChecks.map((check, index) => (
          <div
            key={index}
            className="bg-gray-50 border border-gray-200 rounded-xl p-4 space-y-1"
          >
            <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
              <CheckCircle2 className="w-4 h-4 text-[#E60023] shrink-0" />
              <span>{check.title}</span>
            </div>
            <p className="text-[11px] text-slate-600 leading-relaxed pl-6">
              {check.desc}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
