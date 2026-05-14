import { randomUUID } from 'crypto';
import { getPipeline, savePipeline } from '@/lib/storage';
import { PipelineEntry } from '@/lib/types';

export async function GET() {
  return Response.json(getPipeline());
}

export async function POST(request: Request) {
  const body: Omit<PipelineEntry, 'id' | 'addedDate'> = await request.json();
  const pipeline = getPipeline();
  const entry: PipelineEntry = {
    ...body,
    id: randomUUID(),
    addedDate: new Date().toISOString(),
  };
  savePipeline([entry, ...pipeline]);
  return Response.json(entry, { status: 201 });
}
