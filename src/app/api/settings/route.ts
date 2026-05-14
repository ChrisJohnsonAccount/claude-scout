import { getSettings, saveSettings } from '@/lib/storage';

export async function GET() {
  return Response.json(getSettings());
}

export async function PUT(request: Request) {
  const body = await request.json();
  saveSettings(body);
  return Response.json(getSettings());
}
