import type {
  BenchmarkConfig,
  BenchmarkResult,
  BenchmarkStats,
  DeltaAlgorithm,
} from "$lib/algorithms/types";
import {algorithmStore} from "./algorithms.svelte";
import {compressionStore} from "./compression.svelte";
import {browser} from "$app/environment";

export interface BenchmarkProgress {
  algorithm: string;
  iteration: number;
  totalIterations: number;
  phase: "warmup" | "encoding" | "decoding" | "complete";
}

export interface BenchmarkRun {
  id: string;
  timestamp: number;
  label?: string;
  config: BenchmarkConfig;
  results: BenchmarkResult[];
  inputInfo: {
    baseSize: number;
    newSize: number;
  };
}

const STORAGE_KEY = "xpatch-benchmark-history";

const DEFAULT_CONFIG: BenchmarkConfig = {
  iterations: 10,
  warmupRuns: 3,
  cooldownMs: 10,
};

function loadHistory(): BenchmarkRun[] {
  if (!browser) return [];
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function saveHistory(history: BenchmarkRun[]): void {
  if (!browser) return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
  } catch (e) {
    console.error("Failed to save benchmark history:", e);
  }
}

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function createBenchmarkStore() {
  let config = $state<BenchmarkConfig>({...DEFAULT_CONFIG});
  let history = $state<BenchmarkRun[]>(loadHistory());
  let currentResults = $state<BenchmarkResult[]>([]);
  let isRunning = $state(false);
  let progress = $state<BenchmarkProgress>({
    algorithm: "",
    iteration: 0,
    totalIterations: 0,
    phase: "complete",
  });
  let error = $state<string | null>(null);

  const hasResults = $derived(currentResults.length > 0);
  const hasHistory = $derived(history.length > 0);

  // Aggregate all results from history for chart visualization
  const allResults = $derived(() => {
    const results: Array<
      BenchmarkResult & {runId: string; runTimestamp: number}
    > = [];
    for (const run of history) {
      for (const result of run.results) {
        results.push({
          ...result,
          runId: run.id,
          runTimestamp: run.timestamp,
        });
      }
    }
    return results;
  });

  return {
    // Getters
    get config(): BenchmarkConfig {
      return config;
    },
    get history(): BenchmarkRun[] {
      return history;
    },
    get currentResults(): BenchmarkResult[] {
      return currentResults;
    },
    get results(): BenchmarkResult[] {
      return currentResults;
    },
    get isRunning(): boolean {
      return isRunning;
    },
    get progress(): BenchmarkProgress {
      return progress;
    },
    get error(): string | null {
      return error;
    },
    get hasResults(): boolean {
      return hasResults;
    },
    get hasHistory(): boolean {
      return hasHistory;
    },
    getAllResults() {
      return allResults();
    },

    // Setters
    setIterations(value: number): void {
      config = {...config, iterations: Math.max(1, Math.min(100, value))};
    },

    setWarmupRuns(value: number): void {
      config = {...config, warmupRuns: Math.max(0, Math.min(10, value))};
    },

    setCooldownMs(value: number): void {
      config = {...config, cooldownMs: Math.max(0, Math.min(100, value))};
    },

    // Actions
    async runBenchmark(): Promise<void> {
      // Use empty arrays if data is null
      const baseData = compressionStore.baseData ?? new Uint8Array(0);
      const newData = compressionStore.newData ?? new Uint8Array(0);

      const selectedAlgorithms = algorithmStore.getSelectedAlgorithms();
      if (selectedAlgorithms.length === 0) {
        error = "Please select at least one algorithm";
        return;
      }

      isRunning = true;
      error = null;
      currentResults = [];

      const newResults: BenchmarkResult[] = [];

      for (const algorithm of selectedAlgorithms) {
        try {
          const result = await runAlgorithmBenchmark(
            algorithm,
            baseData,
            newData,
            config,
            (p) => {
              progress = p;
            }
          );
          newResults.push(result);
        } catch (err) {
          error = `${algorithm.name}: ${err instanceof Error ? err.message : String(err)}`;
        }
      }

      currentResults = newResults;

      // Save to history
      if (newResults.length > 0) {
        const run: BenchmarkRun = {
          id: generateId(),
          timestamp: Date.now(),
          config: {...config},
          results: newResults,
          inputInfo: {
            baseSize: baseData.length,
            newSize: newData.length,
          },
        };
        history = [run, ...history];
        saveHistory(history);
      }

      isRunning = false;
      progress = {
        algorithm: "",
        iteration: 0,
        totalIterations: 0,
        phase: "complete",
      };
    },

    deleteRun(runId: string): void {
      history = history.filter((run) => run.id !== runId);
      saveHistory(history);
    },

    clearHistory(): void {
      history = [];
      currentResults = [];
      saveHistory(history);
    },

    clear(): void {
      currentResults = [];
      error = null;
    },

    reset(): void {
      config = {...DEFAULT_CONFIG};
      currentResults = [];
      error = null;
    },

    // Export functions
    exportAsJSON(): string {
      return JSON.stringify(
        {
          exportedAt: new Date().toISOString(),
          runs: history,
        },
        null,
        2
      );
    },

    exportAsCSV(): string {
      const rows: string[] = [];

      // Header
      rows.push(
        [
          "Run ID",
          "Timestamp",
          "Algorithm",
          "Iterations",
          "Base Size",
          "New Size",
          "Delta Size",
          "Compression Ratio",
          "Encode Mean (ms)",
          "Encode Median (ms)",
          "Encode Min (ms)",
          "Encode Max (ms)",
          "Encode StdDev",
          "Encode P95",
          "Encode P99",
          "Decode Mean (ms)",
          "Decode Median (ms)",
          "Decode Min (ms)",
          "Decode Max (ms)",
          "Decode StdDev",
          "Decode P95",
          "Decode P99",
        ].join(",")
      );

      // Data rows
      for (const run of history) {
        for (const result of run.results) {
          rows.push(
            [
              run.id,
              new Date(run.timestamp).toISOString(),
              result.algorithmId,
              run.config.iterations,
              result.baseSize,
              result.newSize,
              result.deltaSize,
              result.compressionRatio.toFixed(4),
              result.encoding.mean.toFixed(3),
              result.encoding.median.toFixed(3),
              result.encoding.min.toFixed(3),
              result.encoding.max.toFixed(3),
              result.encoding.stdDev.toFixed(3),
              result.encoding.p95.toFixed(3),
              result.encoding.p99.toFixed(3),
              result.decoding.mean.toFixed(3),
              result.decoding.median.toFixed(3),
              result.decoding.min.toFixed(3),
              result.decoding.max.toFixed(3),
              result.decoding.stdDev.toFixed(3),
              result.decoding.p95.toFixed(3),
              result.decoding.p99.toFixed(3),
            ].join(",")
          );
        }
      }

      return rows.join("\n");
    },

    downloadJSON(): void {
      if (!browser) return;
      const data = this.exportAsJSON();
      downloadFile(data, "benchmark-results.json", "application/json");
    },

    downloadCSV(): void {
      if (!browser) return;
      const data = this.exportAsCSV();
      downloadFile(data, "benchmark-results.csv", "text/csv");
    },
  };
}

