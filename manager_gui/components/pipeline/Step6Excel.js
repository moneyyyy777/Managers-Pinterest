'use client';

import React, { useState } from 'react';
import {
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  Folder,
  Smile,
  Hash,
  Sparkles,
  FileCheck2,
  Play,
  ExternalLink,
  Loader2,
  FileText,
  Zap
} from 'lucide-react';

const REQUIREMENTS = [
  {
    id: 'rows',
    title: 'Ровно 100 строк данных',
    desc: 'Каждая таблица должна содержать ровно 100 сгенерированных строк метаданных (без учета строки заголовков).',
    icon: Hash
  },
  {
    id: 'titles',
    title: 'Чистые заголовки (0 эмодзи!)',
    desc: 'В заголовках (Titles) строго 0 эмодзи! Без точек в конце, длина 3-8 слов, органичные ключи и актуальные годы 2026/2027.',
    icon: FileText
  },
  {
    id: 'emojis',
    title: 'Эмодзи в Descriptions (≥ 10 видов)',
    desc: 'Каждая строка Descriptions начинается с тематического эмодзи (максимум разнообразия!), без артикля "A" в начале, без CTA.',
    icon: Smile
  },
  {
    id: 'cta',
    title: 'Триггер FREE в CTA (≥ 70% строк)',
    desc: 'В 70% строк обязательно слово FREE заглавными буквами, тип товара с большой буквы (Clipart, Fonts) и триггеры выгоды (Instant Download).',
    icon: Sparkles
  }
];

export default function Step6Excel({
  selectedNiche,
  nicheDetail,
  activeSegment = null
}) {
  const [isRunningScript, setIsRunningScript] = useState(false);
  const [isStartingStreamlit, setIsStartingStreamlit] = useState(false);
  const [actionNotification, setActionNotification] = useState(null);

  const excelFiles = nicheDetail?.niche?.excelFiles || [];
  const totalExcels = excelFiles.length;

  const handleStartStreamlit = async () => {
    try {
      setIsStartingStreamlit(true);
      setActionNotification(null);

      const res = await fetch('/api/services/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          service: 'streamlit',
          nichePath: selectedNiche?.keywordPath,
          segment: activeSegment
        })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Ошибка запуска Streamlit QC');
      }

      setActionNotification({
        type: 'success',
        message: data.message || `Streamlit QC запущен на порту ${data.port || 8520}`,
        url: data.url || `http://localhost:${data.port || 8520}`
      });

      // Auto open Streamlit tab
      if (data.url || data.port) {
        window.open(data.url || `http://localhost:${data.port || 8520}`, '_blank');
      }
    } catch (err) {
      setActionNotification({
        type: 'error',
        message: err.message
      });
    } finally {
      setIsStartingStreamlit(false);
    }
  };

  const handleRunScript = async () => {
    try {
      setIsRunningScript(true);
      setActionNotification(null);

      const res = await fetch('/api/services/run-excel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category: selectedNiche?.category,
          collection: selectedNiche?.collection,
          nichePath: selectedNiche?.keywordPath,
          segment: activeSegment
        })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Ошибка запуска скрипта генерации Excel');
      }

      setActionNotification({
        type: 'success',
        message: `${data.message} (всего папок для обработки: ${data.totalFolders})`
      });
    } catch (err) {
      setActionNotification({
        type: 'error',
        message: err.message
      });
    } finally {
      setIsRunningScript(false);
    }
  };

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
            Контроль наличия и соответствия стандартам готовых Excel таблиц (100 уникальных пинов для каждой папки интента).
          </p>
        </div>

        {/* Global Counter Badge */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gray-50 border border-gray-200 text-xs">
            <FileSpreadsheet className="w-3.5 h-3.5 text-slate-500" />
            <span className="text-slate-500">Найдено таблиц:</span>
            <span className="font-bold text-slate-900 font-mono">{totalExcels} шт.</span>
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
            <span>{totalExcels >= 4 ? 'Все таблицы готовы' : 'Ожидаются таблицы'}</span>
          </div>
        </div>
      </div>

      {/* Action Buttons Panel */}
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-2xs">
        <div className="space-y-0.5">
          <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
            <Zap className="w-4 h-4 text-[#E60023]" />
            <span>Инструменты генерации контента для папок ниши</span>
          </div>
          <p className="text-[11px] text-slate-500">
            Запустите визуальный генератор Streamlit QC с предпросмотром промпта или выполните автономный скрипт run_folder.py.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto">
          <button
            onClick={handleStartStreamlit}
            disabled={isStartingStreamlit}
            className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-[#E60023] hover:bg-[#ad081b] text-white shadow-xs transition-colors disabled:opacity-50 cursor-pointer"
          >
            {isStartingStreamlit ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Play className="w-3.5 h-3.5" />
            )}
            <span>Streamlit QC (8501)</span>
          </button>

          <button
            onClick={handleRunScript}
            disabled={isRunningScript}
            className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-white hover:bg-slate-100 text-slate-700 border border-gray-300 shadow-xs transition-colors disabled:opacity-50 cursor-pointer"
            title="Запустить автономный run_folder.py для первой подходящей папки ниши"
          >
            {isRunningScript ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Zap className="w-3.5 h-3.5 text-amber-500" />
            )}
            <span>run_folder.py в 1 клик</span>
          </button>
        </div>
      </div>

      {/* Notification Banner */}
      {actionNotification && (
        <div
          className={`p-3.5 rounded-xl border text-xs flex items-center justify-between gap-3 ${
            actionNotification.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
              : 'bg-rose-50 text-rose-800 border-rose-200'
          }`}
        >
          <div className="flex items-center gap-2">
            {actionNotification.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            )}
            <span>{actionNotification.message}</span>
          </div>
          {actionNotification.url && (
            <a
              href={actionNotification.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 font-bold underline hover:opacity-80 shrink-0"
            >
              <span>Открыть в браузере</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          )}
        </div>
      )}

      {/* Checklist Requirements Banner */}
      <div className="bg-red-50/50 border border-red-100 rounded-xl p-4 space-y-3">
        <div className="flex items-center gap-2 text-xs font-bold text-slate-900">
          <FileCheck2 className="w-4 h-4 text-[#E60023]" />
          <span>Обязательный чек-лист качества контента Excel (Шаг 6)</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
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
              Используйте Streamlit QC или автономный run_folder.py для генерации ровно 100 строк пинов для каждой из папок интентов.
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
