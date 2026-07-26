<script lang="ts">
  import type { Chapter, PredictionLevel } from '$lib/types';
  import type { ChallengeSession } from '$lib/prediction/challenge-session';
  import { getLevelLabel } from '$lib/prediction/levels';
  import PredictionInput from './PredictionInput.svelte';
  import ScoreDisplay from './ScoreDisplay.svelte';
  import PredictedParagraph from './PredictedParagraph.svelte';

  let { session, chapter, level, onScore, onComplete }: {
    session: ChallengeSession;
    chapter: Chapter;
    level: PredictionLevel;
    onScore: (score: number, prediction: string, actual: string) => void;
    onComplete: () => void;
  } = $props();

  let revealed = $state<string | null>(null);
  let lastScore = $state<number | null>(null);
  let renderKey = $state(0);

  async function handlePrediction(text: string) {
    const result = await session.submitPrediction(text);
    revealed = result.actual;
    lastScore = result.score;
    renderKey++;
    onScore(result.score, result.prediction, result.actual);
  }

  function handleNext() {
    session.advance(level);
    revealed = null;
    lastScore = null;
    renderKey++;
    if (session.isComplete) {
      onComplete();
    }
  }
</script>

{#if session.isComplete}
  <div class="py-8 text-center text-zinc-500" data-testid="reader-empty">
    No content available.
  </div>
{:else}
  <div class="space-y-6" data-testid="reader">
    <div class="mb-2 flex items-center justify-between">
      <span class="text-xs font-medium text-zinc-500" data-testid="reader-level">
        Predicting: {getLevelLabel(level)}
      </span>
      <span class="text-xs text-zinc-400" data-testid="reader-progress">
        Paragraph {session.currentParaIdx + 1} of {chapter.paragraphs.length}
      </span>
    </div>

    {#key renderKey}
      <div
        class="rounded-lg border border-zinc-200 bg-white p-6 leading-relaxed text-zinc-800"
        data-testid="reader-text"
      >
        {#each session.completedParagraphs as entry, i (entry.paraIdx)}
          <div>
            {#if i > 0}
              <hr class="my-4 border-zinc-200" data-testid="para-separator-{entry.paraIdx}" />
            {/if}
            <div class="text-zinc-500" data-testid="reader-completed-text">
              <PredictedParagraph
                text={entry.text}
                wordData={session.wordData.get(entry.paraIdx) ?? new Map()}
              />
            </div>
          </div>
        {/each}

        {#if session.completedParagraphs.length > 0}
          <hr class="my-4 border-zinc-200" data-testid="para-separator" />
        {/if}

        <span data-testid="reader-visible-text">
          <PredictedParagraph
            text={chapter.paragraphs[session.currentParaIdx]}
            wordData={session.wordData.get(session.currentParaIdx) ?? new Map()}
            maxWords={session.challenge?.continuationStart}
          />
        </span>

        {#if revealed === null}
          <span
            class="rounded bg-yellow-100 px-1 text-yellow-800"
            data-testid="reader-hidden-marker"
          >
            [...]
          </span>
        {:else}
          <span
            class="text-green-700 underline decoration-yellow-400 decoration-2 underline-offset-2"
            data-testid="reader-revealed-text"
          >
            {revealed}
          </span>
        {/if}
      </div>
    {/key}

    {#if revealed === null}
      <PredictionInput onSubmit={handlePrediction} />
    {/if}

    {#if lastScore !== null}
      <div class="space-y-4">
        <ScoreDisplay score={lastScore} />
        <button
          onclick={handleNext}
          class="rounded bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700"
          data-testid="reader-next-btn"
        >
          Continue
        </button>
      </div>
    {/if}
  </div>
{/if}
