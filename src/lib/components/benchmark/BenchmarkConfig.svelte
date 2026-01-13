<script lang="ts">
  import * as m from "$lib/paraglide/messages.js";
  import {Label} from "$lib/components/ui/label";
  import {Input} from "$lib/components/ui/input";
  import {benchmarkStore} from "$lib/stores/benchmark.svelte";
</script>

<div class="space-y-4">
  <h3 class="text-lg font-medium">{m.demo_benchmark_config()}</h3>

  <div class="grid grid-cols-2 gap-4 sm:grid-cols-4">
    <div class="space-y-2">
      <Label for="iterations" class="text-sm font-medium">
        {m.demo_benchmark_iterations()}
      </Label>
      <Input
        id="iterations"
        type="number"
        min={1}
        max={100}
        value={benchmarkStore.config.iterations}
        oninput={(e) => {
          const target = e.target as HTMLInputElement;
          benchmarkStore.setIterations(parseInt(target.value) || 10);
        }}
      />
    </div>

    <div class="space-y-2">
      <Label for="batchSize" class="text-sm font-medium">
        {m.demo_benchmark_batch_size()}
      </Label>
      <Input
        id="batchSize"
        type="number"
        min={1}
        max={100}
        value={benchmarkStore.config.batchSize}
        oninput={(e) => {
          const target = e.target as HTMLInputElement;
          benchmarkStore.setBatchSize(parseInt(target.value) || 20);
        }}
      />
    </div>

    <div class="space-y-2">
      <Label for="warmup" class="text-sm font-medium">
        {m.demo_benchmark_warmup()}
      </Label>
      <Input
        id="warmup"
        type="number"
        min={0}
        max={10}
        value={benchmarkStore.config.warmupRuns}
        oninput={(e) => {
          const target = e.target as HTMLInputElement;
          benchmarkStore.setWarmupRuns(parseInt(target.value) || 3);
        }}
      />
    </div>

    <div class="space-y-2">
      <Label for="cooldown" class="text-sm font-medium">
        {m.demo_benchmark_cooldown()}
      </Label>
      <Input
        id="cooldown"
        type="number"
        min={0}
        max={100}
        value={benchmarkStore.config.cooldownMs}
        oninput={(e) => {
          const target = e.target as HTMLInputElement;
          benchmarkStore.setCooldownMs(parseInt(target.value) || 10);
        }}
      />
    </div>
  </div>
</div>
