import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import path from 'path';
import { PipelineEntry, Settings, DEFAULT_SETTINGS, classifyTrack } from './types';

const DATA_DIR = path.join(process.cwd(), 'data');
const PIPELINE_FILE = path.join(DATA_DIR, 'pipeline.json');
const SETTINGS_FILE = path.join(DATA_DIR, 'settings.json');

function ensureDataDir() {
  if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true });
}

export function getPipeline(): PipelineEntry[] {
  ensureDataDir();
  if (!existsSync(PIPELINE_FILE)) return [];
  try {
    const entries: PipelineEntry[] = JSON.parse(readFileSync(PIPELINE_FILE, 'utf8'));
    return entries.map(e => ({ ...e, track: classifyTrack(e.title) }));
  } catch {
    return [];
  }
}

export function savePipeline(pipeline: PipelineEntry[]): void {
  ensureDataDir();
  writeFileSync(PIPELINE_FILE, JSON.stringify(pipeline, null, 2));
}

export function getSettings(): Settings {
  ensureDataDir();
  if (!existsSync(SETTINGS_FILE)) return { ...DEFAULT_SETTINGS };
  try {
    const saved = JSON.parse(readFileSync(SETTINGS_FILE, 'utf8'));
    return { ...DEFAULT_SETTINGS, ...saved };
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

export function saveSettings(settings: Settings): void {
  ensureDataDir();
  writeFileSync(SETTINGS_FILE, JSON.stringify(settings, null, 2));
}
