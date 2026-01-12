<script lang="ts">
  import * as m from "$lib/paraglide/messages.js";
  import {slide} from "svelte/transition";
  import {Button} from "$lib/components/ui/button";
  import {
    Play,
    Loader2,
    Trash2,
    ChevronDown,
    Table,
    FileJson,
    FileSpreadsheet,
    BarChart3,
  } from "@lucide/svelte";

  import BenchmarkConfig from "./BenchmarkConfig.svelte";
  import BenchmarkBoxPlot from "$lib/components/charts/BenchmarkBoxPlot.svelte";
  import BenchmarkBarChart from "$lib/components/charts/BenchmarkBarChart.svelte";
  import BenchmarkHistoryChart from "$lib/components/charts/BenchmarkHistoryChart.svelte";
  import StatisticsTable from "./StatisticsTable.svelte";

  import {benchmarkStore} from "$lib/stores/benchmark.svelte";
  import {compressionStore} from "$lib/stores/compression.svelte";
  import {algorithmStore} from "$lib/stores/algorithms.svelte";

  let showRawData = $state(false);

  const canRun = $derived(
    compressionStore.hasData && !benchmarkStore.isRunning
  );

  async function handleRunBenchmark() {
    await algorithmStore.initializeSelected();
    await benchmarkStore.runBenchmark();
  }

  function handleDownloadJSON() {
    benchmarkStore.downloadJSON();
  }

  function handleDownloadCSV() {
    benchmarkStore.downloadCSV();
  }

  function handleClearHistory() {
    benchmarkStore.clearHistory();
  }
</script>

<div class="space-y-6">
  <!-- Configuration -->
  <BenchmarkConfig />

  <!-- Run button -->
  <div class="flex items-center gap-4">
    <Button
      variant="secondary"
      onclick={handleRunBenchmark}
      disabled={!canRun}
      class="gap-2"
    >
      {#if benchmarkStore.isRunning}
        <Loader2 class="h-4 w-4 animate-spin" />
        {m.demo_button_running()}
      {:else}
        <Play class="h-4 w-4" />
        {m.demo_button_benchmark()}
      {/if}
    </Button>
  </div>

  <!-- Results visualization -->
  {#if benchmarkStore.hasResults}
    <div transition:slide={{duration: 200}} class="space-y-6">
      <!-- Current run visualizations -->
      <div class="grid gap-6 lg:grid-cols-2">
        <div class="bg-card/50 rounded-lg border p-6">
          <BenchmarkBoxPlot results={benchmarkStore.results} type="encoding" />
        </div>
        <div class="bg-card/50 rounded-lg border p-6">
          <BenchmarkBoxPlot results={benchmarkStore.results} type="decoding" />
        </div>
      </div>

      <!-- Mean comparison bar chart -->
      <div class="bg-card/50 rounded-lg border p-6">
        <BenchmarkBarChart results={benchmarkStore.results} />
      </div>
    </div>
  {/if}

  <!-- History visualization -->
  {#if benchmarkStore.hasHistory}
    <div transition:slide={{duration: 200}} class="space-y-4">
      <div class="bg-card/50 rounded-lg border p-6">
        <BenchmarkHistoryChart history={benchmarkStore.history} maxRuns={5} />
      </div>

      <!-- Actions row -->
      <div class="flex flex-wrap items-center gap-2">
        <!-- Export buttons -->
        <Button
          variant="outline"
          size="sm"
          onclick={handleDownloadJSON}
          class="gap-2"
        >
          <FileJson class="h-4 w-4" />
          <span class="hidden sm:inline">JSON</span>
        </Button>
        <Button
          variant="outline"
          size="sm"
          onclick={handleDownloadCSV}
          class="gap-2"
        >
          <FileSpreadsheet class="h-4 w-4" />
          <span class="hidden sm:inline">CSV</span>
        </Button>

        <!-- Raw data toggle -->
        <button
          type="button"
          class="text-muted-foreground hover:text-foreground focus-visible:ring-ring flex items-center gap-2 rounded-md border px-3 py-1.5 text-sm transition-colors focus-visible:ring-2 focus-visible:outline-none"
          onclick={() => (showRawData = !showRawData)}
          aria-label={m.common_button_toggle_raw_data()}
          aria-expanded={showRawData}
        >
          <Table class="h-4 w-4" />
          <span class="hidden sm:inline">{m.demo_results_tab_raw()}</span>
          <ChevronDown
            class="h-3 w-3 transition-transform duration-200 {showRawData
              ? 'rotate-180'
              : ''}"
          />
        </button>

        <!-- Spacer -->
        <div class="flex-1"></div>

        <!-- Clear history -->
        <Button
          variant="ghost"
          size="sm"
          onclick={handleClearHistory}
          class="text-muted-foreground hover:text-destructive gap-2"
        >
          <Trash2 class="h-4 w-4" />
          <span class="hidden sm:inline">{m.demo_history_clear()}</span>
        </Button>
      </div>

      <!-- Raw data table (expandable) -->
      {#if showRawData}
        <div transition:slide={{duration: 150}}>
          <StatisticsTable results={benchmarkStore.results} />
        </div>
      {/if}
    </div>
  {/if}

  <!-- Empty state -->
  {#if !benchmarkStore.hasResults && !benchmarkStore.hasHistory}
    <div class="flex flex-col items-center justify-center py-12 text-center">
      <BarChart3 class="text-muted-foreground mb-4 h-12 w-12" />
      <h3 class="mb-2 text-lg font-medium">{m.demo_results_empty()}</h3>
      <p class="text-muted-foreground text-sm">
        {m.demo_results_empty_description()}
      </p>
    </div>
  {/if}
</div>
