// Algorithm metadata
export interface AlgorithmInfo {
  id: string;
  name: string;
  description: string;
  isWasm: boolean;
  color: string; // For chart visualization
}

// Common interface for all delta compression algorithms
export interface DeltaAlgorithm {
  id: string;
  name: string;
  description: string;
  isWasm: boolean;

  // Lifecycle
  init(): Promise<void>;
  isInitialized(): boolean;

  // Core operations
  encode(
    baseData: Uint8Array,
    newData: Uint8Array,
    options?: EncodeOptions
  ): Promise<EncodingResult>;
  decode(baseData: Uint8Array, delta: Uint8Array): Promise<DecodingResult>;

  // Optional features
  supportsZstd?: boolean;
  version?: () => string;
}

export interface EncodeOptions {
  enableZstd?: boolean;
}

export interface EncodingResult {
  delta: Uint8Array;
  encodingTimeMs: number;
  originalSize: number;
  deltaSize: number;
  compressionRatio: number;
}

export interface DecodingResult {
  data: Uint8Array;
  decodingTimeMs: number;
  verified: boolean;
}

// Single compression run result
export interface CompressionResult {
  algorithmId: string;
  timestamp: number;

  // Sizes
  baseSize: number;
  newSize: number;
  deltaSize: number;
  compressionRatio: number; // deltaSize / newSize
  spaceSavings: number; // 1 - (deltaSize / newSize)

  // Timing
  encodeTimeMs: number;
  decodeTimeMs: number;

  // Verification
  verified: boolean;
  error?: string;
}

// Benchmark statistics
export interface BenchmarkStats {
  runs: number;
  mean: number;
  median: number;
  min: number;
  max: number;
  stdDev: number;
  variance: number;
  p95: number;
  p99: number;
  rawTimes: number[];
}

// Full benchmark result
export interface BenchmarkResult {
  algorithmId: string;
  timestamp: number;
  config: BenchmarkConfig;

  encoding: BenchmarkStats;
  decoding: BenchmarkStats;

  // Size metrics (constant across runs)
  baseSize: number;
  newSize: number;
  deltaSize: number;
  compressionRatio: number;
}

export interface BenchmarkConfig {
  iterations: number;
  warmupRuns: number;
  cooldownMs: number; // Time between runs to allow GC
}

// History entry
export interface HistoryEntry {
  id: string;
  timestamp: number;
  label?: string;

  // Input metadata (not the actual data for storage efficiency)
  baseDataHash: string;
  baseDataSize: number;
  baseDataPreview: string; // First 100 chars if text

  newDataHash: string;
  newDataSize: number;
  newDataPreview: string;

  // Results for each algorithm
  results: CompressionResult[];
  benchmarks?: BenchmarkResult[];
}
