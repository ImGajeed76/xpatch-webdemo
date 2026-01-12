<script lang="ts">
  import * as m from "$lib/paraglide/messages.js";
  import type {CompressionResult} from "$lib/algorithms/types";
  import {getAlgorithmInfo} from "$lib/algorithms/registry";
  import {formatTime} from "$lib/utils/format";

  interface Props {
    results: CompressionResult[];
  }

  let {results}: Props = $props();

  const chartData = $derived(
    results
      .filter((r) => !r.error)
      .map((r, i) => ({
        algorithm: getAlgorithmInfo(r.algorithmId)?.name ?? r.algorithmId,
        encodeTime: r.encodeTimeMs,
        decodeTime: r.decodeTimeMs,
        algorithmId: r.algorithmId,
        colorIndex: (i % 5) + 1,
      }))
  );

  const maxEncodeTime = $derived(
    chartData.length > 0 ? Math.max(...chartData.map((d) => d.encodeTime)) : 0
  );

  const maxDecodeTime = $derived(
    chartData.length > 0 ? Math.max(...chartData.map((d) => d.decodeTime)) : 0
  );
</script>

<div class="grid gap-8 lg:grid-cols-2">
  <div class="space-y-4">
    <h3 class="text-lg font-medium">{m.demo_chart_encode_label()}</h3>

    {#if chartData.length > 0}
      <div class="space-y-3">
        {#each chartData as item (item.algorithm + "-encode")}
          <div class="space-y-1">
            <div class="flex items-center justify-between text-sm">
              <span class="font-medium">{item.algorithm}</span>
              <span class="text-muted-foreground"
                >{formatTime(item.encodeTime)}</span
              >
            </div>
            <div class="bg-muted h-6 w-full overflow-hidden rounded-md">
              <div
                class="h-full rounded-md transition-[width] duration-300"
                style="width: {maxEncodeTime > 0
                  ? (item.encodeTime / maxEncodeTime) * 100
                  : 0}%; background-color: var(--chart-{item.colorIndex});"
              ></div>
            </div>
          </div>
        {/each}
      </div>
    {:else}
      <div
        class="bg-muted/50 flex h-32 items-center justify-center rounded-lg border"
      >
        <p class="text-muted-foreground text-sm">{m.demo_results_empty()}</p>
      </div>
    {/if}
  </div>

  <div class="space-y-4">
    <h3 class="text-lg font-medium">{m.demo_chart_decode_label()}</h3>

    {#if chartData.length > 0}
      <div class="space-y-3">
        {#each chartData as item (item.algorithm + "-decode")}
          <div class="space-y-1">
            <div class="flex items-center justify-between text-sm">
              <span class="font-medium">{item.algorithm}</span>
              <span class="text-muted-foreground"
                >{formatTime(item.decodeTime)}</span
              >
            </div>
            <div class="bg-muted h-6 w-full overflow-hidden rounded-md">
              <div
                class="h-full rounded-md transition-[width] duration-300"
                style="width: {maxDecodeTime > 0
                  ? (item.decodeTime / maxDecodeTime) * 100
                  : 0}%; background-color: var(--chart-{item.colorIndex});"
              ></div>
            </div>
          </div>
        {/each}
      </div>
    {:else}
      <div
        class="bg-muted/50 flex h-32 items-center justify-center rounded-lg border"
      >
        <p class="text-muted-foreground text-sm">{m.demo_results_empty()}</p>
      </div>
    {/if}
  </div>
</div>