function downloadFile(
  content: string,
  filename: string,
  mimeType: string
): void {
  const blob = new Blob([content], {type: mimeType});
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

async function runAlgorithmBenchmark(
  algorithm: DeltaAlgorithm,
  baseData: Uint8Array,
  newData: Uint8Array,
  config: BenchmarkConfig,
  onProgress: (progress: BenchmarkProgress) => void
): Promise<BenchmarkResult> {
  const {iterations, warmupRuns, cooldownMs} = config;

  // Ensure algorithm is initialized
  if (!algorithm.isInitialized()) {
    await algorithm.init();
  }

  // Warmup phase
  for (let i = 0; i < warmupRuns; i++) {
    onProgress({
      algorithm: algorithm.name,
      iteration: i + 1,
      totalIterations: warmupRuns,
      phase: "warmup",
    });
    await algorithm.encode(baseData, newData, {
      enableZstd: algorithmStore.enableZstd,
    });
    await sleep(cooldownMs);
  }

  // Encoding benchmark
  const encodeTimes: number[] = [];
  let delta: Uint8Array | null = null;

  for (let i = 0; i < iterations; i++) {
    onProgress({
      algorithm: algorithm.name,
      iteration: i + 1,
      totalIterations: iterations,
      phase: "encoding",
    });

    const start = performance.now();
    const result = await algorithm.encode(baseData, newData, {
      enableZstd: algorithmStore.enableZstd,
    });
    const end = performance.now();

    encodeTimes.push(end - start);
    delta = result.delta;
    await sleep(cooldownMs);
  }

  // Decoding benchmark
  const decodeTimes: number[] = [];

  for (let i = 0; i < iterations; i++) {
    onProgress({
      algorithm: algorithm.name,
      iteration: i + 1,
      totalIterations: iterations,
      phase: "decoding",
    });

    const start = performance.now();
    await algorithm.decode(baseData, delta!);
    const end = performance.now();

    decodeTimes.push(end - start);
    await sleep(cooldownMs);
  }

  onProgress({
    algorithm: algorithm.name,
    iteration: iterations,
    totalIterations: iterations,
    phase: "complete",
  });

  return {
    algorithmId: algorithm.id,
    timestamp: Date.now(),
    config,
    encoding: calculateStats(encodeTimes),
    decoding: calculateStats(decodeTimes),
    baseSize: baseData.length,
    newSize: newData.length,
    deltaSize: delta!.length,
    compressionRatio: delta!.length / newData.length,
  };
}

function calculateStats(times: number[]): BenchmarkStats {
  const sorted = [...times].sort((a, b) => a - b);
  const n = sorted.length;

  const sum = sorted.reduce((a, b) => a + b, 0);
  const mean = sum / n;

  const median =
    n % 2 === 0
      ? (sorted[n / 2 - 1] + sorted[n / 2]) / 2
      : sorted[Math.floor(n / 2)];

  const variance =
    sorted.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / n;
  const stdDev = Math.sqrt(variance);

  const p95Index = Math.ceil(0.95 * n) - 1;
  const p99Index = Math.ceil(0.99 * n) - 1;

  return {
    runs: n,
    mean,
    median,
    min: sorted[0],
    max: sorted[n - 1],
    stdDev,
    variance,
    p95: sorted[Math.min(p95Index, n - 1)],
    p99: sorted[Math.min(p99Index, n - 1)],
    rawTimes: times,
  };
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export const benchmarkStore = createBenchmarkStore();
