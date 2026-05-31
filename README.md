# AgentNews

An AI-powered news aggregator that monitors RSS feeds by topic, stores headlines in a Google Sheet, and serves them through a password-protected dashboard.

---

## How it works

1. You add topics (e.g. "Tech News", "Crypto", "War in the Gulf") via the dashboard
2. Claude automatically selects the best RSS feeds for each topic
3. An agent fetches headlines every hour, deduplicates them, and keeps the most recent 200
4. Headlines are written to Google Sheets (one tab per topic) and browseable in the dashboard

---

## Stack

- **Next.js 16** — dashboard and API routes
- **SQLite + Prisma** — local data store
- **Google Sheets API** — spreadsheet sync
- **Anthropic Claude** — selects RSS feeds per topic
- **node-cron** — hourly scheduling

---

## Quick start

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment

```bash
cp .env.example .env
```

Open `.env` and fill in:

| Variable | Description |
|---|---|
| `ADMIN_USERNAME` | Dashboard login username |
| `ADMIN_PASSWORD` | Dashboard login password |
| `JWT_SECRET` | Run `openssl rand -hex 32` and paste the result |
| `DATABASE_URL` | Leave as `file:./data/agent_news.db` |
| `ANTHROPIC_API_KEY` | From https://console.anthropic.com |
| `GOOGLE_SPREADSHEET_ID` | From your Google Sheet URL (see below) |
| `GOOGLE_SERVICE_ACCOUNT_JSON` | Contents of your service account key JSON |

### 3. Set up the database

```bash
npm run db:push
```

### 4. Start the dashboard

```bash
npm run dev
```

Visit http://localhost:3000, log in, and add your first topic.

### 5. Run the agent

```bash
# Fetch all topics once
npm run agent

# Run on a schedule (every hour, stays running)
npx tsx agent/index.ts --schedule
```

---

## Google Sheets setup

### Step 1 — Create a Google Cloud project

1. Go to https://console.cloud.google.com
2. Click **New Project**, name it (e.g. `agent-news`), click **Create**

### Step 2 — Enable the Sheets API

1. Go to **APIs & Services → Library**
2. Search for **Google Sheets API** and click **Enable**

### Step 3 — Create a Service Account

1. Go to **APIs & Services → Credentials**
2. Click **Create Credentials → Service Account**
3. Give it a name, click **Done**
4. Open the service account → **Keys** tab → **Add Key → Create new key → JSON**
5. Download the JSON file

### Step 4 — Add credentials to .env

Copy the full contents of the downloaded JSON and paste it as the value of `GOOGLE_SERVICE_ACCOUNT_JSON` (minified, on one line).

### Step 5 — Create a spreadsheet and share it

1. Create a new Google Sheet at https://sheets.google.com
2. Copy the spreadsheet ID from the URL:
   `https://docs.google.com/spreadsheets/d/**<ID HERE>**/edit`
3. Paste it into `GOOGLE_SPREADSHEET_ID`
4. Click **Share** in the spreadsheet and add the service account's `client_email` as an **Editor**

The agent will create one tab per topic automatically.

---

## Project structure

```
agent_news/
├── agent/
│   ├── index.ts          # Main agent — orchestrates fetch, store, sync
│   ├── claude-feeds.ts   # Asks Claude to select RSS feeds per topic
│   └── rss-fetcher.ts    # Fetches and parses RSS feeds
├── app/
│   ├── api/
│   │   ├── auth/         # Login / logout
│   │   ├── topics/       # Topic CRUD
│   │   ├── headlines/    # Headlines query
│   │   └── fetch/        # Trigger manual agent run
│   ├── browse/           # Headline browser UI
│   ├── login/            # Login page
│   └── topics/           # Topics management UI
├── components/
│   └── nav.tsx           # Top navigation bar
├── lib/
│   ├── auth.ts           # JWT helpers
│   ├── db.ts             # Prisma client
│   └── google-sheets.ts  # Sheets API helpers
├── prisma/
│   └── schema.prisma     # Topic + Headline models
├── data/                 # SQLite database lives here (gitignored)
├── .env.example
└── SETUP.md              # Detailed setup reference
```

---

## npm scripts

| Script | Description |
|---|---|
| `npm run dev` | Start dashboard in development mode |
| `npm run build` | Build for production |
| `npm start` | Start production server |
| `npm run agent` | Run the agent once (all topics) |
| `npm run db:push` | Create/update the database schema |
| `npm run db:generate` | Regenerate Prisma client |
| `npm test` | Run the test suite once |
| `npm run test:watch` | Run tests in watch mode |

---

## Testing

Tests use [Vitest](https://vitest.dev/) and [Testing Library](https://testing-library.com/). No database, Google Sheets, or network access is required — external services are mocked.

```bash
npm test
# or, to re-run on file changes:
npm run test:watch
```

### What's covered

| Area | File(s) |
|---|---|
| JWT auth | `lib/auth.test.ts` |
| RSS fetching | `agent/rss-fetcher.test.ts` |
| Claude feed selection | `agent/claude-feeds.test.ts` |
| Google Sheets sync | `lib/google-sheets.test.ts` |
| Auth middleware | `middleware.test.ts` |
| API routes | `app/api/auth/route.test.ts`, `app/api/topics/route.test.ts`, `app/api/headlines/route.test.ts` |
| Nav component | `components/nav.test.tsx` |

---

## Production deployment (VPS)

```bash
# Build
npm run build

# Install PM2
npm install -g pm2

# Start web server
pm2 start npm --name "agent-news-web" -- start

# Start agent (runs every hour internally)
pm2 start "npx tsx agent/index.ts --schedule" \
  --name "agent-news-agent" \
  --cwd /path/to/agent_news

pm2 save && pm2 startup
```

Or use a system cron instead of `--schedule`:

```
0 * * * * cd /path/to/agent_news && npx tsx agent/index.ts >> /var/log/agent_news.log 2>&1
```
