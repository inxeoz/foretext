<script lang="ts">
  const URL_KEY = 'embedding-api-url';
  const MODEL_KEY = 'embedding-model';
  const DEFAULT_URL = '';
  const DEFAULT_MODEL = 'embeddinggemma';

  let url = $state(DEFAULT_URL);
  let model = $state(DEFAULT_MODEL);

  $effect(() => {
    const u = localStorage.getItem(URL_KEY);
    if (u) url = u;
    const m = localStorage.getItem(MODEL_KEY);
    if (m) model = m;
  });

  function save() {
    const u = url.trim();
    const m = model.trim();
    if (u) localStorage.setItem(URL_KEY, u);
    else localStorage.removeItem(URL_KEY);
    if (m) localStorage.setItem(MODEL_KEY, m);
    else localStorage.removeItem(MODEL_KEY);
  }

  let isOllama = $derived(url.includes('/api/embeddings'));
</script>

<div data-testid="settings-page" class="max-w-md space-y-6">
  <h1 class="text-2xl font-bold text-zinc-900" data-testid="settings-title">
    Settings
  </h1>

  <div class="rounded-lg border border-zinc-200 bg-blue-50 px-4 py-3 text-xs text-blue-800" data-testid="settings-info">
    <p class="font-medium">How embedding works</p>
    <p class="mt-1">
      By default, the app uses a built-in mock scorer that returns random-ish scores.
      For real semantic scoring, point it at your own Ollama instance.
    </p>
  </div>

  <div>
    <label for="embed-url" class="block text-sm font-medium text-zinc-700" data-testid="settings-url-label">
      Embedding API URL
    </label>
    <input
      id="embed-url"
      type="text"
      value={url === DEFAULT_URL ? '' : url}
      oninput={(e) => (url = (e.target as HTMLInputElement).value || DEFAULT_URL)}
      class="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-zinc-500 focus:outline-none"
      placeholder="http://localhost:11434/api/embeddings"
      data-testid="settings-url-input"
    />
    <p class="mt-1 text-xs text-zinc-400" data-testid="settings-url-hint">
      Leave empty for mock scoring. To use your own Ollama, enter{' '}
      <code class="rounded bg-zinc-100 px-1">http://localhost:11434/api/embeddings</code>
      {' '}and start Ollama with <code class="rounded bg-zinc-100 px-1">OLLAMA_ORIGINS=*</code>.
    </p>
  </div>

  {#if isOllama}
    <div>
      <label for="embed-model" class="block text-sm font-medium text-zinc-700" data-testid="settings-model-label">
        Model
      </label>
      <input
        id="embed-model"
        type="text"
        value={model === DEFAULT_MODEL ? '' : model}
        oninput={(e) => (model = (e.target as HTMLInputElement).value || DEFAULT_MODEL)}
        class="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-zinc-500 focus:outline-none"
        placeholder={DEFAULT_MODEL}
        data-testid="settings-model-input"
      />
    </div>
  {/if}

  <button
    onclick={save}
    class="rounded bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700"
    data-testid="settings-save-btn"
  >
    Save
  </button>
</div>
