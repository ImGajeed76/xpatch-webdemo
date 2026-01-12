<script lang="ts">
  import * as m from "$lib/paraglide/messages.js";
  import {onMount} from "svelte";
  import {slide} from "svelte/transition";
  import {Button} from "$lib/components/ui/button";
  import {Progress} from "$lib/components/ui/progress";
  import {Switch} from "$lib/components/ui/switch";
  import {Label} from "$lib/components/ui/label";
  import {
    Loader2,
    Play,
    Upload,
    ChevronDown,
    Check,
    X,
    History,
    Settings2,
    BarChart3,
  } from "@lucide/svelte";

  import ResultCard from "$lib/components/compression/ResultCard.svelte";
  import BenchmarkSection from "$lib/components/benchmark/BenchmarkSection.svelte";

  import {algorithmStore} from "$lib/stores/algorithms.svelte";
  import {compressionStore} from "$lib/stores/compression.svelte";
  import {benchmarkStore} from "$lib/stores/benchmark.svelte";
  import {historyStore} from "$lib/stores/history.svelte";
  import {formatBytes} from "$lib/utils/format";

  let baseText = $state("");
  let newText = $state("");
  let baseIsFile = $state(false);
  let newIsFile = $state(false);
  let showOptions = $state(false);
  let showBenchmark = $state(false);
  let baseFileInput: HTMLInputElement | null = $state(null);
  let newFileInput: HTMLInputElement | null = $state(null);

  onMount(async () => {
    await algorithmStore.initializeSelected();
  });

  function handleBaseTextChange(event: Event) {
    const target = event.target as HTMLTextAreaElement;
    baseText = target.value;
    baseIsFile = false; // User is typing, clear file mode
    if (target.value) {
      compressionStore.setBaseData(new TextEncoder().encode(target.value));
    } else {
      compressionStore.setBaseData(null);
    }
  }

  function handleNewTextChange(event: Event) {
    const target = event.target as HTMLTextAreaElement;
    newText = target.value;
    newIsFile = false; // User is typing, clear file mode
    if (target.value) {
      compressionStore.setNewData(new TextEncoder().encode(target.value));
    } else {
      compressionStore.setNewData(null);
    }
  }

  async function handleBaseFile(event: Event) {
    const target = event.target as HTMLInputElement;
    const file = target.files?.[0];
    if (file) {
      const buffer = await file.arrayBuffer();
      compressionStore.setBaseData(new Uint8Array(buffer));
      baseText = file.name;
      baseIsFile = true;
    }
  }

  async function handleNewFile(event: Event) {
    const target = event.target as HTMLInputElement;
    const file = target.files?.[0];
    if (file) {
      const buffer = await file.arrayBuffer();
      compressionStore.setNewData(new Uint8Array(buffer));
      newText = file.name;
      newIsFile = true;
    }
  }

  async function handleRun() {
    await algorithmStore.initializeSelected();
    await compressionStore.runComparison();

    // Auto-save to history
    if (
      compressionStore.baseData &&
      compressionStore.newData &&
      compressionStore.hasResults
    ) {
      historyStore.addEntry(
        compressionStore.baseData,
        compressionStore.newData,
        compressionStore.results,
        undefined
      );
    }
  }

  const isRunning = $derived(
    compressionStore.isRunning || benchmarkStore.isRunning
  );
  const canRun = $derived(compressionStore.hasData && !isRunning);
</script>

