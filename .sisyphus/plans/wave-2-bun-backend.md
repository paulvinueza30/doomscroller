# Wave 2: Bun Backend

## Status
- **Dependencies**: Wave 1 Task 11 (HTTP webhook must be available)
- **Agent**: Any agent can pick this up after Wave 1 Task 11
- **Estimated Time**: 2-3 hours

---

## Overview

This wave builds the Bun backend that serves data to the Svelte frontend:
- Bun.serve setup
- n8n webhook client
- GET /api/doom endpoint
- Meme mapping logic
- Dockerfile

**Key Deliverable**: A working backend API that returns sentiment data from n8n webhook.

---

## Endpoints

### GET /api/doom
Returns the latest aggregate + historical data for charts.

**Response**:
```json
{
  "daily": {
    "sentiment": 45,
    "status": "bearish",
    "message": "The market is COOKED...",
    "meme": "this_is_fine.jpg",
    "evidence": ["layoffs ↑ 300%", "70% mention ghosting"],
    "top_posts": [
      {
        "reddit_id": "abc123",
        "title": "Laid off today",
        "sentiment": 15,
        "status": "bearish",
        "upvotes": 342,
        "evidence": "entire team of 50 laid off",
        "url": "https://reddit.com/r/..."
      }
    ]
  },
  "weekly": {
    "sentiment": 47,
    "status": "mixed",
    "message": "Mixed signals...",
    "meme": "drake_hotline.jpg",
    "evidence": ["40% bullish", "60% bearish"],
    "top_posts": [...]
  },
  "monthly": {
    "sentiment": 49,
    "status": "mixed",
    "message": "Overall blah...",
    "meme": "drake_hotline.jpg",
    "evidence": ["Range 42-55"],
    "top_posts": [...]
  },
  "history": [
    {"date": "2024-01-17", "sentiment": 45},
    {"date": "2024-01-16", "sentiment": 48},
    ...
  ]
}
```

**Note**: Backend maps `sentiment` to `meme` dynamically (NOT stored in DB).

---

## Tasks

### Task 13: Project Scaffolding
- [x] **Status**: Complete ✓

**What to do**:
- Initialize Bun project: `bun init backend`
- Create directory structure: `src/`, `tests/`
- Create `.gitignore` with `.env`
- Create `.env.example` (for Docker compose)

**Files**:
- `backend/package.json`
- `backend/.env.example`
- `backend/.gitignore`
- `backend/tsconfig.json`
- `backend/src/index.ts`

**Commands**:
```bash
mkdir -p backend
cd backend
bun init
```

**`.gitignore`**:
```
.env
node_modules/
dist/
*.log
.DS_Store
public/memes/
!public/memes/.gitkeep
```

**`.env.example`** (for Docker Compose):
```bash
# Backend environment
N8N_WEBHOOK_URL=http://your-n8n-instance/webhook/doom
WEBHOOK_SECRET=your_webhook_secret_here
PORT=3000

# Frontend environment (if needed)
PUBLIC_API_URL=https://doomscroll.paulvinueza.dev/api

# Traefik
CERT_RESOLVER=myresolver
```

**Acceptance Criteria**:
- [x] `bun install` succeeds
- [x] `.gitignore` exists with `.env` entry
- [x] `.env.example` exists
- [x] Directory structure created

---

### Task 14: Bun Server Setup
- [x] **Status**: Complete ✓

**What to do**:
- Create `Bun.serve` server
- Add CORS middleware
- Add error handling
- Create basic route structure

**Code**:
```typescript
// backend/src/index.ts
const server = Bun.serve({
  port: process.env.PORT ||3000,
  async fetch(req) {
    const url = new URL(req.url);
    
    // CORS headers
    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type"
    };
    
    // Handle preflight
    if (req.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders });
    }
    
    // Routes
    if (url.pathname === "/api/doom") {
      try {
        const data = await getDoomData();
        return Response.json(data, { headers: corsHeaders });
      } catch (error) {
        return Response.json(
          { error: "Failed to fetch data" },
          { status: 500, headers: corsHeaders }
        );
      }
    }
    
    // Health check
    if (url.pathname === "/health") {
      return Response.json({ status: "ok" }, { headers: corsHeaders });
    }
    
    return Response.json(
      { error: "Not found" },
      { status: 404, headers: corsHeaders }
    );
  }
});

console.log(`Server running on http://localhost:${server.port}`);
```

**Acceptance Criteria**:
- [x] Server starts on port 3000
- [x] CORS headers set correctly
- [x] Error handling works
- [x] Health check endpoint works

---

### Task 15: n8n Webhook Client
- [x] **Status**: Complete ✓

**What to do**:
- Create client to fetch from n8n webhook
- Handle authentication (API key if needed)
- Add error handling and retries
- Add caching with TTL

**Code**:
```typescript
// backend/src/lib/n8n-client.ts

