<script lang="ts">
  import type { Prediction, PredictionLevel, AppStats } from '$lib/types';
  import { PREDICTION_LEVELS } from '$lib/types';
  import { initDB, getAllPredictions, getAllBooks } from '$lib/db/operations';
  import { calculateNewLevel } from '$lib/prediction/levels';
  import StatsDashboard from '$lib/components/StatsDashboard.svelte';

  let stats = $state<AppStats | null>(null);
  let loading = $state(true);

  $effect(() => {
    initDB()
      .then(async () => {
        const [predictions, books] = await Promise.all([
          getAllPredictions(500),
          getAllBooks(),
        ]);

        const predictionsMade = predictions.length;
        const averageScore =
          predictions.length > 0
            ? predictions.reduce((s: number, p: Prediction) => s + p.similarity, 0) /
              predictions.length
            : 0;

        let currentLevel: PredictionLevel = 1;
        let bestLevel: PredictionLevel = 1;

        if (predictions.length > 0) {
          const scores = predictions.map((p: Prediction) => p.similarity);
          currentLevel = calculateNewLevel(currentLevel, scores.slice(0, 20));

          const maxLevel = predictions.reduce((max: PredictionLevel, p: Prediction) => {
            const pi = PREDICTION_LEVELS.indexOf(p.level);
            const mi = PREDICTION_LEVELS.indexOf(max);
            return pi > mi ? p.level : max;
          }, 1 as PredictionLevel);
          bestLevel = maxLevel;
        }

        stats = {
          predictionsMade,
          averageScore,
          currentLevel,
          bestLevel,
          booksCompleted: books.length,
        };
      })
      .finally(() => {
        loading = false;
      });
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
