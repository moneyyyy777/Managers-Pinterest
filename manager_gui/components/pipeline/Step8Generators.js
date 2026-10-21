'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Sparkles,
  Sliders,
  Play,
  Copy,
  Check,
  Search,
  CheckCircle2,
  AlertCircle,
  Loader2,
  FolderSync,
  Bot,
  FileCode,
  X,
  Code2,
  RefreshCw,
  ExternalLink,
  ChevronRight,
  Bookmark
} from 'lucide-react';

const FALLBACK_NAME_GENERATORS = [
  { name: 'Design', filename: 'Design.py', path: 'All Folders/!Generators/Name_Account_Generator/Design.py' },
  { name: 'Design_Baby', filename: 'Design_Baby.py', path: 'All Folders/!Generators/Name_Account_Generator/Design_Baby.py' },
  { name: 'Design_Christmas', filename: 'Design_Christmas.py', path: 'All Folders/!Generators/Name_Account_Generator/Design_Christmas.py' },
  { name: 'Fitness', filename: 'Fitness.py', path: 'All Folders/!Generators/Name_Account_Generator/Fitness.py' },
  { name: 'Garden_Flower', filename: 'Garden_Flower.py', path: 'All Folders/!Generators/Name_Account_Generator/Garden_Flower.py' },
  { name: 'Healthy', filename: 'Healthy.py', path: 'All Folders/!Generators/Name_Account_Generator/Healthy.py' },
  { name: 'Herbalism', filename: 'Herbalism.py', path: 'All Folders/!Generators/Name_Account_Generator/Herbalism.py' },
  { name: 'Homesteading', filename: 'Homesteading.py', path: 'All Folders/!Generators/Name_Account_Generator/Homesteading.py' },
  { name: 'Longevity', filename: 'Longevity.py', path: 'All Folders/!Generators/Name_Account_Generator/Longevity.py' },
  { name: 'Sleeping', filename: 'Sleeping.py', path: 'All Folders/!Generators/Name_Account_Generator/Sleeping.py' },
  { name: 'Smoothie', filename: 'Smoothie.py', path: 'All Folders/!Generators/Name_Account_Generator/Smoothie.py' },
  { name: 'Wellness', filename: 'Wellness.py', path: 'All Folders/!Generators/Name_Account_Generator/Wellness.py' }
];

const FALLBACK_DESC_GENERATORS = [
  { name: 'Design_Cliparts', filename: 'Design_Cliparts.py', path: 'All Folders/!Generators/Description_Generator/Design_Cliparts.py' },
  { name: 'Design_Cliparts_Baby', filename: 'Design_Cliparts_Baby.py', path: 'All Folders/!Generators/Description_Generator/Design_Cliparts_Baby.py' },
  { name: 'Design_Christmas_Clipart', filename: 'Design_Christmas_Clipart.py', path: 'All Folders/!Generators/Description_Generator/Design_Christmas_Clipart.py' },
  { name: 'Design_Christmas_Bundles', filename: 'Design_Christmas_Bundles.py', path: 'All Folders/!Generators/Description_Generator/Design_Christmas_Bundles.py' },
  { name: 'Design_Christmas_Fonts', filename: 'Design_Christmas_Fonts.py', path: 'All Folders/!Generators/Description_Generator/Design_Christmas_Fonts.py' },
  { name: 'Design_Fonts_Luxury', filename: 'Design_Fonts_Luxury.py', path: 'All Folders/!Generators/Description_Generator/Design_Fonts_Luxury.py' },
  { name: 'Design_Watercolor_Cliparts', filename: 'Design_Watercolor_Cliparts.py', path: 'All Folders/!Generators/Description_Generator/Design_Watercolor_Cliparts.py' },
  { name: 'Design_Embroidery', filename: 'Design_Embroidery.py', path: 'All Folders/!Generators/Description_Generator/Design_Embroidery.py' },
  { name: 'Design_Stickers', filename: 'Design_Stickers.py', path: 'All Folders/!Generators/Description_Generator/Design_Stickers.py' },
  { name: 'Fitness', filename: 'Fitness.py', path: 'All Folders/!Generators/Description_Generator/Fitness.py' },
  { name: 'Herbalism', filename: 'Herbalism.py', path: 'All Folders/!Generators/Description_Generator/Herbalism.py' },
  { name: 'Wellness_HealthyLifestyle', filename: 'Wellness_HealthyLifestyle.py', path: 'All Folders/!Generators/Description_Generator/Wellness_HealthyLifestyle.py' }
];

