import { expect, test, describe, mock, beforeAll, afterAll } from 'bun:test';

// Mock n8n client before importing index
mock.module('../lib/n8n-client', () => ({
  fetchFromN8N: async () => ({
    daily: {
      sentiment: 45,
      status: 'bearish',
      message: 'The market is cooked.',
      evidence: ['layoffs up 300%', '70% mention ghosting'],
      top_posts: [
        {
          reddit_id: 't3_abc123',
          title: 'Laid off today',
          sentiment: 15,
          status: 'bearish',
          upvotes: 342,
          evidence: 'entire team of 50 laid off',
          url: 'https://reddit.com/r/cscareerquestions/test',
        },
      ],
    },
    weekly: {
      sentiment: 47,
      status: 'mixed',
      message: 'Mixed signals this week.',
      evidence: ['40% bullish', '60% bearish'],
      top_posts: [],
    },
    monthly: {
      sentiment: 49,
      status: 'mixed',
      message: 'Overall stable.',
      evidence: ['range 42-55'],
      top_posts: [],
    },
    history: [
      { date: '2026-04-04', sentiment: 47 },
      { date: '2026-04-05', sentiment: 45 },
    ],
  }),
  invalidateCache: () => {},
}));

describe('GET /health', () => {
  test('returns 200 with status ok', async () => {
    const res = await fetch('http://localhost:3000/health');
    expect(res.status).toBe(200);
    const data = (await res.json()) as Record<string, unknown>;
    expect(data.status).toBe('ok');
    expect(data.timestamp).toBeTruthy();
  });
});

describe('GET /api/doom', () => {
  test('returns 200', async () => {
    const res = await fetch('http://localhost:3000/api/doom');
    expect(res.status).toBe(200);
  });

  test('response has daily, weekly, monthly, history', async () => {
    const res = await fetch('http://localhost:3000/api/doom');
    const data = (await res.json()) as Record<string, unknown>;
    expect(data.daily).toBeTruthy();
    expect(data.weekly).toBeTruthy();
    expect(data.monthly).toBeTruthy();
    expect(Array.isArray(data.history)).toBe(true);
  });

  test('each aggregate has a meme field', async () => {
    const res = await fetch('http://localhost:3000/api/doom');
    const data = (await res.json()) as { daily: { meme: string }; weekly: { meme: string }; monthly: { meme: string } };
    expect(data.daily.meme).toBeTruthy();
    expect(data.weekly.meme).toBeTruthy();
    expect(data.monthly.meme).toBeTruthy();
  });

  test('meme is a .jpg filename', async () => {
    const res = await fetch('http://localhost:3000/api/doom');
    const data = (await res.json()) as { daily: { meme: string } };
    expect(data.daily.meme).toMatch(/\.jpg$/);
  });

  test('CORS headers present', async () => {
    const res = await fetch('http://localhost:3000/api/doom');
    expect(res.headers.get('access-control-allow-origin')).toBe('*');
  });
});

describe('GET /api/notfound', () => {
  test('returns 404', async () => {
    const res = await fetch('http://localhost:3000/api/notfound');
    expect(res.status).toBe(404);
  });
});
