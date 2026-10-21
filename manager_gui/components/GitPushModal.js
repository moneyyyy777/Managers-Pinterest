'use client';

import React, { useState, useEffect } from 'react';
import { Loader2, X, Send, CheckCircle2, AlertCircle } from 'lucide-react';

export default function GitPushModal({ isOpen, onClose }) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [commitMessage, setCommitMessage] = useState('');

  const executePush = async () => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch('/api/git/push', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message: commitMessage.trim() }),
      });

      const data = await response.json();
      setResult(data);
    } catch (err) {
      setError(err.message || 'Ошибка при вызове /api/git/push');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isOpen) {
      setResult(null);
      setError(null);
      setLoading(false);
      setCommitMessage('');
    }
  }, [isOpen]);

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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-slate-900 flex items-center justify-center shadow-xs text-white text-base">
              🚀
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Синхронизация и пуш на GitHub
              </h3>
              <p className="text-xs text-slate-500">
                Отправка изменений сразу в <span className="font-semibold text-slate-700">Artify Studio</span> и <span className="font-semibold text-slate-700">Managers Pinterest</span>
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-4 text-sm">
          {!result && !loading && (
            <div className="space-y-3">
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                Комментарий к коммиту (необязательно)
              </label>
              <input
                type="text"
                placeholder="Например: Обновил карточки товаров и ключевые слова"
                value={commitMessage}
                onChange={(e) => setCommitMessage(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 transition-all"
              />
              <p className="text-xs text-slate-500">
                💡 Если оставить поле пустым, будет сгенерировано авто-описание с текущей датой и временем.
              </p>
            </div>
          )}

          {loading && (
            <div className="flex flex-col items-center justify-center py-10 space-y-3">
              <Loader2 className="w-8 h-8 animate-spin text-[#E60023]" />
              <p className="text-sm font-medium text-slate-700">
                Синхронизируем и отправляем изменения в оба репозитория...
              </p>
              <p className="text-xs text-slate-400">
                Это может занять несколько секунд
              </p>
            </div>
          )}

          {error && (
            <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5 text-red-600" />
              <div className="text-xs space-y-1">
                <div className="font-bold">Ошибка при отправке:</div>
                <div className="font-mono whitespace-pre-wrap">{error}</div>
              </div>
            </div>
          )}

          {result && (
            <div className="space-y-3">
              <div className={`p-4 rounded-xl border flex items-start gap-3 ${
                result.success 
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-800' 
                  : 'bg-amber-50 border-amber-200 text-amber-900'
              }`}>
                {result.success ? (
                  <CheckCircle2 className="w-5 h-5 flex-shrink-0 mt-0.5 text-emerald-600" />
                ) : (
                  <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5 text-amber-600" />
                )}
                <div className="text-xs space-y-1">
                  <div className="font-bold">
                    {result.success ? 'Успешно отправлено!' : 'Внимание при отправке'}
                  </div>
                  <div className="text-[11px] opacity-80">
                    {new Date(result.timestamp).toLocaleTimeString()}
                  </div>
                </div>
              </div>

              <div className="rounded-xl bg-slate-950 p-4 text-slate-200 font-mono text-xs overflow-x-auto whitespace-pre-wrap max-h-60">
                {result.output || 'Нет вывода'}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
          >
            Закрыть
          </button>

          {!loading && !result && (
            <button
              type="button"
              onClick={executePush}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg shadow-sm transition-all active:scale-95 cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Запушить в 2 репозитория</span>
            </button>
          )}

          {result && (
            <button
              type="button"
              onClick={() => { setResult(null); }}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-300 rounded-lg shadow-2xs transition-all cursor-pointer"
            >
              <span>Повторить отправку</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
