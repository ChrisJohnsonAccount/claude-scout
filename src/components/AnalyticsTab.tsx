'use client';

import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  Cell, LineChart, Line, CartesianGrid, LabelList,
} from 'recharts';
import { PipelineEntry, PIPELINE_STAGES } from '@/lib/types';

const TOOLTIP_STYLE = { backgroundColor: '#1f2937', border: '1px solid #374151', color: '#e5e7eb', fontSize: 12 };
const AXIS_TICK = { fill: '#6b7280', fontSize: 11 };
const GRID_COLOR = '#1f2937';

interface Props {
  pipeline: PipelineEntry[];
}

function getWeekKey(iso: string): string {
  const d = new Date(iso);
  const monday = new Date(d);
  monday.setDate(d.getDate() - ((d.getDay() + 6) % 7));
  return monday.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function ChartCard({ title, children, empty }: { title: string; children: React.ReactNode; empty?: boolean }) {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
      <h3 className="text-sm font-semibold text-gray-300 mb-4">{title}</h3>
      {empty ? (
        <div className="h-40 flex items-center justify-center text-gray-600 text-xs">
          Not enough data yet
        </div>
      ) : children}
    </div>
  );
}

// Truncate long company names for axis labels
function truncate(str: string, n = 18) {
  return str.length > n ? str.slice(0, n - 1) + '…' : str;
}

