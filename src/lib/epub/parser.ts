import ePub from "epubjs";
import type { NavItem } from "epubjs";
import type { Book, Chapter } from "$lib/types";

interface SectionHandle {
  readonly href: string;
  readonly document: Document | undefined;
  load(_request?: Function): Promise<Element>;
}

function collectNavTitles(
  items: NavItem[],
  out: Map<string, string>,
): void {
  for (const item of items) {
    if (item.href) {
      const key = item.href.split("#")[0];
      if (!out.has(key)) {
        out.set(key, item.label);
      }
    }
    if (item.subitems) {
      collectNavTitles(item.subitems, out);
    }
  }
}

function deriveTitle(href: string): string {
  const parts = href.split("/");
  const file = parts[parts.length - 1] || href;
  return file
    .replace(/\.[^/.]+$/, "")
    .replace(/[-_]/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

async function urlToBase64(url: string): Promise<string> {
  const response = await fetch(url);
  const blob = await response.blob();
  const { promise, resolve, reject } = Promise.withResolvers<string>();
  const reader = new FileReader();
  reader.onloadend = () => resolve(reader.result as string);
  reader.onerror = () => reject(new Error("Failed to read cover blob"));
  reader.readAsDataURL(blob);
  return promise;
}

function extractParagraphs(doc: Document): string[] {
  const body = doc.querySelector("body");
  if (!body) return [];

  const pElements = body.querySelectorAll("p");
  if (pElements.length > 0) {
    return Array.from(pElements)
      .map((p) => (p.textContent ?? "").trim())
      .filter(Boolean);
  }

  return (body.textContent ?? "")
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);
}

export async function parseEpub(
  file: File,
): Promise<{ book: Book; chapters: Chapter[] }> {
  const arrayBuffer = await file.arrayBuffer();
  const epubBook = ePub(arrayBuffer);
  await epubBook.ready;

  const metadata = await epubBook.loaded.metadata;
  const bookId = crypto.randomUUID();

  let coverUrl: string | undefined;
  try {
    const cover = await epubBook.coverUrl();
    if (cover) {
      coverUrl = await urlToBase64(cover);
    }
  } catch {
  }

  const titleByHref = new Map<string, string>();
  try {
    const nav = await epubBook.loaded.navigation;
    if (nav?.toc) {
      collectNavTitles(nav.toc, titleByHref);
    }
  } catch {
  }

  const chapters: Chapter[] = [];
  const metaItems: Book["chapters"] = [];

  for (let i = 0; ; i++) {
    const raw = epubBook.section(i);
    if (!raw) break;
    const section = raw as unknown as SectionHandle;

    try {
      await section.load(epubBook.load.bind(epubBook));
      if (!section.document) continue;

      const paragraphs = extractParagraphs(section.document);
      if (paragraphs.length === 0) continue;

      const href = section.href || "";
      const id = href || crypto.randomUUID();
      const title =
        titleByHref.get(href.split("#")[0]) ?? deriveTitle(href);

      chapters.push({ id, bookId, title, paragraphs });
      metaItems.push({ id, title, paragraphCount: paragraphs.length });
    } catch {
    }
  }

  return {
    book: {
      id: bookId,
      title: metadata.title || "Untitled",
      author: metadata.creator || "Unknown",
      cover: coverUrl,
      chapters: metaItems,
      importedAt: Date.now(),
    },
    chapters,
  };
}
