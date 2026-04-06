# Agent Instructions for Wave Execution

## Overview

This plan is split into **5 wave files** that MUST be executed in order:
1. `wave-1-n8n-pipeline.md` - Data pipeline setup
2. `wave-2-bun-backend.md` - Backend development
3. `wave-3-svelte-frontend.md` - Frontend development
4. `wave-4-integration-deployment.md` - Integration and deployment
5. `wave-final-verification.md` - Final verification and QA

**IMPORTANT**: Wave 1 and Wave 3 can run in **PARALLEL** (no dependencies).
- Wave 2 depends on Wave 1 Task 6 (Supabase tables must exist)
- Wave 4 depends on Waves 1, 2, and 3 (integration needs all components)
- Wave Final must run after all other waves complete

---

## How to Execute a Wave

### 1. Pick a Wave
Choose a wave file to work on. Read the entire file before starting.

### 2. Mark Task as In Progress
When you start a task, mark it in the wave file:
```markdown
- [x] Task Name (IN PROGRESS)
```

### 3. Execute the Task
Follow the instructions in the task:
- Read the "What to do" section
- Check all acceptance criteria
- Write code / configure systems / test

### 4. Mark Task as Complete
When finished, update the wave file:
```markdown
- [x] Task Name ✓
```

Add any notes:
```markdown
- [x] Task Name ✓ 
  - Completed at 2024-01-17 14:32 UTC
  - Note: Had to fix Apify rate limit issue
```

### 5. Evidence Capture (Optional but Recommended)
Take screenshots / save logs to `.sisyphus/evidence/`:
```bash
.sisyphus/evidence/
├── wave-1-task-2-apify-config.png
├── wave-1-task-6-supabase-tables.png
└── wave-2-task-17-api-response.json
```

---

## Wave Files Structure

Each wave file contains:
```markdown
# Wave N: Title

## Dependencies
- Wave X: [which waves must complete first]

## Tasks
- [ ] Task 1: Title
  - What to do: [description]
  - Files: [list of files]
  - Acceptance Criteria: [checklist]
  - Notes: [optional]

## After Wave Completion
1. Mark all tasks complete
2. Run final checks
3. Update this file with completion notes
4. Move to next wave
```

---

## Task Status Legend

| Status | Markdown | Meaning |
|--------|----------|---------|
| Pending | `- [ ]` | Task not started |
| In Progress | `- [x] Task (IN PROGRESS)` | Agent working on it |
| Complete | `- [x] Task ✓` | Task finished successfully |
| Failed | `- [x] Task ✗` | Task failed, needs fix |
| Blocked | `- [x] Task ⚠️ BLOCKED: reason` | Task blocked by dependency |

---

## Parallel Execution Strategy

### Independent Waves (Can Run in Parallel)
**Wave 1 (n8n Pipeline)** and **Wave 3 (Svelte Frontend)** have no dependencies and can start immediately:```
Agent A: Wave 1 (n8n Pipeline)
Agent B: Wave 3 (Svelte Frontend)
```

### Dependent Waves (Must Wait)
**Wave 2 (Bun Backend)** depends on Wave 1 Task 6:
- Must wait for Supabase tables to be created
- Can start once Task 6 completes

**Wave 4 (Integration)** depends on Waves 1, 2, and 3:```
Agent C: Wave 2 (Bun Backend) - PENDING Wave 1 Task 6
Agent D: Wave 4 (Integration) - PENDING Waves 1, 2, 3 complete
```

### Wave Final: Sequential
Must run **after all other waves complete**:
```bash
# Wait for Waves 1-4 to finish
# Then run Wave Final for verification
```

---

## Communication Between Agents

### Shared Files
Agents can read from each other's completed work:

```bash
# Wave 2 can read Wave 1's schema
.sisyphus/plans/wave-1-n8n-pipeline.md  # Has schema definition
backend/src/lib/supabase.ts              # Uses schema from Wave 1
```

### Cross-Wave Dependencies
Document in the wave file:

```markdown
## Dependencies
- **Wave 1**: Must complete Supabase tables (Task 6)
- **Wave 2**: Needs schema from Wave 1
```

---

## Error Handling

### If Task Fails:
1. Mark as failed in wave file: `- [x] Task ✗`
2. Add error details:
   ```markdown
   - [x] Task 6: Supabase Tables ✗
     - Error: Connection refused
     - Reason: Supabase container not started
     - Next: Start Supabase before retrying
   ```
3. Fix and retry
4. Mark as complete when fixed: `- [x] Task ✓`

### If Wave Blocked:
1. Mark as blocked: `- [x] Task ⚠️ BLOCKED: Wave 1 not complete`
2. Wait for blocking wave to finish
3. Update status when unblocked

---

## Completion Checklist

Before marking a wave complete:

- [ ] All tasks marked complete (or documented why not)
- [ ] All acceptance criteria verified
- [ ] Evidence captured (screenshots, logs, test results)
- [ ] No blocking issues remaining
- [ ] Wave file updated with completion notes

---

## Example: Marking a Wave Complete

```markdown
# Wave 1: n8n Data Pipeline

## Status: ✅ COMPLETE

## Completion Summary
- Completed at: 2024-01-17 15:30 UTC
- Total tasks: 12
- Completed: 12
- Failed: 0
- Notes: All tasks completed successfully. Workflow runs daily at 9 AM.

## Evidence
- `.sisyphus/evidence/wave-1-task-2-apify-config.png`
- `.sisyphus/evidence/wave-1-task-12-workflow-run.png`

## Tasks
- [x] Task 1: n8n Workflow JSON ✓
- [x] Task 2: Apify Reddit Scraper Integration ✓
...
```