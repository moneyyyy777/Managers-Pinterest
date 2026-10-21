'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  X,
  Clipboard,
  Upload,
  Folder,
  Download,
  Copy,
  Check,
  Trash2,
  Type,
  FileText,
  AlertCircle,
  Tag,
  CheckCircle2
} from 'lucide-react';

export default function TagManagerModal({
  isOpen = false,
  onClose,
  onApply,
  currentTags = [],
  title = 'Менеджер тегов',
  nicheFiles = []
}) {
  const [activeTab, setActiveTab] = useState('clipboard');
  const [text, setText] = useState('');
  const [copied, setCopied] = useState(false);
  const [selectedFileIdx, setSelectedFileIdx] = useState(0);
  const [uploadedFileName, setUploadedFileName] = useState('');
  const fileInputRef = useRef(null);

  // Sync incoming currentTags to text when modal opens
  useEffect(() => {
    if (isOpen) {
      if (Array.isArray(currentTags)) {
        setText(currentTags.filter(Boolean).join('\n'));
      } else if (typeof currentTags === 'string') {
        setText(currentTags);
      } else {
        setText('');
      }
      setCopied(false);
      setUploadedFileName('');
    }
  }, [isOpen, currentTags]);

  const parsedTags = useMemo(() => {
    return text
      .split('\n')
      .map((t) => t.trim())
      .filter((t) => t.length > 0);
  }, [text]);

  const uniqueTagsCount = useMemo(() => {
    const seen = new Set();
    let count = 0;
    for (const t of parsedTags) {
      const lower = t.toLowerCase();
      if (!seen.has(lower)) {
        seen.add(lower);
        count++;
      }
    }
    return count;
  }, [parsedTags]);

  // Action: Remove duplicates (case-insensitive)
  const handleRemoveDuplicates = () => {
    const seen = new Set();
    const result = [];
    for (const line of text.split('\n')) {
      const trimmed = line.trim();
      if (!trimmed) continue;
      const lower = trimmed.toLowerCase();
      if (!seen.has(lower)) {
        seen.add(lower);
        result.push(trimmed);
      }
    }
    setText(result.join('\n'));
  };

  // Action: Convert to lowercase
  const handleToLowercase = () => {
    const lines = text
      .split('\n')
      .map((t) => t.trim().toLowerCase())
      .filter((t) => t.length > 0);
    setText(lines.join('\n'));
  };

  // Action: Paste from system clipboard
  const handlePasteFromClipboard = async () => {
    try {
      const clipText = await navigator.clipboard.readText();
      if (clipText) {
        setText((prev) => (prev ? `${prev}\n${clipText}` : clipText));
      }
    } catch (err) {
      console.error('Failed to read clipboard:', err);
    }
  };

  // Action: Handle file upload (.txt or .csv)
  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadedFileName(file.name);
    const reader = new FileReader();

    reader.onload = (event) => {
      const raw = event.target?.result;
      if (typeof raw !== 'string') return;

      if (file.name.endsWith('.csv')) {
        // Parse CSV: identify keyword column or take first column
        const lines = raw.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
        if (lines.length === 0) return;

        // Check header delimiter
        const delimiter = lines[0].includes(';') ? ';' : ',';
        const headers = lines[0].split(delimiter).map((h) => h.replace(/["']/g, '').trim().toLowerCase());
        let colIdx = headers.findIndex((h) => h.includes('keyword') || h.includes('tag') || h.includes('query'));
        if (colIdx === -1) colIdx = 0;

        const extracted = [];
        for (let i = 1; i < lines.length; i++) {
          const row = lines[i].split(delimiter);
          if (row[colIdx]) {
            const clean = row[colIdx].replace(/^["']|["']$/g, '').trim();
            if (clean) extracted.push(clean);
          }
        }
        setText(extracted.join('\n'));
      } else {
        // Plain .txt file
        const lines = raw
          .split(/\r?\n/)
          .map((l) => l.trim())
          .filter(Boolean);
        setText(lines.join('\n'));
      }
    };

    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Action: Apply tags from local niche files dropdown
  const handleSelectNicheFile = (idx) => {
    setSelectedFileIdx(idx);
    const file = nicheFiles[idx];
    if (!file) return;

    if (Array.isArray(file.tags) && file.tags.length > 0) {
      setText(file.tags.join('\n'));
    } else if (typeof file.content === 'string') {
      const lines = file.content
        .split(/\r?\n/)
        .map((l) => l.trim())
        .filter(Boolean);
      setText(lines.join('\n'));
    }
  };

  // Action: 1-click copy all
  const handleCopyAll = async () => {
    if (!text.trim()) return;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy tags:', err);
    }
  };

  // Action: Download as .txt
  const handleDownloadTxt = () => {
    if (!text.trim()) return;
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `tags_export_${Date.now()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Action: Apply to parent step
  const handleApply = () => {
    if (onApply) {
      onApply(parsedTags, activeTab);
    }
    if (onClose) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div
        className="w-full max-w-2xl bg-white border border-gray-200 rounded-3xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden text-slate-800 animate-in fade-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4.5 border-b border-gray-100 bg-gray-50/50">
          <div className="flex items-center gap-2.5">
            <span className="flex items-center justify-center w-8 h-8 rounded-xl bg-red-50 text-[#E60023] border border-red-200">
              <Tag className="w-4 h-4" />
            </span>
            <div>
              <h3 className="text-base font-bold text-slate-900">{title}</h3>
              <p className="text-xs text-slate-500">
                Импорт, очистка, дедупликация и экспорт поисковых тегов
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-xl bg-white text-slate-400 hover:text-slate-800 hover:bg-gray-100 border border-gray-200 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tabs Bar */}
        <div className="flex items-center gap-1 px-6 pt-3 border-b border-gray-100 bg-white">
          <button
            type="button"
            onClick={() => setActiveTab('clipboard')}
            className={`flex items-center gap-2 px-3.5 py-2.5 text-xs font-semibold rounded-t-xl transition-all cursor-pointer border-b-2 ${
              activeTab === 'clipboard'
                ? 'border-[#E60023] text-[#E60023] bg-red-50/50'
                : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-gray-50'
            }`}
          >
            <Clipboard className="w-3.5 h-3.5" />
            <span>📋 Буфер обмена</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('file')}
            className={`flex items-center gap-2 px-3.5 py-2.5 text-xs font-semibold rounded-t-xl transition-all cursor-pointer border-b-2 ${
              activeTab === 'file'
                ? 'border-[#E60023] text-[#E60023] bg-red-50/50'
                : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-gray-50'
            }`}
          >
            <Upload className="w-3.5 h-3.5" />
            <span>📁 Загрузить файл</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('niche')}
            className={`flex items-center gap-2 px-3.5 py-2.5 text-xs font-semibold rounded-t-xl transition-all cursor-pointer border-b-2 ${
              activeTab === 'niche'
                ? 'border-[#E60023] text-[#E60023] bg-red-50/50'
                : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-gray-50'
            }`}
          >
            <Folder className="w-3.5 h-3.5" />
            <span>💾 Локальные файлы ниши</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('export')}
            className={`flex items-center gap-2 px-3.5 py-2.5 text-xs font-semibold rounded-t-xl transition-all cursor-pointer border-b-2 ${
              activeTab === 'export'
                ? 'border-[#E60023] text-[#E60023] bg-red-50/50'
                : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-gray-50'
            }`}
          >
            <Download className="w-3.5 h-3.5" />
            <span>📤 Экспорт</span>
          </button>
        </div>

        {/* Tab Body */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1">
          {/* TAB 1: Clipboard & Quick Clean */}
          {activeTab === 'clipboard' && (
            <div className="space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={handlePasteFromClipboard}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-gray-100 hover:bg-gray-200 text-slate-800 border border-gray-300 transition-colors cursor-pointer"
                  >
                    <Clipboard className="w-3.5 h-3.5 text-slate-500" />
                    <span>Вставить из буфера</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleRemoveDuplicates}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-gray-100 hover:bg-gray-200 text-slate-800 border border-gray-300 transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-slate-500" />
                    <span>Удалить дубли</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleToLowercase}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-gray-100 hover:bg-gray-200 text-slate-800 border border-gray-300 transition-colors cursor-pointer"
                  >
                    <Type className="w-3.5 h-3.5 text-slate-500" />
                    <span>В lowercase</span>
                  </button>
                </div>

                <div className="flex items-center gap-2 text-xs font-mono text-slate-500">
                  <span>Всего строк: <strong className="text-slate-900 font-bold">{parsedTags.length}</strong></span>
                  <span>(уникальных: <strong className="text-[#E60023] font-bold">{uniqueTagsCount}</strong>)</span>
                </div>
              </div>

              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Вставьте теги сюда (по одному на строку)...&#10;christmas clipart snowman&#10;vintage santa claus"
                rows={10}
                className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl text-xs font-mono text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#E60023] focus:bg-white leading-relaxed resize-y shadow-2xs"
              />
            </div>
          )}

          {/* TAB 2: File Upload */}
          {activeTab === 'file' && (
            <div className="space-y-4">
              <div className="p-6 border-2 border-dashed border-gray-200 rounded-2xl bg-gray-50/60 text-center space-y-3">
                <Upload className="w-8 h-8 text-[#E60023] mx-auto" />
                <div className="space-y-1">
                  <p className="text-xs font-bold text-slate-800">
                    Перетащите сюда или выберите файл <span className="font-mono">.txt</span> или <span className="font-mono">.csv</span>
                  </p>
                  <p className="text-[11px] text-slate-500">
                    Для CSV система автоматически извлечет колонку с тегами (Keyword/Tag).
                  </p>
                </div>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".txt,.csv"
                  onChange={handleFileUpload}
                  className="hidden"
                  id="tag-file-upload-input"
                />

                <label
                  htmlFor="tag-file-upload-input"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-[#E60023] hover:bg-[#ad081b] text-white text-xs font-semibold rounded-xl shadow-xs cursor-pointer transition-colors"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>Выбрать файл с диска</span>
                </label>

                {uploadedFileName && (
                  <p className="text-xs text-emerald-700 font-semibold flex items-center justify-center gap-1.5 pt-2">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Загружен: {uploadedFileName} ({parsedTags.length} тегов)</span>
                  </p>
                )}
              </div>

              {parsedTags.length > 0 && (
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
                    <span>Предпросмотр загруженных тегов:</span>
                    <span className="font-mono">{parsedTags.length} строк</span>
                  </div>
                  <pre className="p-3 bg-gray-50 border border-gray-200 rounded-xl text-xs font-mono text-slate-800 max-h-48 overflow-y-auto leading-relaxed">
                    {text}
                  </pre>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: Local Niche Files */}
          {activeTab === 'niche' && (
            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-800">
                  Выберите файл ниши для извлечения тегов:
                </label>
                <p className="text-[11px] text-slate-500">
                  Доступные ключевые файлы текущей ниши и сегментов.
                </p>
              </div>

              {nicheFiles.length === 0 ? (
                <div className="p-6 bg-gray-50 border border-gray-200 rounded-2xl text-center text-xs text-slate-500 space-y-1">
                  <AlertCircle className="w-6 h-6 text-slate-400 mx-auto" />
                  <p className="font-semibold text-slate-700">Файлы ниши не переданы или отсутствуют.</p>
                  <p className="text-[11px] text-slate-400">Используйте вкладку «Буфер обмена» или «Загрузить файл».</p>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {nicheFiles.map((file, idx) => (
                      <button
                        key={file.name || idx}
                        type="button"
                        onClick={() => handleSelectNicheFile(idx)}
                        className={`p-3 rounded-xl border text-left text-xs transition-all cursor-pointer flex items-center justify-between gap-2 ${
                          selectedFileIdx === idx
                            ? 'bg-red-50/70 border-red-200 text-[#E60023] font-semibold'
                            : 'bg-gray-50 border-gray-200 text-slate-700 hover:bg-gray-100'
                        }`}
                      >
                        <div className="truncate">
                          <span className="font-mono truncate block">{file.name}</span>
                          {file.desc && (
                            <span className="text-[10px] text-slate-400 block truncate">{file.desc}</span>
                          )}
                        </div>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-white border border-gray-200 font-mono text-slate-600 shrink-0">
                          {file.tags?.length || file.count || 0} тегов
                        </span>
                      </button>
                    ))}
                  </div>

                  {parsedTags.length > 0 && (
                    <div className="space-y-1.5 pt-2">
                      <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
                        <span>Содержимое выбранного файла:</span>
                        <span className="font-mono">{parsedTags.length} тегов</span>
                      </div>
                      <pre className="p-3 bg-gray-50 border border-gray-200 rounded-xl text-xs font-mono text-slate-800 max-h-48 overflow-y-auto leading-relaxed">
                        {text}
                      </pre>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* TAB 4: Export */}
          {activeTab === 'export' && (
            <div className="space-y-4">
              <div className="p-5 bg-gray-50 border border-gray-200 rounded-2xl space-y-4">
                <div className="space-y-1">
                  <h4 className="text-xs font-bold text-slate-900">
                    Экспорт текущего набора тегов ({parsedTags.length} шт.)
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    Скопируйте в буфер или сохраните текстовый файл на компьютер.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    onClick={handleCopyAll}
                    disabled={parsedTags.length === 0}
                    className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#E60023] hover:bg-[#ad081b] disabled:opacity-50 text-white font-semibold text-xs rounded-xl shadow-xs transition-colors cursor-pointer"
                  >
                    {copied ? (
                      <>
                        <Check className="w-4 h-4 text-white" />
                        <span>Скопировано в буфер!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4" />
                        <span>📋 Скопировать все ({parsedTags.length} тегов)</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={handleDownloadTxt}
                    disabled={parsedTags.length === 0}
                    className="inline-flex items-center gap-2 px-4 py-2.5 bg-white hover:bg-gray-100 disabled:opacity-50 text-slate-800 border border-gray-300 font-semibold text-xs rounded-xl shadow-2xs transition-colors cursor-pointer"
                  >
                    <Download className="w-4 h-4 text-slate-500" />
                    <span>💾 Скачать как .txt</span>
                  </button>
                </div>
              </div>

              {parsedTags.length > 0 && (
                <div className="space-y-1.5">
                  <span className="text-xs font-semibold text-slate-700">Предпросмотр:</span>
                  <pre className="p-3 bg-gray-50 border border-gray-200 rounded-xl text-xs font-mono text-slate-800 max-h-48 overflow-y-auto leading-relaxed">
                    {text}
                  </pre>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100 bg-gray-50/50">
          <div className="text-xs text-slate-500">
            Готово к применению: <strong className="text-slate-900 font-bold">{parsedTags.length}</strong> тегов
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-gray-100 transition-colors cursor-pointer"
            >
              Отмена
            </button>

            <button
              type="button"
              onClick={handleApply}
              disabled={parsedTags.length === 0}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#E60023] hover:bg-[#ad081b] disabled:opacity-50 text-white font-semibold text-xs rounded-xl shadow-xs transition-colors cursor-pointer active:scale-98"
            >
              <Check className="w-4 h-4" />
              <span>Применить ({parsedTags.length} тегов)</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
