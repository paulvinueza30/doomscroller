import type { AggregateData, PostData } from './meme-map';

interface HistoryItem {
  date: string;
  sentiment: number;
}

export interface N8NResponse {
  daily: AggregateData;
  weekly: AggregateData;
  monthly: AggregateData;
  history: HistoryItem[];
  error?: string;
}

// Simple in-memory cache
let cachedData: N8NResponse | null = null;
let cacheTime = 0;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export async function fetchFromN8N(): Promise<N8NResponse> {
  const webhookUrl = process.env.N8N_WEBHOOK_URL;
  const webhookSecret = process.env.WEBHOOK_SECRET;

  if (!webhookUrl) {
    throw new Error('N8N_WEBHOOK_URL is not configured');
  }

  // Return cached data if fresh
  if (cachedData && Date.now() - cacheTime < CACHE_TTL) {
    return cachedData;
  }

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (webhookSecret) {
    headers['Authorization'] = `Bearer ${webhookSecret}`;
  }

  const response = await fetch(webhookUrl, { headers });

  if (response.status === 401) {
    throw new Error('Unauthorized: invalid WEBHOOK_SECRET');
  }

  if (!response.ok) {
    throw new Error(`n8n webhook returned ${response.status}: ${response.statusText}`);
  }

  const data = (await response.json()) as N8NResponse;

  cachedData = data;
  cacheTime = Date.now();

  return data;
}

export function invalidateCache(): void {
  cachedData = null;
  cacheTime = 0;
}