export default function Step8Generators({
  selectedNiche,
  nicheDetail,
  activeSegment = null
}) {
  const category = selectedNiche?.category || nicheDetail?.niche?.category || '';
  const collection = selectedNiche?.collection || nicheDetail?.niche?.collection || '';

  // Generators state
  const [activeTab, setActiveTab] = useState('name'); // 'name' | 'desc'
  const [searchTerm, setSearchTerm] = useState('');
  const [nameGenerators, setNameGenerators] = useState(FALLBACK_NAME_GENERATORS);
  const [descGenerators, setDescGenerators] = useState(FALLBACK_DESC_GENERATORS);
  const [assigned, setAssigned] = useState({ nameGenerator: '', descGenerator: '' });
  const [loadingGenerators, setLoadingGenerators] = useState(false);

  // Selected script for testing
  const [selectedScript, setSelectedScript] = useState('Design');

  // Live Playground Count Slider (5 to 50, default 10)
  const [testCount, setTestCount] = useState(10);
  const [isTesting, setIsTesting] = useState(false);
  const [testResults, setTestResults] = useState([]);
  const [copiedIndex, setCopiedIndex] = useState(null);
  const [copiedAll, setCopiedAll] = useState(false);

  // Niche Assignment state
  const [isAssigning, setIsAssigning] = useState(false);
  const [assignSuccess, setAssignSuccess] = useState(false);

  // Modal: Create New Generator Prompt
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [copiedPrompt, setCopiedPrompt] = useState(false);

  // Fetch generators list and niche assignments from API
  const fetchGenerators = useCallback(async () => {
    setLoadingGenerators(true);
    try {
      const params = new URLSearchParams();
      if (category) params.set('category', category);
      if (collection) params.set('collection', collection);
      if (activeSegment) params.set('segment', activeSegment);

      const res = await fetch(`/api/generators?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        if (data.nameGenerators && data.nameGenerators.length > 0) {
          setNameGenerators(data.nameGenerators);
        }
        if (data.descGenerators && data.descGenerators.length > 0) {
          setDescGenerators(data.descGenerators);
        }
        if (data.assigned) {
          setAssigned(data.assigned);
        }
      }
    } catch (err) {
      console.warn('Using fallback generators due to network/api issue:', err);
    } finally {
      setLoadingGenerators(false);
    }
  }, [category, collection, activeSegment]);

  useEffect(() => {
    fetchGenerators();
  }, [fetchGenerators]);

  // Sync selectedScript when activeTab changes
  useEffect(() => {
    if (activeTab === 'name') {
      setSelectedScript(assigned.nameGenerator || nameGenerators[0]?.name || 'Design');
    } else {
      setSelectedScript(assigned.descGenerator || descGenerators[0]?.name || 'Design_Cliparts');
    }
    setTestResults([]);
  }, [activeTab, assigned.nameGenerator, assigned.descGenerator, nameGenerators, descGenerators]);

  // Filter list by search term
  const filteredGenerators = useMemo(() => {
    const list = activeTab === 'name' ? nameGenerators : descGenerators;
    if (!searchTerm.trim()) return list;
    const q = searchTerm.toLowerCase();
    return list.filter((g) => g.name.toLowerCase().includes(q) || g.filename.toLowerCase().includes(q));
  }, [activeTab, nameGenerators, descGenerators, searchTerm]);

  // Live Test Generator Handler
  const handleRunTest = async () => {
    setIsTesting(true);
    setCopiedIndex(null);
    setCopiedAll(false);
    try {
      const res = await fetch('/api/generators', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'test',
          type: activeTab,
          scriptName: selectedScript,
          count: testCount
        })
      });

      if (res.ok) {
        const data = await res.json();
        if (data.items) {
          setTestResults(data.items);
        }
      } else {
        alert('Не удалось запустить генератор. Проверьте скрипт.');
      }
    } catch (err) {
      console.error('Error running test generator:', err);
      alert('Ошибка при тестировании генератора');
    } finally {
      setIsTesting(false);
    }
  };

  // 1-Click Copy single item
  const handleCopyItem = async (text, idx) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedIndex(idx);
      setTimeout(() => setCopiedIndex(null), 1800);
    } catch (err) {
      console.error('Copy error:', err);
    }
  };

  // Copy all results
  const handleCopyAll = async () => {
    try {
      await navigator.clipboard.writeText(testResults.join('\n'));
      setCopiedAll(true);
      setTimeout(() => setCopiedAll(false), 2000);
    } catch (err) {
      console.error('Copy error:', err);
    }
  };

  // Niche Assignment Handler
  const handleAssignToNiche = async () => {
    if (!category || !collection) {
      alert('Выберите нишу в верхней панели для назначения генераторов');
      return;
    }
    setIsAssigning(true);
    try {
      const nameGenToAssign = activeTab === 'name' ? selectedScript : assigned.nameGenerator || 'Design';
      const descGenToAssign = activeTab === 'desc' ? selectedScript : assigned.descGenerator || 'Design_Cliparts';

      const res = await fetch('/api/generators', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'assign',
          category,
          collection,
          segment: activeSegment,
          nameGenerator: nameGenToAssign,
          descGenerator: descGenToAssign
        })
      });

      if (res.ok) {
        setAssigned({
          nameGenerator: nameGenToAssign,
          descGenerator: descGenToAssign
        });
        setAssignSuccess(true);
        setTimeout(() => setAssignSuccess(false), 3000);
      } else {
        const data = await res.json();
        alert(data.error || 'Ошибка при сохранении назначения');
      }
    } catch (err) {
      console.error('Error assigning generators:', err);
      alert('Ошибка при соединении с сервером');
    } finally {
      setIsAssigning(false);
    }
  };

  const aiGeneratorPrompt = `Ты — ведущий Python-инженер для систем автоматизации Pinterest.
Напиши автономный скрипт-генератор уникальных ${
    activeTab === 'name' ? 'имен брендов/аккаунтов' : 'описаний профилей (Bio)'
  } для Pinterest-ниши: "${collection || 'Artify Studio Design'}".

ТРЕБОВАНИЯ К СКРИПТУ (на базе эталонной архитектуры All Folders/!Generators/Name_Account_Generator/Design.py):
1. Чистый Python 3 без сторонних зависимостей (только import random).
2. Списки лексики:
   - 200+ тематических прилагательных (эстетика, материалы, цвета, стили);
   - 200+ существительных (концепции, формы, объекты);
   - префиксы, суффиксы и соединители ('meets', '&', 'Studio', 'Lab', 'Co').
3. Функция ${activeTab === 'name' ? 'generate_brand_name()' : 'generate_description()'}, возвращающая одну готовую строку.
4. Проверка на дедупликацию слов (исключить повторы одного корня в одной строке).
5. Блок if __name__ == '__main__': с выводом тестовой серии.

Выдай только готовый python-код с подробными комментариями.`;

  const handleCopyPrompt = async () => {
    try {
      await navigator.clipboard.writeText(aiGeneratorPrompt);
      setCopiedPrompt(true);
      setTimeout(() => setCopiedPrompt(false), 2000);
    } catch (err) {
      console.error('Failed to copy prompt:', err);
    }
  };

  return (
    <div className="w-full bg-white border border-gray-200 rounded-2xl p-6 shadow-xs space-y-6 text-slate-800">
      {/* Step Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-gray-100">
        <div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <span className="flex items-center justify-center w-6 h-6 rounded-full bg-[#E60023] text-white text-xs font-bold shadow-xs">
              8
            </span>
            <h3 className="text-base font-bold text-slate-900">
              Шаг 8: Центр Генераторов (Имена и Описания/Био)
            </h3>
            {activeSegment && (
              <span className="text-xs bg-red-50 text-[#E60023] border border-red-200 px-2 py-0.5 rounded-full font-semibold flex items-center gap-1">
                🏷️ {activeSegment}
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Управление скриптами уникализации профилей Pinterest (аккаунты, аватары, описания, био) для массового автопостинга.
          </p>
        </div>

        {/* Create generator modal button */}
        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-red-50 text-[#E60023] border border-red-200 hover:bg-red-100 transition-all cursor-pointer self-start lg:self-auto shrink-0 shadow-2xs"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>✨ Создать новый генератор (AI Промпт)</span>
        </button>
      </div>

      {/* Niche Assignment Status Card */}
      <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-900">
            <Bookmark className="w-4 h-4 text-[#E60023]" />
            <span>Текущая конфигурация ниши (For Main)</span>
          </div>

          <button
            type="button"
            onClick={handleAssignToNiche}
            disabled={isAssigning || !selectedScript}
            className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer shrink-0 shadow-xs ${
              assignSuccess
                ? 'bg-emerald-600 text-white'
                : 'bg-[#E60023] hover:bg-[#ad081b] text-white'
            }`}
          >
            {isAssigning ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Назначение...</span>
              </>
            ) : assignSuccess ? (
              <>
                <Check className="w-3.5 h-3.5" />
                <span>Назначено для ниши!</span>
              </>
            ) : (
              <>
                <Bookmark className="w-3.5 h-3.5" />
                <span>📌 Назначить текущий ({selectedScript}) для этой ниши</span>
              </>
            )}
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
          <div className="p-3 bg-white border border-gray-200 rounded-xl space-y-1">
            <span className="text-[11px] font-semibold text-slate-500">
              🏷️ Генератор имен (For Main/Name_Accounts.txt):
            </span>
            <div className="font-mono font-bold text-slate-900 flex items-center justify-between">
              <span>{assigned.nameGenerator || '— Не назначен (по умолчанию Design)'}</span>
              {assigned.nameGenerator && (
                <span className="text-[10px] text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full font-semibold">
                  Активен
                </span>
              )}
            </div>
          </div>

          <div className="p-3 bg-white border border-gray-200 rounded-xl space-y-1">
            <span className="text-[11px] font-semibold text-slate-500">
              📝 Генератор био (For Main/Description_Generator.txt):
            </span>
            <div className="font-mono font-bold text-slate-900 flex items-center justify-between">
              <span>{assigned.descGenerator || '— Не назначен (по умолчанию Design_Cliparts)'}</span>
              {assigned.descGenerator && (
                <span className="text-[10px] text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full font-semibold">
                  Активен
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Tabs & Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-1">
        {/* Two Tabs */}
        <div className="flex items-center gap-1.5 p-1 bg-gray-100 rounded-xl border border-gray-200 shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('name')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'name'
                ? 'bg-white text-slate-900 shadow-2xs border border-gray-200'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <span>🏷️ Имена аккаунтов (Name Accounts)</span>
            <span className="text-[10px] px-1.5 py-0.2 bg-gray-100 rounded-md text-slate-600 font-mono">
              {nameGenerators.length}
            </span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('desc')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'desc'
                ? 'bg-white text-slate-900 shadow-2xs border border-gray-200'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <span>📝 Описания / Био (Bio Descriptions)</span>
            <span className="text-[10px] px-1.5 py-0.2 bg-gray-100 rounded-md text-slate-600 font-mono">
              {descGenerators.length}
            </span>
          </button>
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Поиск скрипта генератора..."
            className="w-full pl-8.5 pr-3 py-1.5 bg-gray-50 border border-gray-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#E60023] focus:bg-white transition-all shadow-2xs"
          />
        </div>
      </div>

      {/* Main Grid: Script Selector & Live Playground */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left column: Script Selector (5 cols) */}
        <div className="lg:col-span-5 space-y-3">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
            <span>Доступные Python-скрипты:</span>
            <span className="text-[11px] text-slate-500 font-mono">
              {filteredGenerators.length} найдено
            </span>
          </div>

          <div className="border border-gray-200 rounded-xl divide-y divide-gray-100 max-h-96 overflow-y-auto bg-gray-50/50">
            {filteredGenerators.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-500">
                Скрипты не найдены по запросу "{searchTerm}"
              </div>
            ) : (
              filteredGenerators.map((gen) => {
                const isSelected = selectedScript === gen.name;
                const isCurrentlyAssigned =
                  (activeTab === 'name' && assigned.nameGenerator === gen.name) ||
                  (activeTab === 'desc' && assigned.descGenerator === gen.name);

                return (
                  <div
                    key={gen.name}
                    onClick={() => setSelectedScript(gen.name)}
                    className={`p-3 flex items-center justify-between cursor-pointer transition-colors ${
                      isSelected
                        ? 'bg-red-50/70 border-l-4 border-l-[#E60023]'
                        : 'hover:bg-white bg-transparent'
                    }`}
                  >
                    <div className="space-y-0.5 truncate">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-900 font-mono truncate">
                          {gen.name}
                        </span>
                        {isCurrentlyAssigned && (
                          <span className="text-[10px] text-emerald-700 bg-emerald-100 border border-emerald-200 px-1.5 py-0.2 rounded font-semibold shrink-0">
                            В нише
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500 font-mono truncate">
                        {gen.filename}
                      </p>
                    </div>

                    <ChevronRight
                      className={`w-4 h-4 shrink-0 transition-transform ${
                        isSelected ? 'text-[#E60023] translate-x-0.5' : 'text-slate-300'
                      }`}
                    />
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right column: Live Testing Playground (7 cols) */}
        <div className="lg:col-span-7 bg-gray-50 border border-gray-200 rounded-2xl p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-gray-200">
            <div>
              <div className="flex items-center gap-2 text-xs font-bold text-slate-900">
                <Sliders className="w-4 h-4 text-[#E60023]" />
                <span>Интерактивный полигон тестирования (Playground)</span>
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Выбран скрипт:{' '}
                <strong className="text-slate-900 font-mono">{selectedScript}.py</strong>
              </p>
            </div>

            <button
              type="button"
              onClick={handleRunTest}
              disabled={isTesting || !selectedScript}
              className="inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-[#E60023] hover:bg-[#ad081b] disabled:opacity-50 text-white rounded-xl text-xs font-semibold shadow-xs transition-all cursor-pointer shrink-0"
            >
              {isTesting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Генерация...</span>
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5 fill-white" />
                  <span>▶️ Протестировать вживую</span>
                </>
              )}
            </button>
          </div>

          {/* Count Slider: 5 .. 50 */}
          <div className="bg-white border border-gray-200 rounded-xl p-3.5 space-y-2.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-700">
                Ползунок количества вариантов:
              </span>
              <span className="font-mono font-bold text-[#E60023] bg-red-50 border border-red-200 px-2.5 py-0.5 rounded-lg">
                {testCount} шт.
              </span>
            </div>

            <input
              type="range"
              min="5"
              max="50"
              step="1"
              value={testCount}
              onChange={(e) => setTestCount(parseInt(e.target.value, 10))}
              className="w-full accent-[#E60023] cursor-pointer"
            />

            {/* Quick Presets */}
            <div className="flex items-center justify-between text-[11px] text-slate-500 pt-0.5">
              <span>Пресеты:</span>
              <div className="flex items-center gap-1.5">
                {[5, 10, 20, 30, 50].map((num) => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => setTestCount(num)}
                    className={`px-2 py-0.5 rounded text-[11px] font-mono cursor-pointer transition-colors border ${
                      testCount === num
                        ? 'bg-[#E60023] text-white border-[#E60023] font-bold'
                        : 'bg-gray-100 text-slate-700 border-gray-200 hover:bg-gray-200'
                    }`}
                  >
                    {num}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Generated Results Area */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
              <span>Сгенерированные результаты:</span>
              {testResults.length > 0 && (
                <button
                  type="button"
                  onClick={handleCopyAll}
                  className="inline-flex items-center gap-1 text-[11px] text-slate-600 hover:text-slate-900 bg-white border border-gray-200 px-2.5 py-1 rounded-lg cursor-pointer transition-colors"
                >
                  {copiedAll ? (
                    <>
                      <Check className="w-3 h-3 text-emerald-600" />
                      <span className="text-emerald-700 font-semibold">Все скопировано!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3 text-slate-400" />
                      <span>Скопировать все ({testResults.length})</span>
                    </>
                  )}
                </button>
              )}
            </div>

            {testResults.length === 0 ? (
              <div className="border border-dashed border-gray-300 rounded-xl p-8 text-center text-xs text-slate-400 bg-white/60 space-y-1">
                <FileCode className="w-6 h-6 text-slate-300 mx-auto" />
                <p>Нажмите «Протестировать вживую», чтобы получить партию сгенерированных вариантов.</p>
              </div>
            ) : (
              <div className="bg-white border border-gray-200 rounded-xl divide-y divide-gray-100 max-h-72 overflow-y-auto">
                {testResults.map((item, idx) => {
                  const isCopied = copiedIndex === idx;
                  return (
                    <div
                      key={idx}
                      className="p-2.5 flex items-start justify-between gap-3 hover:bg-gray-50/70 transition-colors group"
                    >
                      <div className="flex items-start gap-2.5">
                        <span className="text-[11px] font-mono text-slate-400 shrink-0 pt-0.5">
                          {idx + 1}.
                        </span>
                        <span className="text-xs text-slate-800 font-medium leading-relaxed">
                          {item}
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleCopyItem(item, idx)}
                        title="Скопировать строку"
                        className="p-1 text-slate-400 hover:text-slate-700 hover:bg-gray-100 rounded-md transition-colors cursor-pointer shrink-0"
                      >
                        {isCopied ? (
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                        ) : (
                          <Copy className="w-3.5 h-3.5 opacity-60 group-hover:opacity-100" />
                        )}
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal: AI Architect Prompt for crafting new generator */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white border border-gray-200 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 text-slate-800">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-red-50 border border-red-200 flex items-center justify-center text-[#E60023]">
                  <Code2 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    AI-Промпт: Создание нового Python-генератора
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Сформируйте скрипт на базе эталона Design.py через Claude 3.7 / Antigravity
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-4 overflow-y-auto max-h-[60vh]">
              <div className="p-3.5 bg-red-50/60 border border-red-100 rounded-xl text-xs text-slate-700 leading-relaxed">
                💡 Скопируйте этот инженерный промпт в рабочий чат модели. Она напишет готовый скрипт,
                сохраняемый в{' '}
                <strong className="font-mono text-[#E60023]">
                  All Folders/!Generators/{activeTab === 'name' ? 'Name_Account_Generator' : 'Description_Generator'}/
                </strong>
                .
              </div>

              <pre className="p-4 bg-gray-50 border border-gray-200 rounded-xl text-xs font-mono text-slate-800 whitespace-pre-wrap leading-relaxed select-all">
                {aiGeneratorPrompt}
              </pre>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex items-center justify-between">
              <span className="text-[11px] text-slate-500">
                Созданный файл сразу появится в каталоге после сохранения
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-gray-200 rounded-xl transition-colors cursor-pointer"
                >
                  Закрыть
                </button>
                <button
                  type="button"
                  onClick={handleCopyPrompt}
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold bg-[#E60023] hover:bg-[#ad081b] text-white rounded-xl shadow-xs transition-all cursor-pointer"
                >
                  {copiedPrompt ? (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>Скопировано!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Скопировать промпт</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
