<script lang="ts">
  import { goto } from '$app/navigation';
  import { page } from '$app/state';
  import { initDB, getBook } from '$lib/db/operations';
  import type { Book } from '$lib/types';
  import ChapterSelect from '$lib/components/ChapterSelect.svelte';

  let bookId = $derived(page.params.bookId ?? '');

  let book = $state<Book | null>(null);
  let loading = $state(true);
  let error = $state<string | null>(null);

  $effect(() => {
    initDB()
      .then(() => getBook(bookId))
      .then((b) => {
        if (!b) {
          error = 'Book not found';
        } else {
          book = b;
        }
      })
      .catch(() => {
        error = 'Failed to load book';
      })
      .finally(() => {
        loading = false;
      });
  });

  function handleStart(selectedIds: string[]) {
    const qs = selectedIds.join(',');
    goto('/reader/' + bookId + '?chapters=' + encodeURIComponent(qs));
  }
</script>

{#if loading}
  <div class="py-16 text-center text-zinc-500" data-testid="select-loading">
    Loading...
  </div>
{:else if error || !book}
  <div class="py-16 text-center" data-testid="select-error">
    <p class="text-red-600">{error || 'Book not found'}</p>
    <button
      onclick={() => goto('/')}
      class="mt-4 rounded bg-zinc-900 px-4 py-2 text-sm text-white"
      data-testid="select-back-btn"
    >
      Back to Library
    </button>
  </div>
{:else}
  <div data-testid="chapter-select-page">
    <button
      onclick={() => goto('/')}
      class="mb-4 text-sm text-zinc-500 hover:text-zinc-700"
      data-testid="select-back-link"
    >
      &larr; Back to Library
    </button>
    <h1 class="mb-1 text-xl font-bold text-zinc-900" data-testid="select-book-title">
      {book.title}
    </h1>
    <p class="mb-6 text-sm text-zinc-500" data-testid="select-book-author">
      {book.author}
    </p>
    <ChapterSelect
      chapters={book.chapters}
      onStart={handleStart}
      onBack={() => goto('/')}
    />
  </div>
{/if}
