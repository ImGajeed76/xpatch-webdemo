<script lang="ts">
  import * as m from "$lib/paraglide/messages.js";
  import {Button} from "$lib/components/ui/button";
  import {ArrowLeft, Trash2, FileText} from "@lucide/svelte";
  import {historyStore} from "$lib/stores/history.svelte";
  import {formatBytes, formatRelativeTime} from "$lib/utils/format";
  import {getAlgorithmInfo} from "$lib/algorithms/registry";
</script>

<div class="mx-auto max-w-4xl space-y-8 p-6 md:p-8">
  <!-- Header -->
  <header class="flex items-center justify-between">
    <div class="flex items-center gap-4">
      <Button variant="ghost" size="icon" href="/">
        <ArrowLeft class="h-4 w-4" />
      </Button>
      <h1 class="text-3xl leading-tight font-semibold tracking-tight">
        {m.demo_history_title()}
      </h1>
    </div>

    {#if historyStore.hasEntries}
      <Button
        variant="ghost"
        size="sm"
        onclick={() => historyStore.clear()}
        class="text-muted-foreground hover:text-destructive gap-2"
      >
        <Trash2 class="h-4 w-4" />
        <span class="hidden sm:inline">{m.demo_history_clear()}</span>
      </Button>
    {/if}
  </header>

  <!-- History List -->
  {#if historyStore.hasEntries}
    <div class="space-y-6">
      {#each historyStore.entries as entry, index (entry.id)}
        <div class="bg-card space-y-4 rounded-lg border p-6">
          <!-- Entry header -->
          <div class="flex items-start justify-between gap-4">
            <div class="space-y-1">
              <h3 class="text-lg leading-snug font-medium">
                {entry.label ?? m.demo_history_entry_label({index: index + 1})}
              </h3>
              <p class="text-muted-foreground text-sm">
                {formatRelativeTime(entry.timestamp)}
              </p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              class="text-muted-foreground hover:text-destructive shrink-0"
              onclick={() => historyStore.removeEntry(entry.id)}
              aria-label={m.demo_history_delete()}
            >
              <Trash2 class="h-4 w-4" />
            </Button>
          </div>

          <!-- Input sizes -->
          <div class="flex items-center gap-6 text-sm">
            <div>
              <p class="text-muted-foreground text-xs">
                {m.demo_input_base_label()}
              </p>
              <p class="font-medium whitespace-nowrap">
                {formatBytes(entry.baseDataSize)}
              </p>
            </div>
            <div>
              <p class="text-muted-foreground text-xs">
                {m.demo_input_new_label()}
              </p>
              <p class="font-medium whitespace-nowrap">
                {formatBytes(entry.newDataSize)}
              </p>
            </div>
          </div>

          <!-- Results -->
          <div class="flex flex-wrap gap-2">
            {#each entry.results as result (result.algorithmId)}
              {@const info = getAlgorithmInfo(result.algorithmId)}
              <span
                class="inline-flex items-center rounded-full border px-3 py-1 text-sm whitespace-nowrap {result.error
                  ? 'border-destructive/50 text-destructive'
                  : 'border-input text-foreground'}"
              >
                {info?.name ?? result.algorithmId}: {formatBytes(
                  result.deltaSize
                )}
              </span>
            {/each}
          </div>

          <!-- Preview (if text) -->
          {#if entry.baseDataPreview && !entry.baseDataPreview.startsWith("[")}
            <div class="bg-muted/50 rounded-lg p-4">
              <p class="text-muted-foreground line-clamp-2 font-mono text-sm">
                {entry.baseDataPreview}
              </p>
            </div>
          {/if}
        </div>
      {/each}
    </div>
  {:else}
    <!-- Empty state -->
    <div class="flex flex-col items-center justify-center py-12 text-center">
      <FileText class="text-muted-foreground mb-4 h-12 w-12" />
      <h3 class="mb-2 text-lg font-medium">{m.demo_history_empty()}</h3>
      <p class="text-muted-foreground mb-4 text-sm">
        {m.demo_history_empty_description()}
      </p>
      <Button href="/">{m.common_button_back()}</Button>
    </div>
  {/if}
</div>