interface N8NResponse {
  daily: AggregateData;
  weekly: AggregateData;
  monthly: AggregateData;
  history?: HistoricalData[];
}

interface AggregateData {
  sentiment: number;
  status: string;
  message: string;
  evidence: string[];
  top_posts: PostData[];
}

interface PostData {
  reddit_id: string;
  title: string;
  sentiment: number;
  status: string;
  upvotes: number;
  evidence: string;
  url: string;
}

interface HistoricalData {
  date: string;
  sentiment: number;
}

// Simple in-memory cache
let cachedData: N8NResponse | null = null;
let cacheTime: number = 0;
const CACHE_TTL = 5* 60 * 1000; // 5 minutes

export async function fetchFromN8N(): Promise<N8NResponse> {
  const webhookUrl = process.env.N8N_WEBHOOK_URL;
  const webhookSecret = process.env.WEBHOOK_SECRET;

  // Check cache
  if (cachedData && Date.now() - cacheTime < CACHE_TTL) {
    return cachedData;
  }

  // Fetch from n8n webhook with Bearer token
  const response = await fetch(webhookUrl, {
    headers: {
      "Authorization": `Bearer ${webhookSecret}`,
      "Content-Type": "application/json"
    }
  });

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error("Unauthorized: Invalid webhook secret");
    }
    throw new Error(`n8n webhook failed: ${response.status}`);
  }

  const data = await response.json() as N8NResponse;

  // Update cache
  cachedData = data;
  cacheTime = Date.now();

  return data;
}
```

**Acceptance Criteria**:
- [x] Fetches from n8n webhook successfully
- [x] Handles authentication (if API key provided)
- [x] Caches data with5-minute TTL
- [x] Error handling returns meaningful errors
- [x] Retries on failure (optional)

---

### Task 16: Meme Mapping Function
- [x] **Status**: Complete ✓

**What to do**:
- Create meme mapping function
- Map sentiment ranges to meme filenames
- Apply meme to each aggregate (daily, weekly, monthly)

**Code**:
```typescript
// backend/src/lib/meme-map.ts

// Meme ranges: sentiment 0-100 mapped to specific memes
const MEME_RANGES: Record<string, [number, number]> = {
  'crying_jordan.jpg': [0, 10],
  'this_is_fine.jpg': [11,20],
  'crying_jeremy.jpg': [21, 30],
  'i_have_no_idea.jpg': [31, 44],
  'drake_hotline.jpg': [45, 55],
  'stonks.jpg': [56, 70],
  'success_kid.jpg': [71, 85],
  'chad_yes.jpg': [86, 100]
};

export function getMemeForSentiment(sentiment: number): string {
  for (const [meme, range] of Object.entries(MEME_RANGES)) {
    if (sentiment >= range[0] && sentiment <= range[1]) {
      return meme;
    }
  }
  return 'drake_hotline.jpg'; // Default fallback
}

export function addMemeToAggregate(aggregate: AggregateData): AggregateDataWithData {
  return {
    ...aggregate,
    meme: getMemeForSentiment(aggregate.sentiment)
  };
}
```

**Acceptance Criteria**:
- [x] All sentiment ranges covered (0-100)
- [x] Returns correct meme for each range
- [x] Default fallback exists
- [x] Function is pure (no side effects)

---

### Task 17: GET /api/doom Endpoint
- [x] **Status**: Complete ✓

**What to do**:
- Implement GET /api/doom endpoint
- Fetch data from n8n webhook
- Add meme mapping
- Return formatted JSON

**Code**:
```typescript
// backend/src/index.ts (continued)

import { fetchFromN8N } from './lib/n8n-client';
import { addMemeToAggregate } from './lib/meme-map';

