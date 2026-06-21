<script lang="ts">
  export type WordData = { score: number; prediction: string };

  let { text, wordData, maxWords }: {
    text: string;
    wordData: Map<number, WordData>;
    maxWords?: number;
  } = $props();

  let words = $derived(text.split(/\s+/));
  let visible = $derived(maxWords !== undefined ? words.slice(0, maxWords) : words);
</script>

{#each visible as w, i}
  {@const data = wordData.get(i)}
  <span
    title={data ? 'Score: ' + Math.round(data.score * 100) + '% | You: ' + data.prediction : ''}
    class={data ? 'text-green-700 underline decoration-yellow-400 decoration-2 underline-offset-2' : ''}
  >
    {w}{' '}
  </span>
{/each}
