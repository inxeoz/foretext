<script lang="ts">
  import type { AppStats } from '$lib/types';
  import { computeOverallStats } from '$lib/db/operations';
  import StatsDashboard from '$lib/components/StatsDashboard.svelte';

  let stats = $state<AppStats | null>(null);
  let loading = $state(true);

  $effect(() => {
    computeOverallStats()
      .then((s) => { stats = s; })
      .finally(() => { loading = false; });
  });
</script>

{#if loading}
  <div class="py-16 text-center text-zinc-500" data-testid="stats-loading">
    Loading...
  </div>
{:else if !stats}
  <div class="py-16 text-center text-zinc-500" data-testid="stats-empty">
    No statistics available yet.
  </div>
{:else}
  <div data-testid="stats-page">
    <h1 class="mb-8 text-2xl font-bold text-zinc-900" data-testid="stats-title">
      Statistics
    </h1>
    <StatsDashboard {stats} />
  </div>
{/if}
