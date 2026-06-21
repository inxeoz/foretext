<script lang="ts">
  let { onSubmit }: { onSubmit: (prediction: string) => Promise<void> } = $props();

  const MIN_PREDICTION_LENGTH = 2;

  let value = $state('');
  let submitting = $state(false);
  let error = $state<string | null>(null);

  let trimmed = $derived(value.trim());
  let tooShort = $derived(trimmed.length > 0 && trimmed.length < MIN_PREDICTION_LENGTH);

  async function handleSubmit(e: Event) {
    e.preventDefault();
    if (trimmed.length < MIN_PREDICTION_LENGTH || submitting) return;

    submitting = true;
    error = null;
    try {
      await onSubmit(trimmed);
      value = '';
    } catch (err) {
      error =
        err instanceof Error
          ? err.message
          : 'Prediction failed. Check your embedding API URL.';
    } finally {
      submitting = false;
    }
  }
</script>

<form
  onsubmit={handleSubmit}
  class="space-y-2"
  data-testid="prediction-form"
>
  <label
    for="prediction-input"
    class="text-sm font-medium text-zinc-700"
    data-testid="prediction-label"
  >
    What comes next?
  </label>
  <textarea
    id="prediction-input"
    bind:value
    class="w-full rounded-lg border border-zinc-300 p-3 text-sm focus:border-zinc-500 focus:outline-none"
    rows="3"
    placeholder="Type your prediction..."
    data-testid="prediction-input"
  ></textarea>
  {#if tooShort}
    <p class="text-xs text-amber-600" data-testid="prediction-too-short">
      Prediction must be at least {MIN_PREDICTION_LENGTH} characters.
    </p>
  {/if}
  {#if error}
    <p class="text-xs text-red-600" data-testid="prediction-error">
      {error}
    </p>
  {/if}
  <button
    type="submit"
    disabled={trimmed.length < MIN_PREDICTION_LENGTH || submitting}
    class="rounded bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-50"
    data-testid="prediction-submit-btn"
  >
    {submitting ? 'Scoring...' : 'Submit Prediction'}
  </button>
</form>
