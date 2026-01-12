declare module "bsdiff-wasm" {
  interface BsdiffModule {
    FS: {
      writeFile: (path: string, data: Uint8Array) => void;
      readFile: (path: string) => Uint8Array;
      unlink: (path: string) => void;
    };
    callMain: (args: string[]) => number;
  }

  export function loadBsdiff(): Promise<BsdiffModule>;
  export function loadBspatch(): Promise<BsdiffModule>;
}
