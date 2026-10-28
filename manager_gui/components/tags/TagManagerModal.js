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
  CheckCircle2,
  Save,
  Loader2,
  RefreshCw,
  FileSpreadsheet,
  ArrowRightLeft,
  Filter
} from 'lucide-react';

/**
 * Normalizes delimiter parsing: cleanly trims whitespace before & after delimiters
 */
function parseByDelimiter(rawText, delimiter) {
  if (!rawText || typeof rawText !== 'string') return [];

  let rawTokens = [];
  if (delimiter === ',' || delimiter === ', ') {
    rawTokens = rawText.split(',');
  } else if (delimiter === ';' || delimiter === '; ') {
    rawTokens = rawText.split(';');
  } else if (delimiter === '\t') {
    rawTokens = rawText.split('\t');
  } else if (delimiter === '|') {
    rawTokens = rawText.split('|');
  } else {
    // Auto or newline
    const lines = rawText.split(/\r?\n/);
    if (lines.length === 1 && lines[0].includes(',') && !lines[0].includes(';')) {
      rawTokens = lines[0].split(',');
    } else if (lines.length === 1 && lines[0].includes(';')) {
      rawTokens = lines[0].split(';');
    } else {
      rawTokens = lines;
    }
  }

  return rawTokens
    .map((t) => t.replace(/^["'`\s]+|["'`\s]+$/g, '').trim())
    .filter((t) => t.length > 0);
}

export default function TagManagerModal({
  isOpen = false,
  onClose,
  onApply,
  currentTags = [],
  title = 'Менеджер тегов',
  nicheFiles: initialNicheFiles = [],
  category = '',
  collection = '',
  activeSegment = null,
  onFileSaved = null
}) {
  const [activeTab, setActiveTab] = useState('clipboard');
  const [text, setText] = useState('');
  const [inputDelimiter, setInputDelimiter] = useState('auto'); // 'auto', '\n', ',', ';', '\t', '|'
  const [exportDelimiter, setExportDelimiter] = useState('\n'); // '\n', ', ', '; ', '\t', 'quoted'
  const [copied, setCopied] = useState(false);
  const [uploadedFileName, setUploadedFileName] = useState('');
  const fileInputRef = useRef(null);

  // Niche Files Browser state
  const [filesList, setFilesList] = useState([]);
  const [selectedFileRelPath, setSelectedFileRelPath] = useState('');
  const [isLoadingFiles, setIsLoadingFiles] = useState(false);
  const [isSavingFile, setIsSavingFile] = useState(false);
  const [fileSaveStatus, setFileSaveStatus] = useState(null);

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
      setFileSaveStatus(null);
    }
  }, [isOpen, currentTags]);

  // Fetch all .txt and .csv files for current niche/segment
  const loadNicheFiles = async () => {
    if (!category || !collection) return;
    try {
      setIsLoadingFiles(true);
      const params = new URLSearchParams({
        category,
        collection,
        ...(activeSegment ? { segment: activeSegment } : {})
      });
      const res = await fetch(`/api/niche/files?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.files)) {
          setFilesList(data.files);
          if (data.files.length > 0 && !selectedFileRelPath) {
            setSelectedFileRelPath(data.files[0].relativePath);
          }
        }
      }
    } catch (err) {
      console.error('Failed to load niche files:', err);
    } finally {
      setIsLoadingFiles(false);
    }
  };

  useEffect(() => {
    if (isOpen && category && collection) {
      loadNicheFiles();
    }
  }, [isOpen, category, collection, activeSegment]);

  // Parse tags list based on text and input delimiter
  const parsedTags = useMemo(() => {
    return parseByDelimiter(text, inputDelimiter);
  }, [text, inputDelimiter]);

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
    for (const item of parsedTags) {
      const lower = item.toLowerCase();
      if (!seen.has(lower)) {
        seen.add(lower);
        result.push(item);
      }
    }
    setText(result.join('\n'));
    setInputDelimiter('\n');
  };

  // Action: Convert to lowercase
  const handleToLowercase = () => {
    const lines = parsedTags.map((t) => t.toLowerCase());
    setText(lines.join('\n'));
    setInputDelimiter('\n');
  };

  // Action: Clean quotes & symbols
  const handleCleanQuotes = () => {
    const cleaned = parsedTags.map((t) =>
      t.replace(/["'`]/g, '').replace(/\s+/g, ' ').trim()
    );
    setText(cleaned.join('\n'));
    setInputDelimiter('\n');
  };

  // Action: Paste from system clipboard with smart delimiter parsing
  const handlePasteFromClipboard = async () => {
    try {
      const clipText = await navigator.clipboard.readText();
      if (clipText) {
        // Parse with current delimiter
        const tokens = parseByDelimiter(clipText, inputDelimiter);
        const formatted = tokens.join('\n');
        setText((prev) => (prev ? `${prev}\n${formatted}` : formatted));
        setInputDelimiter('\n');
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
        const lines = raw.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
        if (lines.length === 0) return;

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
        const parsed = parseByDelimiter(raw, inputDelimiter);
        setText(parsed.join('\n'));
      }
      setInputDelimiter('\n');
    };

    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Action: Select and read a niche file (.txt / .csv)
  const handleSelectNicheFile = async (relPath) => {
    setSelectedFileRelPath(relPath);
    setFileSaveStatus(null);
    try {
      const params = new URLSearchParams({
        category,
        collection,
        file: relPath,
        ...(activeSegment ? { segment: activeSegment } : {})
      });
      const res = await fetch(`/api/niche/files?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.file) {
          setText(data.file.content);
          setInputDelimiter('\n');
        }
      }
    } catch (err) {
      console.error('Failed to load file content:', err);
    }
  };

  // Action: Save changes to the selected niche file on disk
  const handleSaveToNicheFile = async () => {
    if (!selectedFileRelPath || !category || !collection) return;
    try {
      setIsSavingFile(true);
      setFileSaveStatus(null);
      const res = await fetch('/api/niche/files', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category,
          collection,
          segment: activeSegment,
          relativePath: selectedFileRelPath,
          content: text
        })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Ошибка при сохранении файла');
      }

      setFileSaveStatus({
        type: 'success',
        message: `Файл ${selectedFileRelPath} успешно сохранен (${data.file?.lineCount || parsedTags.length} строк)!`
      });

      if (onFileSaved) onFileSaved(data.file);
      await loadNicheFiles();
    } catch (err) {
      console.error('Error saving niche file:', err);
      setFileSaveStatus({
        type: 'error',
        message: err.message || 'Не удалось сохранить файл'
      });
    } finally {
      setIsSavingFile(false);
    }
  };

  // Build formatted text for export with chosen export delimiter
  const formattedExportText = useMemo(() => {
    if (exportDelimiter === 'quoted') {
      return parsedTags.map((t) => `"${t}"`).join(', ');
    }
    return parsedTags.join(exportDelimiter);
  }, [parsedTags, exportDelimiter]);

  // Action: 1-click copy with custom export delimiter
  const handleCopyFormatted = async () => {
    if (!formattedExportText.trim()) return;
    try {
      await navigator.clipboard.writeText(formattedExportText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy tags:', err);
    }
  };

  // Action: Download file
  const handleDownloadFile = (ext = 'txt') => {
    if (!formattedExportText.trim()) return;
    const mime = ext === 'csv' ? 'text/csv;charset=utf-8' : 'text/plain;charset=utf-8';
    const blob = new Blob([formattedExportText], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `tags_export_${Date.now()}.${ext}`;
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs">
      <div
        className="w-full max-w-3xl bg-white border border-gray-200 rounded-3xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden text-slate-800 animate-in fade-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50/50">
          <div className="flex items-center gap-2.5">
            <span className="flex items-center justify-center w-8 h-8 rounded-xl bg-red-50 text-[#E60023] border border-red-200">
              <Tag className="w-4 h-4" />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-900">{title}</h3>
                {activeSegment && (
                  <span className="text-[10px] bg-red-50 text-[#E60023] border border-red-200 px-2 py-0.5 rounded-full font-semibold">
                    🏷️ {activeSegment}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500">
                Импорт, дедупликация, гибкие разделители и редактирование всех файлов ниши (.txt / .csv)
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
        <div className="flex items-center gap-1 px-6 pt-2.5 border-b border-gray-100 bg-white overflow-x-auto no-scrollbar">
          <button
            type="button"
            onClick={() => setActiveTab('clipboard')}
            className={`flex items-center gap-2 px-3.5 py-2.5 text-xs font-semibold rounded-t-xl transition-all cursor-pointer border-b-2 shrink-0 ${
              activeTab === 'clipboard'
                ? 'border-[#E60023] text-[#E60023] bg-red-50/50'
                : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-gray-50'
            }`}
          >
            <Clipboard className="w-3.5 h-3.5" />
            <span>📋 Буфер и Разделители</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('niche_files')}
            className={`flex items-center gap-2 px-3.5 py-2.5 text-xs font-semibold rounded-t-xl transition-all cursor-pointer border-b-2 shrink-0 ${
              activeTab === 'niche_files'
                ? 'border-[#E60023] text-[#E60023] bg-red-50/50'
                : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-gray-50'
            }`}
          >
            <Folder className="w-3.5 h-3.5" />
            <span>📁 Все файлы ниши (TXT/CSV)</span>
            {filesList.length > 0 && (
              <span className="text-[10px] bg-red-100 text-[#E60023] px-1.5 py-0.2 rounded-full font-bold">
                {filesList.length}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('file')}
            className={`flex items-center gap-2 px-3.5 py-2.5 text-xs font-semibold rounded-t-xl transition-all cursor-pointer border-b-2 shrink-0 ${
              activeTab === 'file'
                ? 'border-[#E60023] text-[#E60023] bg-red-50/50'
                : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-gray-50'
            }`}
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Загрузить с диска</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('export')}
            className={`flex items-center gap-2 px-3.5 py-2.5 text-xs font-semibold rounded-t-xl transition-all cursor-pointer border-b-2 shrink-0 ${
              activeTab === 'export'
                ? 'border-[#E60023] text-[#E60023] bg-red-50/50'
                : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-gray-50'
            }`}
          >
            <Download className="w-3.5 h-3.5" />
            <span>📤 Экспорт с разделителем</span>
          </button>
        </div>

        {/* Tab Body */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1">
          {/* TAB 1: Clipboard & Smart Delimiters */}
          {activeTab === 'clipboard' && (
            <div className="space-y-3">
              {/* Delimiter Selection & Quick Cleaning Toolbar */}
              <div className="bg-gray-50 p-3 rounded-2xl border border-gray-200 space-y-2.5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-700">Разделитель при вставке:</span>
                    <select
                      value={inputDelimiter}
                      onChange={(e) => setInputDelimiter(e.target.value)}
                      className="text-xs bg-white border border-gray-300 rounded-lg px-2.5 py-1 text-slate-800 font-semibold focus:outline-none focus:border-[#E60023]"
                    >
                      <option value="auto">⚡ Авто (строки / запятые)</option>
                      <option value="\n">Построчно (новая строка \n)</option>
                      <option value=",">Запятая с пробелом (, пробел учитывается)</option>
                      <option value=";">Точка с запятой (;)</option>
                      <option value="\t">Табуляция (\t)</option>
                      <option value="|">Вертикальная черта (|)</option>
                    </select>
                  </div>

                  <div className="flex items-center gap-2 text-xs font-mono text-slate-500">
                    <span>Всего строк: <strong className="text-slate-900 font-bold">{parsedTags.length}</strong></span>
                    <span>(уникальных: <strong className="text-[#E60023] font-bold">{uniqueTagsCount}</strong>)</span>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-gray-200/60">
                  <button
                    type="button"
                    onClick={handlePasteFromClipboard}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-white hover:bg-gray-100 text-slate-800 border border-gray-300 transition-colors cursor-pointer shadow-2xs"
                  >
                    <Clipboard className="w-3.5 h-3.5 text-[#E60023]" />
                    <span>Вставить из буфера</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleRemoveDuplicates}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-white hover:bg-gray-100 text-slate-800 border border-gray-300 transition-colors cursor-pointer shadow-2xs"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-slate-500" />
                    <span>Удалить дубли</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleToLowercase}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-white hover:bg-gray-100 text-slate-800 border border-gray-300 transition-colors cursor-pointer shadow-2xs"
                  >
                    <Type className="w-3.5 h-3.5 text-slate-500" />
                    <span>В lowercase</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleCleanQuotes}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-white hover:bg-gray-100 text-slate-800 border border-gray-300 transition-colors cursor-pointer shadow-2xs"
                  >
                    <span>Очистить кавычки</span>
                  </button>
                </div>
              </div>

              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Вставьте теги сюда...&#10;Поддерживаются любые разделители: построчно, через запятую с пробелом (christmas clipart, snowman, winter tree) или точку с запятой."
                rows={11}
                className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl text-xs font-mono text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#E60023] focus:bg-white leading-relaxed resize-y shadow-2xs"
              />
            </div>
          )}

          {/* TAB 2: All Niche Files (TXT & CSV Browser & Direct Editor) */}
          {activeTab === 'niche_files' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h4 className="text-xs font-bold text-slate-900">
                    Файлы ниши (.txt и .csv):
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    Выберите любой файл ниши или подниши для просмотра, редактирования и сохранения на диск.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={loadNicheFiles}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-xs text-slate-700 font-semibold border border-gray-300 transition-colors cursor-pointer self-start"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isLoadingFiles ? 'animate-spin' : ''}`} />
                  <span>Обновить список</span>
                </button>
              </div>

              {isLoadingFiles ? (
                <div className="p-8 text-center text-xs text-slate-500 flex items-center justify-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin text-[#E60023]" />
                  <span>Сканирование файлов ниши...</span>
                </div>
              ) : filesList.length === 0 ? (
                <div className="p-6 bg-gray-50 border border-gray-200 rounded-2xl text-center text-xs text-slate-500 space-y-1">
                  <AlertCircle className="w-6 h-6 text-slate-400 mx-auto" />
                  <p className="font-semibold text-slate-700">Файлы .txt и .csv в нише не найдены.</p>
                  <p className="text-[11px] text-slate-400">Инициализируйте нишу или сохраните теги в Шаге 2 / Шаге 3.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {/* Grid of Available Files */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 max-h-48 overflow-y-auto p-1 border border-gray-200 rounded-xl bg-gray-50/50">
                    {filesList.map((file) => {
                      const isSelected = selectedFileRelPath === file.relativePath;
                      return (
                        <button
                          key={file.relativePath}
                          type="button"
                          onClick={() => handleSelectNicheFile(file.relativePath)}
                          className={`p-2.5 rounded-xl border text-left text-xs transition-all cursor-pointer flex flex-col justify-between gap-1 ${
                            isSelected
                              ? 'bg-red-50 border-[#E60023] text-[#E60023] font-semibold shadow-xs'
                              : 'bg-white border-gray-200 text-slate-700 hover:bg-gray-100'
                          }`}
                        >
                          <div className="flex items-center gap-1.5 truncate">
                            {file.type === 'csv' ? (
                              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                            ) : (
                              <FileText className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                            )}
                            <span className="font-mono text-[11px] truncate">{file.name}</span>
                          </div>

                          <div className="flex items-center justify-between text-[10px] text-slate-500 font-mono">
                            <span>{file.lineCount} строк</span>
                            <span>{(file.size / 1024).toFixed(1)} KB</span>
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  {/* Editor for the selected file */}
                  {selectedFileRelPath && (
                    <div className="space-y-2 pt-2 border-t border-gray-100">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <span className="text-xs font-semibold text-slate-800 flex items-center gap-1.5 font-mono">
                          <span>Редактирование:</span>
                          <span className="bg-gray-100 px-2 py-0.5 rounded text-[#E60023]">
                            {selectedFileRelPath}
                          </span>
                        </span>

                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={handleSaveToNicheFile}
                            disabled={isSavingFile}
                            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white shadow-xs transition-colors cursor-pointer"
                          >
                            {isSavingFile ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <Save className="w-3.5 h-3.5" />
                            )}
                            <span>💾 Сохранить изменения в файл</span>
                          </button>
                        </div>
                      </div>

                      {fileSaveStatus && (
                        <div
                          className={`p-2.5 rounded-xl text-xs flex items-center gap-2 ${
                            fileSaveStatus.type === 'success'
                              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                              : 'bg-red-50 text-red-800 border border-red-200'
                          }`}
                        >
                          {fileSaveStatus.type === 'success' ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                          ) : (
                            <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                          )}
                          <span>{fileSaveStatus.message}</span>
                        </div>
                      )}

                      <textarea
                        value={text}
                        onChange={(e) => setText(e.target.value)}
                        rows={9}
                        className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl text-xs font-mono text-slate-900 focus:outline-none focus:border-[#E60023] focus:bg-white leading-relaxed resize-y shadow-2xs"
                      />
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: File Upload */}
          {activeTab === 'file' && (
            <div className="space-y-4">
              <div className="p-6 border-2 border-dashed border-gray-200 rounded-2xl bg-gray-50/60 text-center space-y-3">
                <Upload className="w-8 h-8 text-[#E60023] mx-auto" />
                <div className="space-y-1">
                  <p className="text-xs font-bold text-slate-800">
                    Перетащите сюда или выберите файл <span className="font-mono">.txt</span> или <span className="font-mono">.csv</span>
                  </p>
                  <p className="text-[11px] text-slate-500">
                    Для CSV система автоматически извлечет колонку с ключевыми словами.
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

          {/* TAB 4: Export with customizable column delimiter */}
          {activeTab === 'export' && (
            <div className="space-y-4">
              <div className="p-5 bg-gray-50 border border-gray-200 rounded-2xl space-y-4">
                <div className="space-y-1">
                  <h4 className="text-xs font-bold text-slate-900">
                    Экспорт набора тегов ({parsedTags.length} шт.) с выбором разделителя
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    Скопируйте в буфер в нужном формате или скачайте на компьютер.
                  </p>
                </div>

                {/* Export Delimiter Selector */}
                <div className="flex flex-wrap items-center gap-3">
                  <span className="text-xs font-bold text-slate-700">Формат разделителя:</span>
                  <select
                    value={exportDelimiter}
                    onChange={(e) => setExportDelimiter(e.target.value)}
                    className="text-xs bg-white border border-gray-300 rounded-lg px-3 py-1.5 text-slate-800 font-semibold focus:outline-none focus:border-[#E60023]"
                  >
                    <option value={'\n'}>Построчно (новая строка \n)</option>
                    <option value={', '}>Через запятую с пробелом (, )</option>
                    <option value={'; '}>Через точку с запятой (; )</option>
                    <option value={'\t'}>Через табуляцию (\t — для Excel)</option>
                    <option value={'quoted'}>В кавычках ("tag 1", "tag 2")</option>
                  </select>
                </div>

                <div className="flex flex-wrap items-center gap-3 pt-2">
                  <button
                    type="button"
                    onClick={handleCopyFormatted}
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
                        <span>📋 Скопировать в выбранном формате ({parsedTags.length})</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDownloadFile('txt')}
                    disabled={parsedTags.length === 0}
                    className="inline-flex items-center gap-2 px-4 py-2.5 bg-white hover:bg-gray-100 disabled:opacity-50 text-slate-800 border border-gray-300 font-semibold text-xs rounded-xl shadow-2xs transition-colors cursor-pointer"
                  >
                    <Download className="w-4 h-4 text-slate-500" />
                    <span>Скачать .txt</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDownloadFile('csv')}
                    disabled={parsedTags.length === 0}
                    className="inline-flex items-center gap-2 px-4 py-2.5 bg-white hover:bg-gray-100 disabled:opacity-50 text-slate-800 border border-gray-300 font-semibold text-xs rounded-xl shadow-2xs transition-colors cursor-pointer"
                  >
                    <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                    <span>Скачать .csv</span>
                  </button>
                </div>
              </div>

              {parsedTags.length > 0 && (
                <div className="space-y-1.5">
                  <span className="text-xs font-semibold text-slate-700">
                    Предпросмотр форматированного вывода:
                  </span>
                  <pre className="p-3 bg-gray-50 border border-gray-200 rounded-xl text-xs font-mono text-slate-800 max-h-48 overflow-y-auto leading-relaxed">
                    {formattedExportText}
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
              Закрыть
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
