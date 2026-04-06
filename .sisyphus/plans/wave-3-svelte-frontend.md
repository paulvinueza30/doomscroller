# Wave 3: Svelte Frontend

## Status
- **Dependencies**: None (can run in parallel with Waves 1-2)
- **Agent**: Any agent can pick this up
- **Estimated Time**: 2-3 hours

---

## Overview

This wave builds the Svelte frontend that displays sentiment data:
- Single page with 3 cards (daily/weekly/monthly)
- Chart component for historical trends
- API client to fetch from backend

**Key Deliverable**: A working frontend that displays sentiment data with memes and charts.

**Note**: Memes served from backend via `/memes/:filename` endpoint. No local static file serving needed.

---

## UI Layout

```
┌─────────────────────────────────────────────────┐
│                  DOOMSCROLL                     │
│          CS Job Market Sentiment Tracker         │
└─────────────────────────────────────────────────┘

┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│  DAILY CARD  │  │ WEEKLY CARD  │  │MONTHLY CARD  │
│              │  │              │  │              │
│   [MEME]     │  │   [MEME]     │  │   [MEME]     │
│              │  │              │  │              │
│ Sentiment:45 │  │ Sentiment:47 │  │ Sentiment:49 │
│ Status:BEAR  │  │ Status:MIXED │  │ Status:MIXED │
│              │  │              │  │              │
│ "The market  │  │ "Mixed        │  │ "Overall     │
│  is COOKED"  │  │  signals..." │  │  stable..."   │
│              │  │              │  │              │
│ Evidence:    │  │ Evidence:    │  │ Evidence:    │
│ • layoffs ↑  │  │ • 40% bullish│  │ • Range 42-55│
│ • ghost 70%  │  │ • 60% bearish│  │ • Avg: 48    │
│              │  │              │  │              │
│ Top Posts:   │  │ [CHART]      │  │ [CHART]      │
│ • Post 1     │  │              │  │              │
│ • Post 2     │  │ Last 7 days  │  │ Last 30 days │
│ • Post 3     │  │              │  │              │
└──────────────┘  └──────────────┘  └──────────────┘
```

---

## Tasks

### Task 22: Project Scaffolding
- [x] **Status**: Complete ✓

**What to do**:
- Initialize Svelte: `npm create svelte@latest frontend`
- Install dependencies: `chart.js`, `svelte-chartjs`
- Create directory structure: `src/lib/components/`, `src/routes/`

**Files**:
- `frontend/package.json`
- `frontend/src/routes/+page.svelte`
- `frontend/src/lib/components/`

**Commands**:
```bash
npm create svelte@latest frontend
cd frontend
npm install
npm install chart.js svelte-chartjs
npm install -D @sveltejs/adapter-static
```

**Configure static adapter** in `svelte.config.js`:
```javascript
import adapter from '@sveltejs/adapter-static';

export default {
  kit: {
    adapter: adapter({
      fallback: 'index.html' // SPA mode — lets client-side routing work
    })
  }
};
```

**Add to `src/routes/+layout.ts`** (required for adapter-static SPA mode):
```typescript
export const prerender = false;
export const ssr = false;
```

**Create `frontend/.env.example`**:
```bash
# URL of the Bun backend (no trailing slash)
VITE_API_URL=http://localhost:3000
```

**Acceptance Criteria**:
- [x] `npm run dev` starts dev server
- [x] Basic page loads
- [x] Dependencies installed
- [x] `@sveltejs/adapter-static` configured with `fallback: 'index.html'`
- [x] `frontend/.env.example` exists with `VITE_API_URL`

---

### Task 23: API Client Setup
- [x] **Status**: Complete ✓

**What to do**:
- Create API client for `GET /api/doom`
- Add error handling
- Type the response (including evidence field)

**Code**:
```typescript
// frontend/src/lib/api.ts
export interface DoomResponse {
  daily: Aggregate;
  weekly: Aggregate;
  monthly: Aggregate;
  history: HistoryItem[];
}

export interface Aggregate {
  sentiment: number;
  status: string;
  message: string;
  meme: string;
  evidence: string[]; // NEW: Evidence phrases
  top_posts: Post[];
}

export interface Post {
  reddit_id: string;
  title: string;
  sentiment: number;
  status: string;
  upvotes: number;
  evidence: string; // Concrete phrase from post supporting sentiment
  url: string;
}

export interface HistoryItem {
  date: string;
  sentiment: number;
}

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export async function getDoom(): Promise<DoomResponse> {
  const response = await fetch(`${API_URL}/api/doom`);
  if (!response.ok) {
    throw new Error('Failed to fetch doom');
  }
  return response.json();
}
```

**Acceptance Criteria**:
- [x] API client created
- [x] Types defined (including evidence)
- [x] Error handling added
- [x] Environment variable for API URL

---

### Task 24: Daily Card Component
- [x] **Status**: Complete ✓

**What to do**:
- Create `DailyCard.svelte` component
- Display sentiment, status, meme, message
- Display evidence phrases
- Display top 5 posts with their evidence (concrete phrases)
- Style with Tailwind or shadcn-svelte

**Code**:
```svelte
<!-- frontend/src/lib/components/DailyCard.svelte -->
<script lang="ts">
  import type { Aggregate } from '../api';
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

  export let daily: Aggregate;
</script>

<div class="card">
  <div class="meme">
    <img src="{API_URL}/memes/{daily.meme}" alt="{daily.status}" />
  </div>
  
  <div class="sentiment">
    <h2>Daily Sentiment: {daily.sentiment}</h2>
    <p class="status">{daily.status}</p>
  </div>
  
  <div class="message">
    <p>{daily.message}</p>
  </div>
  
  <div class="evidence">
    <h3>Evidence:</h3>
    <ul>
      {#each daily.evidence as phrase}
        <li>• {phrase}</li>
      {/each}
    </ul>
  </div>
  
  <div class="top-posts">
    <h3>Top Posts:</h3>
    {#each daily.top_posts as post}
      <div class="post">
        <p><strong>{post.title}</strong></p>
        <p class="evidence">{post.evidence}</p>
        <a href={post.url}>View on Reddit</a>
      </div>
    {/each}
  </div>
</div>
```