<div class="mx-auto max-w-4xl space-y-8 p-6 md:p-8">
  <!-- Header -->
  <header class="flex items-center justify-between">
    <h1 class="text-2xl font-semibold tracking-tight">
      {m.demo_header_title()}
    </h1>
    <Button variant="ghost" href="/history" class="text-muted-foreground gap-2">
      <History class="h-4 w-4" />
      <span class="hidden sm:inline">{m.demo_history_title()}</span>
    </Button>
  </header>

  <!-- Input Section -->
  <div class="grid gap-4 md:grid-cols-2">
    <!-- Base Data -->
    <div class="space-y-2">
      <div class="flex items-center justify-between">
        <Label class="text-sm font-medium">{m.demo_input_base_label()}</Label>
        <div class="flex items-center gap-2">
          {#if compressionStore.baseSize > 0}
            <span class="text-muted-foreground text-xs">
              {formatBytes(compressionStore.baseSize)}
            </span>
          {/if}
          <input
            bind:this={baseFileInput}
            type="file"
            class="hidden"
            onchange={handleBaseFile}
          />
          <button
            type="button"
            class="text-muted-foreground hover:text-foreground focus-visible:ring-ring rounded transition-colors focus-visible:ring-2 focus-visible:outline-none"
            onclick={() => baseFileInput?.click()}
            aria-label={m.common_button_upload_file()}
          >
            <Upload class="h-4 w-4" />
          </button>
        </div>
      </div>
      {#if baseIsFile}
        <div
          class="border-primary bg-primary/5 flex min-h-28 w-full items-center justify-center rounded-lg border px-3 py-2 text-sm"
        >
          <span class="font-medium">{baseText}</span>
          <button
            type="button"
            class="text-muted-foreground hover:text-destructive focus-visible:ring-ring ml-2 rounded transition-colors focus-visible:ring-2 focus-visible:outline-none"
            onclick={() => {
              baseText = "";
              baseIsFile = false;
              compressionStore.setBaseData(null);
              if (baseFileInput) baseFileInput.value = "";
            }}
            aria-label="Clear file"
          >
            <X class="h-4 w-4" />
          </button>
        </div>
      {:else}
        <textarea
          class="border-input ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring flex min-h-28 w-full resize-y rounded-lg border bg-transparent px-3 py-2 font-mono text-sm focus-visible:ring-2 focus-visible:outline-none"
          placeholder={m.demo_input_placeholder()}
          value={baseText}
          oninput={handleBaseTextChange}
        ></textarea>
      {/if}
    </div>

    <!-- New Data -->
    <div class="space-y-2">
      <div class="flex items-center justify-between">
        <Label class="text-sm font-medium">{m.demo_input_new_label()}</Label>
        <div class="flex items-center gap-2">
          {#if compressionStore.newSize > 0}
            <span class="text-muted-foreground text-xs">
              {formatBytes(compressionStore.newSize)}
            </span>
          {/if}
          <input
            bind:this={newFileInput}
            type="file"
            class="hidden"
            onchange={handleNewFile}
          />
          <button
            type="button"
            class="text-muted-foreground hover:text-foreground focus-visible:ring-ring rounded transition-colors focus-visible:ring-2 focus-visible:outline-none"
            onclick={() => newFileInput?.click()}
            aria-label={m.common_button_upload_file()}
          >
            <Upload class="h-4 w-4" />
          </button>
        </div>
      </div>
      {#if newIsFile}
        <div
          class="border-primary bg-primary/5 flex min-h-28 w-full items-center justify-center rounded-lg border px-3 py-2 text-sm"
        >
          <span class="font-medium">{newText}</span>
          <button
            type="button"
            class="text-muted-foreground hover:text-destructive focus-visible:ring-ring ml-2 rounded transition-colors focus-visible:ring-2 focus-visible:outline-none"
            onclick={() => {
              newText = "";
              newIsFile = false;
              compressionStore.setNewData(null);
              if (newFileInput) newFileInput.value = "";
            }}
            aria-label="Clear file"
          >
            <X class="h-4 w-4" />
          </button>
        </div>
      {:else}
        <textarea
          class="border-input ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring flex min-h-28 w-full resize-y rounded-lg border bg-transparent px-3 py-2 font-mono text-sm focus-visible:ring-2 focus-visible:outline-none"
          placeholder={m.demo_input_placeholder()}
          value={newText}
          oninput={handleNewTextChange}
        ></textarea>
      {/if}
    </div>
  </div>

  <!-- Algorithm Selection (inline toggles) -->
  <div class="flex flex-wrap items-center gap-2">
    {#each algorithmStore.available as algorithm (algorithm.id)}
      {@const isSelected = algorithmStore.isSelected(algorithm.id)}
      {@const isLoading = algorithmStore.isAlgorithmLoading(algorithm.id)}
      <button
        type="button"
        class="focus-visible:ring-ring flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm transition-colors duration-150 focus-visible:ring-2 focus-visible:outline-none {isSelected
          ? 'border-primary bg-primary/10 text-foreground'
          : 'border-input text-muted-foreground hover:border-primary hover:text-foreground'}"
        onclick={() => algorithmStore.toggleSelection(algorithm.id)}
        disabled={isLoading}
        title={algorithm.description}
      >
        {#if isLoading}
          <Loader2 class="h-3 w-3 animate-spin" />
        {:else if isSelected}
          <Check class="h-3 w-3" />
        {/if}
        <span>{algorithm.name}</span>
      </button>
    {/each}
  </div>

  <!-- Actions Row -->
  <div class="flex items-center gap-4">
    <Button onclick={handleRun} disabled={!canRun} class="gap-2">
      {#if compressionStore.isRunning}
        <Loader2 class="h-4 w-4 animate-spin" />
        {m.demo_button_running()}
      {:else}
        <Play class="h-4 w-4" />
        {m.demo_button_compare()}
      {/if}
    </Button>

    <button
      type="button"
      class="text-muted-foreground hover:text-foreground focus-visible:ring-ring flex items-center gap-2 rounded text-sm transition-colors focus-visible:ring-2 focus-visible:outline-none"
      onclick={() => (showOptions = !showOptions)}
      aria-label={m.common_button_toggle_options()}
      aria-expanded={showOptions}
    >
      <Settings2 class="h-4 w-4" />
      <span>{m.demo_options_label()}</span>
      <ChevronDown
        class="h-3 w-3 transition-transform duration-200 {showOptions
          ? 'rotate-180'
          : ''}"
      />
    </button>
  </div>

  <!-- Options (collapsible) -->
  {#if showOptions}
    <div
      transition:slide={{duration: 150}}
      class="bg-muted/30 rounded-lg border p-4"
    >
      <div class="flex items-center gap-3">
        <Switch
          id="zstd"
          checked={algorithmStore.enableZstd}
          onCheckedChange={(checked) => {
            algorithmStore.enableZstd = checked;
          }}
        />
        <div>
          <Label for="zstd" class="text-sm font-medium">
            {m.demo_options_zstd()}
          </Label>
          <p class="text-muted-foreground text-xs">
            {m.demo_options_zstd_description()}
          </p>
        </div>
      </div>
    </div>
  {/if}

  <!-- Progress -->
  {#if isRunning}
    <div transition:slide={{duration: 150}} class="space-y-2">
      {#if compressionStore.isRunning}
        <p class="text-muted-foreground text-sm">
          {compressionStore.progress.currentAlgorithm}...
        </p>
        <Progress
          value={(compressionStore.progress.current /
            compressionStore.progress.total) *
            100}
        />
      {:else if benchmarkStore.isRunning}
        <p class="text-muted-foreground text-sm">
          {m.demo_benchmark_progress({
            algorithm: benchmarkStore.progress.algorithm,
            phase: benchmarkStore.progress.phase,
            current: benchmarkStore.progress.iteration,
            total: benchmarkStore.progress.totalIterations,
          })}
        </p>
        <Progress
          value={(benchmarkStore.progress.iteration /
            benchmarkStore.progress.totalIterations) *
            100}
        />
      {/if}
    </div>
  {/if}

  <!-- Error -->
  {#if compressionStore.error || benchmarkStore.error}
    <div
      transition:slide={{duration: 150}}
      class="text-destructive flex items-center gap-2 text-sm"
    >
      <X class="h-4 w-4" />
      <span>{compressionStore.error || benchmarkStore.error}</span>
    </div>
  {/if}

  <!-- Results -->
  {#if compressionStore.hasResults}
    <div transition:slide={{duration: 200}} class="space-y-6">
      <!-- Result Cards -->
      <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {#each compressionStore.results as result (result.algorithmId)}
          <ResultCard
            {result}
            isBestSize={result.deltaSize === compressionStore.bestDeltaSize}
            isBestEncodeTime={result.encodeTimeMs ===
              compressionStore.bestEncodeTime}
            isBestDecodeTime={result.decodeTimeMs ===
              compressionStore.bestDecodeTime}
          />
        {/each}
      </div>

      <!-- Benchmark toggle -->
      <Button
        variant="outline"
        class="gap-2"
        onclick={() => (showBenchmark = !showBenchmark)}
        aria-label={m.common_button_toggle_benchmark()}
        aria-expanded={showBenchmark}
      >
        <BarChart3 class="h-4 w-4" />
        {m.demo_results_tab_benchmark()}
        <ChevronDown
          class="h-3 w-3 transition-transform duration-200 {showBenchmark
            ? 'rotate-180'
            : ''}"
        />
      </Button>

      <!-- Benchmark (expandable) -->
      {#if showBenchmark}
        <div
          transition:slide={{duration: 200}}
          class="bg-card rounded-lg border p-6"
        >
          <BenchmarkSection />
        </div>
      {/if}
    </div>
  {:else if !isRunning}
    <!-- Empty state -->
    <div class="flex flex-col items-center justify-center py-12 text-center">
      <BarChart3 class="text-muted-foreground mb-4 h-12 w-12" />
      <h3 class="mb-2 text-lg font-medium">{m.demo_results_empty()}</h3>
      <p class="text-muted-foreground text-sm">
        {m.demo_results_empty_description()}
      </p>
    </div>
  {/if}
</div>
