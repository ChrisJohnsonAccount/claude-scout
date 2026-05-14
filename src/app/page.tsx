'use client';

import { useState, useEffect, useCallback } from 'react';
import Header from '@/components/Header';
import PipelineTab from '@/components/PipelineTab';
import OutreachTab from '@/components/OutreachTab';
import AnalyticsTab from '@/components/AnalyticsTab';
import SettingsTab from '@/components/SettingsTab';
import { PipelineEntry, PipelineStage, Settings, DEFAULT_SETTINGS, PIPELINE_STAGES } from '@/lib/types';

type Tab = 'pipeline' | 'outreach' | 'analytics' | 'settings';

const NAV: { id: Tab; label: string; icon: React.ReactNode }[] = [
  {
    id: 'pipeline',
    label: 'Pipeline',
    icon: (
      <svg viewBox="0 0 24 24" className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
        <rect x="8" y="2" width="8" height="4" rx="1" />
        <line x1="9" y1="12" x2="15" y2="12" />
        <line x1="9" y1="16" x2="13" y2="16" />
      </svg>
    ),
  },
  {
    id: 'outreach',
    label: 'Outreach',
    icon: (
      <svg viewBox="0 0 24 24" className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="4" width="20" height="16" rx="2" />
        <polyline points="2,6 12,14 22,6" />
      </svg>
    ),
  },
  {
    id: 'analytics',
    label: 'Analytics',
    icon: (
      <svg viewBox="0 0 24 24" className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <line x1="18" y1="20" x2="18" y2="9" />
        <line x1="12" y1="20" x2="12" y2="4" />
        <line x1="6"  y1="20" x2="6"  y2="14" />
        <line x1="2"  y1="20" x2="22" y2="20" />
      </svg>
    ),
  },
  {
    id: 'settings',
    label: 'Settings',
    icon: (
      <svg viewBox="0 0 24 24" className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="3" />
        <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
      </svg>
    ),
  },
];

