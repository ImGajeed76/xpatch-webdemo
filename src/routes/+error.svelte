<script lang="ts">
  import {Button} from "$lib/components/ui/button";
  import {AlertCircle, Home, RefreshCw} from "@lucide/svelte";
  import {page} from "$app/stores";

  // SvelteKit passes error as a prop but ESLint expects only 'data' - disable the rule
  // eslint-disable-next-line svelte/valid-prop-names-in-kit-pages
  let {error} = $props();
</script>

<div class="bg-background text-foreground">
  <div class="mx-auto max-w-6xl px-4 py-16">
    <div class="flex min-h-[60vh] flex-col items-center justify-center gap-8">
      <div
        class="bg-destructive/10 border-destructive/20 flex h-20 w-20 items-center justify-center rounded-full border-2"
      >
        <AlertCircle class="text-destructive h-10 w-10" />
      </div>

      <div class="flex flex-col items-center gap-3 text-center">
        <h1 class="text-4xl font-bold tracking-tight">
          {#if $page.status === 404}
            Page Not Found
          {:else if $page.status >= 500}
            Server Error
          {:else}
            Something Went Wrong
          {/if}
        </h1>
        <p class="text-muted-foreground max-w-md text-lg">
          {#if $page.status === 404}
            The page you're looking for doesn't exist.
          {:else if $page.status >= 500}
            Something went wrong on our end. Please try again later.
          {:else}
            {error?.message || "An unexpected error occurred."}
          {/if}
        </p>
      </div>

      <div class="flex gap-3">
        <Button href="/" size="lg">
          <Home class="mr-2 h-4 w-4" />
          Go Home
        </Button>
        <Button
          onclick={() => window.location.reload()}
          variant="outline"
          size="lg"
        >
          <RefreshCw class="mr-2 h-4 w-4" />
          Refresh
        </Button>
      </div>

      {#if import.meta.env.DEV}
        <details
          class="text-muted-foreground bg-muted/50 mt-8 w-full max-w-2xl rounded-lg border p-4 text-left text-sm"
        >
          <summary class="cursor-pointer font-semibold"
            >Error Details (Dev Only)</summary
          >
          <pre class="mt-2 overflow-auto text-xs">{JSON.stringify(
              {
                status: $page.status,
                message: error?.message,
                stack: error?.stack,
              },
              null,
              2
            )}</pre>
        </details>
      {/if}
    </div>
  </div>
</div>
