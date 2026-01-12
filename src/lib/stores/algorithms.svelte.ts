import {
  algorithmInfo,
  getAlgorithm,
  initializeAlgorithms,
} from "$lib/algorithms/registry";
import type {AlgorithmInfo, DeltaAlgorithm} from "$lib/algorithms/types";

// Default selected algorithms
const DEFAULT_SELECTED = ["xpatch", "xdelta3", "fossil-delta"];

function createAlgorithmStore() {
  let selected = $state<Set<string>>(new Set(DEFAULT_SELECTED));
  let initialized = $state<Map<string, boolean>>(new Map());
  let loading = $state<Map<string, boolean>>(new Map());
  let enableZstd = $state(true);
  let loadedAlgorithms = $state<Map<string, DeltaAlgorithm>>(new Map());

  const available = $derived(algorithmInfo);
  const selectedInfo = $derived(
    algorithmInfo.filter((a) => selected.has(a.id))
  );
  const allInitialized = $derived(
    Array.from(selected).every((id) => initialized.get(id) === true)
  );
  const isLoading = $derived(
    Array.from(loading.values()).some((v) => v === true)
  );

  return {
    // Getters
    get available(): AlgorithmInfo[] {
      return available;
    },
    get selected(): Set<string> {
      return selected;
    },
    get selectedInfo(): AlgorithmInfo[] {
      return selectedInfo;
    },
    get initialized(): Map<string, boolean> {
      return initialized;
    },
    get loading(): Map<string, boolean> {
      return loading;
    },
    get allInitialized(): boolean {
      return allInitialized;
    },
    get isLoading(): boolean {
      return isLoading;
    },
    get enableZstd(): boolean {
      return enableZstd;
    },

    // Setters
    set enableZstd(value: boolean) {
      enableZstd = value;
    },

    // Get loaded algorithm by ID
    getLoadedAlgorithm(id: string): DeltaAlgorithm | undefined {
      return loadedAlgorithms.get(id);
    },

    // Get all loaded selected algorithms
    getSelectedAlgorithms(): DeltaAlgorithm[] {
      return Array.from(selected)
        .map((id) => loadedAlgorithms.get(id))
        .filter((a): a is DeltaAlgorithm => a !== undefined);
    },

    // Actions
    toggleSelection(id: string): void {
      const newSet = new Set(selected);
      if (newSet.has(id)) {
        // Don't allow deselecting if only one is selected
        if (newSet.size > 1) {
          newSet.delete(id);
        }
      } else {
        newSet.add(id);
      }
      selected = newSet;
    },

    setSelection(ids: string[]): void {
      selected = new Set(ids);
    },

    selectAll(): void {
      selected = new Set(algorithmInfo.map((a) => a.id));
    },

    isSelected(id: string): boolean {
      return selected.has(id);
    },

    isInitialized(id: string): boolean {
      return initialized.get(id) === true;
    },

    isAlgorithmLoading(id: string): boolean {
      return loading.get(id) === true;
    },

    async initializeSelected(): Promise<void> {
      const toInit = Array.from(selected).filter(
        (id) => !initialized.get(id) && !loading.get(id)
      );

      if (toInit.length === 0) return;

      // Mark as loading
      const newLoading = new Map(loading);
      toInit.forEach((id) => newLoading.set(id, true));
      loading = newLoading;

      // Initialize
      const results = await initializeAlgorithms(toInit);

      // Update state
      const newInitialized = new Map(initialized);
      const finalLoading = new Map(loading);
      const newLoadedAlgorithms = new Map(loadedAlgorithms);

      for (const [id, success] of results) {
        newInitialized.set(id, success);
        finalLoading.set(id, false);
        if (success) {
          const alg = await getAlgorithm(id);
          if (alg) {
            newLoadedAlgorithms.set(id, alg);
          }
        }
      }

      initialized = newInitialized;
      loading = finalLoading;
      loadedAlgorithms = newLoadedAlgorithms;
    },

    async initializeAlgorithm(id: string): Promise<boolean> {
      if (initialized.get(id)) return true;
      if (loading.get(id)) return false;

      const algorithm = await getAlgorithm(id);
      if (!algorithm) return false;

      // Mark as loading
      const newLoading = new Map(loading);
      newLoading.set(id, true);
      loading = newLoading;

      try {
        await algorithm.init();
        const newInitialized = new Map(initialized);
        newInitialized.set(id, true);
        initialized = newInitialized;

        const newLoadedAlgorithms = new Map(loadedAlgorithms);
        newLoadedAlgorithms.set(id, algorithm);
        loadedAlgorithms = newLoadedAlgorithms;

        return true;
      } catch (error) {
        console.error(`Failed to initialize ${id}:`, error);
        const newInitialized = new Map(initialized);
        newInitialized.set(id, false);
        initialized = newInitialized;
        return false;
      } finally {
        const finalLoading = new Map(loading);
        finalLoading.set(id, false);
        loading = finalLoading;
      }
    },

    reset(): void {
      selected = new Set(DEFAULT_SELECTED);
      enableZstd = true;
    },
  };
}

export const algorithmStore = createAlgorithmStore();
