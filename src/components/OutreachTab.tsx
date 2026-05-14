'use client';

import { useState, useEffect } from 'react';
import { PipelineEntry, PipelineStage, Track, Settings, OutreachDraft, PIPELINE_STAGES, TRACKS, TRACK_COLORS, classifyTrack } from '@/lib/types';

interface Props {
  pipeline: PipelineEntry[];
  selectedJobId: string | null;
  onSelectJob: (id: string | null) => void;
  settings: Settings;
  onUpdateEntry: (id: string, updates: Partial<PipelineEntry>) => Promise<void>;
}

const inputClass = "w-full border border-gray-700 rounded-lg px-3 py-2 text-sm bg-gray-800 text-gray-200 placeholder-gray-600 focus:outline-none focus:ring-1 focus:ring-blue-500";

export default function OutreachTab({
  pipeline,
  selectedJobId,
  onSelectJob,
  onUpdateEntry,
}: Props) {
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [filterStage, setFilterStage] = useState<PipelineStage | 'All'>('All');
  const [filterTrack, setFilterTrack] = useState<Track | 'All'>('All');
  const [regenInstructions, setRegenInstructions] = useState('');

  const selectedJob = pipeline.find(e => e.id === selectedJobId) || null;

  const filteredPipeline = pipeline
    .filter(e => filterStage === 'All' || e.stage === filterStage)
    .filter(e => filterTrack === 'All' || (e.track ?? classifyTrack(e.title)) === filterTrack);

  useEffect(() => {
    if (!selectedJob) return;
    if (selectedJob.outreachDraft) {
      setSubject(selectedJob.outreachDraft.subject);
      setBody(selectedJob.outreachDraft.body);
    } else {
      setSubject('');
      setBody('');
    }
    setStatus(null);
    setRegenInstructions('');
  }, [selectedJobId]);

  const generate = async () => {
    if (!selectedJob) return;
    setIsGenerating(true);
    setStatus(null);
    try {
      const res = await fetch('/api/outreach', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          entry: selectedJob,
          instructions: regenInstructions.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Generation failed');
      setSubject(data.subject);
      setBody(data.body);
      setRegenInstructions('');
      const draft: OutreachDraft = { subject: data.subject, body: data.body, savedAt: new Date().toISOString() };
      await onUpdateEntry(selectedJob.id, { outreachDraft: draft });
    } catch (err: any) {
      setStatus(`Error: ${err.message}`);
    } finally {
      setIsGenerating(false);
    }
  };

  const copyEmail = () => {
    navigator.clipboard.writeText(`Subject: ${subject}\n\n${body}`);
    setStatus('Copied to clipboard');
    setTimeout(() => setStatus(null), 2000);
  };

  const markSent = async () => {
    if (!selectedJob) return;
    await onUpdateEntry(selectedJob.id, { stage: 'Outreach' });
    setStatus('Status updated to Outreach');
  };

  const hasDraft = !!(subject || body);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Job selector */}
      <div className="lg:col-span-1">
        {/* Stage filter */}
        <div className="mb-2 flex flex-wrap gap-1">
          {(['All', ...PIPELINE_STAGES] as const).map(s => (
            <button
              key={s}
              onClick={() => setFilterStage(s)}
              className={`px-2 py-0.5 rounded text-xs font-medium transition-colors ${
                filterStage === s
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-800 text-gray-500 hover:text-gray-300'
              }`}
            >
              {s}
            </button>
          ))}
        </div>

        {/* Track filter */}
        <div className="mb-3 flex flex-wrap gap-1">
          {(['All', ...TRACKS] as const).map(t => (
            <button
              key={t}
              onClick={() => setFilterTrack(t)}
              className={`px-2 py-0.5 rounded text-xs font-medium transition-colors ${
                filterTrack === t
                  ? t === 'All' ? 'bg-gray-600 text-white' : `${TRACK_COLORS[t as Track]} ring-1 ring-current`
                  : 'bg-gray-800 text-gray-500 hover:text-gray-300'
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        <div className="space-y-2 max-h-[calc(100vh-220px)] overflow-y-auto">
          {filteredPipeline.length === 0 ? (
            <p className="text-sm text-gray-600">No roles match this filter.</p>
          ) : (
            filteredPipeline.map(entry => (
              <button
                key={entry.id}
                onClick={() => onSelectJob(entry.id)}
                className={`w-full text-left px-3 py-2.5 rounded-lg border transition-colors ${
                  selectedJobId === entry.id
                    ? 'border-blue-500 bg-blue-900/20'
                    : 'border-gray-800 bg-gray-900 hover:bg-gray-800'
                }`}
              >
                <div className="font-medium text-sm text-gray-100 truncate">{entry.title}</div>
                <div className="text-xs text-gray-500 truncate">{entry.company}</div>
                <div className="text-xs text-gray-600 mt-0.5">{entry.stage}</div>
                {entry.outreachDraft?.savedAt && (
                  <div className="text-xs text-green-400 mt-0.5">✓ Draft saved</div>
                )}
              </button>
            ))
          )}
        </div>
      </div>

      {/* Draft editor */}
      <div className="lg:col-span-2">
        {!selectedJob ? (
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-8 text-center text-gray-600 text-sm">
            Select a role to draft outreach
          </div>
        ) : (
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="font-semibold text-gray-100">{selectedJob.title}</h2>
                <p className="text-sm text-gray-500">{selectedJob.company} · {selectedJob.location}</p>
              </div>
              <button
                onClick={generate}
                disabled={isGenerating}
                className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-60 transition-colors"
              >
                {isGenerating ? (
                  <>
                    <span className="inline-block w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Drafting…
                  </>
                ) : hasDraft ? 'Regenerate' : 'Generate Draft'}
              </button>
            </div>

            {/* Regeneration instructions — shown once there's a draft */}
            {hasDraft && (
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1">
                  Regeneration instructions
                </label>
                <textarea
                  value={regenInstructions}
                  onChange={e => setRegenInstructions(e.target.value)}
                  rows={2}
                  placeholder='e.g. "Make it shorter and punchier" or "Focus more on my consulting background"'
                  className="w-full border border-gray-700 rounded-lg px-3 py-2 text-sm bg-gray-800 text-gray-200 placeholder-gray-600 resize-none focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
            )}

            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1">Subject</label>
              <input
                type="text"
                value={subject}
                onChange={e => setSubject(e.target.value)}
                placeholder="Subject line will appear here…"
                className={inputClass}
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1">Body</label>
              <textarea
                value={body}
                onChange={e => setBody(e.target.value)}
                rows={12}
                placeholder="Email body will appear here after generating…"
                className="w-full border border-gray-700 rounded-lg px-3 py-2 text-sm bg-gray-800 text-gray-200 placeholder-gray-600 resize-none focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              {body && (
                <p className="text-xs text-gray-600 mt-1">{body.split(/\s+/).filter(Boolean).length} words</p>
              )}
            </div>

            {status && (
              <p className={`text-xs font-medium ${status.startsWith('Error') ? 'text-red-400' : 'text-green-400'}`}>
                {status}
              </p>
            )}

            <div className="flex items-center gap-2 pt-1">
              <button
                onClick={copyEmail}
                disabled={!subject && !body}
                className="px-3 py-1.5 text-xs font-medium border border-gray-700 rounded-lg text-gray-300 hover:bg-gray-800 disabled:opacity-40 transition-colors"
              >
                Copy Email
              </button>
              <button
                onClick={markSent}
                className="px-3 py-1.5 text-xs font-medium border border-gray-700 rounded-lg text-gray-300 hover:bg-gray-800 transition-colors"
              >
                Mark Sent
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
