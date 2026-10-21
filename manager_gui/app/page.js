'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Header from '@/components/Header';
import NicheSelector from '@/components/NicheSelector';
import TabPipeline from '@/components/TabPipeline';
import TabHub from '@/components/TabHub';
import TabAuditor from '@/components/TabAuditor';
import TabPrompts from '@/components/TabPrompts';
import GitPullModal from '@/components/GitPullModal';
import GitPushModal from '@/components/GitPushModal';

import {
  Compass,
  LayoutGrid,
  ShieldCheck,
  FileText,
  Sparkles
} from 'lucide-react';

export default function HomePage() {
  const [niches, setNiches] = useState([]);
  const [loadingNiches, setLoadingNiches] = useState(true);
  const [selectedKey, setSelectedKey] = useState('');
  const [activeTab, setActiveTab] = useState('pipeline');
  const [isGitPullOpen, setIsGitPullOpen] = useState(false);
  const [isGitPushOpen, setIsGitPushOpen] = useState(false);
  const [nicheDetail, setNicheDetail] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  // Fetch niches list from API
  const fetchNiches = useCallback(async () => {
    try {
      setLoadingNiches(true);
      const res = await fetch('/api/niches');
      const data = await res.json();
      if (data.success && Array.isArray(data.niches)) {
        setNiches(data.niches);
        return data.niches;
      }
      return [];
    } catch (err) {
      console.error('Error fetching niches:', err);
      return [];
    } finally {
      setLoadingNiches(false);
    }
  }, []);

  // Initial load on mount
  useEffect(() => {
    let isMounted = true;
    fetchNiches().then((loadedNiches) => {
      if (!isMounted || loadedNiches.length === 0) return;
      setSelectedKey((prev) => {
        if (prev) return prev;
        const defaultNiche =
          loadedNiches.find(
            (n) => n.id === 'christmas/vintage_retro' || `${n.category}/${n.collection}` === 'christmas/vintage_retro'
          ) || loadedNiches[0];
        return defaultNiche ? defaultNiche.id || `${defaultNiche.category}/${defaultNiche.collection}` : '';
      });
    });

    return () => {
      isMounted = false;
    };
  }, [fetchNiches]);

  // Derived selected niche object
  const selectedNiche = useMemo(() => {
    if (!selectedKey) return null;
    return (
      niches.find(
        (n) => n.id === selectedKey || `${n.category}/${n.collection}` === selectedKey
      ) || null
    );
  }, [niches, selectedKey]);

  // Fetch niche detail when selectedKey or selectedNiche changes
  const fetchDetail = useCallback(async (cat, coll) => {
    if (!cat || !coll) {
      setNicheDetail(null);
      return;
    }
    try {
      setLoadingDetail(true);
      const params = new URLSearchParams({ category: cat, collection: coll });
      const res = await fetch(`/api/niche/detail?${params.toString()}`);
      const data = await res.json();
      if (data.success) {
        setNicheDetail(data);
      } else {
        setNicheDetail(null);
      }
    } catch (err) {
      console.error('Error fetching niche detail:', err);
      setNicheDetail(null);
    } finally {
      setLoadingDetail(false);
    }
  }, []);

  useEffect(() => {
    let cat = '';
    let coll = '';

    if (selectedNiche) {
      cat = selectedNiche.category;
      coll = selectedNiche.collection;
    } else if (selectedKey && selectedKey.includes('/')) {
      const parts = selectedKey.split('/');
      cat = parts[0];
      coll = parts[1];
    }

    if (cat && coll) {
      fetchDetail(cat, coll);
    } else {
      setNicheDetail(null);
    }
  }, [selectedKey, selectedNiche, fetchDetail]);

  // Handler for refreshing detail
  const handleRefreshDetail = useCallback(async () => {
    let cat = selectedNiche?.category;
    let coll = selectedNiche?.collection;
    if (!cat && selectedKey && selectedKey.includes('/')) {
      const parts = selectedKey.split('/');
      cat = parts[0];
      coll = parts[1];
    }
    if (cat && coll) {
      await fetchDetail(cat, coll);
      await fetchNiches();
    }
  }, [selectedNiche, selectedKey, fetchDetail, fetchNiches]);

  // Handler for initializing niche
  const handleInitNiche = useCallback(async (cat, coll, options = {}) => {
    try {
      const res = await fetch('/api/niche/init', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ category: cat, collection: coll, ...options })
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Ошибка при инициализации ниши');
      }

      // Refresh niches list and current niche detail
      await fetchNiches();
      await fetchDetail(cat, coll);
      return data;
    } catch (err) {
      console.error('Error initializing niche:', err);
      alert(err.message || 'Ошибка развертывания ниши');
      throw err;
    }
  }, [fetchNiches, fetchDetail]);

  // Handler for niche selection with optional tab switch
  const handleSelectNiche = useCallback((key, targetTab) => {
    setSelectedKey(key);
    if (targetTab) {
      setActiveTab(targetTab);
    }
  }, []);

  const TABS = [
    {
      id: 'pipeline',
      label: 'Штурман Ниши',
      icon: Compass,
      desc: 'Пошаговый пайплайн воронки'
    },
    {
      id: 'hub',
      label: 'Хаб Ниш',
      icon: LayoutGrid,
      desc: 'Каталог всех 40 ниш и статус'
    },
    {
      id: 'auditor',
      label: 'QA Аудитор',
      icon: ShieldCheck,
      desc: 'Автоматическая проверка таблиц'
    },
    {
      id: 'prompts',
      label: 'Банк Промптов',
      icon: FileText,
      desc: 'Контекстные шаблоны для AI'
    }
  ];

  return (
    <div className="min-h-screen bg-[#f8f9fa] text-slate-900 flex flex-col font-sans selection:bg-red-500/20">
      {/* Top Header */}
      <Header 
        onOpenGitPull={() => setIsGitPullOpen(true)} 
        onOpenGitPush={() => setIsGitPushOpen(true)}
      />

      {/* Main Body */}
      <main className="max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 space-y-6 flex-1">
        {/* Universal Niche Selector & Search Toolbar */}
        <NicheSelector
          niches={niches}
          selectedKey={selectedKey}
          onSelectNiche={(key) => handleSelectNiche(key)}
          onInitNiche={handleInitNiche}
          loading={loadingNiches}
        />

        {/* Navigation Tabs Bar */}
        <div className="bg-white border border-slate-200 rounded-xl p-1.5 shadow-sm">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
            {TABS.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;

              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center justify-center sm:justify-start gap-2.5 px-3.5 py-2.5 rounded-lg text-xs font-semibold transition-all cursor-pointer border ${
                    isActive
                      ? 'bg-red-50 text-[#E60023] border-red-200 shadow-xs'
                      : 'border-transparent text-slate-500 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  <Icon
                    className={`w-4 h-4 shrink-0 transition-colors ${
                      isActive ? 'text-[#E60023]' : 'text-slate-400'
                    }`}
                  />
                  <div className="truncate text-left">
                    <span className="block truncate">{tab.label}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Tab Contents */}
        <div className="transition-all duration-150">
          {activeTab === 'pipeline' && (
            <TabPipeline
              selectedNiche={selectedNiche}
              nicheDetail={nicheDetail}
              onRefreshDetail={handleRefreshDetail}
              onInitNiche={handleInitNiche}
              onSwitchTab={(tabId) => setActiveTab(tabId)}
            />
          )}

          {activeTab === 'hub' && (
            <TabHub
              niches={niches}
              onSelectNiche={(key) => handleSelectNiche(key, 'pipeline')}
              onInitNiche={handleInitNiche}
            />
          )}

          {activeTab === 'auditor' && (
            <TabAuditor
              selectedNiche={selectedNiche}
              onSelectNiche={(niche) =>
                handleSelectNiche(
                  niche?.id || (niche ? `${niche.category}/${niche.collection}` : '')
                )
              }
            />
          )}

          {activeTab === 'prompts' && (
            <TabPrompts selectedNiche={selectedNiche} />
          )}
        </div>
      </main>

      {/* Git Pull Modal */}
      <GitPullModal
        isOpen={isGitPullOpen}
        onClose={() => setIsGitPullOpen(false)}
      />

      {/* Git Push Modal */}
      <GitPushModal
        isOpen={isGitPushOpen}
        onClose={() => setIsGitPushOpen(false)}
      />
    </div>
  );
}
