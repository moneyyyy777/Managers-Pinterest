'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  ShieldCheck,
  AlertTriangle,
  XCircle,
  CheckCircle2,
  RefreshCw,
  FileSpreadsheet,
  Calendar,
  Smile,
  FileText,
  Loader2,
  ExternalLink,
  Rocket,
  Tag,
  Layers
} from 'lucide-react';

export default function TabAuditor({ selectedNiche = null, onSelectNiche }) {
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [activeSegment, setActiveSegment] = useState(null);
  const [isStartingStreamlit, setIsStartingStreamlit] = useState(false);
  const [streamlitNotification, setStreamlitNotification] = useState(null);

  // Sync / Reset activeSegment when selected niche changes
  useEffect(() => {
    setActiveSegment(null);
    setStreamlitNotification(null);
  }, [selectedNiche?.category, selectedNiche?.collection, selectedNiche?.id]);

  const runAudit = useCallback(async () => {
    if (!selectedNiche?.category || !selectedNiche?.collection) return;

    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        category: selectedNiche.category,
        collection: selectedNiche.collection
      });
      if (activeSegment) {
        params.set('segment', activeSegment);
      }

      const res = await fetch(`/api/audit?${params.toString()}`);
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || `HTTP ${res.status}`);
      }

      setReport(data.report);
    } catch (err) {
      setError(err.message || 'Ошибка запуска аудита ниши');
      setReport(null);
    } finally {
      setLoading(false);
    }
  }, [selectedNiche?.category, selectedNiche?.collection, activeSegment]);

  // Run audit automatically when selectedNiche or activeSegment changes
  useEffect(() => {
    if (selectedNiche?.category && selectedNiche?.collection) {
      runAudit();
    } else {
      setReport(null);
      setError(null);
      setLoading(false);
    }
  }, [selectedNiche?.category, selectedNiche?.collection, activeSegment, runAudit]);

  // Quick launch for Streamlit QC
  const handleStartStreamlit = async () => {
    try {
      setIsStartingStreamlit(true);
      setStreamlitNotification(null);

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
        throw new Error(data.error || 'Ошибка запуска Streamlit');
      }

      setStreamlitNotification({
        type: 'success',
        message: 'Streamlit QC сервер запускается на порту 8501',
        url: 'http://localhost:8501'
      });
    } catch (err) {
      setStreamlitNotification({
        type: 'error',
        message: err.message || 'Не удалось запустить Streamlit'
      });
    } finally {
      setIsStartingStreamlit(false);
    }
  };

  // 1. Ниша не выбрана
  if (!selectedNiche) {
    return (
      <div className="bg-white border border-gray-200 border-dashed rounded-xl p-12 text-center space-y-4 shadow-xs">
        <div className="w-14 h-14 rounded-2xl bg-red-50 border border-red-200 flex items-center justify-center mx-auto text-[#E60023]">
          <ShieldCheck className="w-7 h-7" />
        </div>
        <div className="max-w-md mx-auto space-y-1">
          <h3 className="text-base font-semibold text-slate-900">
            Выберите нишу для запуска аудита
          </h3>
          <p className="text-xs text-slate-500">
            Для глубокой проверки структуры папок, Excel-таблиц (100 строк, эмодзи, CTA, FREE) и детекции устаревших годов 2021-2025 выберите активную нишу в верхнем селекторе или во вкладке «Хаб ниш».
          </p>
        </div>
      </div>
    );
  }

  // 2. Индикатор загрузки
  if (loading) {
    return (
      <div className="bg-white border border-gray-200 rounded-xl p-16 text-center space-y-4 shadow-xs">
        <div className="relative inline-flex items-center justify-center">
          <Loader2 className="w-10 h-10 text-[#E60023] animate-spin" />
          <ShieldCheck className="w-5 h-5 text-red-400 absolute" />
        </div>
        <div className="space-y-1">
          <h3 className="text-sm font-semibold text-slate-900">
            Проводим глубокий аудит файлов, Excel и тегов...
          </h3>
          <p className="text-xs text-slate-500">
            Проверяем {selectedNiche.title || selectedNiche.collection} {activeSegment ? `(сегмент: ${activeSegment})` : ''} на соответствие стандарту Pre-Launch Gate
          </p>
        </div>
      </div>
    );
  }

  // Helper for choosing contextual icons
  const getIssueIcon = (issue) => {
    const text = (issue.title + ' ' + issue.message).toLowerCase();
    if (text.includes('год') || text.includes('year') || text.includes('202')) {
      return <Calendar className="w-4 h-4 text-amber-600 shrink-0" />;
    }
    if (text.includes('эмодзи') || text.includes('emoji')) {
      return <Smile className="w-4 h-4 text-amber-600 shrink-0" />;
    }
    if (text.includes('excel') || text.includes('.xlsx') || text.includes('строк')) {
      return <FileSpreadsheet className="w-4 h-4 text-[#E60023] shrink-0" />;
    }
    if (issue.severity === 'error') {
      return <XCircle className="w-4 h-4 text-[#E60023] shrink-0" />;
    }
    return <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />;
  };

  const score = report?.score ?? 0;
  const isGreen = score >= 90;
  const isYellow = score >= 60 && score < 90;
  const isRed = score < 60;

  const scoreStrokeColor = isGreen
    ? 'stroke-emerald-500 text-emerald-600'
    : isYellow
    ? 'stroke-amber-500 text-amber-600'
    : 'stroke-[#E60023] text-[#E60023]';

  const verdictText = isGreen
    ? 'ГОТОВО К ПУБЛИКАЦИИ'
    : isYellow
    ? 'ТРЕБУЕТСЯ ВНИМАНИЕ'
    : 'АУДИТ НЕ ПРОЙДЕН';

  const verdictBg = isGreen
    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
    : isYellow
    ? 'bg-amber-50 text-amber-700 border-amber-200'
    : 'bg-red-50 text-[#E60023] border-red-200';

  const errors = report?.issues?.filter((i) => i.severity === 'error') || [];
  const warnings = report?.issues?.filter((i) => i.severity === 'warning') || [];

  // Collect verified passed items from details
  const passedItems = [];
  if (report?.details) {
    if (report.details.structure?.items) {
      report.details.structure.items.forEach((item) => {
        if (item.passed) passedItems.push({ ...item, group: 'Структура' });
      });
    }
    if (report.details.tags?.items) {
      report.details.tags.items.forEach((item) => {
        if (item.passed) passedItems.push({ ...item, group: 'Теги и Семантика' });
      });
    }
    if (report.details.generators?.items) {
      report.details.generators.items.forEach((item) => {
        if (item.passed) passedItems.push({ ...item, group: 'Генераторы' });
      });
    }
    if (report.details.excel?.items) {
      report.details.excel.items.forEach((item) => {
        if (item.passed) {
          passedItems.push({
            check: `Excel: ${item.file} (${item.folder})`,
            detail: `${item.totalRows} строк, ${item.descUniqueEmojis} эмодзи, FREE ${item.freePercentage}`,
            passed: true,
            group: 'Excel Контент'
          });
        }
      });
    }
  }

  const hasSegments = Array.isArray(selectedNiche.segments) && selectedNiche.segments.length > 0;

  return (
    <div className="space-y-6">
      {/* 0. Сегментный селектор (для multi_segment ниш) */}
      {hasSegments && (
        <div className="bg-white border border-gray-200 rounded-xl p-3.5 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-700 shrink-0">
            <Layers className="w-4 h-4 text-[#E60023]" />
            <span>Сегмент для аудита:</span>
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0 no-scrollbar">
            {/* Кнопка "Вся ниша" */}
            <button
              type="button"
              onClick={() => setActiveSegment(null)}
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition-all cursor-pointer ${
                activeSegment === null
                  ? 'bg-[#E60023] text-white shadow-xs font-semibold'
                  : 'bg-slate-50 text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-gray-200'
              }`}
            >
              <span>📁</span>
              <span>Вся ниша ({selectedNiche.segments.length})</span>
            </button>

            {/* Пилюли каждого сегмента */}
            {selectedNiche.segments.map((seg) => {
              const isActive = activeSegment === seg.name;
              return (
                <button
                  key={seg.name}
                  type="button"
                  onClick={() => setActiveSegment(seg.name)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition-all cursor-pointer ${
                    isActive
                      ? 'bg-[#E60023] text-white shadow-xs font-semibold'
                      : 'bg-slate-50 text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-gray-200'
                  }`}
                >
                  <Tag className={`w-3 h-3 ${isActive ? 'text-white' : 'text-[#E60023]'}`} />
                  <span>{seg.name}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Streamlit Notification Banner */}
      {streamlitNotification && (
        <div
          className={`p-3.5 rounded-xl border text-xs flex items-center justify-between gap-3 animate-in fade-in duration-200 ${
            streamlitNotification.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-red-50 border-red-200 text-red-800'
          }`}
        >
          <div className="flex items-center gap-2">
            <span>{streamlitNotification.type === 'success' ? '🚀' : '⚠️'}</span>
            <span className="font-semibold">{streamlitNotification.message}</span>
          </div>

          {streamlitNotification.url && (
            <a
              href={streamlitNotification.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors shadow-2xs"
            >
              <span>Открыть QC 8501</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          )}
        </div>
      )}

      {/* 1. Верхняя карточка вердикта */}
      <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-xs">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          {/* Left: Score Circle and Verdict */}
          <div className="flex flex-col sm:flex-row items-center gap-6 text-center sm:text-left">
            {/* Circular Score */}
            <div className="relative w-28 h-28 shrink-0 flex items-center justify-center">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                <path
                  className="stroke-slate-100"
                  strokeWidth="3.2"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
                <path
                  className={scoreStrokeColor}
                  strokeWidth="3.2"
                  strokeDasharray={`${score}, 100`}
                  strokeLinecap="round"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className={`text-2xl font-black font-mono tracking-tight ${scoreStrokeColor}`}>
                  {score}%
                </span>
                <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">
                  Score
                </span>
              </div>
            </div>

            {/* Verdict text & niche name */}
            <div className="space-y-2">
              <div className="flex items-center gap-2.5 justify-center sm:justify-start flex-wrap">
                <span className={`px-3 py-1 rounded-full text-xs font-bold tracking-wide border ${verdictBg}`}>
                  {verdictText}
                </span>
                <span className="text-xs text-slate-500 font-mono bg-slate-50 px-2 py-0.5 rounded border border-gray-200">
                  {selectedNiche.category} / {selectedNiche.collection}
                </span>
                {activeSegment && (
                  <span className="text-xs font-semibold text-[#E60023] bg-red-50 px-2 py-0.5 rounded border border-red-200">
                    Сегмент: {activeSegment}
                  </span>
                )}
              </div>

              <h2 className="text-lg font-bold text-slate-900">
                {selectedNiche.title || selectedNiche.collection}
              </h2>

              <p className="text-xs text-slate-500 max-w-md">
                {report
                  ? `Проверено ${report.summary?.totalChecks || 0} параметров. Анализировано ${report.details?.excel?.filesAnalyzed ?? 0} Excel книг.`
                  : 'Запустите аудит для получения актуального отчета.'}
              </p>
            </div>
          </div>

          {/* Right: Counter Badges & Action Buttons */}
          <div className="flex flex-col items-center sm:items-end gap-3.5 w-full md:w-auto">
            {/* Badges */}
            <div className="flex items-center gap-2 flex-wrap justify-center sm:justify-end">
              {/* Errors Badge */}
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs font-semibold">
                <XCircle className="w-3.5 h-3.5 text-[#E60023]" />
                <span>Ошибок: <strong>{report?.summary?.errorsCount ?? 0}</strong></span>
              </div>

              {/* Warnings Badge */}
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-xs font-semibold">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                <span>Предупреждений: <strong>{report?.summary?.warningsCount ?? 0}</strong></span>
              </div>

              {/* Passed Badge */}
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>Пройдено: <strong>{report?.summary?.passedChecks ?? 0}</strong></span>
              </div>
            </div>

            {/* Action Buttons Row */}
            <div className="flex items-center gap-2 w-full sm:w-auto flex-wrap justify-end">
              {/* Streamlit Quick Launch Button */}
              <button
                type="button"
                onClick={handleStartStreamlit}
                disabled={isStartingStreamlit}
                className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-gradient-to-r from-[#E60023] to-red-700 hover:from-red-700 hover:to-red-800 active:scale-95 disabled:opacity-50 rounded-lg shadow-xs transition-all cursor-pointer"
                title="Запустить Streamlit QC интерфейс на порту 8501"
              >
                {isStartingStreamlit ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Rocket className="w-3.5 h-3.5" />
                )}
                <span>Запустить Streamlit QC (8501)</span>
              </button>

              {/* Run / Repeat Button */}
              <button
                type="button"
                onClick={runAudit}
                disabled={loading}
                className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-3.5 py-2 text-xs font-semibold text-slate-800 bg-slate-100 hover:bg-slate-200 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg border border-slate-300 transition-all cursor-pointer shadow-2xs"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-[#E60023]' : ''}`} />
                <span>{report ? 'Повторить аудит' : '⚡ Запустить аудит'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-start gap-3 shadow-xs">
          <XCircle className="w-4 h-4 text-[#E60023] shrink-0 mt-0.5" />
          <div>
            <div className="font-semibold text-red-800">Ошибка при проведении аудита</div>
            <div className="mt-0.5 text-red-700">{error}</div>
          </div>
        </div>
      )}

      {/* 2 & 3. Группировка проверок и Детальные подсказки для менеджера */}
      {report && (
        <div className="space-y-6">
          {/* Блок Ошибок (Error) */}
          {errors.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-[#E60023] text-xs font-bold uppercase tracking-wider">
                <XCircle className="w-4 h-4" />
                <span>Критические ошибки ({errors.length}) — требуют обязательного исправления</span>
              </div>

              <div className="space-y-2.5">
                {errors.map((issue, idx) => (
                  <div
                    key={`err-${idx}`}
                    className="p-4 rounded-xl bg-red-50/70 border border-red-200 text-xs space-y-2.5 shadow-2xs"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-2">
                        {getIssueIcon(issue)}
                        <span className="font-bold text-red-900 text-sm">
                          {issue.title}
                        </span>
                      </div>
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase bg-red-100 text-[#E60023] border border-red-200 font-semibold shrink-0">
                        {issue.category}
                      </span>
                    </div>

                    <p className="text-slate-700 leading-relaxed pl-6">
                      {issue.message}
                    </p>

                    {issue.suggestion && (
                      <div className="ml-6 p-3 rounded-lg bg-white border border-red-200 text-xs flex items-start gap-2.5 text-slate-700 shadow-2xs">
                        <span className="font-bold text-[#E60023] shrink-0">
                          💡 Точная рекомендация:
                        </span>
                        <span className="text-red-900 font-medium">
                          {issue.suggestion}
                        </span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Блок Предупреждений (Warning) */}
          {warnings.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-amber-700 text-xs font-bold uppercase tracking-wider">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                <span>Предупреждения ({warnings.length}) — рекомендуется оптимизировать</span>
              </div>

              <div className="space-y-2.5">
                {warnings.map((issue, idx) => (
                  <div
                    key={`warn-${idx}`}
                    className="p-4 rounded-xl bg-amber-50/70 border border-amber-200 text-xs space-y-2.5 shadow-2xs"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-2">
                        {getIssueIcon(issue)}
                        <span className="font-bold text-amber-900 text-sm">
                          {issue.title}
                        </span>
                      </div>
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase bg-amber-100 text-amber-800 border border-amber-200 font-semibold shrink-0">
                        {issue.category}
                      </span>
                    </div>

                    <p className="text-slate-700 leading-relaxed pl-6">
                      {issue.message}
                    </p>

                    {issue.suggestion && (
                      <div className="ml-6 p-3 rounded-lg bg-white border border-amber-200 text-xs flex items-start gap-2.5 text-slate-700 shadow-2xs">
                        <span className="font-bold text-amber-700 shrink-0">
                          💡 Рекомендация менеджеру:
                        </span>
                        <span className="text-amber-900 font-medium">
                          {issue.suggestion}
                        </span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Блок Пройденных проверок (Pass) */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-emerald-700 text-xs font-bold uppercase tracking-wider">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Успешно пройденные проверки ({passedItems.length})</span>
            </div>

            {passedItems.length === 0 ? (
              <div className="p-4 rounded-xl bg-slate-50 border border-gray-200 text-xs text-slate-500 text-center">
                Нет успешно пройденных проверок. Требуется базовая настройка ниши.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                {passedItems.map((item, idx) => (
                  <div
                    key={`pass-${idx}`}
                    className="p-3 rounded-xl bg-emerald-50/60 border border-emerald-200 flex items-start gap-3 text-xs shadow-2xs"
                  >
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <div className="space-y-0.5 flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-semibold text-slate-900 truncate">
                          {item.check}
                        </span>
                        <span className="text-[10px] text-slate-500 font-mono bg-white px-1.5 py-0.5 rounded border border-emerald-100">
                          {item.group}
                        </span>
                      </div>
                      {item.detail && (
                        <p className="text-slate-600 text-[11px] truncate">
                          {item.detail}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
