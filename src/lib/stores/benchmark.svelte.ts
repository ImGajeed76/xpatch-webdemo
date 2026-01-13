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
  batchSize: 20, // 20 ops per measurement = 20x precision improvement
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

    setBatchSize(value: number): void {
      config = {...config, batchSize: Math.max(1, Math.min(100, value))};
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
          "Encode Runs",
          "Encode Outliers Removed",
          "Encode Mean (ms)",
          "Encode CI 95% (ms)",
          "Encode Median (ms)",
          "Encode Trimmed Mean (ms)",
          "Encode Min (ms)",
          "Encode Max (ms)",
          "Encode StdDev",
          "Encode IQR",
          "Encode P95",
          "Encode P99",
          "Decode Runs",
          "Decode Outliers Removed",
          "Decode Mean (ms)",
          "Decode CI 95% (ms)",
          "Decode Median (ms)",
          "Decode Trimmed Mean (ms)",
          "Decode Min (ms)",
          "Decode Max (ms)",
          "Decode StdDev",
          "Decode IQR",
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
              result.encoding.runs,
              result.encoding.outliersRemoved,
              result.encoding.mean.toFixed(3),
              result.encoding.marginOfError.toFixed(3),
              result.encoding.median.toFixed(3),
              result.encoding.trimmedMean.toFixed(3),
              result.encoding.min.toFixed(3),
              result.encoding.max.toFixed(3),
              result.encoding.stdDev.toFixed(3),
              result.encoding.iqr.toFixed(3),
              result.encoding.p95.toFixed(3),
              result.encoding.p99.toFixed(3),
              result.decoding.runs,
              result.decoding.outliersRemoved,
              result.decoding.mean.toFixed(3),
              result.decoding.marginOfError.toFixed(3),
              result.decoding.median.toFixed(3),
              result.decoding.trimmedMean.toFixed(3),
              result.decoding.min.toFixed(3),
              result.decoding.max.toFixed(3),
              result.decoding.stdDev.toFixed(3),
              result.decoding.iqr.toFixed(3),
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
  const {iterations, warmupRuns, cooldownMs, batchSize} = config;

  // Ensure algorithm is initialized
  if (!algorithm.isInitialized()) {
    await algorithm.init();
  }

  // Warmup phase - run batchSize * warmupRuns operations
  for (let i = 0; i < warmupRuns; i++) {
    onProgress({
      algorithm: algorithm.name,
      iteration: i + 1,
      totalIterations: warmupRuns,
      phase: "warmup",
    });
    for (let b = 0; b < batchSize; b++) {
      await algorithm.encode(baseData, newData, {
        enableZstd: algorithmStore.enableZstd,
      });
    }
    await sleep(cooldownMs);
  }

  // Encoding benchmark with batch timing
  // Batch timing: time batchSize ops together, divide for per-op time
  // This increases effective precision by batchSize factor
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
    for (let b = 0; b < batchSize; b++) {
      const result = await algorithm.encode(baseData, newData, {
        enableZstd: algorithmStore.enableZstd,
      });
      delta = result.delta;
    }
    const end = performance.now();

    // Per-operation time = total batch time / batch size
    encodeTimes.push((end - start) / batchSize);
    await sleep(cooldownMs);
  }

  // Decoding warmup phase
  for (let i = 0; i < warmupRuns; i++) {
    onProgress({
      algorithm: algorithm.name,
      iteration: i + 1,
      totalIterations: warmupRuns,
      phase: "warmup",
    });
    for (let b = 0; b < batchSize; b++) {
      await algorithm.decode(baseData, delta!);
    }
    await sleep(cooldownMs);
  }

  // Decoding benchmark with batch timing
  const decodeTimes: number[] = [];

  for (let i = 0; i < iterations; i++) {
    onProgress({
      algorithm: algorithm.name,
      iteration: i + 1,
      totalIterations: iterations,
      phase: "decoding",
    });

    const start = performance.now();
    for (let b = 0; b < batchSize; b++) {
      await algorithm.decode(baseData, delta!);
    }
    const end = performance.now();

    // Per-operation time = total batch time / batch size
    decodeTimes.push((end - start) / batchSize);
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

  // Calculate quartiles for IQR-based outlier detection
  const q1 = getPercentile(sorted, 0.25);
  const q3 = getPercentile(sorted, 0.75);
  const iqr = q3 - q1;

  // Remove outliers using IQR method (1.5 * IQR rule)
  const lowerBound = q1 - 1.5 * iqr;
  const upperBound = q3 + 1.5 * iqr;
  const filtered = sorted.filter((t) => t >= lowerBound && t <= upperBound);
  const outliersRemoved = n - filtered.length;

  // Use filtered data for statistics (fall back to original if all filtered out)
  const data = filtered.length > 0 ? filtered : sorted;
  const count = data.length;

  // Central tendency
  const sum = data.reduce((a, b) => a + b, 0);
  const mean = sum / count;
  const median = getPercentile(data, 0.5);

  // Trimmed mean (exclude top/bottom 10%)
  const trimAmount = Math.floor(count * 0.1);
  const trimmedData = data.slice(trimAmount, count - trimAmount);
  const trimmedMean =
    trimmedData.length > 0
      ? trimmedData.reduce((a, b) => a + b, 0) / trimmedData.length
      : mean;

  // Spread - use sample variance (Bessel's correction: n-1)
  const variance =
    count > 1
      ? data.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) /
        (count - 1)
      : 0;
  const stdDev = Math.sqrt(variance);
  const range = data[count - 1] - data[0];
  const cv = mean > 0 ? stdDev / mean : 0; // Coefficient of variation

  // Percentiles (from filtered data)
  const p5 = getPercentile(data, 0.05);
  const p25 = getPercentile(data, 0.25);
  const p75 = getPercentile(data, 0.75);
  const p95 = getPercentile(data, 0.95);
  const p99 = getPercentile(data, 0.99);
  const filteredIqr = p75 - p25;

  // Confidence interval (95%) using t-distribution approximation
  // For large n, t ≈ 1.96; for smaller n, use approximation
  const tValue = count >= 30 ? 1.96 : getTValue95(count - 1);
  const sem = stdDev / Math.sqrt(count); // Standard error of mean
  const marginOfError = tValue * sem;
  const ci95Lower = mean - marginOfError;
  const ci95Upper = mean + marginOfError;

  return {
    runs: count,
    outliersRemoved,
    mean,
    trimmedMean,
    median,
    min: data[0],
    max: data[count - 1],
    range,
    stdDev,
    variance,
    iqr: filteredIqr,
    cv,
    p5,
    p25,
    p75,
    p95,
    p99,
    sem,
    ci95Lower,
    ci95Upper,
    marginOfError,
    rawTimes: times,
    filteredTimes: filtered,
  };
}

// Get percentile using linear interpolation
function getPercentile(sorted: number[], p: number): number {
  const n = sorted.length;
  if (n === 0) return 0;
  if (n === 1) return sorted[0];

  const index = p * (n - 1);
  const lower = Math.floor(index);
  const upper = Math.ceil(index);
  const weight = index - lower;

  if (lower === upper) return sorted[lower];
  return sorted[lower] * (1 - weight) + sorted[upper] * weight;
}

// Approximate t-value for 95% confidence interval
// Using approximation for common degrees of freedom
function getTValue95(df: number): number {
  if (df >= 120) return 1.98;
  if (df >= 60) return 2.0;
  if (df >= 30) return 2.04;
  if (df >= 20) return 2.09;
  if (df >= 15) return 2.13;
  if (df >= 10) return 2.23;
  if (df >= 5) return 2.57;
  if (df >= 3) return 3.18;
  if (df >= 2) return 4.3;
  return 12.71; // df = 1
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export const benchmarkStore = createBenchmarkStore();
