import type {DeltaAlgorithm, EncodingResult, DecodingResult} from "./types";
import type DiffMatchPatch from "diff-match-patch";

let dmpInstance: DiffMatchPatch | null = null;
let initialized = false;

export const diffMatchPatchAlgorithm: DeltaAlgorithm = {
  id: "diff-match-patch",
  name: "diff-match-patch",
  description: "Google's text diff algorithm with semantic cleanup",
  isWasm: false,
  supportsZstd: false,

  async init(): Promise<void> {
    if (initialized) return;

    const DMP = (await import("diff-match-patch")).default;
    dmpInstance = new DMP();
    initialized = true;
  },

  isInitialized(): boolean {
    return initialized;
  },

  async encode(
    baseData: Uint8Array,
    newData: Uint8Array
  ): Promise<EncodingResult> {
    if (!dmpInstance || !initialized) {
      throw new Error("diff-match-patch not initialized");
    }

    // Convert to text
    const baseText = new TextDecoder().decode(baseData);
    const newText = new TextDecoder().decode(newData);

    const start = performance.now();
    const patches = dmpInstance.patch_make(baseText, newText);
    const patchText = dmpInstance.patch_toText(patches);
    const end = performance.now();

    const delta = new TextEncoder().encode(patchText);

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
    if (!dmpInstance || !initialized) {
      throw new Error("diff-match-patch not initialized");
    }

    const baseText = new TextDecoder().decode(baseData);
    const patchText = new TextDecoder().decode(delta);

    const start = performance.now();
    const patches = dmpInstance.patch_fromText(patchText);
    const [result, success] = dmpInstance.patch_apply(patches, baseText);
    const end = performance.now();

    const data = new TextEncoder().encode(result);
    const allSuccess = success.every((s) => s);

    return {
      data,
      decodingTimeMs: end - start,
      verified: allSuccess,
    };
  },
};
