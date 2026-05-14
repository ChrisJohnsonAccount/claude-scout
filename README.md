# Claude Scout

A personal job search agent powered by Claude AI. Scout finds open roles matching your criteria, scores them for fit, and helps you draft outreach emails — all running locally on your machine.

---

## What it does

- **Searches** the web for job postings that match your location, work model, and role preferences
- **Scores** each role for fit based on your background
- **Drafts** personalized outreach emails using Claude AI
- **Tracks** your pipeline across stages (New, Reviewing, Applied, etc.)
- **Schedules** automated daily digests so your pipeline stays fresh

---

## What you need

- **Node.js** (free) — download the LTS version from [nodejs.org](https://nodejs.org)
- **An Anthropic API key** — create one at [console.anthropic.com](https://console.anthropic.com) (~$5–10/month for regular use)

---

## Reference — Product Specs

- [Product Requirements Document (PRD v1.4)](docs/PRD-v1.4.md) — Full product spec covering purpose, goals, features, tech stack, and roadmap.
- [Project Plan (v3.0)](docs/Project-Plan-v3.md) — Phase-by-phase build plan tracking what's complete and what's next, including the path to Vercel deployment.

---

## Setup

**1. Install dependencies**

```bash
npm install
```

**2. Add your API key**

Create a `.env.local` file in the project root:

```
ANTHROPIC_API_KEY=sk-ant-your-key-here
```

> On Mac, files starting with `.` are hidden. Create it from the terminal with `touch .env.local`, then open with `open -e .env.local`.

**3. Run the app**

```bash
npm run dev
```

Then open [http://localhost:3000](http://localhost:3000). Leave the terminal open while using Scout — press `Ctrl+C` to stop.

---

## First-time configuration

1. Click **Settings** in the left sidebar
2. Fill in your location, work model preference, and target role types
3. Paste a 2–3 paragraph summary of your background in the **Resume Summary** field — Claude uses this to write outreach emails
4. Click **Save Settings**
5. Click **Run Now** in the top right — Scout will search for matching roles (takes ~2 minutes)

---

## Project structure

```
src/
  app/
    api/          # API routes (pipeline, settings, digest, outreach)
    page.tsx      # Main UI
  components/     # Tab components (Pipeline, Outreach, Analytics, Settings)
  lib/            # Storage layer and shared types
scripts/
  scheduler.mjs   # Daily digest scheduler
  get-tokens.mjs  # Token usage helper
data/             # Local JSON storage (gitignored — stays on your machine)
docs/
  PRD-v1.4.md       # Product Requirements Document
  Project-Plan-v3.md  # Project plan and milestones
```

---

## Cost

A typical session (a few searches + a few outreach drafts) costs a few cents. The API key is the only real ongoing cost.
