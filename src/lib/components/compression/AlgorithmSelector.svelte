<script lang="ts">
  import * as m from "$lib/paraglide/messages.js";
  import {Checkbox} from "$lib/components/ui/checkbox";
  import {Label} from "$lib/components/ui/label";
  import {Badge} from "$lib/components/ui/badge";
  import {Switch} from "$lib/components/ui/switch";
  import {algorithmStore} from "$lib/stores/algorithms.svelte";
  import {Loader2} from "@lucide/svelte";
</script>

<div class="space-y-6">
  <div class="space-y-4">
    <Label class="text-sm font-medium">{m.demo_algorithm_label()}</Label>

    <div class="grid grid-cols-2 gap-4 md:grid-cols-4">
      {#each algorithmStore.available as algorithm (algorithm.id)}
        {@const isSelected = algorithmStore.isSelected(algorithm.id)}
        {@const isLoading = algorithmStore.isAlgorithmLoading(algorithm.id)}

        <button
          type="button"
          class="flex items-start gap-3 rounded-lg border p-4 text-left transition-colors duration-150 {isSelected
            ? 'border-primary bg-accent/50'
            : 'border-input hover:border-primary hover:bg-accent/30'}"
          onclick={() => algorithmStore.toggleSelection(algorithm.id)}
          disabled={isLoading}
          title={algorithm.description}
        >
          <Checkbox
            checked={isSelected}
            class="mt-0.5"
            aria-label={m.demo_algorithm_select({name: algorithm.name})}
          />
          <div class="min-w-0 flex-1 space-y-1">
            <div class="flex items-center gap-2">
              <span class="text-sm font-medium">{algorithm.name}</span>
              {#if isLoading}
                <Loader2 class="h-3 w-3 animate-spin" />
              {:else}
                <Badge variant="outline" class="text-xs">
                  {algorithm.isWasm ? m.demo_result_wasm() : m.demo_result_js()}
                </Badge>
              {/if}
            </div>
          </div>
        </button>
      {/each}
    </div>
  </div>

  <div class="flex flex-wrap items-center gap-6">
    <div class="flex items-center gap-3">
      <Switch
        id="zstd"
        checked={algorithmStore.enableZstd}
        onCheckedChange={(checked) => {
          algorithmStore.enableZstd = checked;
        }}
      />
      <div class="space-y-0.5">
        <Label for="zstd" class="text-sm font-medium">
          {m.demo_options_zstd()}
        </Label>
        <p class="text-muted-foreground text-xs">
          {m.demo_options_zstd_description()}
        </p>
      </div>
    </div>
  </div>
</div>
