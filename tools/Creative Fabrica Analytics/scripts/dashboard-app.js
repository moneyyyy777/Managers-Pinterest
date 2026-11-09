// Linear-inspired Creative Fabrica Analytics Dashboard Logic

function dashboardApp() {
  return {
    // State
    isDark: true,
    records: [],
    selectedYear: '2026',
    selectedMonth: '2026-11', // Defaults to November 2026 for instant inspection
    onlyLosses: false,
    searchQuery: '',
    sortField: 'date',
    sortAsc: false,
    chartInstance: null,
    isRefreshing: false,

    // Lifecycle
    initDashboard() {
      // Theme init
      const savedTheme = localStorage.getItem('cf_dashboard_theme');
      if (savedTheme) {
        this.isDark = savedTheme === 'dark';
      } else {
        this.isDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
      }
      this.applyTheme();

      // Load data
      this.loadInitialData();

      // Watchers for Chart updates
      this.$watch('selectedYear', () => this.refreshView());
      this.$watch('selectedMonth', () => this.refreshView());
      this.$watch('onlyLosses', () => this.refreshView());
      this.$watch('searchQuery', () => this.refreshView());
      this.$watch('isDark', () => {
        this.applyTheme();
        this.renderChart();
      });

      this.$nextTick(() => {
        this.renderChart();
      });
    },

    toggleTheme() {
      this.isDark = !this.isDark;
      localStorage.setItem('cf_dashboard_theme', this.isDark ? 'dark' : 'light');
      this.applyTheme();
    },

    applyTheme() {
      const html = document.documentElement;
      if (this.isDark) {
        html.classList.add('dark');
      } else {
        html.classList.remove('dark');
      }
    },

    loadInitialData() {
      // 1. External window object from analytics-daily.js
      if (window.CREATIVE_FABRICA_DATA && Array.isArray(window.CREATIVE_FABRICA_DATA) && window.CREATIVE_FABRICA_DATA.length > 0) {
        this.records = window.CREATIVE_FABRICA_DATA;
        console.log('[CF Analytics] Loaded from window.CREATIVE_FABRICA_DATA:', this.records.length);
        return;
      }

      // 2. Inlined fallback dataset
      if (window.__CF_EMBEDDED_DATA__ && Array.isArray(window.__CF_EMBEDDED_DATA__)) {
        this.records = window.__CF_EMBEDDED_DATA__;
        console.log('[CF Analytics] Loaded from window.__CF_EMBEDDED_DATA__:', this.records.length);
        return;
      }

      // 3. Script tag fallback
      try {
        const el = document.getElementById('cf-raw-data');
        if (el && el.textContent) {
          this.records = JSON.parse(el.textContent);
          console.log('[CF Analytics] Loaded from script tag #cf-raw-data:', this.records.length);
        }
      } catch (e) {
        console.error('[CF Analytics] Failed to parse embedded script tag:', e);
        this.records = [];
      }
    },

    async reloadData() {
      this.isRefreshing = true;
      try {
        const paths = ['data/reports/analytics-daily.json', '../data/reports/analytics-daily.json'];
        for (const p of paths) {
          try {
            const res = await fetch(p + '?t=' + Date.now());
            if (res.ok) {
              const fresh = await res.json();
              if (Array.isArray(fresh) && fresh.length > 0) {
                this.records = fresh;
                console.log('[CF Analytics] Reloaded via fetch from', p, fresh.length);
                break;
              }
            }
          } catch (_) {}
        }
      } catch (err) {
        console.warn('Live fetch not available (running locally via file://)');
      } finally {
        setTimeout(() => {
          this.isRefreshing = false;
          this.renderChart();
        }, 300);
      }
    },

    refreshView() {
      this.$nextTick(() => {
        this.renderChart();
      });
    },

    // Available years computed
    get availableYears() {
      const set = new Set();
      this.records.forEach(r => {
        if (r.date && r.date.length >= 4) {
          set.add(r.date.slice(0, 4));
        }
      });
      return Array.from(set).sort().reverse();
    },

    // Available months list for active year
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
        const matching = this.records.filter(r => r.date && r.date.startsWith(ymd));
        const visits = matching.reduce((s, r) => s + (r.total_visits || 0), 0);
        const losses = matching.reduce((s, r) => s + (r.missing_referrals || 0), 0);
        const earnings = matching.reduce((s, r) => s + (r.daily_earnings || 0), 0);
        const blue = matching.reduce((s, r) => s + (r.blue_checkmarks || 0), 0);

        return {
          id: ymd,
          name: m.name,
          shortName: m.shortName,
          hasData: matching.length > 0,
          daysCount: matching.length,
          visits,
          losses,
          earnings,
          blue
        };
      });
    },

    setYear(year) {
      this.selectedYear = year;
      // Auto-select latest active month for this year
      if (year === '2026') {
        this.selectedMonth = '2026-11';
      } else if (year === '2025') {
        this.selectedMonth = '2025-12';
      } else if (year === '2024') {
        this.selectedMonth = '2024-12';
      } else {
        this.selectedMonth = 'all';
      }
    },

    setMonth(monthId) {
      this.selectedMonth = monthId;
    },

    resetMonthToAll() {
      this.selectedMonth = 'all';
    },

    // Filtered records pipeline
    get filteredRecords() {
      let list = [...this.records];

      // 1. Filter Year
      if (this.selectedYear !== 'all') {
        list = list.filter(r => r.date && r.date.startsWith(this.selectedYear));
      }

      // 2. Filter Month
      if (this.selectedMonth !== 'all') {
        list = list.filter(r => r.date && r.date.startsWith(this.selectedMonth));
      }

      // 3. Filter Losses Only
      if (this.onlyLosses) {
        list = list.filter(r => (r.missing_referrals || 0) > 0);
      }

      // 4. Search Query (Date matching e.g. "2026-11-05" or "11-05")
      if (this.searchQuery && this.searchQuery.trim()) {
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

    // Upper 5 KPI Cards Calculation
    get kpis() {
      const recs = this.filteredRecords;
      const totalVisits = recs.reduce((acc, r) => acc + (r.total_visits || 0), 0);
      const blueCheckmarks = recs.reduce((acc, r) => acc + (r.blue_checkmarks || 0), 0);
      const referralsZero = recs.reduce((acc, r) => acc + (r.referrals_zero || 0), 0);
      const renewalsCount = recs.reduce((acc, r) => acc + (r.renewals_count || 0), 0);
      const dailyEarnings = recs.reduce((acc, r) => acc + (r.daily_earnings || 0), 0);
      const missingReferrals = recs.reduce((acc, r) => acc + (r.missing_referrals || 0), 0);
      
      const cr = totalVisits > 0 ? ((blueCheckmarks / totalVisits) * 100).toFixed(2) : '0.00';
      const lossDays = recs.filter(r => (r.missing_referrals || 0) > 0).length;

      return {
        totalVisits,
        blueCheckmarks,
        referralsZero,
        renewalsCount,
        dailyEarnings,
        missingReferrals,
        cr,
        lossDays,
        daysCount: recs.length
      };
    },

    get selectedPeriodTitle() {
      if (this.selectedMonth !== 'all') {
        const [y, m] = this.selectedMonth.split('-');
        const names = ['Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь', 'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'];
        const mIdx = parseInt(m, 10) - 1;
        return (names[mIdx] || m) + ' ' + y;
      }
      if (this.selectedYear !== 'all') {
        return 'Весь ' + this.selectedYear + ' год';
      }
      return 'Все годы (2024–2026)';
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
      if (num === null || num === undefined) return '0';
      return new Intl.NumberFormat('ru-RU').format(num);
    },

    formatCurrency(num) {
      if (num === null || num === undefined) return '0.00';
      return Number(num).toFixed(2);
    },

    formatDayOfWeek(ymd) {
      if (!ymd) return '';
      const days = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'];
      const d = new Date(ymd + 'T12:00:00');
      return days[d.getDay()] || '';
    },

    // Render interactive linear line chart
    renderChart() {
      const canvas = document.getElementById('cfChart');
      if (!canvas) return;

      const chronData = [...this.filteredRecords].sort((a, b) => a.date.localeCompare(b.date));
      const labels = chronData.map(d => {
        const parts = d.date.split('-');
        return parts[1] + '/' + parts[2];
      });

      const visits = chronData.map(d => d.total_visits || 0);
      const blue = chronData.map(d => d.blue_checkmarks || 0);
      const zeroes = chronData.map(d => d.referrals_zero || 0);
      const losses = chronData.map(d => d.missing_referrals || 0);
      const earnings = chronData.map(d => d.daily_earnings || 0);

      if (this.chartInstance) {
        this.chartInstance.destroy();
      }

      const isDark = this.isDark;
      const gridColor = isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.06)';
      const textColor = isDark ? '#94a3b8' : '#64748b';

      this.chartInstance = new Chart(canvas, {
        type: 'line',
        data: {
          labels: labels,
          datasets: [
            {
              label: 'Клики (Визиты)',
              data: visits,
              borderColor: isDark ? '#64748b' : '#94a3b8',
              backgroundColor: isDark ? 'rgba(100, 116, 139, 0.08)' : 'rgba(148, 163, 184, 0.12)',
              borderWidth: 2,
              pointRadius: chronData.length > 40 ? 0 : 3,
              pointHoverRadius: 5,
              tension: 0.3,
              fill: true,
              yAxisID: 'yClicks',
              order: 4
            },
            {
              label: 'Синие галочки',
              data: blue,
              borderColor: '#0284c7',
              backgroundColor: 'rgba(2, 132, 199, 0.12)',
              borderWidth: 2.2,
              pointRadius: chronData.length > 40 ? 0 : 3,
              pointHoverRadius: 5,
              tension: 0.3,
              yAxisID: 'yConversions',
              order: 2
            },
            {
              label: 'Триалы $0.00',
              data: zeroes,
              borderColor: '#8b5cf6',
              borderDash: [3, 3],
              borderWidth: 1.8,
              pointRadius: 0,
              pointHoverRadius: 4,
              tension: 0.3,
              yAxisID: 'yConversions',
              order: 3
            },
            {
              label: 'Потери (Галочки - $0.00)',
              data: losses,
              type: 'bar',
              backgroundColor: '#f43f5e',
              borderColor: '#e11d48',
              borderWidth: 1,
              borderRadius: 4,
              yAxisID: 'yConversions',
              order: 1
            },
            {
              label: 'Доход ($)',
              data: earnings,
              borderColor: '#10b981',
              borderDash: [5, 4],
              borderWidth: 2,
              pointRadius: 0,
              pointHoverRadius: 4,
              yAxisID: 'yConversions',
              order: 2
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          interaction: {
            mode: 'index',
            intersect: false
          },
          plugins: {
            legend: {
              display: false
            },
            tooltip: {
              backgroundColor: isDark ? 'rgba(15, 23, 42, 0.95)' : 'rgba(255, 255, 255, 0.95)',
              titleColor: isDark ? '#f8fafc' : '#0f172a',
              bodyColor: isDark ? '#cbd5e1' : '#334155',
              borderColor: isDark ? '#334155' : '#e2e8f0',
              borderWidth: 1,
              padding: 12,
              boxPadding: 4,
              usePointStyle: true,
              callbacks: {
                title: function(items) {
                  if (!items.length) return '';
                  const idx = items[0].dataIndex;
                  const item = chronData[idx];
                  return '📅 ' + item.date;
                },
                label: function(ctx) {
                  const lbl = ctx.dataset.label || '';
                  if (lbl.includes('Доход')) {
                    return lbl + ': $' + Number(ctx.raw).toFixed(2);
                  }
                  return lbl + ': ' + ctx.raw;
                }
              }
            }
          },
          scales: {
            x: {
              grid: {
                color: gridColor
              },
              ticks: {
                color: textColor,
                font: { size: 10, family: 'Inter' },
                maxRotation: 0,
                autoSkip: true,
                maxTicksLimit: 14
              }
            },
            yClicks: {
              type: 'linear',
              position: 'left',
              grid: {
                color: gridColor
              },
              ticks: {
                color: textColor,
                font: { size: 10, family: 'Inter' }
              },
              title: {
                display: true,
                text: 'Клики (Визиты)',
                color: textColor,
                font: { size: 10 }
              }
            },
            yConversions: {
              type: 'linear',
              position: 'right',
              grid: {
                drawOnChartArea: false
              },
              ticks: {
                color: '#0284c7',
                font: { size: 10, family: 'Inter' }
              },
              title: {
                display: true,
                text: 'Конверсии / Потери / $',
                color: '#0284c7',
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

      const headers = ['Дата', 'Клики', 'Синие галочки', 'Рефералы $0.00', 'Потери', 'Продления', 'Доход ($)', 'Статус'];
      const rows = recs.map(r => [
        r.date,
        r.total_visits,
        r.blue_checkmarks,
        r.referrals_zero,
        r.missing_referrals,
        r.renewals_count,
        r.daily_earnings,
        r.missing_referrals > 0 ? ('Потеря: -' + r.missing_referrals) : (r.blue_checkmarks > 0 ? 'Сходится' : '—')
      ]);

      const csvLines = [headers.join(';')];
      rows.forEach(r => csvLines.push(r.join(';')));
      const csvString = '\uFEFF' + csvLines.join('\r\n');

      const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', 'creative-fabrica-report-' + (this.selectedMonth !== 'all' ? this.selectedMonth : this.selectedYear) + '.csv');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };
}