async function getDoomData() {
  const data = await fetchFromN8N();
  
  // Add memes to each aggregate
  const dailyWithMeme = addMemeToAggregate(data.daily);
  const weeklyWithMeme = addMemeToAggregate(data.weekly);
  const monthlyWithMeme = addMemeToAggregate(data.monthly);
  
  return {
    daily: dailyWithMeme,
    weekly: weeklyWithMeme,
    monthly: monthlyWithMeme,
    history: data.history || []
  };
}
```

**Acceptance Criteria**:
- [x] endpoint returns correct JSON structure
- [x] Memes mapped correctly to sentiment
- [x] Data fetched from n8n webhook
- [x] Response time <500ms (with caching)
- [x] Error handling returns500 status

---

### Task 18: Static File Serving (Memes)
- [x] **Status**: Complete ✓

**What to do**:
- Add static file server for memes
- Store memes in `backend/public/memes/`
- Serve at `/memes/:filename` endpoint
- No nginx needed for static files

**Directory Structure**:
```
backend/
├── public/
│   └── memes/
│       ├── crying_jordan.jpg
│       ├── this_is_fine.jpg
│       ├── crying_jeremy.jpg
│       ├── i_have_no_idea.jpg
│       ├── drake_hotline.jpg
│       ├── stonks.jpg
│       ├── success_kid.jpg
│       └── chad_yes.jpg
├── src/
│   └── index.ts
└── package.json
```

**Code**:
```typescript
// backend/src/index.ts (add static serving)

import { fetchFromN8N } from './lib/n8n-client';
import { addMemeToAggregate } from './lib/meme-map';

const server = Bun.serve({
  port: process.env.PORT ||3000,
  async fetch(req) {
    const url = new URL(req.url);
    
    // CORS headers
    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type"
    };
    
    // Handle preflight
    if (req.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders });
    }
    
    // Serve static files (memes)
    if (url.pathname.startsWith("/memes/")) {
      const filename = url.pathname.replace("/memes/", "");
      const file = Bun.file(`./public/memes/${filename}`);
      
      if (await file.exists()) {
        return new Response(file, {
          headers: {
            "Content-Type": file.type,
            "Cache-Control": "public, max-age=31536000"// 1 year cache
          }
        });
      }
      
      return new Response("Not found", { status: 404 });
    }
    
    // API routes
    if (url.pathname === "/api/doom") {
      try {
        const data = await getDoomData();
        return Response.json(data, { headers: corsHeaders });
      } catch (error) {
        return Response.json(
          { error: "Failed to fetch data" },
          { status: 500, headers: corsHeaders }
        );
      }
    }
    
    // Health check
    if (url.pathname === "/health") {
      return Response.json({ status: "ok" }, { headers: corsHeaders });
    }
    
    return Response.json(
      { error: "Not found" },
      { status: 404, headers: corsHeaders }
    );
  }
});

console.log(`Server running on http://localhost:${server.port}`);
```

**Acceptance Criteria**:
- [x] Memes stored in `backend/public/memes/`
- [x] `/memes/:filename` serves static files
- [x] Correct Content-Type headers
- [x] Cache headers set for performance
- [x] 404 for missing files

---

### Task 19: Download Meme Images
- [x] **Status**: Complete ✓

**What to do**:
- Search the web for clean, recognizable versions of each meme
- Download each image directly to `backend/public/memes/` using `curl` or `wget`
- Prefer direct image links (`.jpg` / `.png`) from Imgflip, Know Your Meme, Wikimedia, or Reddit
- Verify each file is a valid image after download

**How to find URLs**:
- Use WebSearch to find each meme by name (e.g. "crying jordan meme jpg site:imgflip.com")
- Pick the highest quality direct image link
- Confirm the URL returns an image before downloading

**Memes to fetch** (filenames must match exactly):
```
crying_jordan.jpg     → sentiment 0-10
this_is_fine.jpg      → sentiment 11-20
crying_jeremy.jpg     → sentiment 21-30
i_have_no_idea.jpg    → sentiment 31-44
drake_hotline.jpg     → sentiment 45-55
stonks.jpg            → sentiment 56-70
success_kid.jpg       → sentiment 71-85
chad_yes.jpg          → sentiment 86-100
```

**Download commands** (fill in URLs after searching):
```bash
mkdir -p backend/public/memes
curl -L -o backend/public/memes/crying_jordan.jpg "<URL>"
curl -L -o backend/public/memes/this_is_fine.jpg "<URL>"
curl -L -o backend/public/memes/crying_jeremy.jpg "<URL>"
curl -L -o backend/public/memes/i_have_no_idea.jpg "<URL>"
curl -L -o backend/public/memes/drake_hotline.jpg "<URL>"
curl -L -o backend/public/memes/stonks.jpg "<URL>"
curl -L -o backend/public/memes/success_kid.jpg "<URL>"
curl -L -o backend/public/memes/chad_yes.jpg "<URL>"

