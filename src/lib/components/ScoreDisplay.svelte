<script lang="ts">
  let { score }: { score: number } = $props();

  let pct = $derived(Math.round(score * 100));
  let colorClass = $derived(
    score >= 0.8 ? 'text-green-600' : score >= 0.6 ? 'text-yellow-600' : 'text-red-600'
  );
  let barClass = $derived(
    score >= 0.8 ? 'bg-green-500' : score >= 0.6 ? 'bg-yellow-500' : 'bg-red-500'
  );
</script>

<div
  class="rounded-lg border border-zinc-200 bg-white p-4"
  data-testid="score-display"
>
  <p class="text-xs font-medium text-zinc-500" data-testid="score-label">
    Similarity Score
  </p>
  <p class="text-2xl font-bold {colorClass}" data-testid="score-value">
    {pct}%
  </p>
  <div class="mt-2 h-2 overflow-hidden rounded-full bg-zinc-100">
    <div
      class="h-full rounded-full transition-all {barClass}"
      style="width: {pct}%"
      data-testid="score-bar"
    ></div>
  </div>
</div>
