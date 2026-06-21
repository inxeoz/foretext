<script lang="ts">
  import type { AppStats } from '$lib/types';
  import { getLevelLabel } from '$lib/prediction/levels';

  let { stats }: { stats: AppStats } = $props();

  let items = $derived([
    { label: 'Predictions Made', value: stats.predictionsMade, testid: 'stat-predictions' },
    { label: 'Average Score', value: Math.round(stats.averageScore * 100) + '%', testid: 'stat-avg-score' },
    { label: 'Current Level', value: getLevelLabel(stats.currentLevel), testid: 'stat-current-level' },
    { label: 'Best Level', value: getLevelLabel(stats.bestLevel), testid: 'stat-best-level' },
    { label: 'Books Completed', value: stats.booksCompleted, testid: 'stat-books' },
  ]);
</script>

<div
  class="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-5"
  data-testid="stats-dashboard"
>
  {#each items as item (item.testid)}
    <div
      class="rounded-lg border border-zinc-200 bg-white p-4 text-center"
      data-testid={item.testid}
    >
      <p
        class="text-xs font-medium text-zinc-500"
        data-testid="{item.testid}-label"
      >
        {item.label}
      </p>
      <p
        class="mt-1 text-xl font-bold text-zinc-900"
        data-testid="{item.testid}-value"
      >
        {item.value}
      </p>
    </div>
  {/each}
</div>
