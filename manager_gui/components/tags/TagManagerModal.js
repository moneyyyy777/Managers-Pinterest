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
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Maximize2,
  Minimize2,
  Search,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Sparkles,
  Layers,
  Filter,
  Table as TableIcon
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

/**
 * Smart CSV parser that handles delimiters, quotes, and detects header rows vs data rows
 */
function parseCsvContent(rawText) {
  if (!rawText || typeof rawText !== 'string') {
    return { headers: [], rows: [] };
  }

  const lines = rawText.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length === 0) {
    return { headers: [], rows: [] };
  }

  const firstLine = lines[0];
  const delim = firstLine.includes(';') ? ';' : firstLine.includes('\t') ? '\t' : ',';

  function splitLine(line) {
    if (!line.includes('"')) {
      return line.split(delim).map((c) => c.trim());
    }
    const res = [];
    let cur = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') {
        if (inQuotes && line[i + 1] === '"') {
          cur += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (ch === delim && !inQuotes) {
        res.push(cur.trim());
        cur = '';
      } else {
        cur += ch;
      }
    }
    res.push(cur.trim());
    return res;
  }

  const rawHeaders = splitLine(firstLine);
  const headerKeywords = [
    'keyword',
    'tag',
    'query',
    'phrase',
    'volume',
    'search',
    'объем',
    'запрос',
    'url',
    'title',
    'description',
    'image',
    'link',
    'cta'
  ];
  const hasKeywordInFirst = rawHeaders.some((h) =>
    headerKeywords.some((kw) => h.toLowerCase().includes(kw))
  );
  const secondColIsNum =
    rawHeaders.length > 1 && !isNaN(Number(rawHeaders[1].replace(/[\s,\.]/g, '')));

  let headers = [];
  let startIdx = 0;

  if (hasKeywordInFirst && !secondColIsNum) {
    headers = rawHeaders.map(
      (h, i) => h.replace(/^["'\s]+|["'\s]+$/g, '') || `Колонка ${i + 1}`
    );
    startIdx = 1;
  } else {
    // Generate intuitive headers
    headers = rawHeaders.map((val, i) => {
      if (i === 0) return 'Ключевое слово / Тег';
      const isNum = !isNaN(Number(val.replace(/[\s,\.]/g, '')));
      if (isNum && i === 1) return 'Search Volume';
      return `Колонка ${i + 1}`;
    });
    startIdx = 0;
  }

  const rows = [];
  for (let i = startIdx; i < lines.length; i++) {
    const row = splitLine(lines[i]);
    if (row.some((c) => c.length > 0)) {
      rows.push(row);
    }
  }

  return { headers, rows };
}

/**
 * Format search volume numbers with visual status badges
 */
function renderVolumeBadge(value) {
  if (value == null || value === '') return <span className="text-slate-400">—</span>;

  const rawStr = String(value).trim();
  const cleanStr = rawStr.replace(/[\s,\.]/g, '');
  const num = Number(cleanStr);

  if (isNaN(num) || num < 0) {
    return <span className="text-slate-800">{rawStr}</span>;
  }

  if (num >= 10000) {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-50 text-purple-700 border border-purple-200 shadow-2xs font-mono">
        <span className="text-[11px]">🔥</span>
        <span>
          {num >= 1000
            ? `${(num / 1000).toLocaleString('en-US', { maximumFractionDigits: 1 })}K`
            : num}
        </span>
        <span className="text-[10px] text-purple-400 font-normal">({num.toLocaleString()})</span>
      </span>
    );
  }

  if (num >= 1000) {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-2xs font-mono">
        <span className="text-[11px]">✨</span>
        <span>
          {`${(num / 1000).toLocaleString('en-US', { maximumFractionDigits: 1 })}K`}
        </span>
        <span className="text-[10px] text-emerald-400 font-normal">({num.toLocaleString()})</span>
      </span>
    );
  }

  if (num >= 100) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200 font-mono">
        <span className="text-[10px]">📈</span>
        <span>{num.toLocaleString()}</span>
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs text-slate-600 bg-slate-100 border border-slate-200 font-mono">
      <span className="text-[10px] text-slate-400">•</span>
      <span>{num.toLocaleString()}</span>
    </span>
  );
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
  const [activeTab, setActiveTab] = useState('niche_files'); // 'niche_files', 'clipboard', 'file', 'export'
  const [text, setText] = useState('');
  const [inputDelimiter, setInputDelimiter] = useState('auto');
  const [exportDelimiter, setExportDelimiter] = useState('\n');
  const [copied, setCopied] = useState(false);
  const [tableCopied, setTableCopied] = useState(false);
  const [tagsCopied, setTagsCopied] = useState(false);
  const [uploadedFileName, setUploadedFileName] = useState('');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const fileInputRef = useRef(null);

  // Niche Files Browser state
  const [filesList, setFilesList] = useState([]);
  const [selectedFileRelPath, setSelectedFileRelPath] = useState('');
  const [selectedFileMeta, setSelectedFileMeta] = useState(null);
  const [isLoadingFiles, setIsLoadingFiles] = useState(false);
  const [isLoadingFileContent, setIsLoadingFileContent] = useState(false);
  const [isSavingFile, setIsSavingFile] = useState(false);
  const [fileSaveStatus, setFileSaveStatus] = useState(null);

  // Interactive Table & File Viewer state
  const [viewMode, setViewMode] = useState('table'); // 'table' | 'raw'
  const [fileTypeFilter, setFileTypeFilter] = useState('all'); // 'all', 'csv', 'xlsx', 'txt'
  const [fileSearchQuery, setFileSearchQuery] = useState('');
  const [selectedSheet, setSelectedSheet] = useState('');
  const [tableSearchQuery, setTableSearchQuery] = useState('');
  const [sortConfig, setSortConfig] = useState(null); // { colIndex: number, direction: 'asc' | 'desc' }
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);

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
      setTableCopied(false);
      setTagsCopied(false);
      setUploadedFileName('');
      setFileSaveStatus(null);
      setSortConfig(null);
      setTableSearchQuery('');
      setPage(1);
    }
  }, [isOpen, currentTags]);

  // Fetch all .txt, .csv and .xlsx files for current niche/segment
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
          // If no file currently selected, pick first priority file (e.g. All.csv, seeds, etc.)
          if (data.files.length > 0 && !selectedFileRelPath) {
            handleSelectNicheFile(data.files[0].relativePath);
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

  // Counts of each file type for tabs
  const fileCounts = useMemo(() => {
    let csv = 0;
    let xlsx = 0;
    let txt = 0;
    for (const f of filesList) {
      if (f.type === 'csv') csv++;
      else if (f.type === 'xlsx') xlsx++;
      else txt++;
    }
    return { all: filesList.length, csv, xlsx, txt };
  }, [filesList]);

  // Filtered files list for file browser
  const filteredFilesList = useMemo(() => {
    return filesList.filter((f) => {
      if (fileTypeFilter !== 'all' && f.type !== fileTypeFilter) return false;
      if (fileSearchQuery.trim()) {
        const q = fileSearchQuery.toLowerCase();
        return (
          f.name.toLowerCase().includes(q) ||
          f.relativePath.toLowerCase().includes(q) ||
          (f.folderName && f.folderName.toLowerCase().includes(q))
        );
      }
      return true;
    });
  }, [filesList, fileTypeFilter, fileSearchQuery]);

  // Action: Select and read a niche file (.txt / .csv / .xlsx)
  const handleSelectNicheFile = async (relPath) => {
    setSelectedFileRelPath(relPath);
    setFileSaveStatus(null);
    setSortConfig(null);
    setTableSearchQuery('');
    setPage(1);

    try {
      setIsLoadingFileContent(true);
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
          setSelectedFileMeta(data.file);

          if (data.file.type === 'xlsx') {
            setViewMode('table');
            const sheets = data.file.sheetNames || [];
            if (sheets.length > 0) {
              setSelectedSheet(sheets[0]);
            }
            setText(data.file.content || '');
          } else if (data.file.type === 'csv') {
            setViewMode('table');
            setText(data.file.content || '');
            setInputDelimiter('\n');
          } else {
            // Text file
            setViewMode('raw');
            setText(data.file.content || '');
            setInputDelimiter('\n');
          }
        }
      }
    } catch (err) {
      console.error('Failed to load file content:', err);
    } finally {
      setIsLoadingFileContent(false);
    }
  };

  // Structured table data for currently selected file
  const activeTableData = useMemo(() => {
    if (!selectedFileMeta) {
      if (text) {
        return parseCsvContent(text);
      }
      return { headers: [], rows: [] };
    }

    if (selectedFileMeta.type === 'xlsx') {
      const sheetName = selectedSheet || selectedFileMeta.sheetNames?.[0];
      const sheetData = selectedFileMeta.sheets?.[sheetName];
      if (sheetData) {
        return {
          headers: sheetData.headers || [],
          rows: sheetData.rows || []
        };
      }
      return { headers: [], rows: [] };
    }

    if (selectedFileMeta.type === 'csv') {
      return parseCsvContent(text);
    }

    // TXT file table representation (single column of tags)
    const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
    return {
      headers: ['Тег / Строка'],
      rows: lines.map((l) => [l.trim()])
    };
  }, [selectedFileMeta, selectedSheet, text]);

  // Identify column indices for tags and search volume
  const columnIndices = useMemo(() => {
    const headers = activeTableData.headers.map((h) => String(h).toLowerCase());
    let tagColIdx = headers.findIndex((h) =>
      ['keyword', 'tag', 'query', 'phrase', 'тег', 'запрос', 'ключевое слово'].some((k) =>
        h.includes(k)
      )
    );
    if (tagColIdx === -1 && activeTableData.headers.length > 0) tagColIdx = 0;

    let volumeColIdx = headers.findIndex((h) =>
      ['volume', 'search', 'объем', 'частотность'].some((k) => h.includes(k))
    );
    if (volumeColIdx === -1 && activeTableData.headers.length === 2) {
      volumeColIdx = 1;
    }

    return { tagColIdx, volumeColIdx };
  }, [activeTableData.headers]);

  // Live filter and sort rows
  const processedRows = useMemo(() => {
    let rows = activeTableData.rows || [];

    // Filter by live search query
    if (tableSearchQuery.trim()) {
      const q = tableSearchQuery.toLowerCase().trim();
      rows = rows.filter((r) =>
        r.some((cell) => cell != null && String(cell).toLowerCase().includes(q))
      );
    }

    // Sort by column if sortConfig is active
    if (sortConfig && sortConfig.colIndex != null) {
      const { colIndex, direction } = sortConfig;
      const isVolumeCol = colIndex === columnIndices.volumeColIdx;

      rows = [...rows].sort((a, b) => {
        const valA = a[colIndex];
        const valB = b[colIndex];

        if (isVolumeCol) {
          const numA = Number(String(valA || '').replace(/[\s,\.]/g, '')) || 0;
          const numB = Number(String(valB || '').replace(/[\s,\.]/g, '')) || 0;
          return direction === 'asc' ? numA - numB : numB - numA;
        }

        const strA = String(valA || '').toLowerCase();
        const strB = String(valB || '').toLowerCase();
        const cmp = strA.localeCompare(strB, 'ru', { numeric: true });
        return direction === 'asc' ? cmp : -cmp;
      });
    }

    return rows;
  }, [activeTableData.rows, tableSearchQuery, sortConfig, columnIndices]);

  // Paginated rows
  const paginatedRows = useMemo(() => {
    const start = (page - 1) * pageSize;
    return processedRows.slice(start, start + pageSize);
  }, [processedRows, page, pageSize]);

  const totalPages = Math.max(1, Math.ceil(processedRows.length / pageSize));

  // Handle column header click for sorting
  const handleSort = (colIndex) => {
    setSortConfig((prev) => {
      if (!prev || prev.colIndex !== colIndex) {
        // If sorting a volume column, default to descending (highest volume first)
        const isVolume = colIndex === columnIndices.volumeColIdx;
        return { colIndex, direction: isVolume ? 'desc' : 'asc' };
      }
      if (prev.direction === 'asc') {
        return { colIndex, direction: 'desc' };
      }
      return null;
    });
    setPage(1);
  };

  // Quick Action: Copy only tags from the current filtered table
  const handleCopyTagsFromTable = async () => {
    const colIdx = columnIndices.tagColIdx !== -1 ? columnIndices.tagColIdx : 0;
    const tags = processedRows
      .map((r) => String(r[colIdx] || '').trim())
      .filter(Boolean);

    if (tags.length === 0) return;
    try {
      await navigator.clipboard.writeText(tags.join('\n'));
      setTagsCopied(true);
      setTimeout(() => setTagsCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy tags:', err);
    }
  };

  // Quick Action: Copy entire filtered table as TSV (Excel paste ready)
  const handleCopyTableTSV = async () => {
    if (processedRows.length === 0) return;
    try {
      const headerLine = activeTableData.headers.join('\t');
      const dataLines = processedRows.map((r) => r.join('\t'));
      const tsvText = [headerLine, ...dataLines].join('\n');
      await navigator.clipboard.writeText(tsvText);
      setTableCopied(true);
      setTimeout(() => setTableCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy table:', err);
    }
  };

  // Quick Action: Download table as CSV
  const handleDownloadTableCsv = () => {
    if (processedRows.length === 0) return;
    const headerLine = activeTableData.headers.map((h) => `"${h}"`).join(';');
    const dataLines = processedRows.map((r) =>
      r.map((c) => `"${String(c || '').replace(/"/g, '""')}"`).join(';')
    );
    const csvContent = [headerLine, ...dataLines].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${(selectedFileMeta?.name || 'export').replace(/\.[^/.]+$/, '')}_table.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Quick Action: Apply current table tags into step
  const handleApplyTableTags = () => {
    const colIdx = columnIndices.tagColIdx !== -1 ? columnIndices.tagColIdx : 0;
    const tags = processedRows
      .map((r) => String(r[colIdx] || '').trim())
      .filter(Boolean);

    if (tags.length > 0 && onApply) {
      onApply(tags, 'table_view');
      if (onClose) onClose();
    }
  };

  // Action: Remove duplicates (case-insensitive) in clipboard tab
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

  // Action: Paste from system clipboard
  const handlePasteFromClipboard = async () => {
    try {
      const clipText = await navigator.clipboard.readText();
      if (clipText) {
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
        const parsed = parseCsvContent(raw);
        setSelectedFileMeta({
          name: file.name,
          relativePath: file.name,
          size: file.size,
          type: 'csv',
          lineCount: parsed.rows.length,
          content: raw
        });
        setText(raw);
        setViewMode('table');
      } else {
        const parsed = parseByDelimiter(raw, inputDelimiter);
        setText(parsed.join('\n'));
        setInputDelimiter('\n');
      }
    };

    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
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

  // Action: Download file from Export tab
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-900/60 backdrop-blur-xs">
      <div
        className={`${
          isFullscreen
            ? 'fixed inset-2 sm:inset-4 z-50 rounded-2xl'
            : 'w-full max-w-6xl xl:max-w-7xl rounded-3xl max-h-[94vh]'
        } bg-white border border-gray-200 shadow-2xl flex flex-col overflow-hidden text-slate-800 transition-all duration-200 animate-in fade-in zoom-in-95`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 sm:px-6 py-3.5 border-b border-gray-100 bg-gray-50/80">
          <div className="flex items-center gap-3">
            <span className="flex items-center justify-center w-8 h-8 rounded-xl bg-red-50 text-[#E60023] border border-red-200 shrink-0">
              <Tag className="w-4 h-4" />
            </span>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-base font-bold text-slate-900">{title}</h3>
                {activeSegment && (
                  <span className="text-[10px] bg-red-50 text-[#E60023] border border-red-200 px-2 py-0.5 rounded-full font-semibold">
                    🏷️ {activeSegment}
                  </span>
                )}
                <span className="text-[10px] text-slate-500 bg-white border border-gray-200 px-2 py-0.5 rounded-full font-mono">
                  {category} / {collection}
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Интерактивный просмотр CSV и Excel (XLSX), дедупликация, поиск и экспорт тегов
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="w-8 h-8 flex items-center justify-center rounded-xl bg-white text-slate-500 hover:text-slate-900 hover:bg-gray-100 border border-gray-200 transition-colors cursor-pointer"
              title={isFullscreen ? 'Свернуть в окно' : 'Развернуть на весь экран'}
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>

            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-xl bg-white text-slate-400 hover:text-slate-800 hover:bg-gray-100 border border-gray-200 transition-colors cursor-pointer"
              title="Закрыть"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Tabs Bar */}
        <div className="flex items-center gap-1 px-5 sm:px-6 pt-2 border-b border-gray-100 bg-white overflow-x-auto no-scrollbar">
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
            <span>📁 Файлы ниши (Таблицы CSV / XLSX / TXT)</span>
            {filesList.length > 0 && (
              <span className="text-[10px] bg-red-100 text-[#E60023] px-1.5 py-0.2 rounded-full font-bold">
                {filesList.length}
              </span>
            )}
          </button>

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
        <div className="p-4 sm:p-6 overflow-y-auto space-y-4 flex-1">
          {/* TAB 1: ALL NICHE FILES (CSV, XLSX, TXT Browser & Interactive Table) */}
          {activeTab === 'niche_files' && (
            <div className="space-y-4">
              {/* Files Filter & Search Toolbar */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-gray-50/70 p-3 rounded-2xl border border-gray-200">
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="text-xs font-bold text-slate-700 mr-1 flex items-center gap-1">
                    <Filter className="w-3 h-3 text-slate-500" />
                    <span>Фильтр:</span>
                  </span>

                  <button
                    type="button"
                    onClick={() => setFileTypeFilter('all')}
                    className={`px-2.5 py-1 text-xs rounded-lg font-medium transition-colors cursor-pointer ${
                      fileTypeFilter === 'all'
                        ? 'bg-slate-900 text-white shadow-2xs font-bold'
                        : 'bg-white border border-gray-200 text-slate-600 hover:bg-gray-100'
                    }`}
                  >
                    Все ({fileCounts.all})
                  </button>

                  <button
                    type="button"
                    onClick={() => setFileTypeFilter('csv')}
                    className={`px-2.5 py-1 text-xs rounded-lg font-medium transition-colors cursor-pointer flex items-center gap-1 ${
                      fileTypeFilter === 'csv'
                        ? 'bg-emerald-600 text-white shadow-2xs font-bold'
                        : 'bg-white border border-gray-200 text-slate-600 hover:bg-gray-100'
                    }`}
                  >
                    <FileSpreadsheet className="w-3 h-3 text-emerald-500" />
                    <span>CSV ({fileCounts.csv})</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setFileTypeFilter('xlsx')}
                    className={`px-2.5 py-1 text-xs rounded-lg font-medium transition-colors cursor-pointer flex items-center gap-1 ${
                      fileTypeFilter === 'xlsx'
                        ? 'bg-green-700 text-white shadow-2xs font-bold'
                        : 'bg-white border border-gray-200 text-slate-600 hover:bg-gray-100'
                    }`}
                  >
                    <FileSpreadsheet className="w-3 h-3 text-green-600" />
                    <span>Excel XLSX ({fileCounts.xlsx})</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setFileTypeFilter('txt')}
                    className={`px-2.5 py-1 text-xs rounded-lg font-medium transition-colors cursor-pointer flex items-center gap-1 ${
                      fileTypeFilter === 'txt'
                        ? 'bg-blue-600 text-white shadow-2xs font-bold'
                        : 'bg-white border border-gray-200 text-slate-600 hover:bg-gray-100'
                    }`}
                  >
                    <FileText className="w-3 h-3 text-blue-500" />
                    <span>TXT ({fileCounts.txt})</span>
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <div className="relative flex-1 md:w-64">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={fileSearchQuery}
                      onChange={(e) => setFileSearchQuery(e.target.value)}
                      placeholder="Поиск файла..."
                      className="w-full text-xs bg-white border border-gray-200 rounded-lg pl-8 pr-2.5 py-1 text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#E60023]"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={loadNicheFiles}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white hover:bg-gray-100 text-xs text-slate-700 font-semibold border border-gray-200 transition-colors cursor-pointer shrink-0"
                    title="Обновить список файлов с диска"
                  >
                    <RefreshCw className={`w-3 h-3 ${isLoadingFiles ? 'animate-spin' : ''}`} />
                    <span>Обновить</span>
                  </button>
                </div>
              </div>

              {/* Files Grid */}
              {isLoadingFiles ? (
                <div className="p-8 text-center text-xs text-slate-500 flex items-center justify-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin text-[#E60023]" />
                  <span>Сканирование файлов ниши...</span>
                </div>
              ) : filteredFilesList.length === 0 ? (
                <div className="p-6 bg-gray-50 border border-gray-200 rounded-2xl text-center text-xs text-slate-500 space-y-1">
                  <AlertCircle className="w-6 h-6 text-slate-400 mx-auto" />
                  <p className="font-semibold text-slate-700">Файлы по выбранному фильтру не найдены.</p>
                  <p className="text-[11px] text-slate-400">Попробуйте сбросить фильтр или обновить список.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2 max-h-40 overflow-y-auto p-1.5 border border-gray-200 rounded-xl bg-gray-50/40">
                  {filteredFilesList.map((file) => {
                    const isSelected = selectedFileRelPath === file.relativePath;
                    const isXlsx = file.type === 'xlsx';
                    const isCsv = file.type === 'csv';

                    return (
                      <button
                        key={file.relativePath}
                        type="button"
                        onClick={() => handleSelectNicheFile(file.relativePath)}
                        className={`p-2.5 rounded-xl border text-left text-xs transition-all cursor-pointer flex flex-col justify-between gap-1.5 ${
                          isSelected
                            ? 'bg-red-50/80 border-[#E60023] ring-1 ring-[#E60023] shadow-xs'
                            : 'bg-white border-gray-200 text-slate-700 hover:border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        <div className="flex items-start gap-2">
                          <span
                            className={`p-1 rounded-md shrink-0 mt-0.5 ${
                              isXlsx
                                ? 'bg-green-100 text-green-700'
                                : isCsv
                                ? 'bg-emerald-100 text-emerald-700'
                                : 'bg-blue-100 text-blue-700'
                            }`}
                          >
                            {isXlsx || isCsv ? (
                              <FileSpreadsheet className="w-3.5 h-3.5" />
                            ) : (
                              <FileText className="w-3.5 h-3.5" />
                            )}
                          </span>

                          <div className="min-w-0 flex-1">
                            <p
                              className={`font-semibold text-xs truncate ${
                                isSelected ? 'text-[#E60023]' : 'text-slate-800'
                              }`}
                              title={file.name}
                            >
                              {file.name}
                            </p>
                            <p className="text-[10px] text-slate-400 truncate font-mono">
                              {file.folderName !== activeSegment ? `📁 ${file.folderName}` : '🏷️ Корень'}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center justify-between text-[10px] text-slate-500 font-mono pt-1 border-t border-gray-100">
                          <span className="font-semibold text-slate-700">
                            {file.lineCount?.toLocaleString() || 0} {isXlsx || isCsv ? 'строк' : 'тегов'}
                          </span>
                          <span>{(file.size / 1024).toFixed(1)} KB</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Active Selected File Viewer & Editor */}
              {selectedFileRelPath && (
                <div className="space-y-3 pt-2 border-t border-gray-200">
                  {/* File Header Bar & Mode Toggle */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-slate-50 p-3 rounded-2xl border border-gray-200">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                        <span>Выбран файл:</span>
                        <span className="font-mono bg-white px-2.5 py-0.5 rounded-lg border border-gray-200 text-[#E60023] font-semibold">
                          {selectedFileRelPath}
                        </span>
                      </span>

                      {selectedFileMeta?.type === 'xlsx' && (
                        <span className="text-[11px] bg-green-100 text-green-800 border border-green-200 px-2 py-0.5 rounded-md font-bold">
                          📗 Excel XLSX
                        </span>
                      )}
                      {selectedFileMeta?.type === 'csv' && (
                        <span className="text-[11px] bg-emerald-100 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded-md font-bold">
                          📊 CSV Таблица
                        </span>
                      )}
                      {selectedFileMeta?.type === 'txt' && (
                        <span className="text-[11px] bg-blue-100 text-blue-800 border border-blue-200 px-2 py-0.5 rounded-md font-bold">
                          📄 Текстовый файл
                        </span>
                      )}

                      <span className="text-xs text-slate-500 font-mono">
                        ({activeTableData.rows.length.toLocaleString()} строк)
                      </span>
                    </div>

                    {/* View Mode Toggle: Table vs Raw Text */}
                    <div className="flex items-center gap-1.5 bg-white p-1 rounded-xl border border-gray-200 shadow-2xs self-start sm:self-auto">
                      <button
                        type="button"
                        onClick={() => setViewMode('table')}
                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                          viewMode === 'table'
                            ? 'bg-[#E60023] text-white shadow-2xs'
                            : 'text-slate-600 hover:text-slate-900 hover:bg-gray-100'
                        }`}
                      >
                        <TableIcon className="w-3.5 h-3.5" />
                        <span>📊 Таблица</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setViewMode('raw')}
                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                          viewMode === 'raw'
                            ? 'bg-[#E60023] text-white shadow-2xs'
                            : 'text-slate-600 hover:text-slate-900 hover:bg-gray-100'
                        }`}
                      >
                        <FileText className="w-3.5 h-3.5" />
                        <span>📝 Сырой текст</span>
                      </button>
                    </div>
                  </div>

                  {/* Multi-sheet Tabs for Excel */}
                  {selectedFileMeta?.type === 'xlsx' &&
                    selectedFileMeta?.sheetNames?.length > 1 && (
                      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
                        <span className="text-xs font-bold text-slate-600 shrink-0 flex items-center gap-1">
                          <Layers className="w-3.5 h-3.5 text-green-600" />
                          <span>Листы книги:</span>
                        </span>
                        {selectedFileMeta.sheetNames.map((sheetName) => {
                          const isSheetActive = (selectedSheet || selectedFileMeta.sheetNames[0]) === sheetName;
                          const sheetRowCount = selectedFileMeta.sheets?.[sheetName]?.rowCount || 0;
                          return (
                            <button
                              key={sheetName}
                              type="button"
                              onClick={() => {
                                setSelectedSheet(sheetName);
                                setPage(1);
                              }}
                              className={`px-3 py-1 rounded-xl text-xs font-semibold transition-all cursor-pointer shrink-0 border flex items-center gap-1.5 ${
                                isSheetActive
                                  ? 'bg-green-700 text-white border-green-700 shadow-2xs'
                                  : 'bg-white text-slate-700 border-gray-200 hover:bg-gray-50'
                              }`}
                            >
                              <span>📄 {sheetName}</span>
                              <span
                                className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                                  isSheetActive ? 'bg-green-800 text-white' : 'bg-gray-100 text-slate-600'
                                }`}
                              >
                                {sheetRowCount.toLocaleString()}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    )}

                  {/* SUB-VIEW 1: Interactive Table View */}
                  {viewMode === 'table' && (
                    <div className="space-y-2 bg-white rounded-2xl border border-gray-200 p-3 shadow-xs">
                      {/* Table Controls Bar */}
                      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-2.5 pb-2 border-b border-gray-100">
                        {/* Live Search inside Table */}
                        <div className="relative flex-1 max-w-md">
                          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                          <input
                            type="text"
                            value={tableSearchQuery}
                            onChange={(e) => {
                              setTableSearchQuery(e.target.value);
                              setPage(1);
                            }}
                            placeholder="🔍 Быстрый поиск по всем колонкам таблицы..."
                            className="w-full text-xs bg-gray-50 border border-gray-200 rounded-xl pl-9 pr-3 py-1.5 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#E60023] focus:bg-white"
                          />
                          {tableSearchQuery && (
                            <button
                              type="button"
                              onClick={() => {
                                setTableSearchQuery('');
                                setPage(1);
                              }}
                              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs"
                            >
                              ✕
                            </button>
                          )}
                        </div>

                        {/* Quick Table Actions */}
                        <div className="flex items-center gap-2 flex-wrap">
                          <button
                            type="button"
                            onClick={handleCopyTagsFromTable}
                            disabled={processedRows.length === 0}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-white hover:bg-gray-100 text-slate-700 border border-gray-200 shadow-2xs transition-colors cursor-pointer"
                            title="Скопировать только ключевые слова/теги построчно"
                          >
                            {tagsCopied ? (
                              <>
                                <Check className="w-3.5 h-3.5 text-emerald-600" />
                                <span className="text-emerald-700">Теги скопированы!</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-3.5 h-3.5 text-[#E60023]" />
                                <span>📋 Скопировать только теги ({processedRows.length})</span>
                              </>
                            )}
                          </button>

                          <button
                            type="button"
                            onClick={handleCopyTableTSV}
                            disabled={processedRows.length === 0}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-white hover:bg-gray-100 text-slate-700 border border-gray-200 shadow-2xs transition-colors cursor-pointer"
                            title="Скопировать видимую таблицу для вставки в Excel / Google Таблицы"
                          >
                            {tableCopied ? (
                              <>
                                <Check className="w-3.5 h-3.5 text-emerald-600" />
                                <span className="text-emerald-700">Таблица скопирована!</span>
                              </>
                            ) : (
                              <>
                                <Clipboard className="w-3.5 h-3.5 text-slate-500" />
                                <span>Скопировать таблицу</span>
                              </>
                            )}
                          </button>

                          <button
                            type="button"
                            onClick={handleDownloadTableCsv}
                            disabled={processedRows.length === 0}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-white hover:bg-gray-100 text-slate-700 border border-gray-200 shadow-2xs transition-colors cursor-pointer"
                            title="Скачать отфильтрованные строки как CSV"
                          >
                            <Download className="w-3.5 h-3.5 text-slate-500" />
                            <span>Скачать CSV</span>
                          </button>

                          {onApply && (
                            <button
                              type="button"
                              onClick={handleApplyTableTags}
                              disabled={processedRows.length === 0}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-[#E60023] hover:bg-[#ad081b] text-white shadow-2xs transition-colors cursor-pointer"
                              title="Применить эти теги прямо в текущий шаг пайплайна"
                            >
                              <Sparkles className="w-3.5 h-3.5" />
                              <span>Применить эти теги ({processedRows.length})</span>
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Interactive Table Container */}
                      {isLoadingFileContent ? (
                        <div className="p-12 text-center text-xs text-slate-500 flex items-center justify-center gap-2">
                          <Loader2 className="w-4 h-4 animate-spin text-[#E60023]" />
                          <span>Загрузка содержимого таблицы...</span>
                        </div>
                      ) : activeTableData.rows.length === 0 ? (
                        <div className="p-8 text-center text-xs text-slate-400">
                          Файл пуст или не содержит строк с данными.
                        </div>
                      ) : (
                        <div
                          className={`overflow-x-auto overflow-y-auto border border-gray-200 rounded-xl bg-white ${
                            isFullscreen ? 'max-h-[calc(100vh-320px)]' : 'max-h-[460px]'
                          }`}
                        >
                          <table className="w-full text-left text-xs border-collapse">
                            <thead className="sticky top-0 bg-slate-100/95 backdrop-blur-xs border-b border-gray-200 z-10 shadow-2xs">
                              <tr>
                                <th className="px-3 py-2.5 text-[11px] font-bold text-slate-500 uppercase tracking-wider w-12 text-center border-r border-gray-200">
                                  #
                                </th>
                                {activeTableData.headers.map((header, colIdx) => {
                                  const isSorted = sortConfig?.colIndex === colIdx;
                                  const isVolumeCol = colIdx === columnIndices.volumeColIdx;

                                  return (
                                    <th
                                      key={colIdx}
                                      onClick={() => handleSort(colIdx)}
                                      className={`px-3.5 py-2.5 text-[11px] font-bold text-slate-700 tracking-wide border-r border-gray-200 last:border-r-0 select-none cursor-pointer transition-colors hover:bg-slate-200/80 ${
                                        isSorted ? 'bg-red-50 text-[#E60023]' : ''
                                      }`}
                                    >
                                      <div className="flex items-center justify-between gap-2">
                                        <span className="truncate">
                                          {isVolumeCol && <span className="mr-1">📈</span>}
                                          {header}
                                        </span>
                                        <span className="text-slate-400 shrink-0">
                                          {isSorted ? (
                                            sortConfig.direction === 'asc' ? (
                                              <ArrowUp className="w-3.5 h-3.5 text-[#E60023]" />
                                            ) : (
                                              <ArrowDown className="w-3.5 h-3.5 text-[#E60023]" />
                                            )
                                          ) : (
                                            <ArrowUpDown className="w-3 h-3 text-slate-300 opacity-60" />
                                          )}
                                        </span>
                                      </div>
                                    </th>
                                  );
                                })}
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 font-mono text-slate-800">
                              {paginatedRows.map((row, rowIdx) => {
                                const absoluteRowIndex = (page - 1) * pageSize + rowIdx + 1;
                                return (
                                  <tr
                                    key={rowIdx}
                                    className="hover:bg-red-50/30 transition-colors group"
                                  >
                                    <td className="px-3 py-2 text-[10px] text-slate-400 text-center border-r border-gray-100 bg-gray-50/50 group-hover:bg-red-50/50">
                                      {absoluteRowIndex}
                                    </td>
                                    {activeTableData.headers.map((_, colIdx) => {
                                      const cellVal = row[colIdx];
                                      const isVolumeCol = colIdx === columnIndices.volumeColIdx;

                                      return (
                                        <td
                                          key={colIdx}
                                          className="px-3.5 py-2 border-r border-gray-100 last:border-r-0 text-xs max-w-xs truncate"
                                          title={cellVal != null ? String(cellVal) : ''}
                                        >
                                          {isVolumeCol ? (
                                            renderVolumeBadge(cellVal)
                                          ) : (
                                            <span className="font-sans text-slate-800">
                                              {cellVal != null && cellVal !== '' ? (
                                                String(cellVal)
                                              ) : (
                                                <span className="text-slate-300">—</span>
                                              )}
                                            </span>
                                          )}
                                        </td>
                                      );
                                    })}
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      )}

                      {/* Pagination Bar */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 text-xs text-slate-600">
                        <div className="flex items-center gap-2">
                          <span>Строк на странице:</span>
                          <select
                            value={pageSize}
                            onChange={(e) => {
                              setPageSize(Number(e.target.value));
                              setPage(1);
                            }}
                            className="bg-gray-50 border border-gray-200 rounded-lg px-2 py-1 text-xs font-semibold text-slate-800 focus:outline-none focus:border-[#E60023]"
                          >
                            <option value={50}>50 строк</option>
                            <option value={100}>100 строк</option>
                            <option value={250}>250 строк</option>
                            <option value={500}>500 строк</option>
                          </select>

                          <span className="text-slate-400 font-mono">
                            Показано {(page - 1) * pageSize + 1}–
                            {Math.min(page * pageSize, processedRows.length)} из{' '}
                            <strong className="text-slate-900 font-bold">
                              {processedRows.length.toLocaleString()}
                            </strong>{' '}
                            {processedRows.length !== activeTableData.rows.length && (
                              <span className="text-slate-400 font-normal">
                                (отфильтровано из {activeTableData.rows.length.toLocaleString()})
                              </span>
                            )}
                          </span>
                        </div>

                        {/* Page Buttons */}
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => setPage(1)}
                            disabled={page <= 1}
                            className="p-1 rounded-lg border border-gray-200 bg-white hover:bg-gray-100 disabled:opacity-40 transition-colors cursor-pointer"
                            title="Первая страница"
                          >
                            <ChevronsLeft className="w-3.5 h-3.5 text-slate-600" />
                          </button>

                          <button
                            type="button"
                            onClick={() => setPage((p) => Math.max(1, p - 1))}
                            disabled={page <= 1}
                            className="p-1 rounded-lg border border-gray-200 bg-white hover:bg-gray-100 disabled:opacity-40 transition-colors cursor-pointer"
                            title="Предыдущая"
                          >
                            <ChevronLeft className="w-3.5 h-3.5 text-slate-600" />
                          </button>

                          <span className="px-2 font-semibold text-slate-800 text-xs">
                            {page} / {totalPages}
                          </span>

                          <button
                            type="button"
                            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                            disabled={page >= totalPages}
                            className="p-1 rounded-lg border border-gray-200 bg-white hover:bg-gray-100 disabled:opacity-40 transition-colors cursor-pointer"
                            title="Следующая"
                          >
                            <ChevronRight className="w-3.5 h-3.5 text-slate-600" />
                          </button>

                          <button
                            type="button"
                            onClick={() => setPage(totalPages)}
                            disabled={page >= totalPages}
                            className="p-1 rounded-lg border border-gray-200 bg-white hover:bg-gray-100 disabled:opacity-40 transition-colors cursor-pointer"
                            title="Последняя страница"
                          >
                            <ChevronsRight className="w-3.5 h-3.5 text-slate-600" />
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* SUB-VIEW 2: Raw Text Editor (Direct File Edit on Disk) */}
                  {viewMode === 'raw' && (
                    <div className="space-y-2 bg-white rounded-2xl border border-gray-200 p-3 shadow-xs">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div className="text-xs text-slate-600 font-semibold">
                          Редактор содержимого: {parsedTags.length} строк
                        </div>

                        {selectedFileMeta?.type !== 'xlsx' ? (
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
                            <span>💾 Сохранить изменения в файл на диск</span>
                          </button>
                        ) : (
                          <div className="text-[11px] text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-lg">
                            ⚠️ Excel (.xlsx) доступен для чтения и экспорта в табличном виде.
                          </div>
                        )}
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
                        readOnly={selectedFileMeta?.type === 'xlsx'}
                        rows={isFullscreen ? 20 : 10}
                        className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl text-xs font-mono text-slate-900 focus:outline-none focus:border-[#E60023] focus:bg-white leading-relaxed resize-y shadow-2xs"
                        placeholder="Содержимое файла..."
                      />
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: Clipboard & Smart Delimiters */}
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
                    <span>
                      Всего строк: <strong className="text-slate-900 font-bold">{parsedTags.length}</strong>
                    </span>
                    <span>
                      (уникальных: <strong className="text-[#E60023] font-bold">{uniqueTagsCount}</strong>)
                    </span>
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
                rows={isFullscreen ? 20 : 12}
                className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl text-xs font-mono text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#E60023] focus:bg-white leading-relaxed resize-y shadow-2xs"
              />
            </div>
          )}

          {/* TAB 3: File Upload */}
          {activeTab === 'file' && (
            <div className="space-y-4">
              <div className="p-8 border-2 border-dashed border-gray-200 rounded-2xl bg-gray-50/60 text-center space-y-3">
                <Upload className="w-8 h-8 text-[#E60023] mx-auto" />
                <div className="space-y-1">
                  <p className="text-xs font-bold text-slate-800">
                    Перетащите сюда или выберите файл <span className="font-mono">.txt</span> или{' '}
                    <span className="font-mono">.csv</span>
                  </p>
                  <p className="text-[11px] text-slate-500">
                    Для CSV система автоматически извлечет таблицу с ключевыми словами и объемом поиска.
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
                  <FileSpreadsheet className="w-3.5 h-3.5" />
                  <span>Выбрать файл с диска</span>
                </label>

                {uploadedFileName && (
                  <p className="text-xs text-emerald-700 font-semibold flex items-center justify-center gap-1.5 pt-2">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Загружен: {uploadedFileName} ({parsedTags.length} строк)</span>
                  </p>
                )}
              </div>

              {parsedTags.length > 0 && (
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
                    <span>Предпросмотр загруженных данных:</span>
                    <span className="font-mono">{parsedTags.length} строк</span>
                  </div>
                  <pre className="p-3 bg-gray-50 border border-gray-200 rounded-xl text-xs font-mono text-slate-800 max-h-56 overflow-y-auto leading-relaxed">
                    {text}
                  </pre>
                </div>
              )}
            </div>
          )}

          {/* TAB 4: Export with customizable delimiter */}
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
                  <pre className="p-3 bg-gray-50 border border-gray-200 rounded-xl text-xs font-mono text-slate-800 max-h-56 overflow-y-auto leading-relaxed">
                    {formattedExportText}
                  </pre>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-5 sm:px-6 py-3.5 border-t border-gray-100 bg-gray-50/80">
          <div className="text-xs text-slate-500 font-mono">
            Строк в буфере: <strong className="text-slate-900 font-bold">{parsedTags.length}</strong>
            {selectedFileMeta && (
              <span className="ml-2 text-slate-400">
                | Файл: <span className="text-slate-700 font-semibold">{selectedFileMeta.name}</span>
              </span>
            )}
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
