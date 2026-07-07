import Anthropic from '@anthropic-ai/sdk';
import { randomUUID } from 'crypto';
import { getPipeline, getSettings, saveSettings, savePipeline } from '@/lib/storage';
import { PipelineEntry, classifyTrack } from '@/lib/types';

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

interface SerperResult {
  title: string;
  link: string;
  snippet: string;
  date?: string;
}

async function serperSearch(query: string): Promise<SerperResult[]> {
  const apiKey = process.env.SERPER_API_KEY;
  if (!apiKey) throw new Error('SERPER_API_KEY is not configured in .env');

  const res = await fetch('https://google.serper.dev/search', {
    method: 'POST',
    headers: { 'X-API-KEY': apiKey, 'Content-Type': 'application/json' },
    body: JSON.stringify({ q: query, num: 10, gl: 'us', hl: 'en' }),
  });

  if (!res.ok) throw new Error(`Serper search failed: ${res.status}`);
  const data = await res.json();
  return (data.organic ?? []) as SerperResult[];
}

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

    const recentKeys = pipeline
      .slice()
      .sort((a, b) => b.addedDate.localeCompare(a.addedDate))
      .slice(0, 30)
      .map(e => `- ${e.title.toLowerCase().trim()}|${e.company.toLowerCase().trim()}`);
    const existingList = recentKeys.length > 0 ? recentKeys.join('\n') : '(none yet)';

    // Build a compact role query (cap at 4 role types to keep URL length reasonable)
    const roleTerms = settings.roleTypes.slice(0, 4).map(r => `"${r}"`).join(' OR ');
    const location = settings.location;

    // Two parallel searches: ATS platforms (direct links) + broader company career pages
    const atsQuery = `(${roleTerms}) ${location} site:greenhouse.io OR site:lever.co OR site:jobs.ashbyhq.com OR site:boards.greenhouse.io`;
    const careerQuery = `(${roleTerms}) ${location} job opening 2026 -site:indeed.com -site:ziprecruiter.com -site:glassdoor.com`;

    const [atsResults, careerResults] = await Promise.all([
      serperSearch(atsQuery),
      serperSearch(careerQuery),
    ]);

    // Merge and deduplicate by URL
    const seen = new Set<string>();
    const allResults: SerperResult[] = [];
    for (const r of [...atsResults, ...careerResults]) {
      if (!seen.has(r.link)) {
        seen.add(r.link);
        allResults.push(r);
      }
    }

    if (allResults.length === 0) {
      return Response.json({ error: 'No search results found. Check your Serper API key.' }, { status: 500 });
    }

    // Format results for Claude (cap at 20 to keep prompt tight)
    const resultsText = allResults.slice(0, 20).map((r, i) =>
      `[${i + 1}] ${r.title}\nURL: ${r.link}\n${r.snippet}${r.date ? `\nDate: ${r.date}` : ''}`
    ).join('\n\n');

    const weightDesc = [
      `role type match (weight ${settings.fitWeights.roleTypeMatch}/5)`,
      `location/work model (weight ${settings.fitWeights.locationWorkModel}/5)`,
      `company size ≥${settings.minEmployees.toLocaleString()} employees (weight ${settings.fitWeights.companySize}/5)`,
      `salary (weight ${settings.fitWeights.salaryRange}/5)`,
      `keywords "${settings.keywords}" (weight ${settings.fitWeights.keywordMatch}/5)`,
    ].join(', ');

    const prompt = `From the job search results below, select up to ${settings.maxJobCount} that best match these criteria:
- Role types (any of): ${settings.roleTypes.join(', ')}
- Location: ${location} | Work model: ${settings.workModel}
- Company size: ≥${settings.minEmployees.toLocaleString()} employees
- Keywords: ${settings.keywords || '(none)'} | Exclude: ${settings.exclusions || '(none)'}

Score each 1–10 for fit using: ${weightDesc}

Skip anything already in the pipeline:
${existingList}

Search results:
${resultsText}

Return ONLY a JSON array — no other text:
[{"title":"","company":"","location":"","workModel":"In-office or hybrid","employeeCount":"","salary":"Competitive","url":"","posted":"","fitScore":7,"fitReason":"One sentence.","snippet":"Two sentences."}]`;

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 2048,
      messages: [{ role: 'user', content: prompt }],
    });

    const text = message.content
      .filter(b => b.type === 'text')
      .map(b => (b as any).text as string)
      .join('\n');

    if (!text) {
      return Response.json({ error: 'No response from Claude' }, { status: 500 });
    }

    let rawJobs: any[];
    try {
      rawJobs = extractJSON(text);
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
