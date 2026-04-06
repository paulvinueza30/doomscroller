export interface Post {
  reddit_id: string;
  title: string;
  sentiment: number;
  status: string;
  upvotes: number;
  evidence: string;
  url: string;
}

export interface Aggregate {
  sentiment: number;
  status: string;
  message: string;
  meme: string;
  evidence: string[];
  top_posts: Post[];
}

export interface HistoryItem {
  date: string;
  sentiment: number;
}

export interface DoomResponse {
  daily: Aggregate;
  weekly: Aggregate;
  monthly: Aggregate;
  history: HistoryItem[];
}

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export async function getDoom(): Promise<DoomResponse> {
  const response = await fetch(`${API_URL}/api/doom`);
  if (!response.ok) {
    throw new Error(`Failed to fetch doom data: ${response.status} ${response.statusText}`);
  }
  return response.json() as Promise<DoomResponse>;
}

export function getApiUrl(): string {
  return API_URL;
}
