# Reddit Doomscroll Agent - Implementation Plan

## TL;DR

> **Objective**: Build an agent that monitors Reddit CS job market sentiment daily, generates AI-powered insights with memes, and displays trends via a web interface.
>
> **Stack**: Apify → n8n (pipeline + storage) → AI → Bun backend → Svelte frontend
>
> **Key Features**:
> - Individual post sentiment analysis (batched in groups of20)
> - Evidence phrases extracted from each post
> - Weighted aggregates (daily/weekly/monthly)
> - Top posts that drive sentiment
> - AI-generated insight messages
> - Meme assignments based on sentiment
>
> **Estimated Effort**: Medium (6-8 hours)  
> **Parallel Execution**: Yes (Wave 1 &3 can run in parallel)

---

## Architecture

```
[n8n Schedule (9 AM daily)]
    ↓
[Apify Reddit Scraper] → 100 posts from subreddits
    ↓
[Batch Node] → Split into 5 batches (20 posts each)
    ↓
[AI Block #1] → Analyze each batch (sentiment, status, evidence)
    ↓ (5 API calls)
[Aggregate Node] → Combine 5 batches into 100 posts
    ↓
[n8n Database: Upsert posts] → Store in n8n tables
    ↓
[Calculate aggregates] → Daily, weekly, monthly (weighted average)
    ↓
[AI Block #2] → Generate insight messages
    ↓ (3 API calls)
[n8n Database: Upsert aggregates] → ONE ROW PER DAY
    ↓
[HTTP Webhook] → GET /webhook/doom (Bearer token auth)
    ↓
[Bun Backend] → Fetch from n8n webhook, map memes, serve API
    ↓
[Svelte Frontend] → Display 3 cards with memes and charts
```
[n8n Schedule (9 AM daily)]
    ↓
[Apify Reddit Scraper] → 100 posts from subreddits
    ↓
[Split into batches: 5 batches × 20 posts]
    ↓
[AI Block #1] → Analyze each batch (sentiment, status, evidence)
    ↓ (5 API calls)
[Aggregate results] → Combine 5 batches into 100 posts
    ↓
[n8n Database: Upsert posts] → Store in n8n tables
    ↓
[Calculate aggregates] → Daily, weekly, monthly (weighted average)
    ↓
[AI Block #2] → Generate insight messages
    ↓ (3 API calls)
[n8n Database: Upsert aggregates] → ONE ROW PER DAY
    ↓
[HTTP Webhook] → GET /webhook/doom returns latest data
    ↓
[Bun Backend] → Fetch from n8n, map memes, serve API
    ↓
[Svelte Frontend] → Display 3 cards with memes and charts
```

---

## Components

### n8n Workflow
- Schedule node (9 AM daily)
- Apify node (Reddit scraper)
- Function nodes (batching, aggregation)
- AI nodes (sentiment analysis, message generation)
- Database nodes (store posts and aggregates)
- HTTP webhook (data retrieval)

### Bun Backend
- Fetches data from n8n webhook
- Maps sentiment to meme filenames
- Serves static meme images
- Serves GET /api/doom
- 5-minute response caching

### Svelte Frontend
- Single page with 3cards (daily/weekly/monthly)
- Memes displayed from backend
- Charts for historical trends
- Top posts with evidence phrases

---

## Wave Files

Detailed implementation tasks are split across wave files for parallel execution:

| Wave | File | Tasks | Time |
|------|------|-------|------|
| Wave 1 | `wave-1-n8n-pipeline.md` | 11 tasks | 2-3 hours |
| Wave 2 | `wave-2-bun-backend.md` | 7 tasks | 2-3 hours |
| Wave 3 | `wave-3-svelte-frontend.md` | 5 tasks | 2-3 hours |
| Wave 4 | `wave-4-integration-deployment.md` | 8 tasks | 1-2 hours |
| Wave Final | `wave-final-verification.md` | 4 tasks | 1-2 hours |
| **Total** | | **35 tasks** | **8-13 hours** |

---

## Parallel Execution

```
Wave 1 (n8n Pipeline)─────┐
                          ├──→ Wave 4 (Integration) ──→ Wave Final (Verification)
Wave 3 (Frontend)─────────┘
         ↑
Wave 2 (Backend) ─────────┘
(depends on Wave 1 Task 11)
```

- **Wave 1 &3**: Can run in parallel (no dependencies)
- **Wave 2**: Must wait for Wave 1 Task 11 (HTTP webhook)
- **Wave 4**: Must wait for Waves 1, 2, and 3
- **Wave Final**: Must wait for Wave 4

---

## Key Decisions

| Decision | Choice | Reason |
|----------|--------|--------|
| Database | n8n built-in | No external DB setup needed |
| Env vars | None | Hardcoded subreddit array |
| Memes | Backend serves | No nginx needed |
| Frontend | `serve` package | Simpler than nginx |
| Tests | Manual QA | No automated tests |

---

## Data Model

### n8n Database Tables

**posts** (append-only):
```javascript
{
  reddit_id: string (unique),
  date: date,
  title: string,
  body: string,
  sentiment: number (0-100),
  status: "bullish" | "bearish" | "neutral",
  upvotes: number,
  subreddit: string,
  url: string,
  evidence: string
}
```

**aggregates** (one row per day):
```javascript
{
  date: date,
  daily: { sentiment, status, message, evidence, top_posts },
  weekly: { sentiment, status, message, evidence, top_posts },
  monthly: { sentiment, status, message, evidence, top_posts }
}
```

---

## API Response

**GET /api/doom**
```json
{
  "daily": {
    "sentiment": 45,
    "status": "bearish",
    "message": "The market is COOKED...",
    "meme": "this_is_fine.jpg",
    "evidence": ["layoffs ↑ 300%", "70% mention ghosting"],
    "top_posts": [...]
  },
  "weekly": {...},
  "monthly": {...},
  "history": [...]
}
```

---

## Meme Mapping

Sentiment ranges mapped to meme filenames:

| Sentiment | Meme |
|-----------|------|
| 0-10 | crying_jordan.jpg |
| 11-20 | this_is_fine.jpg |
| 21-30 | crying_jeremy.jpg |
| 31-44 | i_have_no_idea.jpg |
| 45-55 | drake_hotline.jpg |
| 56-70 | stonks.jpg |
| 71-85 | success_kid.jpg |
| 86-100 | chad_yes.jpg |

Mapped dynamically in backend - not stored in database.

---

## Deployment

### Docker Compose Services
- **frontend**: Svelte app served by `serve` package
- **api**: Bun backend serving API and memes
- **Traefik**: Reverse proxy with automatic HTTPS

### Environment Variables
```bash
# Backend (.env)
N8N_WEBHOOK_URL=http://your-n8n-instance/webhook/doom
N8N_API_KEY=your_n8n_api_key
PORT=3000
```

---

## Next Steps

1. Provide meme images:
   - Option A: Download from public URLs (Imgflip, Know Your Meme)
   - Option B: Add manually to `backend/public/memes/`
   - Ensure filenames match meme-map.ts ranges

2. Configure n8n webhook:
   - Set `WEBHOOK_SECRET` in n8n environment
   - Set `WEBHOOK_SECRET` in backend .env
   - Same secret value in both places

3. Ensure external `proxy` network exists for Traefik

4. Run `/start-work` to begin execution

---

## See Also

- **CHANGES.md** - All plan revisions and fixes
- **agents.md** - Agent execution instructions
- **docs/decisions.md** - Architecture decision records (Wave 4 Task 38)