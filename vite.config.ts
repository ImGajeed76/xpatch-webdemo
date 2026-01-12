import {paraglideVitePlugin} from "@inlang/paraglide-js";
import tailwindcss from "@tailwindcss/vite";
import {sveltekit} from "@sveltejs/kit/vite";
import {defineConfig} from "vite";

export default defineConfig({
  plugins: [
    tailwindcss(),
    sveltekit(),
    paraglideVitePlugin({
      project: "./project.inlang",
      outdir: "./src/lib/paraglide",
    }),
  ],
  resolve: {
    alias: {
      // Fix incorrect module path in xdelta3-wasm package.json
      "xdelta3-wasm": "xdelta3-wasm/dist/xdelta3-wasm.esm.js",
    },
  },
  optimizeDeps: {
    exclude: ["xdelta3-wasm", "bsdiff-wasm", "xpatch-rs"],
  },
  ssr: {
    // Mark browser-only packages as external for SSR
    external: ["xdelta3-wasm", "bsdiff-wasm", "xpatch-rs"],
  },
});
