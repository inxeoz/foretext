const URL_STORAGE_KEY = "embedding-api-url";
const MODEL_STORAGE_KEY = "embedding-model";
const DEFAULT_MODEL = "embeddinggemma";

function mockEmbedding(text: string): number[] {
  const vec: number[] = [];
  let state = text.length;
  for (let i = 0; i < 256; i++) {
    state = (state * 1103515245 + 12345) & 0x7fffffff;
    vec.push((state / 0x7fffffff) * 2 - 1);
  }
  return vec;
}

export function getApiUrl(): string {
  if (typeof window === "undefined") return "";
  return localStorage.getItem(URL_STORAGE_KEY) || "";
}

function getModel(): string {
  if (typeof window === "undefined") return DEFAULT_MODEL;
  return localStorage.getItem(MODEL_STORAGE_KEY) || DEFAULT_MODEL;
}

export async function getEmbedding(text: string): Promise<number[]> {
  const url = getApiUrl();
  const safeText = text || " ";

  if (!url) {
    return mockEmbedding(safeText);
  }

  const body = url.includes("/api/embeddings")
    ? { model: getModel(), prompt: safeText }
    : { text: safeText };

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errBody = await res.json().catch(() => ({}));
    throw new Error(
      errBody.error ?? `Embedding request failed with status ${res.status}`,
    );
  }

  const { embedding } = (await res.json()) as { embedding: number[] };
  return embedding;
}
