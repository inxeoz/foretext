import type { Book } from '$lib/types';
import { parseEpub } from '$lib/epub/parser';
import { importBook } from '$lib/db/operations';

export async function importEpub(file: File): Promise<Book> {
  const { book, chapters } = await parseEpub(file);
  const prefixed = chapters.map((ch) => ({ ...ch, id: book.id + '_' + ch.id }));
  await importBook(book, prefixed);
  return book;
}
