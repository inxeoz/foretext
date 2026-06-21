<script lang="ts">
  import type { Book } from '$lib/types';

  let { book, onOpen, onDelete }: {
    book: Book;
    onOpen: (id: string) => void;
    onDelete: (id: string) => void;
  } = $props();
</script>

<div
  class="rounded-lg border border-zinc-200 bg-white p-4 shadow-sm"
  data-testid="book-card"
  data-book-id={book.id}
>
  <div class="mb-3 flex aspect-[3/4] items-center justify-center overflow-hidden rounded bg-zinc-100">
    {#if book.cover}
      <img
        src={book.cover}
        alt="Cover of {book.title}"
        class="h-full w-full object-cover"
        data-testid="book-cover"
      />
    {:else}
      <div class="text-4xl text-zinc-300" data-testid="book-cover-placeholder">
        []
      </div>
    {/if}
  </div>
  <h3 class="truncate text-sm font-medium text-zinc-900" data-testid="book-title">
    {book.title}
  </h3>
  <p class="truncate text-xs text-zinc-500" data-testid="book-author">
    {book.author}
  </p>
  <p class="mt-1 text-xs text-zinc-400" data-testid="book-chapters">
    {book.chapters.length} chapter{book.chapters.length !== 1 ? "s" : ""}
  </p>
  <div class="mt-3 flex gap-2">
    <button
      onclick={() => onOpen(book.id)}
      class="flex-1 rounded bg-zinc-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-zinc-700"
      data-testid="book-open-btn"
    >
      Open
    </button>
    <button
      onclick={() => onDelete(book.id)}
      class="rounded border border-zinc-300 px-3 py-1.5 text-xs font-medium text-zinc-600 hover:bg-zinc-50"
      data-testid="book-delete-btn"
    >
      Delete
    </button>
  </div>
</div>
