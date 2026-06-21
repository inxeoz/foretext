<script lang="ts">
  import { goto } from '$app/navigation';
  import type { Book } from '$lib/types';
  import {
    initDB,
    getAllBooks,
    addBook,
    addChapter,
    deleteBook,
  } from '$lib/db/operations';
  import { parseEpub } from '$lib/epub/parser';
  import BookCard from '$lib/components/BookCard.svelte';
  import UploadForm from '$lib/components/UploadForm.svelte';

  let books = $state<Book[]>([]);
  let loading = $state(true);

  $effect(() => {
    initDB()
      .then(() => getAllBooks())
      .then((b) => (books = b))
      .finally(() => (loading = false));
  });

  async function handleUpload(file: File) {
    const { book, chapters } = await parseEpub(file);
    await addBook(book);
    for (const ch of chapters) {
      await addChapter({ ...ch, id: book.id + '_' + ch.id });
    }
    books = await getAllBooks();
  }

  async function handleDelete(id: string) {
    await deleteBook(id);
    books = await getAllBooks();
  }

  function handleOpen(id: string) {
    goto('/reader/' + id + '/select');
  }
</script>

{#if loading}
  <div class="py-16 text-center text-zinc-500" data-testid="library-loading">
    Loading...
  </div>
{:else}
  <div data-testid="library-page">
    <div class="mb-8">
      <h1 class="text-2xl font-bold text-zinc-900" data-testid="library-title">
        Library
      </h1>
      <div class="mt-4">
        <UploadForm onUpload={handleUpload} />
      </div>
    </div>

    {#if books.length === 0}
      <div
        class="rounded-lg border-2 border-dashed border-zinc-200 py-16 text-center"
        data-testid="library-empty"
      >
        <p class="text-zinc-500" data-testid="library-empty-text">
          No books yet. Upload an EPUB to get started.
        </p>
      </div>
    {:else}
      <div
        class="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5"
        data-testid="library-book-list"
      >
        {#each books as book (book.id)}
          <BookCard {book} onOpen={handleOpen} onDelete={handleDelete} />
        {/each}
      </div>
    {/if}
  </div>
{/if}
