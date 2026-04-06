# Architecture Decisions

## Why n8n Over a Custom Pipeline?

- Visual workflow — no custom scheduler needed
- Built-in static data storage (no external DB required for MVP)
- Native integrations: Apify, HTTP webhooks, OpenAI, Discord
- Scheduling (cron) built-in
- Error handling with Discord notifications out of the box
- Self-hostable — no per-seat or usage-based pricing

## Why n8n Static Data Instead of Supabase?

- Zero external dependencies — n8n stores its own data internally
- `$getWorkflowStaticData('global')` persists JSON between runs
- Simple UPSERT via object key (`reddit_id` for posts, `date` for aggregates)
- Free tier compatible
- Pruning strategy (60d for posts, 90d for aggregates) keeps storage small

**Trade-off**: Static data is not a real DB. No indexing, no complex queries. Acceptable for this scale (100 posts/day, 30-day history).

## Why Svelte Over React?

- Smaller bundle (no virtual DOM)
- Less boilerplate — components are just HTML/JS
- SvelteKit static adapter gives a clean SPA with zero server requirement
- Tailwind + Svelte `<style>` coexist without tooling drama

## Why Bun Over Node?

- Native TypeScript support — no ts-node or build step needed in dev
- `bun test` — testing batteries included, no Jest config
- `Bun.serve` — high-performance HTTP server in one line
- `Bun.file` — clean static file serving for memes

## Why Batch AI Calls (20 posts per batch)?

- 100 posts → 5 calls × 20 posts instead of 100 individual calls
- Token limit safety: 20 posts ≈ ~3,000 tokens, well within gpt-4o-mini limits
- Better accuracy than per-post analysis (model can compare posts in context)
- Cost: ~$0.002/batch × 5 = $0.01/run

## Why Weighted Sentiment Average?

```
sentiment = Σ(post.sentiment × post.upvotes) / Σ(post.upvotes)
```

- Posts with more upvotes represent broader community sentiment
- A post with 1,000 upvotes should weigh more than one with 5
- Division-by-zero fallback: simple average when all upvotes = 0

## Why Memes Mapped Dynamically (Not Stored in DB)?

- Memes are presentation logic, not domain data
- Allows updating the meme mapping without a DB migration
- Backend maps `sentiment → meme filename` at query time
- Historical data remains clean and reusable

## Why Top Posts Stored as Objects (Not Just IDs)?

The top posts are denormalized (full objects) in the aggregate rather than just reddit_ids. This is because:
- The webhook endpoint needs to return full post data in one response
- Avoids a second query to look up posts by ID
- Static data doesn't support efficient ID lookups across keys
- Acceptable because top posts (5 per aggregate) are small

## Why UPSERT on Posts?

- Same post can appear in multiple daily runs (slow deletion from hot listings)
- Idempotent: re-running the pipeline on the same day is safe
- Upvote counts can change — UPSERT reflects the latest value

## Why One Aggregate Row Per Day?

- One UPSERT per day prevents duplicate aggregates
- Weekly and monthly aggregates are computed from post data at runtime (not stored separately)
- `history` array for charts is just the last 30 aggregate rows — no special table needed
