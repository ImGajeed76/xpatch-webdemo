import type {DeltaAlgorithm, EncodingResult, DecodingResult} from "./types";
import type * as DiffModule from "diff";

let diffModule: typeof DiffModule | null = null;
let initialized = false;

export const jsdiffAlgorithm: DeltaAlgorithm = {
  id: "jsdiff",
  name: "jsdiff",
  description: "Line-based text diff (unified patch format)",
  isWasm: false,
  supportsZstd: false,

  async init(): Promise<void> {
    if (initialized) return;

    diffModule = await import("diff");
    initialized = true;
  },

  isInitialized(): boolean {
    return initialized;
  },

  async encode(
    baseData: Uint8Array,
    newData: Uint8Array
  ): Promise<EncodingResult> {
    if (!diffModule || !initialized) {
      throw new Error("jsdiff not initialized");
    }

    // Convert to text
    const baseText = new TextDecoder().decode(baseData);
    const newText = new TextDecoder().decode(newData);

    const start = performance.now();
    const patch = diffModule.createPatch("file", baseText, newText);
    const end = performance.now();

    const delta = new TextEncoder().encode(patch);

    return {
      delta,
      encodingTimeMs: end - start,
      originalSize: newData.length,
      deltaSize: delta.length,
      compressionRatio: delta.length / Math.max(newData.length, 1),
    };
  },

  async decode(
    baseData: Uint8Array,
    delta: Uint8Array
  ): Promise<DecodingResult> {
    if (!diffModule || !initialized) {
      throw new Error("jsdiff not initialized");
    }

    const baseText = new TextDecoder().decode(baseData);
    const patchText = new TextDecoder().decode(delta);

    const start = performance.now();
    const result = diffModule.applyPatch(baseText, patchText);
    const end = performance.now();

    // applyPatch returns false if patch fails
    if (result === false) {
      return {
        data: new Uint8Array(0),
        decodingTimeMs: end - start,
        verified: false,
      };
    }

    const data = new TextEncoder().encode(result);

    return {
      data,
      decodingTimeMs: end - start,
      verified: true,
    };
  },
};
