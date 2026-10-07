# Omaha

A daily football puzzle. Each day recreates one game-deciding play from last week's NFL action. You are the offensive coordinator: read the defense, design one pass play, snap it, and find out whether you out-coached the pros.

The name comes from Peyton Manning's audible call at the line.

## Status

Pre-MVP. The visual design is done and lives in [design/](design/README.md). The app is a fresh Vite + React + TypeScript scaffold; build work follows the queue in [design/TASKS.md](design/TASKS.md).

## Getting started

Requires Node and [pnpm](https://pnpm.io).

```sh
pnpm install
pnpm dev
```

| Command          | What it does                     |
| ---------------- | -------------------------------- |
| `pnpm dev`       | Start the Vite dev server        |
| `pnpm build`     | Type-check and build to `dist/`  |
| `pnpm preview`   | Serve the production build       |
| `pnpm lint`      | Lint with oxlint                 |
| `pnpm fmt`       | Format with oxfmt                |
| `pnpm fmt:check` | Check formatting without writing |

## Stack

TypeScript, React and SVG, with no game engine. React renders menus, briefing and result screens; SVG renders and animates the field. Planned: static hosting with one JSON file per daily puzzle, an anonymous results API on Cloudflare (Worker + D1), and a PWA install.

## Docs

| File                                 | What's in it                                        |
| ------------------------------------ | --------------------------------------------------- |
| [PRODUCT.md](PRODUCT.md)             | Users, positioning, MVP scope and game rules        |
| [GAME_CONCEPT.md](GAME_CONCEPT.md)   | Concept, design pillars, style and risks            |
| [design/README.md](design/README.md) | Screen index, flow and settled design decisions     |
| [design/DESIGN.md](design/DESIGN.md) | Design tokens, type, components and field-art rules |
| [design/TASKS.md](design/TASKS.md)   | Front-end implementation queue                      |
| [AGENTS.md](AGENTS.md)               | Instructions for coding agents                      |
