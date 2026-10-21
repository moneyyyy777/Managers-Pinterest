'use client';

import React from 'react';
import {
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  Folder,
  Smile,
  Hash,
  Sparkles,
  HelpCircle,
  FileCheck2
} from 'lucide-react';

const REQUIREMENTS = [
  {
    id: 'rows',
    title: 'Ровно 100 строк данных',
    desc: 'Каждая таблица должна содержать ровно 100 сгенерированных пинов (без учета строки заголовков).',
    icon: Hash
  },
  {
    id: 'emojis',
    title: 'Разнообразие эмодзи (≥ 10 видов)',
    desc: 'В заголовках и описаниях должно быть использовано не менее 10 уникальных тематических эмодзи.',
    icon: Smile
  },
  {
    id: 'cta',
    title: 'Триггер FREE в CTA',
    desc: 'В призыве к действию (CTA) каждого пина обязательно используется триггер выгоды (Free / Download / Access).',
    icon: Sparkles
  }
];

export default function Step6Excel({
  selectedNiche,
  nicheDetail,
  activeSegment = null
}) {
  const excelFiles = nicheDetail?.niche?.excelFiles || [];
  const totalExcels = excelFiles.length;

  return (
    <div className="w-full bg-white border border-gray-200 rounded-2xl p-6 shadow-xs space-y-6 text-slate-800">
      {/* Step Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-100">
        <div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <span className="flex items-center justify-center w-6 h-6 rounded-full bg-[#E60023] text-white text-xs font-bold shadow-xs">
              6
            </span>
            <h3 className="text-base font-bold text-slate-900">
              Шаг 6: Excel генерация (Таблицы контента)
            </h3>
            {activeSegment && (
              <span className="text-xs bg-red-50 text-[#E60023] border border-red-200 px-2 py-0.5 rounded-full font-semibold flex items-center gap-1">
                🏷️ {activeSegment}
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Контроль наличия и соответствия стандартам готовых Excel таблиц с метаданными пинов.
          </p>
        </div>

        {/* Global Counter Badge */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gray-50 border border-gray-200 text-xs">
            <FileSpreadsheet className="w-3.5 h-3.5 text-slate-500" />
            <span className="text-slate-500">Найдено таблиц:</span>
            <span className="font-bold text-slate-900 font-mono">{totalExcels} из 4</span>
          </div>

          <div
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold ${
              totalExcels >= 4
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                : 'bg-amber-50 text-amber-700 border-amber-200'
            }`}
          >
            {totalExcels >= 4 ? (
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            ) : (
              <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
            )}
            <span>{totalExcels >= 4 ? 'Все 4 таблицы готовы' : 'Ожидаются таблицы'}</span>
          </div>
        </div>
      </div>

      {/* Checklist Requirements Banner */}
      <div className="bg-red-50/50 border border-red-100 rounded-xl p-4 space-y-3">
        <div className="flex items-center gap-2 text-xs font-bold text-slate-900">
          <FileCheck2 className="w-4 h-4 text-[#E60023]" />
          <span>Обязательный чек-лист качества генерации Excel</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {REQUIREMENTS.map((req) => {
            const Icon = req.icon;
            return (
              <div
                key={req.id}
                className="bg-white border border-gray-200 rounded-xl p-3.5 space-y-1.5 shadow-2xs"
              >
                <div className="flex items-center gap-2 text-[#E60023] font-semibold text-xs">
                  <Icon className="w-3.5 h-3.5 shrink-0" />
                  <span className="text-slate-900">{req.title}</span>
                </div>
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  {req.desc}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Found Excel Files List */}
      <div className="space-y-3">
        <h4 className="text-xs font-bold text-slate-900">
          Обнаруженные таблицы в папках ниши
        </h4>

        {excelFiles.length === 0 ? (
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-8 text-center text-xs text-slate-500 space-y-2">
            <FileSpreadsheet className="w-8 h-8 text-slate-300 mx-auto opacity-60" />
            <p className="font-semibold text-slate-800">
              Файлы .xlsx пока не обнаружены в папках интентов.
            </p>
            <p className="text-[11px] text-slate-500 max-w-md mx-auto">
              Используйте генератор контента (Step 6 Prompt) для создания 100 строк пинов для каждой из папок интентов.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {excelFiles.map((file, idx) => (
              <div
                key={file.fullPath || `${file.name}-${idx}`}
                className="flex items-center justify-between p-4 rounded-xl bg-gray-50/70 border border-gray-200 hover:border-gray-300 hover:bg-white transition-all shadow-2xs"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="p-2 rounded-xl bg-emerald-100 text-emerald-700 shrink-0">
                    <FileSpreadsheet className="w-4 h-4" />
                  </div>
                  <div className="truncate">
                    <div className="text-xs font-bold text-slate-900 font-mono truncate">
                      {file.name}
                    </div>
                    {file.folder && (
                      <div className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5 truncate">
                        <Folder className="w-3 h-3 shrink-0 text-slate-400" />
                        <span className="truncate">{file.folder}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="shrink-0 ml-3">
                  <span className="inline-flex items-center gap-1 text-[11px] text-emerald-700 bg-emerald-100 px-2.5 py-1 rounded-lg border border-emerald-200 font-semibold">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                    <span>Excel готов</span>
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="text-xs text-slate-600 bg-gray-50 p-3.5 rounded-xl border border-gray-200">
        💡 Для детальной автоматической проверки колонок, дат, CTA и триггеров перейдите к <strong className="text-slate-900">Шагу 7 (QA Аудит)</strong>.
      </div>
    </div>
  );
}
