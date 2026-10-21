'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { ExternalLink, Loader2 } from 'lucide-react';

export default function Header({ onOpenGitPull, onOpenGitPush }) {
  const [servicesStatus, setServicesStatus] = useState({
    admin: { running: false, port: 3333, url: 'http://localhost:3333' },
    browser: { running: false, port: 9222, url: 'https://aistudio.google.com' }
  });
  const [startingService, setStartingService] = useState(null);

  const checkServicesStatus = useCallback(async () => {
    try {
      const res = await fetch('/api/services/status');
      if (res.ok) {
        const data = await res.json();
        setServicesStatus((prev) => ({
          admin: data.admin || prev.admin,
          browser: data.browser || prev.browser
        }));
      }
    } catch (err) {
      // Ignore background fetch error
    }
  }, []);

  useEffect(() => {
    checkServicesStatus();
    const interval = setInterval(checkServicesStatus, 10000);
    return () => clearInterval(interval);
  }, [checkServicesStatus]);

  const handleStartService = async (serviceName) => {
    if (startingService) return;
    try {
      setStartingService(serviceName);
      const res = await fetch('/api/services/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ service: serviceName })
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        console.error('Failed to start service:', data.error);
      }
      setTimeout(checkServicesStatus, 1500);
      setTimeout(checkServicesStatus, 3500);
    } catch (err) {
      console.error('Error starting service:', err);
    } finally {
      setTimeout(() => setStartingService(null), 2500);
    }
  };

  const adminOnline = Boolean(servicesStatus.admin?.running);
  const browserOnline = Boolean(servicesStatus.browser?.running);

  return (
    <header className="bg-white/95 backdrop-blur border-b border-slate-200 text-slate-900 px-6 py-3 flex flex-wrap items-center justify-between gap-4 sticky top-0 z-40 shadow-xs">
      {/* Left section: Official Pinterest Logo + Brand Title + Version + Tailscale Badge */}
      <div className="flex items-center gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          {/* Official Round Pinterest SVG Icon */}
          <svg className="w-8 h-8 flex-shrink-0 drop-shadow-sm" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="12" cy="12" r="12" fill="#E60023"/>
            <path d="M12.5 4C8.08 4 4.5 7.58 4.5 12C4.5 15.39 6.61 18.29 9.58 19.44C9.51 18.8 9.45 17.82 9.61 17.15C9.76 16.51 10.59 12.98 10.59 12.98C10.59 12.98 10.33 12.47 10.33 11.71C10.33 10.52 11.02 9.63 11.88 9.63C12.61 9.63 12.97 10.18 12.97 10.84C12.97 11.58 12.5 12.68 12.26 13.7C12.06 14.56 12.69 15.26 13.54 15.26C15.07 15.26 16.25 13.65 16.25 11.33C16.25 9.28 14.78 7.84 12.7 7.84C10.29 7.84 8.88 9.65 8.88 11.7C8.88 12.43 9.16 13.21 9.51 13.63C9.58 13.71 9.59 13.78 9.57 13.86C9.5 14.15 9.35 14.76 9.32 14.89C9.28 15.06 9.16 15.11 8.99 15.03C7.88 14.51 7.18 12.9 7.18 11.64C7.18 8.87 9.2 6.36 13 6.36C16.05 6.36 18.42 8.54 18.42 11.41C18.42 14.44 16.51 16.89 13.86 16.89C12.97 16.89 12.13 16.43 11.84 15.88L11.29 17.98C11.09 18.75 10.55 19.71 10.16 20.34C10.91 20.57 11.7 20.7 12.5 20.7C17.3 20.7 21.19 16.81 21.19 12.01C21.19 7.21 17.3 4 12.5 4Z" fill="white"/>
          </svg>

          <div className="flex items-center gap-2">
            <h1 className="text-base font-bold tracking-tight text-slate-900">
              Pinterest Manager Studio
            </h1>
            <span className="px-2 py-0.5 text-[11px] font-semibold font-mono rounded-full bg-red-50 text-[#E60023] border border-red-200">
              v2.0
            </span>
          </div>
        </div>

        {/* Tailscale Ready badge */}
        <div className="flex items-center gap-2 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
          </span>
          <span>Tailscale Ready (3001)</span>
        </div>
      </div>

      {/* Right section: Service Buttons + External Tools + Git Pull Button */}
      <div className="flex items-center gap-2.5 sm:gap-3 flex-wrap">
        {/* Service Button 1: Artify Admin (Port 3333) */}
        {adminOnline ? (
          <a
            href="http://localhost:3333"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 transition-colors shadow-2xs"
            title="Админка запущена на http://localhost:3333"
          >
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>🟢 Админка (3333)</span>
            <ExternalLink className="w-3 h-3 text-emerald-600" />
          </a>
        ) : (
          <button
            type="button"
            onClick={() => handleStartService('admin')}
            disabled={startingService === 'admin'}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-300 transition-all active:scale-95 disabled:opacity-60 cursor-pointer"
            title="Запустить сервер админки (порт 3333)"
          >
            {startingService === 'admin' ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin text-[#E60023]" />
            ) : (
              <span>▶️</span>
            )}
            <span>Запустить админку</span>
          </button>
        )}

        {/* Service Button 2: AI Studio Chromium (Port 9222) */}
        {browserOnline ? (
          <a
            href="https://aistudio.google.com"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 transition-colors shadow-2xs"
            title="Chromium для AI Studio запущен на порту 9222"
          >
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>🟢 AI Studio (9222)</span>
            <ExternalLink className="w-3 h-3 text-emerald-600" />
          </a>
        ) : (
          <button
            type="button"
            onClick={() => handleStartService('browser')}
            disabled={startingService === 'browser'}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-300 transition-all active:scale-95 disabled:opacity-60 cursor-pointer"
            title="Запустить Chrome с портом 9222 для AI Studio"
          >
            {startingService === 'browser' ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin text-[#E60023]" />
            ) : (
              <span>🌐</span>
            )}
            <span>AI Studio (9222)</span>
          </button>
        )}

        {/* Quick Links: ChatGPT, DeepSeek */}
        <div className="hidden md:flex items-center gap-1 border-l border-slate-200 pl-2">
          <a
            href="https://chatgpt.com"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
          >
            <span>ChatGPT</span>
            <ExternalLink className="w-3 h-3 text-slate-400" />
          </a>

          <a
            href="https://chat.deepseek.com"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
          >
            <span>DeepSeek</span>
            <ExternalLink className="w-3 h-3 text-slate-400" />
          </a>
        </div>

        {/* Button 3: Обновить код (Git Pull) */}
        <button
          type="button"
          onClick={onOpenGitPull}
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-lg shadow-2xs transition-all active:scale-95 cursor-pointer ml-1"
          title="Подтянуть обновления из репозиториев"
        >
          <span>🔄</span>
          <span>Обновить (Pull)</span>
        </button>

        {/* Button 4: Запушить всё (Git Push) */}
        <button
          type="button"
          onClick={onOpenGitPush}
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-[#E60023] hover:bg-[#ad081b] rounded-lg shadow-sm transition-all active:scale-95 cursor-pointer"
          title="Запушить изменения сразу в 2 репозитория (Artify Studio + Managers Pinterest)"
        >
          <span>🚀</span>
          <span>Запушить всё (Push)</span>
        </button>
      </div>
    </header>
  );
}
