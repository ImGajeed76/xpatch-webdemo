import type {
  HistoryEntry,
  CompressionResult,
  BenchmarkResult,
} from "$lib/algorithms/types";

const STORAGE_KEY = "xpatch-demo-history";
const MAX_ENTRIES = 50;

function createHistoryStore() {
  let entries = $state<HistoryEntry[]>(loadFromStorage());

  const hasEntries = $derived(entries.length > 0);
  const entryCount = $derived(entries.length);

  return {
    // Getters
    get entries(): HistoryEntry[] {
      return entries;
    },
    get hasEntries(): boolean {
      return hasEntries;
    },
    get entryCount(): number {
      return entryCount;
    },

    // Actions
    addEntry(
      baseData: Uint8Array,
      newData: Uint8Array,
      results: CompressionResult[],
      benchmarks?: BenchmarkResult[],
      label?: string
    ): string {
      const id = generateId();
      const entry: HistoryEntry = {
        id,
        timestamp: Date.now(),
        label,
        baseDataHash: hashData(baseData),
        baseDataSize: baseData.length,
        baseDataPreview: getPreview(baseData),
        newDataHash: hashData(newData),
        newDataSize: newData.length,
        newDataPreview: getPreview(newData),
        results,
        benchmarks,
      };

      // Add to beginning, limit size
      const newEntries = [entry, ...entries].slice(0, MAX_ENTRIES);
      entries = newEntries;
      saveToStorage(entries);

      return id;
    },

    getEntry(id: string): HistoryEntry | undefined {
      return entries.find((e) => e.id === id);
    },

    removeEntry(id: string): void {
      entries = entries.filter((e) => e.id !== id);
      saveToStorage(entries);
    },

    updateLabel(id: string, label: string): void {
      entries = entries.map((e) => (e.id === id ? {...e, label} : e));
      saveToStorage(entries);
    },

    clear(): void {
      entries = [];
      saveToStorage([]);
    },
  };
}

// Helper functions
function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
}

function hashData(data: Uint8Array): string {
  // Simple hash for identification (not cryptographic)
  let hash = 0;
  for (let i = 0; i < data.length; i++) {
    hash = (hash << 5) - hash + data[i];
    hash = hash & hash; // Convert to 32bit integer
  }
  return hash.toString(16);
}

function getPreview(data: Uint8Array): string {
  try {
    const text = new TextDecoder().decode(data.slice(0, 150));
    // Check if it's valid text (no replacement characters)
    if (text.includes("\uFFFD")) {
      return `[Binary data: ${data.length} bytes]`;
    }
    return text.length >= 150 ? text.slice(0, 100) + "..." : text;
  } catch {
    return `[Binary data: ${data.length} bytes]`;
  }
}

function loadFromStorage(): HistoryEntry[] {
  if (typeof window === "undefined") return [];

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];
    return JSON.parse(stored);
  } catch {
    return [];
  }
}

function saveToStorage(entries: HistoryEntry[]): void {
  if (typeof window === "undefined") return;

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
  } catch (err) {
    console.error("Failed to save history to localStorage:", err);
  }
}

export const historyStore = createHistoryStore();
