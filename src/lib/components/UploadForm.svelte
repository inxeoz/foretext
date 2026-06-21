<script lang="ts">
  let { onUpload }: { onUpload: (file: File) => Promise<void> } = $props();

  let inputEl = $state<HTMLInputElement>();
  let loading = $state(false);
  let error = $state<string | null>(null);

  async function handleFile(e: Event) {
    const file = (e.target as HTMLInputElement).files?.[0];
    if (!file) return;

    loading = true;
    error = null;
    try {
      await onUpload(file);
    } catch (err) {
      error = err instanceof Error ? err.message : 'Failed to import book';
    } finally {
      loading = false;
      if (inputEl) inputEl.value = '';
    }
  }
</script>

<div data-testid="upload-form">
  <label
    for="epub-upload"
    class="inline-flex cursor-pointer items-center gap-2 rounded-lg border-2 border-dashed border-zinc-300 px-6 py-4 text-sm text-zinc-600 hover:border-zinc-400 hover:text-zinc-700"
    data-testid="upload-label"
  >
    <input
      bind:this={inputEl}
      id="epub-upload"
      type="file"
      accept=".epub"
      onchange={handleFile}
      class="hidden"
      data-testid="upload-input"
    />
    {loading ? 'Importing...' : 'Upload EPUB'}
  </label>
  {#if error}
    <p class="mt-2 text-sm text-red-600" data-testid="upload-error">
      {error}
    </p>
  {/if}
</div>
