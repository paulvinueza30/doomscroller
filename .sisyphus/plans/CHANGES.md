# Plan Revision History

All changes made to the implementation plan during the planning phase.

---

## 1. Architecture Changes

### Removed Supabase
**Reason**: Simpler setup, no external database needed.

**Before**: n8n → Supabase → Backend → Frontend  
**After**: n8n (built-in DB) → HTTP webhook → Backend → Frontend

**Impact**:
- No Supabase account/setup needed
- n8n stores data in its built-in database
- Backend fetches from n8n HTTP webhook
- Simpler architecture, fewer moving parts

---

### Removed Environment Variables (for subreddits)
**Reason**: Subreddits are stable and hardcoding simplifies the workflow.

**Before**: Subreddits from `process.env.REDDIT_SUBREDDITS`
**After**: Hardcoded subreddit array in n8n Function node

**Impact**:
- Subreddits configured directly in workflow
- To change subreddits, edit the workflow
- Note: `APIFY_API_TOKEN` and `WEBHOOK_SECRET` are still required as n8n env vars
  (self-hosted n8n supports env vars fine — set via Docker environment or n8n admin UI)

---

### Backend Serves Memes
**Reason**: Avoid nginx dependency for static files.

**Before**: Nginx serves memes from `frontend/public/memes/`  
**After**: Bun backend serves memes at `/memes/:filename`

**Impact**:
- No nginx needed for static files
- Simpler Docker setup
- Memes stored in `backend/public/memes/`
- Frontend fetches memes from backend

---

### Use n8n Built-in Nodes
**Reason**: Simplify workflow, use n8n's native capabilities.

**Before**: Function nodes for batching and aggregation  
**After**: n8n Batch and Aggregate nodes

**Impact**:
- Task4: Use Batch node (split into 5 batches)
- Task 6: Use Aggregate node (combine results)
- Less custom JavaScript code
- More maintainable workflow

---

### Bearer Token Authentication
**Reason**: Simpler webhook security than API keys.

**Before**: n8n API key in backend  
**After**: Bearer token in `Authorization` header

**Impact**:
- Single secret: `WEBHOOK_SECRET` in .env
- Backend sends: `Authorization: Bearer <token>`
- n8n validates token before returning data
- Simpler configuration

---

## 2. Bug Fixes

### Division by Zero in Weighted Average
**Location**: `wave-1-n8n-pipeline.md` Task 9

**Issue**: If all posts have `upvotes: 0`, division by zero occurs.

**Fix**: Added fallback to simple average when `totalUpvotes === 0`:
```javascript
const sentiment = totalUpvotes === 0
  ? posts.reduce((sum, p) => sum + p.sentiment, 0) / posts.length
  : weightedSum / totalUpvotes;
```

---

### Incomplete top_posts Array
**Location**: `wave-1-n8n-pipeline.md` Task 9

**Issue**: "Mixed" sentiment case may have fewer than5 items.

**Fix**: Added fill logic:
```javascript
if (topPosts.length < 5 && posts.length >= 5) {
  const remaining = posts.filter(p => !topPosts.includes(p)).slice(0,5 - topPosts.length);
  topPosts = [...topPosts, ...remaining];
}
```

---

### Parallelization Contradiction
**Location**: `agents.md`

**Issue**: Claimed Waves 1-4 can run in parallel, but Wave 2 depends on Wave1 Task 11.

**Fix**: Updated to:
- Wave 1 and Wave 3: Can run in parallel (no dependencies)
- Wave 2: Depends on Wave 1 Task 11 (HTTP webhook must exist)
- Wave 4: Depends on Waves 1, 2, and 3

---

## 3. File Restructuring

### Created wave-final-verification.md
**Reason**: Referenced in `agents.md` but didn't exist.

**Added**: F1-F4 verification tasks for final QA.

---

### Deleted Draft Files
**Reason**: Drafts served their purpose during planning phase.

**Removed**:
- `.sisyphus/drafts/plan-review-fixes.md`
- `.sisyphus/drafts/supabase-removal.md`

---

## 4. Docker Setup

### Updated Docker Compose
**Reason**: Use user's provided template with Traefik.

**Changes**:
- Removed Supabase service
- Frontend uses `serve` package instead of nginx
- Added Traefik labels for routing
- Backend serves memes statically

---

### Added .gitignore
**Reason**: Prevent `.env` from being committed.

```
.env
*.env.local
node_modules/
bun.lockb
dist/
build/
*.log
.DS_Store
.vscode/
.idea/
secrets/
*.pem
n8n-data/
```

---

## 5. AI Slop Removal

### Removed Parenthetical Annotations
**Files**: `wave-3-svelte-frontend.md`, `reddit-doomscroll-agent.md`

**Removed**: 13 instances of `(NEW)` parentheticals

**Before**: `- [ ] Card displays evidence phrases (NEW)`  
**After**: `- [ ] Card displays evidence phrases`

**Reason**: Redundant annotations that don't add value.

---

## 6. Wave File Changes

| File | Changes |
|------|---------|
| `wave-1-n8n-pipeline.md` | Uses Batch/Aggregate nodes, Bearer token auth, added meme download task |
| `wave-2-bun-backend.md` | Fetch from n8n webhook with Bearer token, serves memes statically |
| `wave-3-svelte-frontend.md` | Memes from backend, Task 28 obsolete, Dockerfile uses `serve` |
| `wave-4-integration-deployment.md` | New Docker Compose, added .gitignore task |
| `agents.md` | Fixed parallelization dependencies |
| `reddit-doomscroll-agent.md` | Simplified to overview, details in wave files |

---

## 7. NewArchitecture Flow

```
[n8n External Service]
├── Scrapes Reddit (Apify)
├── Analyzes sentiment (AI)
├── Stores in n8n internal DB
├── Exposes HTTP webhook
└── Runs daily at 9 AM
        ↓
[Backend (Bun)]
├── Fetches from n8n webhook
├── Maps sentiment → meme
├── Serves memes (/memes/:filename)
├── Serves API (/api/doom)
└── Caches responses (5-min TTL)
        ↓
[Frontend (Svelte)]
├── Displays 3 cards
├── Shows memes from backend
└── Shows charts
```

---

## 8. Tasks Summary

| Wave | Tasks | Estimated Time |
|------|-------|----------------|
| Wave 1 | 11 tasks | 2-3 hours |
| Wave 2 | 7 tasks | 2-3 hours |
| Wave 3 | 5 tasks | 2-3 hours |
| Wave 4 | 8 tasks | 1-2 hours |
| Wave Final |4 tasks | 1-2 hours |
| **Total** | **35 tasks** | **8-13 hours** |

---

## 9. Questions Resolved

| Question | Decision |
|----------|----------|
| Database | n8n built-in (no Supabase) |
| Environment variables | None (hardcoded array) |
| Static file serving | Backend serves memes |
| Frontend server | `serve` package (no nginx) |
| Meme images | Agent searches web and downloads via curl (Task 19) |
| Testing | Manual QA (no automated tests) |

---

## 10. Next Steps

1. **Meme images**:
   - Option A: Download from public URLs (Imgflip, Know Your Meme)
   - Option B: Add manually to `backend/public/memes/`
   - Ensure filenames match meme-map.ts ranges

2. **Webhook authentication**:
   - Set `WEBHOOK_SECRET` in n8n environment
   - Set `WEBHOOK_SECRET` in backend `.env`
   - Same secret value in both places

3. **Traefik setup**:
   - Ensure external `proxy` network exists

4. **Start execution**:
   - Run `/start-work` to begin