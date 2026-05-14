/**
 * Local job digest scheduler.
 * Reads schedule settings from data/settings.json and calls POST /api/digest
 * at the configured time. The Next.js dev server must be running first.
 *
 * Usage:
 *   npm run scheduler           # start scheduler (keeps running)
 *   npm run scheduler -- --now  # trigger once immediately, then keep running
 */

import cron from 'node-cron';
import { readFileSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const SETTINGS_FILE = path.join(ROOT, 'data', 'settings.json');
const BASE_URL = process.env.APP_URL ?? 'http://localhost:3000';

// Austin, TX — update if you move
const TIMEZONE = 'America/Chicago';

const DEFAULTS = {
  digestFrequency: 'daily',
  digestTime: '08:00',
  lastDigestRun: null,
};

function loadSettings() {
  try {
    if (existsSync(SETTINGS_FILE)) {
      return { ...DEFAULTS, ...JSON.parse(readFileSync(SETTINGS_FILE, 'utf8')) };
    }
  } catch {
    // ignore parse errors
  }
  return { ...DEFAULTS };
}

function toCron(frequency, time) {
  const [h, m] = time.split(':').map(Number);
  switch (frequency) {
    case 'weekdays':  return `${m} ${h} * * 1-5`;
    case 'weekly':    return `${m} ${h} * * 1`;   // Mondays
    // 'daily' and 'every2days' both run daily; every2days gates at trigger time
    default:          return `${m} ${h} * * *`;
  }
}

async function runDigest() {
  const settings = loadSettings();

  // Gate: skip if fewer than 2 days have elapsed since last run
  if (settings.digestFrequency === 'every2days' && settings.lastDigestRun) {
    const elapsed = (Date.now() - new Date(settings.lastDigestRun).getTime()) / 86_400_000;
    if (elapsed < 1.9) {
      log(`Skipping — last digest ran ${elapsed.toFixed(1)}d ago (every2days mode)`);
      return;
    }
  }

  log('Calling POST /api/digest …');

  try {
    const res = await fetch(`${BASE_URL}/api/digest`, { method: 'POST' });
    const body = await res.json();
    if (res.ok) {
      log(`Done — ${body.newCount} new job(s) added to pipeline`);
    } else {
      log(`API error — ${body.error ?? res.statusText}`);
    }
  } catch (err) {
    log(`Network error — ${err.message}`);
    log('Is the dev server running? Try: npm run dev');
  }
}

function log(msg) {
  console.log(`[${new Date().toISOString()}] ${msg}`);
}

function start() {
  const settings = loadSettings();
  const { digestFrequency, digestTime } = settings;
  const expr = toCron(digestFrequency, digestTime);

  console.log('');
  console.log('  Job Search Agent — Scheduler');
  console.log('  ----------------------------');
  console.log(`  Frequency : ${digestFrequency}`);
  console.log(`  Time      : ${digestTime} (${TIMEZONE})`);
  console.log(`  Cron expr : ${expr}`);
  console.log(`  Target    : ${BASE_URL}/api/digest`);
  console.log('');

  const valid = cron.validate(expr);
  if (!valid) {
    console.error(`Invalid cron expression: "${expr}". Check digestTime in Settings.`);
    process.exit(1);
  }

  cron.schedule(expr, runDigest, { timezone: TIMEZONE });
  log('Scheduler running — Ctrl+C to stop');

  // --now flag triggers an immediate run on startup
  if (process.argv.includes('--now')) {
    log('--now flag detected, triggering digest immediately');
    runDigest();
  }
}

start();
