<script lang="ts">
  import type { Aggregate, HistoryItem } from '../api';
  import { getApiUrl } from '../api';
  import Chart from './Chart.svelte';

  export let weekly: Aggregate;
  export let history: HistoryItem[] = [];

  const API_URL = getApiUrl();

  const STATUS_COLOR: Record<string, string> = {
    bearish: 'text-red-400',
    bullish: 'text-green-400',
    mixed: 'text-yellow-400',
    neutral: 'text-yellow-400',
  };

  const STATUS_BG: Record<string, string> = {
    bearish: 'bg-red-900/20 border-red-800/30',
    bullish: 'bg-green-900/20 border-green-800/30',
    mixed: 'bg-yellow-900/20 border-yellow-800/30',
    neutral: 'bg-yellow-900/20 border-yellow-800/30',
  };

  $: colorClass = STATUS_COLOR[weekly.status] ?? 'text-gray-400';
  $: bgClass = STATUS_BG[weekly.status] ?? 'bg-gray-800/20 border-gray-700/30';
  $: weeklyHistory = history.slice(-7);
</script>

<div class="card border rounded-xl p-5 flex flex-col gap-4 {bgClass}">
  <div class="card-header">
    <span class="label">THIS WEEK</span>
    <span class="sentiment {colorClass}">{weekly.sentiment}</span>
    <span class="status {colorClass}">{weekly.status.toUpperCase()}</span>
  </div>

  {#if weekly.meme}
    <div class="meme-container">
      <img
        src="{API_URL}/memes/{weekly.meme}"
        alt="{weekly.status} meme"
        class="meme-img"
        loading="lazy"
      />
    </div>
  {/if}

  <p class="message">{weekly.message || 'No analysis available yet.'}</p>

  {#if weekly.evidence?.length > 0}
    <div class="section">
      <h3 class="section-title">Evidence</h3>
      <ul class="evidence-list">
        {#each weekly.evidence as phrase}
          <li>• {phrase}</li>
        {/each}
      </ul>
    </div>
  {/if}

  <Chart data={weeklyHistory} title="Last 7 Days" />

  {#if weekly.top_posts?.length > 0}
    <div class="section">
      <h3 class="section-title">Top Posts</h3>
      <div class="posts-list">
        {#each weekly.top_posts as post}
          <div class="post-item">
            <a href={post.url} target="_blank" rel="noopener" class="post-title">{post.title}</a>
            {#if post.evidence}
              <p class="post-evidence">"{post.evidence}"</p>
            {/if}
          </div>
        {/each}
      </div>
    </div>
  {/if}
</div>

<style>
  .card { @apply bg-gray-900/50 backdrop-blur-sm; }
  .card-header { @apply flex items-center gap-3; }
  .label { @apply text-xs font-bold text-gray-500 uppercase tracking-widest; }
  .sentiment { @apply text-3xl font-black; }
  .status { @apply text-sm font-semibold uppercase tracking-wide; }
  .meme-container { @apply rounded-lg overflow-hidden; }
  .meme-img { @apply w-full max-h-48 object-cover rounded-lg; }
  .message { @apply text-sm text-gray-300 leading-relaxed; }
  .section { @apply flex flex-col gap-2; }
  .section-title { @apply text-xs font-semibold text-gray-400 uppercase tracking-wider; }
  .evidence-list { @apply text-sm text-gray-300 space-y-1; }
  .posts-list { @apply space-y-3; }
  .post-item { @apply flex flex-col gap-1; }
  .post-title { @apply text-sm font-medium text-indigo-300 hover:text-indigo-200 line-clamp-2 leading-snug; }
  .post-evidence { @apply text-xs text-gray-400 italic; }
</style>
