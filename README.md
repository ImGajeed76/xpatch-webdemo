# xpatch-webdemo

Interactive web demo comparing **xpatch** delta compression performance against other popular algorithms.

## About

This demo allows you to compare the performance of different delta compression algorithms:

- **xpatch** - High-performance delta compression with optional zstd
- **xdelta3** - Industry-standard VCDIFF delta compression
- **bsdiff** - Binary diff algorithm optimized for executables
- **fossil-delta** - Fast, lightweight delta compression

🚀 **Try it live: [xpatch-webdemo.vercel.app](https://xpatch-webdemo.vercel.app/)** | [Check it out on my website](https://oseifert.ch/projects/xpatch-webdemo-1133)

## Development

Requires [Bun](https://bun.sh) to run locally.

```bash
bun install
bun run dev
```
