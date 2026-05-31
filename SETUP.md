# AgentNews — Setup Guide

## 1. Install dependencies

```bash
npm install
```

## 2. Configure environment

```bash
cp .env.example .env
```

Edit `.env` and fill in:
- `ADMIN_USERNAME` / `ADMIN_PASSWORD` — your dashboard login
- `JWT_SECRET` — run `openssl rand -hex 32` and paste the output
- `ANTHROPIC_API_KEY` — from https://console.anthropic.com

## 3. Set up the database

```bash
npm run db:push
```

This creates `data/agent_news.db` (SQLite).

## 4. Google Sheets setup (optional but recommended)

### Step 1 — Create a Google Cloud project

1. Go to https://console.cloud.google.com
2. Click **New Project**, give it a name (e.g. `agent-news`)
3. Select the project

### Step 2 — Enable the Sheets API

1. In the left sidebar, go to **APIs & Services → Library**
2. Search for **Google Sheets API** and click **Enable**

### Step 3 — Create a Service Account

1. Go to **APIs & Services → Credentials**
2. Click **Create Credentials → Service Account**
3. Name it (e.g. `agent-news-bot`), click **Done**
4. Click on the service account you just created
5. Go to the **Keys** tab → **Add Key → Create new key → JSON**
6. Download the JSON file — this is your credential

### Step 4 — Add the key to .env

Open the downloaded JSON, copy the entire contents, and paste it as the value of `GOOGLE_SERVICE_ACCOUNT_JSON` in your `.env` file (all on one line, or minified).

### Step 5 — Create the spreadsheet

1. Go to https://sheets.google.com and create a new blank spreadsheet
2. Copy the spreadsheet ID from the URL:
   `https://docs.google.com/spreadsheets/d/**<THIS_PART>**/edit`
3. Paste it into `GOOGLE_SPREADSHEET_ID` in `.env`

### Step 6 — Share the spreadsheet with the service account

1. In your spreadsheet, click **Share**
2. Add the service account email (found in the JSON under `client_email`) as an **Editor**
3. Click **Send**

The agent will automatically create one tab per topic and keep them in sync.

## 5. Run the dashboard

```bash
npm run dev
```

Visit http://localhost:3000 — log in with your `ADMIN_USERNAME` / `ADMIN_PASSWORD`.

## 6. Add topics

Go to the **Topics** tab in the dashboard. Add topics like:
- `Tech News`
- `Crypto`
- `War in the Gulf`

On first fetch, Claude will automatically select the best RSS feeds for each topic.

## 7. Run the agent

**One-off fetch (all topics):**
```bash
npm run agent
```

**One-off fetch (specific topic):**
```bash
npx tsx agent/index.ts --topicId=<topic-id-from-db>
```

**Run on a schedule (every hour, stays running):**
```bash
npx tsx agent/index.ts --schedule
```

**Or use system cron (recommended for production):**
```bash
crontab -e
```
Add this line (adjust path to your project):
```
0 * * * * cd /path/to/agent_news && npx tsx agent/index.ts >> /var/log/agent_news.log 2>&1
```

## 8. Production deployment (VPS)

```bash
# Build the Next.js app
npm run build

# Start with PM2
npm install -g pm2

# Start the web server
pm2 start npm --name "agent-news-web" -- start

# Start the agent on a schedule
pm2 start "npx tsx agent/index.ts --schedule" --name "agent-news-agent" --cwd /path/to/agent_news

pm2 save
pm2 startup
```
