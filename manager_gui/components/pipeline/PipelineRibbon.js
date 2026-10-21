'use client';

import React from 'react';
import { CheckCircle2, Layers } from 'lucide-react';

const STEPS = [
  { id: 1, title: 'База' },
  { id: 2, title: 'Seed Tags' },
  { id: 3, title: 'PinInspector' },
  { id: 4, title: 'AI Фильтр' },
  { id: 5, title: 'Интенты' },
  { id: 6, title: 'Генерация Excel' },
  { id: 7, title: 'QA Аудит' },
  { id: 8, title: '⚙️ Генераторы' },
  { id: 9, title: '📦 Шаблон Make' },
  { id: 10, title: '🚀 Make & Deploy' },
];

export default function PipelineRibbon({
  activeStep = 1,
  onSelectStep,
  stepStatuses = [],
  segments = [],
  activeSegment = null,
  onSelectSegment,
  isMultiSegment = false
}) {
  const hasSegments = isMultiSegment && Array.isArray(segments) && segments.length > 0;

  return (
    <div className="w-full bg-white border border-gray-200 rounded-2xl p-3 shadow-xs space-y-2.5">
      {/* 8-Step Ribbon */}
      <div className="flex items-center gap-2 overflow-x-auto sm:flex-wrap no-scrollbar py-0.5">
        {STEPS.map((step) => {
          const stepIndex = step.id - 1;
          const isCompleted = Boolean(stepStatuses[stepIndex]);
          const isActive = activeStep === step.id;

          return (
            <button
              key={step.id}
              type="button"
              onClick={() => onSelectStep?.(step.id)}
              className={`group relative flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-medium transition-all shrink-0 cursor-pointer border ${
                isActive
                  ? 'border-[#E60023] bg-red-50 text-[#E60023] shadow-xs ring-1 ring-[#E60023]/25 font-semibold'
                  : 'border-gray-200 bg-white text-slate-700 hover:text-slate-900 hover:bg-gray-50 hover:border-gray-300'
              }`}
            >
              {/* Step number badge */}
              <span
                className={`flex items-center justify-center w-5 h-5 rounded-full text-[11px] font-bold transition-colors ${
                  isActive
                    ? 'bg-[#E60023] text-white shadow-xs'
                    : isCompleted
                    ? 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                    : 'bg-gray-100 text-slate-500 group-hover:text-slate-700'
                }`}
              >
                {step.id}
              </span>

              {/* Step Title */}
              <span className="whitespace-nowrap font-medium">
                {step.title}
              </span>

              {/* Completion checkmark */}
              {isCompleted && (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 ml-0.5" />
              )}
            </button>
          );
        })}
      </div>

      {/* Multi-Segment Selector Ribbon */}
      {hasSegments && (
        <div className="pt-2.5 border-t border-gray-100 flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
          <span className="text-[11px] font-semibold text-slate-500 shrink-0 mr-1 flex items-center gap-1">
            <Layers className="w-3.5 h-3.5 text-[#E60023]" />
            Сегменты:
          </span>

          {/* All Niche Summary */}
          <button
            type="button"
            onClick={() => onSelectSegment?.(null)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all shrink-0 cursor-pointer border flex items-center gap-1.5 ${
              !activeSegment
                ? 'bg-[#E60023] text-white border-[#E60023] shadow-xs font-semibold'
                : 'bg-gray-50 text-slate-700 border-gray-200 hover:text-slate-900 hover:bg-gray-100'
            }`}
          >
            <span>📁</span>
            <span>Вся ниша (Сводка)</span>
          </button>

          {/* Segments Pills */}
          {segments.map((seg) => {
            const isSelected = activeSegment === seg.name;
            const completedCount = seg.completedCount ?? 0;

            return (
              <button
                key={seg.name}
                type="button"
                onClick={() => onSelectSegment?.(seg.name)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all shrink-0 cursor-pointer border flex items-center gap-1.5 ${
                  isSelected
                    ? 'bg-[#E60023] text-white border-[#E60023] shadow-xs font-semibold'
                    : 'bg-gray-50 text-slate-700 border-gray-200 hover:text-slate-900 hover:bg-gray-100'
                }`}
              >
                <span>🏷️</span>
                <span>{seg.name}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                    isSelected
                      ? 'bg-red-800/50 text-white'
                      : completedCount > 0
                      ? 'bg-emerald-100 text-emerald-700 font-semibold'
                      : 'bg-gray-200 text-slate-600'
                  }`}
                >
                  {completedCount}/8
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
