# Doomscroller 📉

> AI-powered CS job market sentiment tracker. Reddit posts → sentiment analysis → memes.

**Stack**: n8n · Apify · OpenAI · Bun · SvelteKit · Chart.js · Docker · Traefik

---

## What it does

Monitors Reddit (r/cscareerquestions, r/jobs, r/layoffs) daily. Analyzes 100 posts
with AI sentiment scoring (0–100), generates weighted daily/weekly/monthly aggregates,
and displays results as memes + evidence phrases on a clean dark-themed dashboard.

---

## Architecture

```
⏰ n8n Schedule (9 AM daily)
    │
    ▼
🤖 Apify Reddit Scraper → 100 posts from 5 subreddits
    │
    ▼
🔀 Split in Batches → 5 × 20 posts
    │
    ▼
🧠 OpenAI (gpt-4o-mini) → sentiment 0-100 per post (5 API calls)
    │
    ▼
📊 Aggregate → Calculate daily/weekly/monthly weighted averages
    │
    ▼
✍️ OpenAI → Generate insight messages + evidence (3 API calls)
    │
    ▼
💾 n8n Static Data → Store posts + aggregates (no external DB)
    │
    ▼
🌐 HTTP Webhook → GET /webhook/doom
    │
    ▼
⚡ Bun Backend → Map memes · Cache 5min · Serve /api/doom
    │
    ▼
🎭 Svelte Frontend → 3 cards (daily/weekly/monthly) + charts
```

---

## Stack

| Layer | Tech | Notes |
|-------|------|-------|
| Scraping | Apify Reddit Scraper | 100 posts/day from 5 subreddits |
| Orchestration | n8n (self-hosted) | Pipeline + DB + webhook in one |
| AI | OpenAI gpt-4o-mini | Sentiment + insight messages |
| Backend | Bun + TypeScript | Meme mapping, caching, static files |
| Frontend | SvelteKit + Tailwind | Static SPA via adapter-static |
| Charts | Chart.js + svelte-chartjs | 7-day and 30-day trend lines |
| Deployment | Docker Compose + Traefik | HTTPS, auto-cert |

---

## Setup

### Prerequisites

- Self-hosted n8n instance
- Docker + Docker Compose
- [Apify account](https://apify.com) (for Reddit scraper)
- [OpenAI API key](https://platform.openai.com)

### 1. n8n Workflow

1. Import `n8n/daily-pipeline.json` into your n8n instance
2. Set environment variables in n8n Admin → Settings:

```
APIFY_API_TOKEN=<from apify.com → Settings → Integrations>
OPENAI_API_KEY=<from platform.openai.com>
WEBHOOK_SECRET=<random string: openssl rand -hex 32>
DISCORD_WEBHOOK_URL=<optional, for error alerts>
```

3. Activate the workflow — the webhook endpoint is immediately available

### 2. Backend

```bash
cp backend/.env.example backend/.env
# Edit backend/.env:
#   N8N_WEBHOOK_URL=https://your-n8n/webhook/doom
#   WEBHOOK_SECRET=<same as n8n WEBHOOK_SECRET>
```

### 3. Meme Images

Download the 8 required meme images to `backend/public/memes/`:

```bash
# Filenames must match exactly:
# crying_jordan.jpg  this_is_fine.jpg  crying_jeremy.jpg  i_have_no_idea.jpg
# drake_hotline.jpg  stonks.jpg        success_kid.jpg    chad_yes.jpg
```

See `docs/workflow.md` for sentiment → meme mapping.

### 4. Deploy

```bash
# First run the n8n pipeline manually to populate data,
# then deploy the frontend + backend:
docker compose up -d
```

The app will be live at `https://doomscroll.paulvinueza.dev`
(update `docker-compose.yml` with your own domain).

---

## Development

```bash
# Backend
cd backend
bun install
bun dev          # starts on :3000

# Frontend
cd frontend
npm install
npm run dev      # starts on :5173

# Backend tests
cd backend
bun test src/tests/meme-map.test.ts
```

---

## Sentiment Scale

| Score | Status | Meme |
|-------|--------|------|
| 0–10 | Bearish | crying_jordan.jpg |
| 11–20 | Bearish | this_is_fine.jpg |
| 21–30 | Bearish | crying_jeremy.jpg |
| 31–44 | Bearish | i_have_no_idea.jpg |
| 45–55 | Mixed | drake_hotline.jpg |
| 56–70 | Bullish | stonks.jpg |
| 71–85 | Bullish | success_kid.jpg |
| 86–100 | Bullish | chad_yes.jpg |

---

## Docs

- [`docs/workflow.md`](docs/workflow.md) — n8n workflow setup and node reference
- [`docs/schema.md`](docs/schema.md) — data schema
- [`docs/decisions.md`](docs/decisions.md) — architectural decisions
- [`docs/business-impact.md`](docs/business-impact.md) — cost analysis and ROI
