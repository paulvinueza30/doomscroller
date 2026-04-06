# Wave 1: n8n Data Pipeline

## Status
- **Dependencies**: None (can start immediately)
- **Agent**: Any agent can pick this up
- **Estimated Time**: 2-3 hours

---

## Overview

This wave sets up the entire data pipeline:
- n8n workflow configuration
- Apify Reddit scraper (hardcoded subreddit list - no env vars)
- AI sentiment analysis (batched in groups of 20)
- n8n database tables (posts + aggregates)
- HTTP webhook for data retrieval
- Discord webhook for error notifications

**Key Change**: Uses n8n's built-in database tables instead of Supabase.
**No env vars needed** - subreddits are hardcoded in the workflow.

**Total Tasks**: 11

---

## Architecture Flow

```
[n8n Schedule (9 AM daily)]
    ↓
[Function: Set Apify Config] → Hardcoded subreddits (no env vars)
    ↓
[Apify Reddit Scraper] →100 posts from configured subreddits
    ↓
[Function: Split into batches] →5 batches × 20 posts
    ↓
[AI Block #1] → Analyze EACH batch (sentiment: 0-100, status, evidence)
    ↓ (5 API calls)
[Function: Aggregate results] → Combine 5 batches into 100 posts
    ↓
[n8n Database: Upsert posts] → Store in n8n tables (UPSERT on reddit_id)
    ↓
[Function: Calculate aggregates] → Daily, weekly, monthly (weighted average)
    ↓
[AI Block #2] → Generate insight message + evidence for each aggregate
    ↓ (3 API calls)
[n8n Database: Upsert aggregates] → ONE row per day
    ↓
[HTTP Webhook] → GET /webhook/doom returns latest data
    ↓
[Discord Webhook] → Notify on failures
```

---

## n8n Database Tables

n8n provides built-in database storage via the "n8n" node. This is persistent and doesn't require external databases.

### Table: `posts`

```javascript
// n8n Database node creates a table with these fields:
{
  id: "auto-increment",
  reddit_id: "string (unique)", // Prevents duplicates
  date: "date",
  title: "string",
  body: "string",
  sentiment: "number (0-100)",
  status: "string (bullish/bearish/neutral)",
  upvotes: "number",
  subreddit: "string",
  url: "string",
  evidence: "string",
  created_at: "timestamp"
}
```

### Table: `aggregates`

```javascript
{
  id: "auto-increment",
  date: "date",
  daily: "json",
  weekly: "json",
  monthly: "json",
  created_at: "timestamp"
}
```

---

## Prerequisites: n8n Environment Setup

Before any tasks, ensure these environment variables are set in your **self-hosted n8n instance**
(Admin → Settings → Environment Variables, or via Docker `environment:` in your n8n compose file):

```bash
APIFY_API_TOKEN=your_apify_token_here   # From apify.com → Settings → Integrations
WEBHOOK_SECRET=your_secret_here          # Any random string, must match backend .env
```

**Note**: This project is self-hosted — env vars work fine. The free tier cloud limitation
in older plan notes does NOT apply here.

---

## Tasks (Total: 11)

### Task 1: n8n Workflow JSON
- [x] **Status**: Complete ✓

**What to do**:
- Create n8n workflow structure
- Define all nodes: Schedule, Function, Apify, AI, n8n Database, HTTP Webhook
- Create importable JSON
- Document workflow in `docs/workflow.md`

**Files**:
- `n8n/workflow.json`
- `docs/workflow.md`

**Workflow Flow**:
```
1. Schedule (Cron: 0 9 * * *) - 9 AM daily
2. Function (Set Apify Config) - Hardcoded subreddits
3. Apify (Reddit scraper) - Use config from previous node
4. Function (split into 5 batches)
5. AI Block #1 (analyze 5 batches - 20 posts each)
6. Function (aggregate batch results)
7. n8n Database (upsert posts on reddit_id)
8. Function (calculate aggregates)
9. AI Block #2 (generate messages - 3 calls)
10. n8n Database (upsert aggregates on date)
11. HTTP Webhook (GET /webhook/doom)
12. Discord Webhook (on error)
```

**Error Handling**:
- Allow partial failures (if some AI calls fail, continue with successful ones)
- Discord webhook on error
- Log errors to file

**Acceptance Criteria**:
- [x] Workflow JSON exists
- [x] Can import into n8n
- [x] Documentation exists
- [x] Error handling configured

