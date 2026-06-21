<script lang="ts">
  import type { ChapterMeta } from '$lib/types';

  let { chapters, onStart, onBack }: {
    chapters: ChapterMeta[];
    onStart: (selectedIds: string[]) => void;
    onBack: () => void;
  } = $props();

  let selectedIds = $state<string[]>([]);

  $effect(() => {
    selectedIds = chapters.map((c) => c.id);
  });

  function toggle(id: string) {
    if (selectedIds.includes(id)) {
      selectedIds = selectedIds.filter((i) => i !== id);
    } else {
      selectedIds = [...selectedIds, id];
    }
  }

  function selectAll() {
    selectedIds = chapters.map((c) => c.id);
  }

  function selectNone() {
    selectedIds = [];
  }
</script>

<div data-testid="chapter-select">
  <h2 class="mb-4 text-lg font-semibold text-zinc-900" data-testid="chapter-select-title">
    Select Chapters
  </h2>

  <div class="mb-4 flex gap-3">
    <button
      onclick={selectAll}
      class="text-sm text-zinc-600 hover:text-zinc-900"
      data-testid="chapter-select-all"
    >
      Select All
    </button>
    <button
      onclick={selectNone}
      class="text-sm text-zinc-600 hover:text-zinc-900"
      data-testid="chapter-select-none"
    >
      None
    </button>
    <span class="text-sm text-zinc-400" data-testid="chapter-select-count">
      {selectedIds.length} of {chapters.length} selected
    </span>
  </div>

  <ul class="space-y-1" data-testid="chapter-select-list">
    {#each chapters as ch (ch.id)}
      <li data-testid="chapter-select-item">
        <label
          class="flex cursor-pointer items-center gap-3 rounded px-3 py-2 text-sm hover:bg-zinc-100"
          data-testid="chapter-label-{ch.id}"
        >
          <input
            type="checkbox"
            checked={selectedIds.includes(ch.id)}
            onchange={() => toggle(ch.id)}
            class="h-4 w-4 rounded border-zinc-300 text-zinc-900"
            data-testid="chapter-checkbox-{ch.id}"
          />
          <span data-testid="chapter-name-{ch.id}">{ch.title}</span>
          <span class="ml-auto text-xs text-zinc-400">
            {ch.paragraphCount} paragraphs
          </span>
        </label>
      </li>
    {/each}
  </ul>

  <div class="mt-6 flex gap-3">
    <button
      onclick={onBack}
      class="rounded border border-zinc-300 px-4 py-2 text-sm text-zinc-600 hover:bg-zinc-50"
      data-testid="chapter-select-back"
    >
      Back
    </button>
    <button
      onclick={() => onStart(selectedIds)}
      disabled={selectedIds.length === 0}
      class="rounded bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-50"
      data-testid="chapter-select-start"
    >
      Start Reading ({selectedIds.length} chapter{selectedIds.length !== 1 ? 's' : ''})
    </button>
  </div>
</div>
