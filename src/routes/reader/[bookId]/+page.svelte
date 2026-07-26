<script lang="ts">
  import { goto } from '$app/navigation';
  import { page } from '$app/state';
  import type { Book, Chapter, PredictionLevel } from '$lib/types';
  import { ReadingSession } from '$lib/prediction/reading-session';
  import { getLevelLabel } from '$lib/prediction/levels';
  import Reader from '$lib/components/Reader.svelte';

  let bookId = $derived(page.params.bookId ?? '');

  let loading = $state(true);
  let error = $state<string | null>(null);
  let book = $state<Book | null>(null);
  let chapter = $state<Chapter | null>(null);
  let level = $state<PredictionLevel>(1);
  let bestLevel = $state<PredictionLevel>(1);
  let chapterIdx = $state(0);
  let chapterCount = $state(0);
  let session = $state<ReadingSession | null>(null);

  let chaptersParam = $derived(page.url.searchParams.get('chapters'));

  $effect(() => {
    const ids = chaptersParam;
    if (!ids) {
      goto('/reader/' + bookId + '/select');
      return;
    }

    const selectedIds = ids.split(',');
    const s = new ReadingSession(bookId, selectedIds);
    session = s;
    s.init().then(() => {
      if (s.error) {
        error = s.error;
        loading = false;
        return;
      }
      book = s.book;
      chapter = s.currentChapter;
      level = s.level;
      bestLevel = s.bestLevel;
      chapterIdx = s.chapterIdx;
      chapterCount = s.chapterCount;
      loading = false;
    });
  });

  async function handleScore(score: number, prediction: string, actual: string) {
    if (!session) return;
    await session.recordPrediction(score, prediction, actual);
    level = session.level;
    bestLevel = session.bestLevel;
  }

  function handleChapterComplete() {
    if (!session) return;
    const done = session.advanceChapter();
    if (done) {
      goto('/stats');
    } else {
      chapter = session.currentChapter;
      level = session.level;
      bestLevel = session.bestLevel;
      chapterIdx = session.chapterIdx;
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

    {#key chapter.id}
      <Reader
        session={session!.challengeSession!}
        {chapter}
        {level}
        onScore={handleScore}
        onComplete={handleChapterComplete}
      />
    {/key}
  </div>
{/if}
