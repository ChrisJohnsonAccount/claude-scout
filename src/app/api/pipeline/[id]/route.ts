import { getPipeline, savePipeline } from '@/lib/storage';
import { PipelineEntry } from '@/lib/types';

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const updates: Partial<PipelineEntry> = await request.json();
  const pipeline = getPipeline();
  const idx = pipeline.findIndex(e => e.id === id);
  if (idx === -1) return Response.json({ error: 'Not found' }, { status: 404 });
  pipeline[idx] = { ...pipeline[idx], ...updates };
  savePipeline(pipeline);
  return Response.json(pipeline[idx]);
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const pipeline = getPipeline();
  const filtered = pipeline.filter(e => e.id !== id);
  if (filtered.length === pipeline.length) {
    return Response.json({ error: 'Not found' }, { status: 404 });
  }
  savePipeline(filtered);
  return new Response(null, { status: 204 });
}
