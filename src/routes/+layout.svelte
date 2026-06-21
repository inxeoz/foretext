<script>
  import '../app.css';
  import Navigation from '$lib/components/Navigation.svelte';

  let { children } = $props();
</script>

<svelte:head>
  <title>Predictive Reader</title>
  <meta name="description" content="Active reading through prediction." />
</svelte:head>

<div class="min-h-full bg-zinc-50 text-zinc-900 antialiased" style="font-family: var(--font-sans, sans-serif)">
  <Navigation />
  <main class="mx-auto max-w-4xl px-4 py-8">
    {@render children()}
  </main>
</div>
