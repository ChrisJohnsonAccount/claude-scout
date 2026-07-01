'use client';

import { useState } from 'react';
import { PipelineEntry, PipelineStage, Track, WorkModel, ContactActivity, ContactMethod, fitScoreColor, STAGE_COLORS, PIPELINE_STAGES, TRACKS, TRACK_COLORS, classifyTrack } from '@/lib/types';

const CONTACT_METHODS: ContactMethod[] = ['Email', 'LinkedIn', 'Cell'];

function ContactsSection({ contacts, onSave }: {
  contacts: ContactActivity[];
  onSave: (contacts: ContactActivity[]) => void;
}) {
  const [rows, setRows] = useState<ContactActivity[]>(contacts);
  const [editingId, setEditingId] = useState<string | null>(null);

  const inputClass = "w-full border border-gray-700 rounded px-2 py-1 text-xs bg-gray-900 text-gray-200 placeholder-gray-600 focus:outline-none focus:ring-1 focus:ring-blue-500";

  const addContact = () => {
    const newRow: ContactActivity = {
      id: crypto.randomUUID(),
      contactName: '',
      contactTitle: '',
      lastContactDate: '',
      method: 'Email',
      notes: '',
    };
    const updated = [...rows, newRow];
    setRows(updated);
    setEditingId(newRow.id);
  };

  const updateField = (id: string, field: keyof ContactActivity, value: string) => {
    setRows(r => r.map(c => c.id === id ? { ...c, [field]: value } : c));
  };

  const saveRow = (currentRows: ContactActivity[]) => {
    setEditingId(null);
    onSave(currentRows);
  };

  const deleteRow = (id: string) => {
    const updated = rows.filter(c => c.id !== id);
    setRows(updated);
    onSave(updated);
  };

  return (
    <div>
      <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Contacts &amp; Activity</h3>

      {rows.length > 0 && (
        <div className="space-y-2 mb-2">
          {rows.map(contact => (
            editingId === contact.id ? (
              <div key={contact.id} className="bg-gray-800/60 border border-gray-700 rounded-lg p-3 space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs text-gray-500 mb-0.5">Contact Name</label>
                    <input
                      type="text"
                      value={contact.contactName}
                      onChange={e => updateField(contact.id, 'contactName', e.target.value)}
                      placeholder="Jane Smith"
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-0.5">Contact Title</label>
                    <input
                      type="text"
                      value={contact.contactTitle}
                      onChange={e => updateField(contact.id, 'contactTitle', e.target.value)}
                      placeholder="Hiring Manager"
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-0.5">Last Contact Date</label>
                    <input
                      type="date"
                      value={contact.lastContactDate}
                      onChange={e => updateField(contact.id, 'lastContactDate', e.target.value)}
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-0.5">Method</label>
                    <select
                      value={contact.method}
                      onChange={e => updateField(contact.id, 'method', e.target.value as ContactMethod)}
                      className={inputClass}
                    >
                      {CONTACT_METHODS.map(m => <option key={m} value={m}>{m}</option>)}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-0.5">Notes</label>
                  <textarea
                    value={contact.notes}
                    onChange={e => updateField(contact.id, 'notes', e.target.value)}
                    rows={2}
                    placeholder="Details about the exchange…"
                    className={`${inputClass} resize-none`}
                  />
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => saveRow(rows)}
                    className="text-xs px-2.5 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                  >
                    Save
                  </button>
                  <button
                    onClick={() => { if (editingId && rows.find(c => c.id === editingId && !c.contactName && !c.contactTitle)) { deleteRow(contact.id); } else { setEditingId(null); } }}
                    className="text-xs px-2.5 py-1 border border-gray-700 text-gray-400 rounded hover:text-gray-200 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => deleteRow(contact.id)}
                    className="text-xs text-red-500 hover:text-red-400 ml-auto"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ) : (
              <div key={contact.id} className="bg-gray-800/40 border border-gray-700/60 rounded-lg px-3 py-2">
                <div className="flex items-start gap-2">
                  <div className="flex-1 grid grid-cols-4 gap-x-3 gap-y-0.5">
                    <div>
                      <span className="block text-gray-500 text-[10px] uppercase tracking-wide">Name</span>
                      <span className="text-xs text-gray-200">{contact.contactName || <span className="text-gray-600">—</span>}</span>
                    </div>
                    <div>
                      <span className="block text-gray-500 text-[10px] uppercase tracking-wide">Title</span>
                      <span className="text-xs text-gray-200">{contact.contactTitle || <span className="text-gray-600">—</span>}</span>
                    </div>
                    <div>
                      <span className="block text-gray-500 text-[10px] uppercase tracking-wide">Last Contact</span>
                      <span className="text-xs text-gray-200">{contact.lastContactDate || <span className="text-gray-600">—</span>}</span>
                    </div>
                    <div>
                      <span className="block text-gray-500 text-[10px] uppercase tracking-wide">Method</span>
                      <span className="text-xs text-gray-200">{contact.method}</span>
                    </div>
                    {contact.notes && (
                      <div className="col-span-4 mt-1">
                        <span className="block text-gray-500 text-[10px] uppercase tracking-wide">Notes</span>
                        <span className="text-xs text-gray-400">{contact.notes}</span>
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => setEditingId(contact.id)}
                    className="text-xs text-blue-400 hover:text-blue-300 flex-shrink-0 mt-0.5"
                  >
                    Edit
                  </button>
                </div>
              </div>
            )
          ))}
        </div>
      )}

      <button
        onClick={addContact}
        className="text-xs px-2.5 py-1 border border-dashed border-gray-600 text-gray-400 rounded hover:border-gray-400 hover:text-gray-200 transition-colors"
      >
        + Add Contact &amp; Activity
      </button>
    </div>
  );
}

