'use client';

import { useState, useRef } from 'react';
import { Settings, WorkModel, DigestFrequency } from '@/lib/types';

interface Props {
  settings: Settings;
  onSave: (settings: Settings) => Promise<void>;
}

const WORK_MODELS: WorkModel[] = ['In-office or hybrid', 'Remote'];
const FREQUENCIES: { value: DigestFrequency; label: string }[] = [
  { value: 'daily', label: 'Daily' },
  { value: 'every2days', label: 'Every 2 days' },
  { value: 'weekdays', label: 'Weekdays only' },
  { value: 'weekly', label: 'Weekly' },
];

const WEIGHT_LABELS: { key: keyof Settings['fitWeights']; label: string }[] = [
  { key: 'roleTypeMatch', label: 'Role Type Match' },
  { key: 'locationWorkModel', label: 'Location / Work Model' },
  { key: 'companySize', label: 'Company Size' },
  { key: 'salaryRange', label: 'Salary Range' },
  { key: 'keywordMatch', label: 'Keyword Match' },
];

const inputClass = "w-full border border-gray-700 rounded-lg px-3 py-2 text-sm bg-gray-800 text-gray-200 placeholder-gray-600 focus:outline-none focus:ring-1 focus:ring-blue-500";
const selectClass = "w-full border border-gray-700 rounded-lg px-3 py-2 text-sm bg-gray-800 text-gray-200 focus:outline-none focus:ring-1 focus:ring-blue-500";
const labelClass = "block text-xs font-medium text-gray-400 mb-1";
const sectionClass = "bg-gray-900 border border-gray-800 rounded-xl p-5 space-y-4";

