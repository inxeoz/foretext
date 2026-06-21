import { env } from '$env/dynamic/private';

function mockEmbedding(text: string): number[] {
  const vec: number[] = [];
  let state = text.length;
  for (let i = 0; i < 256; i++) {
    state = (state * 1103515245 + 12345) & 0x7fffffff;
    vec.push((state / 0x7fffffff) * 2 - 1);
  }
  return vec;
}

export async function POST({ request }: { request: Request }) {
  let text: string;
  try {
    const body = await request.json() as { text?: string };
    if (!body.text || typeof body.text !== 'string') {
      return Response.json({ error: "Missing or invalid 'text' field" }, { status: 400 });
    }
    text = body.text;
  } catch {
    return Response.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const ollamaUrl =
    (env.OLLAMA_URL ?? 'http://localhost:11434') + '/api/embeddings';
  const model = env.OLLAMA_EMBEDDING_MODEL ?? 'embeddinggemma';

  const { promise, resolve, reject } = Promise.withResolvers<Response>();
  const controller = new AbortController();
  const timeout = setTimeout(() => {
    controller.abort();
    reject(new Error('Ollama request timed out after 15s'));
  }, 15000);

  fetch(ollamaUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ model, prompt: text }),
    signal: controller.signal,
  }).then(resolve, reject).finally(() => clearTimeout(timeout));

  let ollamaRes: Response;
  try {
    ollamaRes = await promise;
  } catch {
    return Response.json({ embedding: mockEmbedding(text) });
  }

  if (!ollamaRes.ok) {
    return Response.json({ embedding: mockEmbedding(text) });
  }

  const data = await ollamaRes.json() as { embedding?: number[] };
  if (!data.embedding) {
    return Response.json({ embedding: mockEmbedding(text) });
  }

  return Response.json({ embedding: data.embedding });
}
