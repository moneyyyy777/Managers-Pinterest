import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');
const DATA_PATH = path.join(ROOT_DIR, 'data', 'reports', 'analytics-daily.json');
const OUTPUT_PATH = path.join(ROOT_DIR, 'index.html');

console.log('Generating index.html dashboard...');
const rawData = fs.readFileSync(DATA_PATH, 'utf-8');
const parsedData = JSON.parse(rawData);

const html = `<!DOCTYPE html>
<html lang="ru" class="dark">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Creative Fabrica Analytics • Managers Pinterest Dashboard</title>
  
  <!-- Tailwind CSS -->
  <script src="https://cdn.tailwindcss.com"></script>
  <script>
    tailwind.config = {
      darkMode: 'class',
      theme: {
        extend: {
          colors: {
            brand: {
              50: '#fdf4f4',
              100: '#fbe8e8',
              500: '#e60023', // Pinterest red
              600: '#cc001f',
              700: '#ad081b',
            },
            cf: {
              blue: '#0084ff',
              green: '#10b981',
              dark: '#0f172a',
              card: '#1e293b',
              border: '#334155',
            }
          },
          fontFamily: {
            sans: ['Inter', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
          }
        }
      }
    }
  </script>

  <!-- Google Fonts: Inter -->
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap" rel="stylesheet">

  <!-- Chart.js -->
  <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>

  <!-- External JS data (no CORS block on file://) -->
  <script src="data/reports/analytics-daily.js"></script>

  <!-- Alpine.js -->
  <script defer src="https://cdn.jsdelivr.net/npm/alpinejs@3.x.x/dist/cdn.min.js"></script>

  <style>
    body {
      font-family: 'Inter', system-ui, -apple-system, sans-serif;
      background-color: #0b0f19;
      color: #f1f5f9;
    }
    .font-mono-num {
      font-family: 'JetBrains Mono', monospace;
      font-variant-numeric: tabular-nums;
    }
    /* Custom sleek scrollbar */
    ::-webkit-scrollbar {
      width: 8px;
      height: 8px;
    }
    ::-webkit-scrollbar-track {
      background: #0f172a;
    }
    ::-webkit-scrollbar-thumb {
      background: #334155;
      border-radius: 4px;
    }
    ::-webkit-scrollbar-thumb:hover {
      background: #475569;
    }
  </style>
</head>
<body class="min-h-screen text-slate-100 antialiased selection:bg-rose-500 selection:text-white" x-data="dashboardApp()" x-init="initDashboard()">

  <!-- Top App Navigation Bar -->
  <header class="border-b border-slate-800 bg-slate-900/90 backdrop-blur sticky top-0 z-40">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
      
      <!-- Logo & Title -->
      <div class="flex items-center space-x-3">
        <div class="w-10 h-10 rounded-xl bg-gradient-to-tr from-rose-600 via-brand-500 to-amber-500 flex items-center justify-center shadow-lg shadow-rose-900/40">
          <svg class="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="18" y1="20" x2="18" y2="10"></line>
            <line x1="12" y1="20" x2="12" y2="4"></line>
            <line x1="6" y1="20" x2="6" y2="14"></line>
          </svg>
        </div>
        <div>
          <div class="flex items-center space-x-2">
            <h1 class="text-base sm:text-lg font-bold tracking-tight text-white flex items-center gap-2">
              Creative Fabrica Analytics
              <span class="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700 font-normal">v1.2 Lead</span>
            </h1>
          </div>
          <p class="text-xs text-slate-400">Managers Pinterest • Сверка рефералов и динамика кликов</p>
        </div>
      </div>

      <!-- Header Status & Actions -->
      <div class="flex items-center space-x-3">
        <div class="hidden md:flex items-center space-x-2 bg-slate-800/80 px-3 py-1.5 rounded-lg border border-slate-700/60 text-xs">
          <span class="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          <span class="text-slate-300">База:</span>
          <span class="font-semibold text-white font-mono-num" x-text="records.length + ' дней'"></span>
        </div>

        <button @click="exportCSV()" class="inline-flex items-center space-x-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-medium px-3 py-2 rounded-lg transition shadow-sm">
          <svg class="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
          </svg>
          <span class="hidden sm:inline">Экспорт CSV</span>
        </button>

        <button @click="reloadData()" title="Обновить данные" class="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition">
          <svg class="w-4 h-4" :class="{'animate-spin': isRefreshing}" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
          </svg>
        </button>
      </div>

    </div>
  </header>

  <!-- Main Container -->
  <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">

    <!-- Loss Alert Banner (Shows when missing referrals > 0) -->
    <template x-if="kpis.missingReferrals > 0">
      <div class="bg-gradient-to-r from-rose-950/70 via-red-900/40 to-slate-900 border border-rose-500/40 rounded-2xl p-4 sm:p-5 shadow-lg relative overflow-hidden flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div class="flex items-center space-x-3">
          <div class="w-10 h-10 rounded-xl bg-rose-500/20 text-rose-400 border border-rose-500/30 flex items-center justify-center shrink-0">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
            </svg>
          </div>
          <div>
            <div class="flex items-center gap-2">
              <h3 class="text-sm sm:text-base font-bold text-rose-300">Обнаружены расхождения в сверке</h3>
              <span class="px-2 py-0.5 text-xs font-semibold rounded-full bg-rose-500 text-white font-mono-num" x-text="kpis.missingReferrals + ' потерь'"></span>
            </div>
            <p class="text-xs sm:text-sm text-rose-200/80 mt-0.5">
              В выбранном периоде синие галочки превышают рефералов $0.00 на <strong class="text-white font-mono-num" x-text="kpis.missingReferrals"></strong> шт. Рекомендуется подать тикет на доначисление.
            </p>
          </div>
        </div>
        <button @click="filterAnomaly = 'losses'" class="whitespace-nowrap px-3.5 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold shadow transition">
          Показать только дни с потерями →
        </button>
      </div>
    </template>

    <!-- Navigation Filters & Month Selector -->
    <div class="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
      
      <!-- Top Row: Year Pills + Anomaly Filters + Search -->
      <div class="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        
        <!-- Year Selector Tabs -->
        <div class="flex items-center space-x-1.5 bg-slate-950 p-1.5 rounded-xl border border-slate-800">
          <span class="text-xs font-medium text-slate-400 px-2.5 hidden sm:inline">Год:</span>
          <template x-for="year in availableYears" :key="year">
            <button 
              @click="setYear(year)" 
              :class="selectedYear === year ? 'bg-rose-600 text-white shadow-md font-bold' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'"
              class="px-3.5 py-1.5 rounded-lg text-xs transition duration-150 flex items-center space-x-1 font-mono-num">
              <span x-text="year"></span>
              <span x-if="year === '2026'" class="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block ml-1"></span>
            </button>
          </template>
          <button 
            @click="setYear('all')" 
            :class="selectedYear === 'all' ? 'bg-rose-600 text-white shadow-md font-bold' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'"
            class="px-3 py-1.5 rounded-lg text-xs transition duration-150">
            Все годы
          </button>
        </div>

        <!-- Filter Modes (Pills) -->
        <div class="flex flex-wrap items-center gap-1.5">
          <button 
            @click="filterAnomaly = 'all'" 
            :class="filterAnomaly === 'all' ? 'bg-slate-700 text-white border-slate-600' : 'bg-slate-800/50 text-slate-400 border-slate-800 hover:bg-slate-800'"
            class="px-3 py-1.5 rounded-lg text-xs border transition font-medium">
            Все дни (<span class="font-mono-num" x-text="unfilteredCount"></span>)
          </button>

          <button 
            @click="filterAnomaly = 'losses'" 
            :class="filterAnomaly === 'losses' ? 'bg-rose-600 text-white border-rose-500 shadow-rose-900/50' : 'bg-rose-950/40 text-rose-300 border-rose-800/50 hover:bg-rose-900/60'"
            class="px-3 py-1.5 rounded-lg text-xs border transition font-medium flex items-center space-x-1.5">
            <span>🚨 Потери</span>
            <span class="px-1.5 py-0.2 rounded-full bg-rose-500/30 text-rose-200 font-mono-num text-[10px]" x-text="periodLossDaysCount"></span>
          </button>

          <button 
            @click="filterAnomaly = 'conversions'" 
            :class="filterAnomaly === 'conversions' ? 'bg-cf-blue text-white border-blue-400' : 'bg-blue-950/30 text-blue-300 border-blue-800/40 hover:bg-blue-900/50'"
            class="px-3 py-1.5 rounded-lg text-xs border transition font-medium">
            🔷 Есть галочки
          </button>

          <button 
            @click="filterAnomaly = 'earnings'" 
            :class="filterAnomaly === 'earnings' ? 'bg-emerald-600 text-white border-emerald-500' : 'bg-emerald-950/30 text-emerald-300 border-emerald-800/40 hover:bg-emerald-900/50'"
            class="px-3 py-1.5 rounded-lg text-xs border transition font-medium">
            💰 Есть доход
          </button>
        </div>

        <!-- Live Search Input -->
        <div class="relative min-w-[200px]">
          <input 
            type="text" 
            x-model="searchQuery" 
            placeholder="Поиск по дате (YYYY-MM-DD)..."
            class="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-1.5 pl-9 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-rose-500 transition font-mono-num"
          >
          <svg class="w-4 h-4 text-slate-500 absolute left-3 top-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
          </svg>
          <button x-show="searchQuery" @click="searchQuery = ''" class="absolute right-2.5 top-2 text-slate-400 hover:text-white">
            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
          </button>
        </div>

      </div>

      <!-- Bottom Row: Month Selector Pills for Active Year -->
      <div class="pt-3 border-t border-slate-800/70">
        <div class="flex items-center justify-between mb-2">
          <span class="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
            <span>📅 Выбор месяца:</span>
            <span class="text-rose-400 font-mono-num" x-text="selectedYear === 'all' ? 'Все периоды' : selectedYear + ' год'"></span>
          </span>
          <div class="flex items-center space-x-2">
            <button 
              @click="setMonth('all')" 
              :class="selectedMonth === 'all' ? 'bg-slate-700 text-white font-bold' : 'text-slate-400 hover:text-slate-200'"
              class="px-2.5 py-1 rounded-md text-xs transition font-mono-num">
              Весь <span x-text="selectedYear"></span>
            </button>
          </div>
        </div>

        <div class="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-12 gap-1.5">
          <template x-for="m in availableMonths" :key="m.id">
            <button 
              @click="setMonth(m.id)" 
              :class="selectedMonth === m.id ? 'bg-rose-600 text-white ring-2 ring-rose-400 ring-offset-2 ring-offset-slate-900 font-bold' : (m.hasData ? 'bg-slate-800/80 hover:bg-slate-700 text-slate-200 border border-slate-700/50' : 'bg-slate-900/40 text-slate-600 border border-slate-800/30 cursor-not-allowed')"
              :disabled="!m.hasData"
              class="px-2 py-2 rounded-xl text-center transition flex flex-col items-center justify-center relative overflow-hidden group">
              <span class="text-xs font-semibold" x-text="m.shortName"></span>
              <span class="text-[10px] text-slate-400 group-hover:text-slate-300 font-mono-num" x-text="m.hasData ? m.visits + ' кл.' : '—'"></span>
              <!-- Red dot indicator if month has missing referrals -->
              <span x-show="m.missing > 0" class="absolute top-1 right-1 w-2 h-2 rounded-full bg-rose-500 animate-ping"></span>
              <span x-show="m.missing > 0" class="absolute top-1 right-1 w-2 h-2 rounded-full bg-rose-500"></span>
            </button>
          </template>
        </div>
      </div>

    </div>

    <!-- KPI Summary Metric Cards -->
    <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
      
      <!-- 1. Клики -->
      <div class="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-lg flex flex-col justify-between">
        <div class="flex items-center justify-between text-slate-400 mb-2">
          <span class="text-xs font-medium uppercase tracking-wider">Клики (Визиты)</span>
          <div class="p-1.5 rounded-lg bg-slate-800 text-slate-300">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path></svg>
          </div>
        </div>
        <div>
          <div class="text-2xl font-extrabold text-white font-mono-num" x-text="formatNumber(kpis.totalVisits)"></div>
          <div class="text-[11px] text-slate-400 mt-1 flex items-center gap-1">
            <span>Дней в выборке:</span>
            <span class="font-mono-num text-slate-200" x-text="filteredRecords.length"></span>
          </div>
        </div>
      </div>

      <!-- 2. Синие галочки -->
      <div class="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-lg flex flex-col justify-between">
        <div class="flex items-center justify-between text-blue-400 mb-2">
          <span class="text-xs font-medium uppercase tracking-wider">Синие галочки</span>
          <div class="p-1.5 rounded-lg bg-blue-950/60 text-cf-blue">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
          </div>
        </div>
        <div>
          <div class="text-2xl font-extrabold text-blue-400 font-mono-num" x-text="formatNumber(kpis.blueCheckmarks)"></div>
          <div class="text-[11px] text-slate-400 mt-1">
            CR: <span class="text-blue-300 font-mono-num font-semibold" x-text="kpis.cr + '%'"></span>
          </div>
        </div>
      </div>

      <!-- 3. Рефералы $0.00 -->
      <div class="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-lg flex flex-col justify-between">
        <div class="flex items-center justify-between text-slate-400 mb-2">
          <span class="text-xs font-medium uppercase tracking-wider">Рефералы $0.00</span>
          <div class="p-1.5 rounded-lg bg-slate-800 text-slate-300">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"></path></svg>
          </div>
        </div>
        <div>
          <div class="text-2xl font-extrabold text-slate-200 font-mono-num" x-text="formatNumber(kpis.referralsZero)"></div>
          <div class="text-[11px] text-slate-400 mt-1">
            Зачтено триалов
          </div>
        </div>
      </div>

      <!-- 4. Потери (Missing Referrals) -->
      <div class="bg-slate-900 border rounded-2xl p-4 shadow-lg flex flex-col justify-between"
           :class="kpis.missingReferrals > 0 ? 'border-rose-500/50 bg-rose-950/20' : 'border-slate-800'">
        <div class="flex items-center justify-between text-rose-400 mb-2">
          <span class="text-xs font-medium uppercase tracking-wider">Потери (Галочки - $0)</span>
          <div class="p-1.5 rounded-lg" :class="kpis.missingReferrals > 0 ? 'bg-rose-500/20 text-rose-400' : 'bg-slate-800 text-slate-400'">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
          </div>
        </div>
        <div>
          <div class="text-2xl font-extrabold font-mono-num flex items-baseline gap-2"
               :class="kpis.missingReferrals > 0 ? 'text-rose-400' : 'text-slate-400'">
            <span x-text="formatNumber(kpis.missingReferrals)"></span>
            <span x-show="kpis.missingReferrals > 0" class="text-xs text-rose-500 font-bold uppercase">🚨 Не зачтено</span>
          </div>
          <div class="text-[11px] text-slate-400 mt-1">
            Дней с потерями: <span class="font-mono-num text-rose-400 font-semibold" x-text="periodLossDaysCount"></span>
          </div>
        </div>
      </div>

      <!-- 5. Доплаты $9.40 -->
      <div class="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-lg flex flex-col justify-between">
        <div class="flex items-center justify-between text-amber-400 mb-2">
          <span class="text-xs font-medium uppercase tracking-wider">Доплаты $9.40</span>
          <div class="p-1.5 rounded-lg bg-amber-950/40 text-amber-400">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path></svg>
          </div>
        </div>
        <div>
          <div class="text-2xl font-extrabold text-amber-400 font-mono-num" x-text="formatNumber(kpis.renewalsCount)"></div>
          <div class="text-[11px] text-slate-400 mt-1">
            Продления / подписки
          </div>
        </div>
      </div>

      <!-- 6. Доход ($) -->
      <div class="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-lg flex flex-col justify-between">
        <div class="flex items-center justify-between text-emerald-400 mb-2">
          <span class="text-xs font-medium uppercase tracking-wider">Общий доход ($)</span>
          <div class="p-1.5 rounded-lg bg-emerald-950/40 text-emerald-400">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
          </div>
        </div>
        <div>
          <div class="text-2xl font-extrabold text-emerald-400 font-mono-num" x-text="'$' + formatCurrency(kpis.dailyEarnings)"></div>
          <div class="text-[11px] text-slate-400 mt-1">
            EPC: <span class="font-mono-num text-emerald-300" x-text="'$' + (kpis.totalVisits > 0 ? (kpis.dailyEarnings / kpis.totalVisits).toFixed(3) : '0.000')"></span>
          </div>
        </div>
      </div>

    </div>

    <!-- Chart: Dynamic Analytics Timeline -->
    <div class="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
      <div class="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-800 gap-3">
        <div>
          <h2 class="text-base font-bold text-white flex items-center gap-2">
            <span>📈 Динамика кликов и конверсий</span>
            <span class="text-xs px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 font-mono-num" x-text="selectedPeriodLabel"></span>
          </h2>
          <p class="text-xs text-slate-400 mt-0.5">Соотношение визитов (левая шкала) и конверсий со сверкой потерь (правая шкала)</p>
        </div>
        
        <div class="flex items-center space-x-2 text-xs">
          <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-800 text-slate-300 border border-slate-700/50">
            <span class="w-2.5 h-2.5 rounded-full bg-slate-400 inline-block"></span> Клики
          </span>
          <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-800 text-blue-400 border border-slate-700/50">
            <span class="w-2.5 h-2.5 rounded-full bg-cf-blue inline-block"></span> Галочки
          </span>
          <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-800 text-rose-400 border border-slate-700/50">
            <span class="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block"></span> Потери
          </span>
          <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-800 text-emerald-400 border border-slate-700/50">
            <span class="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block"></span> Доход ($)
          </span>
        </div>
      </div>

      <div class="pt-4 relative h-72 sm:h-80 w-full">
        <canvas id="analyticsChart"></canvas>
      </div>
    </div>

    <!-- Daily Reconciliation Table -->
    <div class="bg-slate-900 border border-slate-800 rounded-2xl shadow-xl overflow-hidden">
      
      <!-- Table Header & Controls -->
      <div class="p-5 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 class="text-base font-bold text-white flex items-center gap-2">
            <span>📋 Детальная таблица сверки по дням</span>
            <span class="text-xs px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 font-mono-num" x-text="filteredRecords.length + ' записей'"></span>
          </h2>
          <p class="text-xs text-slate-400 mt-0.5">
            Формула сверки: <code class="text-rose-400 font-mono">Потери = Синие галочки - Рефералы $0.00</code>. Аномалии выделены цветными бейджами.
          </p>
        </div>

        <div class="flex items-center space-x-2 text-xs">
          <span class="text-slate-400">Сортировка:</span>
          <button @click="toggleSort('date')" class="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 flex items-center gap-1">
            Дата
            <span x-text="sortField === 'date' ? (sortAsc ? '↑' : '↓') : ''"></span>
          </button>
          <button @click="toggleSort('missing_referrals')" class="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-rose-300 flex items-center gap-1">
            Потери
            <span x-text="sortField === 'missing_referrals' ? (sortAsc ? '↑' : '↓') : ''"></span>
          </button>
          <button @click="toggleSort('daily_earnings')" class="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-emerald-300 flex items-center gap-1">
            Доход
            <span x-text="sortField === 'daily_earnings' ? (sortAsc ? '↑' : '↓') : ''"></span>
          </button>
        </div>
      </div>

      <!-- Table Body -->
      <div class="overflow-x-auto">
        <table class="w-full text-left text-xs whitespace-nowrap">
          <thead class="bg-slate-950/70 border-b border-slate-800 text-slate-400 font-medium uppercase tracking-wider">
            <tr>
              <th scope="col" class="py-3.5 pl-5 pr-3">Дата</th>
              <th scope="col" class="py-3.5 px-3 text-right">Клики</th>
              <th scope="col" class="py-3.5 px-3 text-right">Синие галочки</th>
              <th scope="col" class="py-3.5 px-3 text-right">Рефералы $0.00</th>
              <th scope="col" class="py-3.5 px-3 text-right">Потери (Галочки - $0)</th>
              <th scope="col" class="py-3.5 px-3 text-right">Доплаты $9.40</th>
              <th scope="col" class="py-3.5 px-3 text-right">Доход ($)</th>
              <th scope="col" class="py-3.5 pl-3 pr-5 text-center">Статус сверки</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-800/60 font-mono-num">
            
            <template x-for="row in paginatedRecords" :key="row.date">
              <tr class="transition hover:bg-slate-800/40"
                  :class="row.missing_referrals > 0 ? 'bg-rose-950/20 border-l-4 border-l-rose-500' : (row.blue_checkmarks > 0 ? 'bg-blue-950/10' : '')">
                
                <!-- Дата -->
                <td class="py-3 pl-5 pr-3 text-slate-200 font-medium">
                  <div class="flex items-center space-x-2">
                    <span x-text="row.date"></span>
                    <span class="text-[10px] text-slate-500 font-sans" x-text="formatDayOfWeek(row.date)"></span>
                  </div>
                </td>

                <!-- Клики -->
                <td class="py-3 px-3 text-right text-slate-300" x-text="formatNumber(row.total_visits)"></td>

                <!-- Синие галочки -->
                <td class="py-3 px-3 text-right font-semibold" 
                    :class="row.blue_checkmarks > 0 ? 'text-blue-400' : 'text-slate-500'" 
                    x-text="row.blue_checkmarks"></td>

                <!-- Рефералы $0.00 -->
                <td class="py-3 px-3 text-right" 
                    :class="row.referrals_zero > 0 ? 'text-slate-200' : 'text-slate-500'" 
                    x-text="row.referrals_zero"></td>

                <!-- Потери (Галочки - $0.00) -->
                <td class="py-3 px-3 text-right font-bold" 
                    :class="row.missing_referrals > 0 ? 'text-rose-400 font-extrabold' : 'text-slate-600'" 
                    x-text="row.missing_referrals > 0 ? '+' + row.missing_referrals : '0'"></td>

                <!-- Доплаты $9.40 -->
                <td class="py-3 px-3 text-right" 
                    :class="row.renewals_count > 0 ? 'text-amber-400 font-semibold' : 'text-slate-500'" 
                    x-text="row.renewals_count"></td>

                <!-- Доход ($) -->
                <td class="py-3 px-3 text-right font-semibold" 
                    :class="row.daily_earnings > 0 ? 'text-emerald-400' : 'text-slate-500'" 
                    x-text="'$' + formatCurrency(row.daily_earnings)"></td>

                <!-- Статус сверки (Бейджи) -->
                <td class="py-3 pl-3 pr-5 text-center">
                  <template x-if="row.missing_referrals > 0">
                    <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40">
                      🚨 Потеря: -<span x-text="row.missing_referrals"></span> реф.
                    </span>
                  </template>
                  <template x-if="row.missing_referrals === 0 && row.blue_checkmarks > 0">
                    <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                      ✓ Сходится (<span x-text="row.blue_checkmarks"></span>=<span x-text="row.referrals_zero"></span>)
                    </span>
                  </template>
                  <template x-if="row.blue_checkmarks === 0 && row.referrals_zero === 0">
                    <span class="text-slate-600 text-[11px]">
                      —
                    </span>
                  </template>
                </td>

              </tr>
            </template>

            <!-- Empty State -->
            <template x-if="filteredRecords.length === 0">
              <tr>
                <td colspan="8" class="py-12 text-center text-slate-500">
                  <div class="flex flex-col items-center justify-center space-y-2">
                    <svg class="w-8 h-8 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                    <p class="text-sm font-medium">Нет записей под выбранные фильтры</p>
                    <button @click="resetFilters()" class="text-xs text-rose-400 hover:underline">Сбросить фильтры</button>
                  </div>
                </td>
              </tr>
            </template>

          </tbody>

          <!-- Table Footer Totals -->
          <tfoot class="bg-slate-950 border-t-2 border-slate-700 font-mono-num font-bold text-slate-200">
            <tr>
              <td class="py-3.5 pl-5 pr-3 text-white uppercase tracking-wider font-sans text-xs">
                Итого (<span x-text="filteredRecords.length"></span> дн.):
              </td>
              <td class="py-3.5 px-3 text-right text-white" x-text="formatNumber(kpis.totalVisits)"></td>
              <td class="py-3.5 px-3 text-right text-blue-400" x-text="formatNumber(kpis.blueCheckmarks)"></td>
              <td class="py-3.5 px-3 text-right text-slate-200" x-text="formatNumber(kpis.referralsZero)"></td>
              <td class="py-3.5 px-3 text-right" :class="kpis.missingReferrals > 0 ? 'text-rose-400' : 'text-slate-400'" x-text="formatNumber(kpis.missingReferrals)"></td>
              <td class="py-3.5 px-3 text-right text-amber-400" x-text="formatNumber(kpis.renewalsCount)"></td>
              <td class="py-3.5 px-3 text-right text-emerald-400" x-text="'$' + formatCurrency(kpis.dailyEarnings)"></td>
              <td class="py-3.5 pl-3 pr-5 text-center font-sans text-xs">
                <span x-text="kpis.missingReferrals > 0 ? '⚠️ Требует сверки' : '✅ Все сходится'"
                      :class="kpis.missingReferrals > 0 ? 'text-rose-400' : 'text-emerald-400'"></span>
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      <!-- Pagination / Limit Bar -->
      <div class="px-5 py-3 border-t border-slate-800 bg-slate-900/50 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-400 gap-2">
        <div>
          Показано <span class="font-mono-num text-slate-200" x-text="Math.min(perPage, filteredRecords.length)"></span> из <span class="font-mono-num text-slate-200" x-text="filteredRecords.length"></span> записей
        </div>
        <div class="flex items-center space-x-2">
          <span>Строк на странице:</span>
          <select x-model.number="perPage" class="bg-slate-950 border border-slate-700 text-slate-200 rounded px-2 py-1 text-xs focus:outline-none focus:border-rose-500">
            <option :value="31">31 (месяц)</option>
            <option :value="100">100</option>
            <option :value="365">365 (год)</option>
            <option :value="1000">Все записи</option>
          </select>
        </div>
      </div>

    </div>

  </main>

  <!-- Embedded Analytics Dataset as Ultimate Fallback -->
  <script id="embedded-data" type="application/json">
${JSON.stringify(parsedData)}
  </script>

  <!-- Dashboard Alpine Logic & Chart Integration -->
  <script>
    function dashboardApp() {
      return {
        records: [],
        selectedYear: '2026',
        selectedMonth: 'all',
        filterAnomaly: 'all',
        searchQuery: '',
        sortField: 'date',
        sortAsc: false,
        perPage: 100,
        chartInstance: null,
        isRefreshing: false,

        initDashboard() {
          this.loadInitialData();
          this.$nextTick(() => {
            this.renderChart();
          });

          // Watch filters and update chart dynamically
          this.$watch('selectedYear', () => { this.handleFilterChange(); });
          this.$watch('selectedMonth', () => { this.handleFilterChange(); });
          this.$watch('filterAnomaly', () => { this.handleFilterChange(); });
          this.$watch('searchQuery', () => { this.handleFilterChange(); });
        },

        loadInitialData() {
          // Priority 1: Window object from data/reports/analytics-daily.js
          if (window.CREATIVE_FABRICA_DATA && Array.isArray(window.CREATIVE_FABRICA_DATA) && window.CREATIVE_FABRICA_DATA.length > 0) {
            this.records = window.CREATIVE_FABRICA_DATA;
            console.log('✓ Loaded from window.CREATIVE_FABRICA_DATA:', this.records.length);
            return;
          }

          // Priority 2: Inlined JSON script tag
          try {
            const raw = document.getElementById('embedded-data').textContent;
            this.records = JSON.parse(raw);
            console.log('✓ Loaded from #embedded-data fallback:', this.records.length);
          } catch (e) {
            console.error('Failed to parse embedded data:', e);
            this.records = [];
          }
        },

        async reloadData() {
          this.isRefreshing = true;
          try {
            const res = await fetch('data/reports/analytics-daily.json?t=' + Date.now());
            if (res.ok) {
              const fresh = await res.json();
              if (Array.isArray(fresh) && fresh.length > 0) {
                this.records = fresh;
                console.log('✓ Successfully refreshed data via fetch:', fresh.length);
              }
            }
          } catch (e) {
            console.log('Fetch skipped (likely file:// protocol or offline). Embedded data remains active.');
          } finally {
            setTimeout(() => {
              this.isRefreshing = false;
              this.renderChart();
            }, 300);
          }
        },

        handleFilterChange() {
          this.$nextTick(() => {
            this.renderChart();
          });
        },

        // Available years extracted dynamically
        get availableYears() {
          const set = new Set();
          this.records.forEach(r => {
            if (r.date) set.add(r.date.slice(0, 4));
          });
          return Array.from(set).sort().reverse();
        },

        // Months breakdown for active year
        get availableMonths() {
          const monthNames = [
            { num: '01', name: 'Январь', shortName: 'Янв' },
            { num: '02', name: 'Февраль', shortName: 'Фев' },
            { num: '03', name: 'Март', shortName: 'Мар' },
            { num: '04', name: 'Апрель', shortName: 'Апр' },
            { num: '05', name: 'Май', shortName: 'Май' },
            { num: '06', name: 'Июнь', shortName: 'Июн' },
            { num: '07', name: 'Июль', shortName: 'Июл' },
            { num: '08', name: 'Август', shortName: 'Авг' },
            { num: '09', name: 'Сентябрь', shortName: 'Сен' },
            { num: '10', name: 'Октябрь', shortName: 'Окт' },
            { num: '11', name: 'Ноябрь', shortName: 'Ноя' },
            { num: '12', name: 'Декабрь', shortName: 'Дек' },
          ];

          const currentYear = this.selectedYear === 'all' ? '2026' : this.selectedYear;

          return monthNames.map(m => {
            const ymd = currentYear + '-' + m.num;
            const recordsInMonth = this.records.filter(r => r.date && r.date.startsWith(ymd));
            const visits = recordsInMonth.reduce((s, r) => s + (r.total_visits || 0), 0);
            const missing = recordsInMonth.reduce((s, r) => s + (r.missing_referrals || 0), 0);
            const earnings = recordsInMonth.reduce((s, r) => s + (r.daily_earnings || 0), 0);

            return {
              id: ymd,
              name: m.name,
              shortName: m.shortName,
              hasData: recordsInMonth.length > 0,
              count: recordsInMonth.length,
              visits,
              missing,
              earnings
            };
          });
        },

        get unfilteredCount() {
          if (this.selectedYear === 'all') return this.records.length;
          if (this.selectedMonth !== 'all') {
            return this.records.filter(r => r.date.startsWith(this.selectedMonth)).length;
          }
          return this.records.filter(r => r.date.startsWith(this.selectedYear)).length;
        },

        get periodLossDaysCount() {
          return this.filteredRecords.filter(r => (r.missing_referrals || 0) > 0).length;
        },

        get selectedPeriodLabel() {
          if (this.selectedMonth !== 'all') {
            const [y, m] = this.selectedMonth.split('-');
            const months = ['Январь','Февраль','Март','Апрель','Май','Июнь','Июль','Август','Сентябрь','Октябрь','Ноябрь','Декабрь'];
            return (months[parseInt(m, 10) - 1] || m) + ' ' + y;
          }
          if (this.selectedYear !== 'all') {
            return 'Весь ' + this.selectedYear + ' год';
          }
          return 'Все годы (2024–2026)';
        },

        setYear(year) {
          this.selectedYear = year;
          this.selectedMonth = 'all';
        },

        setMonth(monthId) {
          this.selectedMonth = monthId;
        },

        resetFilters() {
          this.selectedYear = '2026';
          this.selectedMonth = 'all';
          this.filterAnomaly = 'all';
          this.searchQuery = '';
        },

        // Filtered records based on active year, month, anomalies, search
        get filteredRecords() {
          let list = [...this.records];

          // 1. Year filter
          if (this.selectedYear !== 'all') {
            list = list.filter(r => r.date && r.date.startsWith(this.selectedYear));
          }

          // 2. Month filter
          if (this.selectedMonth !== 'all') {
            list = list.filter(r => r.date && r.date.startsWith(this.selectedMonth));
          }

          // 3. Anomaly filters
          if (this.filterAnomaly === 'losses') {
            list = list.filter(r => (r.missing_referrals || 0) > 0);
          } else if (this.filterAnomaly === 'conversions') {
            list = list.filter(r => (r.blue_checkmarks || 0) > 0);
          } else if (this.filterAnomaly === 'earnings') {
            list = list.filter(r => (r.daily_earnings || 0) > 0);
          }

          // 4. Search query
          if (this.searchQuery.trim()) {
            const q = this.searchQuery.trim().toLowerCase();
            list = list.filter(r => r.date.toLowerCase().includes(q));
          }

          // 5. Sorting
          list.sort((a, b) => {
            let valA = a[this.sortField];
            let valB = b[this.sortField];
            if (this.sortField === 'date') {
              return this.sortAsc ? valA.localeCompare(valB) : valB.localeCompare(valA);
            }
            valA = valA || 0;
            valB = valB || 0;
            return this.sortAsc ? valA - valB : valB - valA;
          });

          return list;
        },

        get paginatedRecords() {
          return this.filteredRecords.slice(0, this.perPage);
        },

        // Dynamic KPI calculations
        get kpis() {
          const recs = this.filteredRecords;
          const totalVisits = recs.reduce((acc, r) => acc + (r.total_visits || 0), 0);
          const blueCheckmarks = recs.reduce((acc, r) => acc + (r.blue_checkmarks || 0), 0);
          const referralsZero = recs.reduce((acc, r) => acc + (r.referrals_zero || 0), 0);
          const missingReferrals = recs.reduce((acc, r) => acc + (r.missing_referrals || 0), 0);
          const renewalsCount = recs.reduce((acc, r) => acc + (r.renewals_count || 0), 0);
          const dailyEarnings = recs.reduce((acc, r) => acc + (r.daily_earnings || 0), 0);
          const cr = totalVisits > 0 ? ((blueCheckmarks / totalVisits) * 100).toFixed(2) : '0.00';

          return {
            totalVisits,
            blueCheckmarks,
            referralsZero,
            missingReferrals,
            renewalsCount,
            dailyEarnings,
            cr
          };
        },

        toggleSort(field) {
          if (this.sortField === field) {
            this.sortAsc = !this.sortAsc;
          } else {
            this.sortField = field;
            this.sortAsc = false;
          }
        },

        formatNumber(num) {
          if (num === undefined || num === null) return '0';
          return new Intl.NumberFormat('ru-RU').format(num);
        },

        formatCurrency(num) {
          if (num === undefined || num === null) return '0.00';
          return Number(num).toFixed(2);
        },

        formatDayOfWeek(ymd) {
          if (!ymd) return '';
          const days = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'];
          const d = new Date(ymd + 'T12:00:00');
          return days[d.getDay()] || '';
        },

        renderChart() {
          const ctx = document.getElementById('analyticsChart');
          if (!ctx) return;

          // Chart data should be sorted chronologically (ascending by date)
          const chronData = [...this.filteredRecords].sort((a, b) => a.date.localeCompare(b.date));

          // If too many records (e.g. all 782 days), we can still render smoothly
          const labels = chronData.map(d => {
            const parts = d.date.split('-');
            return parts[1] + '/' + parts[2];
          });
          const visits = chronData.map(d => d.total_visits);
          const blue = chronData.map(d => d.blue_checkmarks);
          const missing = chronData.map(d => d.missing_referrals);
          const earnings = chronData.map(d => d.daily_earnings);

          if (this.chartInstance) {
            this.chartInstance.destroy();
          }

          this.chartInstance = new Chart(ctx, {
            type: 'bar',
            data: {
              labels: labels,
              datasets: [
                {
                  label: 'Клики (Визиты)',
                  data: visits,
                  backgroundColor: 'rgba(148, 163, 184, 0.25)',
                  borderColor: 'rgba(148, 163, 184, 0.6)',
                  borderWidth: 1,
                  borderRadius: 3,
                  yAxisID: 'yVisits',
                  order: 3
                },
                {
                  label: 'Синие галочки',
                  data: blue,
                  type: 'line',
                  borderColor: '#0084ff',
                  backgroundColor: 'rgba(0, 132, 255, 0.1)',
                  borderWidth: 2,
                  pointRadius: chronData.length > 60 ? 0 : 3,
                  pointHoverRadius: 5,
                  tension: 0.25,
                  yAxisID: 'yEvents',
                  order: 1
                },
                {
                  label: 'Потери (Не зачтено)',
                  data: missing,
                  type: 'bar',
                  backgroundColor: '#f43f5e',
                  borderColor: '#e11d48',
                  borderWidth: 1,
                  borderRadius: 4,
                  yAxisID: 'yEvents',
                  order: 2
                },
                {
                  label: 'Доход ($)',
                  data: earnings,
                  type: 'line',
                  borderColor: '#10b981',
                  borderDash: [4, 4],
                  borderWidth: 1.8,
                  pointRadius: 0,
                  pointHoverRadius: 4,
                  yAxisID: 'yEvents',
                  order: 1
                }
              ]
            },
            options: {
              responsive: true,
              maintainAspectRatio: false,
              interaction: {
                mode: 'index',
                intersect: false,
              },
              plugins: {
                legend: {
                  display: false
                },
                tooltip: {
                  backgroundColor: '#0f172a',
                  titleColor: '#f8fafc',
                  bodyColor: '#cbd5e1',
                  borderColor: '#334155',
                  borderWidth: 1,
                  padding: 10,
                  boxPadding: 4,
                  callbacks: {
                    title: function(items) {
                      if (!items.length) return '';
                      const idx = items[0].dataIndex;
                      const r = chronData[idx];
                      return '📅 ' + r.date;
                    },
                    label: function(item) {
                      if (item.dataset.label.includes('Доход')) {
                        return item.dataset.label + ': $' + item.raw.toFixed(2);
                      }
                      return item.dataset.label + ': ' + item.raw;
                    }
                  }
                }
              },
              scales: {
                x: {
                  grid: {
                    color: 'rgba(51, 65, 85, 0.25)'
                  },
                  ticks: {
                    color: '#94a3b8',
                    font: { size: 10 },
                    maxRotation: 0,
                    autoSkip: true,
                    maxTicksLimit: 14
                  }
                },
                yVisits: {
                  type: 'linear',
                  position: 'left',
                  grid: {
                    color: 'rgba(51, 65, 85, 0.3)'
                  },
                  ticks: {
                    color: '#94a3b8',
                    font: { size: 10 }
                  },
                  title: {
                    display: true,
                    text: 'Клики',
                    color: '#64748b',
                    font: { size: 10 }
                  }
                },
                yEvents: {
                  type: 'linear',
                  position: 'right',
                  grid: {
                    drawOnChartArea: false
                  },
                  ticks: {
                    color: '#0084ff',
                    font: { size: 10 }
                  },
                  title: {
                    display: true,
                    text: 'Галочки / Потери / $',
                    color: '#0084ff',
                    font: { size: 10 }
                  }
                }
              }
            }
          });
        },

        exportCSV() {
          const recs = this.filteredRecords;
          if (!recs.length) {
            alert('Нет данных для экспорта');
            return;
          }

          const headers = ['Дата', 'Клики', 'Синие галочки', 'Рефералы $0.00', 'Потери', 'Доплаты $9.40', 'Доход ($)', 'Статус'];
          const rows = recs.map(r => [
            r.date,
            r.total_visits,
            r.blue_checkmarks,
            r.referrals_zero,
            r.missing_referrals,
            r.renewals_count,
            r.daily_earnings,
            r.missing_referrals > 0 ? 'Потеря: ' + r.missing_referrals : (r.blue_checkmarks > 0 ? 'Сходится' : 'Нет активности')
          ]);

          const csvContent = '\uFEFF' + [headers, ...rows].map(e => e.join(';')).join('\n');
          const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.setAttribute('href', url);
          link.setAttribute('download', 'creative-fabrica-analytics-' + (this.selectedMonth !== 'all' ? this.selectedMonth : this.selectedYear) + '.csv');
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
        }
      }
    }
  </script>
</body>
</html>
`;

fs.writeFileSync(OUTPUT_PATH, html, 'utf-8');
console.log('✓ Successfully wrote index.html (' + html.length + ' bytes) at:', OUTPUT_PATH);