---

### Task 2: Function - Set Apify Config (No Env Vars)
- [x] **Status**: Complete ✓

**What to do**:
- Create a Function node to set the Apify scraper configuration
- **Hardcode subreddit URLs** (no environment variables - free tier limitation)
- Pass config to Apify node

**Code**:
```javascript
// In n8n Function node: Set Apify Config
// NO ENVIRONMENT VARIABLES - hardcoded for free tier

const subreddits = ['cscareerquestions', 'jobs', 'layoffs'];
const subredditUrls = subreddits.map(s => `https://www.reddit.com/r/${s}`);

// Set the Apify configuration
const apifyConfig = {
  customMapFunction: "(object) => { return {...object} }",
  endPage: 1,
  extendOutputFunction: "($) => { return {} }",
  includeComments: true,
  maxItems: 100,
  proxy: {
    useApifyProxy: true,
    apifyProxyGroups: ["RESIDENTIAL"]
  },
  search: "apify",
  searchMode: "link",
  sort: "hot",
  startUrls: subredditUrls,
  time: "day"
};

return [{
  json: {
    apifyConfig: apifyConfig,
    subredditUrls: subredditUrls
  }
}];
```

**Configuration Notes**:
- `startUrls`: Hardcoded array of subreddit URLs
- `maxItems`: 100 posts per run
- `time`: "day" gets posts from last 24 hours
- `sort`: "hot" gets popular posts
- `includeComments`: true (for richer data)
- `proxy`: Uses residential proxies to avoid Reddit rate limits

**Acceptance Criteria**:
- [x] Function node created
- [x] Config passes to Apify node
- [x] Subreddits hardcoded (no env vars)
- [x] Config matches the required JSON structure

**Notes**:
- Subreddits are hardcoded in the workflow
- To change subreddits, edit the workflow directly
- No environment variables needed (free tier friendly)

---

### Task 3: Apify Reddit Scraper Integration
- [x] **Status**: Complete ✓

**What to do**:
- Configure Apify Reddit scraper actor
- Use config from previous Function node
- Set authentication (Apify API token)
- Handle response data

**Apify Node Configuration**:
- **Actor**: `apify/reddit-scraper` (or equivalent Reddit scraper)
- **Input**: Reference `json.apifyConfig` from previous node
- **Authentication**: Use `APIFY_API_TOKEN` environment variable
- **Output**: Array of Reddit posts

**Expected Output**:
```javascript
[
  {
    "id": "abc123", // Reddit post ID
    "reddit_id": "t3_abc123", // Full Reddit ID
    "title": "Got 5 offers after 200 applications",
    "body": "Here's my story...",
    "upvotes": 342,
    "subreddit": "cscareerquestions",
    "url": "https://reddit.com/r/cscareerquestions/comments/...",
    "created_at": "2024-01-17T10:30:00Z"
  },
  // ... 99 more posts
]
```

**Acceptance Criteria**:
- [x] Apify node configured
- [x] Uses config from previous Function node
- [x] Returns 100 posts from Reddit
- [x] Each post has reddit_id field
- [x] Proxy configuration working

---

### Task 4: Batch Node - Split Posts into Batches
- [x] **Status**: Complete ✓

**What to do**:
- Use n8n's built-in Batch node (not Function node)
- Split 100 posts into 5 batches of 20 posts each
- Configure batch size in node settings

**n8n Batch Node Configuration**:
- **Node**: Batch
- **Batch Size**:20
- **Options**: Reset on each execution

**Acceptance Criteria**:
- [x] Batch node configured (not Function node)
- [ ] Splits100 posts into 5 batches
- [x] Each batch has 20 posts

---

### Task 5: AI Block #1 (Post Sentiment Analysis)
- [x] **Status**: Complete ✓

**What to do**:
- Configure AI node to accept batch input
- Create prompt for post analysis (20 posts per call)
- Parse AI response (sentiment, status, evidence)
- Set up 5 AI calls (one per batch)
- Handle errors gracefully (allow partial failures)

**Prompt**:
```
You are a job market sentiment analyst.

Analyze these 20 posts and assign a sentiment score (0-100):
- 0-44: Bearish (negative outlook)
- 45-55: Mixed (neutral)
- 56-100: Bullish (positive outlook)