# Verify all 8 files exist and are non-empty
ls -lh backend/public/memes/
```

**Acceptance Criteria**:
- [x] Directory `backend/public/memes/` exists
- [x] All 8 meme files present and non-empty
- [x] Filenames match exactly (see meme-map.ts)
- [x] Memes accessible via `/memes/:filename` once server runs

**Notes**:
- Add `.gitkeep` to `backend/public/memes/` so the empty dir is tracked if images are gitignored
- Memes are gitignored (binary files) — the download step must run at setup time

---

### Task 21: Write Backend Tests
- [x] **Status**: Complete ✓

**What to do**:
- Create `backend/src/tests/` directory
- Write tests for meme mapping logic (pure function, easy to test)
- Write tests for `/api/doom` endpoint (mock the n8n webhook)
- Write a test for the health check endpoint

**Code**:
```typescript
// backend/src/tests/meme-map.test.ts
import { expect, test } from 'bun:test';
import { getMemeForSentiment } from '../lib/meme-map';

test('sentiment 0 returns crying_jordan', () => {
  expect(getMemeForSentiment(0)).toBe('crying_jordan.jpg');
});
test('sentiment 10 returns crying_jordan', () => {
  expect(getMemeForSentiment(10)).toBe('crying_jordan.jpg');
});
test('sentiment 50 returns drake_hotline (neutral)', () => {
  expect(getMemeForSentiment(50)).toBe('drake_hotline.jpg');
});
test('sentiment 100 returns chad_yes', () => {
  expect(getMemeForSentiment(100)).toBe('chad_yes.jpg');
});
test('all ranges covered (no gaps)', () => {
  for (let i = 0; i <= 100; i++) {
    expect(getMemeForSentiment(i)).toBeTruthy();
  }
});
```

```typescript
// backend/src/tests/api.test.ts
import { expect, test, mock } from 'bun:test';

// Mock fetchFromN8N before importing index
mock.module('../lib/n8n-client', () => ({
  fetchFromN8N: async () => ({
    daily: { sentiment: 45, status: 'bearish', message: 'cooked', evidence: [], top_posts: [] },
    weekly: { sentiment: 47, status: 'mixed', message: 'mixed', evidence: [], top_posts: [] },
    monthly: { sentiment: 49, status: 'mixed', message: 'stable', evidence: [], top_posts: [] },
    history: []
  })
}));

test('GET /api/doom returns 200 with meme fields', async () => {
  const res = await fetch('http://localhost:3000/api/doom');
  expect(res.status).toBe(200);
  const data = await res.json();
  expect(data.daily.meme).toBeTruthy();
  expect(data.weekly.meme).toBeTruthy();
  expect(data.monthly.meme).toBeTruthy();
});

test('GET /health returns ok', async () => {
  const res = await fetch('http://localhost:3000/health');
  expect(res.status).toBe(200);
  const data = await res.json();
  expect(data.status).toBe('ok');
});
```

**Acceptance Criteria**:
- [x] `bun test` passes with no failures
- [x] All 8 meme sentiment ranges covered
- [x] `/api/doom` tested with mocked n8n client
- [x] `/health` endpoint tested

---

### Task 20: Dockerfile for Backend
- [x] **Status**: Complete ✓

**What to do**:
- Create `Dockerfile` for Bun backend
- Use multi-stage build
- Include public/memes directory
- Configure for production

**Dockerfile**:
```dockerfile
FROM oven/bun:1 AS base
WORKDIR /app

# Install dependencies
FROM base AS deps
COPY package.json bun.lockb ./
RUN bun install --frozen-lockfile

# Build
FROM base AS build
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN bun build ./src/index.ts --compile --outfile server

# Production
FROM base AS prod
COPY --from=build /app/server /app/server
COPY --from=build /app/public /app/public
COPY --from=build /app/.env.example /app/.env.example

ENV NODE_ENV=production
ENV PORT=3000

EXPOSE3000

CMD ["./server"]
```

**Acceptance Criteria**:
- [x] Docker image builds successfully
- [x] Container starts on port 3000
- [x] Health check endpoint accessible
- [x] `/api/doom` endpoint accessible
- [x] `/memes/*` serves static files

---

## After Wave Completion

### Checklist
- [x] All tasks marked complete
- [x] Server starts successfully
- [x] GET /api/doom returns correct JSON
- [x] Memes mapped correctly
- [x] Docker image builds
- [x] .gitignore includes `.env`

### Next Wave
Move to **Wave 3: Svelte Frontend** - needs `/api/doom` endpoint.

---

## Evidence Files
Save evidence to `.sisyphus/evidence/wave-2-*/`:
- `wave-2-task-14-server-start.png`
- `wave-2-task-17-api-response.json`
- `wave-2-task-18-docker-build.log`