# PRODUCT REQUIREMENTS DOCUMENT · DRAFT v1.5
## Job Search Agent
*An AI-powered daily digest, pipeline tracker, and outreach drafting tool for senior AI product & strategy professionals.*

| | |
|---|---|
| **Author** | Chris |
| **Status** | Draft v1.5 |
| **Last Updated** | July 2026 |
| **Target Audience** | Personal / Self-use |

**v1.5 Changes:** Replaced Claude built-in web_search tool with Serper.dev (Google Search API) + Claude for job discovery (Section 5, 8.1, 8.2, 8.4). Added Contacts & Activity tracking per pipeline entry (Section 6.2). Added 1-job option to Jobs per Search setting.

**v1.4 Changes:** Removed Gmail integration and Google Sheets sync. Added CSV Export (Section 6.3). Updated tech stack and roadmap accordingly. Outreach drafts are now copy-to-clipboard only.

---

## 1. Purpose & Problem Statement

Senior AI product and strategy professionals targeting competitive in-office roles at large companies face a fragmented, time-consuming search process: job boards must be manually checked, outreach must be written from scratch for each role, and pipeline state lives in ad-hoc spreadsheets or sticky notes. No existing tool combines intelligent role discovery, pipeline tracking, personalized outreach generation, and search analytics in a single workflow.

This agent eliminates that friction by automating discovery (scheduled daily digest via web search), centralizing pipeline state (local JSON with CSV export), generating high-quality cold outreach on demand, and surfacing search analytics — all tuned to the user's specific criteria and background.

---

## 2. Goals & Non-Goals

**Product Goals**
- **Discovery:** Automatically surface 5+ new, relevant job postings on a configurable schedule without manual board-browsing.
- **Pipeline:** Maintain a live, editable pipeline with status tracking, notes, and user-weighted fit scoring.
- **Outreach:** Generate tailored cold outreach emails and copy them to clipboard in one click.
- **Export:** Export the full pipeline (or filtered view) to CSV for use in Excel, Notion, or any external tool.
- **Configurability:** Allow the user to adjust all search criteria, role types, fit score weights, and profile copy without touching code.
- **Persistence:** Store pipeline state as local JSON. Survives app restarts.

**Learning Goals**
- Design and build a live end-to-end application solving a real-world problem.
- Learn how to build agentic patterns.
- Learn how to use Claude Code.

**Non-Goals (v1)**
- Gmail integration or automated email sending — copy-to-clipboard only in v1
- Google Sheets sync — CSV export covers this use case
- Interview prep, scheduling, or calendar integration (future phase)
- Multi-user or team collaboration
- Resume/LinkedIn optimization recommendations
- Integration with ATS platforms (Greenhouse, Lever, Workday)

---

## 3. User & Context

Single user. Senior AI product and strategy leader based in Austin, TX. Targeting in-office roles at companies with 1,000+ employees. Role tracks: AI Product Manager, AI Strategy, AI GTM / Solutions, Head of AI Product, Director/VP of AI. Background spans AI product leadership (Rad AI, Hologic), management consulting (Bain), and private equity. Wharton MBA + MS CS.

Key behaviors that shape design: makes final decisions quickly after seeing clear options; prefers tight, substantive language over filler; uses Claude heavily for iterative professional document production; checks the tool daily as part of a morning job-search routine.

---

## 4. Phasing & Roadmap Summary

| Phase | Focus | Key Functionality | Key Deliverables |
|---|---|---|---|
| **v1 (Now)** | Core agent | Wake up every morning to a fresh list of matched jobs. Manage your pipeline in one place. Draft a cold email in one click and copy it to clipboard. Export pipeline to CSV anytime. See your search performance in charts. | Automated scheduled digest, pipeline CRUD + manual add, user-weighted fit scoring, outreach drafting + clipboard copy, CSV export, Analytics tab (8 charts), settings panel, local JSON persistence. Job sourcing via Claude web search. |
| **v2 (Next)** | Better data | Get cleaner, more reliable job data from dedicated job board APIs. Direct job board API integration (Adzuna + Greenhouse/Lever). CSV export with richer metadata. Digest quality feedback loop using rejection/pass signals. | Adzuna API, Greenhouse/Lever APIs. Enhanced CSV with salary and company metadata. |
| **v3 (Later)** | Full workflow | Schedule interviews without leaving the app. Prep for each role with tailored talking points. | Interview scheduling via Google Calendar. Interview prep mode per role. ATS integrations. Multi-device sync. |

---

## 5. Job Sourcing Architecture

