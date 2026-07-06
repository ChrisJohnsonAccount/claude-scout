import Anthropic from '@anthropic-ai/sdk';
import { randomUUID } from 'crypto';
import { getPipeline, getSettings, saveSettings, savePipeline } from '@/lib/storage';
import { PipelineEntry, classifyTrack } from '@/lib/types';

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

function extractJSON(text: string): any[] {
  const codeBlock = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (codeBlock) return JSON.parse(codeBlock[1].trim());
  const arrayMatch = text.match(/\[[\s\S]*\]/);
  if (arrayMatch) return JSON.parse(arrayMatch[0]);
  throw new Error('No JSON array found in response');
}

export async function POST() {
  try {
    const settings = getSettings();
    const pipeline = getPipeline();

    const existingKeys = new Set(
      pipeline.map(e => `${e.title.toLowerCase().trim()}|${e.company.toLowerCase().trim()}`)
    );
    const existingList = existingKeys.size > 0
      ? Array.from(existingKeys).map(k => `- ${k}`).join('\n')
      : '(none yet)';

    const weightDesc = [
      `Role type match (weight ${settings.fitWeights.roleTypeMatch}/5)`,
      `Location/work model match (weight ${settings.fitWeights.locationWorkModel}/5)`,
      `Company size ≥${settings.minEmployees.toLocaleString()} employees (weight ${settings.fitWeights.companySize}/5)`,
      `Salary competitiveness (weight ${settings.fitWeights.salaryRange}/5)`,
      `Keyword match for "${settings.keywords}" (weight ${settings.fitWeights.keywordMatch}/5)`,
    ].join('\n');

    const prompt = `You are a job search agent. Search the web for ${settings.maxJobCount} current, real job openings that match ALL of these criteria:

Role types (any of): ${settings.roleTypes.join(', ')}
Location: ${settings.location}
Work model: ${settings.workModel}
Company size: minimum ${settings.minEmployees.toLocaleString()} employees
Include keywords: ${settings.keywords || '(none)'}
Exclude: ${settings.exclusions || '(none)'}

Score each role 1–10 for fit using these weighted factors:
${weightDesc}

Skip any roles already in the pipeline (title|company):
${existingList}

Search for real, currently-open positions. For each role found, return a JSON array with this exact structure:
[
  {
    "title": "exact job title from posting",
    "company": "company name",
    "location": "city, state",
    "workModel": "In-office or hybrid",
    "employeeCount": "e.g. 5,000–10,000",
    "salary": "salary range from posting, or 'Competitive'",
    "url": "direct URL to the job posting",
    "posted": "e.g. '3 days ago' or '2025-05-10'",
    "fitScore": 8,
    "fitReason": "One sentence explaining fit score.",
    "snippet": "Two sentences summarizing the role and what makes it interesting."
  }
]

Return ONLY the JSON array. No other text before or after it.`;

    const message = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 4096,
      tools: [{ type: 'web_search_20260209', name: 'web_search', max_uses: Math.min(settings.maxJobCount * 2, 8) }] as any,
      messages: [{ role: 'user', content: prompt }],
    });

    const textBlock = message.content.find(b => b.type === 'text');
    if (!textBlock || textBlock.type !== 'text') {
      return Response.json({ error: 'No text response from Claude' }, { status: 500 });
    }

    let rawJobs: any[];
    try {
      rawJobs = extractJSON(textBlock.text);
    } catch {
      return Response.json({ error: 'Could not parse job results from Claude' }, { status: 500 });
    }

    const newEntries: PipelineEntry[] = [];
    for (const job of rawJobs) {
      if (!job.title || !job.company) continue;
      const key = `${job.title.toLowerCase().trim()}|${job.company.toLowerCase().trim()}`;
      if (existingKeys.has(key)) continue;
      existingKeys.add(key);

      newEntries.push({
        id: randomUUID(),
        title: job.title,
        company: job.company,
        location: job.location ?? '',
        workModel: job.workModel ?? settings.workModel,
        employeeCount: job.employeeCount ?? '',
        salary: job.salary ?? 'Competitive',
        url: job.url ?? '',
        posted: job.posted ?? '',
        addedDate: new Date().toISOString(),
        stage: 'New',
        fitScore: Number(job.fitScore) || 5,
        fitReason: job.fitReason ?? '',
        snippet: job.snippet ?? '',
        track: classifyTrack(job.title),
        notes: '',
        source: 'web_search',
      });
    }

    savePipeline([...newEntries, ...pipeline]);
    saveSettings({ ...settings, lastDigestRun: new Date().toISOString() });

    return Response.json({ newCount: newEntries.length });
  } catch (err: any) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}