export default function SettingsTab({ settings, onSave }: Props) {
  const [form, setForm] = useState<Settings>({ ...settings });
  const [saving, setSaving] = useState(false);
  const [newRoleType, setNewRoleType] = useState('');
  const newRoleInputRef = useRef<HTMLInputElement>(null);

  const set = (key: keyof Settings, value: any) => setForm(f => ({ ...f, [key]: value }));
  const setWeight = (key: keyof Settings['fitWeights'], value: number) =>
    setForm(f => ({ ...f, fitWeights: { ...f.fitWeights, [key]: value } }));

  const addRoleType = () => {
    const trimmed = newRoleType.trim();
    if (!trimmed || form.roleTypes.includes(trimmed)) return;
    setForm(f => ({ ...f, roleTypes: [...f.roleTypes, trimmed] }));
    setNewRoleType('');
    newRoleInputRef.current?.focus();
  };

  const removeRoleType = (role: string) => {
    setForm(f => ({ ...f, roleTypes: f.roleTypes.filter(r => r !== role) }));
  };

  const handleSave = async () => {
    setSaving(true);
    try { await onSave(form); } finally { setSaving(false); }
  };

  const totalWeight = Object.values(form.fitWeights).reduce((a, b) => a + b, 0) || 1;

  return (
    <div className="max-w-2xl space-y-6">
      {/* Search Criteria */}
      <section className={sectionClass}>
        <h2 className="font-semibold text-gray-100 text-sm">Search Criteria</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Location</label>
            <input type="text" value={form.location} onChange={e => set('location', e.target.value)} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Work Model</label>
            <select value={form.workModel} onChange={e => set('workModel', e.target.value as WorkModel)} className={selectClass}>
              {WORK_MODELS.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>
          <div>
            <label className={labelClass}>Min. Employees</label>
            <input type="number" value={form.minEmployees} onChange={e => set('minEmployees', Number(e.target.value))} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Jobs per Search</label>
            <select value={form.maxJobCount} onChange={e => set('maxJobCount', Number(e.target.value))} className={selectClass}>
              {[3, 5, 7].map(n => <option key={n} value={n}>{n} jobs</option>)}
            </select>
          </div>
          <div>
            <label className={labelClass}>Digest Schedule</label>
            <div className="flex gap-2">
              <select value={form.digestFrequency} onChange={e => set('digestFrequency', e.target.value as DigestFrequency)} className="flex-1 border border-gray-700 rounded-lg px-2 py-2 text-sm bg-gray-800 text-gray-200 focus:outline-none focus:ring-1 focus:ring-blue-500">
                {FREQUENCIES.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
              </select>
              <input type="time" value={form.digestTime} onChange={e => set('digestTime', e.target.value)} className="w-24 border border-gray-700 rounded-lg px-2 py-2 text-sm bg-gray-800 text-gray-200 focus:outline-none focus:ring-1 focus:ring-blue-500" />
            </div>
          </div>
        </div>
        <div>
          <label className={labelClass}>Include Keywords</label>
          <input type="text" value={form.keywords} onChange={e => set('keywords', e.target.value)} placeholder="e.g. AI, product, strategy" className={inputClass} />
        </div>
        <div>
          <label className={labelClass}>Exclude Keywords</label>
          <input type="text" value={form.exclusions} onChange={e => set('exclusions', e.target.value)} placeholder="e.g. internship, junior, entry-level" className={inputClass} />
        </div>
      </section>

      {/* Target Role Types */}
      <section className={sectionClass}>
        <h2 className="font-semibold text-gray-100 text-sm">Target Role Types</h2>
        <div className="flex flex-wrap gap-2">
          {form.roleTypes.map(role => (
            <span
              key={role}
              className="inline-flex items-center gap-1 pl-3 pr-1.5 py-1 rounded-full text-xs font-medium bg-blue-600/20 text-blue-300 border border-blue-700/40"
            >
              {role}
              <button
                onClick={() => removeRoleType(role)}
                className="text-blue-400 hover:text-white hover:bg-blue-600 rounded-full w-4 h-4 flex items-center justify-center text-[10px] leading-none transition-colors"
                aria-label={`Remove ${role}`}
              >
                ✕
              </button>
            </span>
          ))}
          {form.roleTypes.length === 0 && (
            <p className="text-xs text-gray-600">No role types added. Add one below.</p>
          )}
        </div>
        <div className="flex gap-2">
          <input
            ref={newRoleInputRef}
            type="text"
            value={newRoleType}
            onChange={e => setNewRoleType(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addRoleType())}
            placeholder="Add a role type…"
            className="flex-1 border border-gray-700 rounded-lg px-3 py-2 text-sm bg-gray-800 text-gray-200 placeholder-gray-600 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
          <button
            onClick={addRoleType}
            disabled={!newRoleType.trim()}
            className="px-3 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-40 transition-colors"
          >
            Add
          </button>
        </div>
      </section>

      {/* Fit Score Weights */}
      <section className={sectionClass}>
        <h2 className="font-semibold text-gray-100 text-sm">Fit Score Weights</h2>
        <div className="space-y-3">
          {WEIGHT_LABELS.map(({ key, label }) => (
            <div key={key}>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-medium text-gray-400">{label}</label>
                <span className="text-xs text-gray-500">
                  {form.fitWeights[key]} ({((form.fitWeights[key] / totalWeight) * 100).toFixed(0)}%)
                </span>
              </div>
              <input
                type="range" min={0} max={5} step={1}
                value={form.fitWeights[key]}
                onChange={e => setWeight(key, Number(e.target.value))}
                className="w-full accent-blue-500"
              />
            </div>
          ))}
        </div>
      </section>

      {/* Your Profile */}
      <section className={sectionClass}>
        <h2 className="font-semibold text-gray-100 text-sm">Your Profile</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Sender Name</label>
            <input type="text" value={form.senderName} onChange={e => set('senderName', e.target.value)} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Sender Email</label>
            <input type="email" value={form.senderEmail} onChange={e => set('senderEmail', e.target.value)} className={inputClass} />
          </div>
        </div>
        <div>
          <label className={labelClass}>Resume Summary</label>
          <textarea
            value={form.resumeSummary}
            onChange={e => set('resumeSummary', e.target.value)}
            rows={5}
            placeholder="Paste a 2-3 paragraph summary of your background. Used as context for outreach drafts."
            className="w-full border border-gray-700 rounded-lg px-3 py-2 text-sm bg-gray-800 text-gray-200 placeholder-gray-600 resize-none focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>
      </section>

      <button
        onClick={handleSave}
        disabled={saving}
        className="w-full py-2.5 text-sm font-medium bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-60 transition-colors"
      >
        {saving ? 'Saving…' : 'Save Settings'}
      </button>
    </div>
  );
}
