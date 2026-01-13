import type {DeltaAlgorithm, EncodingResult, DecodingResult} from "./types";

// bsdiff-wasm types
interface BsdiffModule {
  FS: {
    writeFile: (path: string, data: Uint8Array) => void;
    readFile: (path: string) => Uint8Array;
    unlink: (path: string) => void;
  };
  callMain: (args: string[]) => number;
}

type BsdiffLoader = typeof import("bsdiff-wasm");
let bsdiffLoader: BsdiffLoader | null = null;
let bsdiffModule: BsdiffModule | null = null;
let bspatchModule: BsdiffModule | null = null;
let initialized = false;

export const bsdiffAlgorithm: DeltaAlgorithm = {
  id: "bsdiff",
  name: "bsdiff",
  description: "Binary diff algorithm, excellent for executables",
  isWasm: true,
  supportsZstd: false,

  async init(): Promise<void> {
    if (initialized) return;

    bsdiffLoader = await import("bsdiff-wasm");
    bsdiffModule = await bsdiffLoader.loadBsdiff();
    bspatchModule = await bsdiffLoader.loadBspatch();
    initialized = true;
  },

  isInitialized(): boolean {
    return initialized;
  },

  async encode(
    baseData: Uint8Array,
    newData: Uint8Array
  ): Promise<EncodingResult> {
    if (!bsdiffModule || !initialized) {
      throw new Error("bsdiff not initialized");
    }

    // bsdiff doesn't handle empty inputs well
    if (baseData.length === 0 || newData.length === 0) {
      throw new Error("bsdiff requires non-empty inputs");
    }

    const start = performance.now();

    // Write input files to virtual FS
    bsdiffModule.FS.writeFile("/old.bin", baseData);
    bsdiffModule.FS.writeFile("/new.bin", newData);

    // Run bsdiff
    const ret = bsdiffModule.callMain(["/old.bin", "/new.bin", "/patch.bin"]);
    if (ret !== 0) {
      throw new Error(`bsdiff failed with code ${ret}`);
    }

    // Read output
    const delta = bsdiffModule.FS.readFile("/patch.bin");
    const end = performance.now();

    // Cleanup
    try {
      bsdiffModule.FS.unlink("/old.bin");
      bsdiffModule.FS.unlink("/new.bin");
      bsdiffModule.FS.unlink("/patch.bin");
    } catch {
      // Ignore cleanup errors
    }

    return {
      delta: new Uint8Array(delta),
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
    if (!bspatchModule || !initialized) {
      throw new Error("bspatch not initialized");
    }

    const start = performance.now();

    // Write input files to virtual FS
    bspatchModule.FS.writeFile("/old.bin", baseData);
    bspatchModule.FS.writeFile("/patch.bin", delta);

    // Run bspatch
    const ret = bspatchModule.callMain(["/old.bin", "/new.bin", "/patch.bin"]);
    if (ret !== 0) {
      throw new Error(`bspatch failed with code ${ret}`);
    }

    // Read output
    const data = bspatchModule.FS.readFile("/new.bin");
    const end = performance.now();

    // Cleanup
    try {
      bspatchModule.FS.unlink("/old.bin");
      bspatchModule.FS.unlink("/new.bin");
      bspatchModule.FS.unlink("/patch.bin");
    } catch {
      // Ignore cleanup errors
    }

    return {
      data: new Uint8Array(data),
      decodingTimeMs: end - start,
      verified: true,
    };
  },
};
