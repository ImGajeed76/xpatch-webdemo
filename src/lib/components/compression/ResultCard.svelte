<script lang="ts">
  import * as m from "$lib/paraglide/messages.js";
  import type {CompressionResult} from "$lib/algorithms/types";
  import {getAlgorithmInfo} from "$lib/algorithms/registry";
  import {formatBytes, formatTime} from "$lib/utils/format";
  import {CheckCircle, AlertCircle, Trophy} from "@lucide/svelte";

  interface Props {
    result: CompressionResult;
    isBestSize?: boolean;
  }

  let {result, isBestSize = false}: Props = $props();

  const algorithmInfo = $derived(getAlgorithmInfo(result.algorithmId));
</script>

<div
  class="bg-card rounded-lg border p-4 transition-colors duration-150 {result.error
    ? 'border-destructive'
    : isBestSize
      ? 'border-primary'
      : ''}"
>
  {#if result.error}
    <div class="text-destructive flex items-center gap-2">
      <AlertCircle class="h-4 w-4 shrink-0" />
      <div>
        <p class="text-sm font-medium">
          {algorithmInfo?.name ?? result.algorithmId}
        </p>
        <p class="text-xs">{result.error}</p>
      </div>
    </div>
  {:else}
    <div class="space-y-4">
      <!-- Header -->
      <div class="flex items-center justify-between gap-2">
        <span class="truncate text-sm font-medium"
          >{algorithmInfo?.name ?? result.algorithmId}</span
        >
        {#if isBestSize}
          <Trophy class="text-primary h-4 w-4 shrink-0" />
        {:else if result.verified}
          <CheckCircle class="text-muted-foreground h-3 w-3 shrink-0" />
        {/if}
      </div>

      <!-- Primary metric: Size -->
      <div>
        <p class="text-2xl font-semibold tracking-tight whitespace-nowrap">
          {formatBytes(result.deltaSize)}
        </p>
      </div>

      <!-- Secondary: Time -->
      <div class="text-muted-foreground space-y-1 text-xs">
        <p class="whitespace-nowrap">
          {m.demo_result_encode_abbr()}: {formatTime(result.encodeTimeMs)}
        </p>
        <p class="whitespace-nowrap">
          {m.demo_result_decode_abbr()}: {formatTime(result.decodeTimeMs)}
        </p>
      </div>
    </div>
  {/if}
</div>
