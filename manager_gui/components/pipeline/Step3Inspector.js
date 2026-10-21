'use client';

import React, { useState } from 'react';
import {
  FileText,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  Info,
  ExternalLink,
  Search
} from 'lucide-react';

export default function Step3Inspector({
  selectedNiche,
  nicheDetail,
  activeSegment = null
}) {
  const [copied, setCopied] = useState(false);

  // Extract file statuses
  const filesInfo = selectedNiche?.filesInfo || nicheDetail?.niche?.filesInfo || {};

  const hasPininspector = Boolean(
    filesInfo.hasPininspector ??
    selectedNiche?.hasPininspector ??
    nicheDetail?.niche?.hasPininspector ??
    nicheDetail?.hasPininspector
  );

  const hasAllCsv = Boolean(
    filesInfo.hasAllCsv ??
    selectedNiche?.hasAllCsv ??
    nicheDetail?.niche?.hasAllCsv ??
    nicheDetail?.hasAllCsv
  );

  // Seed tags content for quick copy
  const seedContent =
    nicheDetail?.niche?.seedTags?.content ??
    nicheDetail?.files?.seedTags?.content ??
    nicheDetail?.seedTags?.content ??
    '';

  const handleCopyTags = async () => {
    if (!seedContent) return;
    try {
      await navigator.clipboard.writeText(seedContent);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy tags:', err);
    }
  };

  const isStepComplete = hasPininspector && hasAllCsv;

  return (
    <div className="w-full bg-white border border-gray-200 rounded-2xl p-6 shadow-xs space-y-6 text-slate-800">
      {/* Step Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-100">
        <div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <span className="flex items-center justify-center w-6 h-6 rounded-full bg-[#E60023] text-white text-xs font-bold shadow-xs">
              3
            </span>
            <h3 className="text-base font-bold text-slate-900">
              Шаг 3: Частотность (Pin Inspector)
            </h3>
            {activeSegment && (
              <span className="text-xs bg-red-50 text-[#E60023] border border-red-200 px-2 py-0.5 rounded-full font-semibold flex items-center gap-1">
                🏷️ {activeSegment}
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Сбор частотностей поисковых запросов и экспорт сырых данных для AI-фильтрации.
          </p>
        </div>

        {/* Global Step Status */}
        <div>
          {isStepComplete ? (
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Частотность собрана</span>
            </div>
          ) : (
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>Ожидается парсинг в Pin Inspector</span>
            </div>
          )}
        </div>
      </div>

      {/* Instructions for Manager */}
      <div className="bg-red-50/50 border border-red-100/80 rounded-xl p-4 space-y-3">
        <div className="flex items-start gap-3">
          <Info className="w-5 h-5 text-[#E60023] shrink-0 mt-0.5" />
          <div className="space-y-1 text-xs">
            <div className="font-bold text-slate-900 text-sm">
              Инструкция для менеджера:
            </div>
            <p className="text-slate-700 leading-relaxed">
              Скопируйте семена тегов из <strong className="text-slate-900">Шага 2</strong> в программу{' '}
              <strong className="text-slate-900">Pin Inspector</strong>, выберите глубину парсинга и
              экспортируйте результаты в файл <code className="text-[#E60023] bg-white px-1.5 py-0.5 rounded border border-red-200 font-mono font-semibold">(All).csv</code> в папку ниши.
            </p>
          </div>
        </div>

        {/* Quick copy seed tags button */}
        {seedContent && (
          <div className="pt-2.5 border-t border-red-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <span className="text-[11px] text-slate-600">
              Быстро скопировать семена тегов для вставки в Pin Inspector:
            </span>
            <button
              type="button"
              onClick={handleCopyTags}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-white hover:bg-gray-50 text-xs font-semibold text-slate-800 transition-colors border border-gray-300 shadow-2xs cursor-pointer"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="text-emerald-700">Скопировано!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-[#E60023]" />
                  <span>Скопировать семена</span>
                </>
              )}
            </button>
          </div>
        )}
      </div>

      {/* File Indicators */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Indicator 1: Pininspector.txt */}
        <div
          className={`flex items-start justify-between p-4 rounded-xl border transition-all ${
            hasPininspector
              ? 'bg-emerald-50/60 border-emerald-200'
              : 'bg-gray-50 border-gray-200'
          }`}
        >
          <div className="flex items-start gap-3">
            <div
              className={`p-2 rounded-xl shrink-0 ${
                hasPininspector ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-200 text-slate-500'
              }`}
            >
              <FileText className="w-5 h-5" />
            </div>
            <div className="space-y-0.5">
              <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                <span>Pininspector.txt</span>
              </div>
              <p className="text-[11px] text-slate-500">
                Служебный файл / пресет ключевых слов для парсера
              </p>
            </div>
          </div>

          <div className="shrink-0 ml-3">
            {hasPininspector ? (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-emerald-100 text-emerald-700 border border-emerald-200">
                <CheckCircle2 className="w-3 h-3" />
                <span>Найден</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-medium bg-gray-100 text-slate-600 border border-gray-300">
                <AlertCircle className="w-3 h-3 text-amber-500" />
                <span>Отсутствует</span>
              </span>
            )}
          </div>
        </div>

        {/* Indicator 2: (All).csv */}
        <div
          className={`flex items-start justify-between p-4 rounded-xl border transition-all ${
            hasAllCsv
              ? 'bg-emerald-50/60 border-emerald-200'
              : 'bg-gray-50 border-gray-200'
          }`}
        >
          <div className="flex items-start gap-3">
            <div
              className={`p-2 rounded-xl shrink-0 ${
                hasAllCsv ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-200 text-slate-500'
              }`}
            >
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div className="space-y-0.5">
              <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                <span>(All).csv</span>
              </div>
              <p className="text-[11px] text-slate-500">
                Экспорт таблицы всех ключевых слов и их Search Volume
              </p>
            </div>
          </div>

          <div className="shrink-0 ml-3">
            {hasAllCsv ? (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-emerald-100 text-emerald-700 border border-emerald-200">
                <CheckCircle2 className="w-3 h-3" />
                <span>Найден</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-medium bg-gray-100 text-slate-600 border border-gray-300">
                <AlertCircle className="w-3 h-3 text-amber-500" />
                <span>Отсутствует</span>
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Helpful step completion note */}
      <div className="text-xs text-slate-600 bg-gray-50 p-3.5 rounded-xl border border-gray-200">
        🎯 После экспорта файла <code className="text-slate-900 bg-white px-1.5 py-0.5 rounded border border-gray-200 font-mono font-semibold">(All).csv</code> в папку ниши шаг 3 будет автоматически считаться выполненным, и откроется доступ к <strong className="text-slate-900">Шагу 4 (AI Фильтр)</strong>.
      </div>
    </div>
  );
}
