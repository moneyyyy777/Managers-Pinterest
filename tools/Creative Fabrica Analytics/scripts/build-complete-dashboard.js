import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');

const DATA_JSON_PATH = path.join(ROOT_DIR, 'data', 'reports', 'analytics-daily.json');
const DATA_JS_PATH = path.join(ROOT_DIR, 'data', 'reports', 'analytics-daily.js');
const APP_JS_PATH = path.join(ROOT_DIR, 'scripts', 'dashboard-app.js');

const rawData = fs.readFileSync(DATA_JSON_PATH, 'utf-8');
const appJsCode = fs.readFileSync(APP_JS_PATH, 'utf-8');

// Ensure analytics-daily.js is up to date
fs.writeFileSync(DATA_JS_PATH, `window.CREATIVE_FABRICA_DATA = ${rawData};\n`, 'utf-8');

function generateHtml(isSubfolder) {
  const relPrefix = isSubfolder ? '../' : './';
  
  return `<!DOCTYPE html>
<html lang="ru" class="dark">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Creative Fabrica Analytics • Managers Pinterest</title>
  
  <!-- Tailwind CSS CDN with Linear Palette config -->
  <script src="https://cdn.tailwindcss.com"></script>
  <script>
    tailwind.config = {
      darkMode: 'class',
      theme: {
        extend: {
          colors: {
            linear: {
              bg: '#08090c',
              card: '#0f1117',
              border: 'rgba(255, 255, 255, 0.08)',
              borderHover: 'rgba(255, 255, 255, 0.16)',
              purple: '#5e6ad2',
              purpleHover: '#6875e5',
            },
            cf: {
              blue: '#0284c7',
              emerald: '#10b981',
              rose: '#f43f5e',
              amber: '#f59e0b',
            }
          },
          fontFamily: {
            sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
            mono: ['JetBrains Mono', 'SFMono-Regular', 'Consolas', 'monospace'],
          }
        }
      }
    }
  </script>

  <!-- Google Fonts: Inter & JetBrains Mono -->
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap" rel="stylesheet">

  <!-- Chart.js CDN -->
  <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>

  <!-- External Data Script (no CORS block on file://) -->
  <script src="${relPrefix}data/reports/analytics-daily.js"></script>

  <!-- Inlined Embedded Data Fallback (Guarantees double-click file:// always works) -->
  <script id="cf-raw-data" type="application/json">
${rawData}
  </script>

  <!-- Dashboard Application Logic -->
  <script>
${appJsCode}
  </script>

  <!-- Alpine.js CDN -->
  <script defer src="https://cdn.jsdelivr.net/npm/alpinejs@3.x.x/dist/cdn.min.js"></script>

  <style>
    body {
      font-family: 'Inter', -apple-system, sans-serif;
    }
    .num {
      font-family: 'JetBrains Mono', monospace;
      font-variant-numeric: tabular-nums;
    }
    /* Subtle Linear-styled custom scrollbar */
    ::-webkit-scrollbar {
      width: 6px;
      height: 6px;
    }
    ::-webkit-scrollbar-track {
      background: transparent;
    }
    ::-webkit-scrollbar-thumb {
      background: rgba(255, 255, 255, 0.12);
      border-radius: 9999px;
    }
    ::-webkit-scrollbar-thumb:hover {
      background: rgba(255, 255, 255, 0.25);
    }
  </style>
</head>
<body 
  class="min-h-screen transition-colors duration-200 antialiased selection:bg-rose-500 selection:text-white"
  :class="isDark ? 'bg-[#08090c] text-neutral-200' : 'bg-slate-50 text-slate-800'"
  x-data="dashboardApp()" 
  x-init="initDashboard()"
>

  <!-- Linear-style Navigation Bar -->
  <header class="border-b sticky top-0 z-40 transition-colors backdrop-blur-md"
          :class="isDark ? 'bg-[#08090c]/80 border-white/[0.08]' : 'bg-white/80 border-slate-200'">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
      
      <!-- Brand & Project Lead Tag -->
      <div class="flex items-center space-x-3">
        <div class="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 via-rose-500 to-amber-500 flex items-center justify-center shadow-sm">
          <svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"></path>
          </svg>
        </div>
        <div class="flex items-center space-x-2">
          <span class="text-sm font-semibold tracking-tight" :class="isDark ? 'text-white' : 'text-slate-900'">
            Creative Fabrica Analytics
          </span>
          <span class="text-[11px] px-2 py-0.5 rounded-full border font-medium"
                :class="isDark ? 'bg-white/[0.04] text-neutral-400 border-white/[0.08]' : 'bg-slate-100 text-slate-600 border-slate-200'">
            Managers Pinterest
          </span>
        </div>
      </div>

      <!-- Action Items & Controls -->
      <div class="flex items-center space-x-2 sm:space-x-3 text-xs">
        
        <!-- Live Dataset Badge -->
        <div class="hidden md:flex items-center space-x-2 px-2.5 py-1 rounded-md border text-[11px]"
             :class="isDark ? 'bg-white/[0.02] border-white/[0.08] text-neutral-400' : 'bg-white border-slate-200 text-slate-600'">
          <span class="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
          <span>База:</span>
          <span class="num font-semibold" :class="isDark ? 'text-white' : 'text-slate-900'" x-text="records.length + ' дней'"></span>
        </div>

        <!-- Export CSV Button -->
        <button 
          @click="exportCSV()" 
          title="Экспортировать текущую выборку в CSV"
          class="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-md border font-medium transition shadow-sm"
          :class="isDark ? 'bg-white/[0.04] hover:bg-white/[0.08] text-neutral-300 border-white/[0.08]' : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200'">
          <svg class="w-3.5 h-3.5 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
          </svg>
          <span class="hidden sm:inline">CSV</span>
        </button>

        <!-- Reload Data Button -->
        <button 
          @click="reloadData()" 
          title="Синхронизировать данные"
          class="p-1.5 rounded-md border transition"
          :class="isDark ? 'bg-white/[0.04] hover:bg-white/[0.08] text-neutral-300 border-white/[0.08]' : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200'">
          <svg class="w-3.5 h-3.5" :class="{'animate-spin': isRefreshing}" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
          </svg>
        </button>

        <!-- Dark / Light Theme Switcher -->
        <button 
          @click="toggleTheme()" 
          title="Переключить тему (Dark / Light)"
          class="p-1.5 rounded-md border transition"
          :class="isDark ? 'bg-white/[0.04] hover:bg-white/[0.08] text-neutral-300 border-white/[0.08]' : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200'">
          <template x-if="isDark">
            <svg class="w-3.5 h-3.5 text-amber-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"></path></svg>
          </template>
          <template x-if="!isDark">
            <svg class="w-3.5 h-3.5 text-slate-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"></path></svg>
          </template>
        </button>

      </div>

    </div>
  </header>

  <!-- Main Workspace -->
  <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">

    <!-- Loss Banner Notification -->
    <template x-if="kpis.missingReferrals > 0">
      <div class="rounded-xl border p-4 transition shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
           :class="isDark ? 'bg-rose-950/20 border-rose-500/30 text-rose-200' : 'bg-rose-50 border-rose-200 text-rose-900'">
        <div class="flex items-center space-x-3">
          <div class="w-9 h-9 rounded-lg bg-rose-500/20 text-rose-400 border border-rose-500/30 flex items-center justify-center shrink-0">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
            </svg>
          </div>
          <div>
            <div class="flex items-center gap-2">
              <h3 class="text-sm font-semibold">Обнаружены расхождения при сверке</h3>
              <span class="px-2 py-0.5 rounded-full text-[11px] font-bold bg-rose-500 text-white num" x-text="kpis.missingReferrals + ' потерь'"></span>
            </div>
            <p class="text-xs opacity-90 mt-0.5">
              Синие галочки превышают рефералов $0.00 на <strong class="num font-bold" x-text="kpis.missingReferrals"></strong> шт. в <strong class="num font-bold" x-text="kpis.lossDays"></strong> днях периода.
            </p>
          </div>
        </div>
        <button 
          @click="onlyLosses = !onlyLosses" 
          class="whitespace-nowrap px-3 py-1.5 rounded-lg text-xs font-semibold shadow transition"
          :class="onlyLosses ? 'bg-white text-slate-900 font-bold' : 'bg-rose-600 hover:bg-rose-500 text-white'">
          <span x-text="onlyLosses ? 'Сбросить фильтр потерь' : 'Изолировать дни с потерями →'"></span>
        </button>
      </div>
    </template>

    <!-- UPPER 5 KPI CARDS (Linear Style) -->
    <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
      
      <!-- 1. Всего визитов -->
      <div class="rounded-xl p-4 border transition flex flex-col justify-between"
           :class="isDark ? 'bg-[#0f1117] border-white/[0.08]' : 'bg-white border-slate-200 shadow-sm'">
        <div class="flex items-center justify-between text-xs font-medium"
             :class="isDark ? 'text-neutral-400' : 'text-slate-500'">
          <span>Всего визитов</span>
          <svg class="w-4 h-4 opacity-70" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path></svg>
        </div>
        <div class="mt-3">
          <div class="text-2xl font-bold num tracking-tight" :class="isDark ? 'text-white' : 'text-slate-900'" x-text="formatNumber(kpis.totalVisits)"></div>
          <div class="text-[11px] mt-1" :class="isDark ? 'text-neutral-500' : 'text-slate-400'">
            Дней в выборке: <span class="num font-semibold" :class="isDark ? 'text-neutral-300' : 'text-slate-700'" x-text="kpis.daysCount"></span>
          </div>
        </div>
      </div>

      <!-- 2. Триалы ($0.00 / синие галочки) -->
      <div class="rounded-xl p-4 border transition flex flex-col justify-between"
           :class="isDark ? 'bg-[#0f1117] border-white/[0.08]' : 'bg-white border-slate-200 shadow-sm'">
        <div class="flex items-center justify-between text-xs font-medium text-cf-blue">
          <span>Триалы / Галочки</span>
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
        </div>
        <div class="mt-3">
          <div class="text-2xl font-bold num tracking-tight text-cf-blue flex items-baseline gap-1.5">
            <span x-text="formatNumber(kpis.referralsZero)"></span>
            <span class="text-xs text-neutral-400 font-normal">/</span>
            <span class="text-sm font-semibold" :class="isDark ? 'text-neutral-300' : 'text-slate-600'" x-text="formatNumber(kpis.blueCheckmarks) + ' гал.'"></span>
          </div>
          <div class="text-[11px] mt-1" :class="isDark ? 'text-neutral-500' : 'text-slate-400'">
            CR: <span class="num font-semibold text-cf-blue" x-text="kpis.cr + '%'"></span>
          </div>
        </div>
      </div>

      <!-- 3. Продления ($9.40+) -->
      <div class="rounded-xl p-4 border transition flex flex-col justify-between"
           :class="isDark ? 'bg-[#0f1117] border-white/[0.08]' : 'bg-white border-slate-200 shadow-sm'">
        <div class="flex items-center justify-between text-xs font-medium text-cf-amber">
          <span>Продления ($9.40+)</span>
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path></svg>
        </div>
        <div class="mt-3">
          <div class="text-2xl font-bold num tracking-tight text-cf-amber" x-text="formatNumber(kpis.renewalsCount)"></div>
          <div class="text-[11px] mt-1" :class="isDark ? 'text-neutral-500' : 'text-slate-400'">
            Повторные подписки
          </div>
        </div>
      </div>

      <!-- 4. Заработок ($) -->
      <div class="rounded-xl p-4 border transition flex flex-col justify-between"
           :class="isDark ? 'bg-[#0f1117] border-white/[0.08]' : 'bg-white border-slate-200 shadow-sm'">
        <div class="flex items-center justify-between text-xs font-medium text-cf-emerald">
          <span>Заработок ($)</span>
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
        </div>
        <div class="mt-3">
          <div class="text-2xl font-bold num tracking-tight text-cf-emerald" x-text="'$' + formatCurrency(kpis.dailyEarnings)"></div>
          <div class="text-[11px] mt-1" :class="isDark ? 'text-neutral-500' : 'text-slate-400'">
            EPC: <span class="num text-cf-emerald font-semibold" x-text="'$' + (kpis.totalVisits > 0 ? (kpis.dailyEarnings / kpis.totalVisits).toFixed(3) : '0.000')"></span>
          </div>
        </div>
      </div>

      <!-- 5. Общие потери -->
      <div class="rounded-xl p-4 border transition flex flex-col justify-between"
           :class="kpis.missingReferrals > 0 
              ? (isDark ? 'bg-rose-950/20 border-rose-500/40' : 'bg-rose-50/80 border-rose-300 shadow-sm') 
              : (isDark ? 'bg-[#0f1117] border-white/[0.08]' : 'bg-white border-slate-200 shadow-sm')">
        <div class="flex items-center justify-between text-xs font-medium"
             :class="kpis.missingReferrals > 0 ? 'text-rose-400' : (isDark ? 'text-neutral-400' : 'text-slate-500')">
          <span>Общие потери</span>
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
        </div>
        <div class="mt-3">
          <div class="text-2xl font-bold num tracking-tight flex items-baseline gap-2"
               :class="kpis.missingReferrals > 0 ? 'text-rose-400' : (isDark ? 'text-neutral-400' : 'text-slate-500')">
            <span x-text="formatNumber(kpis.missingReferrals)"></span>
            <span x-show="kpis.missingReferrals > 0" class="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-300">
              ⚠️ Не зачтено
            </span>
          </div>
          <div class="text-[11px] mt-1" :class="isDark ? 'text-neutral-500' : 'text-slate-400'">
            Дней с потерями: <span class="num font-semibold text-rose-400" x-text="kpis.lossDays"></span>
          </div>
        </div>
      </div>

    </div>

    <!-- FILTER BAR & MONTH SELECTOR (2024 - 2026) -->
    <div class="rounded-xl p-5 border transition space-y-4"
         :class="isDark ? 'bg-[#0f1117] border-white/[0.08]' : 'bg-white border-slate-200 shadow-sm'">
      
      <!-- Upper Controls: Year tabs + Loss filter toggle + Search -->
      <div class="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        
        <!-- Year Switcher Tabs -->
        <div class="flex items-center space-x-1 p-1 rounded-lg border text-xs"
             :class="isDark ? 'bg-black/40 border-white/[0.08]' : 'bg-slate-100 border-slate-200'">
          <span class="px-2 text-[11px] font-medium hidden sm:inline" :class="isDark ? 'text-neutral-400' : 'text-slate-500'">Год:</span>
          
          <template x-for="year in availableYears" :key="year">
            <button 
              @click="setYear(year)" 
              :class="selectedYear === year 
                ? (isDark ? 'bg-white text-slate-900 font-bold shadow-sm' : 'bg-slate-900 text-white font-bold shadow-sm') 
                : (isDark ? 'text-neutral-400 hover:text-white hover:bg-white/[0.04]' : 'text-slate-600 hover:text-slate-900 hover:bg-white')"
              class="px-3 py-1.5 rounded-md transition num flex items-center space-x-1">
              <span x-text="year"></span>
              <span x-show="year === '2026'" class="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block ml-0.5"></span>
            </button>
          </template>

          <button 
            @click="setYear('all')" 
            :class="selectedYear === 'all' 
              ? (isDark ? 'bg-white text-slate-900 font-bold shadow-sm' : 'bg-slate-900 text-white font-bold shadow-sm') 
              : (isDark ? 'text-neutral-400 hover:text-white hover:bg-white/[0.04]' : 'text-slate-600 hover:text-slate-900 hover:bg-white')"
            class="px-3 py-1.5 rounded-md transition text-xs font-medium">
            Все годы
          </button>
        </div>

        <!-- Middle: Filter Only Losses Toggle -->
        <div class="flex items-center space-x-2">
          <button 
            @click="onlyLosses = !onlyLosses" 
            :class="onlyLosses 
              ? 'bg-rose-600 text-white border-rose-500 shadow-sm' 
              : (isDark ? 'bg-white/[0.03] text-neutral-300 border-white/[0.08] hover:bg-white/[0.06]' : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100')"
            class="px-3.5 py-1.5 rounded-lg text-xs font-medium border transition flex items-center space-x-2">
            <span>⚠️ Только дни с потерями</span>
            <span class="px-1.5 py-0.2 rounded-full text-[10px] num font-bold"
                  :class="onlyLosses ? 'bg-white/20 text-white' : 'bg-rose-500/20 text-rose-400'"
                  x-text="kpis.lossDays"></span>
          </button>
        </div>

        <!-- Right: Live Date Search Input -->
        <div class="relative min-w-[220px]">
          <input 
            type="text" 
            x-model="searchQuery" 
            placeholder="Поиск даты (напр. 2026-11-05)..."
            class="w-full rounded-lg px-3 py-1.5 pl-8 text-xs transition border focus:outline-none focus:ring-1 num"
            :class="isDark 
              ? 'bg-black/40 border-white/[0.08] text-white placeholder-neutral-500 focus:border-linear-purple focus:ring-linear-purple' 
              : 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400 focus:border-indigo-500 focus:ring-indigo-500'"
          >
          <svg class="w-3.5 h-3.5 text-neutral-400 absolute left-2.5 top-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
          </svg>
          <button x-show="searchQuery" @click="searchQuery = ''" class="absolute right-2.5 top-2 text-neutral-400 hover:text-white">
            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
          </button>
        </div>

      </div>

      <!-- Month Selector Pills -->
      <div class="pt-3 border-t" :class="isDark ? 'border-white/[0.06]' : 'border-slate-100'">
        <div class="flex items-center justify-between mb-2">
          <span class="text-xs font-medium uppercase tracking-wider" :class="isDark ? 'text-neutral-400' : 'text-slate-500'">
            Период: <span class="font-bold text-cf-blue" x-text="selectedPeriodTitle"></span>
          </span>
          <button 
            @click="resetMonthToAll()" 
            :class="selectedMonth === 'all' ? 'text-cf-blue font-bold' : 'text-neutral-500 hover:text-neutral-300'"
            class="text-xs transition">
            Показать весь <span x-text="selectedYear"></span> год
          </button>
        </div>

        <div class="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-12 gap-1.5">
          <template x-for="m in availableMonths" :key="m.id">
            <button 
              @click="setMonth(m.id)" 
              :disabled="!m.hasData"
              :class="selectedMonth === m.id 
                ? 'bg-cf-blue text-white font-bold ring-2 ring-cf-blue ring-offset-2 ' + (isDark ? 'ring-offset-[#08090c]' : 'ring-offset-white')
                : (m.hasData 
                    ? (isDark ? 'bg-white/[0.03] hover:bg-white/[0.07] text-neutral-300 border-white/[0.06]' : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200')
                    : (isDark ? 'bg-white/[0.01] text-neutral-600 border-transparent cursor-not-allowed opacity-40' : 'bg-slate-100/50 text-slate-300 border-transparent cursor-not-allowed opacity-50'))"
              class="px-2 py-2 rounded-lg border text-center transition flex flex-col items-center justify-center relative overflow-hidden group">
              <span class="text-xs font-semibold" x-text="m.shortName"></span>
              <span class="text-[10px] num opacity-70" x-text="m.hasData ? m.visits + ' кл.' : '—'"></span>
              <!-- Red indicator dot for losses -->
              <span x-show="m.losses > 0" class="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-rose-500"></span>
            </button>
          </template>
        </div>
      </div>

    </div>

    <!-- LINE CHART: DYNAMICS OF CLICKS & CONVERSIONS -->
    <div class="rounded-xl p-5 border transition"
         :class="isDark ? 'bg-[#0f1117] border-white/[0.08]' : 'bg-white border-slate-200 shadow-sm'">
      
      <div class="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b gap-3"
           :class="isDark ? 'border-white/[0.06]' : 'border-slate-100'">
        <div>
          <h2 class="text-sm font-bold tracking-tight flex items-center gap-2" :class="isDark ? 'text-white' : 'text-slate-900'">
            <span>📈 Динамика переходов и конверсий</span>
            <span class="text-xs font-normal px-2 py-0.5 rounded num"
                  :class="isDark ? 'bg-white/[0.04] text-neutral-400' : 'bg-slate-100 text-slate-600'" 
                  x-text="selectedPeriodTitle"></span>
          </h2>
          <p class="text-xs mt-0.5" :class="isDark ? 'text-neutral-400' : 'text-slate-500'">
            Визиты (серая линия, левая ось) vs Конверсии, Триалы $0.00 и Доплаты (правая ось)
          </p>
        </div>

        <!-- Custom Legend Pills -->
        <div class="flex flex-wrap items-center gap-2 text-xs">
          <span class="inline-flex items-center gap-1.5 px-2 py-0.5 rounded border"
                :class="isDark ? 'bg-white/[0.02] border-white/[0.08] text-neutral-400' : 'bg-slate-50 border-slate-200 text-slate-600'">
            <span class="w-2 h-2 rounded-full bg-slate-400"></span> Клики
          </span>
          <span class="inline-flex items-center gap-1.5 px-2 py-0.5 rounded border"
                :class="isDark ? 'bg-white/[0.02] border-white/[0.08] text-cf-blue' : 'bg-slate-50 border-slate-200 text-cf-blue'">
            <span class="w-2 h-2 rounded-full bg-cf-blue"></span> Галочки
          </span>
          <span class="inline-flex items-center gap-1.5 px-2 py-0.5 rounded border"
                :class="isDark ? 'bg-white/[0.02] border-white/[0.08] text-purple-400' : 'bg-slate-50 border-slate-200 text-purple-600'">
            <span class="w-2 h-2 rounded-full bg-purple-500"></span> Триалы $0
          </span>
          <span class="inline-flex items-center gap-1.5 px-2 py-0.5 rounded border"
                :class="isDark ? 'bg-white/[0.02] border-white/[0.08] text-rose-400' : 'bg-slate-50 border-slate-200 text-rose-600'">
            <span class="w-2 h-2 rounded-full bg-rose-500"></span> Потери
          </span>
          <span class="inline-flex items-center gap-1.5 px-2 py-0.5 rounded border"
                :class="isDark ? 'bg-white/[0.02] border-white/[0.08] text-emerald-400' : 'bg-slate-50 border-slate-200 text-emerald-600'">
            <span class="w-2 h-2 rounded-full bg-emerald-500"></span> Доход ($)
          </span>
        </div>
      </div>

      <!-- Canvas -->
      <div class="pt-4 relative h-72 sm:h-80 w-full">
        <canvas id="cfChart"></canvas>
      </div>

    </div>

    <!-- MAIN DAILY RECONCILIATION TABLE -->
    <div class="rounded-xl border overflow-hidden transition"
         :class="isDark ? 'bg-[#0f1117] border-white/[0.08]' : 'bg-white border-slate-200 shadow-sm'">
      
      <!-- Table Header Bar -->
      <div class="p-4 border-b flex flex-col sm:flex-row sm:items-center justify-between gap-3"
           :class="isDark ? 'border-white/[0.06]' : 'border-slate-100'">
        <div>
          <h2 class="text-sm font-bold tracking-tight flex items-center gap-2" :class="isDark ? 'text-white' : 'text-slate-900'">
            <span>📋 Сверка по дням</span>
            <span class="text-xs px-2 py-0.5 rounded-full font-medium num"
                  :class="isDark ? 'bg-white/[0.04] text-neutral-400' : 'bg-slate-100 text-slate-600'" 
                  x-text="filteredRecords.length + ' дн.'"></span>
          </h2>
          <p class="text-xs mt-0.5" :class="isDark ? 'text-neutral-400' : 'text-slate-500'">
            Формула: <span class="font-mono text-rose-400">Потери = Синие галочки - Рефералы $0.00</span>.
          </p>
        </div>

        <!-- Sorting triggers -->
        <div class="flex items-center space-x-2 text-xs">
          <span :class="isDark ? 'text-neutral-400' : 'text-slate-500'">Сортировка:</span>
          <button @click="toggleSort('date')" 
                  class="px-2.5 py-1 rounded border transition"
                  :class="isDark ? 'bg-white/[0.04] border-white/[0.08] text-neutral-300' : 'bg-slate-50 border-slate-200 text-slate-700'">
            Дата <span x-text="sortField === 'date' ? (sortAsc ? '↑' : '↓') : ''"></span>
          </button>
          <button @click="toggleSort('missing_referrals')" 
                  class="px-2.5 py-1 rounded border transition text-rose-400"
                  :class="isDark ? 'bg-white/[0.04] border-white/[0.08]' : 'bg-slate-50 border-slate-200'">
            Потери <span x-text="sortField === 'missing_referrals' ? (sortAsc ? '↑' : '↓') : ''"></span>
          </button>
          <button @click="toggleSort('daily_earnings')" 
                  class="px-2.5 py-1 rounded border transition text-emerald-400"
                  :class="isDark ? 'bg-white/[0.04] border-white/[0.08]' : 'bg-slate-50 border-slate-200'">
            Доход <span x-text="sortField === 'daily_earnings' ? (sortAsc ? '↑' : '↓') : ''"></span>
          </button>
        </div>
      </div>

      <!-- Table Body -->
      <div class="overflow-x-auto">
        <table class="w-full text-left text-xs whitespace-nowrap">
          <thead class="border-b uppercase font-semibold tracking-wider text-[11px]"
                 :class="isDark ? 'bg-black/40 border-white/[0.08] text-neutral-400' : 'bg-slate-50 border-slate-200 text-slate-600'">
            <tr>
              <th scope="col" class="py-3 pl-5 pr-3">Дата</th>
              <th scope="col" class="py-3 px-3 text-right">Клики</th>
              <th scope="col" class="py-3 px-3 text-right">Синие галочки</th>
              <th scope="col" class="py-3 px-3 text-right">Рефералы $0.00</th>
              <th scope="col" class="py-3 px-3 text-right text-rose-400 font-bold">Разница: Потери</th>
              <th scope="col" class="py-3 px-3 text-right text-amber-400 font-semibold">Продления</th>
              <th scope="col" class="py-3 px-3 text-right text-emerald-400 font-semibold">Доход ($)</th>
              <th scope="col" class="py-3 pl-3 pr-5 text-center">Статус сверки</th>
            </tr>
          </thead>
          <tbody class="divide-y num"
                 :class="isDark ? 'divide-white/[0.04]' : 'divide-slate-100'">
            
            <template x-for="row in filteredRecords" :key="row.date">
              <tr class="transition"
                  :class="row.missing_referrals > 0 
                    ? (isDark ? 'bg-rose-950/20 border-l-4 border-l-rose-500 hover:bg-rose-950/30' : 'bg-rose-50/60 border-l-4 border-l-rose-500 hover:bg-rose-50')
                    : (row.date === '2026-11-05' 
                        ? (isDark ? 'bg-blue-950/30 border-l-4 border-l-cf-blue hover:bg-blue-950/40' : 'bg-blue-50/80 border-l-4 border-l-cf-blue hover:bg-blue-50')
                        : (isDark ? 'hover:bg-white/[0.02]' : 'hover:bg-slate-50'))">
                
                <!-- Дата -->
                <td class="py-2.5 pl-5 pr-3 font-medium flex items-center space-x-2"
                    :class="isDark ? 'text-white' : 'text-slate-900'">
                  <span x-text="row.date"></span>
                  <span class="text-[10px] font-sans px-1 rounded" 
                        :class="isDark ? 'bg-white/[0.04] text-neutral-400' : 'bg-slate-100 text-slate-500'" 
                        x-text="formatDayOfWeek(row.date)"></span>
                  <template x-if="row.date === '2026-11-05'">
                    <span class="text-[10px] font-sans px-1.5 py-0.5 rounded-full bg-cf-blue/20 text-cf-blue font-bold">
                      ⭐ 5 ноя
                    </span>
                  </template>
                </td>

                <!-- Клики -->
                <td class="py-2.5 px-3 text-right"
                    :class="isDark ? 'text-neutral-300' : 'text-slate-700'"
                    x-text="formatNumber(row.total_visits)"></td>

                <!-- Синие галочки -->
                <td class="py-2.5 px-3 text-right font-semibold"
                    :class="row.blue_checkmarks > 0 ? 'text-cf-blue' : (isDark ? 'text-neutral-500' : 'text-slate-400')"
                    x-text="row.blue_checkmarks"></td>

                <!-- Рефералы $0.00 -->
                <td class="py-2.5 px-3 text-right"
                    :class="row.referrals_zero > 0 ? (isDark ? 'text-neutral-200' : 'text-slate-800') : (isDark ? 'text-neutral-500' : 'text-slate-400')"
                    x-text="row.referrals_zero"></td>

                <!-- Разница: Потери -->
                <td class="py-2.5 px-3 text-right font-bold"
                    :class="row.missing_referrals > 0 ? 'text-rose-400 font-extrabold' : (isDark ? 'text-neutral-600' : 'text-slate-300')"
                    x-text="row.missing_referrals > 0 ? ('+' + row.missing_referrals) : '0'"></td>

                <!-- Продления -->
                <td class="py-2.5 px-3 text-right"
                    :class="row.renewals_count > 0 ? 'text-cf-amber font-semibold' : (isDark ? 'text-neutral-500' : 'text-slate-400')"
                    x-text="row.renewals_count"></td>

                <!-- Доход ($) -->
                <td class="py-2.5 px-3 text-right font-semibold"
                    :class="row.daily_earnings > 0 ? 'text-cf-emerald' : (isDark ? 'text-neutral-500' : 'text-slate-400')"
                    x-text="'$' + formatCurrency(row.daily_earnings)"></td>

                <!-- Статус сверки (Индикаторы) -->
                <td class="py-2.5 pl-3 pr-5 text-center">
                  <!-- Discrepancy Red Badge -->
                  <template x-if="row.missing_referrals > 0">
                    <span class="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                      ⚠️ Потеря: -<span x-text="row.missing_referrals"></span> реф.
                    </span>
                  </template>
                  <!-- Matching Green Badge -->
                  <template x-if="row.missing_referrals === 0 && row.blue_checkmarks > 0">
                    <span class="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      ✓ Сходится (<span x-text="row.blue_checkmarks"></span>=<span x-text="row.referrals_zero"></span>)
                    </span>
                  </template>
                  <!-- No Conversions Gray Dash -->
                  <template x-if="row.blue_checkmarks === 0 && row.referrals_zero === 0">
                    <span class="text-neutral-500 text-[11px]">—</span>
                  </template>
                </td>

              </tr>
            </template>

            <!-- Empty Records State -->
            <template x-if="filteredRecords.length === 0">
              <tr>
                <td colspan="8" class="py-12 text-center" :class="isDark ? 'text-neutral-500' : 'text-slate-400'">
                  <div class="flex flex-col items-center justify-center space-y-1">
                    <p class="text-sm font-medium">Нет данных под текущие параметры фильтрации</p>
                    <button @click="onlyLosses = false; searchQuery = ''; selectedMonth = 'all'" class="text-xs text-cf-blue hover:underline">
                      Сбросить фильтры
                    </button>
                  </div>
                </td>
              </tr>
            </template>

          </tbody>

          <!-- Table Summary Totals -->
          <tfoot class="border-t-2 font-bold num text-xs"
                 :class="isDark ? 'bg-black/50 border-white/[0.12] text-white' : 'bg-slate-50 border-slate-300 text-slate-900'">
            <tr>
              <td class="py-3 pl-5 pr-3 uppercase font-sans text-[11px] tracking-wider">
                Итого (<span x-text="filteredRecords.length"></span> дн.):
              </td>
              <td class="py-3 px-3 text-right" x-text="formatNumber(kpis.totalVisits)"></td>
              <td class="py-3 px-3 text-right text-cf-blue" x-text="formatNumber(kpis.blueCheckmarks)"></td>
              <td class="py-3 px-3 text-right" x-text="formatNumber(kpis.referralsZero)"></td>
              <td class="py-3 px-3 text-right" :class="kpis.missingReferrals > 0 ? 'text-rose-400 font-extrabold' : ''" x-text="formatNumber(kpis.missingReferrals)"></td>
              <td class="py-3 px-3 text-right text-cf-amber" x-text="formatNumber(kpis.renewalsCount)"></td>
              <td class="py-3 px-3 text-right text-cf-emerald" x-text="'$' + formatCurrency(kpis.dailyEarnings)"></td>
              <td class="py-3 pl-3 pr-5 text-center font-sans text-[11px]">
                <span x-text="kpis.missingReferrals > 0 ? '⚠️ Расхождения' : '✓ Сходится'"
                      :class="kpis.missingReferrals > 0 ? 'text-rose-400' : 'text-emerald-400'"></span>
              </td>
            </tr>
          </tfoot>

        </table>
      </div>

    </div>

  </main>

</body>
</html>`;
}

// Generate dashboard/index.html
const dashboardDir = path.join(ROOT_DIR, 'dashboard');
if (!fs.existsSync(dashboardDir)) {
  fs.mkdirSync(dashboardDir, { recursive: true });
}

const htmlSubfolder = generateHtml(true);
const htmlRoot = generateHtml(false);

const subfolderPath = path.join(dashboardDir, 'index.html');
const rootPath = path.join(ROOT_DIR, 'index.html');

fs.writeFileSync(subfolderPath, htmlSubfolder, 'utf-8');
fs.writeFileSync(rootPath, htmlRoot, 'utf-8');

console.log('✓ Successfully generated dashboard/index.html (' + htmlSubfolder.length + ' bytes)');
console.log('✓ Successfully updated root index.html (' + htmlRoot.length + ' bytes)');
