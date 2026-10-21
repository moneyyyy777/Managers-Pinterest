'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Copy,
  Check,
  Search,
  Sparkles,
  Loader2,
  BookOpen,
  Edit3,
  RotateCcw,
  Sliders,
  Layers,
  Tag,
  Plus,
  Trash2,
  X
} from 'lucide-react';

export default function TabPrompts({ selectedNiche = null }) {
  const [prompts, setPrompts] = useState([]);
  const [customPrompts, setCustomPrompts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [copiedId, setCopiedId] = useState(null);

  // Custom prompt modal & action states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [formData, setFormData] = useState({
    title: '',
    category: 'Пользовательский',
    step: '1',
    purpose: '',
    whyNeeded: '',
    whenToUse: '',
    template: ''
  });

  // Segment selector for multi-segment niches
  const [activeSegmentPath, setActiveSegmentPath] = useState('');

  // Mode per prompt card: 'read' | 'edit'
  const [cardModes, setCardModes] = useState({});

  // Customized prompt texts per prompt ID
  const [customTexts, setCustomTexts] = useState({});

  // Quick controls parameter state per prompt ID
  const [quickParams, setQuickParams] = useState({});

  const segments = useMemo(() => {
    return selectedNiche?.segments || [];
  }, [selectedNiche]);

  const isMultiSegment =
    selectedNiche?.architecture === 'multi_segment' && segments.length > 0;

  // Reset segment and custom states when selected niche changes
  useEffect(() => {
    setActiveSegmentPath('');
    setCardModes({});
    setCustomTexts({});
    setQuickParams({});
  }, [selectedNiche?.category, selectedNiche?.collection, selectedNiche?.id]);

  // Fetch contextual prompts whenever selectedNiche or activeSegmentPath changes
  useEffect(() => {
    let isMounted = true;

    async function fetchPrompts() {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        if (selectedNiche?.category) {
          params.set('category', selectedNiche.category);
        }
        if (selectedNiche?.collection) {
          params.set('collection', selectedNiche.collection);
        }
        if (selectedNiche?.title) {
          params.set('title', selectedNiche.title);
        }
        if (selectedNiche?.architecture) {
          params.set('architecture', selectedNiche.architecture);
        }
        if (selectedNiche?.segments && selectedNiche.segments.length > 0) {
          params.set('segments', JSON.stringify(selectedNiche.segments));
        }
        if (activeSegmentPath) {
          params.set('stratPath', activeSegmentPath);
        }

        const qs = params.toString();
        const url = `/api/prompts${qs ? `?${qs}` : ''}`;
        const res = await fetch(url);

        if (res.ok) {
          const data = await res.json();
          if (isMounted && data.prompts) {
            setPrompts(data.prompts);
          }
        }
      } catch (err) {
        console.error('Error fetching prompts:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    fetchPrompts();

    return () => {
      isMounted = false;
    };
  }, [
    selectedNiche?.category,
    selectedNiche?.collection,
    selectedNiche?.title,
    activeSegmentPath
  ]);

  // Fetch custom prompts from API
  const fetchCustomPrompts = useCallback(async () => {
    try {
      const res = await fetch('/api/prompts/custom');
      if (res.ok) {
        const data = await res.json();
        if (data.prompts && Array.isArray(data.prompts)) {
          setCustomPrompts(data.prompts);
        }
      }
    } catch (err) {
      console.error('Error fetching custom prompts:', err);
    }
  }, []);

  useEffect(() => {
    fetchCustomPrompts();
  }, [fetchCustomPrompts]);

  const handleOpenAddModal = () => {
    setFormData({
      title: '',
      category: 'Пользовательский',
      step: '1',
      purpose: '',
      whyNeeded: '',
      whenToUse: '',
      template: ''
    });
    setFormError('');
    setIsAddModalOpen(true);
  };

  const handleCreateCustomPrompt = async (e) => {
    if (e) e.preventDefault();
    if (!formData.title.trim()) {
      setFormError('Укажите название промпта');
      return;
    }
    if (!formData.template.trim()) {
      setFormError('Укажите текст промпта');
      return;
    }

    setIsSubmitting(true);
    setFormError('');

    try {
      const res = await fetch('/api/prompts/custom', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setCustomPrompts((prev) => [...prev, data.prompt]);
        setIsAddModalOpen(false);
      } else {
        setFormError(data.error || 'Не удалось сохранить промпт');
      }
    } catch (err) {
      console.error('Error creating custom prompt:', err);
      setFormError('Ошибка соединения с сервером');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteCustomPrompt = async (id) => {
    if (!window.confirm('Вы уверены, что хотите удалить этот кастомный промпт?')) {
      return;
    }
    setDeletingId(id);
    try {
      const res = await fetch(`/api/prompts/custom?id=${encodeURIComponent(id)}`, {
        method: 'DELETE'
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setCustomPrompts((prev) => prev.filter((p) => p.id !== id));
      } else {
        alert(data.error || 'Не удалось удалить промпт');
      }
    } catch (err) {
      console.error('Error deleting custom prompt:', err);
      alert('Ошибка при соединении с сервером');
    } finally {
      setDeletingId(null);
    }
  };

  // Switch card mode ('read' | 'edit')
  const handleToggleMode = (promptId, mode) => {
    setCardModes((prev) => ({ ...prev, [promptId]: mode }));
  };

  // Get current active prompt text (customized or original)
  const getPromptText = useCallback(
    (prompt) => {
      if (customTexts[prompt.id] !== undefined) {
        return customTexts[prompt.id];
      }
      return prompt.manualCopyPrompt || prompt.template || '';
    },
    [customTexts]
  );

  // Copy handler with 2s success feedback
  const handleCopy = async (id, text) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => {
        setCopiedId((curr) => (curr === id ? null : curr));
      }, 2000);
    } catch (err) {
      console.error('Failed to copy to clipboard:', err);
    }
  };

  // Reset customized prompt back to original template
  const handleReset = (prompt) => {
    const original = prompt.manualCopyPrompt || prompt.template || '';
    setCustomTexts((prev) => {
      const next = { ...prev };
      delete next[prompt.id];
      return next;
    });
    setQuickParams((prev) => {
      const next = { ...prev };
      delete next[prompt.id];
      return next;
    });
  };

  // Live direct edit of textarea
  const handleTextChange = (promptId, newText) => {
    setCustomTexts((prev) => ({ ...prev, [promptId]: newText }));
  };

  // Quick Parameter Controls modifier
  const handleQuickParamChange = (prompt, key, val) => {
    const promptId = prompt.id;
    const currentParams = { ...(quickParams[promptId] || {}), [key]: val };
    setQuickParams((prev) => ({ ...prev, [promptId]: currentParams }));

    // Apply quick parameters to the text
    const baseText = prompt.manualCopyPrompt || prompt.template || '';
    let updated = baseText;

    // 1. Board Name override
    if (currentParams.boardName && currentParams.boardName.trim()) {
      updated = updated.replace(/📋 Доска: .*/g, `📋 Доска: ${currentParams.boardName.trim()}`);
    }

    // 2. Extra Stop-Words
    if (currentParams.extraStopWords && currentParams.extraStopWords.trim()) {
      const extraWords = currentParams.extraStopWords
        .split(',')
        .map((w) => w.trim().toLowerCase())
        .filter(Boolean);

      if (extraWords.length > 0) {
        updated = updated.replace(
          /(🚫 СТОП-СЛОВА И ЗАПРЕЩЁННЫЕ ТЕМЫ[^\n]*\n)([^\n]+)/,
          (match, header, wordsLine) => {
            const existing = wordsLine.split(',').map((w) => w.trim().toLowerCase());
            const merged = Array.from(new Set([...existing, ...extraWords])).sort();
            return `${header}${merged.join(', ')}`;
          }
        );
      }
    }

    // 3. Ratio of FREE
    if (currentParams.freeRatio) {
      const ratioNum = currentParams.freeRatio.replace(/[^0-9]/g, '') || '70';
      updated = updated.replace(
        /В \d+% строк используй слово FREE/g,
        `В ${ratioNum}% строк используй слово FREE`
      );
    }

    setCustomTexts((prev) => ({ ...prev, [promptId]: updated }));
  };

  const allPrompts = useMemo(() => {
    return [...prompts, ...customPrompts];
  }, [prompts, customPrompts]);

  // Filter prompts by search term
  const filteredPrompts = useMemo(() => {
    if (!searchTerm.trim()) return allPrompts;
    const q = searchTerm.toLowerCase();
    return allPrompts.filter(
      (p) =>
        (p.title && p.title.toLowerCase().includes(q)) ||
        (p.description && p.description.toLowerCase().includes(q)) ||
        (p.category && p.category.toLowerCase().includes(q)) ||
        (p.purpose && p.purpose.toLowerCase().includes(q)) ||
        (p.template && p.template.toLowerCase().includes(q))
    );
  }, [allPrompts, searchTerm]);

  return (
    <div className="space-y-6">
      {/* Top Banner / Niche Context Bar & Search (Pinterest Red & White light aesthetic) */}
      <div className="bg-white border border-[#e5e7eb] rounded-2xl p-5 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#e60023]" />
              <h2 className="text-base font-bold text-zinc-900 tracking-tight">
                Инженерный Банк AI-Промптов Pinterest
              </h2>
            </div>
            <p className="text-xs text-zinc-600">
              {selectedNiche ? (
                <span>
                  Контекст подставлен для ниши:{' '}
                  <strong className="text-[#e60023] font-semibold">
                    {selectedNiche.title || selectedNiche.collection}
                  </strong>{' '}
                  <span className="text-zinc-500 font-mono">({selectedNiche.category})</span>
                </span>
              ) : (
                <span className="text-zinc-500">
                  Универсальные шаблоны. Выберите нишу в верхнем селекторе для автоподстановки путей, тегов и досок.
                </span>
              )}
            </p>
          </div>

          {/* Quick Search & Add Custom Prompt Button */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 w-full sm:w-auto">
            <div className="relative w-full sm:w-64">
              <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Поиск по названию или этапу..."
                className="w-full pl-9 pr-3 py-2 bg-zinc-50 border border-[#e5e7eb] rounded-xl text-xs text-zinc-800 placeholder-zinc-400 focus:outline-none focus:border-[#e60023] focus:bg-white transition-all shadow-2xs"
              />
            </div>

            <button
              type="button"
              onClick={handleOpenAddModal}
              className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-[#e60023] hover:bg-[#ad081b] text-white shadow-xs transition-all cursor-pointer shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>+ Добавить промпт</span>
            </button>
          </div>
        </div>

        {/* Multi-Segment Ribbon (if multi-segment) */}
        {isMultiSegment && (
          <div className="pt-3 border-t border-[#f0f0f2] flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
            <span className="text-[11px] font-semibold text-zinc-600 shrink-0 mr-1 flex items-center gap-1">
              <Layers className="w-3.5 h-3.5 text-[#e60023]" />
              Сегмент для подстановки:
            </span>

            <button
              type="button"
              onClick={() => setActiveSegmentPath('')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all shrink-0 cursor-pointer border ${
                !activeSegmentPath
                  ? 'bg-[#e60023] text-white border-[#e60023] shadow-2xs'
                  : 'bg-zinc-50 text-zinc-700 border-zinc-200 hover:bg-zinc-100'
              }`}
            >
              📁 Вся ниша (По умолчанию)
            </button>

            {segments.map((seg) => {
              const isSelected = activeSegmentPath === seg.path;
              return (
                <button
                  key={seg.name}
                  type="button"
                  onClick={() => setActiveSegmentPath(seg.path)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all shrink-0 cursor-pointer border flex items-center gap-1.5 ${
                    isSelected
                      ? 'bg-[#e60023] text-white border-[#e60023] shadow-2xs'
                      : 'bg-zinc-50 text-zinc-700 border-zinc-200 hover:bg-zinc-100'
                  }`}
                >
                  <span>🏷️</span>
                  <span>{seg.name}</span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Prompts list */}
      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center space-y-3 text-center bg-white border border-[#e5e7eb] rounded-2xl shadow-xs">
          <Loader2 className="w-8 h-8 text-[#e60023] animate-spin" />
          <p className="text-xs font-medium text-zinc-600">Формирование контекстных промптов...</p>
        </div>
      ) : filteredPrompts.length === 0 ? (
        <div className="py-16 text-center text-zinc-500 bg-white border border-[#e5e7eb] rounded-2xl text-xs shadow-xs">
          Промпты не найдены по запросу "{searchTerm}".
        </div>
      ) : (
        <div className="space-y-6">
          {filteredPrompts.map((prompt, index) => {
            const isCopied = copiedId === prompt.id;
            const promptNumber = prompt.step || index + 1;
            const mode = cardModes[prompt.id] || 'read';
            const currentPromptText = getPromptText(prompt);
            const isCustomized = customTexts[prompt.id] !== undefined;
            const currentParams = quickParams[prompt.id] || {};

            return (
              <div
                key={prompt.id || index}
                className="bg-white border border-[#e5e7eb] rounded-2xl p-6 shadow-xs space-y-5 hover:border-zinc-300 transition-colors"
              >
                {/* Header: Title, Category, Mode Switcher */}
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-[#f0f0f2]">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <span className="w-7 h-7 rounded-lg bg-red-50 border border-red-200 text-[#e60023] text-xs font-bold font-mono flex items-center justify-center shrink-0">
                        {promptNumber}
                      </span>
                      <h3 className="text-sm font-bold text-zinc-900">
                        {prompt.title}
                      </h3>
                      {prompt.isCustom && (
                        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-purple-50 text-purple-700 border border-purple-200 flex items-center gap-1">
                          ✨ Кастомный
                        </span>
                      )}
                      {prompt.category && (
                        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-zinc-100 text-zinc-700 border border-zinc-200">
                          {prompt.category}
                        </span>
                      )}
                      {isCustomized && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-200 flex items-center gap-1">
                          Модифицирован
                        </span>
                      )}
                    </div>
                    {prompt.description && (
                      <p className="text-xs text-zinc-500">
                        {prompt.description}
                      </p>
                    )}
                  </div>

                  {/* Mode 1 vs Mode 2 Dual-Mode Toggle & Custom Prompt Actions */}
                  <div className="flex items-center gap-2 self-start lg:self-auto">
                    <div className="flex items-center gap-1 bg-zinc-100 p-1 rounded-xl border border-zinc-200 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleToggleMode(prompt.id, 'read')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                          mode === 'read'
                            ? 'bg-white text-zinc-900 shadow-2xs border border-zinc-200'
                            : 'text-zinc-600 hover:text-zinc-900'
                        }`}
                      >
                        <BookOpen className="w-3.5 h-3.5 text-[#e60023]" />
                        <span>📖 Чтение и 1-клик копирование</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleToggleMode(prompt.id, 'edit')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                          mode === 'edit'
                            ? 'bg-white text-[#e60023] shadow-2xs border border-zinc-200'
                            : 'text-zinc-600 hover:text-zinc-900'
                        }`}
                      >
                        <Edit3 className="w-3.5 h-3.5 text-zinc-500" />
                        <span>✏️ Редактировать промпт</span>
                      </button>
                    </div>

                    {prompt.isCustom && (
                      <button
                        type="button"
                        onClick={() => handleDeleteCustomPrompt(prompt.id)}
                        disabled={deletingId === prompt.id}
                        title="Удалить кастомный промпт"
                        className="p-2 text-zinc-400 hover:text-red-600 hover:bg-red-50 rounded-xl border border-zinc-200 hover:border-red-200 transition-colors cursor-pointer"
                      >
                        {deletingId === prompt.id ? (
                          <Loader2 className="w-4 h-4 animate-spin text-red-600" />
                        ) : (
                          <Trash2 className="w-4 h-4" />
                        )}
                      </button>
                    )}
                  </div>
                </div>

                {/* MODE 1: [📖 Чтение и 1-клик копирование] (Default) */}
                {mode === 'read' && (
                  <div className="space-y-4">
                    {/* Clean Code Box with pre-filled variables */}
                    <div className="relative group">
                      <pre className="p-4 bg-[#f8f9fa] text-zinc-800 font-mono text-xs rounded-xl overflow-y-auto max-h-72 border border-[#e5e7eb] whitespace-pre-wrap select-text leading-relaxed">
                        {currentPromptText}
                      </pre>
                    </div>

                    {/* Copy Button & Action Area */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
                      <button
                        type="button"
                        onClick={() => handleCopy(prompt.id, currentPromptText)}
                        className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-semibold shadow-xs transition-all cursor-pointer active:scale-98 ${
                          isCopied
                            ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                            : 'bg-[#e60023] text-white hover:bg-[#ad081b]'
                        }`}
                      >
                        {isCopied ? (
                          <>
                            <Check className="w-4 h-4" />
                            <span>Скопировано в буфер!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-4 h-4" />
                            <span>📋 Скопировать для чата Antigravity / Claude</span>
                          </>
                        )}
                      </button>

                      <span className="text-[11px] text-zinc-500">
                        Готов к вставке в Antigravity, Claude 3.7 или ChatGPT
                      </span>
                    </div>

                    {/* Explanatory Block in Russian */}
                    {(prompt.purpose || prompt.whyNeeded || prompt.whenToUse) && (
                      <div className="bg-red-50/50 border border-red-100/80 rounded-xl p-4 space-y-2.5 text-xs text-zinc-800">
                        {prompt.purpose && (
                          <div className="flex items-start gap-2">
                            <span className="font-bold text-zinc-900 shrink-0">📌 За что отвечает:</span>
                            <span className="text-zinc-700">{prompt.purpose}</span>
                          </div>
                        )}
                        {prompt.whyNeeded && (
                          <div className="flex items-start gap-2">
                            <span className="font-bold text-zinc-900 shrink-0">💡 Зачем нужен (SEO):</span>
                            <span className="text-zinc-700">{prompt.whyNeeded}</span>
                          </div>
                        )}
                        {prompt.whenToUse && (
                          <div className="flex items-start gap-2">
                            <span className="font-bold text-zinc-900 shrink-0">⏰ Когда применять:</span>
                            <span className="text-zinc-700">{prompt.whenToUse}</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* MODE 2: [✏️ Редактировать промпт] */}
                {mode === 'edit' && (
                  <div className="space-y-4">
                    {/* Quick Parameter Controls */}
                    <div className="bg-zinc-50 border border-zinc-200 rounded-xl p-4 space-y-3">
                      <div className="flex items-center gap-2 text-xs font-bold text-zinc-800 pb-2 border-b border-zinc-200">
                        <Sliders className="w-3.5 h-3.5 text-[#e60023]" />
                        <span>Быстрые параметры настройки промпта</span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        {/* Custom Board Name */}
                        <div className="space-y-1">
                          <label className="text-[11px] font-semibold text-zinc-700">
                            Название доски (Board Name):
                          </label>
                          <input
                            type="text"
                            value={currentParams.boardName || ''}
                            onChange={(e) => handleQuickParamChange(prompt, 'boardName', e.target.value)}
                            placeholder="например: Christmas Clipart Bundle"
                            className="w-full px-3 py-1.5 bg-white border border-zinc-300 rounded-lg text-xs text-zinc-800 focus:outline-none focus:border-[#e60023]"
                          />
                        </div>

                        {/* Extra Stop-Words */}
                        <div className="space-y-1">
                          <label className="text-[11px] font-semibold text-zinc-700">
                            Дополнительные стоп-слова:
                          </label>
                          <input
                            type="text"
                            value={currentParams.extraStopWords || ''}
                            onChange={(e) => handleQuickParamChange(prompt, 'extraStopWords', e.target.value)}
                            placeholder="через запятую: disney, cricut"
                            className="w-full px-3 py-1.5 bg-white border border-zinc-300 rounded-lg text-xs text-zinc-800 focus:outline-none focus:border-[#e60023]"
                          />
                        </div>

                        {/* Ratio of FREE */}
                        <div className="space-y-1">
                          <label className="text-[11px] font-semibold text-zinc-700">
                            Доля триггера FREE в CTA (%):
                          </label>
                          <select
                            value={currentParams.freeRatio || '70%'}
                            onChange={(e) => handleQuickParamChange(prompt, 'freeRatio', e.target.value)}
                            className="w-full px-3 py-1.5 bg-white border border-zinc-300 rounded-lg text-xs text-zinc-800 focus:outline-none focus:border-[#e60023]"
                          >
                            <option value="60%">60% строк</option>
                            <option value="70%">70% строк (стандарт)</option>
                            <option value="80%">80% строк (высокий CTR)</option>
                            <option value="90%">90% строк</option>
                            <option value="100%">100% (каждая строка)</option>
                          </select>
                        </div>
                      </div>
                    </div>

                    {/* Textarea allowing full live customization */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-zinc-700 flex items-center justify-between">
                        <span>Полный текст промпта (редактируемый):</span>
                        <span className="text-[11px] text-zinc-500 font-normal">
                          {currentPromptText.length} символов
                        </span>
                      </label>
                      <textarea
                        value={currentPromptText}
                        onChange={(e) => handleTextChange(prompt.id, e.target.value)}
                        rows={12}
                        className="w-full bg-[#f8f9fa] border border-zinc-300 rounded-xl p-4 text-xs font-mono text-zinc-900 focus:outline-none focus:border-[#e60023] focus:bg-white leading-relaxed resize-y shadow-2xs"
                      />
                    </div>

                    {/* Edit Mode Buttons */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleCopy(prompt.id, currentPromptText)}
                          className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-semibold shadow-xs transition-all cursor-pointer active:scale-98 ${
                            isCopied
                              ? 'bg-emerald-600 text-white'
                              : 'bg-[#e60023] text-white hover:bg-[#ad081b]'
                          }`}
                        >
                          {isCopied ? (
                            <>
                              <Check className="w-4 h-4" />
                              <span>Скопировано в буфер!</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-4 h-4" />
                              <span>📋 Скопировать настроенный</span>
                            </>
                          )}
                        </button>

                        <button
                          type="button"
                          onClick={() => handleReset(prompt)}
                          className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-medium bg-zinc-100 hover:bg-zinc-200 text-zinc-700 border border-zinc-200 transition-colors cursor-pointer"
                        >
                          <RotateCcw className="w-3.5 h-3.5 text-zinc-500" />
                          <span>🔄 Сбросить к оригиналу</span>
                        </button>
                      </div>

                      <span className="text-[11px] text-zinc-500">
                        Изменения сохраняются локально до сброса или смены ниши
                      </span>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Modal: Добавить кастомный AI-промпт */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white border border-[#e5e7eb] rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-[#f0f0f2] flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-red-50 border border-red-200 flex items-center justify-center text-[#e60023]">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-zinc-900">
                    Добавить кастомный AI-промпт
                  </h3>
                  <p className="text-[11px] text-zinc-500">
                    Сохраните собственную инструкцию для Claude/ChatGPT в инженерный банк
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="p-1.5 text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleCreateCustomPrompt} className="flex flex-col flex-1 overflow-hidden">
              <div className="p-6 space-y-4 overflow-y-auto max-h-[60vh]">
                {formError && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700">
                    ⚠️ {formError}
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="md:col-span-2 space-y-1">
                    <label className="text-xs font-semibold text-zinc-700">
                      Название промпта <span className="text-[#e60023]">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      placeholder="например: Генерация вирусных заголовков для инфографики"
                      className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-xs text-zinc-900 focus:outline-none focus:border-[#e60023] focus:bg-white transition-colors"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-zinc-700">
                      Этап воронки (Step)
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="99"
                      value={formData.step}
                      onChange={(e) => setFormData({ ...formData, step: e.target.value })}
                      className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-xs text-zinc-900 focus:outline-none focus:border-[#e60023] focus:bg-white transition-colors"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-zinc-700">
                    Категория
                  </label>
                  <input
                    type="text"
                    list="category-suggestions"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    placeholder="например: SEO & Пин-Копирайтинг"
                    className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-xs text-zinc-900 focus:outline-none focus:border-[#e60023] focus:bg-white transition-colors"
                  />
                  <datalist id="category-suggestions">
                    <option value="Архитектура ниши" />
                    <option value="Сегментация и Интенты" />
                    <option value="SEO & Пин-Копирайтинг" />
                    <option value="Дизайн и Вижуал" />
                    <option value="Пользовательский" />
                  </datalist>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-zinc-700">
                    📌 За что отвечает (Purpose)
                  </label>
                  <input
                    type="text"
                    value={formData.purpose}
                    onChange={(e) => setFormData({ ...formData, purpose: e.target.value })}
                    placeholder="Краткое описание задачи, решаемой промптом"
                    className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-xs text-zinc-900 focus:outline-none focus:border-[#e60023] focus:bg-white transition-colors"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-zinc-700">
                      💡 Зачем нужен (Why Needed / SEO)
                    </label>
                    <input
                      type="text"
                      value={formData.whyNeeded}
                      onChange={(e) => setFormData({ ...formData, whyNeeded: e.target.value })}
                      placeholder="Обоснование ценности, правила"
                      className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-xs text-zinc-900 focus:outline-none focus:border-[#e60023] focus:bg-white transition-colors"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-zinc-700">
                      ⏰ Когда применять (When to Use)
                    </label>
                    <input
                      type="text"
                      value={formData.whenToUse}
                      onChange={(e) => setFormData({ ...formData, whenToUse: e.target.value })}
                      placeholder="Триггер запуска сценария"
                      className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-xs text-zinc-900 focus:outline-none focus:border-[#e60023] focus:bg-white transition-colors"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-zinc-700 flex items-center justify-between">
                    <span>Текст промпта (Инструкция для нейросети) <span className="text-[#e60023]">*</span></span>
                    <span className="text-[11px] text-zinc-500 font-normal">
                      {formData.template.length} символов
                    </span>
                  </label>
                  <textarea
                    required
                    value={formData.template}
                    onChange={(e) => setFormData({ ...formData, template: e.target.value })}
                    rows={8}
                    placeholder="Вставьте полный текст промпта с инструкциями, шаблонами и переменными..."
                    className="w-full px-3.5 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-mono text-zinc-900 focus:outline-none focus:border-[#e60023] focus:bg-white transition-colors leading-relaxed"
                  />
                </div>
              </div>

              {/* Modal Footer */}
              <div className="px-6 py-4 border-t border-[#f0f0f2] bg-zinc-50 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-zinc-600 hover:text-zinc-900 hover:bg-zinc-200 rounded-xl transition-colors cursor-pointer"
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !formData.title.trim() || !formData.template.trim()}
                  className="inline-flex items-center gap-1.5 px-5 py-2 text-xs font-semibold bg-[#e60023] hover:bg-[#ad081b] disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl shadow-xs transition-all cursor-pointer"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Сохранение...</span>
                    </>
                  ) : (
                    <>
                      <Plus className="w-3.5 h-3.5" />
                      <span>Сохранить промпт</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
