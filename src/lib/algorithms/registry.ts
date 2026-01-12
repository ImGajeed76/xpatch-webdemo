import type {AlgorithmInfo, DeltaAlgorithm} from "./types";

// Algorithm info for display (safe for SSR - no WASM imports)
export const algorithmInfo: AlgorithmInfo[] = [
  {
    id: "xpatch",
    name: "xpatch",
    description: "High-performance delta compression with optional zstd",
    isWasm: true,
    color: "hsl(var(--chart-1))",
  },
  {
    id: "xdelta3",
    name: "xdelta3",
    description: "Industry-standard VCDIFF delta compression",
    isWasm: true,
    color: "hsl(var(--chart-2))",
  },
  {
    id: "fossil-delta",
    name: "fossil-delta",
    description: "Fast, lightweight pure JavaScript delta compression",
    isWasm: false,
    color: "hsl(var(--chart-3))",
  },
  {
    id: "bsdiff",
    name: "bsdiff",
    description: "Binary diff algorithm, excellent for executables",
    isWasm: true,
    color: "hsl(var(--chart-4))",
  },
];

// Cache for loaded algorithms
const algorithmCache = new Map<string, DeltaAlgorithm>();

// Lazy load algorithm by ID (only call in browser)
export async function getAlgorithm(
  id: string
): Promise<DeltaAlgorithm | undefined> {
  // Check cache first
  if (algorithmCache.has(id)) {
    return algorithmCache.get(id);
  }

  let algorithm: DeltaAlgorithm | undefined;

  switch (id) {
    case "xpatch": {
      const {xpatchAlgorithm} = await import("./xpatch");
      algorithm = xpatchAlgorithm;
      break;
    }
    case "xdelta3": {
      const {xdelta3Algorithm} = await import("./xdelta3");
      algorithm = xdelta3Algorithm;
      break;
    }
    case "fossil-delta": {
      const {fossilDeltaAlgorithm} = await import("./fossil-delta");
      algorithm = fossilDeltaAlgorithm;
      break;
    }
    case "bsdiff": {
      const {bsdiffAlgorithm} = await import("./bsdiff");
      algorithm = bsdiffAlgorithm;
      break;
    }
  }

  if (algorithm) {
    algorithmCache.set(id, algorithm);
  }

  return algorithm;
}

// Get algorithm info by ID (safe for SSR)
export function getAlgorithmInfo(id: string): AlgorithmInfo | undefined {
  return algorithmInfo.find((a) => a.id === id);
}

// Initialize multiple algorithms (only call in browser)
export async function initializeAlgorithms(
  ids: string[]
): Promise<Map<string, boolean>> {
  const results = new Map<string, boolean>();

  await Promise.all(
    ids.map(async (id) => {
      try {
        const algorithm = await getAlgorithm(id);
        if (!algorithm) {
          results.set(id, false);
          return;
        }

        await algorithm.init();
        results.set(id, true);
      } catch (error) {
        console.error(`Failed to initialize ${id}:`, error);
        results.set(id, false);
      }
    })
  );

  return results;
}