export default function AnalyticsTab({ pipeline }: Props) {

  // ── Pipeline Funnel ─────────────────────────────────────────────────────────
  // All stages so totals match what the sidebar shows
  const funnelData = PIPELINE_STAGES.map(stage => ({
    stage,
    count: pipeline.filter(e => e.stage === stage).length,
  }));

  // ── Top Companies ───────────────────────────────────────────────────────────
  const companyMap: Record<string, number> = {};
  for (const e of pipeline) companyMap[e.company] = (companyMap[e.company] || 0) + 1;
  const companyData = Object.entries(companyMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([company, count]) => ({ company: truncate(company), fullName: company, count }));

  // ── Fit Score Distribution ──────────────────────────────────────────────────
  const scoreBins = [
    { range: '1–3',  count: pipeline.filter(e => e.fitScore <= 3).length },
    { range: '4–6',  count: pipeline.filter(e => e.fitScore >= 4 && e.fitScore <= 6).length },
    { range: '7–8',  count: pipeline.filter(e => e.fitScore >= 7 && e.fitScore <= 8).length },
    { range: '9–10', count: pipeline.filter(e => e.fitScore >= 9).length },
  ];

  // ── Salary Distribution ─────────────────────────────────────────────────────
  const salaryBins = [
    { range: '<$150k',    count: 0 },
    { range: '$150–180k', count: 0 },
    { range: '$180–220k', count: 0 },
    { range: '$220–260k', count: 0 },
    { range: '>$260k',    count: 0 },
    { range: 'Unknown',   count: 0 },
  ];
  for (const e of pipeline) {
    const nums = e.salary?.match(/\$?(\d+)k?/gi)
      ?.map(n => parseInt(n.replace(/[$k]/gi, '')) * (n.toLowerCase().includes('k') || parseInt(n) < 500 ? 1000 : 1)) || [];
    const mid = nums.length > 0 ? nums.reduce((a, b) => a + b, 0) / nums.length : 0;
    if (!mid || e.salary?.toLowerCase() === 'competitive') salaryBins[5].count++;
    else if (mid < 150000) salaryBins[0].count++;
    else if (mid < 180000) salaryBins[1].count++;
    else if (mid < 220000) salaryBins[2].count++;
    else if (mid < 260000) salaryBins[3].count++;
    else salaryBins[4].count++;
  }

  // ── Discovery Velocity ──────────────────────────────────────────────────────
  const weekMap: Record<string, number> = {};
  for (const e of pipeline) {
    const wk = getWeekKey(e.addedDate);
    weekMap[wk] = (weekMap[wk] || 0) + 1;
  }
  const velocityData = Object.entries(weekMap)
    .sort((a, b) => new Date(a[0]).getTime() - new Date(b[0]).getTime())
    .slice(-8)
    .map(([week, count]) => ({ week, count }));

  // ── Outreach Velocity ───────────────────────────────────────────────────────
  const outreachWeekMap: Record<string, number> = {};
  for (const e of pipeline) {
    if (e.outreachDraft?.savedAt) {
      const wk = getWeekKey(e.outreachDraft.savedAt);
      outreachWeekMap[wk] = (outreachWeekMap[wk] || 0) + 1;
    }
  }
  const outreachData = Object.entries(outreachWeekMap)
    .sort((a, b) => new Date(a[0]).getTime() - new Date(b[0]).getTime())
    .map(([week, count]) => ({ week, count }));

  // ── Avg Days in Stage ───────────────────────────────────────────────────────
  const stageTimeMap: Record<string, number[]> = {};
  for (const e of pipeline) {
    const days = Math.max(0, Math.floor((Date.now() - new Date(e.addedDate).getTime()) / 86400000));
    if (!stageTimeMap[e.stage]) stageTimeMap[e.stage] = [];
    stageTimeMap[e.stage].push(days);
  }
  const stageTimeData = Object.entries(stageTimeMap)
    .map(([stage, days]) => ({
      stage,
      avgDays: Math.round(days.reduce((a, b) => a + b, 0) / days.length),
    }))
    .sort((a, b) => b.avgDays - a.avgDays);

  // ── Search Momentum ─────────────────────────────────────────────────────────
  const sortedByDate = [...pipeline].sort((a, b) => new Date(a.addedDate).getTime() - new Date(b.addedDate).getTime());
  const cumulativeData = sortedByDate.map((e, i) => ({
    date: new Date(e.addedDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    total: i + 1,
  }));

  const notEnough = pipeline.length < 2;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

      {/* Row 1 — Pipeline Funnel + Top Companies */}
      <ChartCard title="Pipeline Funnel" empty={pipeline.length === 0}>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={funnelData} layout="vertical" margin={{ right: 32 }}>
            <XAxis type="number" tick={AXIS_TICK} allowDecimals={false} />
            <YAxis type="category" dataKey="stage" tick={AXIS_TICK} width={80} />
            <Tooltip contentStyle={TOOLTIP_STYLE} cursor={{ fill: '#374151' }} />
            <Bar dataKey="count" fill="#6366f1" radius={[0, 3, 3, 0]}>
              <LabelList dataKey="count" position="right" style={{ fill: '#9ca3af', fontSize: 11 }} />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard title="Top Companies" empty={companyData.length === 0}>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={companyData} layout="vertical" margin={{ right: 32 }}>
            <XAxis type="number" tick={AXIS_TICK} allowDecimals={false} />
            <YAxis type="category" dataKey="company" tick={{ fill: '#6b7280', fontSize: 10 }} width={140} />
            <Tooltip
              contentStyle={TOOLTIP_STYLE}
              cursor={{ fill: '#374151' }}
              formatter={(value: any, _: any, props: any) => [value, props.payload?.fullName || props.payload?.company]}
            />
            <Bar dataKey="count" fill="#8b5cf6" radius={[0, 3, 3, 0]}>
              <LabelList dataKey="count" position="right" style={{ fill: '#9ca3af', fontSize: 11 }} />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      {/* Row 2 — Fit Score + Salary Distribution */}
      <ChartCard title="Fit Score Distribution" empty={notEnough}>
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={scoreBins}>
            <XAxis dataKey="range" tick={AXIS_TICK} />
            <YAxis tick={AXIS_TICK} allowDecimals={false} />
            <Tooltip contentStyle={TOOLTIP_STYLE} cursor={{ fill: '#374151' }} />
            <Bar dataKey="count" radius={[3, 3, 0, 0]}>
              {scoreBins.map((_, i) => (
                <Cell key={i} fill={['#ef4444', '#f59e0b', '#3b82f6', '#10b981'][i]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard title="Salary Distribution" empty={notEnough}>
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={salaryBins}>
            <XAxis dataKey="range" tick={{ fill: '#6b7280', fontSize: 10 }} />
            <YAxis tick={AXIS_TICK} allowDecimals={false} />
            <Tooltip contentStyle={TOOLTIP_STYLE} cursor={{ fill: '#374151' }} />
            <Bar dataKey="count" radius={[3, 3, 0, 0]}>
              {salaryBins.map((_, i) => (
                <Cell key={i} fill={['#3b82f6', '#6366f1', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981'][i]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      {/* Row 3 — Discovery Velocity + Outreach Velocity */}
      <ChartCard title="Discovery Velocity (roles/week)" empty={velocityData.length < 1}>
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={velocityData}>
            <XAxis dataKey="week" tick={AXIS_TICK} />
            <YAxis tick={AXIS_TICK} allowDecimals={false} />
            <Tooltip contentStyle={TOOLTIP_STYLE} cursor={{ fill: '#374151' }} />
            <Bar dataKey="count" fill="#3b82f6" radius={[3, 3, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard title="Outreach Velocity (drafts/week)" empty={outreachData.length < 1}>
        <ResponsiveContainer width="100%" height={180}>
          <LineChart data={outreachData}>
            <CartesianGrid strokeDasharray="3 3" stroke={GRID_COLOR} />
            <XAxis dataKey="week" tick={AXIS_TICK} />
            <YAxis tick={AXIS_TICK} allowDecimals={false} />
            <Tooltip contentStyle={TOOLTIP_STYLE} />
            <Line type="monotone" dataKey="count" stroke="#ec4899" strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </ChartCard>

      {/* Row 4 — Avg Days in Stage + Search Momentum */}
      <ChartCard title="Avg Days in Current Stage" empty={stageTimeData.length < 2}>
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={stageTimeData} layout="vertical" margin={{ right: 32 }}>
            <XAxis type="number" tick={AXIS_TICK} />
            <YAxis type="category" dataKey="stage" tick={AXIS_TICK} width={80} />
            <Tooltip contentStyle={TOOLTIP_STYLE} cursor={{ fill: '#374151' }} />
            <Bar dataKey="avgDays" fill="#f59e0b" radius={[0, 3, 3, 0]}>
              <LabelList dataKey="avgDays" position="right" style={{ fill: '#9ca3af', fontSize: 11 }} formatter={(v: any) => `${v}d`} />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard title="Search Momentum (cumulative roles)" empty={notEnough}>
        <ResponsiveContainer width="100%" height={180}>
          <LineChart data={cumulativeData}>
            <CartesianGrid strokeDasharray="3 3" stroke={GRID_COLOR} />
            <XAxis dataKey="date" tick={AXIS_TICK} />
            <YAxis tick={AXIS_TICK} allowDecimals={false} />
            <Tooltip contentStyle={TOOLTIP_STYLE} />
            <Line type="monotone" dataKey="total" stroke="#3b82f6" strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </ChartCard>

    </div>
  );
}