**v1 (current):** Two-step pipeline using Serper.dev + Claude.
1. **Search** — Two parallel Serper.dev queries run against Google: one targeting ATS platforms (`greenhouse.io`, `lever.co`, `jobs.ashbyhq.com`) for direct job posting links, one broader career-page search excluding aggregators. Capped at 20 combined results. Cost: ~$0.002 per run.
2. **Score & Format** — Results (title, URL, snippet) are passed to `claude-sonnet-4-6` (no web_search tool) with the user's criteria and fit weights. Claude selects the best matches, scores them, and returns structured JSON. Cost: ~$0.02 per run.
- **Total per digest run: ~$0.02–0.05.** Predictable and bounded regardless of result volume.
- Requires `SERPER_API_KEY` in addition to `ANTHROPIC_API_KEY`.

**Why the change from v1.0–v1.4:** The original approach used Anthropic's built-in `web_search` tool in an agentic loop. After an API tool version update (`web_search_20260209`), each search call began injecting 30–50K tokens of web content into the context window per invocation. With multiple searches per run, costs reached $1–4 per digest. The Serper architecture separates search from reasoning, making each step cheap, fast, and predictable.

**v2 (planned):** Adzuna API (primary) + Greenhouse/Lever public feeds (supplemental). Serper as fallback.

---

## 6. Functional Requirements

### 6.1 Job Discovery — Automated Digest
- **FR-D1:** The agent runs a job search automatically on a configurable schedule (default: daily at 8:00 AM local time). The user can trigger an additional manual run at any time via the 'Run Now' button.
- **FR-D2:** Digest frequency is configurable in Settings: Daily, Every 2 days, Weekdays only, Weekly. Time of day is also user-settable.
- **FR-D3:** Each discovered role is scored 1–10 for fit using user-defined weights (see FR-S11). A one-sentence fit rationale is displayed on the card.
- **FR-D4:** Roles already present in the pipeline (matched by normalized title + company) are excluded from new results to avoid duplicates.
- **FR-D5:** Each result includes: job title, company, location, work model, employee count, salary range (or 'Competitive'), posting date, a 2-sentence description highlight, posting URL, fit score, and fit reason.
- **FR-D6:** New roles are added to the pipeline with status 'New' and the date found.
- **FR-D7:** The user can also manually add a new role to the pipeline by clicking an 'Add Role' button.
- **FR-D8:** A toast notification confirms how many new roles were found after each run, and the header displays the last-run timestamp.

### 6.2 Pipeline Management
- **FR-P1:** All tracked roles are displayed in a sortable, filterable list view (default: newest first).
- **FR-P2:** Each role card shows: fit score badge, title, company, location, work model, salary, date posted, and current status.
- **FR-P3:** Expanding a card reveals: full snippet, fit reason, status picker, notes field, Contacts & Activity section, and action buttons.
- **FR-P4:** Status options: New, Applied, Outreach, Interview, Offer, Rejected, Passed. Status changes are immediate with no save step.
- **FR-P5:** Notes field is free-text, auto-saved on blur.
- **FR-P6:** The pipeline header shows a count summary by status, each clickable to filter the list.
- **FR-P7:** Individual roles can be permanently removed from the pipeline.
- **FR-P8:** Pipeline data persists across sessions via local JSON file storage.
- **FR-P9 (Contacts & Activity):** Each pipeline entry supports one or more contact records. Each contact captures: contact name, contact title, last contact date, method (Email / LinkedIn / Cell), and free-text notes. Contacts can be added via '+ Add Contact & Activity', edited inline, and deleted individually. Contact data is stored in the pipeline JSON and persists across sessions.

### 6.3 CSV Export
- **FR-E1:** An 'Export CSV' button in the pipeline header exports the currently visible roles (respects active status filter) to a `.csv` file.
- **FR-E2:** The file is named `job-pipeline-{YYYY-MM-DD}.csv` and downloads automatically in the browser.
- **FR-E3:** CSV columns: ID, Title, Company, Location, Work Model, Employee Count, Salary, URL, Posted Date, Added Date, Status, Fit Score, Fit Reason, Snippet, Notes, Source.
- **FR-E4:** The Export CSV button is disabled and visually dimmed when no roles match the current filter.
- **FR-E5:** All text fields are properly escaped (double-quoted, internal quotes doubled) to ensure compatibility with Excel, Google Sheets, and Notion imports.

### 6.4 Outreach Drafting
- **FR-O1:** Clicking 'Draft Outreach' on any pipeline card navigates to the Outreach tab and begins generation.
- **FR-O2:** The draft uses the Claude API with the user's resume summary and the job's details (title, company, snippet) as context.
- **FR-O3:** Output: a subject line + email body (100–130 words). Body avoids generic openers ('I saw your posting...').
- **FR-O4:** Subject line and body are both editable inline before copying.
- **FR-O5:** 'Copy Email' copies the formatted email (Subject: … + body) to clipboard.
- **FR-O6:** 'Regenerate' re-runs the draft against the same job.
- **FR-O7:** 'Mark Sent' updates the job's pipeline status to 'Outreach'.
- **FR-O8:** The most recent outreach draft per role is stored in the pipeline data model and restored when the role is re-selected.

