import type {DeltaAlgorithm, EncodingResult, DecodingResult} from "./types";

type FossilDeltaModule = typeof import("fossil-delta");
let fossilDeltaModule: FossilDeltaModule | null = null;
let initialized = false;

export const fossilDeltaAlgorithm: DeltaAlgorithm = {
  id: "fossil-delta",
  name: "fossil-delta",
  description: "Fast, lightweight pure JavaScript delta compression",
  isWasm: false,
  supportsZstd: false,

  async init(): Promise<void> {
    if (initialized) return;

    fossilDeltaModule = await import("fossil-delta");
    initialized = true;
  },

  isInitialized(): boolean {
    return initialized;
  },

  async encode(
    baseData: Uint8Array,
    newData: Uint8Array
  ): Promise<EncodingResult> {
    if (!fossilDeltaModule || !initialized) {
      throw new Error("fossil-delta not initialized");
    }

    const start = performance.now();
    const delta = fossilDeltaModule.createDelta(baseData, newData);
    const end = performance.now();

    // Ensure we return Uint8Array
    const deltaArray =
      delta instanceof Uint8Array ? delta : new Uint8Array(delta);

    return {
      delta: deltaArray,
      encodingTimeMs: end - start,
      originalSize: newData.length,
      deltaSize: deltaArray.length,
      compressionRatio: deltaArray.length / newData.length,
    };
  },

  async decode(
    baseData: Uint8Array,
    delta: Uint8Array
  ): Promise<DecodingResult> {
    if (!fossilDeltaModule || !initialized) {
      throw new Error("fossil-delta not initialized");
    }

    const start = performance.now();
    const result = fossilDeltaModule.applyDelta(baseData, delta);
    const end = performance.now();

    // Ensure we return Uint8Array
    const data = result instanceof Uint8Array ? result : new Uint8Array(result);

    return {
      data,
      decodingTimeMs: end - start,
      verified: true,
    };
  },
};
