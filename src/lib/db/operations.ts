import type { Book, Chapter, Prediction, AppStats, PredictionLevel } from '$lib/types';
import { PREDICTION_LEVELS, LEVEL_WINDOW } from '$lib/types';
import { calculateNewLevel } from '$lib/prediction/levels';

let dbPromise: Promise<IDBDatabase> | null = null;

async function getDB(): Promise<IDBDatabase> {
  if (!dbPromise) {
    const { promise, resolve, reject } = Promise.withResolvers<IDBDatabase>();
    const request = indexedDB.open('PredictiveReader', 1);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains('books')) {
        db.createObjectStore('books', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('chapters')) {
        const store = db.createObjectStore('chapters', { keyPath: 'id' });
        store.createIndex('bookId', 'bookId', { unique: false });
      }
      if (!db.objectStoreNames.contains('predictions')) {
        const store = db.createObjectStore('predictions', {
          keyPath: 'id',
          autoIncrement: true,
        });
        store.createIndex('bookId', 'bookId', { unique: false });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
    request.onblocked = () => reject(new Error('Database open blocked'));
    dbPromise = promise;
  }
  return dbPromise;
}

function req<T>(r: IDBRequest<T>): Promise<T> {
  const { promise, resolve, reject } = Promise.withResolvers<T>();
  r.onsuccess = () => resolve(r.result);
  r.onerror = () => reject(r.error);
  return promise;
}

export async function initDB(): Promise<IDBDatabase> {
  return getDB();
}

export async function addBook(book: Book): Promise<void> {
  const db = await getDB();
  const tx = db.transaction('books', 'readwrite');
  await req(tx.objectStore('books').put(book));
}

export async function getAllBooks(): Promise<Book[]> {
  const db = await getDB();
  const tx = db.transaction('books', 'readonly');
  return req(tx.objectStore('books').getAll());
}

export async function getBook(id: string): Promise<Book | undefined> {
  const db = await getDB();
  const tx = db.transaction('books', 'readonly');
  return req(tx.objectStore('books').get(id)) as Promise<Book | undefined>;
}

export async function deleteBook(id: string): Promise<void> {
  const db = await getDB();
  const tx = db.transaction(['books', 'chapters', 'predictions'], 'readwrite');
  const books = tx.objectStore('books');
  const chaptersIdx = tx.objectStore('chapters').index('bookId');
  const predictionsIdx = tx.objectStore('predictions').index('bookId');

  await req(books.delete(id));

  const chDone = cursorDeleteAll(chaptersIdx, IDBKeyRange.only(id));
  const prDone = cursorDeleteAll(predictionsIdx, IDBKeyRange.only(id));

  await Promise.all([chDone, prDone]);
}

async function cursorDeleteAll(index: IDBIndex, range: IDBKeyRange): Promise<void> {
  const { promise, resolve, reject } = Promise.withResolvers<void>();
  const cursor = index.openCursor(range);
  cursor.onsuccess = () => {
    const c = cursor.result;
    if (c) {
      c.delete();
      c.continue();
    } else {
      resolve();
    }
  };
  cursor.onerror = () => reject(cursor.error);
  return promise;
}

export async function addChapter(chapter: Chapter): Promise<void> {
  const db = await getDB();
  const tx = db.transaction('chapters', 'readwrite');
  await req(tx.objectStore('chapters').put(chapter));
}

export async function getChapter(
  bookId: string,
  chapterId: string,
): Promise<Chapter | undefined> {
  const db = await getDB();
  const tx = db.transaction('chapters', 'readonly');
  return req(tx.objectStore('chapters').get(`${bookId}_${chapterId}`)) as Promise<
    Chapter | undefined
  >;
}

export async function addPrediction(pred: Omit<Prediction, 'id'>): Promise<number> {
  const db = await getDB();
  const tx = db.transaction('predictions', 'readwrite');
  const id = await req(tx.objectStore('predictions').add(pred));
  return id as number;
}

export async function getPredictions(
  bookId: string,
  limit?: number,
): Promise<Prediction[]> {
  const db = await getDB();
  const tx = db.transaction('predictions', 'readonly');
  const index = tx.objectStore('predictions').index('bookId');

  const { promise, resolve, reject } = Promise.withResolvers<Prediction[]>();
  const results: Prediction[] = [];
  const cursor = index.openCursor(IDBKeyRange.only(bookId), 'prev');
  cursor.onsuccess = () => {
    const c = cursor.result;
    if (c && (limit === undefined || results.length < limit)) {
      results.push(c.value as Prediction);
      c.continue();
    } else {
      resolve(results);
    }
  };
  cursor.onerror = () => reject(cursor.error);
  return promise;
}

export async function importBook(book: Book, chapters: Chapter[]): Promise<void> {
  const db = await getDB();
  const tx = db.transaction(['books', 'chapters'], 'readwrite');
  await req(tx.objectStore('books').put(book));
  const chapterStore = tx.objectStore('chapters');
  for (const ch of chapters) {
    await req(chapterStore.put(ch));
  }
}

export async function loadChapters(
  bookId: string,
  chapterIds: string[],
): Promise<Chapter[]> {
  const db = await getDB();
  const tx = db.transaction('chapters', 'readonly');
  const store = tx.objectStore('chapters');
  const results: Chapter[] = [];
  for (const id of chapterIds) {
    const ch = await req(store.get(`${bookId}_${id}`)) as Chapter | undefined;
    if (ch) results.push(ch);
  }
  return results;
}

export async function computeOverallStats(): Promise<AppStats> {
  const db = await getDB();
  const tx = db.transaction(['predictions', 'books'], 'readonly');
  const [predictions, books] = await Promise.all([
    req(tx.objectStore('predictions').getAll()) as Promise<Prediction[]>,
    req(tx.objectStore('books').getAll()) as Promise<Book[]>,
  ]);

  const predictionsMade = predictions.length;
  const averageScore =
    predictions.length > 0
      ? predictions.reduce((s, p) => s + p.similarity, 0) / predictions.length
      : 0;

  let currentLevel: PredictionLevel = 1;
  let bestLevel: PredictionLevel = 1;

  if (predictions.length > 0) {
    predictions.sort((a, b) => a.timestamp - b.timestamp);
    const scores = predictions.map((p) => p.similarity);
    currentLevel = calculateNewLevel(currentLevel, scores.slice(0, LEVEL_WINDOW));

    const maxLevel = predictions.reduce((max, p) => {
      const pi = PREDICTION_LEVELS.indexOf(p.level);
      const mi = PREDICTION_LEVELS.indexOf(max);
      return pi > mi ? p.level : max;
    }, 1 as PredictionLevel);
    bestLevel = maxLevel;
  }

  return {
    predictionsMade,
    averageScore,
    currentLevel,
    bestLevel,
    booksCompleted: books.length,
  };
}

export async function getAllPredictions(limit?: number): Promise<Prediction[]> {
  const db = await getDB();
  const tx = db.transaction('predictions', 'readonly');
  const store = tx.objectStore('predictions');

  const { promise, resolve, reject } = Promise.withResolvers<Prediction[]>();
  const results: Prediction[] = [];
  const cursor = store.openCursor(null, 'prev');
  cursor.onsuccess = () => {
    const c = cursor.result;
    if (c && (limit === undefined || results.length < limit)) {
      results.push(c.value as Prediction);
      c.continue();
    } else {
      resolve(results);
    }
  };
  cursor.onerror = () => reject(cursor.error);
  return promise;
}
