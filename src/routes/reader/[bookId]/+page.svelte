<script lang="ts">
  import { goto } from '$app/navigation';
  import { page } from '$app/state';
  import type { Book, Chapter, Prediction, PredictionLevel, ChapterMeta } from '$lib/types';
  import { LEVEL_WINDOW, PREDICTION_LEVELS } from '$lib/types';
  import { initDB, getBook, getChapter, addPrediction, getPredictions } from '$lib/db/operations';
  import { calculateNewLevel, getLevelLabel } from '$lib/prediction/levels';
  import Reader from '$lib/components/Reader.svelte';

  let bookId = $derived(page.params.bookId ?? '');

  let book = $state<Book | null>(null);
  let filteredChapters = $state<ChapterMeta[]>([]);
  let chapterIdx = $state(0);
  let level = $state<PredictionLevel>(1);
  let bestLevel = $state<PredictionLevel>(1);
  let loading = $state(true);
  let chapter = $state<Chapter | null>(null);
  let error = $state<string | null>(null);

  let chaptersParam = $derived(page.url.searchParams.get('chapters'));

  $effect(() => {
    const currentChapters = chaptersParam;
    if (!currentChapters) {
      goto('/reader/' + bookId + '/select');
      return;
    }

    const selectedIds = currentChapters.split(',');

    initDB()
      .then(() => getBook(bookId))
      .then(async (b) => {
        if (!b) {
          error = 'Book not found';
          return;
        }
        book = b;

        const filtered = b.chapters.filter((ch: ChapterMeta) =>
          selectedIds.includes(ch.id),
        );
        if (filtered.length === 0) {
          error = 'No chapters selected';
          return;
        }
        filteredChapters = filtered;

        const ch = await getChapter(b.id, filtered[0].id);
        if (ch) chapter = ch;
      })
      .catch(() => {
        error = 'Failed to load book';
      })
      .finally(() => {
        loading = false;
      });
  });

  async function handleScore(score: number, prediction: string, actual: string) {
    if (!book || !chapter) return;

    await addPrediction({
      bookId: book.id,
      chapterId: chapter.id,
      level,
      prediction,
      actual,
      similarity: score,
      timestamp: Date.now(),
    });

    const recent = await getPredictions(book.id, LEVEL_WINDOW);
    const scores = recent.map((p: Prediction) => p.similarity);
    const newLevel = calculateNewLevel(level, scores);
    level = newLevel;
    if (PREDICTION_LEVELS.indexOf(newLevel) > PREDICTION_LEVELS.indexOf(bestLevel)) {
      bestLevel = newLevel;
    }
  }

  function handleChapterComplete() {
    const next = chapterIdx + 1;
    if (next < filteredChapters.length) {
      chapterIdx = next;
      getChapter(bookId, filteredChapters[next].id).then((ch) => {
        if (ch) chapter = ch;
      });
    } else {
      goto('/stats');
    }
  }
</script>

{#if loading}
  <div class="py-16 text-center text-zinc-500" data-testid="reader-loading">
    Loading selected chapters...
  </div>
{:else if error || !book || !chapter}
  <div class="py-16 text-center" data-testid="reader-error">
    <p class="text-red-600">{error || 'Chapter not found'}</p>
    <button
      onclick={() => goto('/')}
      class="mt-4 rounded bg-zinc-900 px-4 py-2 text-sm text-white"
      data-testid="reader-back-btn"
    >
      Back to Library
    </button>
  </div>
{:else}
  <div data-testid="reader-page">
    <div class="mb-6">
      <button
        onclick={() => goto('/reader/' + bookId + '/select')}
        class="text-sm text-zinc-500 hover:text-zinc-700"
        data-testid="reader-back-link"
      >
        &larr; Change chapters
      </button>
      <h1 class="mt-1 text-xl font-bold text-zinc-900" data-testid="reader-book-title">
        {book.title}
      </h1>
      <p class="text-sm text-zinc-500" data-testid="reader-chapter-title">
        {chapter.title} &middot; Level {getLevelLabel(level)}
      </p>
    </div>

    {#key chapter.id + '-' + chapterIdx}
      <Reader
        chapter={chapter}
        {level}
        onScore={handleScore}
        onComplete={handleChapterComplete}
      />
    {/key}
  </div>
{/if}
