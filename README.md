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
| `DATABASE_URL` | Leave as `file:./data/agent-newss.db` |
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
agent-newss/
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

Full server setup for **agent-news.mikenelles.com** — app on port **3034**, Apache reverse proxy, Let's Encrypt SSL, and GitHub Actions deploy.

### Paths and names

| Item | Value |
|------|--------|
| Domain | `agent-news.mikenelles.com` |
| App directory | `/var/www/agent-news.mikenelles.com/app` |
| Apache config | `/etc/apache2/sites-available/agent-news.conf` |
| App port (internal) | `3034` |
| PM2 web process | `agent-news-web` |
| PM2 agent process | `agent-news-agent` |

---

### 1. DNS

Add an **A record**:

| Type | Name | Value |
|------|------|--------|
| A | `agent-news` | your server IP |

Verify: `dig +short agent-news.mikenelles.com`

> Use a **hyphen**, not an underscore — Let's Encrypt will not issue certs for underscores.

---

### 2. One-time server setup

```bash
# App directory
sudo mkdir -p /var/www/agent-news.mikenelles.com
sudo git clone <your-repo-url> /var/www/agent-news.mikenelles.com/app
cd /var/www/agent-news.mikenelles.com/app

# Environment (edit with production values)
cp .env.example .env
nano .env

# Install Node 20 + pnpm, then build
corepack enable
pnpm install --frozen-lockfile
pnpm exec prisma generate
pnpm run db:push
pnpm run build

# PM2 — web on port 3034
pm2 start ecosystem.config.cjs
pm2 save && pm2 startup
```

Verify the app responds locally:

```bash
curl -I http://127.0.0.1:3034
pm2 ls    # both agent-news-web and agent-news-agent should be online
```

---

### 3. Apache reverse proxy

```bash
sudo apt install -y apache2 certbot python3-certbot-apache
sudo a2enmod proxy proxy_http ssl headers rewrite
```

Copy the vhost from this repo (or create manually):

```bash
sudo cp /var/www/agent-news.mikenelles.com/app/deploy/agent-news.conf \
  /etc/apache2/sites-available/agent-news.conf

sudo a2ensite agent-news.conf
sudo apache2ctl configtest
sudo systemctl reload apache2
```

Confirm Apache sees the vhost:

```bash
sudo apache2ctl -S | grep agent-news
curl -I http://agent-news.mikenelles.com
```

---

### 4. SSL certificate

```bash
sudo certbot --apache -d agent-news.mikenelles.com
```

Choose **redirect HTTP → HTTPS** when prompted.

Test renewal: `sudo certbot renew --dry-run`

---

### 5. GitHub Actions deploy

Add repository secrets (**Settings → Secrets → Actions**):

| Secret | Description |
|--------|-------------|
| `DEPLOY_HOST` | Server IP or hostname |
| `DEPLOY_USER` | SSH user |
| `DEPLOY_SSH_KEY` | Private SSH key |

On push to `main`, `.github/workflows/deploy.yml` will test, pull, build, and restart PM2 on the server.

---

### 6. Firewall

```bash
sudo ufw allow OpenSSH
sudo ufw allow 'Apache Full'
sudo ufw enable
```

Port **3034** does not need to be public — only Apache (80/443) does.

---

### Troubleshooting

| Symptom | Likely cause | Fix |
|---------|--------------|-----|
| **503 Service Unavailable** | `agent-news-web` not running | `PORT=3034 pm2 start npm --name agent-news-web -- start` |
| Certbot can't find vhost | Site not enabled | `sudo a2ensite agent-news.conf && sudo systemctl reload apache2` |
| Invalid character in domain | Underscore in hostname | Use `agent-news`, never `agent_news` |
| Agent restarting constantly | Missing `.env` or DB | Check `pm2 logs agent-news-agent` |

```bash
pm2 logs agent-news-web --lines 30
pm2 logs agent-news-agent --lines 30
curl -I http://127.0.0.1:3034
sudo tail /var/log/apache2/agent-news-error.log
```
