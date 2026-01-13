<script lang="ts">
  import * as m from "$lib/paraglide/messages.js";
  import type {BenchmarkResult} from "$lib/algorithms/types";
  import {getAlgorithmInfo} from "$lib/algorithms/registry";
  import {formatTime} from "$lib/utils/format";

  interface Props {
    results: BenchmarkResult[];
    type: "encoding" | "decoding";
  }

  let {results, type}: Props = $props();

  // Calculate quartiles for box plot
  function getQuartiles(times: number[]): {
    q1: number;
    median: number;
    q3: number;
  } {
    const sorted = [...times].sort((a, b) => a - b);
    const n = sorted.length;
    const q1Index = Math.floor(n * 0.25);
    const medianIndex = Math.floor(n * 0.5);
    const q3Index = Math.floor(n * 0.75);
    return {
      q1: sorted[q1Index],
      median: sorted[medianIndex],
      q3: sorted[q3Index],
    };
  }

  const chartData = $derived(
    results.map((r, i) => {
      const stats = r[type];
      const quartiles = getQuartiles(stats.rawTimes);
      return {
        algorithm: getAlgorithmInfo(r.algorithmId)?.name ?? r.algorithmId,
        algorithmId: r.algorithmId,
        min: stats.min,
        q1: quartiles.q1,
        median: quartiles.median,
        q3: quartiles.q3,
        max: stats.max,
        mean: stats.mean,
        colorIndex: (i % 5) + 1,
      };
    })
  );

  const globalMax = $derived(
    chartData.length > 0 ? Math.max(...chartData.map((d) => d.max)) * 1.1 : 1
  );

  // Scale value to percentage
  function scale(value: number): number {
    return (value / globalMax) * 100;
  }
</script>

<div class="space-y-4">
  <h3 class="text-muted-foreground text-sm font-medium">
    {type === "encoding"
      ? m.demo_benchmark_encoding()
      : m.demo_benchmark_decoding()}
  </h3>

  {#if chartData.length > 0}
    <div class="space-y-4">
      {#each chartData as item (item.algorithm)}
        <div class="space-y-1.5">
          <div class="flex items-center justify-between text-sm">
            <span class="font-medium">{item.algorithm}</span>
            <span class="text-muted-foreground">
              {m.demo_benchmark_median()}: {formatTime(item.median)}
            </span>
          </div>

          <!-- Box plot visualization -->
          <div class="relative h-8 w-full">
            <!-- Background track -->
            <div
              class="bg-muted absolute inset-y-2 right-0 left-0 rounded"
            ></div>

            <!-- Whisker line (min to max) -->
            <div
              class="bg-muted-foreground/40 absolute top-1/2 h-0.5 -translate-y-1/2"
              style="left: {scale(item.min)}%; width: {scale(item.max) -
                scale(item.min)}%;"
            ></div>

            <!-- Min whisker cap -->
            <div
              class="bg-muted-foreground/60 absolute top-1/2 h-3 w-0.5 -translate-y-1/2"
              style="left: {scale(item.min)}%;"
            ></div>

            <!-- Max whisker cap -->
            <div
              class="bg-muted-foreground/60 absolute top-1/2 h-3 w-0.5 -translate-y-1/2"
              style="left: {scale(item.max)}%;"
            ></div>

            <!-- Box (Q1 to Q3) -->
            <div
              class="absolute top-1/2 h-5 -translate-y-1/2 rounded border border-current/20"
              style="left: {scale(item.q1)}%; width: {scale(item.q3) -
                scale(
                  item.q1
                )}%; background-color: color-mix(in oklch, var(--chart-{item.colorIndex}) 60%, transparent);"
            ></div>

            <!-- Median line -->
            <div
              class="bg-foreground absolute top-1/2 h-5 w-0.5 -translate-y-1/2"
              style="left: {scale(item.median)}%;"
            ></div>

            <!-- Mean marker (diamond) -->
            <div
              class="bg-foreground absolute top-1/2 h-2 w-2 -translate-x-1/2 -translate-y-1/2 rotate-45"
              style="left: {scale(item.mean)}%;"
              title="Mean: {formatTime(item.mean)}"
            ></div>
          </div>
        </div>
      {/each}

      <!-- Shared time scale -->
      <div class="text-muted-foreground flex justify-between pt-2 text-xs">
        <span>0</span>
        <span>{formatTime(globalMax / 2)}</span>
        <span>{formatTime(globalMax)}</span>
      </div>
    </div>

    <!-- Legend -->
    <div
      class="text-muted-foreground flex flex-wrap items-center gap-4 border-t pt-2 text-xs"
    >
      <div class="flex items-center gap-1.5">
        <div class="bg-primary/60 h-3 w-6 rounded"></div>
        <span>Q1-Q3</span>
      </div>
      <div class="flex items-center gap-1.5">
        <div class="bg-foreground h-3 w-0.5"></div>
        <span>{m.demo_benchmark_median()}</span>
      </div>
      <div class="flex items-center gap-1.5">
        <div class="bg-foreground h-2 w-2 rotate-45"></div>
        <span>{m.demo_benchmark_mean()}</span>
      </div>
      <div class="flex items-center gap-1.5">
        <div class="bg-muted-foreground/40 h-0.5 w-4"></div>
        <span>{m.demo_benchmark_min()}/{m.demo_benchmark_max()}</span>
      </div>
    </div>
  {:else}
    <div
      class="bg-muted/50 flex h-24 items-center justify-center rounded-lg border"
    >
      <p class="text-muted-foreground text-sm">{m.demo_results_empty()}</p>
    </div>
  {/if}
</div>
