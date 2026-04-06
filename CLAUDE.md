# Doomscroller — Agent Instructions

This project uses a **wave-based execution plan** located in `.sisyphus/plans/`.

## Wave Order & Dependencies

| Wave | File | Depends On |
|------|------|------------|
| Wave 1 | `wave-1-n8n-pipeline.md` | — |
| Wave 3 | `wave-3-svelte-frontend.md` | — (parallel with Wave 1) |
| Wave 2 | `wave-2-bun-backend.md` | Wave 1 Task 11 (HTTP webhook live) |
| Wave 4 | `wave-4-integration-deployment.md` | Waves 1, 2, 3 |
| Wave Final | `wave-final-verification.md` | All waves complete |

Wave 1 and Wave 3 can run in **parallel**. Wave 2 and Wave 4 must wait.

## Task Status Convention

| Status | Markdown |
|--------|----------|
| Pending | `- [ ]` |
| In Progress | `- [x] Task (IN PROGRESS)` |
| Complete | `- [x] Task ✓` |
| Failed | `- [x] Task ✗` |
| Blocked | `- [x] Task ⚠️ BLOCKED: reason` |

## How to Execute

1. Read the full wave file before starting
2. Mark task `(IN PROGRESS)` when starting
3. Check acceptance criteria before marking complete
4. Mark `✓` when done, add notes with timestamp
5. Evidence (screenshots, logs) → `.sisyphus/evidence/`

## Full Agent Guide

See `.sisyphus/plans/agents.md` for complete instructions including error handling, parallel execution strategy, and completion checklists.

## Current Plans

- `.sisyphus/plans/wave-1-n8n-pipeline.md`
- `.sisyphus/plans/wave-2-bun-backend.md`
- `.sisyphus/plans/wave-3-svelte-frontend.md`
- `.sisyphus/plans/wave-4-integration-deployment.md`
- `.sisyphus/plans/wave-final-verification.md`
- `.sisyphus/plans/reddit-doomscroll-agent.md`
