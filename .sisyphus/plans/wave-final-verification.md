# Wave Final: Verification

## Status
- **Dependencies**: ALL Waves 1-4 must be complete
- **Agent**: Any agent can pick this up after Waves 1-4
- **Estimated Time**: 1-2 hours

---

## Overview

This wave performs final verification and QA:
- Plan compliance audit
- Code quality review
- End-to-end manual QA
- Scope fidelity check

**Key Deliverable**: Verified working system ready for production.

---

## Tasks

### Task F1: Plan Compliance Audit
- [ ] **Status**: Pending

**What to do**:
- Read plan end-to-end
- Check all components implemented
- Verify all requirements met
- Cross-reference deliverables

**Checklist**:
- [ ] Apify scraper configured
- [ ] n8n workflow functional
- [ ] AI templates created
- [ ] n8n database tables created (posts + aggregates)
- [ ] Bun backend working
- [ ] Svelte frontend rendering
- [ ] Docker compose working
- [ ] Tests passing

**Acceptance Criteria**:
- [ ] All "Must Have" features implemented
- [ ] All tasks have evidence
- [ ] No missing components

**Notes**:
- Use this as final checklist before deployment

---

### Task F2: Code Quality Review
- [ ] **Status**: Pending

**What to do**:
- Run `bun test` in backend
- Check code style consistency
- Verify error handling
- Check for AI slop patterns

**Commands**:
```bash
cd backend
bun test
```

**Code Quality Checks**:
- [ ] `bun test` passes
- [ ] No `console.log` in production code
- [ ] No `as any` type assertions
- [ ] No empty catch blocks
- [ ] No unused imports
- [ ] Error handling present at all API boundaries
- [ ] Consistent naming conventions

**Acceptance Criteria**:
- [ ] All tests pass
- [ ] No console.log in production
- [ ] Error handling present
- [ ] Code style consistent

---

### Task F3: Manual QA (End-to-End)
- [ ] **Status**: Pending

**What to do**:
- Run full pipeline manually
- Verify data flows correctly
- Check frontend displays data
- Test all user interactions

**Test Scenarios**:

**1. n8n Workflow Runs**:
```bash
# In n8n dashboard:
# 1. Click "Execute Workflow"
# 2. Monitor all 5 AI batches
# 3. Check for errors
```

**2. n8n Database Contains Data**:
```bash
# In n8n dashboard, check database tables:
# - posts table has rows for today
# - aggregates table has one row for today
# Alternatively, check via HTTP webhook response (daily.top_posts should have posts)
```

**3. API Returns Correct Data**:
```bash
curl http://localhost:3000/api/doom
# Verify:
# - daily, weekly, monthly objects exist
# - sentiment is 0-100
# - status is bullish/bearish/mixed
# - meme field exists
# - evidence array has 3-5 items
# - top_posts have full details (not just IDs)
```

**4. Frontend Displays Correctly**:
```bash
# Open frontend
open http://localhost

# Verify:
# - 3 cards render (daily/weekly/monthly)
# - Memes display correctly
# - Evidence phrases visible
# - Top posts show titles and upvotes
# - Charts render properly
```

**Acceptance Criteria**:
- [ ] n8n workflow runs successfully
- [ ] n8n database contains data (posts + aggregates)
- [ ] API returns correct JSON structure
- [ ] Frontend displays 3 cards correctly
- [ ] Memes load properly
- [ ] Evidence phrases display
- [ ] Top posts render with details

**Evidence to Capture**:
- [ ] `.sisyphus/evidence/final/n8n-execution.png`
- [ ] `.sisyphus/evidence/final/n8n-database-posts.png`
- [ ] `.sisyphus/evidence/final/n8n-database-aggregates.png`
- [ ] `.sisyphus/evidence/final/api-response.json`
- [ ] `.sisyphus/evidence/final/frontend-daily.png`
- [ ] `.sisyphus/evidence/final/frontend-weekly.png`
- [ ] `.sisyphus/evidence/final/frontend-monthly.png`

---

### Task F4: Scope Fidelity Check
- [ ] **Status**: Pending

**What to do**:
- Verify no scope creep
- Check all requirements met
- Ensure no extra features added
- Validate against original goals

**Scope Boundaries**:

**MUST HAVE**:
- [ ] Reddit scraping only (no other platforms)
- [ ] Daily/weekly/monthly aggregates only
- [ ] Sentiment analysis only (no semantic search)
- [ ] n8n built-in DB only (no Supabase, no Chroma)
- [ ] n8n workflow for data pipeline
- [ ] Bun backend for API
- [ ] Svelte frontend for display

**MUST NOT HAVE**:
- [ ] No other social media sources (Twitter, LinkedIn)
- [ ] No semantic vector search
- [ ] No real-time WebSocket updates
- [ ] No authentication/user accounts
- [ ] No comments section
- [ ] No notifications beyond Discord webhook

**Acceptance Criteria**:
- [ ] Only Reddit scraping (no other platforms)
- [ ] Only daily/weekly/monthly aggregates
- [ ] Only sentiment analysis (no semantic search)
- [ ] No Chroma, no Supabase (n8n built-in DB only)
- [ ] No extra features beyond scope

**Notes**:
- Cross-reference with `docs/decisions.md`
- Check git history for unintended additions

---

## After Wave Completion

### Checklist
- [ ] All tasks marked complete
- [ ] All evidence captured
- [ ] No blocking issues
- [ ] System ready for production

### Sign-off
```markdown
## Verification Complete
- Date: [DATE]
- Verified by: [AGENT_NAME]
- Status: ✅ APPROVED / ❌ NEEDS FIXES
- Notes: [Any final notes]
```

---

## Evidence Files
Save evidence to `.sisyphus/evidence/final/`:
- `n8n-execution.png`
- `n8n-database-posts.png`
- `n8n-database-aggregates.png`
- `api-response.json`
- `frontend-daily.png`
- `frontend-weekly.png`
- `frontend-monthly.png`