const WORK_MODELS: WorkModel[] = ['In-office or hybrid', 'Remote'];

const CSV_HEADERS = [
  'ID', 'Title', 'Company', 'Location', 'Work Model', 'Employee Count',
  'Salary', 'URL', 'Posted Date', 'Added Date', 'Stage', 'Track', 'Fit Score',
  'Fit Reason', 'Snippet', 'Notes', 'Source',
];

function exportToCSV(entries: PipelineEntry[]) {
  const escape = (v: any) => `"${String(v ?? '').replace(/"/g, '""')}"`;
  const rows = entries.map(e => [
    e.id, e.title, e.company, e.location, e.workModel, e.employeeCount,
    e.salary, e.url, e.posted, e.addedDate, e.stage, e.track ?? '', e.fitScore,
    e.fitReason, e.snippet, e.notes, e.source,
  ].map(escape).join(','));
  const csv = [CSV_HEADERS.join(','), ...rows].join('\n');
  const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' }));
  const a = document.createElement('a');
  a.href = url;
  a.download = `job-pipeline-${new Date().toISOString().split('T')[0]}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

interface Props {
  pipeline: PipelineEntry[];
  filterStage: PipelineStage | 'All';
  onUpdateEntry: (id: string, updates: Partial<PipelineEntry>) => Promise<void>;
  onDeleteEntry: (id: string) => Promise<void>;
  onAddEntry: (entry: Omit<PipelineEntry, 'id' | 'addedDate'>) => Promise<void>;
  onDraftOutreach: (jobId: string) => void;
}

function RoleCard({ entry, onUpdate, onDelete, onDraftOutreach }: {
  entry: PipelineEntry;
  onUpdate: (updates: Partial<PipelineEntry>) => void;
  onDelete: () => void;
  onDraftOutreach: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [notes, setNotes] = useState(entry.notes);

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-lg overflow-hidden">
      <button
        className="w-full text-left px-4 py-3 hover:bg-gray-800/50 transition-colors"
        onClick={() => setExpanded(e => !e)}
      >
        <div className="flex items-start gap-3">
          <span className={`mt-0.5 flex-shrink-0 inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold ${fitScoreColor(entry.fitScore)}`}>
            {entry.fitScore}/10
          </span>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              {entry.url ? (
                <a
                  href={entry.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={e => e.stopPropagation()}
                  className="font-medium text-blue-300 hover:text-blue-200 hover:underline text-sm"
                >
                  {entry.title}
                </a>
              ) : (
                <span className="font-medium text-gray-100 text-sm">{entry.title}</span>
              )}
              <span className="text-gray-500 text-sm">· {entry.company}</span>
              <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${STAGE_COLORS[entry.stage]}`}>
                {entry.stage}
              </span>
              {entry.track && (
                <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${TRACK_COLORS[entry.track]}`}>
                  {entry.track}
                </span>
              )}
            </div>
            <div className="text-xs text-gray-500 mt-0.5 flex items-center gap-2">
              <span>{entry.location}</span>
              <span>·</span>
              <span>{entry.workModel}</span>
              {entry.salary && <><span>·</span><span>{entry.salary}</span></>}
              {entry.posted && <><span>·</span><span>Posted {entry.posted}</span></>}
            </div>
          </div>
          <span className="text-gray-600 text-xs flex-shrink-0">{expanded ? '▲' : '▼'}</span>
        </div>
      </button>

      {expanded && (
        <div className="px-4 pb-4 border-t border-gray-800 pt-3 space-y-3">
          {entry.snippet && (
            <p className="text-sm text-gray-400">{entry.snippet}</p>
          )}
          {entry.fitReason && (
            <p className="text-xs text-gray-500 italic">Fit: {entry.fitReason}</p>
          )}

          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-2">
              <label className="text-xs text-gray-500 font-medium">Stage:</label>
              <select
                value={entry.stage}
                onChange={e => onUpdate({ stage: e.target.value as PipelineStage })}
                className="text-xs border border-gray-700 rounded px-2 py-1 bg-gray-800 text-gray-200"
              >
                {PIPELINE_STAGES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div className="flex items-center gap-2">
              <label className="text-xs text-gray-500 font-medium">Track:</label>
              <select
                value={entry.track ?? classifyTrack(entry.title)}
                onChange={e => onUpdate({ track: e.target.value as Track })}
                className="text-xs border border-gray-700 rounded px-2 py-1 bg-gray-800 text-gray-200"
              >
                {TRACKS.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="text-xs text-gray-500 font-medium block mb-1">Notes</label>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              onBlur={() => notes !== entry.notes && onUpdate({ notes })}
              rows={2}
              className="w-full text-sm border border-gray-700 rounded px-2 py-1.5 resize-none bg-gray-800 text-gray-200 placeholder-gray-600 focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="Add notes…"
            />
          </div>

          <div className="border-t border-gray-800 pt-3">
            <ContactsSection
              contacts={entry.contacts ?? []}
              onSave={contacts => onUpdate({ contacts })}
            />
          </div>

          <div className="flex items-center gap-2 flex-wrap pt-1">
            <button
              onClick={onDraftOutreach}
              className="text-xs px-2.5 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
            >
              Draft Outreach
            </button>
            {entry.outreachDraft?.savedAt && (
              <span className="text-xs text-green-400 font-medium">✓ Draft saved</span>
            )}
            <button
              onClick={() => { if (confirm(`Remove ${entry.title} at ${entry.company}?`)) onDelete(); }}
              className="text-xs text-red-500 hover:text-red-400 ml-auto"
            >
              Remove
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function AddRoleModal({ onAdd, onClose }: {
  onAdd: (entry: Omit<PipelineEntry, 'id' | 'addedDate'>) => Promise<void>;
  onClose: () => void;
}) {
  const [form, setForm] = useState({
    title: '', company: '', location: '', workModel: 'In-office or hybrid' as WorkModel,
    employeeCount: '', salary: '', url: '', posted: '', snippet: '',
    fitScore: 5, fitReason: '', notes: '', stage: 'New' as PipelineStage,
    track: 'Individual Contributor' as Track, source: 'manual' as const,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title || !form.company) return;
    await onAdd(form);
    onClose();
  };

  const inputClass = "w-full border border-gray-700 rounded px-2.5 py-1.5 text-sm bg-gray-800 text-gray-200 placeholder-gray-600 focus:outline-none focus:ring-1 focus:ring-blue-500";

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 border border-gray-700 rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="p-4 border-b border-gray-800 flex items-center justify-between">
          <h2 className="font-semibold text-gray-100">Add Role</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-300">✕</button>
        </div>
        <form onSubmit={handleSubmit} className="p-4 space-y-3">
          {[
            { label: 'Job Title *', key: 'title', onChangeSideEffect: (v: string) => setForm(f => ({ ...f, track: classifyTrack(v) })) },
            { label: 'Company *', key: 'company' },
            { label: 'Location', key: 'location' },
            { label: 'Salary', key: 'salary' },
            { label: 'Job Posting URL', key: 'url' },
          ].map(({ label, key, onChangeSideEffect }: any) => (
            <div key={key}>
              <label className="block text-xs font-medium text-gray-400 mb-1">{label}</label>
              <input
                type="text"
                value={(form as any)[key]}
                onChange={e => { setForm(f => ({ ...f, [key]: e.target.value })); onChangeSideEffect?.(e.target.value); }}
                className={inputClass}
              />
            </div>
          ))}
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1">Work Model</label>
            <select
              value={form.workModel}
              onChange={e => setForm(f => ({ ...f, workModel: e.target.value as WorkModel }))}
              className="w-full border border-gray-700 rounded px-2.5 py-1.5 text-sm bg-gray-800 text-gray-200"
            >
              {WORK_MODELS.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1">Track</label>
            <select
              value={form.track}
              onChange={e => setForm(f => ({ ...f, track: e.target.value as Track }))}
              className="w-full border border-gray-700 rounded px-2.5 py-1.5 text-sm bg-gray-800 text-gray-200"
            >
              {TRACKS.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1">Fit Score (1–10)</label>
            <input
              type="number" min={1} max={10}
              value={form.fitScore}
              onChange={e => setForm(f => ({ ...f, fitScore: Number(e.target.value) }))}
              className="w-24 border border-gray-700 rounded px-2.5 py-1.5 text-sm bg-gray-800 text-gray-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1">Description</label>
            <textarea
              value={form.snippet}
              onChange={e => setForm(f => ({ ...f, snippet: e.target.value }))}
              rows={3}
              className="w-full border border-gray-700 rounded px-2.5 py-1.5 text-sm bg-gray-800 text-gray-200 resize-none focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
          <div className="flex gap-2 pt-2">
            <button type="button" onClick={onClose} className="flex-1 px-3 py-2 text-sm border border-gray-700 rounded-lg text-gray-300 hover:bg-gray-800">Cancel</button>
            <button type="submit" className="flex-1 px-3 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700">Add Role</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function PipelineTab({ pipeline, filterStage, onUpdateEntry, onDeleteEntry, onAddEntry, onDraftOutreach }: Props) {
  const [showAddModal, setShowAddModal] = useState(false);
  const [filterTrack, setFilterTrack] = useState<Track | 'All'>('All');

  const filtered = pipeline
    .filter(e => filterStage === 'All' || e.stage === filterStage)
    .filter(e => filterTrack === 'All' || (e.track ?? classifyTrack(e.title)) === filterTrack);

  return (
    <div className="space-y-4">
      {/* Track filter */}
      <div className="flex flex-wrap gap-1">
        {(['All', ...TRACKS] as const).map(t => (
          <button
            key={t}
            onClick={() => setFilterTrack(t)}
            className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
              filterTrack === t
                ? t === 'All' ? 'bg-gray-600 text-white' : `${TRACK_COLORS[t as Track]} ring-1 ring-current`
                : 'bg-gray-800 text-gray-500 hover:text-gray-300'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Toolbar */}
      <div className="flex items-center justify-end gap-2">
        <button
          onClick={() => exportToCSV(filtered)}
          disabled={filtered.length === 0}
          className="px-3 py-1.5 text-xs font-medium bg-gray-900 border border-gray-700 rounded-lg hover:bg-gray-800 text-gray-300 disabled:opacity-40"
        >
          Export CSV
        </button>
        <button
          onClick={() => setShowAddModal(true)}
          className="px-3 py-1.5 text-xs font-medium bg-gray-900 border border-gray-700 rounded-lg hover:bg-gray-800 text-gray-300"
        >
          + Add Role
        </button>
      </div>

      {/* Role list */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 text-gray-600 text-sm">
          {pipeline.length === 0
            ? 'No roles yet. Click "Run Now" to find jobs, or add one manually.'
            : `No roles with stage "${filterStage}".`}
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(entry => (
            <RoleCard
              key={entry.id}
              entry={entry}
              onUpdate={updates => onUpdateEntry(entry.id, updates)}
              onDelete={() => onDeleteEntry(entry.id)}
              onDraftOutreach={() => onDraftOutreach(entry.id)}
            />
          ))}
        </div>
      )}

      {showAddModal && (
        <AddRoleModal onAdd={onAddEntry} onClose={() => setShowAddModal(false)} />
      )}
    </div>
  );
}
