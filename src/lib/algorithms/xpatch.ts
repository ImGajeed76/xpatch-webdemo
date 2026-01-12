import type {
  DeltaAlgorithm,
  EncodeOptions,
  EncodingResult,
  DecodingResult,
} from "./types";

let xpatchModule: typeof import("xpatch-rs") | null = null;
let initialized = false;

export const xpatchAlgorithm: DeltaAlgorithm = {
  id: "xpatch",
  name: "xpatch",
  description: "High-performance delta compression with optional zstd",
  isWasm: true,
  supportsZstd: true,

  async init(): Promise<void> {
    if (initialized) return;

    const module = await import("xpatch-rs");
    // Default export is the init function
    await module.default();
    xpatchModule = module;
    initialized = true;
  },

  isInitialized(): boolean {
    return initialized;
  },

  version(): string {
    if (!xpatchModule) return "unknown";
    return xpatchModule.version();
  },

  async encode(
    baseData: Uint8Array,
    newData: Uint8Array,
    options?: EncodeOptions
  ): Promise<EncodingResult> {
    if (!xpatchModule || !initialized) {
      throw new Error("xpatch not initialized");
    }

    const enableZstd = options?.enableZstd ?? true;
    const start = performance.now();
    const delta = xpatchModule.encode(0, baseData, newData, enableZstd);
    const end = performance.now();

    return {
      delta,
      encodingTimeMs: end - start,
      originalSize: newData.length,
      deltaSize: delta.length,
      compressionRatio: delta.length / newData.length,
    };
  },

  async decode(
    baseData: Uint8Array,
    delta: Uint8Array
  ): Promise<DecodingResult> {
    if (!xpatchModule || !initialized) {
      throw new Error("xpatch not initialized");
    }

    const start = performance.now();
    const data = xpatchModule.decode(baseData, delta);
    const end = performance.now();

    return {
      data,
      decodingTimeMs: end - start,
      verified: true,
    };
  },
};
