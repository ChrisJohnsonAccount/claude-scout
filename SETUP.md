# Scout — Setup Guide

Scout is a personal job search agent powered by Claude AI. It finds open roles matching your criteria, scores them for fit, and helps you draft outreach emails.

---

## What you need

1. **Node.js** (free) — the engine that runs the app
2. **An Anthropic API key** (paid, ~$5–10/month for regular use) — gives Scout access to Claude AI

---

## Step 1 — Install Node.js

Go to **https://nodejs.org** and download the **LTS** version. Run the installer with all default settings.

To confirm it worked, open Terminal (Mac) or Command Prompt (Windows) and type:
```
node --version
```
You should see a version number like `v22.x.x`.

---

## Step 2 — Get an Anthropic API key

1. Go to **https://console.anthropic.com** and create an account
2. Add a credit card and load some credits ($10 is plenty to start)
3. Go to **API Keys** and click **Create Key**
4. Copy the key — it starts with `sk-ant-`

---

## Step 3 — Set up Scout

Unzip the `scout.zip` file somewhere on your computer (e.g. your Desktop or Documents folder).

Open Terminal (Mac) or Command Prompt (Windows), navigate to the unzipped folder, and run:

```
npm install
```

This downloads Scout's dependencies. It takes a minute and only needs to be done once.

---

## Step 4 — Add your API key

In the Scout folder, create a new file called `.env.local` (note the leading dot).

Open it in any text editor (Notepad on Windows, TextEdit on Mac) and paste this, replacing the placeholder with your actual key:

```
ANTHROPIC_API_KEY=sk-ant-your-key-here
```

Save the file.

> **On Mac**, files starting with `.` are hidden by default. To create one in Finder, press `Cmd+Shift+.` to show hidden files, or just create it from the terminal with `touch .env.local` then open it with `open -e .env.local`.

---

## Step 5 — Run Scout

In your terminal, run:

```
npm run dev
```

Then open your browser and go to **http://localhost:3000**

Scout is now running. You'll need to leave the terminal window open while you use it. To stop it, press `Ctrl+C`.

---

## First-time configuration

1. Click **Settings** in the left sidebar
2. Fill in your location, work model preference, and target role types
3. Paste a 2–3 paragraph summary of your background in the **Resume Summary** field — this is what Claude uses to write outreach emails
4. Click **Save Settings**
5. Click **Run Now** in the top right — Scout will search the web for matching roles (takes ~2 minutes)

---

## Every time you use Scout

Just open a terminal, navigate to the Scout folder, and run `npm run dev`. Then go to http://localhost:3000.

---

## Questions?

The API key is the only real cost. A typical session (a few searches + a few outreach drafts) costs a few cents.