**Acceptance Criteria**:
- [x] Card displays sentiment
- [x] Card displays meme image
- [x] Card displays AI message
- [x] Card displays evidence phrases
- [x] Card displays top 5 posts
- [x] Styled with Tailwind/shadcn

---

### Task 25: Weekly Card Component
- [x] **Status**: Complete ✓

**What to do**:
- Create `WeeklyCard.svelte` component
- Display sentiment, status, meme, message
- Display evidence phrases
- Display sentiment chart (last 7 days)
- Display evidence from weekly aggregate

**Code**:
```svelte
<!-- frontend/src/lib/components/WeeklyCard.svelte -->
<script lang="ts">
  import type { Aggregate } from '../api';
  import Chart from './Chart.svelte';
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

  export let weekly: Aggregate;
  export let history: HistoryItem[];
</script>

<div class="card">
  <div class="meme">
    <img src="{API_URL}/memes/{weekly.meme}" alt="{weekly.status}" />
  </div>
  
  <div class="sentiment">
    <h2>Weekly Sentiment: {weekly.sentiment}</h2>
    <p class="status">{weekly.status}</p>
  </div>
  
  <div class="message">
    <p>{weekly.message}</p>
  </div>
  
  <div class="evidence">
    <h3>Evidence:</h3>
    <ul>
      {#each weekly.evidence as phrase}
        <li>• {phrase}</li>
      {/each}
    </ul>
  </div>
  
  <div class="chart">
    <Chart data={history} title="Last 7 Days" />
  </div>
  
  <div class="top-posts">
    <h3>Top Posts:</h3>
    {#each weekly.top_posts as post}
      <div class="post">
        <p><strong>{post.title}</strong></p>
        <p class="evidence">{post.evidence}</p>
      </div>
    {/each}
  </div>
</div>
```

**Acceptance Criteria**:
- [x] Card displays sentiment trend chart
- [x] Card displays aggregated data
- [x] Card displays evidence phrases
- [x] Chart shows last 7 days

---

### Task 26: Monthly Card Component
- [x] **Status**: Complete ✓

**What to do**:
- Create `MonthlyCard.svelte` component
- Display sentiment, status, meme, message
- Display evidence phrases
- Display sentiment chart (last 30 days)
- Display evidence from monthly aggregate

**Code**:
Similar to Weekly Card, but with 30-day history.

**Acceptance Criteria**:
- [x] Card displays sentiment trend chart
- [x] Card displays aggregated data
- [x] Card displays evidence phrases
- [x] Chart shows last 30 days

---

### Task 27: Chart Component
- [x] **Status**: Complete ✓

**What to do**:
- Create `Chart.svelte` component using Chart.js
- Accept sentiment history data
- Render line chart
- Style with Tailwind

**Code**:
```svelte
<!-- frontend/src/lib/components/Chart.svelte -->
<script lang="ts">
  import { Line } from 'svelte-chartjs';
  import { Chart, registerables } from 'chart.js';
  Chart.register(...registerables);
  
  export let data; // [{date, sentiment}, ...]
  export let title: string;
</script>

<div class="chart-container">
  <h3>{title}</h3>
  <Line
    data={{
      labels: data.map(d => d.date),
      datasets: [{
        label: 'Sentiment',
        data: data.map(d => d.sentiment),
        borderColor: 'rgb(75, 192, 192)',
        tension: 0.1
      }]
    }}
  />
</div>
```

**Acceptance Criteria**:
- [x] Chart displays sentiment over time
- [x] X-axis: dates
- [x] Y-axis: sentiment (0-100)
- [x] Styled with Tailwind

---

### Task 30: Dockerfile for Svelte Frontend
- [x] **Status**: Complete ✓

**What to do**:
- Create `Dockerfile` for Svelte frontend
- Use Node for build, `serve` for static files
- No nginx needed (use `serve` package)

**Dockerfile**:
```dockerfile
FROM node:18 AS builder

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

# Pass API URL at build time
ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL

RUN npm run build

FROM node:18-alpine

WORKDIR /app

# adapter-static outputs to build/
COPY --from=builder /app/build ./build

RUN npm install -g serve

EXPOSE 80

CMD ["serve", "-s", "build", "-l", "80"]
```

**Acceptance Criteria**:
- [x] Docker image builds successfully
- [x] Container starts on port 80
- [x] Frontend accessible at `/`
- [x] No nginx dependency
- [x] Static files served by `serve` package

**Notes**:
- Using `serve` package instead of nginx (simpler setup)
- Frontend fetches memes from backend `/memes/:filename`
- No nginx configuration needed

---

## After Wave Completion

### Checklist
- [x] All tasks marked complete
- [x] `npm run dev` succeeds
- [x] Frontend loads in browser
- [x] All 3 cards render
- [x] Memes display correctly
- [x] Charts render properly
- [x] Evidence phrases display
- [x] Dockerfile builds successfully

### Next Wave
Move to **Wave 4: Integration + Deployment** - needs Waves 1-3 complete.

---

## Evidence Files
Save evidence to `.sisyphus/evidence/wave-3-*/`:
- `wave-3-task-24-daily-card.png`
- `wave-3-task-27-chart.png`
- `wave-3-task-30-docker-build.png`