### 6.5 Analytics Tab
*(Unchanged from v1.3 — 8 charts: Discovery Velocity, Pipeline Funnel, Fit Score Distribution, Role & Company Mix, Outreach Activity, Time-in-Stage, Salary Distribution, Search Momentum.)*

### 6.6 Settings
- **FR-S1** — Location, **FR-S2** — Work Model, **FR-S3** — Company Size, **FR-S4** — Keywords, **FR-S5** — Exclusions, **FR-S6** — Role Types, **FR-S7** — Resume Summary, **FR-S8** — Sender Name/Email, **FR-S10** — Digest Schedule, **FR-S11** — Fit Score Weights.
- **FR-S12:** All settings persist across sessions via local JSON file storage.

---

## 7. Non-Functional Requirements

| Area | Target | Notes |
|---|---|---|
| Digest latency | < 15 sec | Claude API + web search; show loading state |
| Outreach latency | < 8 sec | Claude API only; show 'Drafting…' state |
| CSV export | Instant | Client-side generation; no server round-trip |
| Persistence | Session + file | Local JSON survives app restart |
| Deduplication | Zero dupes | Match on normalized title + company string |

---

## 8. Technical Architecture

### 8.1 Stack
- **Frontend:** React (Next.js App Router, TypeScript)
- **Search:** Serper.dev Google Search API — two parallel queries per digest run
- **AI Engine:** Anthropic Claude API — `claude-sonnet-4-6` for scoring/formatting (no web_search tool)
- **State / Storage:** Local JSON files (`data/pipeline.json`, `data/settings.json`)
- **CSV Export:** Client-side Blob + URL.createObjectURL — no server required
- **Styling:** Tailwind CSS v4
- **Scheduler:** node-cron (local); Vercel Cron Jobs (production)

### 8.2 Key API Calls
- **Digest (v1.5):** Two parallel Serper.dev searches → merged results passed to a single Claude API call (no tools) for scoring, filtering, and JSON formatting. Total cost ~$0.02–0.05 per run.
- **Outreach Draft:** Single Claude API call (no web search). Passes job details + resume summary. Returns `{subject, body}` JSON.

### 8.3 Data Model (pipeline entry)
```
id, title, company, location, workModel, employeeCount, salary, url,
posted, addedDate, status, fitScore, fitReason, snippet, notes,
outreachDraft { subject, body, savedAt },
source  // 'web_search' | 'manual'
```

### 8.4 Environment Variables
```
ANTHROPIC_API_KEY    — required (Claude scoring + outreach)
SERPER_API_KEY       — required (Google Search via Serper.dev)
NEXT_PUBLIC_APP_URL  — http://localhost:3000 (local)
```

---

## 9. UX & Navigation

Four-tab layout: **Pipeline | Outreach | Analytics | Settings**. A persistent header contains the agent name, last-run timestamp, total roles tracked, and the 'Run Now' CTA.

**Pipeline Tab:** Status filter bar (All + 7 statuses) · Role cards (expandable) · Export CSV button · Add Role button

**Outreach Tab:** Role selector list (left) · Editable subject + body (right) · Copy Email · Mark Sent · Regenerate

**Analytics Tab:** 2-column chart grid · Empty states when insufficient data

**Settings Tab:** Search Criteria · Target Role Types · Fit Score Weights · Your Profile

---

## 10. Open Questions
- **Q1:** For v2 job sourcing: start with Adzuna only (simpler), or launch Adzuna + Greenhouse + Lever simultaneously for better coverage?
- **Q2:** Should the Outreach tab store a full history of all drafted emails per role, or only the most recent draft?
- **Q3:** When the app is closed, the scheduler resets. Should we store 'missed digest' state and fire on next open, or show a 'Digest due — run now?' prompt?
- **Q4:** Should the Analytics tab include response rate breakdowns by company size or role type once ≥ 10 outreach emails have been sent?

---

## 11. Success Metrics
- Digest runs automatically at least 5x per week without manual intervention
- ≥ 80% of discovered roles are rated 6+ fit score
- Outreach draft is generated for ≥ 50% of roles moved to 'Applied' or 'Outreach' status
- Time from 'find a role' to 'copy email' is under 2 minutes
- Pipeline is never rebuilt from scratch — persistence is reliable across sessions
- Analytics tab renders at least 5 of 8 charts within 2 weeks of use
- CSV export produces a clean, importable file with every run
