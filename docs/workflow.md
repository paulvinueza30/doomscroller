# Doomscroller n8n Workflow

## Overview

Single n8n workflow with two execution paths:

1. **Daily Pipeline** (triggered by schedule at 9 AM)
2. **Webhook Endpoint** (triggered by HTTP GET)

Both paths share static data storage (n8n's `$getWorkflowStaticData('global')`).

---

## Setup

### 1. Import Workflow

1. Open n8n → Workflows → Import from File
2. Select `n8n/daily-pipeline.json`

### 2. Configure Environment Variables

In n8n Admin → Settings → Environment Variables (or Docker `environment:`):

```
APIFY_API_TOKEN=<from apify.com → Settings → Integrations>
OPENAI_API_KEY=<from platform.openai.com>
WEBHOOK_SECRET=<any random string, e.g.: openssl rand -hex 32>
DISCORD_WEBHOOK_URL=<optional, from Discord channel settings>
```

### 3. Activate Workflow

- Toggle the workflow to **Active**
- The webhook endpoint becomes available immediately
- The daily pipeline runs at 9 AM server time

### 4. Configure Backend

Set in `backend/.env`:

```
N8N_WEBHOOK_URL=https://your-n8n-instance/webhook/doom
WEBHOOK_SECRET=<same as n8n WEBHOOK_SECRET>
```

---

## Workflow Nodes

### Schedule Path (Daily at 9 AM)

| Step | Node Type | Node Name | Description |
|------|-----------|-----------|-------------|
| 1 | `scheduleTrigger` | Schedule Trigger | Cron: `0 9 * * *` |
| 2 | `code` | Set Apify Config | Hardcodes subreddit URLs |
| 3 | **`apify`** | Apify: Run Reddit Scraper | Native Apify node — runs `apify~reddit-scraper`, waits for completion |
| 4 | **`apify`** | Apify: Get Dataset Items | Native Apify node — fetches dataset items from the run |
| 5 | `code` | Prepare Posts | Normalize Apify output, ensure `reddit_id` field |
| 6 | `splitInBatches` | Split In Batches | 20 posts/batch — 5 iterations total |
| 7 | `code` | Build Sentiment Prompt | Combine 20 posts into one LLM prompt |
| 8 | **`chainLlm`** | LLM Chain: Sentiment Analysis | Basic LLM Chain — runs once per batch (5 total) |
| ↳ | **`lmChatOpenAi`** | OpenAI Chat Model (Sentiment) | Sub-node connected via `ai_languageModel` |
| 9 | `code` | Parse Sentiment Response | Parse JSON from chain output, merge with post data, loop back to batches |
| 10 | `aggregate` | Aggregate Batch Results | Collect all 100 posts from 5 batches |
| 11 | **`n8n`** | DB: Upsert Posts | Native Data Store — UPSERT on `reddit_id` |
| 12 | **`n8n`** | DB: Get Posts 7d | Native Data Store — query posts from last 7 days |
| 13 | **`n8n`** | DB: Get Posts 30d | Native Data Store — query posts from last 30 days |
| 14 | `code` | Calculate Aggregates | Weighted average for daily/weekly/monthly |
| 15 | `code` | Build Insight Items | Produces 3 items (daily/weekly/monthly) with prompts |
| 16 | **`chainLlm`** | LLM Chain: Insight Messages | Basic LLM Chain — runs 3 times (once per period) |
| ↳ | **`lmChatOpenAi`** | OpenAI Chat Model (Insights) | Sub-node connected via `ai_languageModel` |
| 17 | `code` | Parse Insight Response | Parse message + evidence from chain output |
| 18 | `aggregate` | Aggregate Insights | Collect all 3 insight results |
| 19 | `code` | Build Final Aggregate | Merge insights by period into one object |
| 20 | **`n8n`** | DB: Upsert Aggregate | Native Data Store — UPSERT on `date` |

### Webhook Path (On Demand)

| Step | Node Type | Node Name | Description |
|------|-----------|-----------|-------------|
| 1 | `webhook` | Webhook Trigger | GET `/webhook/doom` |
| 2 | `code` | Check Auth | Verify Bearer token from `WEBHOOK_SECRET` |
| 3 | **`n8n`** | DB: Get Latest Aggregate | Native Data Store — latest row, sorted by date desc |
| 4 | **`n8n`** | DB: Get Aggregate History | Native Data Store — last 30 days, sorted asc |
| 5 | `code` | Build Webhook Response | Merge latest + history into API response |
| 6 | `respondToWebhook` | Respond to Webhook | Return JSON |

### Error Path

| Step | Node | Description |
|------|------|-------------|
| 1 | Error Trigger | Any workflow error |
| 2 | Discord Error Notification | POST to Discord webhook |

---

## Webhook Response Format

```json
{
  "daily": {
    "sentiment": 45,
    "status": "bearish",
    "message": "The market is cooked...",
    "evidence": ["layoffs up 300%", "70% mention ghosting"],
    "top_posts": [{ "reddit_id": "t3_abc", "title": "...", "sentiment": 15, ... }]
  },
  "weekly": { ... },
  "monthly": { ... },
  "history": [
    { "date": "2026-04-01", "sentiment": 47 },
    ...
  ]
}
```

---

## Changing Subreddits

Edit the **Set Apify Config** node → change the `subreddits` array:

```javascript
const subreddits = ['cscareerquestions', 'jobs', 'layoffs', 'engineering', 'techjobs'];
```

---

## Troubleshooting

| Issue | Fix |
|-------|-----|
| Apify fails | Check `APIFY_API_TOKEN` is set; verify actor `apify~reddit-scraper` is accessible |
| OpenAI fails | Check `OPENAI_API_KEY`; ensure account has credits |
| Webhook returns 401 | `WEBHOOK_SECRET` in n8n and backend `.env` must match |
| No data yet | Trigger pipeline manually first: n8n → Execute Workflow |