For each post, provide:
- sentiment: 0-100
- status: "bullish" | "bearish" | "neutral"
- evidence: A concrete phrase or data point EXTRACTED from the post that supports the sentiment score
  - Must be a specific quote or fact from the post
  - Examples: "3 rounds of interviews, no offer", "150 applications, 0 responses", "TC dropped from 400k to 250k"
  - NOT a made-up summary - extract actual text from the post

Posts:
{{posts}}

Respond as JSON array:
[
  {"title": "Got 5 offers!", "sentiment": 85, "status": "bullish", "evidence": "5 offers in 2 weeks, 250k base"},
  {"title": "Laid off today", "sentiment": 15, "status": "bearish", "evidence": "entire team of 50 laid off"}
]
```

**Error Handling**:
```javascript
// In n8n, wrap each AI call in try-catch
// If one batch fails, log error but continue with others
// Send Discord notification for failed batch
```

**Discord Webhook Format**:
```json
{
  "content": "⚠️ AI Call Failed - Batch {{batchNumber}}",
  "embeds": [{
    "title": "Error in n8n Workflow",
    "fields": [
      {"name": "Error", "value": "{{errorMessage}}"},
      {"name": "Batch", "value": "{{batchNumber}}/5"},
      {"name": "Timestamp", "value": "{{timestamp}}"}
    ]
  }]
}
```

**Acceptance Criteria**:
- [x] AI returns sentiment for each post
- [x] Response parsed correctly
- [x] 5 batches processed (5 AI calls)
- [x] Errors handled (partial success allowed)
- [x] Discord webhook configured

---

### Task 6: Aggregate Node - Combine Batch Results
- [x] **Status**: Complete ✓

**What to do**:
- Use n8n's built-in Aggregate node (not Function node)
- Combine all 5 batch results into single array
- Handle partial results gracefully

**n8n Aggregate Node Configuration**:
- **Node**: Aggregate
- **Aggregate**: All items into a single item
- **Options**: Wait for all items

**Acceptance Criteria**:
- [x] Aggregate node configured (not Function node)
- [x] Combines all batches into single array
- [x] Handles partial results (continues if some batches failed)

---

### Task 7: n8n Database - Create Tables (If Not Exists)
- [x] **Status**: Complete ✓

**What to do**:
- Create n8n database tables for posts and aggregates
- Define schema for each table
- **Use IF NOT EXISTS to make idempotent**
- Document schema in `docs/schema.md`

**n8n Database Node**:
```javascript
// Using n8n's built-in database node
// Create tables:

// Table: posts
{
  "operation": "create",
  "table": "posts",
  "fields": {
    "id": { "type": "number", "primary": true, "autoIncrement": true },
    "reddit_id": { "type": "string", "unique": true },
    "date": { "type": "string" },
    "title": { "type": "string" },
    "body": { "type": "string" },
    "sentiment": { "type": "number" },
    "status": { "type": "string" },
    "upvotes": { "type": "number" },
    "subreddit": { "type": "string" },
    "url": { "type": "string" },
    "evidence": { "type": "string" },
    "created_at": { "type": "string" }
  }
}

// Table: aggregates
{
  "operation": "create",
  "table": "aggregates",
  "fields": {
    "id": { "type": "number", "primary": true, "autoIncrement": true },
    "date": { "type": "string" },
    "daily": { "type": "object" },
    "weekly": { "type": "object" },
    "monthly": { "type": "object" },
    "created_at": { "type": "string" }
  }
}
```

**Acceptance Criteria**:
- [x] Tables created in n8n database
- [x] posts table has all required fields
- [x] aggregates table has all required fields
- [x] Tables are idempotent (can run multiple times)

---

### Task 8: n8n Database - Upsert Posts
- [x] **Status**: Complete ✓

**What to do**:
- Configure n8n Database node for upsert
- Map AI responses to `posts` table
- **UPSERT on `reddit_id`** to prevent duplicates
- Handle errors

**Why UPSERT?**
- Prevents duplicate posts on re-run
- Updates existing posts if upvotes changed
- Allows testing without breaking data

**n8n Database Node**:
```javascript
// Upsert posts on unique reddit_id
{
  "operation": "upsert",
  "table": "posts",
  "data": posts,
  "conflict": "reddit_id"
}
```

**Acceptance Criteria**:
- [x] Posts upserted into n8n database
- [x] No duplicates on re-run
- [x] All fields mapped correctly
- [x] Errors handled

---

### Task 9: Function - Calculate Aggregates
- [x] **Status**: Complete ✓

**What to do**:
- Write JavaScript function for weighted average with division-by-zero protection
- Calculate daily aggregate (today's posts)
- Calculate weekly aggregate (last 7 days from database)
- Calculate monthly aggregate (last 30 days from database)
- Determine status (bullish/bearish/mixed)
- Pick top posts (5 per aggregate) with fill logic

**Code**:
```javascript
// In n8n Function node:
const posts = items[0].json.posts; // All posts from today