export default function App() {
  const [activeTab, setActiveTab]       = useState<Tab>('pipeline');
  const [filterStage, setFilterStage]   = useState<PipelineStage | 'All'>('All');
  const [pipeline, setPipeline]         = useState<PipelineEntry[]>([]);
  const [settings, setSettings]         = useState<Settings>(DEFAULT_SETTINGS);
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const [isRunningDigest, setIsRunningDigest] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  };

  const loadPipeline = useCallback(async () => {
    const res = await fetch('/api/pipeline');
    if (res.ok) setPipeline(await res.json());
  }, []);

  const loadSettings = useCallback(async () => {
    const res = await fetch('/api/settings');
    if (res.ok) setSettings(await res.json());
  }, []);

  useEffect(() => {
    loadPipeline();
    loadSettings();
  }, [loadPipeline, loadSettings]);

  const runDigest = async () => {
    setIsRunningDigest(true);
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3 * 60 * 1000);
    try {
      const res = await fetch('/api/digest', { method: 'POST', signal: controller.signal });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Digest failed');
      await loadPipeline();
      await loadSettings();
      showToast(`Found ${data.newCount} new role${data.newCount !== 1 ? 's' : ''}`);
    } catch (err: any) {
      showToast(err.name === 'AbortError' ? 'Search timed out after 3 minutes' : err.message, 'error');
    } finally {
      clearTimeout(timeout);
      setIsRunningDigest(false);
    }
  };

  const updateEntry = useCallback(async (id: string, updates: Partial<PipelineEntry>) => {
    const res = await fetch(`/api/pipeline/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    if (res.ok) {
      const updated: PipelineEntry = await res.json();
      setPipeline(prev => prev.map(e => (e.id === id ? updated : e)));
    }
  }, []);

  const deleteEntry = useCallback(async (id: string) => {
    const res = await fetch(`/api/pipeline/${id}`, { method: 'DELETE' });
    if (res.ok) setPipeline(prev => prev.filter(e => e.id !== id));
  }, []);

  const addEntry = useCallback(async (entry: Omit<PipelineEntry, 'id' | 'addedDate'>) => {
    const res = await fetch('/api/pipeline', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(entry),
    });
    if (res.ok) {
      const newEntry: PipelineEntry = await res.json();
      setPipeline(prev => [newEntry, ...prev]);
    }
  }, []);

  const saveSettings = useCallback(async (newSettings: Settings) => {
    const res = await fetch('/api/settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newSettings),
    });
    if (res.ok) {
      setSettings(await res.json());
      showToast('Settings saved');
    }
  }, []);

  const openOutreach = useCallback((jobId: string) => {
    setSelectedJobId(jobId);
    setActiveTab('outreach');
  }, []);

  // Stage counts for sub-nav
  const stageCounts = PIPELINE_STAGES.reduce((acc, s) => {
    acc[s] = pipeline.filter(e => e.stage === s).length;
    return acc;
  }, {} as Record<PipelineStage, number>);

  return (
    <div className="min-h-screen bg-gray-950">
      <Header
        totalRoles={pipeline.length}
        isRunningDigest={isRunningDigest}
        onRunDigest={runDigest}
        lastRunAt={settings.lastDigestRun || null}
      />

      <div className="max-w-6xl mx-auto px-4 py-6 flex gap-6 items-start">
        {/* Left sidebar */}
        <aside className="w-44 shrink-0 sticky top-[72px]">
          <nav className="flex flex-col gap-0.5">
            {NAV.map(item => (
              <div key={item.id}>
                <button
                  onClick={() => setActiveTab(item.id)}
                  className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-medium transition-colors text-left ${
                    activeTab === item.id
                      ? 'bg-gray-800 text-white'
                      : 'text-gray-500 hover:text-gray-300 hover:bg-gray-800/60'
                  }`}
                >
                  {item.icon}
                  {item.label}
                </button>

                {/* Stage sub-nav — only under Pipeline when active */}
                {item.id === 'pipeline' && activeTab === 'pipeline' && (
                  <div className="mt-0.5 mb-1 flex flex-col gap-0.5">
                    <button
                      onClick={() => setFilterStage('All')}
                      className={`flex items-center justify-between w-full pl-11 pr-3 py-1.5 rounded-lg text-xs transition-colors ${
                        filterStage === 'All'
                          ? 'text-white font-medium'
                          : 'text-gray-600 hover:text-gray-400'
                      }`}
                    >
                      <span>All</span>
                      <span className="text-gray-600">{pipeline.length}</span>
                    </button>
                    {PIPELINE_STAGES.map(s => (
                      <button
                        key={s}
                        onClick={() => setFilterStage(s)}
                        className={`flex items-center justify-between w-full pl-11 pr-3 py-1.5 rounded-lg text-xs transition-colors ${
                          filterStage === s
                            ? 'text-white font-medium'
                            : 'text-gray-600 hover:text-gray-400'
                        }`}
                      >
                        <span>{s}</span>
                        <span className="text-gray-600">{stageCounts[s]}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </nav>
        </aside>

        {/* Main content */}
        <main className="flex-1 min-w-0">
          {activeTab === 'pipeline' && (
            <PipelineTab
              pipeline={pipeline}
              filterStage={filterStage}
              onUpdateEntry={updateEntry}
              onDeleteEntry={deleteEntry}
              onAddEntry={addEntry}
              onDraftOutreach={openOutreach}
            />
          )}
          {activeTab === 'outreach' && (
            <OutreachTab
              pipeline={pipeline}
              selectedJobId={selectedJobId}
              onSelectJob={setSelectedJobId}
              settings={settings}
              onUpdateEntry={updateEntry}
            />
          )}
          {activeTab === 'analytics' && <AnalyticsTab pipeline={pipeline} />}
          {activeTab === 'settings' && (
            <SettingsTab settings={settings} onSave={saveSettings} />
          )}
        </main>
      </div>

      {toast && (
        <div className={`fixed bottom-4 right-4 px-4 py-3 rounded-lg shadow-lg text-sm font-medium z-50 ${
          toast.type === 'error' ? 'bg-red-600 text-white' : 'bg-gray-800 text-gray-100'
        }`}>
          {toast.msg}
        </div>
      )}
    </div>
  );
}
