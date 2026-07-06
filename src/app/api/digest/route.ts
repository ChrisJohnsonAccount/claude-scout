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
    // Send only the 30 most recent to the prompt to keep token count bounded.
    // Full deduplication still happens below against the complete existingKeys set.
    const recentKeys = pipeline
      .slice()
      .sort((a, b) => b.addedDate.localeCompare(a.addedDate))
      .slice(0, 30)
      .map(e => `- ${e.title.toLowerCase().trim()}|${e.company.toLowerCase().trim()}`);
    const existingList = recentKeys.length > 0 ? recentKeys.join('\n') : '(none yet)';

    const weightDesc = [
      `Role type match (weight ${settings.fitWeights.roleTypeMatch}/5)`,
      `Location/work model match (weight ${settings.fitWeights.locationWorkModel}/5)`,
      `Company size ≥${settings.minEmployees.toLocaleString()} employees (weight ${settings.fitWeights.companySize}/5)`,
      `Salary competitiveness (weight ${settings.fitWeights.salaryRange}/5)`,
      `Keyword match for "${settings.keywords}" (weight ${settings.fitWeights.keywordMatch}/5)`,
    ].join('\n');

    const roleQuery = settings.roleTypes.join(' OR ');
    const prompt = `Search for job postings matching these criteria and return results as JSON.

Use this search strategy to get direct job posting links with minimal searches:
- Search: site:greenhouse.io OR site:lever.co OR site:jobs.ashbyhq.com "${roleQuery}" "${settings.location}"
- If that returns fewer than ${settings.maxJobCount} results, do one more search on LinkedIn Jobs.
- Do NOT do more than 2 searches total.

Criteria:
- Role types (any of): ${settings.roleTypes.join(', ')}
- Location: ${settings.location} | Work model: ${settings.workModel}
- Company size: ≥${settings.minEmployees.toLocaleString()} employees
- Keywords: ${settings.keywords || '(none)'} | Exclude: ${settings.exclusions || '(none)'}

Score each role 1–10 for fit:
${weightDesc}

Skip roles already in pipeline:
${existingList}

Return ONLY a JSON array, no other text:
[{"title":"","company":"","location":"","workModel":"In-office or hybrid","employeeCount":"","salary":"","url":"","posted":"","fitScore":7,"fitReason":"","snippet":""}]`;

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 2048,
      tools: [{ type: 'web_search_20260209', name: 'web_search', max_uses: 2 }] as any,
      messages: [{ role: 'user', content: prompt }],
    });

    const fullText = message.content
      .filter(b => b.type === 'text')
      .map(b => (b as any).text as string)
      .join('\n');

    if (!fullText) {
      return Response.json({ error: 'No text response from Claude' }, { status: 500 });
    }

    let rawJobs: any[];
    try {
      rawJobs = extractJSON(fullText);
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
