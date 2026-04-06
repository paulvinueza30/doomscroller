<script lang="ts">
  import { onMount } from 'svelte';
  import { getDoom } from '$lib/api';
  import type { DoomResponse } from '$lib/api';
  import DailyCard from '$lib/components/DailyCard.svelte';
  import WeeklyCard from '$lib/components/WeeklyCard.svelte';
  import MonthlyCard from '$lib/components/MonthlyCard.svelte';
  import '../app.css';

  let data: DoomResponse | null = null;
  let error: string | null = null;
  let loading = true;

  onMount(async () => {
    try {
      data = await getDoom();
    } catch (e) {
      error = e instanceof Error ? e.message : 'Failed to load data';
    } finally {
      loading = false;
    }
  });
</script>

<svelte:head>
  <title>Doomscroller — CS Job Market Sentiment</title>
</svelte:head>

<div class="min-h-screen bg-gray-950 text-gray-100">
  <!-- Header -->
  <header class="border-b border-gray-800 py-8 px-6">
    <div class="max-w-6xl mx-auto text-center">
      <h1 class="text-4xl font-black tracking-tight text-white">
        ☠️ DOOMSCROLLER
      </h1>
      <p class="mt-2 text-gray-400 text-sm tracking-widest uppercase">
        CS Job Market Sentiment Tracker
      </p>
    </div>
  </header>

  <main class="max-w-6xl mx-auto px-4 py-8">
    {#if loading}
      <div class="flex items-center justify-center min-h-64">
        <div class="text-center">
          <div class="animate-spin text-4xl mb-4">⌛</div>
          <p class="text-gray-400">Scanning the job market wasteland...</p>
        </div>
      </div>

    {:else if error}
      <div class="rounded-xl bg-red-900/20 border border-red-800/30 p-8 text-center max-w-lg mx-auto">
        <p class="text-red-400 font-semibold text-lg">Pipeline offline</p>
        <p class="text-gray-400 text-sm mt-2">{error}</p>
        <p class="text-gray-500 text-xs mt-4">
          Ensure n8n pipeline has run at least once and the backend is configured.
        </p>
      </div>

    {:else if data}
      <!-- Cards grid -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
        <DailyCard daily={data.daily} />
        <WeeklyCard weekly={data.weekly} history={data.history} />
        <MonthlyCard monthly={data.monthly} history={data.history} />
      </div>

      <!-- Footer note -->
      <p class="text-center text-gray-600 text-xs mt-8">
        Data from r/cscareerquestions, r/jobs, r/layoffs · Updated daily at 9 AM
      </p>
    {/if}
  </main>
</div>
