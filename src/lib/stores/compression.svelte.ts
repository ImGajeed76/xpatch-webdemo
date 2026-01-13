import type {CompressionResult} from "$lib/algorithms/types";
import {algorithmStore} from "./algorithms.svelte";

export type InputMode = "text" | "file";

export interface CompressionProgress {
  current: number;
  total: number;
  currentAlgorithm: string;
}

function createCompressionStore() {
  let baseData = $state<Uint8Array | null>(null);
  let newData = $state<Uint8Array | null>(null);
  let inputMode = $state<InputMode>("text");
  let results = $state<CompressionResult[]>([]);
  let isRunning = $state(false);
  let progress = $state<CompressionProgress>({
    current: 0,
    total: 0,
    currentAlgorithm: "",
  });
  let error = $state<string | null>(null);

  const hasData = $derived(true); // Allow empty inputs
  const baseSize = $derived(baseData?.length ?? 0);
  const newSize = $derived(newData?.length ?? 0);
  const hasResults = $derived(results.length > 0);

  // Find best results
  const bestDeltaSize = $derived(
    results.length > 0
      ? Math.min(...results.filter((r) => !r.error).map((r) => r.deltaSize))
      : null
  );
  const bestEncodeTime = $derived(
    results.length > 0
      ? Math.min(...results.filter((r) => !r.error).map((r) => r.encodeTimeMs))
      : null
  );
  const bestDecodeTime = $derived(
    results.length > 0
      ? Math.min(...results.filter((r) => !r.error).map((r) => r.decodeTimeMs))
      : null
  );

  return {
    // Getters
    get baseData(): Uint8Array | null {
      return baseData;
    },
    get newData(): Uint8Array | null {
      return newData;
    },
    get inputMode(): InputMode {
      return inputMode;
    },
    get results(): CompressionResult[] {
      return results;
    },
    get isRunning(): boolean {
      return isRunning;
    },
    get progress(): CompressionProgress {
      return progress;
    },
    get error(): string | null {
      return error;
    },
    get hasData(): boolean {
      return hasData;
    },
    get baseSize(): number {
      return baseSize;
    },
    get newSize(): number {
      return newSize;
    },
    get hasResults(): boolean {
      return hasResults;
    },
    get bestDeltaSize(): number | null {
      return bestDeltaSize;
    },
    get bestEncodeTime(): number | null {
      return bestEncodeTime;
    },
    get bestDecodeTime(): number | null {
      return bestDecodeTime;
    },

    // Setters
    setBaseData(data: Uint8Array | null): void {
      baseData = data;
      results = [];
      error = null;
    },

    setNewData(data: Uint8Array | null): void {
      newData = data;
      results = [];
      error = null;
    },

    setInputMode(mode: InputMode): void {
      inputMode = mode;
    },

    setBaseText(text: string): void {
      baseData = new TextEncoder().encode(text);
      results = [];
      error = null;
    },

    setNewText(text: string): void {
      newData = new TextEncoder().encode(text);
      results = [];
      error = null;
    },

    // Actions
    async runComparison(): Promise<void> {
      // Use empty arrays if data is null
      const base = baseData ?? new Uint8Array(0);
      const newer = newData ?? new Uint8Array(0);

      const selectedAlgorithms = algorithmStore.getSelectedAlgorithms();
      if (selectedAlgorithms.length === 0) {
        error = "Please select at least one algorithm";
        return;
      }

      isRunning = true;
      error = null;
      results = [];
      progress = {
        current: 0,
        total: selectedAlgorithms.length,
        currentAlgorithm: "",
      };

      const newResults: CompressionResult[] = [];

      for (let i = 0; i < selectedAlgorithms.length; i++) {
        const algorithm = selectedAlgorithms[i];
        progress = {
          current: i,
          total: selectedAlgorithms.length,
          currentAlgorithm: algorithm.name,
        };

        try {
          // Ensure algorithm is initialized
          if (!algorithm.isInitialized()) {
            await algorithm.init();
          }

          const batchSize = algorithmStore.comparisonBatchSize;
          let encodeResult;
          let decodeResult;

          // Batch encode timing for precision
          const encodeStart = performance.now();
          for (let b = 0; b < batchSize; b++) {
            encodeResult = await algorithm.encode(base, newer, {
              enableZstd: algorithmStore.enableZstd,
            });
          }
          const encodeEnd = performance.now();
          const encodeTimeMs = (encodeEnd - encodeStart) / batchSize;

          // Batch decode timing for precision
          const decodeStart = performance.now();
          for (let b = 0; b < batchSize; b++) {
            decodeResult = await algorithm.decode(base, encodeResult!.delta);
          }
          const decodeEnd = performance.now();
          const decodeTimeMs = (decodeEnd - decodeStart) / batchSize;

          // Verify the decoded data matches
          const verified = arraysEqual(decodeResult!.data, newer);

          newResults.push({
            algorithmId: algorithm.id,
            timestamp: Date.now(),
            baseSize: base.length,
            newSize: newer.length,
            deltaSize: encodeResult!.deltaSize,
            compressionRatio: encodeResult!.compressionRatio,
            spaceSavings: 1 - encodeResult!.compressionRatio,
            encodeTimeMs,
            decodeTimeMs,
            verified,
          });
        } catch (err) {
          newResults.push({
            algorithmId: algorithm.id,
            timestamp: Date.now(),
            baseSize: base.length,
            newSize: newer.length,
            deltaSize: 0,
            compressionRatio: 0,
            spaceSavings: 0,
            encodeTimeMs: 0,
            decodeTimeMs: 0,
            verified: false,
            error: err instanceof Error ? err.message : String(err),
          });
        }
      }

      results = newResults;
      isRunning = false;
      progress = {
        current: selectedAlgorithms.length,
        total: selectedAlgorithms.length,
        currentAlgorithm: "",
      };
    },

    clear(): void {
      baseData = null;
      newData = null;
      results = [];
      error = null;
      progress = {current: 0, total: 0, currentAlgorithm: ""};
    },

    clearResults(): void {
      results = [];
      error = null;
    },
  };
}

// Helper function to compare arrays
function arraysEqual(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) return false;
  }
  return true;
}

export const compressionStore = createCompressionStore();
