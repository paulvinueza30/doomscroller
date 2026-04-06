# Business Impact & Cost Analysis

## Renting vs. Building a Scraper

### Build-it-yourself cost

- Residential proxy service: ~$50–150/month (required to reliably scrape Reddit at scale)
- Developer time to build and maintain: ongoing — Reddit actively changes their anti-bot measures,
  breaking scrapers on a rolling basis
- Debugging proxy rotation, rate limits, and Reddit's evolving HTML is undifferentiated work
  that doesn't ship product

### Apify managed scraper cost

- ~$40/month for a maintained Reddit scraper actor with a high marketplace rating
- Proxies included — no separate proxy account needed
- Runs once per day: ~$1.30/run amortized
- Risk: third-party dependency. Mitigated by Apify's SLA and the actor's track record

### Decision: rent, don't build

$40/month buys reliability, proxy management, and zero maintenance burden.
A custom scraper would cost more in developer hours within the first week alone.

---

## Why n8n for Orchestration?

- **Swappable components**: The workflow is modular. Switching scrapers or AI providers
  means changing one node — not rewriting application code.
- **No AI vendor lock-in**: If a cheaper or better model releases, swap the AI node.
  The rest of the pipeline is untouched.
- **Replaces 3 services in one**: built-in scheduling (cron), database, and HTTP webhook
  endpoint — no separate cron service, no external DB, no custom API server for the pipeline.
- **Self-hostable**: no per-seat or usage-based cloud pricing.

---

## Total Monthly Cost

| Item | Cost |
|------|------|
| Apify Reddit scraper | ~$40/month |
| OpenAI (gpt-4o-mini, ~8 calls/day) | ~$0.50/month |
| n8n (self-hosted) | $0 |
| Bun backend (self-hosted) | $0 |
| Svelte frontend (self-hosted) | $0 |
| VPS (shared with existing services) | ~$0 marginal |
| **Total** | **~$40.50/month** |

**Compare to a managed cloud equivalent:**

| Item | Cloud Cost |
|------|-----------|
| Managed scraping + proxies | $50–150/month |
| Vercel/Render (frontend + backend) | $20–40/month |
| Managed DB (Supabase, PlanetScale) | $25+/month |
| **Equivalent cloud stack** | **~$100–200/month** |

Self-hosting reduces ongoing infrastructure cost by ~60–80%.

---

## Spec-Driven Development

Rather than coding everything manually, this project was built using a spec-driven approach:
detailed wave plans were written upfront, then executed by AI agents working in parallel.

### Time comparison

| Approach | Estimated time |
|----------|----------------|
| Manual implementation | ~8–13 hours (per plan estimates) |
| Writing the spec | ~2–3 hours |
| Agent execution | ~1–2 hours supervised |
| **Total (spec-driven)** | **~3–5 hours** |

### How it works

- Each wave file is a precise, machine-readable spec: exact code snippets, acceptance criteria,
  file paths, and dependency order.
- Agents pick up tasks autonomously — no ambiguity means no back-and-forth.
- Wave 1 and Wave 3 run in parallel, compressing wall-clock time further.
- The spec also doubles as documentation — no separate write-up needed after.

### Why this matters for a business

- **Faster iteration**: a new feature goes from idea → spec → running code in hours.
- **Reproducible**: any agent (or developer) can pick up a wave file and execute it
  without context from the original author.
- **Auditable**: every decision is documented before a line of code is written,
  making reviews and handoffs straightforward.