// Calculate weighted average with division-by-zero protection
function calculateAggregate(posts) {
  const weightedSum = posts.reduce((sum, p) => sum + p.sentiment * p.upvotes, 0);
  const totalUpvotes = posts.reduce((sum, p) => sum + p.upvotes, 0);
  
  // Avoid division by zero - fall back to simple average if no upvotes
  const sentiment = totalUpvotes === 0
    ? posts.reduce((sum, p) => sum + p.sentiment, 0) / posts.length
    : weightedSum / totalUpvotes;
  
  // Determine status and pick top posts
  let status, topPosts;
  if (sentiment < 45) {
    status = "bearish";
    const sorted = [...posts].sort((a, b) => a.sentiment - b.sentiment);
    topPosts = sorted.slice(0, Math.min(5, sorted.length));
  } else if (sentiment > 55) {
    status = "bullish";
    const sorted = [...posts].sort((a, b) => b.sentiment - a.sentiment);
    topPosts = sorted.slice(0, Math.min(5, sorted.length));
  } else {
    status = "mixed";
    const bullish = posts.filter(p => p.sentiment > 55).sort((a, b) => b.sentiment - a.sentiment).slice(0, 2);
    const bearish = posts.filter(p => p.sentiment <45).sort((a, b) => a.sentiment - b.sentiment).slice(0, 2);
    const neutral = posts.filter(p => p.sentiment >= 45 && p.sentiment <= 55).slice(0,1);
    topPosts = [...bullish, ...bearish, ...neutral];
    if (topPosts.length < 5&& posts.length >= 5) {
      const remaining = posts.filter(p => !topPosts.includes(p)).slice(0,5 - topPosts.length);
      topPosts = [...topPosts, ...remaining];
    }
  }
  
  return {
    sentiment: Math.round(sentiment),
    status,
    topPosts: topPosts.map(p => p.reddit_id), // Store as IDs
    postCount: posts.length,
    avgUpvotes: totalUpvotes / posts.length
  };
}

const daily = calculateAggregate(posts);

// Query last 7 and 30 days of posts from n8n DB (via previous DB Get nodes)
// These must be wired in before this Function node:
//   - n8n Database node: GET posts WHERE date >= today-7 days  → $('DB 7d').all()
//   - n8n Database node: GET posts WHERE date >= today-30 days → $('DB 30d').all()
const weeklyPosts = $('DB 7d').all().map(i => i.json);
const monthlyPosts = $('DB 30d').all().map(i => i.json);

const weekly = weeklyPosts.length > 0 ? calculateAggregate(weeklyPosts) : daily;
const monthly = monthlyPosts.length > 0 ? calculateAggregate(monthlyPosts) : daily;

return [{
  json: {
    date: new Date().toISOString().split('T')[0],
    daily: daily,
    weekly: weekly,
    monthly: monthly
  }
}];
```

**Note on weekly/monthly**: Before this Function node, add two n8n Database "Get" nodes:
- **"DB 7d"**: query `posts` table WHERE `date >= today - 7 days`
- **"DB 30d"**: query `posts` table WHERE `date >= today - 30 days`
Wire both into this Function node as additional inputs. Falls back to daily if no history yet.

**Acceptance Criteria**:
- [x] Weighted average calculated correctly
- [x] Division by zero handled (falls back to simple average)
- [x] Status determined correctly
- [x] Top posts selected (handles cases with fewer than 5 posts)
- [x] Top posts stored as reddit_id foreign keys (NOT full objects)
- [x] Weekly aggregate calculated from last 7 days of DB posts (not null)
- [x] Monthly aggregate calculated from last 30 days of DB posts (not null)

---

### Task 10: AI Block #2 (Insight Messages + Evidence)
- [x] **Status**: Complete ✓

**What to do**:
- Create AI prompt for aggregate messages + evidence
- Query database for last 7/30 days of aggregates
- Send aggregate data to AI (3 calls: daily, weekly, monthly)
- Parse AI response (message + evidence)

**Prompt**:
```
You are a cynical job market analyst.

