import Anthropic from '@anthropic-ai/sdk';
import { getSettings } from '@/lib/storage';
import { PipelineEntry } from '@/lib/types';

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(request: Request) {
  const { entry, instructions }: { entry: PipelineEntry; instructions?: string } =
    await request.json();

  const settings = getSettings();

  const prompt = `You are helping ${settings.senderName} write a cold outreach email for a job opportunity.

Job details:
- Title: ${entry.title}
- Company: ${entry.company}
- Location: ${entry.location}
- Work model: ${entry.workModel}
- Salary: ${entry.salary}
- Description: ${entry.snippet}

${settings.resumeSummary ? `Candidate background:\n${settings.resumeSummary}` : ''}

Write a concise cold outreach email (100–130 words for the body). Avoid generic openers like "I saw your posting" or "I came across your job listing". The email should feel direct and confident.
${instructions ? `\nAdditional instructions: ${instructions}` : ''}

Respond with ONLY valid JSON in this exact format:
{"subject": "the subject line", "body": "the email body"}`;

  try {
    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1024,
      messages: [{ role: 'user', content: prompt }],
    });

    const textBlock = message.content.find(b => b.type === 'text');
    if (!textBlock || textBlock.type !== 'text') {
      return Response.json({ error: 'No text response from Claude' }, { status: 500 });
    }

    const jsonMatch = textBlock.text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return Response.json({ error: 'Could not parse response' }, { status: 500 });
    }

    const draft = JSON.parse(jsonMatch[0]);
    return Response.json(draft);
  } catch (err: any) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}
