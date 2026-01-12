<script lang="ts">
  import * as m from "$lib/paraglide/messages.js";
  import type {BenchmarkRun} from "$lib/stores/benchmark.svelte";
  import {getAlgorithmInfo} from "$lib/algorithms/registry";
  import {formatTime, formatBytes} from "$lib/utils/format";
  import {BarChart3} from "@lucide/svelte";

  interface Props {
    history: BenchmarkRun[];
    maxRuns?: number;
  }

  let {history, maxRuns = 5}: Props = $props();

  // Prepare data for visualization - most recent runs first, limited
  const recentRuns = $derived(history.slice(0, maxRuns));

  // Get max values across all results for scaling
  const maxEncodeTime = $derived(() => {
    let max = 0;
    recentRuns.forEach((run) => {
      run.results.forEach((r) => {
        if (r.encoding.mean > max) max = r.encoding.mean;
      });
    });
    return max * 1.1 || 1;
  });

  const maxDeltaSize = $derived(() => {
    let max = 0;
    recentRuns.forEach((run) => {
      run.results.forEach((r) => {
        if (r.deltaSize > max) max = r.deltaSize;
      });
    });
    return max * 1.1 || 1;
  });

  function scaleTime(value: number): number {
    return (value / maxEncodeTime()) * 100;
  }

  function scaleSize(value: number): number {
    return (value / maxDeltaSize()) * 100;
  }

  function formatRunLabel(run: BenchmarkRun): string {
    const date = new Date(run.timestamp);
    return date.toLocaleTimeString([], {hour: "2-digit", minute: "2-digit"});
  }

  // Color map for algorithms
  const algorithmColors: Record<string, number> = {};
</script>

<div class="space-y-4">
  <div class="flex items-center justify-between">
    <h3 class="text-sm font-medium">{m.demo_benchmark_title()}</h3>
    <span class="text-muted-foreground text-xs">
      {m.demo_benchmark_runs_count({count: history.length})}
    </span>
  </div>

  {#if recentRuns.length > 0}
    <div class="space-y-6">
      {#each recentRuns as run, runIndex (run.timestamp + "-" + runIndex)}
        <div class="space-y-4">
          <!-- Run header -->
          <div class="flex items-center justify-between text-xs">
            <div class="flex items-center gap-2">
              <span class="text-muted-foreground font-medium">
                {formatRunLabel(run)}
              </span>
              <span class="text-muted-foreground/60">
                {formatBytes(run.inputInfo.baseSize)} → {formatBytes(
                  run.inputInfo.newSize
                )}
              </span>
            </div>
            <span class="text-muted-foreground/60">
              {run.config.iterations}
              {m.demo_benchmark_iterations_abbr()}
            </span>
          </div>

          <!-- Results for this run -->
          <div class="flex gap-2">
            <!-- Algorithm names column -->
            <div class="w-16 shrink-0 space-y-2">
              {#each run.results as result (result.algorithmId + "-name-" + runIndex)}
                {@const algInfo = getAlgorithmInfo(result.algorithmId)}
                <div class="flex h-3 items-center">
                  <span class="truncate text-xs font-medium whitespace-nowrap">
                    {algInfo?.name ?? result.algorithmId}
                  </span>
                </div>
              {/each}
            </div>

            <!-- Delta size column -->
            <div class="min-w-0 flex-1 space-y-2">
              {#each run.results as result (result.algorithmId + "-size-" + runIndex)}
                {@const colorIdx =
                  algorithmColors[result.algorithmId] ||
                  (algorithmColors[result.algorithmId] =
                    (Object.keys(algorithmColors).length % 5) + 1)}
                <div class="flex h-3 items-center gap-2">
                  <div class="bg-muted relative h-3 min-w-0 flex-1 rounded">
                    <div
                      class="absolute inset-y-0 left-0 rounded transition-[width] duration-300"
                      style="width: {scaleSize(
                        result.deltaSize
                      )}%; background-color: var(--chart-{colorIdx});"
                    ></div>
                  </div>
                  <span
                    class="text-muted-foreground w-14 shrink-0 text-right text-xs whitespace-nowrap tabular-nums"
                  >
                    {formatBytes(result.deltaSize)}
                  </span>
                </div>
              {/each}
            </div>

            <!-- Vertical separator -->
            <div class="bg-border w-px shrink-0"></div>

            <!-- Encode time column -->
            <div class="min-w-0 flex-1 space-y-2">
              {#each run.results as result (result.algorithmId + "-encode-" + runIndex)}
                {@const colorIdx =
                  algorithmColors[result.algorithmId] ||
                  (algorithmColors[result.algorithmId] =
                    (Object.keys(algorithmColors).length % 5) + 1)}
                <div class="flex h-3 items-center gap-2">
                  <div class="bg-muted relative h-3 min-w-0 flex-1 rounded">
                    <div
                      class="absolute inset-y-0 left-0 rounded transition-[width] duration-300"
                      style="width: {scaleTime(
                        result.encoding.mean
                      )}%; background-color: color-mix(in oklch, var(--chart-{colorIdx}) 60%, transparent);"
                    ></div>
                  </div>
                  <span
                    class="text-muted-foreground w-14 shrink-0 text-right text-xs whitespace-nowrap tabular-nums"
                  >
                    {formatTime(result.encoding.mean)}
                  </span>
                </div>
              {/each}
            </div>
          </div>
        </div>
      {/each}
    </div>

    <!-- Legend -->
    <div
      class="text-muted-foreground flex items-center justify-center gap-6 border-t pt-2 text-xs"
    >
      <div class="flex items-center gap-2">
        <div class="bg-primary h-2.5 w-5 rounded"></div>
        <span>{m.demo_result_delta_size()}</span>
      </div>
      <div class="flex items-center gap-2">
        <div class="bg-primary/60 h-2.5 w-5 rounded"></div>
        <span>{m.demo_result_encode_time()}</span>
      </div>
    </div>

    {#if history.length > maxRuns}
      <p class="text-muted-foreground text-center text-xs">
        {m.demo_benchmark_showing({shown: maxRuns, total: history.length})}
      </p>
    {/if}
  {:else}
    <div class="flex flex-col items-center justify-center py-8 text-center">
      <BarChart3 class="text-muted-foreground mb-4 h-8 w-8" />
      <p class="text-muted-foreground text-sm">
        {m.demo_results_empty_description()}
      </p>
    </div>
  {/if}
</div>
