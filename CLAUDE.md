# Claude Code Project Instructions

## Project Overview

xpatch-webdemo is a web demo showcasing the xpatch delta compression algorithm compared to other algorithms (xdelta3, fossil-delta, bsdiff). Built with Svelte 5, SvelteKit 2, shadcn-svelte, and TailwindCSS v4.

## Frontend Style Review

After writing or modifying frontend code (Svelte components, routes, styles), spawn a review agent to check compliance with UI/UX guidelines.

**Agent configuration:**

- Tool: `Task`
- Subagent type: `general-purpose`

**Agent prompt:**

```
Review the frontend code that was just written/modified against the UI/UX guidelines.

Read the guidelines file: docs/ui-ux/GUIDELINES.md

Check the code for violations and report findings grouped by severity:

## Report Format

### [5/5 - Critical]
- Line X in `path/to/file.svelte`
  Description of violation.
  See: Guidelines section reference

### [4/5 - Important]
- ...

### [3/5 - Recommended]
- ...

### [2/5 - Nice-to-have]
- ...

### Summary
- Critical: N
- Important: N
- Recommended: N
- Nice-to-have: N

If no violations found, report: "No violations found."
```

## Key Technical Notes

### WASM Packages

The project uses browser-only WASM packages. SSR is disabled for pages that use them:

- `xpatch-rs` - Main algorithm to showcase
- `xdelta3-wasm` - Has broken package.json, aliased in vite.config.ts
- `bsdiff-wasm` - Uses Emscripten FS
- `fossil-delta` - Pure JS (no WASM)

### Always Use Bun

All package management and scripts must use `bun`, not npm or pnpm.

```bash
bun add <package>
bun run dev
bun run build
bun run check
```

### Internationalization

All user-facing text must use Paraglide. Messages are in `messages/en.json`.

```svelte
<script>
  import * as m from "$lib/paraglide/messages.js";
</script>

<h1>{m.demo_header_title()}</h1>
```

### Svelte 5 Runes

Use Svelte 5 runes for state management:

- `$state()` for reactive state
- `$derived()` for computed values
- `$props()` for component props
