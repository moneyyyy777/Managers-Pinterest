'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Loader2, X, RefreshCw, CheckCircle2, AlertCircle } from 'lucide-react';

export default function GitPullModal({ isOpen, onClose }) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const executePull = useCallback(async () => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch('/api/git/pull', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();
      if (!response.ok && !data.results) {
        throw new Error(data.error || `Ошибка сервера: ${response.status}`);
      }
      setResult(data);
    } catch (err) {
      setError(err.message || 'Ошибка при вызове /api/git/pull');
    } finally {
      setLoading(false);
    }
  }, []);

  // Run pull automatically when modal opens
  useEffect(() => {
    if (isOpen) {
      executePull();
    } else {
      setResult(null);
      setError(null);
      setLoading(false);
    }
  }, [isOpen, executePull]);

  // Handle ESC key press
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose?.();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const isSuccess = Boolean(result?.success && !error);
  const isError = Boolean(error || (result && !result.success));

  // Build terminal output string containing stdout/stderr/message
  let terminalText = '';
  if (error) {
    terminalText = `Ошибка: ${error}`;
  } else if (result) {
    if (result.results && Array.isArray(result.results)) {
      terminalText = result.results
        .map((r) => {
          const lines = [
            `==> [${r.success ? 'OK' : 'ERROR'}] ${r.name} (${r.dir})`,
          ];
          if (r.output) lines.push(r.output);
          if (r.error) lines.push(`STDERR: ${r.error}`);
          return lines.join('\n');
        })
        .join('\n\n----------------------------------------\n\n');
    } else if (result.message) {
      terminalText = result.message;
    } else {
      terminalText = JSON.stringify(result, null, 2);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-150"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="relative w-full max-w-2xl bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800 bg-zinc-900/95">
          <div className="flex items-center gap-3">
            <h3 className="text-base font-semibold text-zinc-100">
              Синхронизация кода (Git Pull)
            </h3>
            {!loading && isSuccess && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Успешно
              </span>
            )}
            {!loading && isError && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-rose-500/10 text-rose-400 border border-rose-500/20">
                <AlertCircle className="w-3.5 h-3.5" />
                Ошибка
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition-colors"
            title="Закрыть (ESC)"
            aria-label="Закрыть"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1">
          {loading ? (
            <div className="py-12 flex flex-col items-center justify-center space-y-3 text-center">
              <Loader2 className="w-8 h-8 animate-spin text-rose-500" />
              <p className="text-sm font-medium text-zinc-300">
                Выполняется git pull...
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs text-zinc-400">
                <span>Терминал вывода:</span>
                {result?.timestamp && (
                  <span className="font-mono text-[11px] text-zinc-500">
                    {new Date(result.timestamp).toLocaleTimeString()}
                  </span>
                )}
              </div>
              <pre className="p-4 bg-zinc-950 text-zinc-300 font-mono text-xs rounded-lg overflow-x-auto border border-zinc-800 max-h-60 whitespace-pre-wrap select-text">
                {terminalText || 'Нет вывода'}
              </pre>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-zinc-800 bg-zinc-900/90">
          <button
            type="button"
            onClick={executePull}
            disabled={loading}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-medium text-zinc-200 bg-zinc-800 hover:bg-zinc-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg border border-zinc-700 transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Обновить снова
          </button>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 text-xs font-medium text-white bg-zinc-700 hover:bg-zinc-600 rounded-lg transition-colors"
          >
            Закрыть
          </button>
        </div>
      </div>
    </div>
  );
}
