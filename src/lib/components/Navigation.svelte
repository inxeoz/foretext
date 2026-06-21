<script lang="ts">
  import { page } from '$app/state';

  let links = [
    { href: '/', label: 'Library' },
    { href: '/stats', label: 'Statistics' },
    { href: '/settings', label: 'Settings' },
  ];

  let linkClasses = (href: string) =>
    page.url.pathname === href
      ? 'font-medium text-zinc-900'
      : 'text-zinc-500 hover:text-zinc-700';
</script>

<nav class="border-b border-zinc-200 bg-white" data-testid="navigation">
  <div class="mx-auto flex max-w-4xl items-center gap-6 px-4 py-3">
    <a href="/" class="text-lg font-semibold text-zinc-900" data-testid="nav-title">
      Predictive Reader
    </a>
    <div class="flex gap-4">
      {#each links as link}
        <a
          href={link.href}
          class="text-sm {linkClasses(link.href)}"
          data-testid="nav-{link.label.toLowerCase()}"
        >
          {link.label}
        </a>
      {/each}
    </div>
  </div>
</nav>
