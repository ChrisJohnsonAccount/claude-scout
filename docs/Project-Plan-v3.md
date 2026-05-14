# Job Search Agent — Project Plan v3.0
*May 2026 · Path B (local Next.js app) → Vercel*

**v3.0 Changes:** Removed Gmail and Google Sheets integration. Removed Google OAuth setup. Added CSV Export. Simplified credential setup to Anthropic API key only.

---

## PATH B — Local Next.js App (Current Path)
*Always-on scheduler · Local JSON storage · Deploy to Vercel when ready*

### Phase 1 — Environment Setup ✅ COMPLETE

| Task | Status |
|---|---|
| Node.js 24 + npm installed | ✅ |
| Next.js 15 scaffolded with TypeScript + Tailwind | ✅ |
| Dependencies installed: `@anthropic-ai/sdk`, `node-cron`, `recharts` | ✅ |
| `.env.local` configured with `ANTHROPIC_API_KEY` | ✅ |
| Dev server running at `localhost:3000` | ✅ |

**Exit gate:** `npm run dev` starts cleanly. App loads in browser.

---

### Phase 2 — Core Build ✅ COMPLETE

| Module | Status |
|---|---|
| 4-tab shell UI (Pipeline \| Outreach \| Analytics \| Settings) | ✅ |
| Dark mode design system | ✅ |
| Pipeline CRUD: card list, status picker, notes, fit score badge | ✅ |
| Manual "Add Role" form | ✅ |
| Settings panel: search criteria, role types, fit weight sliders, digest schedule | ✅ |
| Discovery digest: Claude API + `web_search_20250305`, JSON parsing, dedup, fit scoring | ✅ |
| Outreach drafting: Claude API call, editable subject/body, clipboard copy | ✅ |
| **CSV Export:** client-side Blob download, respects active status filter | ✅ |
| Analytics tab: 8 Recharts components wired to live pipeline data | ✅ |
| Local JSON persistence (`data/pipeline.json`, `data/settings.json`) | ✅ |

**Exit gate:** All 7 modules functional end-to-end.

---

### Phase 3 — Prompt Tuning 🔲 NEXT

| Task | Notes |
|---|---|
| Run 3 digest cycles | Review result relevance, job freshness, URL accuracy |
| Adjust search prompt | Tighten role type phrasing, location, company size filter |
| Calibrate fit scoring | Tweak weight defaults using real examples |
| Test outreach drafts on 3 real roles | Confirm tone, length, CTA quality |
| Fill in resume summary in Settings | Required for high-quality outreach generation |

**Exit gate:** ≥ 80% of digest results feel relevant. Outreach drafts usable as-is.

---

### Phase 4 — Test & Validate 🔲

| Workflow | What to check |
|---|---|
| Digest | Run on demand, check result count, quality, dedup logic |
| Pipeline | Status changes, notes, filter/sort, manual add, remove role |
| Outreach | Generate draft, edit, copy to clipboard, mark sent |
| CSV Export | Export filtered and unfiltered views, open in Excel/Sheets |
| Persistence | Restart the app — pipeline and settings survive |

**Exit gate:** All five workflows pass. No data loss on restart.

---

### Phase 5 — Local Scheduler 🔲

| Task | Notes |
|---|---|
| Create `scripts/scheduler.mjs` | Uses `node-cron` to hit `POST /api/digest` at configured time |
| Read schedule from `data/settings.json` | Respects user's frequency + time setting |
| Missed-digest detection | On start, check if digest was due while app was closed; show banner |
| Add `npm run scheduler` to `package.json` | Single command to run alongside the app |

**Exit gate:** Scheduler fires reliably without manual "Run Now".

---

## Vercel Deployment (When Ready)

Migrate from Path B when you want the app accessible from any device or want to share it.

| Phase | Effort | Key Tasks |
|---|---|---|
| **V1 — Deploy** | 30–60 min | `vercel deploy`, set `ANTHROPIC_API_KEY` env var in Vercel dashboard, verify app loads |
| **V2 — Scheduler** | 1–2 hrs | Replace `node-cron` with Vercel Cron Jobs (`vercel.json` config), same `/api/digest` endpoint |
| **V3 — Storage** | 2–4 hrs | Swap local JSON files for Vercel KV (key-value store), no schema changes required |

**No rewrite needed.** Path B code migrates directly — swap storage layer only for V3.

---

## Credential Summary

| Key | Required | Purpose |
|---|---|---|
| `ANTHROPIC_API_KEY` | ✅ Yes | Claude API — digest web search + outreach drafting |
| `NEXT_PUBLIC_APP_URL` | Local dev | `http://localhost:3000` |

No Google credentials required.

---

## Key Decisions Log

| Decision | Rationale |
|---|---|
| Removed Gmail integration | Adds OAuth complexity for marginal value — clipboard copy is sufficient for v1 |
| Removed Google Sheets sync | CSV export covers the use case without requiring Google auth or live sync |
| Local JSON storage | Zero setup, survives restarts, trivial to migrate to Vercel KV later |
| Claude web search (v1) | Zero external API keys; wide net across job boards; fast to iterate on prompt quality |
| Next.js (not Vite + Express) | API routes deploy to Vercel serverless functions with no config changes |
| Dark mode | User preference |
