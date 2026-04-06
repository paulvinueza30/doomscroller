<script lang="ts">
  import { Line } from 'svelte-chartjs';
  import { Chart, registerables } from 'chart.js';
  import type { HistoryItem } from '../api';

  Chart.register(...registerables);

  export let data: HistoryItem[] = [];
  export let title: string = 'Sentiment Trend';

  $: chartData = {
    labels: data.map(d => d.date.slice(5)), // Show MM-DD
    datasets: [
      {
        label: 'Sentiment',
        data: data.map(d => d.sentiment),
        borderColor: 'rgb(99, 102, 241)',
        backgroundColor: 'rgba(99, 102, 241, 0.1)',
        tension: 0.3,
        fill: true,
        pointRadius: 3,
        pointHoverRadius: 5,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      y: {
        min: 0,
        max: 100,
        grid: { color: 'rgba(255,255,255,0.05)' },
        ticks: {
          color: '#9ca3af',
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          callback: (val: any) => `${val}`,
        },
      },
      x: {
        grid: { color: 'rgba(255,255,255,0.05)' },
        ticks: {
          color: '#9ca3af',
          maxTicksLimit: 7,
        },
      },
    },
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          label: (ctx: any) => `Sentiment: ${ctx.parsed.y}`,
        },
      },
    },
  };
</script>

<div class="chart-wrapper">
  <p class="chart-title">{title}</p>
  {#if data.length > 0}
    <div class="chart-container">
      <Line data={chartData} options={chartOptions} />
    </div>
  {:else}
    <p class="no-data">No historical data yet</p>
  {/if}
</div>

<style>
  .chart-wrapper {
    @apply mt-4;
  }
  .chart-title {
    @apply text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2;
  }
  .chart-container {
    height: 140px;
    position: relative;
  }
  .no-data {
    @apply text-sm text-gray-500 italic py-4 text-center;
  }
</style>
