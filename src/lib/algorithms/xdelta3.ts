import type {DeltaAlgorithm, EncodingResult, DecodingResult} from "./types";

type Xdelta3Module = typeof import("xdelta3-wasm");
let xdelta3Module: Xdelta3Module | null = null;
let initialized = false;

export const xdelta3Algorithm: DeltaAlgorithm = {
  id: "xdelta3",
  name: "xdelta3",
  description: "Industry-standard VCDIFF delta compression",
  isWasm: true,
  supportsZstd: false,

  async init(): Promise<void> {
    if (initialized) return;

    const module = await import("xdelta3-wasm");
    await module.init();
    xdelta3Module = module;
    initialized = true;
  },

  isInitialized(): boolean {
    return initialized;
  },

  async encode(
    baseData: Uint8Array,
    newData: Uint8Array
  ): Promise<EncodingResult> {
    if (!xdelta3Module || !initialized) {
      throw new Error("xdelta3 not initialized");
    }

    const start = performance.now();
    const result = xdelta3Module.xd3_encode_memory(
      newData,
      baseData,
      newData.length * 2 + 1024, // Max output size
      xdelta3Module.xd3_smatch_cfg.DEFAULT
    );
    const end = performance.now();

    if (result.ret !== 0) {
      throw new Error(`xdelta3 encode failed: ${result.str}`);
    }

    return {
      delta: result.output,
      encodingTimeMs: end - start,
      originalSize: newData.length,
      deltaSize: result.output.length,
      compressionRatio: result.output.length / newData.length,
    };
  },

  async decode(
    baseData: Uint8Array,
    delta: Uint8Array
  ): Promise<DecodingResult> {
    if (!xdelta3Module || !initialized) {
      throw new Error("xdelta3 not initialized");
    }

    const start = performance.now();
    const result = xdelta3Module.xd3_decode_memory(
      delta,
      baseData,
      delta.length * 10 + baseData.length + 1024 // Max output size
    );
    const end = performance.now();

    if (result.ret !== 0) {
      throw new Error(`xdelta3 decode failed: ${result.str}`);
    }

    return {
      data: result.output,
      decodingTimeMs: end - start,
      verified: true,
    };
  },
};
