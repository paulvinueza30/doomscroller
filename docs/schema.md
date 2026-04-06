# Doomscroller Data Schema

Data is persisted in n8n's workflow static data (`$getWorkflowStaticData('global')`).
This is stored in n8n's internal database — no external database required.

---

## `store.posts` — Object (indexed by `reddit_id`)

```typescript
{
  [reddit_id: string]: {
    reddit_id: string;      // e.g. "t3_abc123"
    title: string;          // Post title
    body: string;           // Post body (truncated to 1000 chars)
    upvotes: number;        // Reddit upvote score
    subreddit: string;      // e.g. "cscareerquestions"
    url: string;            // Full Reddit URL
    date: string;           // ISO date "YYYY-MM-DD"
    sentiment: number;      // 0-100 from AI analysis
    status: string;         // "bullish" | "bearish" | "neutral"
    evidence: string;       // Specific quote from post
    updated_at: string;     // ISO timestamp
  }
}
```

**UPSERT key**: `reddit_id`
**Pruning**: posts older than 60 days are removed

---

## `store.aggregates` — Array (sorted by date desc)

```typescript
Array<{
  date: string;             // ISO date "YYYY-MM-DD"
  daily: AggregateData;
  weekly: AggregateData;
  monthly: AggregateData;
  created_at: string;
  updated_at?: string;
}>
```

**UPSERT key**: `date`
**Pruning**: aggregates older than 90 days are removed

---

## `AggregateData`

```typescript
{
  sentiment: number;         // 0-100, weighted average
  status: string;            // "bullish" | "bearish" | "mixed"
  message: string;           // AI-generated 2-3 sentence summary
  evidence: string[];        // 3-5 specific phrases from posts
  topPosts: Post[];          // Top 5 posts (full objects)
  topPostIds: string[];      // reddit_id references
  postCount: number;         // Number of posts in this aggregate
  avgUpvotes: number;        // Average upvotes
}
```

---

## Sentiment Scale

| Range | Status | Meme |
|-------|--------|------|
| 0-10 | bearish | crying_jordan.jpg |
| 11-20 | bearish | this_is_fine.jpg |
| 21-30 | bearish | crying_jeremy.jpg |
| 31-44 | bearish | i_have_no_idea.jpg |
| 45-55 | mixed | drake_hotline.jpg |
| 56-70 | bullish | stonks.jpg |
| 71-85 | bullish | success_kid.jpg |
| 86-100 | bullish | chad_yes.jpg |

---

## Weighted Average Formula

```
sentiment = Σ(post.sentiment × post.upvotes) / Σ(post.upvotes)
```

Fallback if all upvotes = 0:
```
sentiment = Σ(post.sentiment) / count
```
