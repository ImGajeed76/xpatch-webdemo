<script lang="ts">
  import * as m from "$lib/paraglide/messages.js";
  import * as Table from "$lib/components/ui/table";
  import {Badge} from "$lib/components/ui/badge";
  import type {BenchmarkResult} from "$lib/algorithms/types";
  import {getAlgorithmInfo} from "$lib/algorithms/registry";
  import {formatTime, formatBytes} from "$lib/utils/format";

  interface Props {
    results: BenchmarkResult[];
  }

  let {results}: Props = $props();
</script>

<div class="space-y-6">
  {#each results as result (result.algorithmId)}
    {@const algorithmInfo = getAlgorithmInfo(result.algorithmId)}
    <div class="space-y-4">
      <div class="flex items-center gap-2">
        <h4 class="text-base font-medium">
          {algorithmInfo?.name ?? result.algorithmId}
        </h4>
        <Badge variant="outline" class="text-xs">
          {formatBytes(result.deltaSize)}
        </Badge>
      </div>

      <div class="grid gap-6 lg:grid-cols-2">
        <div class="space-y-2">
          <h5 class="text-muted-foreground text-sm font-medium">
            {m.demo_benchmark_encoding()}
          </h5>
          <Table.Root>
            <Table.Body>
              <Table.Row>
                <Table.Cell class="font-medium"
                  >{m.demo_benchmark_mean()}</Table.Cell
                >
                <Table.Cell class="text-right"
                  >{formatTime(result.encoding.mean)}</Table.Cell
                >
              </Table.Row>
              <Table.Row>
                <Table.Cell class="font-medium"
                  >{m.demo_benchmark_median()}</Table.Cell
                >
                <Table.Cell class="text-right"
                  >{formatTime(result.encoding.median)}</Table.Cell
                >
              </Table.Row>
              <Table.Row>
                <Table.Cell class="font-medium"
                  >{m.demo_benchmark_stddev()}</Table.Cell
                >
                <Table.Cell class="text-right"
                  >{formatTime(result.encoding.stdDev)}</Table.Cell
                >
              </Table.Row>
              <Table.Row>
                <Table.Cell class="font-medium"
                  >{m.demo_benchmark_min()}</Table.Cell
                >
                <Table.Cell class="text-right"
                  >{formatTime(result.encoding.min)}</Table.Cell
                >
              </Table.Row>
              <Table.Row>
                <Table.Cell class="font-medium"
                  >{m.demo_benchmark_max()}</Table.Cell
                >
                <Table.Cell class="text-right"
                  >{formatTime(result.encoding.max)}</Table.Cell
                >
              </Table.Row>
              <Table.Row>
                <Table.Cell class="font-medium"
                  >{m.demo_benchmark_p95()}</Table.Cell
                >
                <Table.Cell class="text-right"
                  >{formatTime(result.encoding.p95)}</Table.Cell
                >
              </Table.Row>
              <Table.Row>
                <Table.Cell class="font-medium"
                  >{m.demo_benchmark_p99()}</Table.Cell
                >
                <Table.Cell class="text-right"
                  >{formatTime(result.encoding.p99)}</Table.Cell
                >
              </Table.Row>
            </Table.Body>
          </Table.Root>
        </div>

        <div class="space-y-2">
          <h5 class="text-muted-foreground text-sm font-medium">
            {m.demo_benchmark_decoding()}
          </h5>
          <Table.Root>
            <Table.Body>
              <Table.Row>
                <Table.Cell class="font-medium"
                  >{m.demo_benchmark_mean()}</Table.Cell
                >
                <Table.Cell class="text-right"
                  >{formatTime(result.decoding.mean)}</Table.Cell
                >
              </Table.Row>
              <Table.Row>
                <Table.Cell class="font-medium"
                  >{m.demo_benchmark_median()}</Table.Cell
                >
                <Table.Cell class="text-right"
                  >{formatTime(result.decoding.median)}</Table.Cell
                >
              </Table.Row>
              <Table.Row>
                <Table.Cell class="font-medium"
                  >{m.demo_benchmark_stddev()}</Table.Cell
                >
                <Table.Cell class="text-right"
                  >{formatTime(result.decoding.stdDev)}</Table.Cell
                >
              </Table.Row>
              <Table.Row>
                <Table.Cell class="font-medium"
                  >{m.demo_benchmark_min()}</Table.Cell
                >
                <Table.Cell class="text-right"
                  >{formatTime(result.decoding.min)}</Table.Cell
                >
              </Table.Row>
              <Table.Row>
                <Table.Cell class="font-medium"
                  >{m.demo_benchmark_max()}</Table.Cell
                >
                <Table.Cell class="text-right"
                  >{formatTime(result.decoding.max)}</Table.Cell
                >
              </Table.Row>
              <Table.Row>
                <Table.Cell class="font-medium"
                  >{m.demo_benchmark_p95()}</Table.Cell
                >
                <Table.Cell class="text-right"
                  >{formatTime(result.decoding.p95)}</Table.Cell
                >
              </Table.Row>
              <Table.Row>
                <Table.Cell class="font-medium"
                  >{m.demo_benchmark_p99()}</Table.Cell
                >
                <Table.Cell class="text-right"
                  >{formatTime(result.decoding.p99)}</Table.Cell
                >
              </Table.Row>
            </Table.Body>
          </Table.Root>
        </div>
      </div>
    </div>
  {/each}

  {#if results.length === 0}
    <div
      class="bg-muted/50 flex h-32 items-center justify-center rounded-lg border"
    >
      <p class="text-muted-foreground text-sm">{m.demo_results_empty()}</p>
    </div>
  {/if}
</div>
