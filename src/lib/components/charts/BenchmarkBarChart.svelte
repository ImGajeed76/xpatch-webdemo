<script lang="ts">
  import * as m from "$lib/paraglide/messages.js";
  import type {BenchmarkResult} from "$lib/algorithms/types";
  import {getAlgorithmInfo} from "$lib/algorithms/registry";
  import {formatTime} from "$lib/utils/format";

  interface Props {
    results: BenchmarkResult[];
  }

  let {results}: Props = $props();

  const chartData = $derived(
    results.map((r, i) => ({
      algorithm: getAlgorithmInfo(r.algorithmId)?.name ?? r.algorithmId,
      algorithmId: r.algorithmId,
      encodeMean: r.encoding.mean,
      decodeMean: r.decoding.mean,
      colorIndex: (i % 5) + 1,
    }))
  );

  const maxTime = $derived(
    chartData.length > 0
      ? Math.max(...chartData.flatMap((d) => [d.encodeMean, d.decodeMean])) *
          1.1
      : 1
  );

  function scale(value: number): number {
    return (value / maxTime) * 100;
  }
</script>

<div class="space-y-4">
  <h3 class="text-sm font-medium">{m.demo_chart_speed_title()}</h3>

  {#if chartData.length > 0}
    <div class="space-y-4">
      {#each chartData as item (item.algorithm)}
        <div class="space-y-2">
          <span class="text-sm font-medium">{item.algorithm}</span>

          <!-- Encode bar -->
          <div class="flex items-center gap-2">
            <span class="text-muted-foreground w-16 text-xs"
              >{m.demo_benchmark_encoding()}</span
            >
            <div class="bg-muted relative h-5 flex-1 rounded">
              <div
                class="absolute inset-y-0 left-0 rounded transition-[width] duration-300"
                style="width: {scale(
                  item.encodeMean
                )}%; background-color: var(--chart-{item.colorIndex});"
              ></div>
            </div>
            <span class="text-muted-foreground w-16 text-right text-xs">
              {formatTime(item.encodeMean)}
            </span>
          </div>

          <!-- Decode bar -->
          <div class="flex items-center gap-2">
            <span class="text-muted-foreground w-16 text-xs"
              >{m.demo_benchmark_decoding()}</span
            >
            <div class="bg-muted relative h-5 flex-1 rounded">
              <div
                class="absolute inset-y-0 left-0 rounded transition-[width] duration-300"
                style="width: {scale(
                  item.decodeMean
                )}%; background-color: color-mix(in oklch, var(--chart-{item.colorIndex}) 60%, transparent);"
              ></div>
            </div>
            <span class="text-muted-foreground w-16 text-right text-xs">
              {formatTime(item.decodeMean)}
            </span>
          </div>
        </div>
      {/each}
    </div>
  {:else}
    <div
      class="bg-muted/50 flex h-24 items-center justify-center rounded-lg border"
    >
      <p class="text-muted-foreground text-sm">{m.demo_results_empty()}</p>
    </div>
  {/if}
</div>
