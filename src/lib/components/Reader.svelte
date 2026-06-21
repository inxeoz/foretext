<script lang="ts">
  import type { Chapter, PredictionLevel } from '$lib/types';
  import type { Challenge } from '$lib/prediction/engine';
  import {
    generateChallenge,
    getContinuation,
    scorePrediction,
  } from '$lib/prediction/engine';
  import { getLevelLabel } from '$lib/prediction/levels';
  import PredictionInput from './PredictionInput.svelte';
  import ScoreDisplay from './ScoreDisplay.svelte';
  import PredictedParagraph from './PredictedParagraph.svelte';
  import type { WordData } from './PredictedParagraph.svelte';

  let { chapter, level, onScore, onComplete }: {
    chapter: Chapter;
    level: PredictionLevel;
    onScore: (score: number, prediction: string, actual: string) => void;
    onComplete: () => void;
  } = $props();

  let challenge = $state<Challenge | null>(null);

  $effect(() => {
    challenge = generateChallenge(chapter, 0, 0, level);
  });
  let revealed = $state<string | null>(null);
  let lastScore = $state<number | null>(null);

  let completed = $state<{ text: string; paraIdx: number }[]>([]);

  let wordDataByPara = new Map<number, Map<number, WordData>>();
  let tick = $state(0);

  let currentParaIdx = $derived(challenge?.paragraphIndex ?? 0);

  function storePredictionData(
    paraIdx: number,
    startWord: number,
    text: string,
    score: number,
    prediction: string,
  ) {
    const wordCount = text.split(/\s+/).length;
    if (wordCount === 0) return;
    if (!wordDataByPara.has(paraIdx)) {
      wordDataByPara.set(paraIdx, new Map());
    }
    const map = wordDataByPara.get(paraIdx)!;
    for (let i = 0; i < wordCount; i++) {
      map.set(startWord + i, { score, prediction });
    }
    tick++;
  }

  async function handlePrediction(prediction: string) {
    if (!challenge) return;

    const actual = getContinuation(
      chapter,
      challenge.paragraphIndex,
      challenge.continuationStart,
      level,
    );
    const score = await scorePrediction(prediction, actual);
    storePredictionData(
      challenge.paragraphIndex,
      challenge.continuationStart,
      actual,
      score,
      prediction,
    );
    revealed = actual;
    lastScore = score;
    onScore(score, prediction, actual);
  }

  function handleNext() {
    if (!challenge) return;

    const step = typeof level === 'number' ? level : 15;
    const nextWordOff = challenge.continuationStart + step;
    const next = generateChallenge(
      chapter,
      challenge.paragraphIndex,
      nextWordOff,
      level,
    );

    if (next) {
      if (next.paragraphIndex > challenge.paragraphIndex) {
        completed = [
          ...completed,
          {
            text: chapter.paragraphs[challenge.paragraphIndex],
            paraIdx: challenge.paragraphIndex,
          },
        ];
      }
      challenge = next;
      revealed = null;
      lastScore = null;
    } else if (challenge.paragraphIndex + 1 < chapter.paragraphs.length) {
      completed = [
        ...completed,
        {
          text: chapter.paragraphs[challenge.paragraphIndex],
          paraIdx: challenge.paragraphIndex,
        },
      ];
      const nxt = generateChallenge(
        chapter,
        challenge.paragraphIndex + 1,
        0,
        level,
      );
      if (nxt) {
        challenge = nxt;
        revealed = null;
        lastScore = null;
      }
    } else {
      onComplete();
    }
  }
</script>

{#if !challenge}
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
        Paragraph {currentParaIdx + 1} of {chapter.paragraphs.length}
      </span>
    </div>

    <!-- tick in key forces re-render when prediction data changes -->
    {#key tick}
      <div
        class="rounded-lg border border-zinc-200 bg-white p-6 leading-relaxed text-zinc-800"
        data-testid="reader-text"
      >
        {#each completed as entry, i (entry.paraIdx)}
          <div>
            {#if i > 0}
              <hr class="my-4 border-zinc-200" data-testid="para-separator" />
            {/if}
            <div class="text-zinc-500" data-testid="reader-completed-text">
              <PredictedParagraph
                text={entry.text}
                wordData={wordDataByPara.get(entry.paraIdx) ?? new Map()}
              />
            </div>
          </div>
        {/each}

        {#if completed.length > 0}
          <hr class="my-4 border-zinc-200" data-testid="para-separator" />
        {/if}

        <span data-testid="reader-visible-text">
          <PredictedParagraph
            text={chapter.paragraphs[currentParaIdx]}
            wordData={wordDataByPara.get(currentParaIdx) ?? new Map()}
            maxWords={challenge.continuationStart}
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