[Daily/Weekly/Monthly] sentiment: {{sentiment}}
Status: {{status}}
Top posts: {{topPostsList}}

Historical context:
- Last 7 days: {{weeklySentiment}}
- Last 30 days: {{monthlySentiment}}

Generate:
1. **Message**: 2-3 sentence summary with trends (be witty, slightly dark)
2. **Evidence**: 3-5 specific phrases from posts that support the sentiment
   - Include quantitative data when possible (percentages, counts)
   - Extract from top posts
   - Be concrete, not vague

Examples:
- "layoffs increased 300% this week"
- "70% of posts mention interview ghosting"
- "average response time increased to 2 weeks"
- "3 out of 5 posts mention return to office"

Format as JSON:
{
  "sentiment": 45,
  "status": "bearish",
  "message": "The market is COOKED. Layoffs up 300%, ghosting at 70%...",
  "evidence": [
    "layoffs increased 300% this week",
    "70% of posts mention interview ghosting",
    "average response time increased to 2 weeks",
    "remote job postings down 45%"
  ]
}
```

**Acceptance Criteria**:
- [x] AI generates message for each aggregate (3 calls)
- [x] AI generates 3-5 evidence phrases per aggregate
- [x] Evidence includes quantitative data
- [x] Message is 2-3 sentences
- [x] Message mentions trends
- [x] Errors handled (partial success allowed)

---

### Task 11: HTTP Webhook -Data Retrieval Endpoint
- [x] **Status**: Complete ✓

**What to do**:
- Create HTTP Webhook node in n8n
- Configure GET `/webhook/doom` endpoint
- Add Bearer token authentication
- Query n8n database for latest aggregates
- Return JSON response with daily, weekly, monthly

**HTTP Webhook Configuration**:
```javascript
// HTTP Request Trigger node
{
  "path": "doom",
  "method": "GET",
  "responseMode": "onReceived"
}

// Bearer token check (Function node after webhook)
const authHeader = $input.item.json.headers.authorization;
const expectedToken = 'Bearer ' + $env.WEBHOOK_SECRET;
if (authHeader !== expectedToken) {
  throw new Error('Unauthorized');
}
```

**Authentication**:
- Webhook protected by Bearer token
- Token stored in n8n environment: `WEBHOOK_SECRET`
- Backend sends: `Authorization: Bearer <token>`

**Expected Response**:
```json
{
  "daily": {
    "sentiment": 45,
    "status": "bearish",
    "message": "The market is COOKED...",
    "evidence": ["layoffs ↑ 300%", "70% mention ghosting"],
    "top_posts": [
      {
        "reddit_id": "t3_abc123",
        "title": "Laid off today",
        "sentiment": 15,
        "upvotes": 342,
        "status": "bearish",
        "evidence": "entire team of 50 laid off",
        "url": "https://reddit.com/r/..."
      }
    ]
  },
  "weekly": {...},
  "monthly": {...},
  "history": [
    {"date": "2024-01-17", "sentiment": 45},
    {"date": "2024-01-16", "sentiment": 48}
  ]
}
```

**Note on `history`**: The webhook must query the last 30 days of aggregate rows from the n8n database and return them as the `history` array. This powers the charts in the frontend. Each item is `{date, sentiment}` from the `aggregates` table.
```

**Acceptance Criteria**:
- [x] HTTP webhook endpoint created
- [x] Bearer token authentication configured
- [x] GET `/webhook/doom` returns JSON
- [x] Response includes daily, weekly, monthly
- [x] Response includes `history` array (last 30 days of `{date, sentiment}`)
- [x] Top posts joined with full data (title, sentiment, upvotes, status, evidence, url)
- [x] Returns 401 for missing/invalid token

---

## After Wave Completion

### Checklist
- [ ] All tasks marked complete
- [ ] Workflow runs successfully
- [ ] Data stored in n8n database
- [x] HTTP webhook returns data
- [x] Error handling tested
- [x] Discord webhook tested
- [ ] Evidence captured

### Next Wave
Move to **Wave 2: Bun Backend** - needs HTTP webhook URL from Wave 1.

---

## Evidence Files
Save evidence to `.sisyphus/evidence/wave-1-*/`:
- `wave-1-task-2-apify-config.png`
- `wave-1-task-7-database-tables.png`
- `wave-1-task-11-webhook-response.json`